/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import classNames from 'classnames';

import './shop-container.scss';
import pngRewardRoof from 'styles/images/reward-roof.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';

import pngSpeedUp from 'styles/images/shop/Monkey_rocket.png';
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
    onExchange,
}: {
    itemName: string | JSX.Element;
    itemImage: string;
    banana: number;
    active?: boolean | false;
    imageHeight?: number;
    onUnlock: () => void;
    onExchange: () => void;
}): JSX.Element | null => {
    const style = imageHeight ? { height: `${imageHeight}px` } : {};
    const isSpeedUp = itemName === 'SPEED UP!';

    const handleExchange = () => {
        if (active) {
            onExchange();
        }
    };
    return (
        <div className='reward-item-wrapper'>
            <div
                className={classNames(
                    'reward-item',
                    { enable: active },
                    { 'speedup-wrap': isSpeedUp },
                )}
                onClick={handleExchange}
            >
                <img src={itemImage} style={style} />
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

const ShopContainer = ({
    onExchange,
}: {
    onExchange: (exchangeKey: string) => void;
}): JSX.Element | null => {
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
                        itemImage={pngSpeedUp}
                        banana={300}
                        active={true}
                        imageHeight={140}
                        onUnlock={() => handleUnlock()}
                        onExchange={() => onExchange('speedup')}
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
                        onExchange={() => onExchange('')}
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
                        onExchange={() => onExchange('')}
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
                        onExchange={() => onExchange('')}
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
                        onExchange={() => onExchange('')}
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
                        onExchange={() => onExchange('')}
                    />
                </div>
            </div>
        </div>
    );
};

export default ShopContainer;
