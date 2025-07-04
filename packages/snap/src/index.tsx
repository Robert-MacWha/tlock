import type { OnRpcRequestHandler, OnHomePageHandler, OnUserInputHandler } from '@metamask/snaps-sdk';
import { Box, Text, Heading, Button, Input } from '@metamask/snaps-sdk/jsx';

// Types
type PairedDevice = {
    ip: string;
    name: string;
    publicKey: string; // ECDSA public key
};

// Generate ECDSA key pair
const generateKeyPair = async () => {
    return await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign', 'verify']
    );
};

// Export public key as hex
const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
    const exported = await crypto.subtle.exportKey('raw', publicKey);
    return Array.from(new Uint8Array(exported))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

// Import public key from hex
const importPublicKey = async (publicKeyHex: string): Promise<CryptoKey> => {
    const publicKeyBytes = new Uint8Array(
        publicKeyHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );

    return await crypto.subtle.importKey(
        'raw',
        publicKeyBytes,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
    );
};

// Get stored device
const getPairedDevice = async (): Promise<PairedDevice | null> => {
    const state = await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' }
    });
    return state?.pairedDevice as PairedDevice || null;
};

// Pair with device at given IP
const pairWithDevice = async (deviceIP: string): Promise<boolean> => {
    console.log('Pairing device at IP:', deviceIP);

    try {
        // Generate our key pair
        const keyPair = await generateKeyPair();
        const snapPublicKey = await exportPublicKey(keyPair.publicKey);
        const challengeCode = Array.from(crypto.getRandomValues(new Uint8Array(6)))
            .map(b => b.toString(32).toUpperCase())
            .join('')
            .substring(0, 6);
        if (!challengeCode) {
            throw new Error('Error generating challenge code');
        }

        // Send pairing request
        const response = await fetch(`http://${deviceIP}:8443/pair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                snapPublicKey,
                challengeCode
            })
        });

        if (!response.ok) {
            throw new Error('Device not responding');
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'Pairing rejected');
        }

        // Show confirmation with challenge code
        const confirmed = await snap.request({
            method: 'snap_dialog',
            params: {
                type: 'confirmation',
                content: (
                    <Box>
                        <Heading>Confirm Pairing</Heading>
                        <Text>Device: {result.deviceName}</Text>
                        <Text>Verification Code: {challengeCode}</Text>
                        <Text>Does this match your phone?</Text>
                    </Box>
                )
            }
        });

        if (!confirmed) {
            return false;
        }

        // Store paired device
        const pairedDevice: PairedDevice = {
            ip: deviceIP,
            name: result.deviceName,
            publicKey: result.publicKey
        };

        await snap.request({
            method: 'snap_manageState',
            params: {
                operation: 'update',
                newState: { pairedDevice },
                encrypted: true
            }
        });

        await snap.request({
            method: 'snap_notify',
            params: {
                type: 'inApp',
                message: `Paired with ${result.deviceName}!`
            }
        });

        return true;
    } catch (error: any) {
        if (error instanceof Error) {
            error = error.message;
        }

        console.error('Pairing error:', error);
        await snap.request({
            method: 'snap_dialog',
            params: {
                type: 'alert',
                content: (
                    <Box>
                        <Heading>Pairing Failed</Heading>
                        <Text>{error}</Text>
                    </Box>
                )
            }
        });
        return false;
    }
};

// Test connection
const testConnection = async (): Promise<boolean> => {
    const device = await getPairedDevice();
    if (!device) {
        throw new Error('No paired device');
    }

    try {
        const response = await fetch(`http://${device.ip}:8443/ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'test' })
        });

        return response.ok;
    } catch (error) {
        return false;
    }
};

// Home page UI
export const onHomePage: OnHomePageHandler = async () => {
    console.log('Rendering home page');

    const pairedDevice = await getPairedDevice();

    if (!pairedDevice) {
        return {
            content: (
                <Box>
                    <Heading>2FA Wallet Setup</Heading>
                    <Text>No mobile device paired yet.</Text>
                    <Button name="setup">Setup Mobile 2FA</Button>
                </Box>
            )
        };
    }

    const isConnected = await testConnection();

    return {
        content: (
            <Box>
                <Heading>2FA Wallet</Heading>
                <Text>Device: {pairedDevice.name}</Text>
                <Text>IP: {pairedDevice.ip}</Text>
                <Text>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</Text>
                <Button name="test">Test Connection</Button>
                <Button name="unpair">Unpair Device</Button>
            </Box>
        )
    };
};

// Handle UI interactions and RPC calls
export const onRpcRequest: OnRpcRequestHandler = async ({ request }) => {
    console.log('RPC Request:', request);
    return { success: false };
};

export const onUserInput: OnUserInputHandler = async ({ id, event }) => {
    console.log('User input event:', id, event);

    if (event.type === 'ButtonClickEvent') {
        const buttonName = event.name;
        console.log('Button clicked:', buttonName);

        switch (buttonName) {
            case 'setup':
                // Show IP input dialog
                const deviceIP = await snap.request({
                    method: 'snap_dialog',
                    params: {
                        type: 'prompt',
                        content: (
                            <Box>
                                <Heading>Enter Device IP</Heading>
                                <Text>Enter your mobile device's IP address:</Text>
                            </Box>
                        ),
                        placeholder: '192.168.1.100'
                    }
                }) as string | null;

                if (deviceIP) {
                    await pairWithDevice(deviceIP);
                }
                break;

            case 'test':
                const connected = await testConnection();
                await snap.request({
                    method: 'snap_notify',
                    params: {
                        type: 'inApp',
                        message: connected ? 'Device connected!' : 'Device not responding'
                    }
                });
                break;

            case 'unpair':
                const confirmed = await snap.request({
                    method: 'snap_dialog',
                    params: {
                        type: 'confirmation',
                        content: (
                            <Box>
                                <Heading>Unpair Device</Heading>
                                <Text>Remove mobile device pairing?</Text>
                            </Box>
                        )
                    }
                });

                if (confirmed) {
                    await snap.request({
                        method: 'snap_manageState',
                        params: { operation: 'clear' }
                    });
                    await snap.request({
                        method: 'snap_notify',
                        params: {
                            type: 'inApp',
                            message: 'Device unpaired'
                        }
                    });
                }
                break;
        }
    }
}