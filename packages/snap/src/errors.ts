import { ErrorCode } from './constants';

/**
 * Standardized error class for Lodgelock Snap operations
 */
export class LodgelockSnapError extends Error {
    public readonly code: ErrorCode;
    public readonly originalError?: Error | undefined;

    constructor(code: ErrorCode, message: string, originalError?: Error) {
        super(message);
        this.name = 'LodgelockSnapError';
        this.code = code;
        this.originalError = originalError;
    }
}

export function throwError(
    code: ErrorCode,
    message: string,
    originalError?: Error,
): never {
    throw new LodgelockSnapError(code, message, originalError);
}

export function handleError(
    error: unknown,
    code: ErrorCode,
    context?: string,
): never {
    const contextMessage = context ? `${context}: ` : '';

    if (error instanceof Error) {
        throw new LodgelockSnapError(
            code,
            `${contextMessage}${error.message}`,
            error,
        );
    } else {
        throw new LodgelockSnapError(code, `${contextMessage}${String(error)}`);
    }
}
