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

import pngFireWorks from 'styles/images/fireworks.png';
import pngTick from 'styles/images/tick.png';

import { storage } from 'util/localStorage';

const SuccessContainer = ({
    onBack,
}: {
    onBack: () => void;
}): JSX.Element | null => {
    return (
        <div className='success-container'>
            <div className='success-container-card'>
                <img src={pngFireWorks} className='success-fire-works' />
                <img src={pngTick} className='success-image' />
                <h2 className='success-title'>CONGRATULATIONS!</h2>
                <p className='success-text'>
                    YOUR TRANSACTION WAS
                    <br />
                    SUCCESSFULLY CONFIRMED
                </p>
                <button
                    className='success-back'
                    onClick={(e) => {
                        storage.setTask('complete');
                        onBack();
                    }}
                >
                    BACK TO HOME
                </button>
            </div>
        </div>
    );
};

export default SuccessContainer;
