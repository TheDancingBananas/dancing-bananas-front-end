/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import './position-manager-container.scss';

import { IconShop } from 'components/icon';

import pngBananaBasket from 'styles/images/banana-basket.png';
import pngEmptyBasket from 'styles/images/empty-basket.png';
import pngNANA from 'styles/images/tokens/nana.png';
import pngArrowLeft from 'styles/images/left-arrow.png';
import pngArrowRight from 'styles/images/right-arrow.png';
import pngBanana1 from 'styles/images/banana-1.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngETH from 'styles/images/eth.png';
import pngChevronDown from 'styles/images/chevron-down.png';
import pngChevronUp from 'styles/images/chevron-up.png';
import pngMonkeyHappy from 'styles/images/monkey-happy.png';
import pngMonkeySad from 'styles/images/monkey-sad.png';

import pngFireWorks from 'styles/images/fireworks.png';
import pngTick from 'styles/images/tick.png';
import pngMoneyBranch from 'styles/images/money-branch.png';
import pngDanger from 'styles/images/danger.png';
import pngMoney from 'styles/images/money.png';

import pngTokenCRV from 'styles/images/tokens/CRV.png';
import pngTokenETH from 'styles/images/tokens/ETH.png';

import pngArrowLeft_1 from 'styles/images/left-arrow-1.png';
import pngChevronRight from 'styles/images/chevron-right.png';

const PositionDetailContainer = ({
    onBack,
}: {
    onBack: () => void;
}): JSX.Element | null => {
    const [detailOpen, setDetailOpen] = useState<boolean>(true);

    return (
        <div className='position-detail-container'>
            <div className='position-detail-header'>
                <img src={pngArrowLeft_1} onClick={(e) => onBack()} />
                <span>DANCING BANANA POSITIONS</span>
                <img height='10' src={pngChevronRight} />
                <span className='green'>CRV/ETH</span>
            </div>
            <div className='position-detail-unlock'>
                <button>
                    <IconShop fill='#fff' />
                    <div>
                        UNLOCK MORE
                        <br />
                        ADVANCED FEATURES
                    </div>
                </button>
            </div>
            <div className='position-detail-info'>
                <div className='position-detail-token'>
                    <div className='position-item-token'>
                        <img src={pngTokenCRV} />
                        <span>CRV</span>
                    </div>
                    <div className='position-item-token'>
                        <img src={pngTokenETH} />
                        <span>ETH</span>
                    </div>
                </div>
                <div className='position-detail-separator'></div>
                <div className='position-detail-type'>
                    <img src={pngMonkeyHappy} />
                    <span className='green'>{`+ ${formatUSD(200)}`}</span>
                </div>
            </div>
            <div className='position-detail-stats'>
                <div className='position-detail-stats-header'>
                    <span>POSITION DETAILS</span>
                    <img
                        src={detailOpen ? pngChevronUp : pngChevronDown}
                        onClick={(e) => setDetailOpen(!detailOpen)}
                    />
                </div>
                {detailOpen && (
                    <div className='position-detail-stats-wrapper'>
                        <div className='position-detail-stats-row'>
                            <div className='position-detail-stats-property'>
                                ENTRY LIQUIDITY
                            </div>
                            <div className='position-detail-stats-value'>
                                {formatUSD(100)}
                            </div>
                        </div>
                        <div className='position-detail-stats-row'>
                            <div className='position-detail-stats-property'>
                                CURRENT LIQUIDITY
                            </div>
                            <div className='position-detail-stats-value'>
                                {formatUSD(100)}
                            </div>
                        </div>
                        <div className='position-detail-stats-row'>
                            <div className='position-detail-stats-property'>
                                RETURN
                            </div>
                            <div className='position-detail-stats-value'>
                                {formatUSD(100)}
                            </div>
                        </div>
                        <div className='position-detail-stats-action'>
                            <button className='btn-remove-liquidity'>
                                REMOVE
                            </button>
                            <button className='btn-add-liquidity'>ADD</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PositionDetailContainer;
