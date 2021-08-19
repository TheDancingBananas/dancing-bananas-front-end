import { Request, Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { EthNetwork } from '@sommelier/shared-types';

import { HTTPError } from 'api/util/errors';
import { memoConfig, UniswapV3Fetchers } from 'services/uniswap-v3';
import {
    GetPositionsResult,
    GetPositionSnapshotsResult,
    V3PositionData,
} from '@sommelier/shared-types/src/api'; // how do we export at root level?
import catchAsyncRoute from 'api/util/catch-async-route';
import { networkValidator } from 'api/util/validators';
import validateEthAddress from 'api/util/validate-eth-address';
import { calculateStatsForNFLPs } from 'util/calculate-stats-v3';
import { getEthPriceAtTime } from 'util/calculate-stats';

import config from '@config';
import BigNumber from 'bignumber.js';

const networks = Object.keys(config.uniswap.v3.networks);

type Path = {
    network: EthNetwork;
    address: string;
};

type V3PositionDataList = { [key: string]: V3PositionData };

const getPositionsValidator = celebrate({
    [Segments.PARAMS]: Joi.object().keys({
        network: Joi.string()
            .valid(...networks)
            .required(),
        address: Joi.string()
            .custom(validateEthAddress, 'Validate address')
            .required(),
    }),
});

// GET /positions/:address
async function getPositionStats(
    req: Request<Path, unknown, unknown, unknown>,
): Promise<V3PositionDataList> {
    const { network, address } = req.params;
    const fetcher = UniswapV3Fetchers.get(network);

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

    return results;
}

// GET /positions/:address
async function getPositionsTotalNotionalGain(
    req: Request<Path, unknown, unknown, unknown>,
): Promise<string> {
    const { network, address } = req.params;
    const fetcher = UniswapV3Fetchers.get(network);

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

    return totalGain.isPositive() ? totalGain.valueOf() : '0';
}

const route = Router();
const cacheConfig = { public: true };
// sMaxAge: 5 min in seconds
const positionsConfig = {
    maxAge: 30,
    sMaxAge: memoConfig.getTopPools.ttl / 1000,
    ...cacheConfig,
};
route.get(
    '/:network/positions/:address/stats',
    getPositionsValidator,
    catchAsyncRoute(getPositionStats, positionsConfig),
);

route.get(
    '/:network/positions/:address/notional-gain',
    getPositionsValidator,
    catchAsyncRoute(getPositionsTotalNotionalGain, positionsConfig),
);

export default route;
