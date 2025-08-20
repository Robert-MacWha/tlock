import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import {
    Text,
    Card,
    ActivityIndicator,
    List,
    Divider,
} from 'react-native-paper';
import {
    DedaubClient,
    isNetwork,
    SimulationResponse,
    BalanceDelta,
    TokenInfo,
} from '@lodgelock/shared';
import { TransactionSerializable, Address } from 'viem';

interface TxSimulationProps {
    network: string;
    from: Address;
    transaction: TransactionSerializable;
}

interface BalanceChangeItemProps {
    delta: BalanceDelta;
    tokenInfo?: TokenInfo | undefined;
}

function BalanceChangeItem({ delta, tokenInfo }: BalanceChangeItemProps) {
    const isPositive = !delta.balance.startsWith('-');
    const cleanBalance = delta.balance.replace('-', '');

    const formatBalance = (balance: string, decimals: number = 18): string => {
        try {
            const value = BigInt(balance);
            const divisor = BigInt(10 ** decimals);
            const formatted = Number(value) / Number(divisor);
            return formatted.toFixed(6).replace(/\.?0+$/, '');
        } catch {
            return balance;
        }
    };

    const formattedBalance = tokenInfo
        ? formatBalance(cleanBalance, tokenInfo.decimals)
        : formatBalance(cleanBalance);

    const symbol = tokenInfo?.symbol || 'ETH';
    const addressDisplay = `${delta.address.slice(0, 6)}...${delta.address.slice(-4)}`;
    const amountDisplay = `${isPositive ? 'recieved' : 'sent'} ${formattedBalance} ${symbol}`;
    const singleLineDisplay = `${addressDisplay} ${amountDisplay}`;

    return <List.Item title={singleLineDisplay} />;
}
export function TxSimulation({
    network,
    from,
    transaction,
}: TxSimulationProps) {
    const [loading, setLoading] = useState(false);
    const [simulation, setSimulation] = useState<SimulationResponse | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    const isValidNetwork = isNetwork(network);

    if (!isValidNetwork) {
        return (
            <Card mode="contained">
                <Card.Title title="Transaction Simulation" />
                <Card.Content>
                    <Text variant="bodyMedium">
                        Unsupported network: {network}
                    </Text>
                </Card.Content>
            </Card>
        );
    }

    const runSimulation = async () => {
        if (!transaction.to) return;

        setLoading(true);
        setError(null);

        try {
            const client = new DedaubClient();
            const result = await client.simulate(network, {
                from_a: from,
                to_a: transaction.to,
                data: transaction.data || '0x',
                value: transaction.value
                    ? `0x${transaction.value.toString(16)}`
                    : '0x0',
                gas: transaction.gas
                    ? `0x${transaction.gas.toString(16)}`
                    : '0x1E8480',
                block_number: 'latest',
            });

            setSimulation(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Simulation failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void runSimulation();
    }, [network, from, transaction]);

    return (
        <Card mode="contained">
            <Card.Title title="Transaction Simulation" />

            <Card.Content>
                {loading && (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                        <ActivityIndicator size="large" />
                        <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                            Simulating transaction...
                        </Text>
                    </View>
                )}

                {error && (
                    <Text variant="bodyMedium" style={{ color: 'red' }}>
                        Error: {error}
                    </Text>
                )}

                {simulation && !loading && !error && (
                    <>
                        {simulation.balance_deltas.length > 0 ? (
                            <View>
                                <Text
                                    variant="titleSmall"
                                    style={{ marginBottom: 8 }}
                                >
                                    Balance Changes
                                </Text>
                                {simulation.balance_deltas.map(
                                    (delta, index) => (
                                        <View
                                            key={`${delta.address}-${delta.token}-${index}`}
                                        >
                                            <BalanceChangeItem
                                                delta={delta}
                                                tokenInfo={
                                                    simulation.tokens[
                                                        delta.token.toLowerCase()
                                                    ]
                                                }
                                            />
                                            {index <
                                                simulation.balance_deltas
                                                    .length -
                                                    1 && <Divider />}
                                        </View>
                                    ),
                                )}
                            </View>
                        ) : (
                            <Text variant="bodyMedium">
                                No balance changes detected
                            </Text>
                        )}
                    </>
                )}
            </Card.Content>
        </Card>
    );
}
