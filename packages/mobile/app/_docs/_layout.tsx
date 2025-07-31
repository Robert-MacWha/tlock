import React from 'react';
import { Stack } from 'expo-router';

const Layout = () => {
    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen name="index" options={{
                title: "Docs",
            }} />
        </Stack>
    );
};

export default Layout;