/**
 * Native License Checker - JavaScript Wrapper
 * 
 * This module loads the compiled C++ native addon and provides a clean API.
 * If the native module fails to load (e.g., during development without compilation),
 * it falls back gracefully so the app doesn't crash.
 * 
 * Usage in main.cjs:
 *   const nativeLicense = require('./native/index.cjs');
 *   const hwId = nativeLicense.getHardwareId();
 *   const result = nativeLicense.validateLicenseComplete(token, machineId);
 */

const path = require('path');
const fs = require('fs');

let nativeModule = null;
let loadError = null;

/**
 * Attempt to load the native .node binary from multiple possible locations.
 * This handles both development (build/Release/) and packaged (app.asar.unpacked/) paths.
 */
function loadNativeModule() {
  const possiblePaths = [];
  
  // 1. Standard node-gyp build output (development) - uses native_build/ to avoid conflict with app icons in build/
  possiblePaths.push(path.join(__dirname, '..', 'native_build', 'Release', 'license_checker.node'));
  
  // 2. Debug build (development)
  possiblePaths.push(path.join(__dirname, '..', 'native_build', 'Debug', 'license_checker.node'));
  
  // 3. Prebuilt binaries directory (for distribution)
  const platform = process.platform;
  const arch = process.arch;
  possiblePaths.push(path.join(__dirname, '..', 'prebuilds', `${platform}-${arch}`, 'license_checker.node'));
  
  // 4. Electron packaged app - asar.unpacked (production)
  if (process.resourcesPath) {
    possiblePaths.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'native_build', 'Release', 'license_checker.node'));
    possiblePaths.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'native', 'license_checker.node'));
    possiblePaths.push(path.join(process.resourcesPath, 'native', 'license_checker.node'));
  }
  
  // 5. Using bindings module if available
  try {
    const bindings = require('bindings');
    nativeModule = bindings('license_checker');
    console.log('[NativeModule] Loaded via bindings()');
    return true;
  } catch (e) {
    // bindings module not available or failed, try manual paths
  }
  
  // Try each path
  for (const modulePath of possiblePaths) {
    try {
      if (fs.existsSync(modulePath)) {
        nativeModule = require(modulePath);
        console.log(`[NativeModule] Loaded from: ${modulePath}`);
        return true;
      }
    } catch (e) {
      // Continue to next path
    }
  }
  
  return false;
}

// Attempt to load on require()
try {
  if (!loadNativeModule()) {
    loadError = 'Native module not found in any expected location';
    console.warn(`[NativeModule] WARNING: ${loadError}`);
    console.warn('[NativeModule] Run "npm run build:native" to compile the C++ addon');
  }
} catch (err) {
  loadError = err.message;
  console.warn(`[NativeModule] WARNING: Failed to load native module: ${loadError}`);
}

// ============================================================
// Public API - Each function checks if native module is loaded
// ============================================================

/**
 * Check if the native module is available
 * @returns {boolean}
 */
function isAvailable() {
  return nativeModule !== null;
}

/**
 * Get the load error message, if any
 * @returns {string|null}
 */
function getLoadError() {
  return loadError;
}

/**
 * Get the native module version
 * @returns {string}
 */
function getModuleVersion() {
  if (!nativeModule) return '0.0.0';
  return nativeModule.getModuleVersion();
}

/**
 * Get hardware/machine ID from C++ (more tamper-resistant than JS)
 * @returns {string} Machine ID or empty string
 */
function getHardwareId() {
  if (!nativeModule) return '';
  try {
    return nativeModule.getHardwareId();
  } catch (e) {
    console.error('[NativeModule] getHardwareId error:', e.message);
    return '';
  }
}

/**
 * Validate a base64-encoded license token structure
 * @param {string} token 
 * @returns {boolean}
 */
function validateToken(token) {
  if (!nativeModule) return false; // No fallback - must have native module
  try {
    return nativeModule.validateToken(token);
  } catch (e) {
    console.error('[NativeModule] validateToken error:', e.message);
    return false; // Block on error
  }
}

/**
 * Encrypt data with AES-256-CBC bound to machine ID
 * @param {string} plaintext 
 * @param {string} machineId 
 * @returns {string} "iv_hex:ciphertext_hex"
 */
function encryptData(plaintext, machineId) {
  if (!nativeModule) return '';
  try {
    return nativeModule.encryptData(plaintext, machineId);
  } catch (e) {
    console.error('[NativeModule] encryptData error:', e.message);
    return '';
  }
}

/**
 * Decrypt AES-256-CBC data bound to machine ID
 * @param {string} encrypted "iv_hex:ciphertext_hex"
 * @param {string} machineId 
 * @returns {string} Plaintext or empty string on failure
 */
function decryptData(encrypted, machineId) {
  if (!nativeModule) return '';
  try {
    return nativeModule.decryptData(encrypted, machineId);
  } catch (e) {
    console.error('[NativeModule] decryptData error:', e.message);
    return '';
  }
}

/**
 * Sign a license payload with HMAC-SHA256 (secret is embedded in native binary)
 * @param {string} machineId 
 * @param {string} timestamp 
 * @param {string} expiry 
 * @returns {string} HMAC signature hex
 */
function signLicense(machineId, timestamp, expiry) {
  if (!nativeModule) return '';
  try {
    return nativeModule.signLicense(machineId, timestamp, expiry);
  } catch (e) {
    console.error('[NativeModule] signLicense error:', e.message);
    return '';
  }
}

