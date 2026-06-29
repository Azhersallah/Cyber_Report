/**
 * Encrypted Module Loader for Photo Printer Pro
 * 
 * This is the app's entry point. It loads the compiled C++ native module,
 * decrypts main.enc (the encrypted main.cjs), and executes it.
 * 
 * Without the compiled .node binary, the app code cannot be decrypted.
 * Replacing this file is useless because main.enc remains encrypted.
 */

const path = require('path');
const Module = require('module');
const vm = require('vm');

// Load the native module (compiled C++ binary)
let nativeMod;
try {
  nativeMod = require('./native/index.cjs');
} catch (e) {
  const { dialog, app } = require('electron');
  app.whenReady().then(() => {
    dialog.showErrorBox('Security Error', 'Required security module failed to load. Please reinstall from the official source.');
    app.exit(1);
  });
  return;
}

if (!nativeMod || !nativeMod.isAvailable()) {
  const { dialog, app } = require('electron');
  app.whenReady().then(() => {
    dialog.showErrorBox('Security Error', 'Required security module is missing. Please reinstall from the official source.');
    app.exit(1);
  });
  return;
}

// Decrypt the encrypted main module
// In packaged app, main.enc is in app.asar.unpacked (C++ can't read from ASAR)
let encPath = path.join(__dirname, 'main.enc');
if (__dirname.includes('app.asar')) {
  encPath = encPath.replace('app.asar', 'app.asar.unpacked');
}
let code;
try {
  code = nativeMod.decryptModule(encPath);
} catch (e) {
  // Decryption failed - file tampered or missing
  const { dialog, app } = require('electron');
  app.whenReady().then(() => {
    dialog.showErrorBox('Security Error', 'Application files are corrupted or have been tampered with. Please reinstall from the official source.');
    app.exit(1);
  });
  return;
}

// Verify decrypted code contains required license enforcement patterns
if (!code || code.indexOf('checkLicenseSecure') === -1 || code.indexOf('nativeLicense') === -1) {
  const { dialog, app } = require('electron');
  app.whenReady().then(() => {
    dialog.showErrorBox('Security Error', 'Application code integrity verification failed. Please reinstall.');
    app.exit(1);
  });
  return;
}

if (!code || code.length < 100) {
  const { dialog, app } = require('electron');
  app.whenReady().then(() => {
    dialog.showErrorBox('Security Error', 'Application decryption failed. Please reinstall.');
    app.exit(1);
  });
  return;
}

// Decrypt trial-manager.enc and pre-load it into require cache.
// We must also hook Module._resolveFilename because Node checks the file exists
// on disk BEFORE consulting the cache — the .cjs file is no longer in the ASAR.
const trialFilename = path.join(__dirname, 'trial-manager.cjs');
let trialEncPath = path.join(__dirname, 'trial-manager.enc');
if (__dirname.includes('app.asar')) {
  trialEncPath = trialEncPath.replace('app.asar', 'app.asar.unpacked');
}
try {
  const trialCode = nativeMod.decryptModule(trialEncPath);
  if (trialCode && trialCode.length > 100) {
    const trialMod = new Module(trialFilename, module);
    trialMod.filename = trialFilename;
    trialMod.paths = Module._nodeModulePaths(__dirname);
    trialMod._compile(trialCode, trialFilename);
    trialMod.loaded = true;
    require.cache[trialFilename] = trialMod;

    // Hook resolve so require('./trial-manager.cjs') skips the file-exists check
    const origResolve = Module._resolveFilename;
    Module._resolveFilename = function (request, parent, isMain, options) {
      if (request === './trial-manager.cjs' && require.cache[trialFilename]) {
        return trialFilename;
      }
      return origResolve.call(this, request, parent, isMain, options);
    };
  }
} catch (e) {
  // trial-manager.enc missing or corrupt — trial logic will fail gracefully
  console.error('[Loader] Failed to decrypt trial-manager.enc:', e.message);
}

// Execute the decrypted main.cjs code in the current module context
// This uses Node.js Module._compile which properly sets up require, exports, etc.
const mainFilename = path.join(__dirname, 'main.cjs');
module.filename = mainFilename;
module.paths = Module._nodeModulePaths(__dirname);
module._compile(code, mainFilename);
