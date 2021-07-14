/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import classNames from 'classnames';

import './position-manager-container.scss';

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

const PositionHeader = ({
    positionType,
    onArrow,
}: {
    positionType: 'positive' | 'negative';
    onArrow: () => void;
}) => {
    return (
        <div className='position-header-container'>
            <div className='position-header-arrow'>
                {positionType === 'negative' && (
                    <img src={pngArrowLeft} onClick={(e) => onArrow()} />
                )}
            </div>
            <img
                className='position-type-image'
                src={
                    positionType === 'positive' ? pngMonkeyHappy : pngMonkeySad
                }
            />
            <div className='position-header-arrow'>
                {positionType === 'positive' && (
                    <img src={pngArrowRight} onClick={(e) => onArrow()} />
                )}
            </div>
        </div>
    );
};

const PositionItem = ({
    liquidity,
    active = true,
    closedDate,
    onSelect,
}: {
    liquidity?: number;
    active?: boolean | true;
    closedDate?: string | '';
    onSelect?: () => void;
}) => {
    return (
        <div
            className='position-item'
            onClick={(e) => {
                if (onSelect) {
                    onSelect();
                }
            }}
        >
            {active && (
                <div className='position-item-header'>
                    <img
                        className='position-item-mark'
                        src={liquidity && liquidity > 0 ? pngMoney : pngDanger}
                    />
                    {liquidity && (
                        <span
                            className={classNames('position-liqudity', {
                                positive: liquidity > 0,
                                negative: liquidity < 0,
                            })}
                        >
                            {`${liquidity > 0 ? '+' : '-'} ${formatUSD(
                                Math.abs(liquidity),
                            )}`}
                        </span>
                    )}
                </div>
            )}
            {!active && (
                <div className={classNames('position-item-header', 'closed')}>
                    <span className={classNames('position-liqudity')}>
                        {closedDate}
                    </span>
                </div>
            )}
            <div
                className={classNames('position-item-content', {
                    closed: !active,
                })}
            >
                <div className='position-item-token'>
                    <img src={pngTokenCRV} />
                    <span>CRV</span>
                </div>
                <div className='position-item-token'>
                    <img src={pngTokenETH} />
                    <span>ETH</span>
                </div>
            </div>
        </div>
    );
};

const PositionManagerContainer = ({
    onBack,
    onSelectPosition,
}: {
    onBack: () => void;
    onSelectPosition: () => void;
}): JSX.Element | null => {
    const [positionType, setPositionType] = useState<'positive' | 'negative'>(
        'positive',
    );

    const [v3Open, setV3Open] = useState<boolean>(true);
    const [v2Open, setV2Open] = useState<boolean>(true);
    const [closedOpen, setClosedOpen] = useState<boolean>(true);

    const handleOnArrow = () => {
        setV3Open(true);
        setV2Open(true);
        setClosedOpen(true);
        setPositionType(positionType === 'positive' ? 'negative' : 'positive');
    };

    return (
        <div className='position-manager-container'>
            <h1 className='postion-manager-header'>BANANA PORTFOLIO</h1>
            <div className='position-manager-container-card'>
                <div className='position-manager-total-liquidity-wrapper'>
                    <img src={pngMoneyBranch} />
                    <div className='position-manager-total-liquidity-amount'>
                        <span className='white'>TOTAL LIQUIDITY</span>
                        <span className='green amount'>$600.39</span>
                    </div>
                </div>
                <PositionHeader
                    positionType={positionType}
                    onArrow={() => handleOnArrow()}
                />
                <div className='position-container'>
                    <div className='position-container-header'>
                        <span>ACTIVE V3 POSITIONS</span>
                        <img
                            src={v3Open ? pngChevronUp : pngChevronDown}
                            onClick={(e) => setV3Open(!v3Open)}
                        />
                    </div>
                    {v3Open && (
                        <div className='position-list'>
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 200 : -22.34
                                }
                                onSelect={() => onSelectPosition()}
                            />
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 150 : -83
                                }
                                onSelect={() => onSelectPosition()}
                            />
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 300 : -400
                                }
                                onSelect={() => onSelectPosition()}
                            />
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 9800 : -1442
                                }
                                onSelect={() => onSelectPosition()}
                            />
                        </div>
                    )}
                </div>
                <div className='position-container'>
                    <div className='position-container-header'>
                        <span>ACTIVE V2 POSITIONS</span>
                        <img
                            src={v2Open ? pngChevronUp : pngChevronDown}
                            onClick={(e) => setV2Open(!v2Open)}
                        />
                    </div>
                    {v2Open && (
                        <div className='position-list'>
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 200 : -22.34
                                }
                            />
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 150 : -83
                                }
                            />
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 300 : -400
                                }
                            />
                            <PositionItem
                                liquidity={
                                    positionType === 'positive' ? 9800 : -1442
                                }
                            />
                        </div>
                    )}
                </div>
                <div className='position-container'>
                    <div className='position-container-header'>
                        <span>CLOSED POSITIONS</span>
                        <img
                            src={closedOpen ? pngChevronUp : pngChevronDown}
                            onClick={(e) => setClosedOpen(!closedOpen)}
                        />
                    </div>
                    {closedOpen && (
                        <div className='position-list'>
                            <PositionItem
                                active={false}
                                closedDate='JUNE 2021'
                            />
                            <PositionItem
                                active={false}
                                closedDate='SEPTEMBER 2020'
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PositionManagerContainer;
