/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import './level-up-container.scss';

import pngBananaBasket from 'styles/images/banana-basket.png';
import pngEmptyBasket from 'styles/images/empty-basket.png';
import pngNANA from 'styles/images/tokens/nana.png';
import pngArrowLeft from 'styles/images/left.png';
import pngBanana1 from 'styles/images/banana-1.png';
import pngBananagroup from 'styles/images/banana-2.png';
import pngETH from 'styles/images/eth.png';
import pngChevronDown from 'styles/images/chevron-down.png';

import pngFireWorks from 'styles/images/fireworks.png';
import pngTick from 'styles/images/tick.png';
import pngLevelUp from 'styles/images/levels/level.png';
import pngClose from 'styles/images/close.png';

import { storage } from 'util/localStorage';
import { Level, LevelTask, RewardItem } from 'types/game';
import gameData from 'constants/gameData.json';

const LevelUpContainer = ({
    onBack,
}: {
    onBack: () => void;
}): JSX.Element | null => {
    const currentLevel = storage.getLevel();

    const gameLevels: Level[] = gameData.game;
    const currentLevelData: Level = gameLevels[Number(currentLevel) - 1];
    const levelupReward: RewardItem =
        gameLevels[Number(currentLevel) - 2].bananarewards.levelup;
    return (
        <div className='level-up-container'>
            <div className='level-up-container-head'>
                <img className='level-up-icon' src={pngLevelUp} />
                <span className='level-up-text'>{currentLevel}</span>
            </div>
            <div className='level-up-container-card'>
                <h2 className='level-up-title'>LEVEL UP!</h2>
                <p className='level-up-sub-title'>UNLOCK NEW POWERS:</p>
                <div className='level-up-reward-wrapper'>
                    {currentLevelData.rewards.map(
                        (reward: string, index: number) => (
                            <p
                                className='level-up-reward-item'
                                key={`next-level-reward-${index}`}
                            >
                                <span className='yellow'>+</span>
                                <span>{reward}</span>
                            </p>
                        ),
                    )}
                </div>
                <p className='level-up-sub-title'>Bonus Reward:</p>
                <div className='level-up-reward-wrapper'>
                    <p className='level-up-reward-item'>
                        <img src={pngBananagroup} />
                        <img src={pngBananagroup} />
                        <span className='bonus-amount'>
                            {levelupReward.amount}
                        </span>
                        <img src={pngBananagroup} />
                        <img src={pngBananagroup} />
                    </p>
                </div>
                <button
                    className='level-up-back'
                    onClick={(e) => {
                        onBack();
                    }}
                >
                    {` GO TO LEVEL ${currentLevel} TASKS`}
                </button>
            </div>
        </div>
    );
};

export default LevelUpContainer;
