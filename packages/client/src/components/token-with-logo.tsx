import { IUniswapPair } from '@sommelier/shared-types';
import config from 'config/app';

import logoMappings from 'constants/trustwallet-mappings.json';
import { Pair } from 'constants/prop-types';

import pngETH from 'styles/images/eth.png';

function TokenWithLogo(
    side: 'left' | 'right',
): (
    { item: pair }: { item: IUniswapPair },
    logoPosition?: string,
) => JSX.Element {
    const TokenOnGivenSide = (
        { item: pair }: { item: IUniswapPair },
        logoPosition = 'left',
    ) => {
        let token;

        if (side === 'left') token = pair.token0;
        else if (side === 'right') token = pair.token1;
        else throw new Error('Unknown side');

        if (logoPosition === 'left') {
            return (
                <span>
                    {resolveLogo(token.id)} {token.symbol}
                </span>
            );
        } else {
            return (
                <span>
                    {token.symbol} {resolveLogo(token.id)}
                </span>
            );
        }
    };

    TokenOnGivenSide.propTypes = { item: Pair };

    return TokenOnGivenSide;
}

TokenWithLogo.displayName = 'TokenWithLogo';

const weth = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

export function resolveLogo(addressLower?: string, size = '24px'): JSX.Element {
    if (
        addressLower?.toLowerCase() === config.ethAddress.toLowerCase() ||
        addressLower?.toLowerCase() === weth.toLowerCase()
    ) {
        // Show ETH logo
        return (
            <span>
                <img src={pngETH} alt='🍇' height={size} width={size} />
            </span>
        );
    }

    let address: string | undefined = undefined;

    if (addressLower && addressLower in logoMappings) {
        address = logoMappings[addressLower as keyof typeof logoMappings];
    }

    if (!address) return <span className='no-image'></span>;

    const imgUrl = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/${address}/logo.png`;
    return (
        <span>
            <img src={imgUrl} alt='🍇' height={size} width={size} />
        </span>
    );
}

export function PairWithLogo({
    pair: { token0, token1 },
}: {
    pair: IUniswapPair;
}): JSX.Element {
    return (
        <span>
            {resolveLogo(token0.id)}{' '}
            <span className='market-data-pair-span'>
                {token0.symbol}/{token1.symbol}
            </span>{' '}
            {resolveLogo(token1.id)}
        </span>
    );
}

export default TokenWithLogo;
