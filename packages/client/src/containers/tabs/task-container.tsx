/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import { Level, LevelTask } from 'types/game';
import gameData from 'constants/gameData.json';
import { storage } from 'util/localStorage';

import './task-container.scss';

import pngSearch from 'styles/images/search.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngArrowLeft from 'styles/images/left-arrow.png';
import pngTickBlack from 'styles/images/tick-black.png';

const TaskContainer = ({
    onBack,
    onLevelUp,
}: {
    onBack: () => void;
    onLevelUp: () => void;
}): JSX.Element | null => {
    const taskCompleteStatus = storage.getTask();
    const level = storage.getLevel();

    const gameLevels: Level[] = gameData.game;
    const currentLevel: Level = gameLevels[Number(level) - 1];

    return (
        <div className='task-container'>
            <div className='task-container-head'>
                <img
                    className='back-image'
                    src={pngArrowLeft}
                    onClick={(e) => onBack()}
                />
                <img className='head-image' src={pngSearch} />
            </div>
            <div className='task-container-card'>
                <p className='task-title'>
                    LEVEL {level}: {currentLevel.description}
                </p>
                <p className='task-sub-title'>
                    YOU MUST COMPLETED THESE TASK <br />
                    FOR LEVEL UP
                </p>
                <div className='task-content'>
                    {currentLevel.tasks.map(
                        (task: LevelTask, index: number) => {
                            if (taskCompleteStatus === 'incomplete') {
                                return (
                                    <button
                                        key={`level-task-${index}`}
                                        className='task-item'
                                        onClick={(e) => onBack()}
                                    >
                                        {task.taskName}
                                    </button>
                                );
                            }
                            if (taskCompleteStatus === 'complete') {
                                return (
                                    <button
                                        key={`level-task-${index}`}
                                        className='task-item'
                                    >
                                        TASK COMPLETED
                                        <img
                                            src={pngTickBlack}
                                            style={{ marginLeft: 15 }}
                                            width='10'
                                        />
                                    </button>
                                );
                            }

                            return null;
                        },
                    )}
                </div>
                <div className='reward-divider'>
                    <div className='line'></div>
                    <span>REWARDS</span>
                    <div className='line'></div>
                </div>
                <button
                    className={classNames('level-up-button', {
                        disabled: taskCompleteStatus !== 'complete',
                    })}
                    onClick={(e) => {
                        if (taskCompleteStatus === 'complete') {
                            const nextLevel = Number(level) + 1;
                            storage.setLevel(nextLevel.toString());
                            storage.setTask('incomplete');
                            onLevelUp();
                        }
                    }}
                >
                    <span>LEVEL UP!</span>
                    <div className='level-up-cost'>
                        <img src={pngDancingBanana} />
                        <span>X2</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default TaskContainer;
