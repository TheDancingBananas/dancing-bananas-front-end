/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useContext, useEffect, useReducer, useMemo } from 'react';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { Price, Token } from '@uniswap/sdk-core';
import {
    FeeAmount,
    Pool,
    Position,
    priceToClosestTick,
    tickToPrice,
    TickMath,
} from '@uniswap/v3-sdk';
import { resolveLogo } from 'components/token-with-logo';
import { TokenWithBalance } from 'components/token-with-balance';
import './add-liquidity-v3.scss';
import 'rc-slider/assets/index.css';
import { Box } from '@material-ui/core';
import config from 'config/app';
import erc20Abi from 'constants/abis/erc20.json';
import addLiquidityAbi from 'constants/abis/uniswap_v3_add_liquidity.json';
import { LiquidityContext } from 'containers/liquidity-container';
import { TokenInput } from 'components/token-input';
import { toastSuccess, toastWarn, toastError } from 'util/toasters';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faBan,
    faExchangeAlt,
    faCopy,
    faAngleDoubleDown,
    faAngleDoubleUp,
    faArrowsAltV,
} from '@fortawesome/free-solid-svg-icons';
import { ThreeDots } from 'react-loading-icons';
import { compactHash } from 'util/formats';
import {
    WalletBalances,
    BoundsState,
    TokenInputAmount,
    LiquidityBasketData,
} from 'types/states';
import { useWallet } from 'hooks/use-wallet';
import { usePendingTx, PendingTx } from 'hooks/use-pending-tx';
import { useMarketData } from 'hooks';
import { LiquidityActionButton } from 'components/add-liquidity/liquidity-action-button';
import { EthGasPrices, LiquidityBand } from '@sommelier/shared-types';
import { PoolOverview } from 'hooks/data-fetchers';
import { debug } from 'util/debug';
import Sentry, { SentryError } from 'util/sentry';
import { formatUSD, formatNumber } from 'util/formats';
import { trackSentimentInteraction, trackAddLiquidityTx } from 'util/mixpanel';
import classNames from 'classnames';

import pngApyHappy from 'styles/images/apy-happy.png';
import pngApyNormal from 'styles/images/apy-normal.png';
import pngApySad from 'styles/images/apy-sad.png';
import pngETH from 'styles/images/eth.png';
import pngNANA from 'styles/images/tokens/nana.png';
import pngBanana2 from 'styles/images/banana-2.png';
import gifBonusBanana from 'styles/images/Bonus_bananas.gif';

import AlertModal from './alert-modal';

import { getEstimateTime } from 'services/api-etherscan';
import { storage } from 'util/localStorage';

type Props = {
    balances: WalletBalances;
    pool: PoolOverview | null;
    shortUrl?: string | null;
    gasPrices: EthGasPrices | null;
    level: number;
    isNANA: boolean | false;
    rewardBananas: number;
    leftArrow: boolean | false;
    rightArrow: boolean | false;
    defaultValue: any;
    onSkipPairs: () => void;
    onAddBasket: (data: LiquidityBasketData) => void;
    onLeft: () => void;
    onRight: () => void;
    onAddSuccess: () => void;
    onStatus: (status: boolean, time?: number) => void;
};

export type Sentiment = 'bullish' | 'bearish' | 'neutral';

const ETH_ID = config.ethAddress;

