## Pairing
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