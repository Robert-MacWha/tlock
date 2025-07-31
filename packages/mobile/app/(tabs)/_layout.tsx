import React from 'react';
import { Tabs } from 'expo-router';
import { Badge, BottomNavigation } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View } from 'react-native';
import { useRequestReceiverContext } from '../../contexts/RequestRecieverContext';
import { useClientsContext } from '../../contexts/ClientContext';

export default function TabLayout() {
    const { clientRequests } = useRequestReceiverContext();
    const { clients } = useClientsContext();

    const hasRequests = clientRequests.length > 0;
    const hasClients = clients.length > 0;

    return (
        <Tabs
            screenOptions={{
                animation: 'shift',
            }}
            tabBar={(props) => (
                <BottomNavigation.Bar
                    navigationState={props.state}
                    onTabPress={({ route }) => {
                        const event = props.navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!event.defaultPrevented) {
                            props.navigation.navigate(route.name);
                        }
                    }}
                    renderIcon={({ focused, route, color }) => {
                        const descriptor = props.descriptors[route.key];
                        if (!descriptor?.options?.tabBarIcon) return null;
                        return descriptor.options.tabBarIcon({ focused, color, size: 24 });
                    }}
                    getLabelText={({ route }) => {
                        const descriptor = props.descriptors[route.key];
                        return descriptor?.options?.title || route.name;
                    }}
                />
            )}
        >
            <Tabs.Screen
                name="accounts"
                options={{
                    title: "Wallets",
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="wallet-outline" color={color} size={24} />
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => (
                        <View>
                            <MaterialCommunityIcons name="cog-outline" color={color} size={24} />
                            {(hasRequests || !hasClients) && (
                                <Badge
                                    size={8}
                                    style={{
                                        position: 'absolute',
                                        top: -2,
                                        right: -2,
                                        backgroundColor: 'red'
                                    }}
                                />
                            )}
                        </View>
                    )
                }}
            />
        </Tabs >
    );
}