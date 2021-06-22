import { PoolLike } from '@sommelier/shared-types/src/api';

const usdFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',

    // These options are needed to round to whole numbers if that's what you want.
    //minimumFractionDigits: 0, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    //maximumFractionDigits: 0, // (causes 2500.99 to be printed as $2,501)
});

export const formatUSD = (val: string | number): string =>
    usdFormatter.format(parseFloat(val.toString()));

export const formatAddress = (val: string): string => {
    return `${val.substring(0, 6)}...${val.substring(val.length - 5)}`;
};
export const compactHash = (val = ''): string => {
    if (val.length !== 66) {
        return val.substring(0, 6).concat('... ');
    }
    return val.substring(0, 6).concat('...').concat(val.substring(62));
};

export const poolSymbol = (pool: PoolLike, separator = ' '): string => {
    if (!pool || !pool.token0 || !pool.token1) return '';

    return `${pool.token0.symbol}${separator}${pool.token1.symbol}`;
};

export const formatNumber = (val: number): string => {
    let ret;

    if (val < Math.pow(10, 5)) {
        ret = usdFormatter.format(Math.round(parseFloat(val.toString())));
    } else if (val < Math.pow(10, 8)) {
        ret = usdFormatter.format(Math.round(val / 1000)).toString();
    } else {
        ret = usdFormatter.format(Math.round(val / 1000000)).toString();
    }

    ret = ret.substring(0, ret.length - 3);

    if (val < Math.pow(10, 5)) {
        return ret;
    }

    if (val < Math.pow(10, 8)) {
        return `${ret}K`;
    }

    return `${ret}M`;
};

export type { PoolLike };
