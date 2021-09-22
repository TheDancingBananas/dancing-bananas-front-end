import { LiquidityBasketData } from 'types/states';
import { Level, LevelTask } from 'types/game';
import gameData from 'constants/gameData.json';
import { EthGasPrices } from '@sommelier/shared-types';

export const SKIP_DURATION = 60; // 5 sec for test. Should be 240 mins in production

const getLastSkipTime = (): number => {
    const lastSkipTime = localStorage.getItem('last-skip-time');
    return lastSkipTime ? Number(lastSkipTime) : 0;
};

const setLastSkipTime = (time: number): void => {
    localStorage.setItem('last-skip-time', time.toString());
};

const setSkipStatus = (skip: string): void => {
    localStorage.setItem('skip-status', skip);
};

const getSkip = (): string => {
    const value = localStorage.getItem('skip-status');
    return value ? value : 'off';
};

const shouldRefreshPool = (): boolean => {
    const lastSkipTime = getLastSkipTime();
    const currentTime = Math.floor(Date.now() / 1000);

    return currentTime - lastSkipTime >= SKIP_DURATION && getSkip() === 'on';
};

const getRemainingWaitingTime = (): number => {
    const lastSkipTime = getLastSkipTime();
    const currentTime = Math.floor(Date.now() / 1000);

    let time_left = SKIP_DURATION - currentTime + lastSkipTime;

    if (time_left < 0) {
        time_left = SKIP_DURATION;
    }

    return time_left;
};

const setLevel = (level: string): void => {
    localStorage.setItem('level', level);
};

const getLevel = (): string => {
    const value = localStorage.getItem('level');
    return value ? value : '1';
};

const setInstructionVisible = (visible: boolean): void => {
    localStorage.setItem('instructionVisible', visible.toString());
};

const getInstructionVisible = (): boolean => {
    const value = localStorage.getItem('instructionVisible');
    return value ? value === 'true' : true;
};

const setTaskStatus = (task: LevelTask[]): void => {
    const value = JSON.stringify(task);
    localStorage.setItem('task', value);
};

const getDefaultTaskStatus = (): LevelTask[] => {
    const gameLevels: Level[] = gameData.game;
    const currentLevelData: Level = gameLevels[Number(getLevel()) - 1];
    return JSON.parse(JSON.stringify(currentLevelData.tasks));
};

const getTaskStatus = (): LevelTask[] => {
    try {
        const value = localStorage.getItem('task');
        if (!value) return getDefaultTaskStatus();
        const data: LevelTask[] = JSON.parse(value);
        return data;
    } catch (e) {
        return getDefaultTaskStatus();
    }
};

const getLevelTaskCompleted = (): boolean => {
    const taskStatus = getTaskStatus();

    const incomplete = taskStatus.filter((val) => val.complete === false);

    return incomplete.length === 0;
};

const setBasketData = (data: LiquidityBasketData[]): void => {
    const value = JSON.stringify(data);
    localStorage.setItem('basket-data', value);
};

const addBasketData = (data: LiquidityBasketData): void => {
    const basketData = getBasketData();
    const findIndex = basketData.findIndex(
        (item) =>
            item.poolId === data.poolId && item.actionType === data.actionType,
    );

    if (findIndex < 0) {
        basketData.push(data);
    } else {
        basketData[findIndex] = {
            ...data,
        };
    }
    setBasketData([...basketData]);
};

const getBasketData = (): LiquidityBasketData[] => {
    try {
        const value = localStorage.getItem('basket-data');
        if (!value) return [];
        const data: LiquidityBasketData[] = JSON.parse(value);
        return data;
    } catch (e) {
        return [];
    }
};

const setGasPrices = (data: EthGasPrices | null): void => {
    console.log('storage gas setting: ', data);
    const value = JSON.stringify(data);
    localStorage.setItem('gasprices', value);
};

const getGasPrices = (): EthGasPrices | null => {
    try {
        const value = localStorage.getItem('gasprices');
        if (!value) return null;
        const data: EthGasPrices = JSON.parse(value);
        return data;
    } catch (e) {
        return null;
    }
};

export const storage = {
    setLastSkipTime,
    getLastSkipTime,
    shouldRefreshPool,
    getRemainingWaitingTime,
    setSkipStatus,
    getSkip,
    setLevel,
    getLevel,
    setTaskStatus,
    getTaskStatus,
    setBasketData,
    addBasketData,
    getBasketData,
    getDefaultTaskStatus,
    getLevelTaskCompleted,
    getGasPrices,
    setGasPrices,
    setInstructionVisible,
    getInstructionVisible,
};
