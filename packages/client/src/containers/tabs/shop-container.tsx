/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import classNames from 'classnames';

import './shop-container.scss';
import pngRewardRoof from 'styles/images/reward-roof.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';

import pngTimer from 'styles/images/timer.png';
import pngRemoveBanana from 'styles/images/banana-3.png';
import pngMonkeyHappy from 'styles/images/monkey-1.png';
import pngMonkeys from 'styles/images/monkeys.png';
import png3Hours from 'styles/images/3hours.png';
import pngSpeed from 'styles/images/speed.png';
import pngLock from 'styles/images/lock.png';

const ShopItem = ({
    itemName,
    itemImage,
    banana,
    active,
    imageHeight,
    onUnlock,
}: {
    itemName: string | JSX.Element;
    itemImage: string;
    banana: number;
    active?: boolean | false;
    imageHeight?: number;
    onUnlock: () => void;
}): JSX.Element | null => {
    const style = imageHeight ? { height: `${imageHeight}px` } : {};

    return (
        <div className='reward-item-wrapper'>
            <div className={classNames('reward-item', { enable: active })}>
                <div className='reward-item-img'>
                    <img src={itemImage} style={style} />
                </div>
                <span className='reward-item-name'>{itemName}</span>
                {active && (
                    <div className='reward-item-button' role='button'>
                        <span>{banana}</span>
                        {` `}
                        <img src={pngDancingBanana} />
                    </div>
                )}
            </div>
            {!active && <img src={pngLock} className='reward-lock' />}
        </div>
    );
};

const RewardContainer = (): JSX.Element | null => {
    const handleUnlock = () => {
        console.log('unlocked clicked');
    };

    return (
        <div className='reward-container'>
            <img className='reward-container-image' src={pngRewardRoof} />
            <div className='reward-container-card'>
                <h1 className='reward-title'>BANANA SHOP</h1>
                <h2 className='reward-subtitle'>
                    HERE YOU CAN TRADE BANANAS FOR NEW
                    <br /> POWERS AND FEATURES
                </h2>
                <div className='reward-wrapper'>
                    <ShopItem
                        itemName='SPEED UP!'
                        itemImage={pngTimer}
                        banana={1}
                        active={true}
                        imageHeight={90}
                        onUnlock={() => handleUnlock()}
                    />
                    <ShopItem
                        itemName={
                            <>
                                REMOVE
                                <br />
                                LIQUIDITY
                            </>
                        }
                        itemImage={pngRemoveBanana}
                        banana={1}
                        onUnlock={() => handleUnlock()}
                    />
                    <ShopItem
                        itemName={
                            <>
                                BANANA
                                <br />
                                PORTFOLIO
                            </>
                        }
                        itemImage={pngMonkeyHappy}
                        banana={1}
                        onUnlock={() => handleUnlock()}
                    />
                    <ShopItem
                        itemName={
                            <>
                                SENTIMENT
                                <br />
                                PRICE RANGES
                            </>
                        }
                        itemImage={pngMonkeys}
                        banana={1}
                        imageHeight={50}
                        onUnlock={() => handleUnlock()}
                    />
                    <ShopItem
                        itemName={
                            <>
                                3 HOURS
                                <br />
                                WAIT
                            </>
                        }
                        itemImage={png3Hours}
                        banana={1}
                        onUnlock={() => handleUnlock()}
                    />
                    <ShopItem
                        itemName={
                            <>
                                TRANSACTION
                                <br />
                                SPEED
                            </>
                        }
                        itemImage={pngSpeed}
                        banana={1}
                        onUnlock={() => handleUnlock()}
                    />
                </div>
            </div>
        </div>
    );
};

export default RewardContainer;
