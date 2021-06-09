/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import './wait-container.scss';

import pngTimer from 'styles/images/timer.png';
import pngPaperPlane from 'styles/images/paper-plane.png';

const WaitContainer = (): JSX.Element | null => {
    const [time, setTime] = useState<number>(240);

    const getHours = (time: number): string => {
        const hours = Math.floor(time / 60);
        const mins = time % 60;

        return `${hours}:${mins < 10 ? '0' : ''}${mins}`;
    };

    useEffect(() => {
        let interval: any = null;

        interval = setInterval(() => {
            if (time > 1) {
                setTime(time - 1);
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
                        <CircularProgressbar
                            value={(time / 240) * 100}
                            text={`${getHours(time)}`}
                            strokeWidth={6}
                            styles={buildStyles({
                                pathColor: '#FFDF03',
                                textSize: '25px',
                                textColor: '#fff',
                            })}
                        />
                    </div>
                </div>
                <div className='wait-actions'>
                    <button className='wait-speed-up'>
                        <span>SPEED UP!</span> <img src={pngTimer} />
                    </button>
                    <button className='wait-notify-me'>
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
