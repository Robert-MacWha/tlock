import React from 'react';
import { Tabs } from 'expo-router';
import { Badge } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';
import { useClientsContext } from '../../contexts/ClientContext';
import { useRequestManagerContext } from '../../contexts/RequestManagerContext';

interface TabIconProps {
    color?: string;
}

const WalletIcon = ({ color }: TabIconProps) => (
    <MaterialCommunityIcons name="wallet-outline" color={color} size={24} />
);

const SettingsIcon = ({ color }: TabIconProps) => {
    const { clientRequests } = useRequestManagerContext();
    const { clients } = useClientsContext();

    const hasRequests = clientRequests.length > 0;
    const hasClients = clients.length > 0;

    return (
        <View>
            <MaterialCommunityIcons
                name="cog-outline"
                color={color}
                size={24}
            />
            {(hasRequests || !hasClients) && (
                <Badge
                    size={8}
                    style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        backgroundColor: 'red',
                    }}
                />
            )}
        </View>
    );
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                animation: 'shift',
            }}
        >
            <Tabs.Screen
                name="accounts"
                options={{
                    title: 'Wallets',
                    tabBarIcon: WalletIcon,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: SettingsIcon,
                }}
            />
        </Tabs>
    );
}
