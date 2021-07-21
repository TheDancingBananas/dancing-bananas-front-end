/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import { storage } from 'util/localStorage';

import './task-container.scss';

import pngSearch from 'styles/images/search.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngArrowLeft from 'styles/images/left-arrow.png';
import pngTickBlack from 'styles/images/tick-black.png';

const TaskContainer = ({
    onBack,
}: {
    onBack: () => void;
}): JSX.Element | null => {
    const taskCompleteStatus = storage.getTask();

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
                <p className='task-title'>LEVEL 1: CURIOUS MONKEY</p>
                <p className='task-sub-title'>
                    YOU MUST COMPLETED THESE TASK <br />
                    FOR LEVEL UP
                </p>
                <div className='task-content'>
                    {taskCompleteStatus === 'incomplete' && (
                        <button className='task-item' onClick={(e) => onBack()}>
                            ADD LIQUIDITY 1 TIME
                        </button>
                    )}
                    {taskCompleteStatus === 'complete' && (
                        <button className='task-item' onClick={(e) => onBack()}>
                            TASK COMPLETED
                            <img src={pngTickBlack} style={{ marginLeft: 5 }} />
                        </button>
                    )}
                </div>
                <div className='reward-divider'>
                    <div className='line'></div>
                    <span>REWARDS</span>
                    <div className='line'></div>
                </div>
                <button className='level-up-button' onClick={(e) => onBack()}>
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
