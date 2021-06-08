/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import './reward-container.scss';
import pngRewardRoof from 'styles/images/reward-roof.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngLocked from 'styles/images/locked.png';
import pngTimer from 'styles/images/timer.png';

const RewardContainer = (): JSX.Element | null => {
    return (
        <div className='reward-container'>
            <img className='reward-container-image' src={pngRewardRoof} />
            <div className='reward-container-card'>
                <h1 className='reward-title'>BANANA SHOP</h1>
                <h2 className='reward-subtitle'>
                    HERE YOU CAN TRADE BANANAS FOR NEW POWERS AND FEATURES
                </h2>
                <div className='reward-wrapper'>
                    <div className='reward-item enable'>
                        <div className='reward-item-img'>
                            <img src={pngTimer} />
                        </div>
                        <span className='reward-item-name'>SPEED UP!</span>
                        <div className='reward-item-button' role='button'>
                            <span>1</span>
                            <img src={pngDancingBanana} />
                        </div>
                    </div>
                    <div className='reward-item'>
                        <div className='reward-item-img'>
                            <img src={pngLocked} />
                        </div>
                        <span className='reward-item-name'>
                            REMOVE
                            <br />
                            LIQUIDITY
                        </span>
                    </div>
                    <div className='reward-item'>
                        <div className='reward-item-img'>
                            <img src={pngLocked} />
                        </div>
                        <span className='reward-item-name'>
                            REMOVE
                            <br />
                            LIQUIDITY
                        </span>
                    </div>
                    <div className='reward-item'>
                        <div className='reward-item-img'>
                            <img src={pngLocked} />
                        </div>
                        <span className='reward-item-name'>
                            REMOVE
                            <br />
                            LIQUIDITY
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardContainer;
