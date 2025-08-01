import type { FunctionComponent } from 'react';
import { MetaMaskProvider } from './hooks';
import SnapDemo from './pages';

export const App: FunctionComponent = () => {
    return (
        <MetaMaskProvider>
            <SnapDemo />
        </MetaMaskProvider>
    );
};