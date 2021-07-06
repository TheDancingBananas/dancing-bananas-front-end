/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { LiquidityBasketData } from '@sommelier/shared-types';
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

import config from 'config/app';
import { useWallet } from 'hooks/use-wallet';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

import addLiquidityAbi from 'constants/abis/uniswap_v3_add_liquidity.json';
import batchLiquidityAbi from 'constants/abis/uniswap_v3_batch_liquidity.json';

const ETH_ID = config.ethAddress;

const CartContainer = ({
    cartData,
    onBack,
}: {
    cartData: LiquidityBasketData[];
    onBack: () => void;
}): JSX.Element | null => {
    console.log(cartData);
    const [viewId, setViewId] = useState<string>('');

    const { wallet } = useWallet();

    let provider: ethers.providers.Web3Provider | null = null;

    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    const handleClickMoreDetails = (poolId: string) => {
        if (viewId === poolId) {
            setViewId('');
        } else {
            setViewId(poolId);
        }
    };

    const handleAddLiquidity = () => {
        if (!provider) {
            return;
        }

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
        const addLiquidityContract = new ethers.Contract(
            addLiquidityContractAddress,
            addLiquidityAbi,
            signer,
        );

        for (let i = 0; i < cartData.length; i++) {
            const data = cartData[i];

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

                // const mintAmount0 = ethers.utils
                //     .parseUnits(
                //         new BigNumber(
                //             tokenInputState[pool.token0.symbol].amount,
                //         ).toFixed(parseInt(pool.token0.decimals)),
                //         pool.token0.decimals,
                //     )
                //     .toString();
                // const mintAmount1 = ethers.utils
                //     .parseUnits(
                //         new BigNumber(
                //             tokenInputState[pool.token1.symbol].amount,
                //         ).toFixed(parseInt(pool.token1.decimals)),
                //         pool.token1.decimals,
                //     )
                //     .toString();

                const minLiquidity = '1';
            }

            const isEthAdd =
                data.lToken0Name === 'ETH' ||
                (data.lToken1Name && data.lToken1Name === 'ETH');

            const fnName = isEthAdd
                ? 'addLiquidityEthForUniV3'
                : 'addLiquidityForUniV3';
        }

        cartData[0].func();
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
                    {cartData.map((item) => {
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
