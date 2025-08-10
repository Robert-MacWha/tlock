import { ErrorCode } from './constants';

/**
 * Standardized error class for TLock Snap operations
 */
export class TlockSnapError extends Error {
    public readonly code: ErrorCode;
    public readonly originalError?: Error | undefined;

    constructor(code: ErrorCode, message: string, originalError?: Error) {
        super(message);
        this.name = 'TlockSnapError';
        this.code = code;
        this.originalError = originalError;
    }
}

export function throwError(code: ErrorCode, message: string, originalError?: Error): never {
    throw new TlockSnapError(code, message, originalError);
}

export function handleError(error: unknown, code: ErrorCode, context?: string): never {
    const contextMessage = context ? `${context}: ` : '';

    if (error instanceof Error) {
        throw new TlockSnapError(code, `${contextMessage}${error.message}`, error);
    } else {
        throw new TlockSnapError(code, `${contextMessage}${String(error)}`);
    }
}