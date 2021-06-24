import { Button, Modal } from 'react-bootstrap';
import { useState } from 'react';
import { useWallet } from 'hooks/use-wallet';
import { useErrorHandler } from 'react-error-boundary';
import { ReactComponent as MetamaskLogo } from 'styles/metamask-logo.svg';
import { ReactComponent as WalletConnectLogo } from 'styles/walletconnect-logo.svg';
import Sentry, { SentryError } from 'util/sentry';

import './alert-modal.scss';

function AlertModal({
    titleText,
    descriptionText,
    show,
    setShow,
}: {
    titleText: string;
    descriptionText: string;
    show: boolean;
    setShow: (show: boolean) => void;
}): JSX.Element {
    const handleClose = () => setShow(false);

    return (
        <Modal
            show={show}
            onHide={handleClose}
            dialogClassName='add-liquidity-alert-modal'
        >
            <Modal.Header>
                <div className='alert-modal-header'>
                    <div className='alert-modal-close'>
                        <button onClick={(e) => handleClose()}>X</button>
                    </div>
                    <div className='alert-modal-header-text'>{titleText}</div>
                </div>
            </Modal.Header>
            <Modal.Body className='alert-modal-body'>
                <div className='alert-modal-description'>{descriptionText}</div>
            </Modal.Body>
        </Modal>
    );
}

export default AlertModal;
