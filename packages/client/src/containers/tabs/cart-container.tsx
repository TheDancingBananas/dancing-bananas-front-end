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
import pngArrowLeft from 'styles/images/left.png';
import pngBanana1 from 'styles/images/banana-1.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngETH from 'styles/images/eth.png';
import pngChevronDown from 'styles/images/chevron-down.png';

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

const ETH_ID = config.ethAddress;

const CartContainer = ({
    gasPrices,
    cartData,
    onBack,
    onAddSuccess,
    onStatus,
}: {
    gasPrices: EthGasPrices | null;
    cartData: LiquidityBasketData[];
    onBack: () => void;
    onAddSuccess: () => void;
    onStatus: (status: boolean) => void;
}): JSX.Element | null => {
    // console.log('cart', cartData);
    const [viewId, setViewId] = useState<string>('');

    const { wallet } = useWallet();

    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    let currentGasPrice: number | null = null;
    if (gasPrices) {
        currentGasPrice = gasPrices.fast;
    }

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

    const handleAddLiquidity = async () => {
        if (!provider || !currentGasPrice) {
            return;
        }

        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

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

                const minLiquidity = '1';

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
                    minLiquidity, // amount0Desired
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
                        if (new BigNumber(baseTokenAmount).lt(tokenAllowance))
                            continue;
                    }

                    // Call the contract and sign
                    let approvalEstimate: ethers.BigNumber;

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
                        // handleGasEstimationError(err, {
                        //     type: 'approve',
                        //     account: wallet.account,
                        //     token: tokenInputState[tokenSymbol].id,
                        //     target: addLiquidityContractAddress,
                        //     amount: baseApproveAmount,
                        //     gasPrice: baseGasPrice,
                        // });
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
                    } catch (e) {
                        continue;
                    }

                    // setApprovalState('pending');
                    if (approveHash) {
                        onStatus(true);
                        await provider.waitForTransaction(approveHash);
                        onStatus(false);
                    }
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

                const mintParams = [
                    data.token0Address, // token0
                    data.token1Address, // token1
                    data.feeTier, // feeTier
                    data.bounds.position.tickLower, // tickLower
                    data.bounds.position.tickUpper, // tickUpper
                    mintAmount0, // amount0Desired
                    mintAmount1, // amount1Desired
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
                        if (new BigNumber(baseTokenAmount).lt(tokenAllowance))
                            continue;
                    }

                    // Call the contract and sign
                    let approvalEstimate: ethers.BigNumber;

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
                        // handleGasEstimationError(err, {
                        //     type: 'approve',
                        //     account: wallet.account,
                        //     to: tokenInputState[tokenSymbol].id,
                        //     target: addLiquidityContractAddress,
                        //     amount: baseApproveAmount,
                        //     gasPrice: baseGasPrice,
                        // });
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
                    } catch (e) {
                        continue;
                    }

                    // setApprovalState('pending');
                    if (approveHash) {
                        onStatus(true);
                        await provider.waitForTransaction(approveHash);
                        onStatus(false);
                    }
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
                onStatus(true);
                if (provider) {
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
        }

        // cartData[0].func();
    };

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
                </div>
            </div>
        );
    }
    return (
        <div className='cart-container'>
            <div className='cart-container-head'>
                <img
                    className='back-image'
                    src={pngArrowLeft}
                    onClick={(e) => onBack()}
                />
                <img className='head-image' src={pngBananaBasket} />
            </div>
            <div className='cart-container-card'>
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
                    {cartData.map((item: LiquidityBasketData) => {
                        return (
                            <>
                                <div
                                    className='cart-table-row'
                                    key={`cart-item-${item.poolId}`}
                                >
                                    <div className='cart-table-col left'>
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
                                                (Number(item.volumeUSD) / 100) *
                                                    0.1,
                                            )}
                                        </span>
                                        <img
                                            src={pngChevronDown}
                                            className='show-cart-item-detail'
                                            onClick={(e) =>
                                                handleClickMoreDetails(
                                                    item.poolId,
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <div
                                    className={classNames(
                                        'cart-table-row-details',
                                        { hide: item.poolId !== viewId },
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
                                                {item.lToken0Name === 'ETH' && (
                                                    <img src={pngETH} />
                                                )}
                                                {item.lToken0Name !== 'ETH' &&
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
                                            <button onClick={(e) => onBack()}>
                                                EDIT
                                            </button>
                                        </div>
                                    </div>
                                    <div className='row-detail-foot'>
                                        <span className='dark'>SENTIMENT:</span>
                                        {` `}
                                        <span className='white'>NEUTRAL</span>
                                    </div>
                                </div>
                            </>
                        );
                    })}
                </div>
                <div className='caption white'>REWARDS</div>
                <div className='cart-reward-wrapper'>
                    <div className='cart-award'>
                        <div className='cart-award-item'>
                            <div className='cart-award-title'>
                                NANAS AWARDED
                            </div>
                            <div className='cart-award-description'>
                                +15
                                <img src={pngDancingBanana} />
                            </div>
                        </div>
                        <div className='cart-award-item'>
                            <div className='cart-award-title'>LOGIN BONUS</div>
                            <div className='cart-award-description'>
                                +1
                                <img src={pngDancingBanana} />
                            </div>
                        </div>
                        <hr />
                        <div className='cart-award-item'>
                            <div className='cart-award-title pink'>TOTAL</div>
                            <div className='cart-award-description pink'>
                                +16
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
                        MOVE BANANAS
                        <img src={pngBanana1} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartContainer;
