import { ethers } from 'ethers';
import { debug } from 'util/debug';
import config from 'config/app';

export async function getEstimateTimeEtherscan(
    gasPrice: string,
): Promise<number | undefined> {
    try {
        const headers = {
            'Content-Type': 'application/json;charset=utf-8',
            Accept: '*/*',
        };

        const apikey = config.etherscanApiKey;

        const response = await fetch(
            `https://api.etherscan.io/api?module=gastracker&action=gasestimate&gasprice=${gasPrice}&apikey=${apikey}`,
            {
                headers,
            },
        );
        const quote = await response.json();
        debug.quote = quote;

        if (quote.result && !isNaN(quote.result)) return parseFloat(quote.result);

        return undefined;
    } catch (err) {
        console.log('get Estimate Time error:', JSON.stringify(err));
        return undefined;
    }
}

export async function getEstimateTime(
    provider: ethers.providers.Web3Provider,
    transactionHash: string,
    defaultPrice: string,
): Promise<number | undefined> {
    try {
        const transaction = await provider.getTransaction(transactionHash);
        const gasPrice = transaction.gasPrice ? transaction.gasPrice.toString() : defaultPrice;

        const estimateTime = await getEstimateTimeEtherscan(gasPrice);

        return estimateTime;
    } catch (err) {
        console.log('get Estimate Time error:', JSON.stringify(err));
        return undefined;
    }
}
