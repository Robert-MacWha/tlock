import type { FunctionComponent, ReactNode } from 'react';

import { MetaMaskProvider } from './hooks';

export type AppProps = {
    children: ReactNode;
};

export const App: FunctionComponent<AppProps> = ({ children }) => {
    return (
        <MetaMaskProvider>
            {children}
        </MetaMaskProvider>
    );
};