/**
 * Verify a license HMAC-SHA256 signature (constant-time comparison in C++)
 * @param {string} machineId 
 * @param {string} timestamp 
 * @param {string} expiry 
 * @param {string} signature 
 * @returns {boolean}
 */
function verifyLicenseSignature(machineId, timestamp, expiry, signature) {
  if (!nativeModule) return false; // No fallback
  try {
    return nativeModule.verifyLicenseSignature(machineId, timestamp, expiry, signature);
  } catch (e) {
    console.error('[NativeModule] verifyLicenseSignature error:', e.message);
    return false;
  }
}

/**
 * Check license expiry date
 * @param {string} expiryDateISO ISO date string or "never"/"perpetual"
 * @returns {{ valid: boolean, daysRemaining: number }}
 */
function checkExpiry(expiryDateISO) {
  if (!nativeModule) return { valid: false, daysRemaining: 0 };
  try {
    return nativeModule.checkExpiry(expiryDateISO || 'never');
  } catch (e) {
    console.error('[NativeModule] checkExpiry error:', e.message);
    return { valid: false, daysRemaining: 0 };
  }
}

/**
 * Compute SHA-256 hash of a file (for integrity checking)
 * @param {string} filePath 
 * @returns {string} Hex hash or empty string
 */
function computeFileHash(filePath) {
  if (!nativeModule) return '';
  try {
    return nativeModule.computeFileHash(filePath);
  } catch (e) {
    console.error('[NativeModule] computeFileHash error:', e.message);
    return '';
  }
}

/**
 * General-purpose SHA-256 hash
 * @param {string} input 
 * @returns {string} Hex hash
 */
function sha256Hash(input) {
  if (!nativeModule) return '';
  try {
    return nativeModule.sha256Hash(input);
  } catch (e) {
    console.error('[NativeModule] sha256Hash error:', e.message);
    return '';
  }
}

/**
 * Complete license validation: token structure + machine binding + integrity
 * This is the primary function to call from main.cjs
 * 
 * @param {string} [token] License token (optional for initial ID check)
 * @param {string} [machineId] Machine ID from JS layer (verified against native)
 * @param {string} [licenseFilePath] Path to license.dat file (optional)
 * @returns {{ valid: boolean, error: string, machineId: string }}
 */
function validateLicenseComplete(token, machineId, licenseFilePath) {
  if (!nativeModule) {
    return {
      valid: false,
      error: 'native_module_unavailable',
      machineId: '',
      nativeAvailable: false
    };
  }
  
  try {
    const result = nativeModule.validateLicenseComplete(token, machineId, licenseFilePath);
    result.nativeAvailable = true;
    return result;
  } catch (e) {
    console.error('[NativeModule] validateLicenseComplete error:', e.message);
    return {
      valid: false,
      error: e.message,
      machineId: '',
      nativeAvailable: false
    };
  }
}

/**
 * Verify that the JS machine ID matches what C++ reports.
 * This detects if someone patched getHardwareMachineId() in main.cjs.
 * 
 * @param {string} jsMachineId - Machine ID from JS layer
 * @returns {boolean} true if they match
 */
function verifyMachineIdMatch(jsMachineId) {
  if (!nativeModule) return false; // No native module = blocked
  try {
    const nativeId = nativeModule.getHardwareId();
    if (!nativeId || !jsMachineId) return false;
    return nativeId === jsMachineId;
  } catch (e) {
    return false;
  }
}

/**
 * Verify main.cjs file integrity - checks that critical license patterns exist.
 * If someone replaces main.cjs with a clean version, this will detect it.
 * @param {string} mainCjsPath - Path to main.cjs
 * @returns {{ valid: boolean, missing: string }}
 */
function verifyMainIntegrity(mainCjsPath) {
  if (!nativeModule) return { valid: false, missing: 'NATIVE_MODULE_MISSING' };
  try {
    return nativeModule.verifyMainIntegrity(mainCjsPath);
  } catch (e) {
    return { valid: false, missing: 'ERROR: ' + e.message };
  }
}

/**
 * Verify ASAR integrity - checks app.asar exists and no extracted folder present.
 * @param {string} resourcesPath - process.resourcesPath
 * @returns {boolean}
 */
function verifyAsarIntegrity(resourcesPath) {
  if (!nativeModule) return false;
  try {
    return nativeModule.verifyAsarIntegrity(resourcesPath);
  } catch (e) {
    return false;
  }
}

module.exports = {
  // Status
  isAvailable,
  getLoadError,
  getModuleVersion,
  
  // Hardware ID
  getHardwareId,
  verifyMachineIdMatch,
  
  // Token validation
  validateToken,
  
  // Encryption
  encryptData,
  decryptData,
  
  // License signing
  signLicense,
  verifyLicenseSignature,
  
  // Expiry
  checkExpiry,
  
  // Integrity
  computeFileHash,
  sha256Hash,
  
  // Complete validation
  validateLicenseComplete,
  
  // Anti-tamper integrity checks
  verifyMainIntegrity,
  verifyAsarIntegrity,
  
  // Encrypted module loading
  decryptModule
};

/**
 * Decrypt an encrypted module file (.enc) and return the source code.
 * Only the compiled .node binary has the decryption key.
 * @param {string} encryptedFilePath - Path to the .enc file
 * @returns {string} Decrypted JavaScript source code
 */
function decryptModule(encryptedFilePath) {
  if (!nativeModule) {
    throw new Error('Native module not available - cannot decrypt');
  }
  return nativeModule.decryptModule(encryptedFilePath);
}
