import { Request, Router } from 'express';
import { celebrate, Joi, Segments } from 'celebrate';

import { EthNetwork } from '@sommelier/shared-types';

import { HTTPError } from 'api/util/errors';
import { memoConfig, UniswapV3Fetchers } from 'services/uniswap-v3';
import {
    GetPositionsResult,
    GetPositionSnapshotsResult,
    V3PositionData,
    RedisV3PositionData,
} from '@sommelier/shared-types/src/api'; // how do we export at root level?
import catchAsyncRoute from 'api/util/catch-async-route';
import { networkValidator } from 'api/util/validators';
import validateEthAddress from 'api/util/validate-eth-address';
import { calculateStatsForNFLPs } from 'util/calculate-stats-v3';
import { getEthPriceAtTime } from 'util/calculate-stats';
import { getPositionRedisData } from 'api/util/position-redis';

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

    const positionData = await getPositionRedisData(address);
    return positionData.positionData;
}

// GET /positions/:address
async function getPositionsTotalNotionalGain(
    req: Request<Path, unknown, unknown, unknown>,
): Promise<string> {
    const { network, address } = req.params;

    const positionData = await getPositionRedisData(address);
    return positionData.notionalGain;
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
