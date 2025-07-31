import React from 'react';
import { Stack } from 'expo-router';

const Layout = () => {
    return (
        <Stack screenOptions={{ headerShown: true }}>
            <Stack.Screen name="importAccount" options={{
                title: "Import Account",
            }} />
            <Stack.Screen name="signMessage" options={{
                title: "Sign Message",
            }} />
            <Stack.Screen name="signPersonal" options={{
                title: "Sign Personal",
            }} />
            <Stack.Screen name="signTransaction" options={{
                title: "Sign Transaction",
            }} />
            <Stack.Screen name="signTypedData" options={{
                title: "Sign Typed Data",
            }} />
            <Stack.Screen name="success" options={{
                title: "Success",
            }} />
        </Stack>
    );
};

export default Layout;