/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import './success-container.scss';

import pngBananaBasket from 'styles/images/banana-basket.png';
import pngEmptyBasket from 'styles/images/empty-basket.png';
import pngNANA from 'styles/images/tokens/nana.png';
import pngArrowLeft from 'styles/images/left.png';
import pngBanana1 from 'styles/images/banana-1.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngETH from 'styles/images/eth.png';
import pngChevronDown from 'styles/images/chevron-down.png';
import pngCheck from 'styles/images/check.png';
import pngFireWorks from 'styles/images/fireworks.png';
import pngTick from 'styles/images/tick.png';

import { storage } from 'util/localStorage';

const SuccessContainer = ({
    onBack,
    onToTask,
    onLevelup,
}: {
    onBack: () => void;
    onToTask: () => void;
    onLevelup: () => void;
}): JSX.Element | null => {
    const taskStatus = storage.getTaskStatus();
    const level = storage.getLevel();
    const totalTasks = taskStatus.length;
    const completedTasks = taskStatus.filter((task) => task.complete === true)
        .length;
    const isNewTaskCompleted = localStorage.getItem('newTaskCompleted');
    const allTaskCompleted = totalTasks === completedTasks;
    return (
        <div className='success-container'>
            <div className='success-container-card'>
                <img src={pngFireWorks} className='success-fire-works' />
                <img src={pngTick} className='success-image' />
                <h2 className='success-title'>CONGRATULATIONS!</h2>
                <p className='success-text'>
                    YOUR TRANSACTION WAS
                    <br />
                    SUCCESSFULLY APPROVED
                </p>
                {isNewTaskCompleted === 'true' && (
                    <div className='w-100 mt-4 px-5 task-status'>
                        <fieldset>
                            <legend>LEVEL PROGRESS</legend>
                        </fieldset>
                        <div className='d-flex task-status-label'>
                            <div className='d-flex justify-content-center flex-column'>
                                <img src={pngCheck} className='check-image' />
                            </div>
                            <div className='ml-4 task-status-label-text'>
                                YOU COMPLETED {completedTasks}/{totalTasks}{' '}
                                TASKS <br /> ON LEVEL {level}
                            </div>
                        </div>
                    </div>
                )}
                {isNewTaskCompleted === 'false' && (
                    <button
                        className='success-back yellow'
                        onClick={(e) => {
                            onBack();
                        }}
                    >
                        BACK HOME
                    </button>
                )}
                {isNewTaskCompleted === 'true' && !allTaskCompleted && (
                    <button
                        className='success-back'
                        onClick={(e) => {
                            onToTask();
                        }}
                    >
                        TO LEVEL{level} TASKS
                    </button>
                )}
                {isNewTaskCompleted === 'true' && allTaskCompleted && (
                    <button
                        className='success-back'
                        onClick={(e) => {
                            onLevelup();
                        }}
                    >
                        LEVEL UP!
                    </button>
                )}
            </div>
        </div>
    );
};

export default SuccessContainer;
