import config from 'config/app';
import { ethers } from 'ethers';
import { useWallet } from 'hooks/use-wallet';
import { useETHBalance } from 'hooks/use-balance';
import { formatAddress, formatUSD } from 'util/formats';

import pngWallet from 'styles/images/wallet.png';
import pngEth from 'styles/images/eth.png';
import pngBanana from 'styles/images/dancing-banana.png';

function ConnectWalletButton({
    onClick,
}: {
    onClick: () => void;
}): JSX.Element {
    const { wallet } = useWallet();
    const account = wallet?.account;
    const ethBalance = useETHBalance();
    // const network = wallet?.network
    //     ? config.networks[wallet?.network].name
    //     : 'Connected';

    // we care about the network only in dev
    // const buttonText = account
    //     ? network.toUpperCase() + ' : ' + account.toString()
    //     : 'CONNECT WALLET';

    return (
        <div>
            {!account && (
                <button className='connect-wallet-button' onClick={onClick}>
                    <img src={pngWallet} /> Connect Wallet
                </button>
            )}
            {account && (
                <div style={{ display: 'flex' }}>
                    <button className='connect-wallet-button' onClick={onClick}>
                        <img src={pngWallet} />
                        {formatAddress(account.toString())}
                    </button>
                    <button className='connect-wallet-button'>
                        <img src={pngEth} />
                        {parseFloat(
                            ethers.utils.formatUnits(ethBalance, 18),
                        ).toFixed(2)}
                    </button>
                    <button className='connect-wallet-button'>
                        <img src={pngBanana} />
                        {100}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ConnectWalletButton;
