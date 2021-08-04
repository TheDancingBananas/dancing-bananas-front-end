export interface LevelTask {
    taskName: string;
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
