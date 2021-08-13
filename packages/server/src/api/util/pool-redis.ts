import redis from 'util/redis';
import { GetTopPoolsResult } from '@sommelier/shared-types/src/api'; // how do we export at root level?

export const getTopPoolsFromRedis = async (): Promise<GetTopPoolsResult | null> => {
    const pools = await redis.get('getTopPools');
    console.log('getting pool from redis result : ', pools);
    if (pools !== null) {
        return JSON.parse(pools) as GetTopPoolsResult;
    }

    return null;
};
