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
function LandingContainer({
    setShowConnectWallet,
    gasPrices,
}: {
    setShowConnectWallet: (wallet: boolean) => void;
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const { wallet } = useWallet();

    const [tab, setTab] = useState<string>('home');

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
            >
                {tab === 'home' && <LiquidityContainer gasPrices={gasPrices} />}

                {/* {tab === 'reward' && <LiquidityContainer gasPrices={gasPrices} />}
                {tab === 'search' && <LiquidityContainer gasPrices={gasPrices} />}
                {tab === 'card' && <LiquidityContainer gasPrices={gasPrices} />} */}
            </Box>
            <Box
                display='flex'
                alignItems='center'
                className='footer-tab-container'
            >
                <div
                    className='footer-tab'
                    role='button'
                    onClick={(e) => {
                        setTab('home');
                    }}
                >
                    <img src='../styles/images/home.png' />
                </div>
                <div
                    className='footer-tab'
                    role='button'
                    onClick={(e) => {
                        setTab('reward');
                    }}
                >
                    <img src='../styles/images/reward.png' />
                </div>
                <div
                    className='footer-tab'
                    role='button'
                    onClick={(e) => {
                        setTab('search');
                    }}
                >
                    <img src='../styles/images/search.png' />
                </div>
                <div
                    className='footer-tab'
                    role='button'
                    onClick={(e) => {
                        setTab('cart');
                    }}
                >
                    <img src='../styles/images/cart.png' />
                </div>
            </Box>
        </div>
    );
}

export default LandingContainer;
