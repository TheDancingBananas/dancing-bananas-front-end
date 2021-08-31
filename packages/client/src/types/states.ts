import {
    MarketStats,
    IUniswapPair,
    UniswapPair,
    UniswapDailyData,
    UniswapHourlyData,
    UniswapSwap,
    UniswapMintOrBurn,
    LPStats,
    NetworkIds,
} from '@sommelier/shared-types';

import { Position } from '@uniswap/v3-sdk';

import { Price } from '@uniswap/sdk-core';

import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';

export interface AllPairsState {
    isLoading: boolean;
    pairs: UniswapPair[] | null;
    lookups: {
        [pairId: string]: IUniswapPair & {
            volumeRanking: number;
            liquidityRanking: number;
        };
    } | null;
    byLiquidity: IUniswapPair[] | null;
}

export type Provider = 'metamask' | 'walletconnect';

export interface Wallet {
    account: string | null;
    providerName: Provider | null;
    provider: any | null;
    network: NetworkIds | null;
}

export interface PairPricesState {
    pairData: UniswapPair;
    historicalDailyData: UniswapDailyData[];
    historicalHourlyData: UniswapHourlyData[];
}

export interface IError {
    message: string;
}

export type StatsWindow = 'total' | 'day' | 'week';

export interface SwapsState {
    swaps: UniswapSwap[] | null;
    mintsAndBurns: {
        mints: UniswapMintOrBurn[];
        burns: UniswapMintOrBurn[];
        combined: UniswapMintOrBurn[];
    } | null;
}

export interface PairDataState {
    isLoading: boolean;
    currentError?: string;
    lpInfo?: PairPricesState;
    latestSwaps?: SwapsState;
}

export interface LPDataState extends PairDataState {
    lpStats: LPStats<string>;
}

export interface TopPairsState {
    daily: MarketStats[];
    weekly: MarketStats[];
}

export interface PrefetchedPairState {
    [pairId: string]: LPDataState;
}
export interface GasPrices {
    standard: number;
    fast: number;
    faster: number;
}

export type ManageLiquidityActionState =
    | 'awaitingGasPrices'
    | 'gasPriceNotSelected'
    | 'amountNotEntered'
    | 'insufficientFunds'
    | 'slippageTooHigh'
    | 'needsApproval'
    | 'waitingApproval'
    | 'needsSubmit'
    | 'submitted'
    | 'unknown';

export interface WalletBalances {
    [tokenName: string]: {
        id: string;
        balance: ethers.BigNumber;
        symbol?: string;
        decimals?: string;
        allowance: {
            [address: string]: ethers.BigNumber;
        };
    };
}

export type BoundsState = {
    prices: [number, number];
    ticks: [number, number];
    ticksFromPrice?: [any, any];
    position?: Position;
};

export interface TokenInputAmount {
    id?: string;
    name?: string;
    symbol?: string;
    amount: string;
    selected: boolean;
}

export interface LiquidityBasketData {
    poolId: string;
    poolName: string;
    token0Address: string;
    token0Name: string;
    token0Decimal: string;
    token1Address: string;
    token1Name: string;
    token1Decimal: string;
    isOneSide: boolean;
    lToken0Address: string;
    lToken0Name: string;
    lToken0Amount: number;
    lToken1Address?: string;
    lToken1Name?: string;
    lToken1Amount?: number;
    actionType: 'add' | 'remove';
    volumeUSD: string;
    isNANA: boolean;
    token0Amount: string;
    token1Amount: string;
    ethAmount: string;
    bounds: BoundsState;
    minliquidity: string;
    feeTier: string;
    balances: WalletBalances;
    sentiment: string;
    func: () => Promise<void>;
}
