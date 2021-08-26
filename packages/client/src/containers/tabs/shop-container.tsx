/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import classNames from 'classnames';

import { storage } from 'util/localStorage';
import { Level, LevelTask, RewardItem, Rewards } from 'types/game';
import gameData from 'constants/gameData.json';

import './shop-container.scss';
import pngRewardRoof from 'styles/images/reward-roof.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';

import png3Hours from 'styles/images/3hours.png';
import png3HoursGray from 'styles/images/3hours-gray.png';
import png2Hours from 'styles/images/2hours.png';
import png2HoursGray from 'styles/images/2hours-gray.png';

import pngSpeedUp from 'styles/images/shop/Monkey_rocket.png';
import pngRemoveBanana from 'styles/images/banana-4.png';
import pngMonkeyHappy from 'styles/images/monkey-1.png';
import pngMonkeys from 'styles/images/monkeys.png';
import pngSpeed from 'styles/images/speed.png';
import pngLock from 'styles/images/lock.png';
import pngArrowLeft from 'styles/images/left.png';
import pngX from 'styles/images/X-121.png';

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
    itemImage?: string;
    banana: number;
    active?: boolean | false;
    imageHeight?: number;
    onUnlock: () => void;
    onExchange: () => void;
}): JSX.Element | null => {
    const style = imageHeight ? { height: `${imageHeight}px` } : {};
    const fontStyle = itemImage ? {} : { fontSize: 20, lineHeight: '24px' };
    const isSpeedUp = itemName === 'SPEED UP 48';

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
                {itemImage && <img src={itemImage} style={style} />}
                <span className='reward-item-name' style={fontStyle}>
                    {itemName}
                </span>
                {isSpeedUp && (
                    <span className='reward-item-subtitle'>48 HRS</span>
                )}
                {active && banana > 0 && (
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
    onBack,
}: {
    onExchange: (exchangeKey: string) => void;
    onBack: () => void;
}): JSX.Element | null => {
    const handleUnlock = () => {
        console.log('unlocked clicked');
    };

    const currentLevel = storage.getLevel();

    const gameLevels: Level[] = gameData.game;

    const rewards: Rewards[] = ['SPEED UP 48']; // default for level 1

    for (let i = 0; i < Number(currentLevel); i++) {
        const levelRewards = gameLevels[i].rewards;
        for (let j = 0; j < levelRewards.length; j++) {
            if (!rewards.includes(levelRewards[j] as Rewards)) {
                rewards.push(levelRewards[j] as Rewards);
            }
        }
    }

    console.log(rewards);
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
                        itemName='SPEED UP 48'
                        itemImage={pngSpeedUp}
                        banana={300}
                        active={rewards.includes('SPEED UP 48')}
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
                        banana={0}
                        active={rewards.includes('REMOVE LIQUIDITY')}
                        onUnlock={() => handleUnlock()}
                        onExchange={() => onExchange('')}
                    />
                    <ShopItem
                        itemName={
                            <>
                                EMOTION
                                <br />
                                PRICE RANGES
                            </>
                        }
                        itemImage={pngMonkeys}
                        imageHeight={50}
                        banana={1}
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
                        itemImage={png3HoursGray}
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
                    <ShopItem
                        itemName={
                            <>
                                2 HOURS
                                <br />
                                WAIT
                            </>
                        }
                        itemImage={png2HoursGray}
                        banana={1}
                        onUnlock={() => handleUnlock()}
                        onExchange={() => onExchange('')}
                    />
                    <ShopItem
                        itemName={
                            <>
                                COMMING
                                <br />
                                SOON
                            </>
                        }
                        active={true}
                        banana={0}
                        onUnlock={() => handleUnlock()}
                        onExchange={() => onExchange('')}
                    />
                    <ShopItem
                        itemName={
                            <>
                                COMING
                                <br />
                                SOON
                            </>
                        }
                        active={true}
                        banana={0}
                        onUnlock={() => handleUnlock()}
                        onExchange={() => onExchange('')}
                    />
                </div>
                <img
                    className='close-image'
                    src={pngX}
                    onClick={(e) => onBack()}
                />
            </div>
        </div>
    );
};

export default ShopContainer;
