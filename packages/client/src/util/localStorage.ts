import { LiquidityBasketData } from 'types/states';

export const SKIP_DURATION = 5; // 5 sec for test. Should be 240 mins in production

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

    return SKIP_DURATION - currentTime + lastSkipTime;
};

const setLevel = (level: string): void => {
    localStorage.setItem('level', level);
};

const getLevel = (): string => {
    const value = localStorage.getItem('level');
    return value ? value : '1';
};

const setTask = (task: string): void => {
    localStorage.setItem('task', task);
};

const getTask = (): string => {
    const value = localStorage.getItem('task');
    return value ? value : 'incomplete';
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

export const storage = {
    setLastSkipTime,
    getLastSkipTime,
    shouldRefreshPool,
    getRemainingWaitingTime,
    setSkipStatus,
    getSkip,
    setLevel,
    getLevel,
    setTask,
    getTask,
    setBasketData,
    addBasketData,
    getBasketData,
};
