import { useEffect, useState } from 'react';
import { useWallet } from 'hooks/use-wallet';

import { UniswapApiFetcher as Uniswap } from 'services/api';
import { EthGasPrices } from '@sommelier/shared-types';

import { V3PositionData } from '@sommelier/shared-types/src/api';

import PositionManagerContainer from './tabs/position-manager-container';
import PositionDetailContainer from './tabs/position-detail-container';

type V3PositionDataList = { [key: string]: V3PositionData };
type Page = 'list' | 'detail';

function PositionContainer({
    gasPrices,
}: {
    gasPrices: EthGasPrices | null;
}): JSX.Element {
    const { wallet } = useWallet();

    const [page, setPage] = useState<Page>('list');
    const [
        positionsData,
        setPositionsData,
    ] = useState<V3PositionDataList | null>(null);
    const [isError, setIsError] = useState<boolean>(false);

    const [
        selectedPosition,
        setSelectedPosition,
    ] = useState<V3PositionData | null>(null);
    const [positionType, setPositionType] = useState<'positive' | 'negative'>(
        'positive',
    );

    useEffect(() => {
        const getPositionsData = async () => {
            if (!wallet?.account) return;

            const response = await fetch(
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                `/api/v1/mainnet/positions/${wallet?.account}/stats`,
            );
            if (response?.status === 200) {
                const data = await response.json();
                console.log('positions', data);
                setPositionsData(data);
            } else {
                setPositionsData({});
                setIsError(true);
            }
        };
        void getPositionsData();
    }, [wallet?.account]);

    const handleSelectPosition = (
        position: V3PositionData,
        pt: 'positive' | 'negative',
    ) => {
        setSelectedPosition(position);
        setPositionType(pt);
        setPage('detail');
    };

    const handleBack = () => {
        setPage('list');
    };

    return (
        <>
            {page === 'list' && positionsData && (
                <PositionManagerContainer
                    positionsData={positionsData}
                    onBack={() => handleBack()}
                    onSelectPosition={(
                        position: V3PositionData,
                        pt: 'positive' | 'negative',
                    ) => handleSelectPosition(position, pt)}
                />
            )}
            {page === 'detail' && positionsData !== null && (
                <PositionDetailContainer
                    positionData={selectedPosition}
                    positionType={positionType}
                    onBack={() => handleBack()}
                />
            )}
        </>
    );
}

export default PositionContainer;
