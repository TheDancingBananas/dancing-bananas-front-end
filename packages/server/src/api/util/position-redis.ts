import redis from 'util/redis';
import { UniswapV3Fetchers } from 'services/uniswap-v3';
import { keepCachePopulated } from 'util/redis-data-cache';
import BigNumber from 'bignumber.js';
import { calculateStatsForNFLPs } from 'util/calculate-stats-v3';
import {
    RedisV3PositionData,
    GetPositionSnapshotsResult,
    V3PositionData,
    V3PositionDataList,
} from '@sommelier/shared-types/src/api';

export const getPositionRedisData = async (
    address: string,
): Promise<RedisV3PositionData> => {
    const data = await redis.get(`getPositionStatsData:"${address}"`);
    console.log(
        'rediskey--------------------: ',
        `getPositionStatsData:"${address}"`,
    );
    if (data !== null) {
        console.log(
            '-------------------------------------successfully got position data from redis-----------------------',
        );
        return JSON.parse(data) as RedisV3PositionData;
    }

    return await getPositionData(address);
};

const getPositionData = async (
    address: string,
): Promise<RedisV3PositionData> => {
    void keepCachePopulated(
        redis,
        async function getPositionStatsData(address: string) {
            return await calcPositionData(address);
        },
        [address],
        60 * 60,
    );
    return await calcPositionData(address);
};

const calcPositionData = async (
    address: string,
): Promise<RedisV3PositionData> => {
    const fetcher = UniswapV3Fetchers.get('mainnet');
    const positions = await fetcher.getPositions(address);
    const snapshots = await fetcher.getPositionSnapshots(address);
    const snapshotsByNFLP = snapshots.reduce(
        (acc: { [key: string]: GetPositionSnapshotsResult }, snapshot) => {
            // TODO: Deploy a new subgraph which uses a delineator
            // between NFLP and timestamp. Right now we assume last 10
            // digits are timestamp.
            const nflpId = snapshot.id.split('#')[0];

            if (!acc[nflpId]) {
                acc[nflpId] = [snapshot];
            } else {
                acc[nflpId].push(snapshot);
            }

            return acc;
        },
        {},
    );

    const results: V3PositionDataList = {};
    for (const position of positions) {
        const [nflpId] = position.id.split('#');

        results[nflpId] = {
            position,
            snapshots: snapshotsByNFLP[nflpId],
            stats: await calculateStatsForNFLPs(
                position,
                snapshotsByNFLP[nflpId],
            ),
        };
    }

    let totalGain = new BigNumber(0);
    const positionKeys = Object.keys(results);

    // const currentDate = new Date();

    for (let i = 0; i < positionKeys.length; i++) {
        const positionData: V3PositionData = results[positionKeys[i]];
        // console.log('*******************************');
        // console.log(currentDate);

        const feeUSD: BigNumber = positionData.stats.totalFeesUSD;

        // const timestamp = positionData.snapshots[0].timestamp;
        // const addDate = new Date(timestamp);

        const tokenValueDiff = positionData.stats.usdAmount.minus(
            positionData.stats.entryUsdAmount,
        );
        totalGain = totalGain.plus(feeUSD).plus(tokenValueDiff);

        // let initialToken0Price: BigNumber;
        // let initialToken1Price: BigNumber;
        // if (pair.symbols[0] === 'ETH' || pair.symbols[0] === 'WETH') {
        //     initialToken0Price = initialEthPrice;
        //     initialToken1Price = initialEthPrice.times(initialExchangeRate);
        // } else if (pair.symbols[1] === 'ETH' || pair.symbols[1] === 'WETH') {
        //     initialToken0Price = initialEthPrice.times(
        //         initialExchangeRate.pow(-1),
        //     );
        //     initialToken1Price = initialEthPrice;
        // } else {
        //     throw new Error(
        //         `Trying to compute notional gain for non-floating pair: ${pair.symbols.join(
        //             '/',
        //         )}`,
        //     );
        // }

        // let currentToken0Price: BigNumber;
        // let currentToken1Price: BigNumber;
        // if (pair.symbols[0] === 'ETH' || pair.symbols[0] === 'WETH') {
        //     currentToken0Price = currentEthPrice;
        //     currentToken1Price = currentEthPrice.times(currentExchangeRate);
        // } else if (pair.symbols[1] === 'ETH' || pair.symbols[1] === 'WETH') {
        //     currentToken0Price = currentEthPrice.times(
        //         currentExchangeRate.pow(-1),
        //     );
        //     currentToken1Price = currentEthPrice;
        // } else {
        //     throw new Error(
        //         `Trying to compute notional gain for non-floating pair: ${pair.symbols.join(
        //             '/',
        //         )}`,
        //     );
        // }
    }
    return {
        positionData: results,
        notionalGain: totalGain.isPositive() ? totalGain.valueOf() : '0',
    };
};
