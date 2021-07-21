import { useState, useEffect } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';
import { LiquidityBasketData } from 'types/states';
import { useWallet } from 'hooks/use-wallet';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import { LiquidityContainer } from 'containers/liquidity-container';
import { Box } from '@material-ui/core';

// import { usePositionManagers } from 'hooks/data-fetchers/use-position-managers';

import classNames from 'classnames';
import {
    IconHome,
    IconReward,
    IconSearch,
    IconCart,
    IconShop,
    IconDollar,
} from 'components/icon';

import ShopContainer from './tabs/shop-container';
import CartContainer from './tabs/cart-container';
import TaskContainer from './tabs/task-container';
import SuccessContainer from './tabs/success-container';
import PositionManagerContainer from './tabs/position-manager-container';
import PositionDetailContainer from './tabs/position-detail-container';

import pngWait from 'styles/images/wait.png';
import { storage } from 'util/localStorage';

import { V3PositionData } from '@sommelier/shared-types/src/api';

function LandingContainer({
    setShowConnectWallet,
    gasPrices,
}: {
    setShowConnectWallet: (wallet: boolean) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const { wallet } = useWallet();

    const [tab, setTab] = useState<string>('home');
    const [currentPoolId, setCurrentPoolId] = useState<string>('');
    const [basketData, setBasketData] = useState<LiquidityBasketData[]>([]);

    const [pendingTransaction, setPendingTransaction] = useState(false);

    // const positionList = usePositionManagers();

    const getRandomPool = async (oldPool: string | null) => {
        const shouldRefresh = storage.shouldRefreshPool();

        const networkName = 'mainnet';
        // const networkName = 'rinkeby';

        if (currentPoolId === '' || shouldRefresh) {
            console.log('old pool id', oldPool);
            const response = await fetch(
                `/api/v1/${networkName}/randomPool?count=${50}&old=${
                    oldPool ? oldPool : '000'
                }`,
            );
            if (!response.ok) throw new Error(`Failed to fetch top pools`);

            const data = await (response.json() as Promise<string>);
            // const data = '0x6c6bc977e13df9b0de53b251522280bb72383700';
            // 0x7858e59e0c01ea06df3af3d20ac7b0003275d4bf usdc usdt
            // 0x69d91b94f0aaf8e8a2586909fa77a5c2c89818d5 hex usdc
            console.log('new Id', data);
            setCurrentPoolId(data);
            storage.setCurrentPoolId(data);
        }
    };

    useEffect(() => {
        const oldPooldId = storage.getCurrentPoolId();
        console.log('oldPoolId', oldPooldId);

        getRandomPool(oldPooldId);
    }, [currentPoolId]);

    const handleRefreshPool = () => {
        console.log('handle refresh');
        setCurrentPoolId('');
    };

    useEffect(() => {
        const oldPooldId = storage.getCurrentPoolId();
        console.log('oldPoolId', oldPooldId);

        getRandomPool(oldPooldId);
    }, [currentPoolId]);

    const showWalletModal = () => setShowConnectWallet(true);

    useEffect(() => {
        try {
            mixpanel.track('pageview:landing', {});
        } catch (e) {
            console.error(`Metrics error on add positions:landing.`);
        }
    }, []);

    useEffect(() => {
        try {
            if (
                !(
                    location.hostname === 'localhost' ||
                    location.hostname === '127.0.0.1'
                )
            ) {
                if (location.protocol !== 'https:') {
                    location.protocol = 'https:';
                }
            }
        } catch (e) {
            console.error(`unable to redirect`);
        }
    }, []);

    const handleAddBasket = (
        data: LiquidityBasketData,
        navigateToBasket: boolean,
    ) => {
        const findIndex = basketData.findIndex(
            (item) =>
                item.poolId === data.poolId &&
                item.actionType === data.actionType,
        );

        if (findIndex < 0) {
            basketData.push(data);
        } else {
            basketData[findIndex] = {
                ...data,
            };
        }

        setBasketData([...basketData]);
        if (navigateToBasket) {
            setTab('cart');
        }
    };

    const handleTransactionSuccess = () => {
        setTab('transactionSuccess');
    };

    const handleChangePendingStatus = (status: boolean) => {
        setPendingTransaction(status);
    };

    useEffect(() => {
        console.log(basketData);
    }, [basketData]);

    return (
        <div>
            <div className='main-header-container'>
                <div className='wallet-combo'>
                    {<ConnectWalletButton onClick={showWalletModal} />}
                </div>
            </div>
            {pendingTransaction && (
                <div className='pending-transaction-board'>
                    <img src={pngWait} className='pending-transaction-image' />
                    <p className='pending-transaction-text'>
                        YOUR TRANSACTION IS BEING CONFIRMED
                        <br />
                        ESTIMATED DURATION:{' '}
                        <span style={{ color: '#FFDF00' }}>2 MINS</span>
                    </p>
                </div>
            )}
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='space-around'
                className='main-content-container'
            >
                {tab === 'home' && currentPoolId !== '' && (
                    <LiquidityContainer
                        gasPrices={gasPrices}
                        poolId={currentPoolId}
                        onRefreshPool={() => handleRefreshPool()}
                        handleWalletConnect={() => showWalletModal()}
                        onAddBasket={(
                            data: LiquidityBasketData,
                            navigateToBasket: boolean,
                        ) => handleAddBasket(data, navigateToBasket)}
                        onAddSuccess={() => handleTransactionSuccess()}
                        onStatus={(status: boolean) =>
                            handleChangePendingStatus(status)
                        }
                    />
                )}
                {tab === 'task' && (
                    <TaskContainer
                        onBack={() => {
                            setTab('home');
                        }}
                    />
                )}
                {tab === 'transactionSuccess' && (
                    <SuccessContainer
                        onBack={() => {
                            setTab('home');
                        }}
                    />
                )}
                {tab === 'shop' && <ShopContainer />}
                {tab === 'cart' && (
                    <CartContainer
                        gasPrices={gasPrices}
                        cartData={basketData}
                        onBack={() => {
                            setTab('home');
                        }}
                        onAddSuccess={() => handleTransactionSuccess()}
                        onStatus={(status: boolean) =>
                            handleChangePendingStatus(status)
                        }
                    />
                )}
                {tab === 'positionManager' && (
                    <PositionManagerContainer
                        onBack={() => {
                            setTab('home');
                        }}
                        onSelectPosition={() => {
                            setTab('positionDetail');
                        }}
                    />
                )}
                {tab === 'positionDetail' && (
                    <PositionDetailContainer
                        onBack={() => {
                            setTab('positionManager');
                        }}
                    />
                )}
            </Box>
            <Box
                display='flex'
                alignItems='center'
                className='footer-tab-container'
            >
                <div className='footer-wrapper'>
                    <div
                        className={classNames('footer-tab', {
                            active: tab === 'home',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('home');
                        }}
                    >
                        <IconHome fill={tab === 'home' ? '#000' : '#808080'} />
                    </div>
                    <div
                        className={classNames('footer-tab', {
                            active: tab === 'task',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('task');
                        }}
                    >
                        <IconSearch
                            fill={tab === 'task' ? '#000' : '#808080'}
                        />
                    </div>
                    {/* <div
                        className={classNames('footer-tab', {
                            active:
                                tab === 'positionManager' ||
                                tab === 'positionDetail',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('positionManager');
                        }}
                    >
                        <IconDollar
                            fill={
                                tab === 'positionManager' ||
                                tab === 'positionDetail'
                                    ? '#000'
                                    : '#808080'
                            }
                        />
                    </div> */}
                    <div
                        className={classNames('footer-tab', {
                            active: tab === 'shop',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('shop');
                        }}
                    >
                        <IconShop fill={tab === 'shop' ? '#000' : '#808080'} />
                    </div>
                    <div
                        className={classNames('footer-tab', {
                            active: tab === 'cart',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('cart');
                        }}
                    >
                        <IconCart fill={tab === 'cart' ? '#000' : '#808080'} />
                        {basketData.length > 0 && (
                            <div className='basket-count'>
                                {basketData.length}
                            </div>
                        )}
                    </div>
                </div>
            </Box>
        </div>
    );
}

export default LandingContainer;
