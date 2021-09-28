export interface LevelTask {
    taskName: string;
    taskType: string;
    goal: number;
    current: number;
    complete: boolean;
}

export interface Reward {
    daily: RewardItem;
    onesided: RewardItem;
    twosided: RewardItem;
    minnow: RewardItem;
    shark: RewardItem;
    whale: RewardItem;
    remove: RewardItem;
    levelup: RewardItem;
}

export interface RewardItem {
    label: string;
    amount: number;
}

export interface Level {
    level: string;
    poolCount: string;
    description: string;
    tasks: LevelTask[];
    rewards: string[];
    levelUpRewards: number;
    bananarewards: Reward;
}

export interface ExchangeData {
    key: string;
    title: string;
    subtitle: string;
    desc: string;
    amount: number;
}

export type Tabs =
    | 'home'
    | 'task'
    | 'transactionSuccess'
    | 'cart'
    | 'shop'
    | 'levelup'
    | 'position'
    | 'positionManager'
    | 'positionDetail'
    | 'exchange';

export type Rewards =
    | 'SPEED UP 48'
    | 'COLLECT FEES AND LIQUIDITY'
    | 'SENTIMENT PRICE RANGES'
    | 'EMOTION PRICE RANGES';
