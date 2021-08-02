/* eslint-disable react-hooks/rules-of-hooks */
import classNames from 'classnames';

import './exchange-container.scss';

import pngSpeedUp from 'styles/images/shop/Monkey_rocket.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';
import pngClose from 'styles/images/close.png';
import gameData from 'constants/gameData.json';
import { ExchangeData } from 'types/game';

const ExchangeContainer = ({
    exchangeKey,
    onBack,
}: {
    exchangeKey: string | 'speedup';
    onBack: () => void;
}): JSX.Element | null => {
    const item = gameData.exchangeData.find(
        (element) => element.key === exchangeKey,
    );
    let png: any = '';
    switch (exchangeKey) {
        case 'speedup': {
            png = pngSpeedUp;
            break;
        }
    }
    return (
        <div className='exchange-wrapper'>
            <div className='exchange-item'>
                <div className='exchange-item-img'>
                    <img src={png} width={'300px'} />
                </div>
                <h5 className='exchange-item-name'>{item?.title}</h5>
                <p className='exchange-item-desc'>{item?.desc}</p>
                <div className='exchange-item-button' role='button'>
                    <span className='exchange'>Exchange</span>
                    <span>{item?.amount}</span>
                    {` `}
                    <img src={pngDancingBanana} />
                </div>
                <div
                    className='exchange-close-btn'
                    role='button'
                    onClick={() => onBack()}
                >
                    <img src={pngClose} width={'30px'} />
                </div>
            </div>
        </div>
    );
};

export default ExchangeContainer;
