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
import { IconHome, IconReward, IconSearch, IconCart } from 'components/icon';

import RewardContainer from './tabs/reward-container';

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
                {tab === 'reward' && <RewardContainer />}

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
                        <IconReward
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
                        <IconSearch
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