export const AddLiquidityV3 = ({
    pool,
    balances,
    shortUrl,
    gasPrices,
    level,
    isNANA,
    rewardBananas,
    leftArrow,
    rightArrow,
    defaultValue,
    onSkipPairs,
    onAddBasket,
    onLeft,
    onRight,
    onAddSuccess,
    onStatus,
}: Props): JSX.Element | null => {
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertTitle, setAlertTitle] = useState<string>('');
    const [alertDescription, setAlertDescription] = useState<string>('');

    const handleCloseAlert = () => setShowAlert(false);

    const [priceImpact, setPriceImpact] = useState('0');
    const [pendingApproval, setPendingApproval] = useState(false);
    const { setPendingTx } = usePendingTx();
    const token0 = pool?.token0?.id ?? '';
    const token1 = pool?.token1?.id ?? '';
    const token0Symbol = pool?.token0?.symbol ?? '';
    const token1Symbol = pool?.token1?.symbol ?? '';
    const [disabledInput, setDisabledInput] = useState<string[] | null>(null);
    const [warning, setWarning] = useState<{
        status: boolean;
        message?: JSX.Element;
    }>({ status: false, message: <p>Warning placeholder</p> });
    const [isFlipped, setIsFlipped] = useState<boolean>(false);
    // State here is used to compute what tokens are being used to add liquidity with.
    const [copiedShortUrl, setCopiedShortUrl] = useState<boolean>(false);
    const currentBasketData = storage.getBasketData();
    const [basketData, setBasketData] = useState<LiquidityBasketData[]>(
        currentBasketData,
    );

    const initialState: Record<string, any> = useMemo(
        () => ({
            [token0Symbol]: {
                id: pool?.token0?.id,
                name: pool?.token0?.name,
                symbol: pool?.token0?.symbol,
                amount: defaultValue[token0Symbol] ?? '',
                selected: false,
            },
            [token1Symbol]: {
                id: pool?.token1?.id,
                name: pool?.token1?.name,
                symbol: pool?.token1?.symbol,
                amount: defaultValue[token1Symbol] ?? '',
                selected: false,
            },
            ETH: {
                id: ETH_ID,
                symbol: 'ETH',
                name: 'Ethereum',
                amount: defaultValue['ETH'] ?? '',
                selected: true,
            },
            selectedTokens: ['ETH'],
        }),
        [
            pool?.token0?.id,
            pool?.token0?.name,
            pool?.token0?.symbol,
            pool?.token1?.id,
            pool?.token1?.name,
            pool?.token1?.symbol,
            token0Symbol,
            token1Symbol,
        ],
    );

    const init = (initialState: Record<string, any>) => {
        return initialState;
    };

    const getBasketTokenAmount = (tokenSymbol: any) => {
        const lToken0TotalAmount = basketData
            .map((data) =>
                data.lToken0Name === tokenSymbol ? data.lToken0Amount : 0,
            )
            .reduce((sum, value) => sum + Number(value), 0);
        const lToken1TotalAmount = basketData
            .map((data) =>
                data.lToken1Name === tokenSymbol
                    ? Number(data.lToken1Amount)
                    : 0,
            )
            .reduce((sum, value) => sum + Number(value), 0);
        return (
            lToken0TotalAmount +
            lToken1TotalAmount -
            Number(initialState[tokenSymbol.toString()].amount)
        );
    };

    const reducer = (
        state: { [x: string]: any },
        action: {
            type: any;
            payload: { sym: any; amount?: any } | Record<string, any>;
        },
    ) => {
        let sym: string;
        let amt: string;
        let selectedSymbols: Array<string>;
        const orderedSymbols: Array<string> = [];
        // eslint-disable-next-line no-debugger
        switch (action.type) {
            case 'toggle':
                sym = action.payload.sym;
                // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
                selectedSymbols = state[sym].selected
                    ? state.selectedTokens.filter(
                          (symbol: string) => symbol !== sym,
                      )
                    : [...state.selectedTokens, sym];

                // Ensure ordering of selected symbols
                [pool!.token0.symbol, pool!.token1.symbol].forEach(
                    (pairSymbol) => {
                        if (selectedSymbols.includes(pairSymbol)) {
                            orderedSymbols.push(pairSymbol);
                        } else if (
                            pairSymbol === 'WETH' &&
                            selectedSymbols.includes('ETH')
                        ) {
                            orderedSymbols.push('ETH');
                        }
                    },
                );

                return {
                    ...state,
                    selectedTokens: orderedSymbols,
                    [sym]: { ...state[sym], selected: !state[sym].selected },
                };
            case 'update-amount':
                sym = action.payload.sym;
                amt = action.payload.amount;
                console.log('redux log', sym, amt);
                return {
                    ...state,
                    [sym]: { ...state[sym], amount: amt },
                };
            case 'reset':
                return init(action.payload);
            default:
                throw new Error();
        }
    };

    const [tokenInputState, dispatch] = useReducer(reducer, initialState, init);

    // const [token, setToken] = useState('ETH');
    // TODO calculate price impact
    const { selectedGasPrice, slippageTolerance } = useContext(
        LiquidityContext,
    );
    let currentGasPrice: number | null = null;
    // if (gasPrices && selectedGasPrice) {
    //     currentGasPrice = gasPrices[selectedGasPrice];
    // }
    // For Level 1 is Standard
    if (gasPrices) {
        currentGasPrice = gasPrices.fast;
    }

    const [sentiment, setSentiment] = useState<Sentiment>('neutral');
    const [bounds, setBounds] = useState<BoundsState>({
        prices: [0, 0],
        ticks: [0, 0],
    });
    const [pendingBounds, setPendingBounds] = useState<boolean>(true);
    const [expectedAmounts, setExpectedAmounts] = useState<
        [BigNumber, BigNumber]
    >([new BigNumber(0), new BigNumber(0)]);
    const { wallet } = useWallet();

    useEffect(() => {
        dispatch({ type: 'reset', payload: initialState });
    }, [initialState, pool]);
    let provider: ethers.providers.Web3Provider | null = null;
    if (wallet.provider) {
        provider = new ethers.providers.Web3Provider(wallet?.provider);
    }

    (window as any).pool = pool;
    // const token0 = pool?.token0?.id ?? '';
    // const token1 = pool?.token1?.id ?? '';

    const { newPair: marketData, indicators } = useMarketData(
        pool,
        wallet.network,
    );
    debug.marketData = marketData;
    debug.indicators = indicators;
    debug.tokenInputState = tokenInputState;
    const getTokensWithAmounts = () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return tokenInputState.selectedTokens.map(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            (symbol: string) => tokenInputState[symbol],
        );
    };

    debug.selectedTokens = getTokensWithAmounts();
    const SELECTED_INDICATOR_NAME = 'bollingerEMANormalBand';
    const currentPrice = parseFloat(pool?.token0Price || '0');

    const getUniSDKInstances = () => {
        if (!pool) throw new Error('Cannot get UNI SDK instances without pool');

        const baseTokenCurrency = new Token(
            Number(wallet.network),
            pool.token0.id,
            Number(pool.token0.decimals),
            pool.token0.symbol,
            pool.token0.name,
        );

        const quoteTokenCurrency = new Token(
            Number(wallet.network),
            pool.token1.id,
            Number(pool.token1.decimals),
            pool.token1.symbol,
            pool.token1.name,
        );

        const uniPool = new Pool(
            baseTokenCurrency,
            quoteTokenCurrency,
            (parseInt(pool.feeTier, 10) as any) as FeeAmount,
            pool.sqrtPrice,
            pool.liquidity,
            parseInt(pool.tick || '0', 10),
            [],
        );

        return { baseTokenCurrency, quoteTokenCurrency, uniPool };
    };

    const getBoundPricesAndTicks = ([lowerBound, upperBound]: [
        number,
        number,
    ]) => {
        const {
            baseTokenCurrency,
            quoteTokenCurrency,
            uniPool,
        } = getUniSDKInstances();

        (window as any).uni = {
            baseTokenCurrency,
            quoteTokenCurrency,
            uniPool,
        };
        (window as any).bounds = bounds;

        debug.lowerBound = lowerBound;
        debug.upperBound = upperBound;

        let lowerBoundTick: number;

        if (lowerBound > 0) {
            const lowerBoundNumerator = ethers.utils
                .parseUnits(
                    new BigNumber(lowerBound).toFixed(
                        baseTokenCurrency.decimals,
                    ),
                    baseTokenCurrency.decimals,
                )
                .toString();

            const lowerBoundDenominator = ethers.utils
                .parseUnits('1', quoteTokenCurrency.decimals)
                .toString();

            // Convert to lower tick and upper ticks
            const lowerBoundPrice = new Price(
                baseTokenCurrency,
                quoteTokenCurrency,
                lowerBoundNumerator,
                lowerBoundDenominator,
            );

            (window as any).lowerBoundPrice = lowerBoundPrice;

            lowerBoundTick = priceToClosestTick(lowerBoundPrice);
            lowerBoundTick -= lowerBoundTick % uniPool.tickSpacing;
        } else {
            lowerBoundTick = TickMath.MIN_TICK + uniPool.tickSpacing;
            lowerBoundTick -= lowerBoundTick % uniPool.tickSpacing;
        }

        const upperBoundNumerator = ethers.utils
            .parseUnits(
                new BigNumber(upperBound).toFixed(baseTokenCurrency.decimals),
                baseTokenCurrency.decimals,
            )
            .toString();

        const upperBoundDenominator = ethers.utils
            .parseUnits('1', quoteTokenCurrency.decimals)
            .toString();

        const upperBoundPrice = new Price(
            baseTokenCurrency,
            quoteTokenCurrency,
            upperBoundNumerator,
            upperBoundDenominator,
        );

        (window as any).upperBoundPrice = upperBoundPrice;

        let upperBoundTick = Math.min(
            TickMath.MAX_TICK,
            priceToClosestTick(upperBoundPrice),
        );
        upperBoundTick -= upperBoundTick % uniPool.tickSpacing;

        const sortedTicks = [lowerBoundTick, upperBoundTick].sort(
            (a, b) => a - b,
        ) as [number, number];
        const priceLower = tickToPrice(
            baseTokenCurrency,
            quoteTokenCurrency,
            sortedTicks[0],
        );
        const priceUpper = tickToPrice(
            baseTokenCurrency,
            quoteTokenCurrency,
            sortedTicks[1],
        );

        return {
            prices: [lowerBound, upperBound] as [number, number],
            ticks: sortedTicks,
            ticksFromPrice: [priceLower, priceUpper] as [Price, Price],
        };
    };

    const handleTokenRatio = (
        selectedToken: string,
        selectedAmount: string,
    ) => {
        const totalAmount = selectedAmount;

        if (Number.isNaN(totalAmount) || !totalAmount || !pool) {
            return;
        }

        console.log('poolinfo', pool);

        if (!isWETHPair && selectedToken === 'ETH') {
            const totalLockedUSD = new BigNumber(pool.totalValueLockedUSD);
            const totalLockedETH = new BigNumber(pool.totalValueLockedETH);

            const ethPrice: BigNumber = totalLockedUSD.div(totalLockedETH);

            const shouldToken0SelectedAmount = new BigNumber(
                selectedAmount,
            ).div(new BigNumber(pool.token0.derivedETH));

            console.log('update action', {
                type: 'update-amount',
                payload: {
                    sym: pool.token0.symbol,
                    amount: shouldToken0SelectedAmount.toString(),
                },
            });
            dispatch({
                type: 'update-amount',
                payload: {
                    sym: pool.token0.symbol,
                    amount: shouldToken0SelectedAmount.toString(),
                },
            });
            console.log('eth in non-eth pool');
            console.log(
                pool.token0.symbol,
                shouldToken0SelectedAmount.toString(),
            );
            handleTokenRatio(
                pool.token0.symbol,
                shouldToken0SelectedAmount.toString(),
            );

            return;
        }

        let expectedBaseAmount: BigNumber, expectedQuoteAmount: BigNumber;

        if (selectedToken === 'ETH') {
            if (pool.token0.symbol === 'WETH') {
                // selected token is base
                expectedBaseAmount = new BigNumber(totalAmount);
                expectedQuoteAmount = expectedBaseAmount.div(currentPrice);
            } else {
                // selected token is quote
                expectedQuoteAmount = new BigNumber(totalAmount);
                expectedBaseAmount = expectedQuoteAmount.times(currentPrice);
            }
        } else if (selectedToken === pool.token0.symbol) {
            // selected token is base
            expectedBaseAmount = new BigNumber(totalAmount);
            expectedQuoteAmount = expectedBaseAmount.div(currentPrice);
        } else {
            // selected token is quote
            expectedQuoteAmount = new BigNumber(totalAmount);
            expectedBaseAmount = expectedQuoteAmount.times(currentPrice);
        }

        setExpectedAmounts([expectedBaseAmount, expectedQuoteAmount]);

        debug.indicators = indicators;

        if (indicators) {
            const bounds = handleBounds(pool, indicators, [
                expectedBaseAmount,
                expectedQuoteAmount,
            ]);

            if (!bounds) {
                return;
            }

            const { newAmount0, newAmount1 } = bounds;

            let updatedToken;

            if (selectedToken === 'ETH') {
                updatedToken =
                    pool.token0.symbol === 'WETH' ? 'token0' : 'token1';
            } else {
                updatedToken =
                    selectedToken === pool.token0.symbol ? 'token0' : 'token1';
            }

            const otherToken = updatedToken === 'token0' ? 'token1' : 'token0';

            let updatedAmount =
                updatedToken === 'token0' ? newAmount0 : newAmount1;
            let otherAmount =
                updatedToken === 'token0' ? newAmount1 : newAmount0;

            // Need to scale up certain amounts based on output of position. Position.fromAmounts
            // assumes you have the 'maximum' of each token. So if we update one token our liquidity
            // is less heavily weighted towards, we won't have enough of the other token. So we need to
            // scale it up.

            if (updatedAmount.isZero()) {
                // It means getting position is failed.
                otherAmount = expectedBaseAmount;

                updatedAmount = expectedQuoteAmount;
            } else if (updatedAmount.lt(new BigNumber(selectedAmount))) {
                // We ended up with less, so we need to scale up
                const scale = new BigNumber(selectedAmount).div(updatedAmount);

                updatedAmount = updatedAmount.times(scale);

                otherAmount = otherAmount.times(scale);
            }

            dispatch({
                type: 'update-amount',
                payload: {
                    sym: pool[otherToken].symbol,
                    amount: otherAmount.toFixed(),
                },
            });

            if (pool[otherToken].symbol === 'WETH') {
                dispatch({
                    type: 'update-amount',
                    payload: {
                        sym: 'ETH',
                        amount: otherAmount.toFixed(),
                    },
                });
            } else if (selectedToken === 'ETH') {
                dispatch({
                    type: 'update-amount',
                    payload: {
                        sym: 'WETH',
                        // amount: updatedAmount.toFixed(),
                        amount: selectedAmount,
                    },
                });
            } else if (selectedToken === 'WETH') {
                dispatch({
                    type: 'update-amount',
                    payload: {
                        sym: 'ETH',
                        // amount: updatedAmount.toFixed(),
                        amount: selectedAmount,
                    },
                });
            }
        }
    };

    const handleBounds = (
        pool: PoolOverview,
        indicators: { [indicatorName: string]: LiquidityBand },
        expectedAmounts: [BigNumber, BigNumber],
    ) => {
        if (!pool) return;

        const [expectedBaseAmount, expectedQuoteAmount] = expectedAmounts;

        if (expectedBaseAmount.eq(0) && expectedQuoteAmount.eq(0)) {
            return;
        }

        const {
            baseTokenCurrency,
            quoteTokenCurrency,
            uniPool,
        } = getUniSDKInstances();

        (window as any).uni = {
            baseTokenCurrency,
            quoteTokenCurrency,
            uniPool,
        };
        (window as any).bounds = bounds;

        const { prices, ticks, ticksFromPrice } = getBoundPricesAndTicks(
            indicators[SELECTED_INDICATOR_NAME].bounds[sentiment],
        );

        const [lowerBound, upperBound] = prices;

        const baseAmount0 = ethers.utils
            .parseUnits(
                expectedBaseAmount.toFixed(Number(pool.token0.decimals)),
                pool.token0.decimals,
            )
            .toString();

        const baseAmount1 = ethers.utils
            .parseUnits(
                expectedQuoteAmount.toFixed(Number(pool.token1.decimals)),
                pool.token1.decimals,
            )
            .toString();

        const position = Position.fromAmounts({
            pool: uniPool,
            tickLower: ticks[0],
            tickUpper: ticks[1],
            amount0: baseAmount0,
            amount1: baseAmount1,
        });

        (window as any).position = position;

        setBounds({
            prices,
            ticks,
            ticksFromPrice,
            position,
        });

        setPendingBounds(false);

        if (currentPrice < lowerBound || currentPrice > upperBound) {
            const singleSideSymbol =
                currentPrice < lowerBound
                    ? pool.token1.symbol
                    : pool.token0.symbol;
            const disabledSymbols =
                singleSideSymbol === pool.token0.symbol
                    ? [pool.token1.symbol]
                    : [pool.token0.symbol];

            if (disabledSymbols[0] === 'WETH') {
                disabledSymbols.push('ETH');
            }

            setWarning({
                status: true,
                message: (
                    <p>
                        Warning: the current price of this pair does not fall
                        within the suggested liquidity range. This can happen in
                        volatile markets.
                        <br />
                        <br />
                        If you still want to add liquidity, your initial
                        position will be composed entirely of {singleSideSymbol}
                        . Your token allocation will start to rebalance once the
                        price comes within range.
                    </p>
                ),
            });

            setDisabledInput(disabledSymbols);
        } else {
            setWarning({ status: false });
            setDisabledInput(null);
        }

        // Change position to match mint amounts
        if (
            position.mintAmounts.amount0.toString() === '0' &&
            position.mintAmounts.amount1.toString() === '0'
        ) {
            return;
        }

        const newAmount0 = new BigNumber(
            ethers.utils.formatUnits(
                position.mintAmounts.amount0.toString(),
                pool.token0.decimals,
            ),
        );

        const newAmount1 = new BigNumber(
            ethers.utils.formatUnits(
                position.mintAmounts.amount1.toString(),
                pool.token1.decimals,
            ),
        );

        const ethAmount =
            pool.token0.symbol === 'WETH' ? newAmount0 : newAmount1;

        return {
            newAmount0,
            newAmount1,
            ethAmount,
        };
    };

    const handleGasEstimationError = (
        err: Error,
        payload: Record<string, any> = {},
    ): undefined => {
        // We could not estimate gas, for whaever reason, so we should not let the transaction continue.
        const notEnoughETH =
            err.message.match(/exceeds allowance/) ||
            err.message.match(/insufficient funds/);
        const highSlippage = err.message.match(/slippage/i);

        let toastMsg =
            'Could not estimate gas for this transaction. Check your parameters or try a different pool.';

        if (notEnoughETH) {
            toastMsg =
                'Not enough ETH to pay gas for this transaction. If you are using ETH, try reducing the entry amount.';
        } else if (highSlippage) {
            toastMsg =
                'Slippage too high to submit this transaction. Try adding a smaller amount or adding both tokens.';
        }

        toastError(toastMsg);

        // Send event to sentry
        const sentryErr = new SentryError(
            `Could not estimate gas: ${err.message}`,
            payload,
        );
        Sentry.captureException(sentryErr);

        return;
    };

    useEffect(() => {
        if (indicators) {
            debug.indicators = indicators;
            const indicator = indicators[SELECTED_INDICATOR_NAME];
            const bounds = getBoundPricesAndTicks(indicator.bounds[sentiment]);
            setBounds(bounds);
            setPendingBounds(false);
        }
    }, [indicators, sentiment]);

    useEffect(() => {
        if (!pool || !indicators) {
            return;
        }

        const getPriceImpact = () => {
            const [expectedBaseAmount, expectedQuoteAmount] = expectedAmounts;

            const expectedQuoteAmountNoSlippage = expectedBaseAmount.times(
                currentPrice,
            );
            const priceImpact = new BigNumber(expectedQuoteAmountNoSlippage)
                .minus(expectedQuoteAmount.toFixed(8))
                .div(expectedQuoteAmountNoSlippage)
                .times(100)
                .toFixed();

            setPriceImpact(priceImpact);

            const bounds = handleBounds(pool, indicators, [
                expectedBaseAmount,
                expectedQuoteAmount,
            ]);

            if (!bounds) {
                return;
            }

            const { newAmount0, newAmount1, ethAmount } = bounds;

            dispatch({
                type: 'update-amount',
                payload: {
                    sym: pool.token0.symbol,
                    amount: newAmount0,
                },
            });

            dispatch({
                type: 'update-amount',
                payload: {
                    sym: pool.token1.symbol,
                    amount: newAmount1,
                },
            });

            dispatch({
                type: 'update-amount',
                payload: {
                    sym: 'ETH',
                    amount: ethAmount,
                },
            });
        };

        getPriceImpact();
    }, [sentiment, pool, wallet.network, currentPrice]);

    if (!pool) return null;

    const doAddLiquidity = async () => {
        if (!pool || !provider || !indicators || !bounds.position) return;
        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        console.log(tokenInputState);

        console.log(pool);

        let hash: string | undefined;
        let addType: string;
        if (tokenInputState.selectedTokens.length === 1) {
            hash = await doOneSidedAdd();
            addType = 'one-sided';
        } else {
            hash = await doTwoSidedAdd();
            addType = 'two-sided';
        }

        if (hash) {
            trackAddLiquidityTx(
                pool,
                sentiment,
                bounds,
                addType,
                getTokensWithAmounts() as Record<string, TokenInputAmount>,
            );

            toastWarn(`Confirming tx ${compactHash(hash)}`);
            setPendingTx &&
                setPendingTx(
                    (state: PendingTx): PendingTx =>
                        ({
                            approval: [...state.approval],
                            confirm: [...state.confirm, hash],
                        } as PendingTx),
                );
            if (provider) {
                const baseGasPrice = ethers.utils
                    .parseUnits(currentGasPrice.toString(), 9)
                    .toString();
                const estimateTime = await getEstimateTime(
                    provider,
                    hash,
                    baseGasPrice,
                );
                onStatus(true, estimateTime);

                const txStatus: ethers.providers.TransactionReceipt = await provider.waitForTransaction(
                    hash,
                );

                const { status } = txStatus;

                onStatus(false);

                if (status === 1) {
                    // toastSuccess(`Confirmed tx ${compactHash(hash)}`);
                    onAddSuccess();
                    setPendingTx &&
                        setPendingTx(
                            (state: PendingTx): PendingTx =>
                                ({
                                    approval: [...state.approval],
                                    confirm: [
                                        ...state.approval.filter(
                                            (hash) => hash !== hash,
                                        ),
                                    ],
                                } as PendingTx),
                        );
                } else {
                    toastError(`Rejected tx ${compactHash(hash)}`);
                    setPendingTx &&
                        setPendingTx(
                            (state: PendingTx): PendingTx =>
                                ({
                                    approval: [...state.approval],
                                    confirm: [
                                        ...state.approval.filter(
                                            (hash) => hash !== hash,
                                        ),
                                    ],
                                } as PendingTx),
                        );
                }
            }
        }
    };

    const doTwoSidedAdd = async (): Promise<string | undefined> => {
        if (
            !pool ||
            !provider ||
            !indicators ||
            !bounds.position ||
            !currentGasPrice
        )
            return;

        const addLiquidityContractAddress =
            config.networks[wallet.network || '1']?.contracts?.ADD_LIQUIDITY_V3;

        if (!addLiquidityContractAddress) {
            throw new Error(
                'Add liquidity contract not available on this network.',
            );
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance
        const addLiquidityContract = new ethers.Contract(
            addLiquidityContractAddress,
            addLiquidityAbi,
            signer,
        );

        debug.contract = addLiquidityContract;

        const isEthAdd = tokenInputState.selectedTokens.includes('ETH');

        const fnName = isEthAdd
            ? 'addLiquidityEthForUniV3'
            : 'addLiquidityForUniV3';

        const tokenId = 0;
        const [expectedBaseAmount, expectedQuoteAmount] = expectedAmounts;

        // TODO: Calculate this once we have price impact
        // let expectedQuoteAmountNoSlippage: BigNumber;
        const expectedQuoteAmountNoSlippage = expectedQuoteAmount;

        // const slippageRatio = new BigNumber(slippageTolerance as number).div(
        //     100
        // );

        const symbol0 = tokenInputState.selectedTokens[0];
        const symbol1 = tokenInputState.selectedTokens[1];

        const mintAmount0 = ethers.utils
            .parseUnits(
                new BigNumber(tokenInputState[symbol0].amount).toFixed(
                    parseInt(pool.token0.decimals),
                ),
                pool.token0.decimals,
            )
            .toString();
        const mintAmount1 = ethers.utils
            .parseUnits(
                new BigNumber(tokenInputState[symbol1].amount).toFixed(
                    parseInt(pool.token1.decimals),
                ),
                pool.token1.decimals,
            )
            .toString();

        // TODO: Come back to this. The min amounts don't represent min tokens
        // in the pool, but min deltas. Needs a closer look.
        // const amount0Min = new BigNumber(mintAmount0).times(
        //     new BigNumber(1).minus(slippageRatio)
        // ).times(0.2);
        // const amount1Min = new BigNumber(mintAmount1).times(
        //     new BigNumber(1).minus(slippageRatio)
        // ).times(0.2);

        // const baseAmount0Min = amount0Min.toFixed(0);
        // const baseAmount1Min = amount1Min.toFixed(0);

        const mintParams = [
            token0, // token0
            token1, // token1
            pool.feeTier, // feeTier
            bounds.position.tickLower, // tickLower
            bounds.position.tickUpper, // tickUpper
            mintAmount0, // amount0Desired
            mintAmount1, // amount1Desired
            0,
            0,
            wallet.account, // recipient
            Math.floor(Date.now() / 1000) + 86400000, // deadline
        ];

        debug.mintParams = mintParams;
        debug.fnName = fnName;

        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        for (const tokenSymbol of [pool.token0.symbol, pool.token1.symbol]) {
            // IF WETH, check if ETH is selected - if not, approve WETH
            // IF NOT WETH, approve

            if (tokenSymbol === 'WETH') {
                const selectedTokens = tokenInputState.selectedTokens;
                if (selectedTokens.includes('ETH')) {
                    continue;
                }
            }

            const erc20Contract = new ethers.Contract(
                tokenInputState[tokenSymbol].id,
                erc20Abi,
                signer,
            );

            const amountDesired =
                tokenSymbol === pool.token0.symbol ? mintAmount0 : mintAmount1;

            const baseApproveAmount = new BigNumber(amountDesired)
                .times(100)
                .toFixed();

            const tokenAmount = new BigNumber(amountDesired);

            if (balances?.[tokenSymbol]) {
                const baseTokenAmount = ethers.utils.formatUnits(
                    amountDesired,
                    balances?.[tokenSymbol]?.decimals,
                );

                const tokenAllowance = ethers.utils.formatUnits(
                    balances?.[tokenSymbol]?.allowance?.[
                        addLiquidityContractAddress
                    ],
                    balances?.[tokenSymbol]?.decimals,
                );

                // skip approval on allowance
                if (new BigNumber(baseTokenAmount).lt(tokenAllowance)) continue;
            }

            // Call the contract and sign
            let approvalEstimate: ethers.BigNumber;

            try {
                approvalEstimate = await erc20Contract.estimateGas.approve(
                    addLiquidityContractAddress,
                    baseApproveAmount,
                    { gasPrice: baseGasPrice },
                );

                // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
                approvalEstimate = approvalEstimate.add(
                    approvalEstimate.div(3),
                );
            } catch (err) {
                return handleGasEstimationError(err, {
                    type: 'approve',
                    account: wallet.account,
                    to: tokenInputState[tokenSymbol].id,
                    target: addLiquidityContractAddress,
                    amount: baseApproveAmount,
                    gasPrice: baseGasPrice,
                });
            }

            // Approve the add liquidity contract to spend entry tokens
            setPendingApproval(true);
            let approveHash: string | undefined;
            try {
                const {
                    hash,
                } = await erc20Contract.approve(
                    addLiquidityContractAddress,
                    baseApproveAmount,
                    { gasPrice: baseGasPrice, gasLimit: approvalEstimate },
                );
                approveHash = hash;
            } catch (e) {
                setPendingApproval(false);
                return;
            }

            // setApprovalState('pending');
            if (approveHash) {
                // toastWarn(`Approving tx ${compactHash(approveHash)}`);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [...state.approval, approveHash],
                                confirm: [...state.confirm],
                            } as PendingTx),
                    );

                const estimateTime = await getEstimateTime(
                    provider,
                    approveHash,
                    baseGasPrice,
                );
                onStatus(true, estimateTime);

                await provider.waitForTransaction(approveHash);
                setPendingApproval(false);
                onStatus(false);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [
                                    ...state.approval.filter(
                                        (h) => h != approveHash,
                                    ),
                                ],
                                confirm: [...state.confirm],
                            } as PendingTx),
                    );
            }
        }

        let baseMsgValue = ethers.utils.parseEther('0');
        if (tokenInputState.selectedTokens.includes('ETH')) {
            const ethAmount = ethers.utils.parseEther(
                new BigNumber(tokenInputState['ETH'].amount).toFixed(18),
            );
            baseMsgValue = baseMsgValue.add(ethAmount);
        }

        const value = baseMsgValue.toString();

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await addLiquidityContract.estimateGas[fnName](
                tokenId,
                mintParams,
                {
                    gasPrice: baseGasPrice,
                    value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
                },
            );

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(2));
        } catch (err) {
            return handleGasEstimationError(err, {
                type: 'addLiquidity:twoSide',
                method: fnName,
                account: wallet.account,
                to: addLiquidityContractAddress,
                tokenId,
                mintParams,
            });
        }

        const { hash } = await addLiquidityContract[fnName](
            tokenId,
            mintParams,
            {
                gasPrice: baseGasPrice,
                gasLimit: gasEstimate,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            },
        );

        return hash as string;
    };

    const doOneSidedAdd = async (): Promise<string | undefined> => {
        if (
            !pool ||
            !provider ||
            !indicators ||
            !bounds.position ||
            !currentGasPrice
        )
            return;

        const addLiquidityContractAddress =
            config.networks[wallet.network || '1']?.contracts?.ADD_LIQUIDITY_V3;

        if (!addLiquidityContractAddress) {
            throw new Error(
                'Add liquidity contract not available on this network.',
            );
        }

        // Create signer
        const signer = provider.getSigner();
        // Create read-write contract instance
        const addLiquidityContract = new ethers.Contract(
            addLiquidityContractAddress,
            addLiquidityAbi,
            signer,
        );

        debug.contract = addLiquidityContract;

        const [selectedToken] = tokenInputState.selectedTokens;
        const tokenData = tokenInputState[selectedToken];

        const tokenId = 0;
        let decimals = 18;
        if (
            selectedToken === pool.token0.symbol ||
            (selectedToken === 'ETH' && pool.token0.symbol === 'WETH')
        ) {
            decimals = parseInt(pool.token0.decimals, 10);
        } else {
            decimals = parseInt(pool.token1.decimals, 10);
        }
        const mintAmountOneSide = ethers.utils
            .parseUnits(
                new BigNumber(tokenData.amount).toFixed(decimals),
                decimals,
            )
            .toString();

        const mintAmount0 = ethers.utils
            .parseUnits(
                new BigNumber(
                    tokenInputState[pool.token0.symbol].amount,
                ).toFixed(parseInt(pool.token0.decimals)),
                pool.token0.decimals,
            )
            .toString();
        const mintAmount1 = ethers.utils
            .parseUnits(
                new BigNumber(
                    tokenInputState[pool.token1.symbol].amount,
                ).toFixed(parseInt(pool.token1.decimals)),
                pool.token1.decimals,
            )
            .toString();

        const liquidity = new BigNumber(bounds.position.liquidity.toString())
            .exponentiatedBy(2)
            .div(2)
            .sqrt();
        const minLiquidity = liquidity.times(0.97).toFixed(0);

        const sqrtPriceAX96 = TickMath.getSqrtRatioAtTick(
            bounds.position.tickLower,
        );
        const sqrtPriceBX96 = TickMath.getSqrtRatioAtTick(
            bounds.position.tickUpper,
        );

        debug.mintAmounts = {
            liquidity,
            minLiquidity,
        };

        const mintParams = [
            pool.token0.id, // token0
            pool.token1.id, // token1
            pool.feeTier, // feeTier
            bounds.position.tickLower, // tickLower
            bounds.position.tickUpper, // tickUpper
            sqrtPriceAX96.toString(),
            sqrtPriceBX96.toString(),
            minLiquidity, // amount0Desired
            wallet.account, // recipient
            Math.floor(Date.now() / 1000) + 86400000, // deadline
        ];

        debug.mintParams = mintParams;
        const baseGasPrice = ethers.utils
            .parseUnits(currentGasPrice.toString(), 9)
            .toString();

        for (const tokenSymbol of [pool.token0.symbol, pool.token1.symbol]) {
            // IF WETH, check if ETH is selected - if not, approve WETH
            // IF NOT WETH, approve

            // if (tokenSymbol === 'WETH') {
            //     const selectedTokens = tokenInputState.selectedTokens;
            //     if (selectedTokens.includes('ETH')) {
            //         continue;
            //     }
            // }

            const erc20Contract = new ethers.Contract(
                tokenInputState[tokenSymbol].id,
                erc20Abi,
                signer,
            );

            const amountDesired =
                tokenSymbol === pool.token0.symbol ? mintAmount0 : mintAmount1;

            const baseApproveAmount = new BigNumber(amountDesired)
                .times(100)
                .toFixed();

            const tokenAmount = new BigNumber(amountDesired);

            if (balances?.[tokenSymbol]) {
                const baseTokenAmount = ethers.utils.formatUnits(
                    amountDesired,
                    balances?.[tokenSymbol]?.decimals,
                );

                const tokenAllowance = ethers.utils.formatUnits(
                    balances?.[tokenSymbol]?.allowance?.[
                        addLiquidityContractAddress
                    ],
                    balances?.[tokenSymbol]?.decimals,
                );

                // skip approval on allowance
                if (new BigNumber(baseTokenAmount).lt(tokenAllowance)) continue;
            }

            // Call the contract and sign
            let approvalEstimate: ethers.BigNumber;

            try {
                approvalEstimate = await erc20Contract.estimateGas.approve(
                    addLiquidityContractAddress,
                    baseApproveAmount,
                    { gasPrice: baseGasPrice },
                );

                // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
                approvalEstimate = approvalEstimate.add(
                    approvalEstimate.div(3),
                );
            } catch (err) {
                return handleGasEstimationError(err, {
                    type: 'approve',
                    account: wallet.account,
                    token: tokenInputState[tokenSymbol].id,
                    target: addLiquidityContractAddress,
                    amount: baseApproveAmount,
                    gasPrice: baseGasPrice,
                });
            }

            // Approve the add liquidity contract to spend entry tokens
            setPendingApproval(true);
            let approveHash: string | undefined;
            try {
                const {
                    hash,
                } = await erc20Contract.approve(
                    addLiquidityContractAddress,
                    baseApproveAmount,
                    { gasPrice: baseGasPrice, gasLimit: approvalEstimate },
                );
                approveHash = hash;
            } catch (e) {
                setPendingApproval(false);
                return;
            }

            // setApprovalState('pending');
            if (approveHash) {
                // toastWarn(`Approving tx ${compactHash(approveHash)}`);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [...state.approval, approveHash],
                                confirm: [...state.confirm],
                            } as PendingTx),
                    );

                const estimateTime = await getEstimateTime(
                    provider,
                    approveHash,
                    baseGasPrice,
                );
                onStatus(true, estimateTime);

                await provider.waitForTransaction(approveHash);
                setPendingApproval(false);
                onStatus(false);
                setPendingTx &&
                    setPendingTx(
                        (state: PendingTx): PendingTx =>
                            ({
                                approval: [
                                    ...state.approval.filter(
                                        (h) => h != approveHash,
                                    ),
                                ],
                                confirm: [...state.confirm],
                            } as PendingTx),
                    );
            }
        }

        let baseMsgValue = ethers.utils.parseEther('0.005');
        if (tokenInputState.selectedTokens.includes('ETH')) {
            const ethAmount = ethers.utils.parseEther(
                new BigNumber(tokenInputState['ETH'].amount).toFixed(18),
            );
            baseMsgValue = baseMsgValue.add(ethAmount);
        }

        const value = baseMsgValue.toString();

        // Call the contract and sign
        let gasEstimate: ethers.BigNumber;

        try {
            gasEstimate = await addLiquidityContract.estimateGas[
                'investTokenForUniPair'
            ](tokenData.id, mintAmountOneSide, tokenId, mintParams, {
                gasPrice: baseGasPrice,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            });

            // Add a 30% buffer over the ethers.js gas estimate. We don't want transactions to fail
            gasEstimate = gasEstimate.add(gasEstimate.div(2));
        } catch (err) {
            return handleGasEstimationError(err, {
                type: 'addLiquidity:oneSide',
                method: 'investTokenForUniPair',
                account: wallet.account,
                to: addLiquidityContractAddress,
                tokenId,
                tokenToAdd: tokenData.id,
                tokenAmount: mintAmountOneSide,
                mintParams,
            });
        }

        const { hash } = await addLiquidityContract['investTokenForUniPair'](
            tokenData.id,
            mintAmountOneSide,
            tokenId,
            mintParams,
            {
                gasPrice: baseGasPrice,
                gasLimit: gasEstimate,
                value, // flat fee sent to contract - 0.0005 ETH - with ETH added if used as entry
            },
        );

        return hash as string;
    };

    // if (!pool || !pool?.token0 || !pool?.token1) return null;
    debug.marketData = marketData;

    const selectedSymbolCount = tokenInputState.selectedTokens.length;
    const isToken0Active = tokenInputState?.[token0Symbol]?.selected;
    const isToken1Active = tokenInputState?.[token1Symbol]?.selected;
    const isTokenETHActive = tokenInputState?.['ETH']?.selected;
    const isToken0Disabled = !isToken0Active && selectedSymbolCount === 2;
    const isToken1Disabled = !isToken1Active && selectedSymbolCount === 2;
    const isTokenETHDisabled =
        !isTokenETHActive &&
        (selectedSymbolCount === 2 || tokenInputState['WETH']?.selected);
    // const selectedSymbol0 = tokenInputState.selectedTokens[0];
    // const selectedSymbol1 = tokenInputState.selectedTokens[1];
    const disableWETH = tokenInputState['ETH'].selected;
    const isWETHPair = token0Symbol === 'WETH' || token1Symbol === 'WETH';
    const baseCoin = isFlipped ? pool.token0.symbol : pool.token1.symbol;
    const baseCoinId = isFlipped ? pool.token0.id : pool.token1.id;

    const isDisabled = (symbol: string) =>
        disabledInput && disabledInput.includes(symbol);

    const handleAddBasket = () => {
        // setAlertTitle('INSUFFICIENT FUNDS!');
        // setAlertDescription('PLEASE SELECT ANOTHER AMOUNT OR ANOTHER TOKEN');
        // setShowAlert(true);

        if (!wallet?.account) {
            setAlertTitle('CONNECT WALLET');
            setAlertDescription('APE MUST CONNECT WALLET');
            setShowAlert(true);
            return;
        }

        if (
            wallet?.providerName === 'walletconnect' &&
            !wallet?.provider?.connected
        ) {
            setAlertTitle('RECONNECT WALLET!');
            setAlertDescription('APE MUST RECONNECT WALLET');
            setShowAlert(true);
            return;
        }

        if (pendingApproval) {
            setAlertTitle('APPROVING NOW');
            setAlertDescription('APE APPROVE THE TRANSACTION');
            setShowAlert(true);
            return;
        }

        if (tokenInputState?.selectedTokens.length === 0) {
            setAlertTitle('SELECT TOKEN');
            setAlertDescription('APE MUST SELECT A TOKEN FIRST!');
            setShowAlert(true);
            return;
        }

        const numOfTokens = tokenInputState?.selectedTokens?.length ?? 0;

        console.log('tokenInputState', tokenInputState);
        console.log('bounds', bounds);

        for (let i = 0; i < numOfTokens; i++) {
            const symbol = tokenInputState?.selectedTokens[i];
            if (!tokenInputState[symbol].amount && !isDisabled(symbol)) {
                setAlertTitle('INPUT AMOUNT');
                setAlertDescription('APE MUST TYPE AMOUNT OF TOKEN');
                setShowAlert(true);
                return;
            }
            const tokenAmount = new BigNumber(tokenInputState[symbol].amount);

            if ((!tokenAmount || tokenAmount.lte(0)) && !isDisabled(symbol)) {
                setAlertTitle('INPUT AMOUNT');
                setAlertDescription('APE MUST TYPE AMOUNT OF TOKEN');
                setShowAlert(true);
                return;
            }
        }

        for (let i = 0; i < numOfTokens; i++) {
            const symbol = tokenInputState?.selectedTokens[i];
            const tokenAmount = new BigNumber(tokenInputState[symbol].amount);
            const tokenBalance =
                ethers.utils.formatUnits(
                    balances?.[symbol]?.balance || 0,
                    parseInt(balances?.[symbol]?.decimals || '0', 10),
                ) || '0';

            if (tokenAmount.gt(tokenBalance)) {
                setAlertTitle('INSUFFICIENT AMOUNT');
                setAlertDescription('APE NOT HAVE ENOUGH TOKEN!');
                setShowAlert(true);
                return;
            }

            const tokenBalanceMinusBasket = new BigNumber(tokenBalance).minus(
                getBasketTokenAmount(symbol),
            );

            if (tokenAmount.gt(tokenBalanceMinusBasket)) {
                setAlertTitle('INSUFFICIENT AMOUNT');
                setAlertDescription(
                    'Not ENOUGH LIQUIDITY. PLEASE GO TO BASKET AND EDIT POOLS!',
                );
                setShowAlert(true);
                return;
            }
        }

        if (pendingBounds) {
            setAlertTitle('PENDING NOW');
            setAlertDescription('APE WAIT WHILE BLOCKCHAIN WORK');
            setShowAlert(true);
            return;
        }

        // doAddLiquidity();
        // doAddBasket();

        if (!pool || !provider || !indicators || !bounds.position) return;
        if (!currentGasPrice) {
            throw new Error('Gas price not selected.');
        }

        console.log('token input state', tokenInputState);

        console.log(pool);

        const poolId = pool.id;
        const poolName = `${pool.token0.symbol}-${pool.token1.symbol}`;

        const token0Address = pool.token0.id;
        const token0Name = pool.token0.symbol;
        const token0Decimal = pool.token0.decimals;

        const token1Address = pool.token1.id;
        const token1Name = pool.token1.symbol;
        const token1Decimal = pool.token1.decimals;

        const isOneSide =
            tokenInputState.selectedTokens.length === 1 ? true : false;

        const selectedToken0 = tokenInputState.selectedTokens[0];
        const lToken0Address = tokenInputState[selectedToken0].id;
        const lToken0Name = tokenInputState[selectedToken0].symbol;
        const lToken0Amount = tokenInputState[selectedToken0].amount;

        const selectedToken1 = isOneSide
            ? null
            : tokenInputState.selectedTokens[1];
        const lToken1Address = selectedToken1
            ? tokenInputState[selectedToken1].id
            : null;
        const lToken1Name = selectedToken1
            ? tokenInputState[selectedToken1].symbol
            : null;
        const lToken1Amount = selectedToken1
            ? tokenInputState[selectedToken1].amount
            : null;

        const volumeUSD = pool.volumeUSD;

        console.log('************************************');
        console.log(pool);
        console.log(tokenInputState);
        console.log('************************************');

        const token0Amount = ethers.utils
            .parseUnits(
                new BigNumber(
                    tokenInputState[pool.token0.symbol].amount,
                ).toFixed(parseInt(pool.token0.decimals)),
                pool.token0.decimals,
            )
            .toString();

        const token1Amount = ethers.utils
            .parseUnits(
                new BigNumber(
                    tokenInputState[pool.token1.symbol].amount,
                ).toFixed(parseInt(pool.token1.decimals)),
                pool.token1.decimals,
            )
            .toString();
        const ethAmount = tokenInputState['ETH']
            ? tokenInputState['ETH'].amount.toString()
            : '0';

        const poolInfo: LiquidityBasketData = {
            poolId,
            poolName,
            token0Address,
            token0Name,
            token0Decimal,
            token1Address,
            token1Name,
            token1Decimal,
            isOneSide,
            lToken0Address,
            lToken0Name,
            lToken0Amount,
            lToken1Address,
            lToken1Name,
            lToken1Amount,
            actionType: 'add',
            volumeUSD,
            isNANA,
            token0Amount,
            token1Amount,
            ethAmount,
            bounds,
            feeTier: pool.feeTier,
            balances,
            func: doAddLiquidity,
        };

        onAddBasket(poolInfo);
    };

    return (
        <>
            <div className='add-v3-container'>
                <AlertModal
                    titleText={alertTitle}
                    descriptionText={alertDescription}
                    show={showAlert}
                    setShow={setShowAlert}
                />
                <div className='navigator'>
                    {/* <div
                        className='navigator-arrow'
                        onClick={(e) => {
                            if (leftArrow) {
                                onLeft();
                            }
                        }}
                    >
                        {leftArrow && <img src={pngLeft} />}
                    </div> */}
                    <div className='navigator-title'>
                        {isNANA && (
                            <span className='navigator-title-nana'>
                                NANA POOL
                            </span>
                        )}
                        {!isNANA && (
                            <>
                                <span className='navigator-title-main'>
                                    DANCING BANANAS
                                </span>
                                <span className='navigator-title-sub'>
                                    UNISWAP V3 POOLS
                                </span>
                            </>
                        )}
                    </div>
                    {/* <div
                        className='navigator-arrow'
                        onClick={(e) => {
                            if (rightArrow) {
                                onRight();
                            }
                        }}
                    >
                        {rightArrow && <img src={pngRight} />}
                    </div> */}
                </div>
                <div className='bonus-banana-gif'>
                    <img src={gifBonusBanana} />
                </div>
                <div className='pool-info'>
                    <div className='pool-pairs'>
                        {!isNANA && (
                            <div className='pool-pairs-item'>
                                {resolveLogo(
                                    tokenInputState[token0Symbol].id,
                                    '81px',
                                )}
                                <span className='pool-pairs-name'>{`${token0Symbol}`}</span>
                            </div>
                        )}
                        {isNANA && (
                            <div className='pool-pairs-item'>
                                <div>
                                    <img src={pngNANA} />
                                </div>
                                <span className='pool-pairs-name'>NANA</span>
                            </div>
                        )}
                        {!isNANA && (
                            <div className='pool-pairs-item'>
                                {resolveLogo(
                                    tokenInputState[token1Symbol].id,
                                    '81px',
                                )}
                                <span className='pool-pairs-name'>{`${token1Symbol}`}</span>
                            </div>
                        )}
                        {isNANA && (
                            <div className='pool-pairs-item'>
                                <img src={pngETH} />
                                <span className='pool-pairs-name'>ETH</span>
                            </div>
                        )}
                    </div>
                    {!isNANA && <div className='pool-separator' />}
                    {isNANA && <div className='pool-banana-separator' />}
                    <div className='pool-details'>
                        <div className='pool-details-row'>
                            <div className='pool-details-value green'>
                                {isNANA && <span>COMING SOON</span>}
                                {!isNANA &&
                                    formatNumber(
                                        (Number(pool.volumeUSD) / 100) * 0.1,
                                    )}
                            </div>
                            <div className='pool-details-desc'>
                                24 HRS POOL FEES
                            </div>
                        </div>
                    </div>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                    <div className={classNames('pair-text', { nana: isNANA })}>
                        PICK YOUR TOKENS TO POOL
                    </div>
                    <Box
                        display='flex'
                        flexDirection='column'
                        className='token-control-container'
                    >
                        {/* {isWETHPair && ( */}
                        <Box
                            display='flex'
                            justifyContent='space-between'
                            className={classNames('token-input-control', {
                                nana: isNANA,
                                active: isTokenETHActive,
                                inactive: !isTokenETHActive,
                            })}
                        >
                            <Box
                                display='flex'
                                justifyContent='flex-start'
                                onClick={() => {
                                    if (
                                        !isTokenETHActive &&
                                        selectedSymbolCount === 2
                                    )
                                        return;
                                    if (isTokenETHDisabled) return;
                                    dispatch({
                                        type: 'toggle',
                                        payload: { sym: 'ETH' },
                                    });
                                }}
                            >
                                <div
                                    style={{
                                        flexGrow: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                    className={classNames(
                                        'token-balance-wrapper',
                                        { active: isTokenETHActive },
                                    )}
                                >
                                    <TokenWithBalance
                                        id={tokenInputState['ETH']?.id}
                                        name={'ETH'}
                                        balance={balances?.['ETH']?.balance}
                                        decimals={'18'}
                                        disabled={isTokenETHDisabled}
                                        isNANA={isNANA}
                                    />
                                </div>
                            </Box>
                            <TokenInput
                                token={'ETH'}
                                // we update ETH tokenInputState with whatever WETH amounts to
                                // dont show it in the UI if inactive
                                amount={
                                    isTokenETHActive
                                        ? tokenInputState['ETH'].amount
                                        : ''
                                }
                                updateAmount={(amt: string) => {
                                    dispatch({
                                        type: 'update-amount',
                                        payload: {
                                            sym: 'ETH',
                                            amount: amt,
                                        },
                                    });
                                }}
                                handleTokenRatio={handleTokenRatio}
                                balances={balances}
                                basketAmount={getBasketTokenAmount('ETH')}
                                disabled={
                                    disabledInput?.includes('ETH') ||
                                    !isTokenETHActive
                                }
                                twoSide={true}
                                isNANA={isNANA}
                            />
                        </Box>
                        {/* )} */}

                        {(!isNANA || (isNANA && token0Symbol === 'WETH')) && (
                            <Box
                                display='flex'
                                justifyContent='space-between'
                                className={classNames('token-input-control', {
                                    nana: isNANA,
                                    active: isToken0Active,
                                    inactive: !isToken0Active,
                                })}
                            >
                                <Box
                                    display='flex'
                                    justifyContent='flex-start'
                                    onClick={() => {
                                        if (
                                            !isToken0Active &&
                                            selectedSymbolCount === 2
                                        )
                                            return;
                                        if (
                                            isToken0Disabled ||
                                            (token0Symbol === 'WETH' &&
                                                disableWETH)
                                        )
                                            return;
                                        dispatch({
                                            type: 'toggle',
                                            payload: { sym: token0Symbol },
                                        });
                                    }}
                                >
                                    <div
                                        style={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        className={classNames(
                                            'token-balance-wrapper',
                                            {
                                                active: isToken0Active,
                                            },
                                        )}
                                    >
                                        <TokenWithBalance
                                            id={
                                                tokenInputState[token0Symbol].id
                                            }
                                            name={token0Symbol}
                                            balance={
                                                balances?.[token0Symbol]
                                                    ?.balance
                                            }
                                            decimals={
                                                balances?.[token0Symbol]
                                                    ?.decimals
                                            }
                                            disabled={isToken0Disabled}
                                            isNANA={isNANA}
                                        />
                                    </div>
                                </Box>

                                <TokenInput
                                    token={token0Symbol}
                                    amount={
                                        isToken0Active
                                            ? tokenInputState[token0Symbol]
                                                  .amount
                                            : ''
                                    }
                                    updateAmount={(amt: string) => {
                                        dispatch({
                                            type: 'update-amount',
                                            payload: {
                                                sym: token0Symbol,
                                                amount: amt,
                                            },
                                        });
                                    }}
                                    handleTokenRatio={handleTokenRatio}
                                    balances={balances}
                                    basketAmount={getBasketTokenAmount(
                                        token0Symbol,
                                    )}
                                    disabled={
                                        disabledInput?.includes(token0Symbol) ||
                                        !isToken0Active
                                    }
                                    twoSide={true}
                                    isNANA={isNANA}
                                />
                            </Box>
                        )}

                        {(!isNANA || (isNANA && token1Symbol === 'WETH')) && (
                            <Box
                                display='flex'
                                justifyContent='space-between'
                                className={classNames('token-input-control', {
                                    nana: isNANA,
                                    active: isToken1Active,
                                    inactive: !isToken1Active,
                                })}
                            >
                                <Box
                                    display='flex'
                                    justifyContent='flex-start'
                                    onClick={() => {
                                        if (
                                            !isToken1Active &&
                                            selectedSymbolCount === 2
                                        )
                                            return;
                                        if (
                                            isToken1Disabled ||
                                            (token1Symbol === 'WETH' &&
                                                disableWETH)
                                        )
                                            return;
                                        dispatch({
                                            type: 'toggle',
                                            payload: { sym: token1Symbol },
                                        });
                                    }}
                                >
                                    <div
                                        style={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                        className={classNames(
                                            'token-balance-wrapper',
                                            {
                                                active: isToken1Active,
                                            },
                                        )}
                                    >
                                        <TokenWithBalance
                                            id={
                                                tokenInputState[token1Symbol].id
                                            }
                                            name={token1Symbol}
                                            balance={
                                                balances?.[token1Symbol]
                                                    ?.balance
                                            }
                                            decimals={
                                                balances?.[token1Symbol]
                                                    ?.decimals
                                            }
                                            disabled={isToken1Disabled}
                                            isNANA={isNANA}
                                        />
                                    </div>
                                </Box>
                                <TokenInput
                                    token={token1Symbol}
                                    amount={
                                        isToken1Active
                                            ? tokenInputState[token1Symbol]
                                                  .amount
                                            : ''
                                    }
                                    updateAmount={(amt: string) => {
                                        dispatch({
                                            type: 'update-amount',
                                            payload: {
                                                sym: token1Symbol,
                                                amount: amt,
                                            },
                                        });
                                    }}
                                    handleTokenRatio={handleTokenRatio}
                                    balances={balances}
                                    basketAmount={getBasketTokenAmount(
                                        token1Symbol,
                                    )}
                                    disabled={
                                        disabledInput?.includes(token1Symbol) ||
                                        !isToken1Active
                                    }
                                    twoSide={true}
                                    isNANA={isNANA}
                                />
                            </Box>
                        )}
                    </Box>
                    <br />
                    <div className={classNames('pair-text', { nana: isNANA })}>
                        PICK YOUR EMOTION
                    </div>
                    <Box
                        display='flex'
                        justifyContent='center'
                        className='sentiment'
                    >
                        <div
                            className={classNames({
                                'sentiment-item': true,
                                nana: isNANA,
                                active: isFlipped
                                    ? sentiment === 'bullish'
                                    : sentiment === 'bearish',
                            })}
                            role='button'
                            onClick={() => {
                                if (level > 1) {
                                    setSentiment(
                                        isFlipped ? 'bullish' : 'bearish',
                                    );
                                    trackSentimentInteraction(pool, 'bearish');
                                }
                            }}
                        >
                            <img src={pngApyHappy} />
                            <span>BULLISH</span>
                        </div>
                        <div
                            className={classNames({
                                'sentiment-item': true,
                                nana: isNANA,
                                active: sentiment === 'neutral',
                            })}
                            role='button'
                            onClick={() => {
                                setSentiment('neutral');
                                trackSentimentInteraction(pool, 'neutral');
                            }}
                        >
                            <img src={pngApyNormal} />
                            <span>NEUTRAL</span>
                        </div>
                        <div
                            className={classNames({
                                'sentiment-item': true,
                                nana: isNANA,
                                active: isFlipped
                                    ? sentiment === 'bearish'
                                    : sentiment === 'bullish',
                            })}
                            role='button'
                            onClick={() => {
                                if (level > 1) {
                                    setSentiment(
                                        isFlipped ? 'bearish' : 'bullish',
                                    );
                                    trackSentimentInteraction(pool, 'bullish');
                                }
                            }}
                        >
                            <img src={pngApySad} />
                            <span>BEARISH</span>
                        </div>
                    </Box>
                    <div className='pair-action'>
                        <button
                            className='pair-action-button silver'
                            onClick={(e) => onSkipPairs()}
                        >
                            SKIP
                        </button>
                        {/* <LiquidityActionButton
                            disabledInput={disabledInput}
                            tokenInputState={tokenInputState}
                            pendingApproval={pendingApproval}
                            onClick={() => doAddLiquidity()}
                            balances={balances}
                            pendingBounds={pendingBounds}
                            currentGasPrice={currentGasPrice}
                        /> */}
                        {!isNANA && (
                            <button
                                className='pair-action-button green'
                                onClick={(e) => handleAddBasket()}
                            >
                                ADD
                            </button>
                        )}
                    </div>
                    <br />
                    <div></div>
                </div>
            </div>
        </>
    );
};
