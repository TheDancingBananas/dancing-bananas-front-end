import { useQuery } from 'react-query';
import { useWallet } from 'hooks/use-wallet';
import { V3PositionData } from '@sommelier/shared-types/src/api';
import config from 'config/app';

export type V3PositionDataList = { [key: string]: V3PositionData };

// For Easy Import
export interface UsePositionManagers {
    data: V3PositionDataList | null;
    isLoading: boolean;
    status: string;
    isError: boolean;
}

export const usePositionManagers = (): V3PositionDataList | undefined => {
    const {
        wallet: { network = '1', account },
    } = useWallet();

    const networkName = network ? config.networks[network].name : 'mainnet';
    // const networkName = 'rinkeby';

    const getPositionManagers = async () => {
        const response = await fetch(
            `/api/v1/${networkName}/positions/${account}/stats`,
        );
        if (!response.ok) throw new Error(`Failed to fetch top pools`);

        const data = await (response.json() as Promise<V3PositionDataList>);

        console.log(data);

        return data;
    };

    const { data, isLoading, status, isError } = useQuery(
        ['positionManagers', networkName, account],
        getPositionManagers,
    );

    return data;
};
