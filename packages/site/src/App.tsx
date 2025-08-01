import type { FunctionComponent, ReactNode } from 'react'

export type AppProps = {
    children: ReactNode;
};

export const App: FunctionComponent<AppProps> = ({ children }) => {
    return (
        <>
            {children}
        </>
    );
};