import { useEffect, useState } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';
import { LiquidityBasketData } from 'types/states';
import { Modal } from 'react-bootstrap';
import { useWallet } from 'hooks/use-wallet';
import { Modal } from 'react-bootstrap';
import { TelegramCTA } from 'components/telegram-cta';
import mixpanel from 'util/mixpanel';
import ConnectWalletButton from 'components/connect-wallet-button';
import PendingTx from 'components/pending-tx';
import { LiquidityContainer } from 'containers/liquidity-container';
import config from 'config/app';
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
import SuccessContainer from './tabs/success-container';

import { storage } from 'util/localStorage';

import pngWait from 'styles/images/wait.png';

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
                        {basketData.length > 0 && (
                            <div className='basket-count'>
                                {basketData.length}
                            </div>
                        )}
                    </div>
                </div>
            </Box>
            <Modal
                show={networkUpdateModal}
                onHide={() => setNetworkUpdateModal(false)}
                dialogClassName='dark'
            >
                <Modal.Header
                    className='connect-wallet-modal-header'
                    closeButton
                >
                    <Modal.Title className='connect-wallet-modal-title'>
                        {'Change Network'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className='connect-wallet-modal'>
                    {
                        'Pairings by Sommelier only supports Ethereum mainnet. Please change your network in your wallet provider. More networks coming soon!'
                    }
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default LandingContainer;
