import { z } from 'zod';
import { SHARED_SECRET_LENGTH } from './crypto';

// Shared Secret validation
export const SharedSecretSchema = z
    .array(z.number().int().min(0).max(4294967295))
    .length(SHARED_SECRET_LENGTH, `SharedSecret must be exactly ${SHARED_SECRET_LENGTH} numbers`);

// QR Code validation
export const QrCodeDataSchema = z.object({
    version: z.number().int().positive(),
    sharedSecret: SharedSecretSchema,
    pairRequestId: z.string().min(1),
});

// Request status validation
export const RequestStatusSchema = z.enum(['pending', 'approved', 'rejected', 'error']);

// Individual request schemas
export const PairRequestSchema = z.object({
    status: RequestStatusSchema,
    fcmToken: z.string(),
    deviceName: z.string(),
});

export const ImportAccountRequestSchema = z.object({
    status: RequestStatusSchema,
    address: z.string().optional(),
});

export const SignPersonalRequestSchema = z.object({
    status: RequestStatusSchema,
    origin: z.string().optional(),
    from: z.string(), // Address type from viem
    message: z.string(), // Hex type from viem
    signature: z.string().optional(), // Hex type from viem
});

export const SignTransactionRequestSchema = z.object({
    status: RequestStatusSchema,
    origin: z.string().optional(),
    from: z.string(), // Address type from viem
    transaction: z.string(), // Hex type from viem
    signed: z.string().optional(), // TransactionSerialized type from viem
});

export const SignTypedDataRequestSchema = z.object({
    status: RequestStatusSchema,
    origin: z.string().optional(),
    from: z.string(), // Address type from viem
    data: z.any(), // TypedDataDefinition is complex, using any for now
    signature: z.string().optional(), // Hex type from viem
});

export const SignMessageRequestSchema = z.object({
    status: RequestStatusSchema,
    origin: z.string().optional(),
    from: z.string(), // Address type from viem
    message: z.string(), // Hex type from viem
    signature: z.string().optional(), // Hex type from viem
});

// Union schema for all request types
export const RequestDataSchema = z.union([
    PairRequestSchema,
    ImportAccountRequestSchema,
    SignPersonalRequestSchema,
    SignTransactionRequestSchema,
    SignTypedDataRequestSchema,
    SignMessageRequestSchema,
]);

// Firebase StoredRequest validation
export const StoredRequestSchema = z.object({
    type: z.enum(['pair', 'importAccount', 'signPersonal', 'signTransaction', 'signTypedData', 'signMessage']),
    data: z.string().min(1), // encrypted data
    lastUpdated: z.number().int().positive(),
});

// Request type to schema mapping for validation
export const RequestTypeSchemaMap = {
    pair: PairRequestSchema,
    importAccount: ImportAccountRequestSchema,
    signPersonal: SignPersonalRequestSchema,
    signTransaction: SignTransactionRequestSchema,
    signTypedData: SignTypedDataRequestSchema,
    signMessage: SignMessageRequestSchema,
} as const;

// Only export the types we actually need
export type ValidatedStoredRequest = z.infer<typeof StoredRequestSchema>;