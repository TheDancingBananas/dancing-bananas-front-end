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
import pngFireWorks from 'styles/images/confetti-97.png';
import pngCongratulations from 'styles/images/congratulations.png';
import pngTick from 'styles/images/tick.png';

import { storage } from 'util/localStorage';

const SuccessContainer = ({
    onToTask,
    onLevelup,
}: {
    onToTask: () => void;
    onLevelup: () => void;
}): JSX.Element | null => {
    const taskStatus = storage.getTaskStatus();
    const level = storage.getLevel();
    const totalTasks = taskStatus.length;
    const completedTasks = taskStatus.filter((task) => task.complete === true)
        .length;
    const allTaskCompleted = totalTasks === completedTasks;
    return (
        <div className='success-container'>
            <img src={pngFireWorks} className='success-fire-works' />
            <div className='success-container-card'>
                <img src={pngCongratulations} className='success-image' />
                <h2 className='success-title'>CONGRATULATIONS!</h2>
                <p className='success-text'>
                    YOUR TRANSACTION WAS
                    <br />
                    SUCCESSFULLY APPROVED
                </p>
                {!allTaskCompleted && (
                    <button
                        className='success-back'
                        onClick={(e) => {
                            onToTask();
                        }}
                    >
                        TO LEVEL{level} TASKS
                    </button>
                )}
                {allTaskCompleted && (
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
