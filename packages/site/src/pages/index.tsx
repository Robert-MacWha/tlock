import React, { useState } from 'react';
import { MetaMaskProvider } from '../hooks/MetamaskContext';
import { useMetaMask } from '../hooks/useMetaMask';
import { useMetaMaskContext } from '../hooks/MetamaskContext';
import { useRequest } from '../hooks/useRequest';
import { useRequestSnap } from '../hooks/useRequestSnap';
import { SNAP_ORIGIN } from '../config';

// Simple QR Code Component
const QRCode = ({ value, size = 200 }: { value: string; size?: number }) => {
    return (
        <div
            className="d-flex align-items-center justify-content-center border"
            style={{ width: size, height: size, fontSize: '12px', textAlign: 'center' }}
        >
            QR Code<br />
            <small>{value}</small>
        </div>
    );
};

// Main Demo Component
const SnapDemo = () => {
    const { isFlask, snapsDetected, installedSnap, getSnap } = useMetaMask();
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
        if (!installedSnap) return;

        try {
            const result = await request({
                method: 'wallet_invokeSnap',
                params: {
                    snapId: SNAP_ORIGIN,
                    request: {
                        method: 'personal_sign',
                        params: [message, '0x' + '0'.repeat(40)]
                    }
                }
            });
            setSignatureResult(result as string);
        } catch (err) {
            console.error('Failed to sign message:', err);
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <header className="py-4 mb-4 border-bottom">
                        <h1 className="display-4">MetaMask Snap Demo</h1>
                        <p className="lead">Developer demonstration for MetaMask Snap integration</p>
                    </header>
                </div>
            </div>

            <div className="row">
                <div className="col-md-8">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <strong>Error:</strong> {error.message}
                        </div>
                    )}

                    {/* MetaMask Flask Detection */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3>1. MetaMask Flask Detection</h3>
                        </div>
                        <div className="card-body">
                            {!snapsDetected ? (
                                <div className="alert alert-warning">
                                    <h5>MetaMask not detected</h5>
                                    <p>Please install MetaMask Flask to continue.</p>
                                    <a
                                        href="https://metamask.io/flask/"
                                        className="btn btn-primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Install MetaMask Flask
                                    </a>
                                </div>
                            ) : !isFlask ? (
                                <div className="alert alert-warning">
                                    <h5>MetaMask Flask required</h5>
                                    <p>This demo requires MetaMask Flask.</p>
                                    <a
                                        href="https://metamask.io/flask/"
                                        className="btn btn-primary"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Install MetaMask Flask
                                    </a>
                                </div>
                            ) : (
                                <div className="alert alert-success">
                                    <h5>✓ MetaMask Flask detected</h5>
                                    <p>Ready to install snap.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Snap Installation */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3>2. Snap Installation</h3>
                        </div>
                        <div className="card-body">
                            {!installedSnap ? (
                                <div>
                                    <p>Install the snap to enable signing functionality.</p>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => void handleInstallSnap()}
                                        disabled={!isFlask || !snapsDetected}
                                    >
                                        Install Snap
                                    </button>
                                </div>
                            ) : (
                                <div className="alert alert-success">
                                    <h5>✓ Snap installed</h5>
                                    <p>Version: {installedSnap.version}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Personal Sign */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3>3. Personal Sign Request</h3>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Message to sign:</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                            <button
                                className="btn btn-success"
                                onClick={() => void handleSignPersonal()}
                                disabled={!installedSnap}
                            >
                                Sign Message
                            </button>
                            {signatureResult && (
                                <div className="mt-3">
                                    <label className="form-label">Signature Result:</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={signatureResult}
                                        readOnly
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-4">
                    {/* QR Code */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <h3>4. Expo App QR Code</h3>
                        </div>
                        <div className="card-body text-center">
                            <QRCode value="expo://your-app-url" size={200} />
                            <p className="mt-2 text-muted">Scan with Expo app</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documentation Section */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h3>Documentation</h3>
                        </div>
                        <div className="card-body">
                            <h5>Setup Instructions:</h5>
                            <ol>
                                <li>Install MetaMask Flask browser extension</li>
                                <li>Update <code>SNAP_ORIGIN</code> constant with your snap package name</li>
                                <li>Deploy your snap and update the package reference</li>
                                <li>Test the signing functionality</li>
                            </ol>

                            <h5>API Reference:</h5>
                            <ul>
                                <li><code>wallet_requestSnaps</code> - Install the snap</li>
                                <li><code>wallet_getSnaps</code> - Check installed snaps</li>
                                <li><code>wallet_invokeSnap</code> - Call snap methods</li>
                                <li><code>personal_sign</code> - Sign messages via snap</li>
                            </ul>

                            <h5>Development Notes:</h5>
                            <ul>
                                <li>Replace placeholder QR code with actual Expo app URL</li>
                                <li>Update snap origin to match your published snap</li>
                                <li>Add proper error handling for production use</li>
                                <li>Consider adding loading states for better UX</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main App
export default function App() {
    return (
        <MetaMaskProvider>
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
                rel="stylesheet"
            />
            <SnapDemo />
        </MetaMaskProvider>
    );
}