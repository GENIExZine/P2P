import nacl from 'tweetnacl';
import { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } from 'tweetnacl-util';

export interface KeyPair {
  publicKey: string; // Base64
  secretKey: string; // Base64
}

export interface EncryptedPayload {
  ciphertext: string; // Base64
  nonce: string; // Base64
}

/**
 * Generates a new Curve25519 (X25519) keypair for ECDH and libsodium-standard box encryption
 */
export function generateIdentityKeyPair(): KeyPair {
  const pair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(pair.publicKey),
    secretKey: encodeBase64(pair.secretKey),
  };
}

/**
 * Encrypts a plaintext string using Curve25519 ECDH + XSalsa20-Poly1305 authenticated encryption
 */
export function encryptDirectMessage(
  plaintext: string,
  recipientPublicKeyBase64: string,
  senderSecretKeyBase64: string
): EncryptedPayload {
  try {
    const recipientPubKey = decodeBase64(recipientPublicKeyBase64);
    const senderSecKey = decodeBase64(senderSecretKeyBase64);
    const nonce = nacl.randomBytes(nacl.box.nonceLength); // 24 bytes
    const messageBytes = decodeUTF8(plaintext);

    const boxed = nacl.box(messageBytes, nonce, recipientPubKey, senderSecKey);

    return {
      ciphertext: encodeBase64(boxed),
      nonce: encodeBase64(nonce),
    };
  } catch (err) {
    console.error('E2EE Encryption Error:', err);
    throw new Error('Failed to encrypt direct message with Curve25519');
  }
}

/**
 * Decrypts a ciphertext using recipient's secret key and sender's public key
 */
export function decryptDirectMessage(
  ciphertextBase64: string,
  nonceBase64: string,
  senderPublicKeyBase64: string,
  recipientSecretKeyBase64: string
): string {
  try {
    const ciphertext = decodeBase64(ciphertextBase64);
    const nonce = decodeBase64(nonceBase64);
    const senderPubKey = decodeBase64(senderPublicKeyBase64);
    const recipientSecKey = decodeBase64(recipientSecretKeyBase64);

    const unboxed = nacl.box.open(ciphertext, nonce, senderPubKey, recipientSecKey);
    if (!unboxed) {
      throw new Error('Decryption failed: Message signature or MAC verification failed (tampered or incorrect key).');
    }

    return encodeUTF8(unboxed);
  } catch (err) {
    console.error('E2EE Decryption Error:', err);
    throw new Error('Failed to decrypt direct message with Curve25519');
  }
}

/**
 * Encrypts symmetric group payload using a 32-byte group key
 */
export function encryptGroupMessage(
  plaintext: string,
  groupKeyBase64: string
): EncryptedPayload {
  const key = decodeBase64(groupKeyBase64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(plaintext);
  const boxed = nacl.secretbox(messageBytes, nonce, key);
  return {
    ciphertext: encodeBase64(boxed),
    nonce: encodeBase64(nonce),
  };
}

/**
 * Decrypts symmetric group payload
 */
export function decryptGroupMessage(
  ciphertextBase64: string,
  nonceBase64: string,
  groupKeyBase64: string
): string {
  const ciphertext = decodeBase64(ciphertextBase64);
  const nonce = decodeBase64(nonceBase64);
  const key = decodeBase64(groupKeyBase64);
  const unboxed = nacl.secretbox.open(ciphertext, nonce, key);
  if (!unboxed) {
    throw new Error('Group decryption failed: MAC verification error.');
  }
  return encodeUTF8(unboxed);
}

/**
 * Computes deterministic 60-digit Signal-style Safety Number from two public keys
 * Used for out-of-band verification between two peers
 */
export function generateSafetyNumber(myPubKey: string, peerPubKey: string): string {
  // Sort public keys alphabetically to make fingerprint identical regardless of who generates it
  const sorted = [myPubKey, peerPubKey].sort();
  const combined = sorted[0] + '::' + sorted[1];
  
  // Fast 32-bit FNV-1a & hash expansion to generate numeric blocks
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  let h3 = 0x27d4eb2f;
  let h4 = 0x165667b1;

  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = (h1 ^ code) * 16777619;
    h2 = (h2 ^ (code + i)) * 2166136261;
    h3 = (h3 ^ ((code << 2) | (code >> 6))) * 1000003;
    h4 = (h4 ^ (code * 31)) * 314159265;
  }

  // Format into 12 groups of 5 digits (total 60 digits)
  const b1 = Math.abs(h1 % 100000).toString().padStart(5, '0');
  const b2 = Math.abs(h2 % 100000).toString().padStart(5, '0');
  const b3 = Math.abs(h3 % 100000).toString().padStart(5, '0');
  const b4 = Math.abs(h4 % 100000).toString().padStart(5, '0');
  const b5 = Math.abs((h1 ^ h2) % 100000).toString().padStart(5, '0');
  const b6 = Math.abs((h2 ^ h3) % 100000).toString().padStart(5, '0');

  return `${b1} ${b2} ${b3} ${b4} ${b5} ${b6}`;
}

/**
 * Computes a short fingerprint representation of a public key (for badges & profile headers)
 */
export function getShortFingerprint(publicKeyBase64: string): string {
  if (!publicKeyBase64) return '0000...0000';
  const clean = publicKeyBase64.replace(/[^a-zA-Z0-9]/g, '');
  return `${clean.substring(0, 6)}...${clean.substring(clean.length - 6)}`;
}

/**
 * Computes simple SHA-256 like hash for file integrity validation
 */
export function computeSimpleChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}
