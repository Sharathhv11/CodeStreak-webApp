const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 1. Generate RSA key pair
const { publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'der' },
});

// 2. Convert DER to Base64 for the manifest "key" field
const manifestKey = publicKey.toString('base64');

// 3. Calculate Extension ID
// Hash the DER public key with SHA256
const hash = crypto.createHash('sha256').update(publicKey).digest('hex');

// Map first 32 chars of hex hash to 'a'-'p'
let extensionId = '';
for (let i = 0; i < 32; i++) {
  const hexChar = hash[i];
  const val = parseInt(hexChar, 16);
  extensionId += String.fromCharCode('a'.charCodeAt(0) + val);
}

console.log('Generated Persistent Extension ID:', extensionId);

// 4. Update manifest.json
const manifestPath = path.join(__dirname, 'extention', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.key = manifestKey; // Add the key to enforce the ID
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
console.log('✅ Updated extention/manifest.json with the new public key.');

// 5. Update constants.js
const constantsPath = path.join(__dirname, 'client', 'src', 'utils', 'constants.js');
let constants = fs.readFileSync(constantsPath, 'utf8');
constants = constants.replace(
  /export const EXTENSION_ID = '[^']+';/,
  `export const EXTENSION_ID = '${extensionId}';`
);
fs.writeFileSync(constantsPath, constants);
console.log('✅ Updated client/src/utils/constants.js with the new Extension ID.');
