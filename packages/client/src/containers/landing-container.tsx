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
import { getRandomPoolID, getCurrentPoolID } from 'services/api';
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
import ExchangeContainer from './tabs/exchange-container';
import LevelUpContainer from './tabs/level-up-container';
import PositionContainer from './position-container';

import pngWait from 'styles/images/wait.png';
import pngWallet from 'styles/images/wallet.png';
import pngEth from 'styles/images/eth.png';
import pngBanana from 'styles/images/dancing-banana.png';
import pngTelegram from 'styles/images/telegram-108.png';
import pngCuriousMonkey from 'styles/images/curious-109.png';
import pngMysteriousChimp from 'styles/images/mysterious_chimp-109.png';
import pngShopColor from 'styles/images/shop-color.png';
import pngBasket from 'styles/images/basket.png';
import pngSearch from 'styles/images/search.png';

import gifLoading from 'styles/images/loading-animation.gif';
import { SKIP_DURATION, storage } from 'util/localStorage';

import { V3PositionData } from '@sommelier/shared-types/src/api';

import gameData from 'constants/gameData.json';
import { Level, LevelTask } from 'types/game';
import { calculatePoolEntryData } from 'util/uniswap-pricing';

function LandingContainer({
    setShowConnectWallet,
    gasPrices,
}: {
    setShowConnectWallet: (wallet: boolean) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const { wallet } = useWallet();

    const currentLevel = storage.getLevel();
    const currentBasketData = storage.getBasketData();

    const gameLevels: Level[] = gameData.game;
    const currentLevelData: Level = gameLevels[Number(currentLevel) - 1];

    const [tab, setTab] = useState<Tabs>('home');
    const [homeMode, setHomeMode] = useState<string>('none');

    const [basketData, setBasketData] = useState<LiquidityBasketData[]>(
        currentBasketData,
    );

    const [pendingTransaction, setPendingTransaction] = useState(false);
    const [transactionEstimatedTime, setTransactionEstimatedTime] = useState(
        '',
    );
    const [
        transactionEstimatedTimeUnit,
        setTransactionEstimatedTimeUnit,
    ] = useState('');

    const [taskCompleted, setTaskCompleted] = useState<boolean>(
        storage.getLevelTaskCompleted(),
    );

    let is_visible = true;
    // const positionList = usePositionManagers();

    const [currentPoolId, setCurrentPoolId] = useState<string>('');
    const [lastPoolFetchTime, setLastPoolFetchTime] = useState<number>(
        storage.getLastSkipTime(),
    );
    const [shouldRefreshPool, setShouldRefreshPool] = useState<boolean>(false);

    const [poolIndex, setPoolIndex] = useState<number>(0);
    const [poolCount, setPoolCount] = useState<number>(
        Number(currentLevelData.poolCount),
    );

    const [exchangeKey, setExchangeKey] = useState<string>('speedup');

    const handleChangePoolIndex = (index: number) => {
        setPoolIndex(index % poolCount);
    };

    useEffect(() => {
        let refresh = false;

        if (lastPoolFetchTime !== 0) {
            const currentTime = Math.floor(Date.now() / 1000);
            if (currentTime - lastPoolFetchTime > SKIP_DURATION) {
                setLastPoolFetchTime(0);
                storage.setLastSkipTime(0);
                storage.setSkipStatus('off');
                refresh = true;
            }
        }

        setShouldRefreshPool(refresh);
    }, [lastPoolFetchTime]);

    useEffect(() => {
        const getCurrentPoolAsync = async (address: string) => {
            const poolId = await getCurrentPoolID(address, currentPoolId);
            if (poolId != currentPoolId) {
                setCurrentPoolId(poolId);
            }
        };
        const address = wallet.account ? wallet.account : '0x';
        getCurrentPoolAsync(address);

        if (!wallet.account) {
            setBananaHelp(true);
        }
    }, [wallet.account]);

    useEffect(() => {
        const getPoolAsync = async (address: string) => {
            const poolId = await getRandomPoolID(address);
            console.log('prev pool', currentPoolId);
            console.log('new pool', poolId);
            if (poolId != currentPoolId) {
                setCurrentPoolId(poolId);
            }
        };
        if (shouldRefreshPool && wallet.account) {
            console.log('started refresh pool');
            getPoolAsync(wallet.account);
            setShouldRefreshPool(false);
        }
    }, [shouldRefreshPool, wallet.account]);
    // const positionList = usePositionManagers();

    const handleRefreshPool = () => {
        setShouldRefreshPool(true);
        console.log('handle refresh');
        storage.setLastSkipTime(0);
        storage.setSkipStatus('off');
        // setCurrentPoolId('');
    };

    const showWalletModal = () => setShowConnectWallet(true);
    const showLevelPage = () => handleChangeTab('task');

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

        storage.setBasketData([...basketData]);

        setBasketData([...basketData]);
        if (navigateToBasket) {
            setTab('cart');
        }
    };

    const handleTransactionSuccess = () => {
        const nAddLiquidities = basketData.filter(
            (item) => item.actionType === 'add',
        ).length;
        const nTwosidedliquidities = basketData.filter(
            (item) => item.actionType === 'add' && item.isOneSide === false,
        ).length;
        const taskStatus = storage.getTaskStatus();
        const addLiquidityIndex = taskStatus.findIndex(
            (task) => task.taskType === 'addliquidity',
        );
        let newTaskCompleted = false;
        if (addLiquidityIndex > -1) {
            taskStatus[addLiquidityIndex].current += nAddLiquidities;
            if (
                taskStatus[addLiquidityIndex].current >=
                taskStatus[addLiquidityIndex].goal
            ) {
                taskStatus[addLiquidityIndex].complete = true;
                newTaskCompleted = true;
            }
        }

        const twosidedAddLiquidityIndex = taskStatus.findIndex(
            (task) => task.taskType === 'addtwosidedliquidity',
        );
        if (twosidedAddLiquidityIndex > -1) {
            taskStatus[
                twosidedAddLiquidityIndex
            ].current += nTwosidedliquidities;
            if (
                taskStatus[twosidedAddLiquidityIndex].current >=
                taskStatus[twosidedAddLiquidityIndex].goal
            ) {
                taskStatus[twosidedAddLiquidityIndex].complete = true;
                newTaskCompleted = true;
            }
        }

        localStorage.setItem('newTaskCompleted', String(newTaskCompleted));
        storage.setTaskStatus(taskStatus);
        setTaskCompleted(storage.getLevelTaskCompleted());
        setTab('transactionSuccess');
        setBasketData([]);
    };

    const handleChangePendingStatus = (status: boolean, time?: number) => {
        setPendingTransaction(status);

        let value = '',
            unit = '';
        if (time) {
            if (time > 0 && time < 60) {
                value = Math.floor(time).toString();
                unit = 'SECS';
            } else if (time < 3600) {
                value = Math.floor(time / 60).toString();
                unit = 'MINS';
            } else if (time < 24 * 3600) {
                value = Math.floor(time / 3600).toString();
                unit = 'HOURS';
            } else {
                value = '';
                unit = '';
            }
        }
        setTransactionEstimatedTime(value);
        setTransactionEstimatedTimeUnit(unit);
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
            setHomeMode('none');
        }

        // if (currentLevel === '1' && basketData.length > 0) {
        //     if (t === 'home') {
        //         setPoolIndex(poolCount - 1);
        //         setTab(t);
        //         return;
        //     }
        // }

        setPoolIndex(0);
        setTab(t);
    };

    const handleEditCart = (poolId: string) => {
        setPoolIndex(0);
        setTab('home');
        setCurrentPoolId(poolId);
        setHomeMode('edit');
    };

    const handleExchange = (exchangeKey: string) => {
        setExchangeKey(exchangeKey);
        handleChangeTab('exchange');
    };

    const handleRemoveCart = (poolIndex: number) => {
        basketData.splice(poolIndex, 1);
        storage.setBasketData([...basketData]);
        setBasketData([...basketData]);
    };

    // useEffect(() => {
    //     console.log(basketData);
    // }, [basketData]);

    const handleGetBonusBananas = () => {
        console.log('clicked nbonus');
        showWalletModal();
    };

    const [bananaHelp, setBananaHelp] = useState<boolean>(true);
    const toggleBananaHelp = (visible: boolean) => {
        setBananaHelp(visible);
    };

    return (
        <div>
            <div className='main-header-container'>
                <div className='top-nav-container'>
                    {wallet.account ? (
                        <>
                            <div
                                className='top-nav-item pink'
                                onClick={() => {
                                    window.open(
                                        'https://t.me/getbananas',
                                        '_blank',
                                    );
                                }}
                            >
                                <img src={pngTelegram} />
                            </div>
                            <div
                                className='top-nav-item white'
                                onClick={(e) => handleChangeTab('task')}
                            >
                                <img src={pngSearch} />
                                <span className='monkey-level'>
                                    LEVEL {currentLevel}
                                </span>
                            </div>
                            <div
                                className='top-nav-item yellow'
                                onClick={(e) => showWalletModal()}
                            >
                                <img src={pngBanana} />
                                <span>{100}</span>
                            </div>
                            <div
                                className='top-nav-item white'
                                onClick={(e) => handleChangeTab('shop')}
                            >
                                <img src={pngShopColor} />
                            </div>
                            <div
                                className='top-nav-item white'
                                onClick={(e) => handleChangeTab('cart')}
                            >
                                {basketData.length > 0 && (
                                    <div className='top-nav-badge'>
                                        {basketData.length}
                                    </div>
                                )}
                                <img src={pngBasket} />
                            </div>
                        </>
                    ) : (
                        <ConnectWalletButton
                            onClick={showWalletModal}
                            onShowLevel={showLevelPage}
                        />
                    )}
                </div>
            </div>

            {bananaHelp && (
                <BananaHelp
                    onClose={() => toggleBananaHelp(false)}
                    onConnectWallet={() => showWalletModal()}
                />
            )}

            {pendingTransaction && (
                <div className='pending-transaction-board'>
                    <img
                        src={gifLoading}
                        className='pending-transaction-image'
                    />
                    <p className='pending-transaction-text'>
                        YOUR TRANSACTION IS BEING CONFIRMED
                        <br />
                        ESTIMATED DURATION:
                        <span style={{ color: '#FFDF00' }}>
                            {' '}
                            {transactionEstimatedTime}{' '}
                            {transactionEstimatedTimeUnit}
                        </span>
                    </p>
                </div>
            )}
            {wallet.account && (
                <Box
                    display='flex'
                    flexDirection='column'
                    alignItems='center'
                    justifyContent='space-around'
                    className='main-content-container'
                >
                    {tab === 'home' &&
                        currentPoolId !== '' &&
                        gasPrices &&
                        'fast' in gasPrices && (
                            <LiquidityContainer
                                gasPrices={gasPrices}
                                poolId={currentPoolId}
                                basket={basketData}
                                poolIndex={poolIndex}
                                poolCount={poolCount}
                                mode={homeMode}
                                onGoShop={() => {
                                    handleChangeTab('shop');
                                }}
                                onGoBasket={() => {
                                    handleChangeTab('cart');
                                }}
                                onRefreshPool={() => handleRefreshPool()}
                                handleWalletConnect={() => showWalletModal()}
                                onAddBasket={(
                                    data: LiquidityBasketData,
                                    navigateToBasket: boolean,
                                ) => handleAddBasket(data, navigateToBasket)}
                                onAddSuccess={() => handleTransactionSuccess()}
                                onGetBonusBananas={() =>
                                    handleGetBonusBananas()
                                }
                                onStatus={(status: boolean, time?: number) =>
                                    handleChangePendingStatus(status, time)
                                }
                                handleChangeTab={(t: Tabs) =>
                                    handleChangeTab(t)
                                }
                                handleChangePoolIndex={(i: number) => {
                                    if (poolIndex != i)
                                        handleChangePoolIndex(i);
                                }}
                            />
                        )}

                    {tab === 'task' && (
                        <TaskContainer
                            onBack={() => {
                                handleChangeTab('home');
                            }}
                            onLevelUp={() => {
                                handleChangeTab('levelup');
                            }}
                        />
                    )}
                    {tab === 'transactionSuccess' && (
                        <SuccessContainer
                            onBack={() => {
                                handleChangeTab('home');
                            }}
                            onToTask={() => {
                                handleChangeTab('task');
                            }}
                            onLevelup={() => {
                                handleChangeTab('levelup');
                            }}
                        />
                    )}
                    {tab === 'exchange' && (
                        <ExchangeContainer
                            exchangeKey={exchangeKey}
                            onBack={() => {
                                handleChangeTab('shop');
                            }}
                        />
                    )}
                    {tab === 'levelup' && (
                        <LevelUpContainer
                            onSetLevel={() => {
                                setTaskCompleted(
                                    storage.getLevelTaskCompleted(),
                                );
                            }}
                            onBack={() => {
                                handleChangeTab('task');
                            }}
                        />
                    )}
                    {tab === 'shop' && (
                        <ShopContainer
                            onExchange={(exchangeKey: string) => {
                                handleExchange(exchangeKey);
                            }}
                            onBack={() => {
                                handleChangeTab('home');
                            }}
                        />
                    )}
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
                            onEdit={(poolId: string) => handleEditCart(poolId)}
                            onRemove={(i: number) => handleRemoveCart(i)}
                        />
                    )}
                    {tab === 'position' && (
                        <PositionContainer
                            gasPrices={gasPrices}
                            onBack={() => {
                                handleChangeTab('home');
                            }}
                        />
                    )}
                </Box>
            )}
        </div>
    );
}

export default LandingContainer;
