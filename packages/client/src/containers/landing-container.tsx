import { useState, useEffect } from 'react';
import { EthGasPrices } from '@sommelier/shared-types';
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
} from 'components/icon';

import RewardContainer from './tabs/reward-container';
import CartContainer from './tabs/cart-container';

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

    const getRandomPool = async () => {
        const shouldRefresh = storage.shouldRefreshPool();

        const networkName = 'mainnet';
        // const networkName = 'rinkeby';

        if (currentPoolId === '' || shouldRefresh) {
            const response = await fetch(
                `/api/v1/${networkName}/randomPool?count=${50}`,
            );
            if (!response.ok) throw new Error(`Failed to fetch top pools`);

            const data = await (response.json() as Promise<string>);
            console.log('new Id', data);
            setCurrentPoolId(data);
        }
    };

    useEffect(() => {
        getRandomPool();
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
                    />
                )}
                {tab === 'reward' && <RewardContainer />}
                {tab === 'cart' && (
                    <CartContainer
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
                            active: tab === 'reward',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('reward');
                        }}
                    >
                        <IconSearch
                            fill={tab === 'reward' ? '#000' : '#808080'}
                        />
                    </div>
                    <div
                        className={classNames('footer-tab', {
                            active: tab === 'search',
                        })}
                        role='button'
                        onClick={(e) => {
                            setTab('search');
                        }}
                    >
                        <IconShop
                            fill={tab === 'search' ? '#000' : '#808080'}
                        />
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
