import config from 'config/app';
import { useWallet } from 'hooks/use-wallet';
import { formatAddress } from 'util/formats';

import pngWallet from 'styles/images/wallet.png';

function ConnectWalletButton({
    onClick,
}: {
    onClick: () => void;
}): JSX.Element {
    const { wallet } = useWallet();
    const account = wallet?.account;
    // const network = wallet?.network
    //     ? config.networks[wallet?.network].name
    //     : 'Connected';

    // we care about the network only in dev
    // const buttonText = account
    //     ? network.toUpperCase() + ' : ' + account.toString()
    //     : 'CONNECT WALLET';
    const buttonText = account
        ? formatAddress(account.toString())
        : 'Connect Wallet';
    return (
        <button className='connect-wallet-button' onClick={onClick}>
            <img src={pngWallet} />
            <span>{buttonText}</span>
        </button>
    );
}

export default ConnectWalletButton;
