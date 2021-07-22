export interface LevelTask {
    taskName: string;
    complete: boolean;
}

export interface Level {
    level: string;
    description: string;
    tasks: LevelTask[];
    rewards: string[];
}

export type Tabs =
    | 'home'
    | 'task'
    | 'transactionSuccess'
    | 'cart'
    | 'shop'
    | 'levelup'
    | 'positionManager'
    | 'positionDetail';
