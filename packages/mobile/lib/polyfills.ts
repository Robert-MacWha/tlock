import { Buffer } from 'buffer';
import { polyfillWebCrypto } from 'expo-standard-web-crypto';

global.Buffer = Buffer;
polyfillWebCrypto();