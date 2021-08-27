/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import {
    WalletBalances,
    BoundsState,
    TokenInputAmount,
    LiquidityBasketData,
} from 'types/states';
import { EthGasPrices } from '@sommelier/shared-types';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import './cart-container.scss';

import pngBananaBasket from 'styles/images/banana-basket.png';
import pngEmptyBasket from 'styles/images/empty-basket.png';
import pngNANA from 'styles/images/tokens/nana.png';
import pngExit from 'styles/images/exit.png';
import pngArrowLeft from 'styles/images/left.png';
import pngBanana1 from 'styles/images/banana-1.png';
import pngBanana2 from 'styles/images/banana-2.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngETH from 'styles/images/eth.png';
import pngChevronDown from 'styles/images/chevron-down.png';
import pngDelete from 'styles/images/delete.png';
import pngEditWhite from 'styles/images/edit-white.png';
import pngEditBlack from 'styles/images/edit-black.png';
import pngX from 'styles/images/X-121.png';

import gameData from 'constants/gameData.json';
import { storage } from 'util/localStorage';
import { Level, Reward, RewardItem } from 'types/game';

import { useEthGasPrices } from 'hooks';
import { getGasPriceFromInfura } from 'services/infura-json-rpc';

import {
    FeeAmount,
    Pool,
    Position,
    priceToClosestTick,
    tickToPrice,
    TickMath,
} from '@uniswap/v3-sdk';

import config from 'config/app';
import { useWallet } from 'hooks/use-wallet';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { toastSuccess, toastWarn, toastError } from 'util/toasters';
import Sentry, { SentryError } from 'util/sentry';

import addLiquidityAbi from 'constants/abis/uniswap_v3_add_liquidity_2.json';
import batchLiquidityAbi from 'constants/abis/uniswap_v3_batch_liquidity.json';
import erc20Abi from 'constants/abis/erc20.json';

import { getEstimateTime } from 'services/api-etherscan';

const ETH_ID = config.ethAddress;

