import {
    useState,
    useEffect,
    useContext,
    createContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { PoolSearch } from 'components/pool-search';
import { Box } from '@material-ui/core';
import { AddLiquidityV3 } from 'components/add-liquidity/add-liquidity-v3';
import { Helmet } from 'react-helmet';
import { useLocation, useParams } from 'react-router-dom';
import { useBalance } from 'hooks/use-balance';
import {
    usePoolOverview,
    useTopPools,
    useRandomPool,
} from 'hooks/data-fetchers';
import { useWallet } from 'hooks/use-wallet';
import { debug } from 'util/debug';
import { PoolOverview } from 'hooks/data-fetchers';
import { EthGasPrices } from '@sommelier/shared-types';
import { LiquidityBasketData } from 'types/states';
import { Tabs } from 'types/game';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCog } from '@fortawesome/free-solid-svg-icons';
import './liquidity-container.scss';
import { Circles } from 'react-loading-icons';
import { ethers } from 'ethers';

import 'react-responsive-carousel/lib/styles/carousel.min.css';
import { Carousel } from 'react-responsive-carousel';

import WaitContainer from './tabs/wait-container';

import { storage } from 'util/localStorage';

export enum GasPriceSelection {
    Standard = 'standard',
    Fast = 'fast',
    Fastest = 'fastest',
}

type LiquidityContext = {
    poolId: string | null;
    selectedGasPrice: GasPriceSelection;
    slippageTolerance: number;
    setPoolId: Dispatch<SetStateAction<string | null>>;
    setSelectedGasPrice: Dispatch<SetStateAction<GasPriceSelection>>;
    setSlippageTolerance: Dispatch<SetStateAction<number>>;
};

const initialContext = {
    poolId: null,
    selectedGasPrice: GasPriceSelection.Standard,
    slippageTolerance: 2.0,
};
export const LiquidityContext = createContext<Partial<LiquidityContext>>(
    initialContext,
);

// const TransactionSettings = ({
//     gasPrices,
// }: {
//     gasPrices: EthGasPrices | null;
// }) => {
//     // TODO why does TS think this could be undefined ?
//     const { selectedGasPrice, setSelectedGasPrice } = useContext(
//         LiquidityContext,
//     );

//     // TODO show loader only for prices
//     const isStandardActive = selectedGasPrice === GasPriceSelection.Standard;
//     const isFastActive = selectedGasPrice === GasPriceSelection.Fast;
//     const isFastestActive = selectedGasPrice === GasPriceSelection.Fastest;

//     return (
//         <div style={{ padding: '1rem', paddingTop: '0' }}>
//             <p style={{ marginBottom: '1rem' }}>Select Transaction Speed</p>
//             {setSelectedGasPrice && (
//                 <Box
//                     display='flex'
//                     alignItems='center'
//                     justifyContent='space-between'
//                     className='transaction-speed'
//                 >
//                     <div
//                         className={classNames({ active: isStandardActive })}
//                         onClick={() =>
//                             setSelectedGasPrice(GasPriceSelection.Standard)
//                         }
//                     >
//                         {isStandardActive && (
//                             <FontAwesomeIcon icon={faCheckCircle} />
//                         )}
//                         <span>
//                             Standard{' '}
//                             {gasPrices?.standard ?? <ThreeDots width='24px' />}{' '}
//                             Gwei
//                         </span>
//                     </div>
//                     <div
//                         className={classNames({ active: isFastActive })}
//                         onClick={() =>
//                             setSelectedGasPrice(GasPriceSelection.Fast)
//                         }
//                     >
//                         {isFastActive && (
//                             <FontAwesomeIcon icon={faCheckCircle} />
//                         )}
//                         <span>
//                             Fast {gasPrices?.fast ?? <ThreeDots width='24px' />}{' '}
//                             Gwei
//                         </span>
//                     </div>
//                     <div
//                         className={classNames({ active: isFastestActive })}
//                         onClick={() =>
//                             setSelectedGasPrice(GasPriceSelection.Fastest)
//                         }
//                     >
//                         {isFastestActive && (
//                             <FontAwesomeIcon icon={faCheckCircle} />
//                         )}
//                         <span>
//                             Fastest{' '}
//                             {gasPrices?.fastest ?? <ThreeDots width='24px' />}{' '}
//                             Gwei
//                         </span>
//                     </div>
//                 </Box>
//             )}
//         </div>
//     );
// };

const level = 1;

const ErrorBox = ({ msg }: { msg: string }) => (
    <Box style={{ textAlign: 'center' }} className='alert-well'>
        {msg}
    </Box>
);

