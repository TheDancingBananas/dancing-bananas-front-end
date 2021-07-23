import { useState, useEffect } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';
import { LiquidityBasketData } from 'types/states';
import { Tabs } from 'types/game';
import { useWallet } from 'hooks/use-wallet';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import { LiquidityContainer } from 'containers/liquidity-container';
import { Box } from '@material-ui/core';
import BananaHelp from 'components/banana-help/banana-help';
import { getRandomPoolID } from 'services/api';
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
import { SKIP_DURATION, storage } from 'util/localStorage';

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

    const [basketData, setBasketData] = useState<LiquidityBasketData[]>([]);

    const [pendingTransaction, setPendingTransaction] = useState(false);

    const [levelCompleteStatus, setLevelCompleteStatus] = useState<string>(
        storage.getTask(),
    );

    let is_visible = true;
    // const positionList = usePositionManagers();

    const savedPoolId = storage.getCurrentPoolId();

    const [currentPoolId, setCurrentPoolId] = useState<string>(
        savedPoolId ? savedPoolId : '0x',
    );
    const [lastPoolFetchTime, setLastPoolFetchTime] = useState<number>(
        storage.getLastSkipTime(),
    );
    const [shouldRefreshPool, setShouldRefreshPool] = useState<boolean>(false);

    useEffect(() => {
        let refresh = false;
        if (currentPoolId === '0x') {
            refresh = true;
        }

        if (lastPoolFetchTime !== 0) {
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - lastPoolFetchTime > SKIP_DURATION) {
                setLastPoolFetchTime(0);
                storage.setLastSkipTime(0);
                refresh = true;
            }
        }

        setShouldRefreshPool(refresh);
    }, [currentPoolId, lastPoolFetchTime]);

    useEffect(() => {
        const getPoolAsync = async (oldPool: string) => {
            const poolId = await getRandomPoolID(oldPool);
            storage.setCurrentPoolId(poolId);
            setCurrentPoolId(poolId);
        };
        if (shouldRefreshPool) {
            setShouldRefreshPool(false);
            getPoolAsync(currentPoolId);
        }
    }, [shouldRefreshPool, currentPoolId]);
    // const positionList = usePositionManagers();

    const handleRefreshPool = () => {
        console.log('handle refresh');
        storage.setLastSkipTime(0);
        // setCurrentPoolId('');
        setShouldRefreshPool(true);
    };

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

    const handleChangePendingStatus = (status: boolean) => {
        setPendingTransaction(status);
    };

    const handleChangeTab = (t: Tabs) => {
        if (t !== 'home') {
            const x = document.getElementById('bananaDiv');
            if (!(x == null)) {
                is_visible = x.style.display === 'block';

                x.style.display = 'none';
            }
        } else {
            const x = document.getElementById('bananaDiv');
            if (!(x == null)) {
                x.style.display = 'block';
            }
        }

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

            <BananaHelp></BananaHelp>

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
                        basket={basketData}
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
                        onStatus={(status: boolean) =>
                            handleChangePendingStatus(status)
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
