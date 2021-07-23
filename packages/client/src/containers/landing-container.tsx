import { useState, useEffect } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';
import { LiquidityBasketData } from 'types/states';
import { Tabs } from 'types/game';
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
import LevelUpContainer from './tabs/level-up-container';

import pngWait from 'styles/images/wait.png';
import gifLoading from 'styles/images/loading-animation.gif';
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
    const currentLevel = storage.getLevel();

    const [tab, setTab] = useState<Tabs>('home');
    const [currentPoolId, setCurrentPoolId] = useState<string>('');
    const [basketData, setBasketData] = useState<LiquidityBasketData[]>([]);

    const [pendingTransaction, setPendingTransaction] = useState(false);
    const [transactionEstimatedTime, setTransactionEstimatedTime] = useState('');
    const [transactionEstimatedTimeUnit, setTransactionEstimatedTimeUnit] = useState('');

    const [levelCompleteStatus, setLevelCompleteStatus] = useState<string>(
        storage.getTask(),
    );

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
        setLevelCompleteStatus('complete');
        storage.setTask('complete');
        setBasketData([]);
    };

    const handleChangePendingStatus = (status: boolean, time?: number) => {
        setPendingTransaction(status);

        let value = '', unit = '';
        if (time) {
            if (time > 0 && time < 60) {
                value = Math.floor(time).toString();
                unit = 'SECS';
            }
            else if (time < 3600) {
                value = Math.floor(time / 60).toString();
                unit = 'MINS';
            }
            else if (time < 24 * 3600) {
                value = Math.floor(time / 3600).toString();
                unit = 'HOURS';
            }
            else {
                value = '';
                unit = '';
            }
        }
        setTransactionEstimatedTime(value);
        setTransactionEstimatedTimeUnit(unit);
    };

    const handleChangeTab = (t: Tabs) => {
        if (currentLevel === '1' && basketData.length > 0) {
            if (t === 'home') {
                setTab('cart');
                return;
            }
        }
        setTab(t);
    };
    // useEffect(() => {
    //     console.log(basketData);
    // }, [basketData]);

    return (
        <div>
            <div className='main-header-container'>
                <div className='wallet-combo'>
                    {<ConnectWalletButton onClick={showWalletModal} />}
                </div>
            </div>
            {pendingTransaction && (
                <div className='pending-transaction-board'>
                    <img src={gifLoading} className='pending-transaction-image' />
                    <p className='pending-transaction-text'>
                        YOUR TRANSACTION IS BEING CONFIRMED
                        <br />
                        ESTIMATED DURATION: 
                        <span style={{ color: '#FFDF00' }}> {transactionEstimatedTime} {transactionEstimatedTimeUnit}</span>
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
                        basket={basketData}
                        onRefreshPool={() => handleRefreshPool()}
                        handleWalletConnect={() => showWalletModal()}
                        onAddBasket={(
                            data: LiquidityBasketData,
                            navigateToBasket: boolean,
                        ) => handleAddBasket(data, navigateToBasket)}
                        onAddSuccess={() => handleTransactionSuccess()}
                        onStatus={(status: boolean, time?: number) =>
                            handleChangePendingStatus(status, time)
                        }
                        handleChangeTab={(t: Tabs) => handleChangeTab(t)}
                    />
                )}
                {tab === 'task' && (
                    <TaskContainer
                        onBack={() => {
                            handleChangeTab('home');
                        }}
                        onLevelUp={() => {
                            setLevelCompleteStatus('incomplete');
                            handleChangeTab('levelup');
                        }}
                    />
                )}
                {tab === 'transactionSuccess' && (
                    <SuccessContainer
                        onBack={() => {
                            handleChangeTab('task');
                        }}
                    />
                )}
                {tab === 'levelup' && (
                    <LevelUpContainer
                        onBack={() => {
                            handleChangeTab('task');
                        }}
                    />
                )}
                {tab === 'shop' && <ShopContainer />}
                {tab === 'cart' && (
                    <CartContainer
                        gasPrices={gasPrices}
                        cartData={basketData}
                        onBack={() => {
                            handleChangeTab('home');
                        }}
                        onAddSuccess={() => handleTransactionSuccess()}
                        onStatus={(status: boolean, time?: number) =>
                            handleChangePendingStatus(status, time)
                        }
                    />
                )}
                {tab === 'positionManager' && (
                    <PositionManagerContainer
                        onBack={() => {
                            handleChangeTab('home');
                        }}
                        onSelectPosition={() => {
                            handleChangeTab('positionDetail');
                        }}
                    />
                )}
                {tab === 'positionDetail' && (
                    <PositionDetailContainer
                        onBack={() => {
                            handleChangeTab('positionManager');
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
                            handleChangeTab('home');
                        }}
                    >
                        <IconHome fill={tab === 'home' ? '#000' : '#808080'} />
                    </div>
                    <div
                        className={classNames('footer-tab', {
                            active:
                                tab === 'task' ||
                                tab === 'transactionSuccess' ||
                                tab === 'levelup',
                            mark: levelCompleteStatus === 'complete',
                        })}
                        role='button'
                        onClick={(e) => {
                            handleChangeTab('task');
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
                            handleChangeTab('positionManager');
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
                            handleChangeTab('shop');
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
                            handleChangeTab('cart');
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
