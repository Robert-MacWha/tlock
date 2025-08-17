# Foxguard

Foxguard is a hardware-wallet-like wallet solution for private key management. It acts as a companion app to metamask, letting you keep your accounts in metamask and your keys on your mobile device. Foxguard keeps your private keys safe from most common private key thefts, keeping your funds safe in the event of an attack.

## Flows

## Develop

Run `yarn dev:snap` to launch a dev server for the snap
Run `yarn dev:mobile` to launch a expo go server for the expo app

Use node v18

### Test Application

- https://ethsigner.netlify.app/

### Pairing

Mobile device and browser snap pair via a QR code containing a shared secret.

1. User initiates pairing on metamask snap.
   1 . Snap generates 256-bit shared secret and derives the room ID and qr code from this secret.
2. QR code is shown on screen and users takes a photo with their phone.
3. App scans QR code, gets the shared secret, and derives the room ID.
4. App writes to firebase `/registration/{roomId}`
    1. device name
    2. fcm token
5. App stores shared secret locally and securely.
6. User clicks "I've scanned qr code" in metamask,
    1. Snap checks firebase `registration/{roomId}`
    2. If registration exists - fetches device name and fcm token -> registration successful
    3. If registration does not exist - registration fails.

### Create account

1. User initiates account creation on metamask snap.
2. Snap sends a "create_account" request to the mobile device over firebase and waits for a response.
3. The mobile device checks with the user, then creates a new random private key
   TODO: Make a system that uses seed phrases to derive all private keys, so they can be backed up.
4. Mobile device sends the created account's address back to metamask snap.
5. Metamask snap registers with keyring.

## License
GPL-3.0

Note: Originally forked from [MetaMask template](https://github.com/MetaMask/template-snap-monorepo/tree/main).