const LoadingPoolBox = ({ msg }: { msg: string }) => (
    <Box style={{ textAlign: 'center' }}>
        <Circles width='24px' height='24px' />
        {msg}
    </Box>
);
export const LiquidityContainer = ({
    gasPrices,
    poolId,
    basket,
    poolIndex,
    poolCount,
    onRefreshPool,
    handleWalletConnect,
    onAddBasket,
    onAddSuccess,
    onStatus,
    handleChangeTab,
    handleChangePoolIndex,
}: {
    gasPrices: EthGasPrices | null;
    poolId: string;
    basket: LiquidityBasketData[];
    poolIndex: number;
    poolCount: number;
    onRefreshPool: () => void;
    handleWalletConnect: () => void;
    onAddBasket: (data: LiquidityBasketData, navigateToBasket: boolean) => void;
    onAddSuccess: () => void;
    onStatus: (status: boolean, time?: number) => void;
    handleChangeTab: (t: Tabs) => void;
    handleChangePoolIndex: (i: number) => void;
}): JSX.Element => {
    const { wallet } = useWallet();
    const currentLevel = storage.getLevel();

    const { data: randomPool } = usePoolOverview(wallet.network, poolId);

    // NANA: WETH-TRU for test
    const { data: nanaPool } = usePoolOverview(
        wallet.network,
        `0x86e69d1ae728c9cd229f07bbf34e01bf27258354`,
    );

    const randomPoolBalances = useBalance({ pool: randomPool });
    const nanaPoolBalances = useBalance({ pool: nanaPool });

    const [view, setView] = useState('pairs');

    const handleSkip = (status: number) => {
        if (!wallet.account) {
            handleWalletConnect();
            return;
        }

        if (status === poolCount) {
            if (currentLevel === '1' && basket.length > 0) {
                handleChangeTab('cart');
                return;
            } else {
                // const lastPoolFetchTime = storage.getLastSkipTime();
                // if (lastPoolFetchTime === 0) {
                //     storage.setLastSkipTime(Math.floor(Date.now() / 1000));
                // }

                const skipStatus = storage.getSkip();

                if (skipStatus === 'off') {
                    storage.setSkipStatus('on');
                    storage.setLastSkipTime(Math.floor(Date.now() / 1000));
                }

                setView('wait');
            }

            return;
        }

        handleChangePoolIndex(status);
    };

    const handleAddBasket = (
        data: LiquidityBasketData,
        navigateToBasket: boolean,
    ) => {
        if (!wallet.account) {
            handleWalletConnect();
            return;
        }

        onAddBasket(data, navigateToBasket);

        if (currentLevel === '1') {
            handleChangeTab('cart');
            return;
        }

        if (!navigateToBasket) {
            handleSkip(1);
        }
    };

    const handleSkipFinish = () => {
        if (storage.getSkip() === 'on') {
            console.log('skip finish');
            storage.setSkipStatus('off');
            storage.setCurrentPoolId('');
            onRefreshPool();
            setView('pairs');
            handleChangePoolIndex(0);
        }
    };

    const handleClickLeft = () => {
        handleChangePoolIndex(poolIndex - 1);
    };

    const handleClickRight = () => {
        handleChangePoolIndex(poolIndex - 1);
    };

    return (
        <>
            {randomPool && nanaPool && view === 'pairs' && (
                <div className='carousel-container'>
                    <Carousel
                        showArrows={false}
                        showIndicators={false}
                        showStatus={false}
                        selectedItem={poolIndex}
                        swipeable={false}
                    >
                        <div className='liquidity-carousel-item'>
                            <Box className='liquidity-container'>
                                <AddLiquidityV3
                                    pool={randomPool}
                                    balances={randomPoolBalances}
                                    gasPrices={gasPrices}
                                    level={level}
                                    isNANA={false}
                                    rewardBananas={100}
                                    leftArrow={false}
                                    rightArrow={true}
                                    onSkipPairs={() => handleSkip(1)}
                                    onAddBasket={(data: LiquidityBasketData) =>
                                        handleAddBasket(data, false)
                                    }
                                    onLeft={() => handleClickLeft()}
                                    onRight={() => handleClickRight()}
                                    onAddSuccess={() => onAddSuccess()}
                                    onStatus={(status: boolean, time?: number) =>
                                        onStatus(status, time)
                                    }
                                />
                            </Box>
                        </div>
                        <div className='liquidity-carousel-item'>
                            <Box className='liquidity-container yellow'>
                                <AddLiquidityV3
                                    pool={nanaPool}
                                    balances={nanaPoolBalances}
                                    gasPrices={gasPrices}
                                    level={level}
                                    isNANA={true}
                                    rewardBananas={100}
                                    leftArrow={true}
                                    rightArrow={false}
                                    onSkipPairs={() => handleSkip(2)}
                                    onAddBasket={(data: LiquidityBasketData) =>
                                        handleAddBasket(data, true)
                                    }
                                    onLeft={() => handleClickLeft()}
                                    onRight={() => handleClickRight()}
                                    onAddSuccess={() => onAddSuccess()}
                                    onStatus={(status: boolean, time?: number) =>
                                        onStatus(status, time)
                                    }
                                />
                            </Box>
                        </div>
                    </Carousel>
                </div>
            )}
            {view === 'wait' && (
                <WaitContainer onSkipFinish={() => handleSkipFinish()} />
            )}
        </>
    );
};
