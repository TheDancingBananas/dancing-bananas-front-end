import redis from 'util/redis';

export type User = {
    address: string;
    lastPoolIds: string[];
    lastSkipTime: number;
    purchasedNFTs: string[];
};

export const getDefaultUser = (): User => {
    const user: User = {
        address: '',
        lastPoolIds: [],
        lastSkipTime: 0,
        purchasedNFTs: [],
    };

    return user;
};

export const getUser = async (wallet: string): Promise<User | null> => {
    const userInfo = await redis.get(wallet);

    if (userInfo !== null) {
        return JSON.parse(userInfo) as User;
    }

    return null;
};

export const saveUser = async (wallet: string, user: User): Promise<void> => {
    await redis.set(wallet, JSON.stringify(user));
};
