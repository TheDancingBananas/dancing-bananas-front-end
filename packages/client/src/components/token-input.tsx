import classNames from 'classnames';
import { ethers } from 'ethers';
import { WalletBalances } from 'types/states';
import BigNumber from 'bignumber.js';

const toBalanceStr = (
    token: string,
    balances: WalletBalances,
    basketAmount: number,
): string => {
    const balance = balances[token]?.balance;

    return new BigNumber(
        ethers.utils.formatUnits(
            balance || 0,
            parseInt(balances[token]?.decimals || '0', 10),
        ),
    )
        .minus(basketAmount)
        .toFixed(2);
};

type TokenInputProps = {
    token: string;
    amount: string;
    updateAmount: (amount: string) => void;
    handleTokenRatio: (token: string, amount: string) => void;
    balances: WalletBalances;
    basketAmount?: number | 0;
    twoSide: boolean;
    disabled: boolean;
    isNANA?: boolean | false;
    selected: boolean;
};
export const TokenInput = ({
    token,
    amount,
    updateAmount,
    handleTokenRatio,
    balances,
    basketAmount,
    twoSide,
    disabled,
    isNANA,
    selected,
}: TokenInputProps): JSX.Element => (
    <div className={classNames({ 'token-input': true, disabled })}>
        <div className={classNames('token-input-balances', { nana: isNANA })}>
            <input
                placeholder='0.00'
                value={amount}
                disabled={disabled}
                onChange={(e) => {
                    const val = e.target.value;

                    if (!val || !new BigNumber(val).isNaN()) {
                        updateAmount(val);
                        twoSide && handleTokenRatio(token, val);
                    }
                }}
            />
            <span
                style={{ height: '25' }}
                className={classNames('token-input-balance', {
                    selected: selected,
                })}
            >
                {toBalanceStr(token, balances, Number(basketAmount))}
            </span>
        </div>
        <button
            className={classNames('token-input-max', { nana: isNANA })}
            disabled={!balances?.[token] || disabled}
            onClick={() => {
                updateAmount(
                    toBalanceStr(token, balances, Number(basketAmount)),
                );
                handleTokenRatio(
                    token,
                    toBalanceStr(token, balances, Number(basketAmount)),
                );
            }}
        >
            <div style={{ fontSize: '18px' }}>MAX</div>
            <span
                style={{ fontSize: '12px' }}
                className={classNames('token-input-balance', {
                    selected: selected,
                })}
            >
                BALANCE
            </span>
        </button>
    </div>
);
