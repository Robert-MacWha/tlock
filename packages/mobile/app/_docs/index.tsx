import React from 'react';
import { ScrollView } from 'react-native';
import { Text, Surface, Divider } from 'react-native-paper';

export default function DocsScreen() {
    return (
        <Surface style={{ flex: 1 }}>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

                <Text variant="headlineMedium" style={{ marginVertical: 16 }}>
                    Foxguard Documentation
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                    This is a feisability MVP for Foxguard. My goal is to see whether I can build a simple and secure
                    wallet companion, similar to a hardware wallet, that grants extra security to users using wallet extensions.
                    This is not intended to replace hardware wallets for high-value assets, but rather to provide an
                    alterantive that is more accessible and user-friendly. I will consider it a success if this project
                    leads to fewer users storing their private keys in a browser extension.
                </Text>

                <Text variant="titleMedium" style={{ marginVertical: 16 }}>
                    Current Features
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                    - Store private keys on device in secure storage.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Wirelessly recieve signature requests from connected devices.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Supports signing transactions and messages with your accounts.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Allows user to inspect and reject tranactions without authentication.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Allows users to approve transactions with device authentication (PIN, biometrics).{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Supports connecting to multiple wallet clients and using multiple accounts.  In theory even multiple different kinds of wallets(?).{"\n"}
                </Text>

                <Text variant="titleMedium" style={{ marginVertical: 16 }}>
                    Setup
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                    - Install the Foxguard app on your mobile device (expo go right now).{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Install the metamask snap on on your flask wallet (only works for flask right now - need manual approval from metamask team),{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Connect to a wallet client (metamask) by scanning the QR code from the snap using foxguard.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - When signing transactions or messages in metamask using the Foxguard account, they will automatically be sent to Foxguard for approval.{"\n"}
                </Text>

                <Text variant="titleMedium" style={{ marginVertical: 16 }}>
                    Current Limitations
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                    - Using multiple seed phrases{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Importing seed phrase (I haven't audited the code yet, don't want risk){"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    Push notifications for requests (expo go limitation - can be fixed with a dev build){"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - LAN / P2P communcation{"\n"}
                </Text>

                <Text variant="titleMedium" style={{ marginVertical: 16 }}>
                    Technical Details
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                    - Built with react native and expo.  Resonably good, but I'd switch to tauri in a heartbeat if it supported push notifications.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Wallet-Client communication happens over firebase realtime DB.  Each wallet-app pairing has a unique shared secret (communicated via QR code) that they use to generate per-pair room IDs and encrypt requests / responses.  A snooper could see how active a given pair was, but not the contents of the requests nor who is making them.{"\n"}
                    <Divider style={{ marginVertical: 8 }} />
                    - Seed phrase is generated on-device and stored in `expo-secure-store`.  Authentication is required to load the seed phrase from secure storage or to write a new seed phrase to store.  All other actions are permitted without authentication.  IMO this strikes a good balance between usability and security.{"\n"}
                </Text>


            </ScrollView>
        </Surface>
    );
}