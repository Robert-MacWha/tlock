import { renderHook } from '@testing-library/react-native';
import { useKeyringContext } from '../KeyringContext';
import { useClientsContext } from '../ClientContext';
import { useRequestManagerContext } from '../RequestManagerContext';

describe('Context Error Boundaries', () => {
    describe('useKeyringContext', () => {
        it('should throw error when used outside KeyringProvider', () => {
            expect(() => {
                renderHook(() => useKeyringContext());
            }).toThrow();
        });
    });

    describe('useClientsContext', () => {
        it('should throw error when used outside ClientsProvider', () => {
            expect(() => {
                renderHook(() => useClientsContext());
            }).toThrow();
        });
    });

    describe('useRequestManagerContext', () => {
        it('should throw error when used outside RequestManagerProvider', () => {
            expect(() => {
                renderHook(() => useRequestManagerContext());
            }).toThrow();
        });
    });
});