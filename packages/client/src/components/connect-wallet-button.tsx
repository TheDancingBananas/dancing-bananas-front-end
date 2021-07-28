import { useMemo } from 'react';
import config from 'config/app';
import { ethers } from 'ethers';
import { useWallet } from 'hooks/use-wallet';
import { useETHBalance } from 'hooks/use-balance';
import { formatAddress, formatUSD } from 'util/formats';
import { storage } from 'util/localStorage';

import pngWallet from 'styles/images/wallet.png';
import pngEth from 'styles/images/eth.png';
import pngBanana from 'styles/images/dancing-banana.png';
import pngTelegram from 'styles/images/telegram-108.png';
import pngCuriousMonkey from 'styles/images/curious-109.png';
import pngMysteriousChimp from 'styles/images/mysterious_chimp-109.png';

const monkeyLevels = [pngCuriousMonkey, pngMysteriousChimp];
function ConnectWalletButton({
    onClick,
}: {
    onClick: () => void;
}): JSX.Element {
    const { wallet } = useWallet();
    const account = wallet?.account;
    const ethBalance = useETHBalance();
    const level = storage.getLevel();
    // const network = wallet?.network
    //     ? config.networks[wallet?.network].name
    //     : 'Connected';

    // we care about the network only in dev
    // const buttonText = account
    //     ? network.toUpperCase() + ' : ' + account.toString()
    //     : 'CONNECT WALLET';

    // This is for showing icon before level
    // const monkeyLevelIcon: string = useMemo(() => {
    //     return monkeyLevels[Number(level) - 1];
    // }, [level]);

    return (
        <div>
            {!account && (
                <div
                    style={{
                        display: 'flex',
                        width: 450,
                        justifyContent: 'space-between',
                    }}
                >
                    <button
                        className='connect-wallet-button black'
                        onClick={onClick}
                        style={{
                            marginLeft: 100,
                        }}
                    >
                        <img src={pngWallet} /> Connect Wallet
                    </button>
                    <button
                        className='connect-wallet-button pink'
                        onClick={() => {
                            window.open('https://t.me/getbananas', '_blank');
                        }}
                    >
                        <img src={pngTelegram} />
                    </button>
                </div>
            )}
            {account && (
                <div
                    style={{
                        display: 'flex',
                        width: 450,
                        justifyContent: 'space-between',
                    }}
                >
                    <button
                        className='connect-wallet-button white'
                        onClick={onClick}
                    >
                        <span className='monkey-level'>LEVEL {level}</span>
                    </button>
                    <button className='connect-wallet-button black'>
                        <img src={pngEth} />
                        {parseFloat(
                            ethers.utils.formatUnits(ethBalance, 18),
                        ).toFixed(2)}
                    </button>
                    <button className='connect-wallet-button yellow'>
                        <img src={pngBanana} />
                        {100}
                    </button>
                    <button
                        className='connect-wallet-button pink'
                        onClick={() => {
                            window.open('https://t.me/getbananas', '_blank');
                        }}
                    >
                        <img src={pngTelegram} />
                    </button>
                </div>
            )}
        </div>
    );
}

export default ConnectWalletButton;
