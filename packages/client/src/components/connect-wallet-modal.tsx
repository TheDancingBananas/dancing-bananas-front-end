import { Button, Modal } from 'react-bootstrap';
import { useState } from 'react';
import { useWallet } from 'hooks/use-wallet';
import { useErrorHandler } from 'react-error-boundary';
import { ReactComponent as MetamaskLogo } from 'styles/metamask-logo.svg';
import { ReactComponent as WalletConnectLogo } from 'styles/walletconnect-logo.svg';
import Sentry, { SentryError } from 'util/sentry';

import './connect-wallet-modal.scss';

import metamaskPng from 'styles/metamask.png';
import walletconnectPng from 'styles/walletconnect.png';

function ConnectWalletModal({
    show,
    setShow,
}: {
    show: boolean;
    setShow: (show: boolean) => void;
}): JSX.Element {
    const handleClose = () => setShow(false);
    const handleError = useErrorHandler();
    const [showReloadModal, setShowReloadModal] = useState<boolean>(false);
    const {
        wallet,
        connectMetaMask,
        connectWalletConnect,
        disconnectWallet,
        availableProviders,
    } = useWallet();
    const titleText = wallet?.account
        ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          `Connected`
        : 'Connect Wallet';

    const handleConnectMetaMask = async () => {
        try {
            await connectMetaMask();
        } catch (e) {
            handleError(e);
        }

        // Close modlal after half-second
        setTimeout(handleClose, 500);
    };

    const handleConnectWalletConnect = async () => {
        try {
            await connectWalletConnect();
            setTimeout(handleClose, 500);
        } catch (err) {
            // setTimeout(handleClose, 100);
            // wallet connect throws error incase user closes the modal
            // Send event to sentry
            setShowReloadModal(true);
            const sentryErr = new SentryError(
                `could not connect to wallet connect provider`,
                err,
            );
            Sentry.captureException(sentryErr);
        }
    };

    const renderNotConnectedBody = () => {
        if (showReloadModal)
            return (
                <p className='connect-wallet-modal-description'>
                    Could not connect to Wallet Connect provider. Please reload
                    and try again.
                </p>
            );

        return (
            <>
                <p className='connect-wallet-modal-description'>
                    Choose a wallet provider
                    <br />
                    to connect with
                </p>
                <div className='connect-wallet-modal-button-container'>
                    <button
                        className='connect-wallet-modal-button'
                        // disabled={!availableProviders.metamask}
                        onClick={handleConnectMetaMask}
                    >
                        <img src={metamaskPng} />
                        <span>METAMASK</span>
                    </button>
                    <button
                        className='connect-wallet-modal-button'
                        disabled={!availableProviders.walletconnect}
                        onClick={handleConnectWalletConnect}
                    >
                        <img src={walletconnectPng} />
                        <span>WALLETCONNECT</span>
                    </button>
                </div>
            </>
        );
    };

    const renderConnectedBody = () => (
        <>
            <p className='connect-wallet-modal-description'>
                ${wallet?.account}
            </p>
            <div className='connect-wallet-modal-button-container'>
                <button
                    className='connect-wallet-modal-button'
                    onClick={disconnectWallet}
                >
                    Disconnect
                </button>
            </div>
        </>
    );

    return (
        <Modal
            show={show}
            onHide={handleClose}
            dialogClassName='connect-wallet-modal'
        >
            <Modal.Header>
                <div className='connect-wallet-modal-header'>
                    <div className='connect-wallet-modal-close'>
                        <button onClick={(e) => handleClose()}>X</button>
                    </div>
                    <div className='connect-wallet-modal-header-text'>
                        {titleText}
                    </div>
                </div>
            </Modal.Header>
            <Modal.Body>
                {!wallet?.account && renderNotConnectedBody()}
                {wallet?.account && renderConnectedBody()}
                {!wallet?.account && showReloadModal && (
                    <div className='connect-wallet-modal-button-container'>
                        <button
                            className='connect-wallet-modal-button'
                            onClick={() => window.location.reload()}
                        >
                            Reload
                        </button>
                    </div>
                )}
            </Modal.Body>
        </Modal>
    );
}

export default ConnectWalletModal;
