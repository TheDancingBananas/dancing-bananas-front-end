/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer } from 'react';

import './cart-container.scss';

import pngBananaBasket from 'styles/images/banana-basket.png';
import pngArrowLeft from 'styles/images/left.png';
import pngYFIToken from 'styles/images/tokens/yfi.png';
import pngETHToken from 'styles/images/eth.png';
import pngBanana1 from 'styles/images/banana-1.png';
import pngDancingBanana from 'styles/images/dancing-banana.png';

const CartContainer = ({
    onBack,
}: {
    onBack: () => void;
}): JSX.Element | null => {
    return (
        <div className='cart-container'>
            <div className='cart-container-head'>
                <img
                    className='back-image'
                    src={pngArrowLeft}
                    onClick={(e) => onBack()}
                />
                <img className='head-image' src={pngBananaBasket} />
            </div>
            <div className='cart-container-card'>
                <h1 className='cart-title'>BANANA BASKET</h1>
                <div className='cart-table'>
                    <div className='cart-table-header'>
                        <div className='cart-header-col'>MARKET</div>
                        <div className='cart-header-col'>MOVE TYPE</div>
                        <div className='cart-header-col'>AMOUNT</div>
                    </div>
                    <div className='cart-table-row'>
                        <div className='cart-table-col left'>
                            <img className='cart-table-img' src={pngYFIToken} />
                            <span className='cart-table-text1'>YFI</span>
                        </div>
                        <div className='cart-table-col center'>
                            <span className='cart-table-text2'>ADD</span>
                        </div>
                        <div className='cart-table-col right'>
                            <img className='cart-table-img' src={pngETHToken} />
                            <span className='cart-table-text1'>0.13</span>
                        </div>
                    </div>
                    <div className='cart-table-row'>
                        <div className='cart-table-col left'>
                            <img className='cart-table-img' src={pngYFIToken} />
                            <span className='cart-table-text1'>YFI</span>
                        </div>
                        <div className='cart-table-col center'>
                            <span className='cart-table-text2'>ADD</span>
                        </div>
                        <div className='cart-table-col right'>
                            <img className='cart-table-img' src={pngETHToken} />
                            <span className='cart-table-text1'>0.13</span>
                        </div>
                    </div>
                    <div className='cart-table-row'>
                        <div className='cart-table-col left'>
                            <img className='cart-table-img' src={pngYFIToken} />
                            <span className='cart-table-text1'>YFI</span>
                        </div>
                        <div className='cart-table-col center'>
                            <span className='cart-table-text2'>ADD</span>
                        </div>
                        <div className='cart-table-col right'>
                            <img className='cart-table-img' src={pngETHToken} />
                            <span className='cart-table-text1'>0.13</span>
                        </div>
                    </div>
                </div>
                <div className='cart-award'>
                    <div className='cart-award-item'>
                        <div className='cart-award-title'>NANAS AWARDED</div>
                        <div className='cart-award-description'>
                            +15
                            <img src={pngDancingBanana} />
                        </div>
                    </div>
                    <div className='cart-award-item'>
                        <div className='cart-award-title'>LOGIN BONUS</div>
                        <div className='cart-award-description'>
                            +1
                            <img src={pngDancingBanana} />
                        </div>
                    </div>
                </div>
                <div className='cart-action'>
                    <button className='cart-action-move'>
                        MOVE BANANAS
                        <img src={pngBanana1} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartContainer;
