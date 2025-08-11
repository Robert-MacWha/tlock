# Refactor: Unify Pairing and Request Systems

## Overview

Currently, the FirebaseClient has two separate systems for handling operations:

1. **Device Registration/Pairing**: Special methods (`submitDevice`, `getDevice`, `pollUntilDeviceRegistered`)
2. **Request Operations**: Generic request system (`submitRequest`, `getRequest`, `updateRequest`, etc.)

This creates unnecessary complexity and code duplication. We should unify these into a single request-based system where pairing is just another request type.

## Current Architecture Problems

### Dual Code Paths

- Device registration uses special storage paths (`registrations/${roomId}`)
- Requests use generic storage paths (`requests/${roomId}/${requestId}`)
- Different polling mechanisms (`pollUntilDeviceRegistered` vs `pollUntil`)
- Inconsistent error handling patterns

### Testing Complexity

- Need to mock Firebase-style nested queries for `getRequests()`
- Different test patterns for pairing vs requests
- Complex mock storage simulation required

### Code Duplication

- Similar encryption/decryption logic
- Similar polling patterns
- Similar error handling

## Proposed Solution

### Unified Request System

Treat device registration/pairing as just another request type in the existing request system.

### New Type Definitions

```typescript
// Add to RequestTypeMap
export interface RequestTypeMap {
    deviceRegistration: DeviceRegistrationRequest; // NEW
    importAccount: ImportAccountRequest;
    signPersonal: SignPersonalRequest;
    signTransaction: SignTransactionRequest;
    signTypedData: SignTypedDataRequest;
    signMessage: SignMessageRequest;
}

export interface DeviceRegistrationRequest {
    status: RequestStatus;
    fcmToken?: string;
    deviceName?: string;
}

// Update Request union type
export type Request =
    | {
          id: string;
          lastUpdated: number;
          type: 'deviceRegistration';
          request: DeviceRegistrationRequest;
      }
    | {
          id: string;
          lastUpdated: number;
          type: 'importAccount';
          request: ImportAccountRequest;
      }
    | {
          id: string;
          lastUpdated: number;
          type: 'signPersonal';
          request: SignPersonalRequest;
      }
    | {
          id: string;
          lastUpdated: number;
          type: 'signTransaction';
          request: SignTransactionRequest;
      }
    | {
          id: string;
          lastUpdated: number;
          type: 'signTypedData';
          request: SignTypedDataRequest;
      }
    | {
          id: string;
          lastUpdated: number;
          type: 'signMessage';
          request: SignMessageRequest;
      };

// Update RequestType
export type RequestType =
    | 'deviceRegistration'
    | 'importAccount'
    | 'signPersonal'
    | 'signTransaction'
    | 'signTypedData'
    | 'signMessage';
```

### Simplified Client Interface

```typescript
export interface Client {
    roomId: string;

    // REMOVED: submitDevice, getDevice, pollUntilDeviceRegistered

    // Unified request system handles everything
    submitRequest<T extends RequestType>(
        type: T,
        data: RequestTypeMap[T],
    ): Promise<string>;
    updateRequest<T extends RequestType>(
        id: string,
        type: T,
        data: Partial<RequestTypeMap[T]>,
    ): Promise<void>;
    getRequest<T extends RequestType>(
        id: string,
        requestType: T,
    ): Promise<RequestTypeMap[T]>;
    getRequests(): Promise<Request[]>;
    deleteRequest(id: string): Promise<void>;

    pollUntil<T extends RequestType>(
        requestId: string,
        requestType: T,
        intervalMs: number,
        timeoutSeconds: number,
        condition: (response: RequestTypeMap[T]) => boolean,
    ): Promise<RequestTypeMap[T]>;
}
```

### Usage Examples

#### Pairing Flow (Browser/Snap)

```typescript
// Instead of: await client.submitDevice(fcmToken, deviceName);
const requestId = await client.submitRequest('deviceRegistration', {
    status: 'pending',
    fcmToken,
    deviceName,
});

// Instead of: await client.pollUntilDeviceRegistered(100, 30);
const result = await client.pollUntil(
    requestId,
    'deviceRegistration',
    100,
    30,
    (response) => response.status === 'approved',
);
```

#### Pairing Response (Mobile)

```typescript
// Mobile app polls for pairing requests
const requests = await client.getRequests();
const pairingRequest = requests.find(
    (r) => r.type === 'deviceRegistration' && r.request.status === 'pending',
);

if (pairingRequest) {
    // Approve the pairing
    await client.updateRequest(pairingRequest.id, 'deviceRegistration', {
        status: 'approved',
    });
}
```

## Implementation Plan

### Phase 1: Type System Updates

- [ ] Add `DeviceRegistrationRequest` interface
- [ ] Update `RequestTypeMap` to include `deviceRegistration`
- [ ] Update `Request` union type
- [ ] Update `RequestType` type

### Phase 2: Client Interface Changes

- [ ] Remove `submitDevice`, `getDevice`, `pollUntilDeviceRegistered` from `Client` interface
- [ ] Update `FirebaseClient` implementation to remove these methods
- [ ] Remove special device registration storage paths
- [ ] Remove `FirebasePaths.registration`

### Phase 3: Update Calling Code

- [ ] **Snap package**: Update pairing initiation to use `submitRequest('deviceRegistration', ...)`
- [ ] **Snap package**: Update pairing polling to use `pollUntil` instead of `pollUntilDeviceRegistered`
- [ ] **Mobile package**: Update pairing response to poll for and respond to `deviceRegistration` requests
- [ ] **Site package**: Update any test/demo pairing code

### Phase 4: Testing Updates

- [ ] Remove Firebase simulation complexity from tests
- [ ] Update tests to use unified request system
- [ ] Add tests for `deviceRegistration` request type
- [ ] Simplify mock implementations

### Phase 5: Cleanup

- [ ] Remove unused code paths
- [ ] Update documentation
- [ ] Verify all edge cases still work

## Benefits

### Simplified Architecture

- **Single code path** for all operations
- **Consistent patterns** across all functionality
- **Unified error handling** and retry logic

### Better Testing

- **No need for Firebase simulation** - simple key-value mock storage works
- **Consistent test patterns** for all operations
- **Easier to mock and verify** behavior

### Improved Maintainability

- **Less code duplication**
- **Easier to add new request types** in the future
- **Consistent API surface**

### Enhanced Features

- **Same notification system** for all operations
- **Unified polling mechanism** with same timeout/retry logic
- **Consistent request lifecycle** management

## Migration Impact

### Breaking Changes

- Remove `submitDevice()`, `getDevice()`, `pollUntilDeviceRegistered()` methods
- Change pairing flow in snap and mobile apps

### Low Risk

- Changes are well-contained to the client interface
- New system is more robust and consistent
- Existing request functionality remains unchanged

## Implementation Notes

### Firebase Storage

All operations will use the same `requests/${roomId}/${requestId}` path structure, eliminating the need for special device registration paths.

### Backward Compatibility

This is a breaking change, but the impact is localized to the pairing flow. All other request types continue to work exactly the same.

### Testing

The unified approach eliminates the need to simulate Firebase's nested query behavior, making tests much simpler and more reliable.
