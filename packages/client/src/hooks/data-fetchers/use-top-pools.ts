import { useQuery } from 'react-query';
import { useWallet } from 'hooks/use-wallet';
import {
    GetTopPoolsResult,
    TopPool as TopPoolType,
} from '@sommelier/shared-types/src/api';
import { debug } from 'util/debug';
import config from 'config/app';

import { storage } from 'util/localStorage';

// For Easy Import
export type TopPool = TopPoolType;
export interface UseTopPools {
    data: GetTopPoolsResult | void;
    isLoading: boolean;
    status: string;
    isError: boolean;
}

export interface UseRandomPool {
    data?: string;
    isLoading: boolean;
    status: string;
    isError: boolean;
}

export const useTopPools = (): UseTopPools => {
    const {
        wallet: { network },
    } = useWallet();

    const oldPoolId = storage.getCurrentPoolId();
    console.log('oldPoolId', oldPoolId ? oldPoolId : 'no id');

    const networkName = network ? config.networks[network].name : 'mainnet';
    // const networkName = 'rinkeby';

    const getTopPools = async () => {
        const response = await fetch(
            `/api/v1/${networkName}/randomPool?count=${50}&old=${
                oldPoolId ? oldPoolId : '111'
            }`,
        );
        if (!response.ok) throw new Error(`Failed to fetch top pools`);

        const data = await (response.json() as Promise<GetTopPoolsResult>);

        debug.pools = data;

        return data;
    };

    const { data, isLoading, status, isError } = useQuery(
        ['topPools', networkName],
        getTopPools,
    );

    return { data, isLoading, status, isError };
};

export const useRandomPool = (): UseRandomPool => {
    const {
        wallet: { network },
    } = useWallet();

    const oldPoolId = storage.getCurrentPoolId();

    const networkName = network ? config.networks[network].name : 'mainnet';
    // const networkName = 'rinkeby';

    const getRandomPool = async () => {
        const response = await fetch(
            `/api/v1/${networkName}/randomPool?count=${50}&old=${
                oldPoolId ? oldPoolId : '222'
            }`,
        );
        if (!response.ok) throw new Error(`Failed to fetch top pools`);

        const data = await (response.json() as Promise<string>);

        debug.pools = data;

        return data;
    };

    const { data, isLoading, status, isError } = useQuery(
        ['topPools', networkName],
        getRandomPool,
    );

    return { data, isLoading, status, isError };
};
