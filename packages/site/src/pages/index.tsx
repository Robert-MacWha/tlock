import React, { useState } from 'react';
import QRCode from 'qrcode';
import { useMetaMask } from '../hooks/useMetaMask';
import { MetaMaskProvider, useMetaMaskContext } from '../hooks/MetamaskContext';
import { useRequest } from '../hooks/useRequest';
import { useRequestSnap } from '../hooks/useRequestSnap';
import { EXPO_URL, SNAP_ORIGIN } from '../config';

// QR Code Component with actual generation
const QRCodeDisplay = ({
    value,
    size = 200,
}: {
    value: string;
    size?: number;
}) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');

    React.useEffect(() => {
        QRCode.toDataURL(value, { width: size, margin: 2 })
            .then(setQrDataUrl)
            .catch(console.error);
    }, [value, size]);

    return qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code" className="img-fluid" />
    ) : (
        <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
        </div>
    );
};

const SnapDemo = () => {
    const { isFlask, snapsDetected, getSnap } = useMetaMask();
    const { error } = useMetaMaskContext();
    const request = useRequest();
    const requestSnap = useRequestSnap(SNAP_ORIGIN);

    const [signatureResult, setSignatureResult] = useState<string>('');
    const [message, setMessage] = useState('Hello from MetaMask Snap!');

    const handleInstallSnap = async () => {
        try {
            await requestSnap();
            await getSnap();
        } catch (err) {
            console.error('Failed to install snap:', err);
        }
    };

    const handleSignPersonal = async () => {
        try {
            const accounts = (await request({
                method: 'eth_requestAccounts',
            })) as string[];
            if (!accounts?.length) throw new Error('No accounts available');

            const result = await request({
                method: 'personal_sign',
                params: [message, accounts[0]],
            });
            setSignatureResult(result as string);
        } catch (err) {
            console.error('Failed to sign message:', err);
        }
    };

    return (
        <div className="container">
            <header className="py-3 mb-4 border-bottom">
                <h1 className="h2">Foxguard Snap Demo</h1>
                <p className="text-muted">
                    Follow these 17-ish* steps to install the Foxguard metamask
                    snap and the companion app so you can see what Robert's been
                    going on about!
                </p>
            </header>

            {error && (
                <div className="alert alert-danger">
                    <strong>Error:</strong> {error.message}
                </div>
            )}

            <div className="row g-4">
                {/* MetaMask Flask Detection */}
                <div className="col-12">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5>1. MetaMask Flask</h5>
                        </div>
                        <div className="card-body">
                            {!snapsDetected ? (
                                <div className="alert alert-warning mb-0">
                                    <p className="mb-2">
                                        MetaMask not detected
                                    </p>
                                    <a
                                        href="https://metamask.io/flask/"
                                        className="btn btn-primary btn-sm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Install MetaMask Flask
                                    </a>
                                </div>
                            ) : !isFlask ? (
                                <div className="alert alert-warning mb-0">
                                    <p className="mb-2">Flask required</p>
                                    <a
                                        href="https://metamask.io/flask/"
                                        className="btn btn-primary btn-sm"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Install Flask
                                    </a>
                                </div>
                            ) : (
                                <div className="alert alert-success mb-0">
                                    <p className="mb-0">
                                        ✓ MetaMask Flask detected
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Snap Installation */}
                <div className="col-12">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5>2. Foxguard Snap</h5>
                        </div>
                        <div className="card-body">
                            <div>
                                <p className="mb-2">
                                    Install the Foxguard snap
                                </p>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => void handleInstallSnap()}
                                >
                                    Install Snap
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Install Expo Go */}
                <div className="col-12">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5>3. Install Expo Go</h5>
                        </div>
                        <div className="card-body">
                            <p className="mb-2">
                                Install the Expo Go app on your mobile device.
                                Expo go is a sandbox for react-native apps,
                                that's actually kind of incredible for
                                distributing testing apps across various
                                platforms.
                            </p>
                            <a
                                href="https://expo.dev/client"
                                className="btn btn-primary btn-sm"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download Expo Go
                            </a>
                        </div>
                    </div>
                </div>

                {/* QR Code */}
                <div className="col-12">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5>4. Foxguard Companion App</h5>
                        </div>
                        <div className="card-body text-center">
                            <QRCodeDisplay value={EXPO_URL} size={150} />
                            <p className="mt-2 mb-0 text-muted small">
                                Open Expo Go and scan the QR code to launch the
                                sandboxed app
                            </p>
                        </div>
                    </div>
                </div>

                {/*  Foxguard Setup */}
                <div className="col-12">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5>5. Foxguard Setup</h5>
                        </div>
                        <div className="card-body">
                            <p className="mb-2">
                                Follow the setup instructions within the
                                Foxguard companion app, then pair it with the
                                snap in metamask.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Personal Sign */}
                <div className="col-12">
                    <div className="card h-100">
                        <div className="card-header">
                            <h5>6. Personal Sign</h5>
                            <p className="mb-2">
                                Test your connection with a personal_sign
                                request, or try sending a transaction (TESTNET)
                                from the account!
                            </p>
                        </div>
                        <div className="card-body">
                            <div className="mb-2">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Message to sign"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            <button
                                className="btn btn-success btn-sm mb-2"
                                onClick={() => void handleSignPersonal()}
                                disabled={!snapsDetected}
                            >
                                Sign Message
                            </button>
                            {signatureResult && (
                                <textarea
                                    className="form-control form-control-sm"
                                    rows={2}
                                    value={signatureResult}
                                    readOnly
                                    placeholder="Signature will appear here"
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Page = () => {
    return (
        <MetaMaskProvider>
            <SnapDemo />
        </MetaMaskProvider>
    );
};

export default Page;
