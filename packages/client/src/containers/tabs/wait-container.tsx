/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';

import 'react-circular-progressbar/dist/styles.css';

import './wait-container.scss';

import pngSpeedUp from 'styles/images/shop/Monkey_rocket.png';
import pngPaperPlane from 'styles/images/telegram-108.png';

import { storage, SKIP_DURATION } from 'util/localStorage';

const WaitContainer = ({
    onSkipFinish,
    onGoShop,
}: {
    onSkipFinish: () => void;
    onGoShop: () => void;
}): JSX.Element | null => {
    const [time, setTime] = useState<number>(storage.getRemainingWaitingTime());

    const getHours = (time: number): string => {
        const hours = Math.floor(time / 3600).toString();
        const mins = Math.floor((time % 3600) / 60).toString();
        const seconds = (time % 60).toString();

        return `${('0' + hours).slice(-2)}:${('0' + mins).slice(-2)}:${(
            '0' + seconds
        ).slice(-2)}`;
    };

    const handleClick = (): void => {
        const url = `https://t.me/DancingBananasBot?start=${
            storage.getRemainingWaitingTime() * 1000
        }`;
        window.open(url, '_blank');
    };

    useEffect(() => {
        let interval: any = null;

        interval = setInterval(() => {
            if (time > 1) {
                setTime(time - 1);
            } else {
                clearInterval(interval);
                onSkipFinish();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [time]);

    return (
        <div className='wait-container'>
            <div className='wait-container-card'>
                <h1 className='wait-title'>YOU MUST WAIT...</h1>
                <h2 className='wait-subtitle'>
                    FOR YOUR NEXT DANCING BANANA
                    <br />
                    POOL SELECTION
                </h2>
                <div className='wait-wrapper'>
                    <div style={{ width: 300, height: 300 }}>
                        <CircularProgressbarWithChildren
                            value={
                                ((SKIP_DURATION - time) / SKIP_DURATION) * 100
                            }
                            strokeWidth={6}
                            styles={buildStyles({
                                pathColor: '#FFDF03',
                                textSize: '15px',
                                textColor: '#fff',
                            })}
                        >
                            <div className='wait-timer-text'>{`${getHours(
                                time,
                            )}`}</div>
                            <div className='wait-timer-action'>
                                <button
                                    className='wait-speed-up'
                                    onClick={() => onGoShop()}
                                >
                                    <span>SPEED UP!</span>{' '}
                                    <img src={pngSpeedUp} />
                                </button>
                            </div>
                        </CircularProgressbarWithChildren>
                    </div>
                </div>
                <div className='wait-actions'>
                    <button
                        className='wait-notify-me'
                        onClick={(e) => {
                            handleClick();
                        }}
                    >
                        <span>
                            NOTIFY ME WHEN <br /> THE WAIT IS OVER
                        </span>{' '}
                        <img src={pngPaperPlane} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaitContainer;
