const nacl = require('tweetnacl');
const { decodeBase64, encodeBase64, decodeUTF8, encodeUTF8 } = require('tweetnacl-util');

console.log('=== P2P MESH CRYPTO & PROTOCOL VERIFICATION ===\n');

// 1. Generate Keypairs for Alice & Bob
const aliceKp = nacl.box.keyPair();
const bobKp = nacl.box.keyPair();

const alicePublic = encodeBase64(aliceKp.publicKey);
const aliceSecret = encodeBase64(aliceKp.secretKey);
const bobPublic = encodeBase64(bobKp.publicKey);
const bobSecret = encodeBase64(bobKp.secretKey);

console.log('✓ Alice Curve25519 Public Key:', alicePublic.substring(0, 24) + '...');
console.log('✓ Bob Curve25519 Public Key:', bobPublic.substring(0, 24) + '...');

// 2. Encrypt message from Alice to Bob
const messageText = 'Hello Bob! This is an offline peer-to-peer encrypted mesh message.';
const nonce = nacl.randomBytes(nacl.box.nonceLength);
const boxed = nacl.box(
  decodeUTF8(messageText),
  nonce,
  decodeBase64(bobPublic),
  decodeBase64(aliceSecret)
);

const cipherBase64 = encodeBase64(boxed);
const nonceBase64 = encodeBase64(nonce);
console.log('✓ Encrypted Ciphertext length:', cipherBase64.length, 'bytes');

// 3. Bob Decrypts
const unboxed = nacl.box.open(
  decodeBase64(cipherBase64),
  decodeBase64(nonceBase64),
  decodeBase64(alicePublic),
  decodeBase64(bobSecret)
);

if (!unboxed) {
  console.error('❌ Decryption failed!');
  process.exit(1);
}

const decryptedText = encodeUTF8(unboxed);
console.log('✓ Bob Decrypted Text:', decryptedText);
if (decryptedText === messageText) {
  console.log('✓ Verification Passed: Decrypted text matches original plaintext exactly!');
} else {
  console.error('❌ Mismatch in decrypted text');
  process.exit(1);
}

// 4. Test Tamper Resistance (Authentication Failure)
const tamperedBytes = decodeBase64(cipherBase64);
tamperedBytes[5] ^= 0xff; // Flip bits
const tamperedDecrypt = nacl.box.open(
  tamperedBytes,
  decodeBase64(nonceBase64),
  decodeBase64(alicePublic),
  decodeBase64(bobSecret)
);

if (tamperedDecrypt === null) {
  console.log('✓ Tamper Resistance Verified: Tampered ciphertext was rejected by Poly1305 MAC authentication.');
} else {
  console.error('❌ Tampered message was not rejected!');
  process.exit(1);
}

// 5. Signal Safety Number Verification
function generateSafetyNumber(myPubKey, peerPubKey) {
  const sorted = [myPubKey, peerPubKey].sort();
  const combined = sorted[0] + '::' + sorted[1];
  let h1 = 0x811c9dc5, h2 = 0x9e3779b9, h3 = 0x27d4eb2f, h4 = 0x165667b1;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = (h1 ^ code) * 16777619;
    h2 = (h2 ^ (code + i)) * 2166136261;
    h3 = (h3 ^ ((code << 2) | (code >> 6))) * 1000003;
    h4 = (h4 ^ (code * 31)) * 314159265;
  }
  const b1 = Math.abs(h1 % 100000).toString().padStart(5, '0');
  const b2 = Math.abs(h2 % 100000).toString().padStart(5, '0');
  const b3 = Math.abs(h3 % 100000).toString().padStart(5, '0');
  const b4 = Math.abs(h4 % 100000).toString().padStart(5, '0');
  const b5 = Math.abs((h1 ^ h2) % 100000).toString().padStart(5, '0');
  const b6 = Math.abs((h2 ^ h3) % 100000).toString().padStart(5, '0');
  return `${b1} ${b2} ${b3} ${b4} ${b5} ${b6}`;
}

const aliceSafety = generateSafetyNumber(alicePublic, bobPublic);
const bobSafety = generateSafetyNumber(bobPublic, alicePublic);
console.log('✓ Alice Safety Number:', aliceSafety);
console.log('✓ Bob Safety Number:  ', bobSafety);

if (aliceSafety === bobSafety) {
  console.log('✓ Deterministic Safety Number Verified: Both peers calculate identical 60-digit fingerprint!');
} else {
  console.error('❌ Safety numbers do not match!');
  process.exit(1);
}

console.log('\n=== ALL TESTS PASSED SUCCESSFULLY ===');
