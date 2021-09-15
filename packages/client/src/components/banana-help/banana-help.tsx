import React from 'react';

import './banana-help.scss';
import { Box } from '@material-ui/core';

import { useWallet } from 'hooks/use-wallet';

import pngBanana2 from 'styles/images/banana-2.png';
import pngBananas from 'styles/images/banana-5.png';
import pngClose from './close.png';
import pngMonkey from './monkey.png';

export const BananaHelp = ({
    onClose,
    onConnectWallet,
}: {
    onClose: () => void;
    onConnectWallet: () => void;
}): JSX.Element => {
    const { wallet } = useWallet();

    const closeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClose();
    };

    const handleConnectWallet = () => {
        if (!wallet.account) {
            onConnectWallet();
        } else {
            onClose();
        }
    };

    const handleBackToGame = () => {
        if (!wallet.account) {
            onConnectWallet();
        } else {
            onClose();
        }
    };

    return (
        <div className='banana-help-container'>
            <div className='monkey-icon'>
                <img src={pngMonkey} width={'180px'} />
            </div>
            <div className='banana-help-content'>
                <Box
                    display='flex'
                    flexDirection='row'
                    justifyContent='space-around'
                >
                    <div className='banana-help-title'></div>
                    {wallet.account && (
                        <div className='banana-help-close'>
                            <a href='#' onClick={(e) => closeClick(e)}>
                                <img
                                    src={pngClose}
                                    height={'29px'}
                                    width={'29px'}
                                />
                            </a>
                        </div>
                    )}
                </Box>

                <Box justifyContent='space-around' className='quest-box'>
                    <div className='quest-title'>THE QUEST</div>
                    <div className='quest-text'>
                        In Dancing Bananas Game your Quest is To Add and Remove
                        LIquidity to Collect Fees and Nanas!
                    </div>
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    justifyContent='space-around'
                    style={{ marginTop: 22 }}
                >
                    <div className='quest-title'>HOW TO PLAY?</div>
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    justifyContent='space-around'
                    style={{ marginTop: 18 }}
                >
                    <div className='bananas-icon'>
                        <img src={pngBananas} width={'86px'} />
                    </div>
                    <div className='text-normal'>
                        With Nanas you will unlock new features and speed up
                        wait times, and become a better and smarter Ape!
                        <br />
                        <span className='text-bold'>
                            Collect as much as you can!
                        </span>
                    </div>
                </Box>

                <Box className='text-normal' style={{ marginTop: 15 }}>
                    Every 4 hours a Dancing Banana Liquidity Pool will be
                    revealed for you.
                </Box>
                <Box className='text-normal' style={{ marginTop: 15 }}>
                    On the Level 1, you have 2 options:
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    alignItems='center'
                    style={{ marginTop: 28 }}
                >
                    <span className='banana-help-chapter'>1.</span>
                    <button
                        className='banana-help-button green'
                        onClick={(e) => handleConnectWallet()}
                    >
                        ADD
                    </button>
                    <div className='text-black' style={{ marginLeft: 17 }}>
                        Add Liquidity
                    </div>
                </Box>
                <Box className='text-normal' style={{ marginTop: 28 }}>
                    Adding Liquidity you will earn Nanas and Pool Fees. You can
                    track anytime your Banana Wins for Fees Collected!
                </Box>
                <Box className='text-normal' style={{ marginTop: 13 }}>
                    For Add Liquidity you need to:
                </Box>
                <Box className='text-normal' style={{ marginTop: 18 }}>
                    <span className='text-bold'>a) Pick your tokens.</span> You
                    can select a maximun of 2 tokens at each pool.
                </Box>
                <Box className='text-normal' style={{ marginTop: 18 }}>
                    <span className='text-bold'>b) Pick your sentiment.</span>{' '}
                    In Level 1 your default sentiment will be neutral. As you
                    progress through the game you will be able to unlock other
                    sentiments.
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    alignItems='center'
                    style={{ marginTop: 28 }}
                >
                    <span className='banana-help-chapter'>2.</span>
                    <button
                        className='banana-help-button grau'
                        onClick={(e) => handleConnectWallet()}
                    >
                        SKIP
                    </button>
                    <div className='text-black' style={{ marginLeft: 17 }}>
                        Skip the Pool
                    </div>
                </Box>

                <Box
                    display='flex'
                    flexDirection='row'
                    justifyContent='center'
                    style={{ marginTop: 44, marginBottom: 7 }}
                >
                    <button
                        className='banana-help-back-game'
                        onClick={(e) => handleBackToGame()}
                    >
                        To THE GAME <img src={pngBanana2} />
                    </button>
                </Box>
            </div>
        </div>
    );
};

export default BananaHelp;
