import React from 'react';

import './banana-help.scss';
import { Box } from '@material-ui/core';

import { useWallet } from 'hooks/use-wallet';

import pngClose from './close.png';
import pngMonkey from './monkey.png';
import pngBananas from './bananas.png';
import pngBtnAdd from './add.png';
import pngBtnSkip from './skip.png';

export const BananaHelp = ({
    onClose,
}: {
    onClose: () => void;
}): JSX.Element => {
    const { wallet } = useWallet();

    const closeClick = (e: React.MouseEvent) => {
        e.preventDefault();
        onClose();
    };

    return (
        <div id='bananaDiv'>
            <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                justifyContent='space-around'
                className='main-content-container'
            >
                <div className='monkey-icon'>
                    <img src={pngMonkey} width={'250px'} />
                </div>
                <Box className='banana-help-container'>
                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
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

                    <Box
                        justifyContent='space-around'
                        margin='20px'
                        className='quest-box'
                    >
                        <div className='quest-title'>
                            THE QUEST
                            <br />
                        </div>
                        <div className='quest-text'>
                            <br />
                            In the Dancing Bananas Game, Your Quest is To Add
                            and Remove LIquidity to Collect Fees and NANAS!
                        </div>
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
                    >
                        <div className='quest-title'>
                            HOW TO PLAY?
                            <br />
                        </div>
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
                    >
                        <div className='bananas-icon'>
                            <img src={pngBananas} width={'70px'} />
                        </div>
                        <div className='banana-help-instructions'>
                            <span className='banana-help-instructions-bold'>
                                With NANAS you will unlock new features and
                                speed up wait times
                            </span>{' '}
                            and you will become a better and smarter Ape!
                            Collect as much as you can!
                        </div>
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
                    >
                        <div className='banana-help-instructions-bold'>
                            Every 4 hours a Dancing Banana Liquidity Pool will
                            be reveal for you.
                            <br />
                            <br />
                            On the Level 1, you have 2 options:
                            <hr className='banana-help-line' />
                        </div>
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
                    >
                        <div className='bananas-icon'>
                            <img src={pngBtnAdd} width={'90px'} />
                        </div>
                        <div className='banana-help-large-instructions'>
                            Add Liquidity
                        </div>
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
                    >
                        <div className='banana-help-instructions'>
                            <span className='banana-help-instructions-bold'>
                                Adding Liquidity you will earn Nanas and Pool
                                Fees.
                            </span>{' '}
                            You can track anytime your Banana Wins for Fees
                            Collected!
                            <br />
                            <br />
                            For Add Liquidity you need to:
                            <br />
                            <br />
                            <span className='banana-help-instructions-bold'>
                                a) Pick your tokens.
                            </span>{' '}
                            You can select a maximun of 2 tokens at each pool.
                            <br />
                            <br />
                            <span className='banana-help-instructions-bold'>
                                b) Pick your sentiment.
                            </span>{' '}
                            In Level 1 your default sentiment will be neutral.
                            As you progress through the game you will be able to
                            unlock other sentiments.
                            <br />
                            <br />
                            <hr className='banana-help-line' />
                        </div>
                    </Box>

                    <Box
                        display='flex'
                        flexDirection='row'
                        justifyContent='space-around'
                        margin='20px'
                    >
                        <div className='bananas-icon'>
                            <img src={pngBtnSkip} width={'90px'} />
                        </div>
                        <div className='banana-help-large-instructions'>
                            Skip the Pool
                        </div>
                    </Box>
                </Box>
            </Box>
            <br />
        </div>
    );
};

export default BananaHelp;
