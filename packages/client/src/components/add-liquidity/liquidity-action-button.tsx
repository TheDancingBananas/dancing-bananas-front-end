import classNames from 'classnames';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { WalletBalances } from 'types/states';
import { ethers } from 'ethers';
import { useWallet } from 'hooks/use-wallet';
import { Rings } from 'react-loading-icons';

export const LiquidityActionButton = ({
    tokenInputState,
    onClick,
    balances,
    pendingApproval,
    pendingBounds,
    disabledInput,
    currentGasPrice,
}: {
    tokenInputState: any;
    onClick: () => void;
    balances: WalletBalances;
    pendingApproval: boolean;
    pendingBounds: boolean;
    disabledInput: string[] | null;
    currentGasPrice: number | null;
}): JSX.Element => {
    // const [isDisabled, setIsDisabled] = useState(disabled);
    const [buttonState, setButtonState] = useState('Add Liquidity');
    const { wallet } = useWallet();

    const isDisabled = (symbol: string) =>
        disabledInput && disabledInput.includes(symbol);

    useEffect(() => {
        const numOfTokens = tokenInputState?.selectedTokens?.length ?? 0;

        if (!wallet?.account) {
            setButtonState('connectWallet');
            return;
        }

        // a wallet does exist, check for edge case on wcProvider being disconnected
        if (
            wallet?.providerName === 'walletconnect' &&
            !wallet?.provider?.connected
        ) {
            setButtonState('reConnectWallet');
            return;
        }

        if (!currentGasPrice) {
            setButtonState('gasPriceNotSelected');
            return;
        }

        if (pendingApproval) {
            setButtonState('pendingApproval');
            return;
        }

        if (tokenInputState?.selectedTokens.length === 0) {
            setButtonState('selectTokens');
            return;
        }

        for (let i = 0; i < numOfTokens; i++) {
            const symbol = tokenInputState?.selectedTokens[i];
            if (!tokenInputState[symbol].amount && !isDisabled(symbol)) {
                setButtonState('enterAmount');
                return;
            }
            const tokenAmount = new BigNumber(tokenInputState[symbol].amount);

            if ((!tokenAmount || tokenAmount.lte(0)) && !isDisabled(symbol)) {
                setButtonState('enterAmount');
                return;
            }
        }

        for (let i = 0; i < numOfTokens; i++) {
            const symbol = tokenInputState?.selectedTokens[i];
            const tokenAmount = new BigNumber(tokenInputState[symbol].amount);
            const tokenBalance =
                ethers.utils.formatUnits(
                    balances?.[symbol]?.balance || 0,
                    parseInt(balances?.[symbol]?.decimals || '0', 10),
                ) || '0';

            if (tokenAmount.gt(tokenBalance)) {
                setButtonState('insufficientFunds');
                return;
            }
        }

        if (pendingBounds) {
            setButtonState('pendingBounds');
            return;
        }
        setButtonState('addLiquidity');
    }, [
        currentGasPrice,
        balances,
        pendingApproval,
        pendingBounds,
        tokenInputState,
        wallet?.account,
        wallet?.provider,
        isDisabled,
    ]);

    switch (buttonState) {
        case 'pendingApproval':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    <Rings width='24px' height='24px' />
                    {' Approving '}
                </button>
            );
        case 'connectWallet':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {'Connect Wallet'}
                </button>
            );
        case 'reConnectWallet':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {'Re-Connect Wallet'}
                </button>
            );
        case 'gasPriceNotSelected':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {'Select Transaction Speed'}
                </button>
            );
        case 'selectTokens':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {'Select Tokens'}
                </button>
            );
        case 'enterAmount':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {'Enter Amount(s)'}
                </button>
            );
        case 'insufficientFunds':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {'Insufficient Funds'}
                </button>
            );
        case 'pendingBounds':
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    <Rings width='24px' height='24px' />
                    {' Calculating Range '}
                </button>
            );
        case 'addLiquidity':
            return (
                <button
                    disabled={false}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    {' Add Liquidity'}
                </button>
            );
        default:
            return (
                <button
                    disabled={true}
                    onClick={onClick}
                    className={classNames('pair-action-button green')}
                >
                    <Rings width='24px' height='24px' />
                    {' Awaiting Details'}
                </button>
            );
    }
};
