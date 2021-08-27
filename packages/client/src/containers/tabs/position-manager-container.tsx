/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';
import { formatUSD, formatNumber } from 'util/formats';
import { resolveLogo } from 'components/token-with-logo';
import pngX from 'styles/images/X-119.png';
import classNames from 'classnames';

import './position-manager-container.scss';

import pngArrowLeftCircle from 'styles/images/left.png';
import pngArrowLeft from 'styles/images/left-arrow.png';
import pngArrowRight from 'styles/images/right-arrow.png';
import pngChevronDown from 'styles/images/chevron-down.png';
import pngChevronUp from 'styles/images/chevron-up.png';
import pngMonkeyHappy from 'styles/images/monkey-happy.png';
import pngMonkeySad from 'styles/images/monkey-sad.png';
import pngMoneyBranch from 'styles/images/money-branch.png';
import pngDanger from 'styles/images/danger.png';
import pngMoney from 'styles/images/money.png';
import pngTokenCRV from 'styles/images/tokens/CRV.png';
import pngTokenETH from 'styles/images/tokens/ETH.png';

import { V3PositionData } from '@sommelier/shared-types/src/api';
import BigNumber from 'bignumber.js';
type V3PositionDataList = { [key: string]: V3PositionData };

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
    position,
    positive = true,
    active = true,
    closedDate,
    onSelect,
}: {
    position: V3PositionData;
    positive?: boolean | true;
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
                        src={positive ? pngMoney : pngDanger}
                    />
                    <span
                        className={classNames('position-liqudity', {
                            positive,
                        })}
                    >
                        {/* {`${positive ? '+' : '-'} ${formatUSD(
                            position?.stats?.totalFeesUSD?.toString(),
                        )}`} */}
                        {formatUSD(position?.stats?.totalFeesUSD?.toString())}
                    </span>
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
                    <div style={{ height: 39 }}>
                        {resolveLogo(
                            position.position?.pool?.token0?.id,
                            '39px',
                        )}
                    </div>
                    <span>{position.position?.pool?.token0?.symbol}</span>
                </div>
                <div className='position-item-token'>
                    <div style={{ height: 39 }}>
                        {resolveLogo(
                            position.position?.pool?.token1?.id,
                            '39px',
                        )}
                    </div>
                    <span>{position.position?.pool?.token1?.symbol}</span>
                </div>
            </div>
        </div>
    );
};

const PositionManagerContainer = ({
    positionsData,
    onBack,
    onSelectPosition,
}: {
    positionsData: V3PositionDataList;
    onBack: () => void;
    onSelectPosition: (
        position: V3PositionData,
        pt: 'positive' | 'negative',
    ) => void;
}): JSX.Element | null => {
    const [positionType, setPositionType] = useState<'positive' | 'negative'>(
        'positive',
    );
    55;

    const [v3Open, setV3Open] = useState<boolean>(true);
    const [v2Open, setV2Open] = useState<boolean>(true);
    const [closedOpen, setClosedOpen] = useState<boolean>(true);

    const [plusPools, setPlusPools] = useState<V3PositionData[]>([]);
    const [minusPools, setMinusPools] = useState<V3PositionData[]>([]);
    const [closedPools, setClosedPools] = useState<V3PositionData[]>([]);

    const [plusSum, setPlusSum] = useState<BigNumber>(new BigNumber(0));
    const [minusSum, setMinusSum] = useState<BigNumber>(new BigNumber(0));

    const handleOnArrow = () => {
        setV3Open(true);
        setV2Open(true);
        setClosedOpen(true);
        setPositionType(positionType === 'positive' ? 'negative' : 'positive');
    };

    useEffect(() => {
        const pPools: V3PositionData[] = [];
        const mPools: V3PositionData[] = [];
        const cPools: V3PositionData[] = [];

        let pSum: BigNumber = new BigNumber(0);
        let mSum: BigNumber = new BigNumber(0);

        Object.keys(positionsData).forEach((id) => {
            const liquidity = new BigNumber(
                positionsData?.[id]?.position?.liquidity,
            );

            if (liquidity.isZero()) {
                cPools.push(positionsData?.[id]);
            } else {
                // const totalReturn = new BigNumber(
                //     positionsData?.[id]?.stats?.totalReturn,
                // );
                const totalLiquidity = new BigNumber(
                    positionsData?.[id]?.stats?.usdAmount,
                );
                if (totalLiquidity.gt(new BigNumber(100))) {
                    pPools.push(positionsData?.[id]);
                    pSum = pSum.plus(totalLiquidity);
                } else {
                    mPools.push(positionsData?.[id]);
                    mSum = mSum.plus(totalLiquidity);
                }
            }
        });

        setPlusPools(pPools);
        setMinusPools(mPools);
        setClosedPools(cPools);

        setPlusSum(pSum);
        setMinusSum(mSum);
    }, [positionsData]);

    return (
        <div className='position-manager-container'>
            <img className='close-image' src={pngX} onClick={(e) => onBack()} />
            <h1 className='postion-manager-header'>BANANA PORTFOLIO</h1>
            <div className='position-manager-container-card'>
                <div className='position-manager-total-liquidity-wrapper'>
                    <img src={pngMoneyBranch} />
                    <div className='position-manager-total-liquidity-amount'>
                        <span className='white'>TOTAL LIQUIDITY</span>
                        <span className='green amount'>
                            {formatUSD(
                                positionType === 'positive'
                                    ? plusSum.toString()
                                    : minusSum.toString(),
                            )}
                        </span>
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
                            {(positionType === 'positive'
                                ? plusPools
                                : minusPools
                            ).map((position: V3PositionData, index: number) => (
                                <PositionItem
                                    key={`active-position-${index}`}
                                    position={position}
                                    positive={positionType === 'positive'}
                                    active={true}
                                    onSelect={() =>
                                        onSelectPosition(position, positionType)
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
                {/* <div className='position-container'>
                    <div className='position-container-header'>
                        <span>ACTIVE V2 POSITIONS</span>
                        <img
                            src={v2Open ? pngChevronUp : pngChevronDown}
                            onClick={(e) => setV2Open(!v2Open)}
                        />
                    </div>
                    {v2Open && (
                        <div className='position-list'>
                        </div>
                    )}
                </div> */}
                {closedPools.length > 0 && (
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
                                {closedPools.map(
                                    (
                                        position: V3PositionData,
                                        index: number,
                                    ) => (
                                        <PositionItem
                                            key={`closed-position-${index}`}
                                            position={position}
                                            positive={
                                                positionType === 'positive'
                                            }
                                            active={false}
                                            closedDate='SEPTEMBER 2020'
                                            onSelect={() =>
                                                onSelectPosition(
                                                    position,
                                                    positionType,
                                                )
                                            }
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PositionManagerContainer;
