import {
    SharedSecretSchema,
    QrCodeDataSchema,
    PairRequestSchema,
    ImportAccountRequestSchema,
    StoredRequestSchema,
    RequestTypeSchemaMap,
} from '../validation';
import { generateSharedSecret } from '../crypto';

describe('validation schemas', () => {
    describe('SharedSecretSchema', () => {
        it('should validate a valid shared secret', () => {
            const validSecret = generateSharedSecret();
            const result = SharedSecretSchema.safeParse(validSecret);
            expect(result.success).toBe(true);
        });

        it('should reject non-array values', () => {
            const result = SharedSecretSchema.safeParse('not-an-array');
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('Invalid input: expected array, received string');
        });

        it('should reject arrays with wrong length', () => {
            const shortArray = [1, 2, 3];
            const result = SharedSecretSchema.safeParse(shortArray);
            expect(result.success).toBe(false);
            expect(result.error?.issues[0]?.message).toContain('SharedSecret must be exactly 32 numbers');
        });

        it('should reject arrays with non-integer values', () => {
            const invalidArray = Array(32).fill(1.5);
            const result = SharedSecretSchema.safeParse(invalidArray);
            expect(result.success).toBe(false);
        });

        it('should reject arrays with negative values', () => {
            const invalidArray = Array(32).fill(-1);
            const result = SharedSecretSchema.safeParse(invalidArray);
            expect(result.success).toBe(false);
        });

    });

    describe('QrCodeDataSchema', () => {
        const validQrData = {
            version: 1,
            sharedSecret: generateSharedSecret(),
            pairRequestId: 'test-request-id',
        };

        it('should validate valid QR code data', () => {
            const result = QrCodeDataSchema.safeParse(validQrData);
            expect(result.success).toBe(true);
        });

        it('should reject missing version', () => {
            const { version, ...invalidData } = validQrData;
            const result = QrCodeDataSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject invalid data', () => {
            const { pairRequestId, ...invalidData } = validQrData;
            const result = QrCodeDataSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Request schemas', () => {
        it('should validate valid pair request', () => {
            const validData = { status: 'pending', fcmToken: 'token', deviceName: 'device' };
            expect(PairRequestSchema.safeParse(validData).success).toBe(true);
        });

        it('should validate valid import account request', () => {
            const validData = { status: 'approved', address: '0x123' };
            expect(ImportAccountRequestSchema.safeParse(validData).success).toBe(true);
        });

        it('should reject invalid requests', () => {
            const invalidData = { status: 'invalid' };
            expect(PairRequestSchema.safeParse(invalidData).success).toBe(false);
        });
    });

    describe('StoredRequestSchema', () => {
        it('should validate valid stored request', () => {
            const validData = { type: 'pair', data: 'encrypted-data', lastUpdated: 1640995200000 };
            expect(StoredRequestSchema.safeParse(validData).success).toBe(true);
        });

        it('should reject invalid stored request', () => {
            const invalidData = { type: 'invalid-type', data: '', lastUpdated: -1 };
            expect(StoredRequestSchema.safeParse(invalidData).success).toBe(false);
        });
    });

    describe('RequestTypeSchemaMap', () => {
        it('should have schemas for all request types', () => {
            const expectedTypes = ['pair', 'importAccount', 'signPersonal', 'signTransaction', 'signTypedData', 'signMessage'];
            expectedTypes.forEach(type => {
                expect(RequestTypeSchemaMap).toHaveProperty(type);
            });
        });
    });
});