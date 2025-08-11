# TLock Mobile App - QA Testing Guide

## Overview

This document provides comprehensive manual testing procedures for the TLock mobile keystore companion app. These tests focus on user flows, state persistence, network communication, and multi-device coordination that are difficult to cover with automated unit tests.

## Prerequisites

### Test Environment Setup

- **Development Environment**: Expo oroduction build on-device (TODO setup production build environment)
- **Test Browser**: MetaMask Snap enabled browser (`yarn dev:snap`)
- **Test Site**: Foxguard test site (`yarn dev:snap`)
- **Network**: Stable internet connection for Firebase communication
- **Devices**: Test device with camera access for QR code scanning

### Before Each Test Session

1. **Fresh App State**: Uninstall and reinstall the app for clean testing, or use a sandboxed folder
2. **Browser Setup**: Clear MetaMask Snap state

## Device Coverage

### Android Testing

- **Authentication**: Fingerprint/PIN integration if implemented
- **Notifications**: Push notification behavior and priority
- **Permissions**: Camera access, notification permissions
- **App Lifecycle**: Background/foreground transitions, memory management

### iOS Testing

TODO: Figure out IOS on-device testing process

## Test Scenarios

### 1. New User Setup Flow

**Objective**: Verify fresh installation and initial setup process

**Steps**:

1. Install fresh app (or clear all app data)
2. Launch app
3. Verify setup screen appears
4. Complete setup process (seed phrase generation)
5. Close app completely
6. Reopen app
7. Verify app opens to home screen (not setup)

**Expected Results**:

- Seed phrase is generated and displayed properly
- Home screen loads correctly after setup

**Pass/Fail Criteria**:

- PASS: Setup completes successfully, app remembers completion
- FAIL: Setup loops, crashes, or doesn't persist completion state

---

### 2. Account Creation and Persistence

**Objective**: Test account creation flow and state persistence

**Steps**:

1. Navigate to Accounts tab
2. Verify red indicator dot is present
3. Tap "+" to add an account
4. Complete account creation
5. Verify red dot disappears
6. Note the account name/address displayed
7. Close app completely
8. Reopen app
9. Navigate to Accounts tab
10. Verify account is still present with correct details

**Expected Results**:

- Red dot clearly indicates action needed
- Account persists across app restarts
- Account details (name, address) are correctly displayed

**Pass/Fail Criteria**:

- PASS: Account creates successfully and persists with correct data
- FAIL: Account creation fails, doesn't persist, or shows incorrect data

---

### 3. Client Addition and Pairing

**Objective**: Test wallet client pairing process and persistence

**Steps**:

1. Open metamask snap page and select "Pair Client"
2. In mobile app, navigate to client management
3. Verify red indicator dot is present
4. Initiate "Add Client" flow
5. Scan QR code from browser
6. Complete pairing process
7. Verify metamask snap registers pairing
8. Verify red dot disappears
9. Verify client appears in client list
10. Close mobile app completely
11. Reopen app
12. Navigate to client list
13. Verify client is still present

**Expected Results**:

- Red dot indicates action needed
- QR scanning works smoothly
- Pairing completes successfully
- Client persists across app restarts
- Snap automatically registers pairing

**Pass/Fail Criteria**:

- PASS: Client pairs successfully and persists across restarts
- FAIL: Pairing fails, client doesn't appear, or doesn't persist

---

### 4. Signature Request (App Open)

**Objective**: Test signPersonal request handling with app in foreground

**Setup**: Complete Account Creation and Client Addition first

**Steps**:

1. Ensure mobile app is open and in foreground
2. In browser, initiate a "Sign Personal Message" request from the test site
3. Wait for request to appear in mobile app
4. Verify request details are displayed correctly
5. Tap "Approve"
6. Verify success feedback in mobile app
7. Verify browser shows successful signature
8. Check that request disappears from mobile app

**Expected Results**:

- Request appears promptly in mobile app
- Request details are accurate
- Biometric authentication is required prior to signing
- Browser receives signature successfully
- UI updates appropriately

**Pass/Fail Criteria**:

- PASS: Request flows from browser to mobile and back
- FAIL: Request doesn't appear, approval fails, or browser doesn't receive response

---

### 5. Transaction Request (App Closed)

**Objective**: Test transaction request with push notifications

**Setup**: Complete Account Creation and Client Addition first

**Steps**:

1. Close mobile app completely
2. In browser, initiate a transaction request
3. Wait for push notification on mobile device
4. Tap notification to open app
5. Verify transaction details are displayed
6. Review transaction simulation
7. Tap "Approve"
8. Verify success feedback in mobile app
9. Verify browser shows successful transaction
10. Check that request disappears from mobile app

**Expected Results**:

- Push notification appears promptly
- Notification opens app to correct screen
- Transaction details are comprehensive and clear
- Biometric authentication is required prior to signing
- Approval process completes successfully

**Pass/Fail Criteria**:

- PASS: Push notification works, transaction details accurate, approval successful
- FAIL: No notification, app doesn't open correctly, or transaction fails

---

### 6. Seed Phrase Backup

**Objective**: Test seed phrase viewing and backup functionality

**Steps**:

1. Navigate to Settings
2. Tap "Show Seed Phrase" option
3. Complete biometric authentication
4. Verify seed phrase is displayed correctly
5. Verify all 12 words are visible and numbered

**Expected Results**:

- Authentication is required before displaying seed phrase
- Seed phrase displays clearly with proper formatting
- Security warnings are present and clear

**Pass/Fail Criteria**:

- PASS: Seed phrase access is secure and displays correctly
- FAIL: No authentication required, display issues, or incorrect seed phrase

---

### 7. Request Rejection Flow

**Objective**: Test rejection of signing and transaction requests

**Setup**: Complete Account Creation and Client Addition first

**Steps**:

1. In browser, initiate a signing request
2. Wait for request to appear in mobile app
3. Tap "Reject"
4. Verify rejection feedback in mobile app
5. Verify browser shows rejection/error
6. Repeat with a transaction request

**Expected Results**:

- Rejection is processed quickly
- Mobile app provides clear feedback
- Browser handles rejection appropriately

**Pass/Fail Criteria**:

- PASS: Rejections are handled cleanly on both sides
- FAIL: Rejection fails, causes errors, or browser doesn't respond

---

### 8. Second Account Management

**Objective**: Test multiple account creation and management

**Setup**: Complete initial account creation first

**Steps**:

1. Navigate to Accounts tab
2. Add a second account
3. Verify both accounts are listed
4. Rename the second account
5. Verify name change persists
6. Hide the second account
7. Verify account is hidden from main view
8. Unhide the account
9. Close and reopen app
10. Verify both accounts and their states persist

**Expected Results**:

- Multiple accounts can be created
- Account renaming works correctly
- Account hiding/showing functions properly
- All changes persist across app restarts

**Pass/Fail Criteria**:

- PASS: Multiple accounts work correctly with proper state management
- FAIL: Account operations fail or don't persist

---

## Test Completion Checklist

Before releasing or deploying:

- [ ] All 9 test scenarios completed on Android
- [ ] Critical issues (!) resolved
- [ ] High severity issues (x) resolved or documented

**Tester**: ******\_\_\_\_******  
**Date**: ******\_\_\_\_******  
**App Version**: ******\_\_\_\_******  
**Overall Result**: PASS / FAIL
