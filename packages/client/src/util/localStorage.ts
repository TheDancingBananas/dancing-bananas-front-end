export const SKIP_DURATION = 20; // 20 sec for test. Should be 240 mins in production

const setCurrentPoolId = (poolId: string): void => {
    localStorage.setItem('random-pool-id', poolId);
};

const getCurrentPoolId = (): string | null => {
    return localStorage.getItem('random-pool-id');
};

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

export const storage = {
    setCurrentPoolId,
    getCurrentPoolId,
    setLastSkipTime,
    getLastSkipTime,
    shouldRefreshPool,
    getRemainingWaitingTime,
    setSkipStatus,
    getSkip,
};
