import React from 'react';
import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSeedPhraseContext } from '../../contexts/SeedPhraseContext';
import { useSecureClientContext } from '../../contexts/SecureClientContext';
import { Request, SignPersonalRequest } from '@tlock/shared';
import { Address, verifyMessage } from 'viem';

export default function SignPersonalScreen() {
    const { requestId } = useLocalSearchParams() as { requestId: string };
    const { accounts, getAccountId, signPersonal } = useSeedPhraseContext();
    const { secureClient } = useSecureClientContext();
    const [request, setRequest] = React.useState<SignPersonalRequest | undefined>(undefined);

    React.useEffect(() => {
        const fetchRequest = async () => {
            try {
                const req = await secureClient?.getRequest(requestId, 'signPersonal');
                setRequest(req);
            } catch (error) {
                console.error('Failed to fetch request:', error);
            }
        };

        fetchRequest();
    }, [requestId, secureClient]);

    const handleApprove = async () => {
        console.log(`Signing personal message for request ${requestId} from=${request?.from} message=${request?.message}`);
        if (!request) {
            console.error('No request data available');
            return;
        }

        const accountId = getAccountId(request.from);
        if (accountId == null) {
            console.error(`Account ${request.from} not found`);
            console.log('Available accounts:', accounts);
            return;
        }

        const signature = await signPersonal(accountId, request.message);
        console.log(`Signed personal message for request ${requestId} from=${request.from} message=${request.message} signature=${signature}`);

        try {
            await secureClient?.updateRequest(requestId, 'signPersonal', {
                ...request,
                signature: signature,
                status: 'approved',
            });

            router.back();
            return;
        } catch (error) {
            console.error('Failed to create account:', error);
        }
    };

    const handleReject = async () => {
        console.log('Request rejected');

        if (!request) {
            console.error('No request data available');
            router.back();
            return;
        }

        try {
            await secureClient?.updateRequest(requestId, 'signPersonal', {
                ...request,
                status: 'rejected',
            })
        } catch (error) {
            console.error('Failed to reject request:', error);
        }

        router.back();
    };

    return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Personal Sign
            </Text>
            <Text style={{ marginBottom: 30 }}>
                MetaMask is requesting to sign a text challenge. Do you approve?
            </Text>
            <Button title="Approve" onPress={handleApprove} />
            <Button title="Reject" onPress={handleReject} />
        </View>
    );
}