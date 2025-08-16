# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core development principals

- Prefer simple, concise code. Avoid over-complications, avoid verbosity, and avoid unnecessary tests and check.
- Implement what is required to do the job and nothing more cleanly and elegantly.

## Project Overview

Tlock is a 2FA wallet system that consists of a MetaMask Snap and a mobile app for secure transaction signing. The system uses Firebase for real-time communication between the browser extension and mobile device.

## Architecture

This is a TypeScript monorepo with 5 packages:

- **@tlock/shared**: Common utilities and types shared across all packages
- **@tlock/snap**: MetaMask Snap for browser-based wallet interface
- **@tlock/mobile**: React Native/Expo mobile app for transaction approval
- **@tlock/site**: Gatsby-based test application for development
- **@tlock/functions**: Firebase Cloud Functions for backend services

Key architectural flows:

1. **Pairing**: Browser generates QR code with shared secret → Mobile scans → Firebase registration
2. **Account Creation**: Snap requests account → Mobile generates private key → Returns address
3. **Transaction Signing**: Snap sends transaction → Mobile approves/signs → Returns signature

## Development Commands

### Root Level Commands

- `yarn build` - Build all packages in topological order
- `yarn dev:snap` - Start snap, site, and shared packages in development mode
- `yarn dev:mobile` - Start mobile app with Expo
- `yarn test` - Run Jest tests across all packages
- `yarn build:shared` - Build only the shared package
- `yarn build:snap` - Build only the snap package
- `yarn deploy:functions` - Deploy Firebase functions

### Package-Specific Commands

- Snap: `yarn workspace @tlock/snap dev` (watch mode), `yarn workspace @tlock/snap build`
- Mobile: `yarn workspace @tlock/mobile dev`, `yarn workspace @tlock/mobile test`
- Shared: `yarn workspace @tlock/shared build` (TypeScript compilation), `yarn workspace @tlock/shared dev` (watch mode)
- Site: `yarn workspace @tlock/site dev` (Gatsby develop on port 8000)
- Functions: `yarn workspace @tlock/functions serve` (local Firebase emulator)

### Testing

#### Structure

- Files: \*.test.ts in **test**/ directories
- Organization: describe() blocks for components/features, it() for specific behaviors

#### Core Patterns

```
// Setup
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

// Mocking
jest.mock('module-name');
const mockModule = Module as jest.Mocked<typeof Module>;

// React Hooks
const { result } = renderHook(() => useHook());
await waitFor(() => expect(result.current.state).toBe(value));
await act(async () => await result.current.method());
```

#### Testing Categories

1. Happy Path: Normal operations
2. Error Handling: Network/auth failures
3. Edge Cases: Empty data, boundaries
4. State Persistence: Storage operations
5. User Interactions: Approve/reject flows

#### Key Assertions

```
expect(result).toBe(value);                    // Exact match
expect(result).toEqual(expect.objectContaining({})); // Partial object
expect(fn).toHaveBeenCalledWith(args);         // Function calls
await expect(asyncFn()).rejects.toThrow();     // Async errors
```

#### Helper Patterns

- Setup functions for consistent test data
- Parameterized tests for similar scenarios
- Mock realistic data (addresses, secrets, etc.)
- Test both success and failure paths

#### Principles

- Test behavior, not implementation
- Independent, repeatable tests
- Clear arrange-act-assert structure
- Mock external dependencies
- Descriptive test names

## Technical Requirements

- Node.js >= 18.6.0
- Yarn 3.2.1+ (specified in packageManager)
- Firebase CLI (for functions deployment)

## Key Dependencies

- **viem**: Ethereum interaction library (pinned to 2.33.1)
- **@metamask/snaps-sdk**: Snap development framework
- **expo**: Mobile app framework
- **firebase**: Real-time communication backend
- **@ethereumjs/tx**: Transaction handling
- **TypeScript**: Strict mode enabled across all packages

## Development Notes

- Shared package must be built before other packages can use it
- Mobile app uses Expo Go for development
- Test application available at https://ethsigner.netlify.app/
- Ensure all important code is written in a modular and testable manner
- Firebase functions handle real-time messaging between snap and mobile
- All packages use TypeScript with strict mode and comprehensive linting
