import {
    useState,
    useContext,
    createContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { PoolSearch } from 'components/pool-search';
import { Box } from '@material-ui/core';
import { AddLiquidityV3 } from 'components/add-liquidity/add-liquidity-v3';
import { useBalance } from 'hooks/use-balance';
import {
    usePoolOverview,
    useTopPools,
    useRandomPool,
} from 'hooks/data-fetchers';
import { useWallet } from 'hooks/use-wallet';
import { debug } from 'util/debug';
import { EthGasPrices } from '@sommelier/shared-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faCog } from '@fortawesome/free-solid-svg-icons';
import './liquidity-container.scss';
import { ThreeDots } from 'react-loading-icons';
import classNames from 'classnames';

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
    slippageTolerance: 3.0,
};
export const LiquidityContext = createContext<Partial<LiquidityContext>>(
    initialContext,
);

// const SearchHeader = ({
//     setPoolId,
// }: {
//     setPoolId: Dispatch<SetStateAction<string | null>>;
// }) => {
//     return (
//         <>
//             <Box
//                 display='flex'
//                 justifyContent='space-between'
//                 flexDirection='column'
//                 className='search-header'
//             >
//                 <div style={{ fontSize: '1', color: 'var(--faceDeep)' }}>
//                     {'Search Pairings'}
//                 </div>
//                 &nbsp;
//                 <PoolSearch setPoolId={setPoolId} />
//                 {/* <div className='transaction-settings'>
//                     <FontAwesomeIcon icon={faCog} />
//                 </div> */}
//             </Box>
//         </>
//     );
// };

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

export const LiquidityContainer = ({
    gasPrices,
    poolId,
    onRefreshPool,
    handleWalletConnect,
}: {
    gasPrices: EthGasPrices | null;
    poolId: string;
    onRefreshPool: () => void;
    handleWalletConnect: () => void;
}): JSX.Element => {
    const { wallet } = useWallet();

    // const { data: pools, isLoading: isTopPoolsLoading } = useTopPools();
    // const { data: pool } = usePoolOverview(wallet.network, poolId);
    // const [slippageTolerance, setSlippageTolerance] = useState(3.0);
    // const [selectedGasPrice, setSelectedGasPrice] = useState<GasPriceSelection>(
    //     GasPriceSelection.Fast,
    // );
    // const balances = useBalance({
    //     pool,
    // });
    // debug.poolId = poolId;
    // debug.balances = balances;

    const [currentItem, setCurrentItem] = useState<number>(0);

    const { data: randomPool } = usePoolOverview(wallet.network, poolId);
    const { data: nanaPool } = usePoolOverview(
        wallet.network,
        `0xea7ef4f39eb2320a0e23c8ce1131d2c3f67097fd`,
    );

    const randomPoolBalances = useBalance({ pool: randomPool });
    const nanaPoolBalances = useBalance({ pool: nanaPool });

    const [view, setView] = useState('pairs');

    const handleSkip = (status: number) => {
        if (!wallet.account) {
            handleWalletConnect();
            return;
        }

        if (status === 1) {
            setCurrentItem(1);
            return;
        }
        const skipStatus = storage.getSkip();

        if (skipStatus === 'off') {
            storage.setSkipStatus('on');
            storage.setLastSkipTime(Math.floor(Date.now() / 1000));
        }

        setView('wait');
    };

    const handleSkipFinish = () => {
        if (storage.getSkip() === 'on') {
            console.log('skip finish');
            storage.setSkipStatus('off');
            storage.setCurrentPoolId('');
            onRefreshPool();
            setView('pairs');
        }
    };

    const handleClickLeft = () => {
        setCurrentItem(0);
    };

    const handleClickRight = () => {
        setCurrentItem(1);
    };

    return (
        <>
            {randomPool && nanaPool && view === 'pairs' && (
                <div className='carousel-container'>
                    <Carousel
                        showArrows={false}
                        showIndicators={false}
                        showStatus={false}
                        selectedItem={currentItem}
                    >
                        <div className='liquidity-carousel-item'>
                            <Box className='liquidity-container'>
                                <AddLiquidityV3
                                    pool={randomPool}
                                    balances={randomPoolBalances}
                                    gasPrices={gasPrices}
                                    level={level}
                                    leftArrow={false}
                                    rightArrow={true}
                                    onSkipPairs={() => handleSkip(1)}
                                    onLeft={() => handleClickLeft()}
                                    onRight={() => handleClickRight()}
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
                                    leftArrow={true}
                                    rightArrow={false}
                                    onSkipPairs={() => handleSkip(2)}
                                    onLeft={() => handleClickLeft()}
                                    onRight={() => handleClickRight()}
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
