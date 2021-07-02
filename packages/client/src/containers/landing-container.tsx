import { useState, useEffect } from 'react';
import { EthGasPrices, LiquidityBasketData } from '@sommelier/shared-types';
import { Modal } from 'react-bootstrap';
import { useWallet } from 'hooks/use-wallet';
import { TelegramCTA } from 'components/telegram-cta';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import PendingTx from 'components/pending-tx';
import { useMediaQuery } from 'react-responsive';
import { LiquidityContainer } from 'containers/liquidity-container';
import { Box } from '@material-ui/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDiscord,
    faTwitter,
    faTelegram,
} from '@fortawesome/free-brands-svg-icons';

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

import { storage } from 'util/localStorage';

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

    const showWalletModal = () => setShowConnectWallet(true);

    useEffect(() => {
        try {
            mixpanel.track('pageview:landing', {});
        } catch (e) {
            console.error(`Metrics error on add positions:landing.`);
        }
    }, []);

    const handleAddBasket = (data: LiquidityBasketData) => {
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
        setTab('cart');
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
                        onAddBasket={(data: LiquidityBasketData) =>
                            handleAddBasket(data)
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
                {tab === 'shop' && <ShopContainer />}
                {tab === 'cart' && (
                    <CartContainer
                        cartData={basketData}
                        onBack={() => {
                            setTab('home');
                        }}
                    />
                )}

                {/* {tab === 'search' && <LiquidityContainer gasPrices={gasPrices} />}
                {tab === 'card' && <LiquidityContainer gasPrices={gasPrices} />} */}
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
                            active: tab === 'dollar',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('dollar');
                        }}
                    >
                        <IconDollar
                            fill={tab === 'dollar' ? '#000' : '#808080'}
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
                    </div>
                </div>
            </Box>
        </div>
    );
}

export default LandingContainer;
