/**
 * Encrypt main.cjs + trial-manager.cjs → .enc files
 * 
 * Uses AES-256-CBC with a key derived from the same secret embedded in the
 * compiled .node binary. Only the .node can decrypt the result.
 * 
 * .enc file format: [32 bytes HMAC-SHA256] [16 bytes IV] [AES-256-CBC ciphertext]
 * 
 * The HMAC is computed over the PLAINTEXT using a separate integrity key.
 * This prevents attackers from decrypting, modifying, and re-encrypting
 * the code — even if they have the encryption key, they cannot forge the HMAC
 * without the integrity key (embedded only in the compiled .node binary
 * and in this script, which is NOT shipped with the app).
 * 
 * Run: node scripts/encrypt-main.cjs
 * This should be run BEFORE electron-builder packages the app.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Same secret as in license_checker.cpp (split across s1+s2+s3)
const SECRET = 'PPro-NativeGuard-2024-ModuleKey';

// Derive 32-byte key using SHA-256 (same as C++ sha256::hash_raw)
const key = crypto.createHash('sha256').update(SECRET).digest();

// Integrity HMAC key — must match get_integrity_key() in license_checker.cpp
// This key is NOT shipped with the app (this script stays on the dev machine)
const INTEGRITY_KEY = 'PPro-Integrity-Verify-2024';

// ============================================
// Context Binding: HMAC key depends on loader.cjs content
// If an attacker modifies loader.cjs (to bypass encryption), ALL .enc files
// become undecryptable because the HMAC key changes.
// The C++ DecryptModule reads loader.cjs via N-API and derives the same key.
// ============================================
const loaderPath = path.join(__dirname, '..', 'loader.cjs');
if (!fs.existsSync(loaderPath)) {
  console.error('ERROR: loader.cjs not found at', loaderPath);
  process.exit(1);
}
const loaderContent = fs.readFileSync(loaderPath);
const contextHash = crypto.createHash('sha256')
  .update(loaderContent)
  .update('||CONTEXT_BIND||')
  .digest('hex');
const CONTEXT_KEY = crypto.createHmac('sha256', INTEGRITY_KEY)
  .update(contextHash)
  .digest('hex');
console.log(`Context binding: loader.cjs (${loaderContent.length} bytes)`);
console.log(`  Context hash: ${contextHash.substring(0, 16)}...`);

const mainPath = path.join(__dirname, '..', 'main.cjs');
const encPath = path.join(__dirname, '..', 'main.enc');

if (!fs.existsSync(mainPath)) {
  console.error('ERROR: main.cjs not found at', mainPath);
  process.exit(1);
}

const plaintext = fs.readFileSync(mainPath);
console.log(`Read main.cjs: ${plaintext.length} bytes`);

// Compute HMAC of plaintext for integrity verification
// Only the .node binary and this script know the INTEGRITY_KEY
const hmac = crypto.createHmac('sha256', CONTEXT_KEY).update(plaintext).digest();

// Generate random 16-byte IV
const iv = crypto.randomBytes(16);

// Encrypt with AES-256-CBC (PKCS7 padding is automatic in Node.js)
const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);

// Write: HMAC (32 bytes) + IV (16 bytes) + ciphertext
const output = Buffer.concat([hmac, iv, encrypted]);
fs.writeFileSync(encPath, output);

console.log(`Encrypted main.cjs → main.enc: ${output.length} bytes`);
console.log(`  HMAC: ${hmac.toString('hex')}`);
console.log(`  IV: ${iv.toString('hex')}`);
console.log(`  Ciphertext: ${encrypted.length} bytes`);

// Verify: extract HMAC, IV, ciphertext from written file and decrypt
const verifyHmac = output.subarray(0, 32);
const verifyIv = output.subarray(32, 48);
const verifyCiphertext = output.subarray(48);
const decipher = crypto.createDecipheriv('aes-256-cbc', key, verifyIv);
const decrypted = Buffer.concat([decipher.update(verifyCiphertext), decipher.final()]);
if (decrypted.equals(plaintext)) {
  const recomputedHmac = crypto.createHmac('sha256', CONTEXT_KEY).update(decrypted).digest();
  if (recomputedHmac.equals(verifyHmac)) {
    console.log('Verification: OK (decrypt + HMAC integrity match)');
  } else {
    console.error('ERROR: HMAC verification FAILED!');
    process.exit(1);
  }
} else {
  console.error('ERROR: Verification FAILED - decrypt does not match!');
  process.exit(1);
}

// ============================================
// Encrypt trial-manager.cjs → trial-manager.enc
// ============================================

const trialPath = path.join(__dirname, '..', 'trial-manager.cjs');
const trialEncPath = path.join(__dirname, '..', 'trial-manager.enc');

if (!fs.existsSync(trialPath)) {
  console.error('ERROR: trial-manager.cjs not found at', trialPath);
  process.exit(1);
}

const trialPlaintext = fs.readFileSync(trialPath);
console.log(`\nRead trial-manager.cjs: ${trialPlaintext.length} bytes`);

// Compute HMAC for trial-manager integrity
const trialHmac = crypto.createHmac('sha256', CONTEXT_KEY).update(trialPlaintext).digest();

const trialIv = crypto.randomBytes(16);
const trialCipher = crypto.createCipheriv('aes-256-cbc', key, trialIv);
const trialEncrypted = Buffer.concat([trialCipher.update(trialPlaintext), trialCipher.final()]);

// Write: HMAC (32 bytes) + IV (16 bytes) + ciphertext
const trialOutput = Buffer.concat([trialHmac, trialIv, trialEncrypted]);
fs.writeFileSync(trialEncPath, trialOutput);

console.log(`Encrypted trial-manager.cjs → trial-manager.enc: ${trialOutput.length} bytes`);
console.log(`  HMAC: ${trialHmac.toString('hex')}`);
console.log(`  IV: ${trialIv.toString('hex')}`);
console.log(`  Ciphertext: ${trialEncrypted.length} bytes`);

// Verify trial-manager encryption + HMAC
const trialVerifyHmac = trialOutput.subarray(0, 32);
const trialVerifyIv = trialOutput.subarray(32, 48);
const trialVerifyCiphertext = trialOutput.subarray(48);
const trialDecipher = crypto.createDecipheriv('aes-256-cbc', key, trialVerifyIv);
const trialDecrypted = Buffer.concat([trialDecipher.update(trialVerifyCiphertext), trialDecipher.final()]);
if (trialDecrypted.equals(trialPlaintext)) {
  const trialRecomputedHmac = crypto.createHmac('sha256', CONTEXT_KEY).update(trialDecrypted).digest();
  if (trialRecomputedHmac.equals(trialVerifyHmac)) {
    console.log('Verification: OK (decrypt + HMAC integrity match)');
  } else {
    console.error('ERROR: trial-manager HMAC verification FAILED!');
    process.exit(1);
  }
} else {
  console.error('ERROR: trial-manager.cjs verification FAILED!');
  process.exit(1);
}

// ============================================
// Encrypt ALL critical dist files (HTML, JS, CSS)
// Non-critical files (fonts, images, wasm) stay plaintext
// ============================================

function encryptFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const plaintext = fs.readFileSync(filePath);
  const fileHmac = crypto.createHmac('sha256', CONTEXT_KEY).update(plaintext).digest();
  const fileIv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, fileIv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const output = Buffer.concat([fileHmac, fileIv, encrypted]);
  fs.writeFileSync(filePath + '.enc', output);
  fs.unlinkSync(filePath); // Delete plaintext original
  return true;
}

const distDir = path.join(__dirname, '..', 'dist');

// 1. Encrypt index.html
const htmlPath = path.join(distDir, 'index.html');
if (encryptFile(htmlPath)) {
  console.log('\nEncrypted dist/index.html → index.html.enc');
} else {
  console.log('\nWARNING: dist/index.html not found');
}

// 2. Encrypt all JS files in dist/assets/
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  let jsCount = 0, cssCount = 0;
  
  for (const file of files) {
    const fullPath = path.join(assetsDir, file);
    if (file.endsWith('.js')) {
      if (encryptFile(fullPath)) jsCount++;
    } else if (file.endsWith('.css')) {
      if (encryptFile(fullPath)) cssCount++;
    }
    // .mjs, .wasm, .woff, .woff2, .svg etc. stay plaintext (open source / non-critical)
  }
  
  console.log(`Encrypted ${jsCount} JS files and ${cssCount} CSS files in dist/assets/`);
  
  // Show what's left plaintext
  const remaining = fs.readdirSync(assetsDir).filter(f => !f.endsWith('.enc'));
  console.log(`Remaining plaintext files: ${remaining.length} (fonts, wasm, images, mjs modules)`);
} else {
  console.log('WARNING: dist/assets/ not found');
}