const CartContainer = ({
    gasPrices,
    cartData,
    onBack,
    onAddSuccess,
    onStatus,
    onEdit,
    onRemove,
}: {
    gasPrices: EthGasPrices | null;
    cartData: LiquidityBasketData[];
    onBack: () => void;
    onAddSuccess: () => void;
    onStatus: (status: boolean, time?: number) => void;
    onEdit: (poolId: string) => void;
    onRemove: (i: number) => void;
}): JSX.Element | null => {
    // console.log('cart', cartData);
    const [viewId, setViewId] = useState<string>('');

    const { wallet } = useWallet();

    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    const getGasPrice = async (): Promise<string> => {
        const gas = Number(await getGasPriceFromInfura()) + 10;
        console.log('gas price from infra: ', gas);
        return gas.toString();
    };

    const handleClickMoreDetails = (poolId: string) => {
        if (viewId === poolId) {
            setViewId('');
        } else {
            setViewId(poolId);
        }
    };

    const handleGasEstimationError = (
        err: Error,
        payload: Record<string, any> = {},
    ): undefined => {
        // We could not estimate gas, for whaever reason, so we should not let the transaction continue.
        const notEnoughETH =
            err.message.match(/exceeds allowance/) ||
            err.message.match(/insufficient funds/);
        let toastMsg =
            'Could not estimate gas for this transaction. Check your parameters or try a different pool.';

        if (notEnoughETH) {
            toastMsg =
                'Not enough ETH to pay gas for this transaction. If you are using ETH, try reducing the entry amount.';
        }

        toastError(toastMsg);

        // Send event to sentry
        const sentryErr = new SentryError(
            `Could not estimate gas: ${err.message}`,
            payload,
        );
        Sentry.captureException(sentryErr);

        return;
    };

    const handleAllowanceError = (
        poolName: string,
        symbol: string,
        allowanceAmount: string,
        amount: string,
    ): undefined => {
        // We could not estimate gas, for whaever reason, so we should not let the transaction continue.

        const toastMsg = `In the ${poolName} pool,${symbol} token's amount(${amount}) is less than allowed amount(${allowanceAmount})`;

        toastError(toastMsg);

        return;
    };

    const handleLiquidityError = (poolName: string): undefined => {
        // We could not calculate minLiquidity.

        const toastMsg = `The liquidity amount is not enough in the ${poolName} pool. Please arrange the amount.`;

        toastError(toastMsg);

        return;
    };

    const handleUserRejectError = (
        poolName: string,
        tokenSymbol: string,
        err: Error,
    ): undefined => {
        // The user rejected transaction.

        const toastMsg = `The user rejected the transaction for the ${tokenSymbol} in the ${poolName} pool.`;

        toastError(toastMsg);

        return;
    };

    const handleTransactionFailError = (): undefined => {
        const toastMsg = `Your transaction failed due to insufficient ETH balance in your wallet. Please add more ETH and try again.`;

        toastError(toastMsg);

        return;
    };
    const handleAddLiquidity = async () => {
        if (!provider) {
            return;
        }

        let status = 'none';
        // const gasPrice = await getGasPrice();
        // const baseGasPrice = ethers.utils
        //     .parseUnits(gasPrice.high.toString(), 9)
        //     .toString();

        const batchLiquidityContractAddress =
            config.networks[wallet.network || '1']?.contracts
                ?.BATCH_LIQUIDITY_V3;

        if (!batchLiquidityContractAddress) {
            throw new Error(
                'Add liquidity contract not available on this network.',
            );
        }

        const addLiquidityContractAddress =
            config.networks[wallet.network || '1']?.contracts?.ADD_LIQUIDITY_V3;

        if (!addLiquidityContractAddress) {
            throw new Error(
                'Add liquidity contract not available on this network.',
            );
        }

        // Create signer
        const signer = provider.getSigner();

        // let txFee : ethers.BigNumber = ethers.BigNumber.from(0);

        // Create read-write contract instance
        const batchLiquidityContract = new ethers.Contract(
            batchLiquidityContractAddress,
            batchLiquidityAbi,
            signer,
        );
        // const addLiquidityContract = new ethers.Contract(
        //     addLiquidityContractAddress,
        //     addLiquidityAbi,
        //     signer,
        // );

        const addLiquidityInterface = new ethers.utils.Interface(
            addLiquidityAbi,
        );

        let baseMsgValue = ethers.utils.parseEther('0.005');
        const batchParams = [];

        for (let i = 0; i < cartData.length; i++) {
            const data = cartData[i];

            if (!data.bounds.position) {
                continue;
            }

            if (data.isOneSide) {
                status = 'starting';
                const selectedToken = data.lToken0Name;
                const tokenData = {
                    id: data.lToken0Address,
                    amount: data.lToken0Amount,
                };

                const tokenId = 0;
                let decimals = 18;

                if (selectedToken === data.token0Name) {
                    decimals = parseInt(data.token0Decimal, 10);
                } else if (selectedToken === data.token1Name) {
                    decimals = parseInt(data.token1Decimal, 10);
                }

                const mintAmountOneSide = ethers.utils
                    .parseUnits(
                        new BigNumber(tokenData.amount).toFixed(decimals),
                        decimals,
                    )
                    .toString();

                const mintAmount0 = data.token0Amount;
                const mintAmount1 = data.token1Amount;

                const liquidity = new BigNumber(
                    data.bounds.position.liquidity.toString(),
                )
                    .exponentiatedBy(2)
                    .div(2)
                    .sqrt();

                if (liquidity.isZero()) {
                    handleLiquidityError(data.poolName);
                    continue;
                }
                const minLiquidity = liquidity.times(0.98).toFixed(0);

                const sqrtPriceAX96 = TickMath.getSqrtRatioAtTick(
                    data.bounds.position.tickLower,
                );
                const sqrtPriceBX96 = TickMath.getSqrtRatioAtTick(
                    data.bounds.position.tickUpper,
                );

                const mintParams = [
                    data.token0Address, // token0
                    data.token1Address, // token1
                    data.feeTier, // feeTier
                    data.bounds.position.tickLower, // tickLower
                    data.bounds.position.tickUpper, // tickUpper
                    sqrtPriceAX96.toString(),
                    sqrtPriceBX96.toString(),
                    data.minliquidity, // amount0Desired
                    wallet.account, // recipient
                    Math.floor(Date.now() / 1000) + 86400000, // deadline
                ];

                console.log(
                    'MINT PARAMS',
                    mintAmountOneSide,
                    tokenData.id,
                    mintParams,
                );

                for (const tokenSymbol of [data.token0Name, data.token1Name]) {
                    const tokenAddress =
                        tokenSymbol === data.token0Name
                            ? data.token0Address
                            : data.token1Address;

                    const erc20Contract = new ethers.Contract(
                        tokenAddress,
                        erc20Abi,
                        signer,
                    );

                    const amountDesired =
                        tokenSymbol === data.token0Name
                            ? mintAmount0
                            : mintAmount1;

                    // const baseApproveAmount = new BigNumber(amountDesired)
                    //     .times(100)
                    //     .toFixed();
                    const baseApproveAmount =
                        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

                    // const tokenAmount = new BigNumber(amountDesired);

                    if (data.balances?.[tokenSymbol]) {
                        const baseTokenAmount = ethers.utils.formatUnits(
                            amountDesired,
                            data.balances?.[tokenSymbol]?.decimals,
                        );

                        const tokenAllowance = ethers.utils.formatUnits(
                            data.balances?.[tokenSymbol]?.allowance?.[
                                addLiquidityContractAddress
                            ],
                            data.balances?.[tokenSymbol]?.decimals,
                        );

                        // skip approval on allowance
                        // if (new BigNumber(baseTokenAmount).lt(tokenAllowance)) {
                        //     handleAllowanceError(
                        //         data.poolName,
                        //         tokenSymbol,
                        //         new BigNumber(tokenAllowance).toFixed(2),
                        //         new BigNumber(baseTokenAmount).toFixed(2),
                        //     );
                        //     continue;
                        // }
                    }

                    // Call the contract and sign
                    let approvalEstimate: ethers.BigNumber;

                    // Get gas price

                    const gasprice = await getGasPrice();

                    const baseGasPrice = ethers.utils
                        .parseUnits(gasprice, 9)
                        .toString();
                    console.log('baseGasPrice: ', baseGasPrice);
                    try {
                        approvalEstimate = await erc20Contract.estimateGas.approve(
                            batchLiquidityContractAddress,
                            baseApproveAmount,
                            { gasPrice: baseGasPrice },
                        );

                        // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
                        approvalEstimate = approvalEstimate.add(
                            approvalEstimate.div(3),
                        );
                    } catch (err) {
                        handleGasEstimationError(err, {
                            type: 'approve',
                            account: wallet.account,
                            token: tokenSymbol,
                            target: addLiquidityContractAddress,
                            amount: baseApproveAmount,
                            gasPrice: baseGasPrice,
                        });
                        continue;
                    }

                    // Approve the add liquidity contract to spend entry tokens

                    let approveHash: string | undefined;
                    try {
                        const { hash } = await erc20Contract.approve(
                            batchLiquidityContractAddress,
                            baseApproveAmount,
                            {
                                gasPrice: baseGasPrice,
                                gasLimit: approvalEstimate,
                            },
                        );
                        approveHash = hash;
                    } catch (err) {
                        handleUserRejectError(data.poolName, tokenSymbol, err);
                        continue;
                    }

                    // setApprovalState('pending');
                    if (approveHash) {
                        const estimateTime = await getEstimateTime(
                            provider,
                            approveHash,
                            baseGasPrice,
                        );
                        //txFee = txFee.add(approvalEstimate.mul(baseGasPrice));
                        onStatus(true, estimateTime);
                        await provider.waitForTransaction(approveHash);
                        onStatus(false);
                    }
                    status = 'pending';
                }

                if (status === 'starting') {
                    continue;
                }

                if (
                    data.lToken0Name === 'ETH' ||
                    (data.lToken1Name && data.lToken1Name === 'ETH')
                ) {
                    const ethAmount = ethers.utils.parseEther(
                        new BigNumber(data.ethAmount).toFixed(18),
                    );
                    baseMsgValue = baseMsgValue.add(ethAmount);
                }

                console.log('one side params------------------');
                console.log('tokenId', tokenId);
                console.log('tokenData id', tokenData.id);
                console.log('mintAmoountOneSide', mintAmountOneSide);
                console.log('mint params', mintParams);

                const encodedABI = addLiquidityInterface.encodeFunctionData(
                    'investTokenForUniPair',
                    [tokenId, tokenData.id, mintAmountOneSide, mintParams],
                );

                batchParams.push(encodedABI);
            }

            // Two side token
            if (!data.isOneSide) {
                status = 'starting';
                const isEthAdd =
                    data.lToken0Name === 'ETH' ||
                    (data.lToken1Name && data.lToken1Name === 'ETH');

                const fnName = isEthAdd
                    ? 'addLiquidityEthForUniV3'
                    : 'addLiquidityForUniV3';

                const symbol0 = data.token0Name;
                const symbol1 = data.token1Name;

                const tokenId = 0;

                const mintAmount0 = ethers.utils
                    .parseUnits(
                        new BigNumber(data.token0Amount).toFixed(
                            parseInt(data.token0Decimal),
                        ),
                        data.token0Decimal,
                    )
                    .toString();

                const mintAmount1 = ethers.utils
                    .parseUnits(
                        new BigNumber(data.token1Amount).toFixed(
                            parseInt(data.token1Decimal),
                        ),
                        data.token1Decimal,
                    )
                    .toString();

                const baseAmount0Min = new BigNumber(mintAmount0)
                    .times(0.98)
                    .toFixed(0);
                const baseAmount1Min = new BigNumber(mintAmount1)
                    .times(0.98)
                    .toFixed(0);

                const mintParams = [
                    data.token0Address, // token0
                    data.token1Address, // token1
                    data.feeTier, // feeTier
                    data.bounds.position.tickLower, // tickLower
                    data.bounds.position.tickUpper, // tickUpper
                    baseAmount0Min, // amount0Desired
                    baseAmount1Min, // amount1Desired
                    0,
                    0,
                    wallet.account, // recipient
                    Math.floor(Date.now() / 1000) + 86400000, // deadline
                ];

                for (const tokenSymbol of [data.token0Name, data.token1Name]) {
                    // IF WETH, check if ETH is selected - if not, approve WETH
                    // IF NOT WETH, approve
                    const tokenAddress =
                        tokenSymbol === data.token0Name
                            ? data.token0Address
                            : data.token1Address;

                    if (tokenSymbol === 'WETH') {
                        if (
                            data.lToken0Name === 'ETH' ||
                            (data.lToken1Name && data.lToken1Name === 'ETH')
                        ) {
                            continue;
                        }
                    }

                    const erc20Contract = new ethers.Contract(
                        tokenAddress,
                        erc20Abi,
                        signer,
                    );

                    const amountDesired =
                        tokenSymbol === data.token0Name
                            ? mintAmount0
                            : mintAmount1;

                    // const baseApproveAmount = new BigNumber(amountDesired)
                    //     .times(100)
                    //     .toFixed();
                    const baseApproveAmount =
                        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

                    const tokenAmount = new BigNumber(amountDesired);

                    if (data.balances[tokenSymbol]) {
                        const baseTokenAmount = ethers.utils.formatUnits(
                            amountDesired,
                            data.balances[tokenSymbol]?.decimals,
                        );

                        const tokenAllowance = ethers.utils.formatUnits(
                            data.balances[tokenSymbol]?.allowance?.[
                                addLiquidityContractAddress
                            ],
                            data.balances[tokenSymbol]?.decimals,
                        );

                        // skip approval on allowance
                        // if (new BigNumber(baseTokenAmount).lt(tokenAllowance)) {
                        //     handleAllowanceError(
                        //         data.poolName,
                        //         tokenSymbol,
                        //         new BigNumber(tokenAllowance).toFixed(2),
                        //         new BigNumber(baseTokenAmount).toFixed(2),
                        //     );
                        //     continue;
                        // }
                    }

                    // Call the contract and sign
                    let approvalEstimate: ethers.BigNumber;

                    // Get gas price

                    const gasprice = await getGasPrice();

                    const baseGasPrice = ethers.utils
                        .parseUnits(gasprice, 9)
                        .toString();

                    try {
                        approvalEstimate = await erc20Contract.estimateGas.approve(
                            batchLiquidityContractAddress,
                            baseApproveAmount,
                            { gasPrice: baseGasPrice },
                        );

                        // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
                        approvalEstimate = approvalEstimate.add(
                            approvalEstimate.div(3),
                        );
                    } catch (err) {
                        handleGasEstimationError(err, {
                            type: 'approve',
                            account: wallet.account,
                            to: tokenSymbol,
                            target: addLiquidityContractAddress,
                            amount: baseApproveAmount,
                            gasPrice: baseGasPrice,
                        });
                        continue;
                    }

                    // Approve the add liquidity contract to spend entry tokens
                    let approveHash: string | undefined;
                    try {
                        const { hash } = await erc20Contract.approve(
                            batchLiquidityContractAddress,
                            baseApproveAmount,
                            {
                                gasPrice: baseGasPrice,
                                gasLimit: approvalEstimate,
                            },
                        );
                        approveHash = hash;
                    } catch (err) {
                        handleUserRejectError(data.poolName, tokenSymbol, err);
                        continue;
                    }

                    // setApprovalState('pending');
                    if (approveHash) {
                        const estimateTime = await getEstimateTime(
                            provider,
                            approveHash,
                            baseGasPrice,
                        );
                        //txFee = txFee.add(approvalEstimate.mul(baseGasPrice));
                        onStatus(true, estimateTime);
                        await provider.waitForTransaction(approveHash);
                        onStatus(false);
                    }
                    status = 'pending';
                }

                if (status === 'starting') {
                    continue;
                }

                if (
                    data.lToken0Name === 'ETH' ||
                    (data.lToken1Name && data.lToken1Name === 'ETH')
                ) {
                    const ethAmount = ethers.utils.parseEther(
                        new BigNumber(data.ethAmount).toFixed(18),
                    );
                    baseMsgValue = baseMsgValue.add(ethAmount);
                }

                console.log('params------------------');
                console.log('fnName', fnName);
                console.log('tokenId', tokenId);
                console.log(mintParams);
                const encodedABI = addLiquidityInterface.encodeFunctionData(
                    fnName,
                    [tokenId, mintParams],
                );

                batchParams.push(encodedABI);
            }
        }

        const value = baseMsgValue.toString();
        console.log('totalEth', value);

        // Get gas price

        const gasprice = await getGasPrice();

        const baseGasPrice = ethers.utils.parseUnits(gasprice, 9).toString();

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;
        console.log(batchLiquidityContract);
        console.log('batch', batchParams.join(''));
        try {
            gasEstimate = await batchLiquidityContract.estimateGas['batchRun'](
                batchParams.join(''),
                {
                    gasPrice: baseGasPrice,
                    value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
                },
            );

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(2));

            const { hash } = await batchLiquidityContract['batchRun'](
                batchParams.join(''),
                {
                    gasPrice: baseGasPrice,
                    gasLimit: gasEstimate,
                    value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
                },
            );

            if (hash) {
                if (provider) {
                    const estimateTime = await getEstimateTime(
                        provider,
                        hash,
                        baseGasPrice,
                    );
                    onStatus(true, estimateTime);

                    const txStatus: ethers.providers.TransactionReceipt = await provider.waitForTransaction(
                        hash,
                    );

                    const { status } = txStatus;
                    onStatus(false);
                    if (status === 1) {
                        onAddSuccess();
                    }
                }
            }
        } catch (err) {
            console.log(err);
            handleTransactionFailError();
        }

        // cartData[0].func();
    };

    const level = storage.getLevel();
    const gameLevels: Level[] = gameData.game;
    const bananaRewards: Reward = gameLevels[Number(level) - 1].bananarewards;
    const rewards = [];
    const onesides = [];
    const twosides = [];
    rewards.push(bananaRewards.daily);

    for (let i = 0; i < cartData.length; i++) {
        const data = cartData[i];
        if (data.isOneSide) {
            onesides.push(bananaRewards.onesided);
        } else {
            twosides.push(bananaRewards.twosided);
        }
    }

    if (onesides.length > 0) {
        const oneside = bananaRewards.onesided;
        const amount: number = oneside.amount * onesides.length;
        let label: string = bananaRewards.onesided.label;
        if (onesides.length > 1) {
            label =
                onesides.length.toString() +
                ' ' +
                bananaRewards.onesided.label.toString();
        }
        rewards.push({
            label: label,
            amount: amount,
        });
    }

    if (twosides.length > 0) {
        const twoside = bananaRewards.twosided;
        const amount: number = twoside.amount * twosides.length;
        let label: string = bananaRewards.twosided.label;
        if (twosides.length > 1) {
            label =
                twosides.length.toString() +
                ' ' +
                bananaRewards.twosided.label.toString();
        }
        rewards.push({
            label: label,
            amount: amount,
        });
    }

    const totalEther = cartData.reduce(
        (sum: number, data) => sum + Number(data.ethAmount),
        0,
    );
    if (totalEther >= 200) {
        rewards.push(bananaRewards.whale);
    } else if (totalEther >= 10) {
        rewards.push(bananaRewards.shark);
    } else if (totalEther >= 4) {
        rewards.push(bananaRewards.minnow);
    }

    if (cartData.length === 0) {
        return (
            <div className='cart-container'>
                <div className='cart-container-head'>
                    <img className='head-image' src={pngEmptyBasket} />
                </div>
                <div className='cart-container-empty-card'>
                    <p className='title'>BANANA BASKET</p>
                    <p
                        className='title'
                        style={{ paddingTop: 40, fontSize: 20 }}
                    >
                        OH NO!
                        <br />
                        EMPTY BASKET
                    </p>
                    <p className='sub-title' style={{ paddingTop: 10 }}>
                        ADD LIQUIDITY FROM A<br />
                        DANCING BANANA POOL TO FILL
                        <br />
                        YOUR BASKET
                    </p>
                    <img
                        className='close-image'
                        src={pngX}
                        onClick={(e) => onBack()}
                    />
                </div>
            </div>
        );
    }
    return (
        <div className='cart-container'>
            <div className='cart-container-head'>
                <img className='head-image' src={pngBananaBasket} />
            </div>
            <div className='cart-container-card'>
                <img
                    className='close-image'
                    src={pngX}
                    onClick={(e) => onBack()}
                />
                <h1 className='cart-title'>BANANA BASKET</h1>
                <div className='cart-table'>
                    <div className='cart-table-header'>
                        <div className='cart-header-col'>BANANA POOL</div>
                        <div className='cart-header-col'>MOVE TYPE</div>
                        <div
                            className='cart-header-col'
                            style={{ paddingRight: 40 }}
                        >
                            POOL FEES
                        </div>
                    </div>
                    {cartData.map(
                        (item: LiquidityBasketData, index: number) => {
                            return (
                                <div key={`cart-item-${index}`}>
                                    <div
                                        className='cart-table-row'
                                        key={`cart-item-${item.poolId}`}
                                    >
                                        <div className='cart-table-col left'>
                                            <div
                                                className='cart-token-exit-image'
                                                onClick={(e) => onRemove(index)}
                                            >
                                                <img src={pngDelete} />
                                            </div>
                                            <div
                                                className='cart-token-edit-image'
                                                onClick={(e) =>
                                                    onEdit(item.poolId)
                                                }
                                            >
                                                <img src={pngEditWhite} />
                                            </div>
                                            {!item.isNANA && (
                                                <div className='cart-token-image'>
                                                    {resolveLogo(
                                                        item.token0Address,
                                                    )}
                                                </div>
                                            )}
                                            {item.isNANA && (
                                                <div className='cart-token-image'>
                                                    <div>
                                                        <img src={pngNANA} />
                                                    </div>
                                                </div>
                                            )}
                                            {!item.isNANA && (
                                                <div className='cart-token-image'>
                                                    {resolveLogo(
                                                        item.token1Address,
                                                    )}
                                                </div>
                                            )}
                                            {item.isNANA && (
                                                <div className='cart-token-image'>
                                                    <img src={pngETH} />
                                                </div>
                                            )}
                                            <span className='cart-token-name'>{`${item.token0Name}/${item.token1Name}`}</span>
                                        </div>
                                        <div className='cart-table-col center'>
                                            <span className='cart-table-text2'>
                                                ADD
                                            </span>
                                        </div>
                                        <div className='cart-table-col right'>
                                            <span className='cart-table-text2'>
                                                {formatNumber(
                                                    (Number(item.volumeUSD) /
                                                        100) *
                                                        0.1,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className={classNames(
                                            'cart-table-row-details',
                                        )}
                                    >
                                        <div className='row-detail-head white'>
                                            TRANSACTION DETAILS
                                        </div>
                                        <div className='row-detail-body'>
                                            <div className='row-detail-left'>
                                                <span className='dark'>
                                                    TOKEN USED / AMOUHNT
                                                </span>
                                                <div className='row-detail-token'>
                                                    {item.lToken0Name ===
                                                        'ETH' && (
                                                        <img src={pngETH} />
                                                    )}
                                                    {item.lToken0Name !==
                                                        'ETH' &&
                                                        resolveLogo(
                                                            item.lToken0Address,
                                                        )}
                                                    <span className='white'>{`${item.lToken0Name} / `}</span>
                                                    <span className='green'>
                                                        {item.lToken0Amount}
                                                    </span>
                                                </div>
                                                {item.lToken1Name && (
                                                    <div className='row-detail-token'>
                                                        {item.lToken1Name ===
                                                            'ETH' && (
                                                            <img src={pngETH} />
                                                        )}
                                                        {item.lToken1Name !==
                                                            'ETH' &&
                                                            resolveLogo(
                                                                item.lToken1Address,
                                                            )}
                                                        <span className='white'>{`${item.lToken1Name} / `}</span>
                                                        <span className='green'>
                                                            {item.lToken1Amount}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className='row-detail-right'>
                                                <button
                                                    onClick={(e) =>
                                                        onEdit(item.poolId)
                                                    }
                                                >
                                                    EDIT
                                                    <img src={pngEditBlack} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className='row-detail-foot'>
                                            <span className='dark'>
                                                SENTIMENT:
                                            </span>
                                            {` `}
                                            <span className='white'>
                                                NEUTRAL
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        },
                    )}
                </div>
                <div className='caption white'>REWARDS</div>
                <div className='cart-reward-wrapper'>
                    <div className='cart-award'>
                        {rewards.map((reward, i) => {
                            return (
                                <div className='cart-award-item' key={i}>
                                    <div className='cart-award-title'>
                                        {reward.label}
                                    </div>
                                    <div className='cart-award-description'>
                                        +{reward.amount}
                                        <img src={pngDancingBanana} />
                                    </div>
                                </div>
                            );
                        })}
                        <hr />
                        <div className='cart-award-item'>
                            <div className='cart-award-title pink'>TOTAL</div>
                            <div className='cart-award-description pink'>
                                +
                                {rewards.reduce(
                                    (sum: number, current: RewardItem) =>
                                        sum + Number(current.amount),
                                    0,
                                )}
                                <img src={pngDancingBanana} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className='cart-action'>
                    <button
                        className='cart-action-move'
                        onClick={(e) => handleAddLiquidity()}
                    >
                        Complete Transaction
                        <img src={pngBanana2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartContainer;
