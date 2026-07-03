const { app, BrowserWindow, ipcMain, dialog, screen, Menu, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');
const https = require('https');
const TrialManager = require('./trial-manager.cjs');

// ============================================
// TRIAL SYSTEM INSTANCE
// ============================================
const trialManager = new TrialManager();
let cachedTrialStatus = null;

// Register custom protocol BEFORE app.ready — required by Electron
protocol.registerSchemesAsPrivileged([{
  scheme: 'pppro',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true }
}]);

// ============================================
// NATIVE LICENSE PROTECTION MODULE (C++ addon)
// MANDATORY in production - prevents ASAR unpack/modify/repack attacks
// The .node binary verifies main.cjs content and ASAR integrity
// ============================================
let nativeLicense = null;
try {
  nativeLicense = require('./native/index.cjs');
  if (nativeLicense.isAvailable()) {
    console.log(`[NativeProtection] Loaded v${nativeLicense.getModuleVersion()}`);
    
    // In packaged app: verify ASAR hasn't been extracted alongside app.asar
    // Note: main.cjs self-integrity check is no longer needed because main.cjs
    // is now encrypted (main.enc) and can only be decrypted by the .node binary
    if (app.isPackaged) {
      const asarOk = nativeLicense.verifyAsarIntegrity(process.resourcesPath);
      if (!asarOk) {
        dialog.showErrorBox('Security Error', 'Application integrity check failed. The application files have been tampered with. Please reinstall from the official source.');
        app.exit(1);
      }
    }
  } else if (app.isPackaged) {
    // Production build MUST have native module compiled
    dialog.showErrorBox('Security Error', 'Required security module is missing. Please reinstall from the official source.');
    app.exit(1);
  } else {
    console.warn('[NativeProtection] Module not compiled. Run: npm run build:native');
  }
} catch (err) {
  if (app.isPackaged) {
    dialog.showErrorBox('Security Error', 'Required security module failed to load. Please reinstall from the official source.');
    app.exit(1);
  } else {
    console.warn('[NativeProtection] Could not load native module:', err.message);
  }
}

// Enable SharedArrayBuffer for WASM threading
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');

const isDev = !require('electron').app.isPackaged;
let mainWindow;
let fileToOpen = null;

// ============================================
// APP SETTINGS & TASKS - JSON FILE
// ============================================

const SETTINGS_FILE_NAME = 'settings.json';
const TASKS_FILE_NAME = 'tasks.json';

function getSettingsFilePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, SETTINGS_FILE_NAME);
}

function getTasksFilePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, TASKS_FILE_NAME);
}

function loadSettings() {
  try {
    const settingsPath = getSettingsFilePath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
  return null;
}

function saveSettings(settings) {
  try {
    const settingsPath = getSettingsFilePath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save settings:', err);
    return false;
  }
}

function loadTasks() {
  try {
    const tasksPath = getTasksFilePath();
    if (fs.existsSync(tasksPath)) {
      const data = fs.readFileSync(tasksPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load tasks:', err);
  }
  return [];
}

function saveTasks(tasks) {
  try {
    const tasksPath = getTasksFilePath();
    fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save tasks:', err);
    return false;
  }
}

// ============================================
// SECURE LICENSE SYSTEM - DURABLE OBJECTS + WEBSOCKET
// ============================================

const LICENSE_API_URL = 'https://pppro-api.azhersallah1.workers.dev';
const LICENSE_WS_URL = 'wss://pppro-api.azhersallah1.workers.dev/ws';
const LICENSE_FILE_NAME = 'license.dat';

// WebSocket connection removed
let wsConnection = null;
let wsReconnectTimer = null;


// Get license file path
function getLicenseFilePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, LICENSE_FILE_NAME);
}

// Generate checksum for integrity
function generateChecksum(data, machineId) {
  const content = `${data.token}:${data.machineId}:${data.activatedAt}:${data.lastVerified}:${machineId}`;
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

// Encrypt license data (hardware-bound)
function encryptLicenseData(data, machineId) {
  const key = crypto.scryptSync(machineId + 'PPro-License-2024', 'license-salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt license data
function decryptLicenseData(encryptedData, machineId) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 2) return null;

    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(machineId + 'PPro-License-2024', 'license-salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}

// Save license to encrypted file
function saveLicenseToFile(token, machineId) {
  try {
    const now = new Date().toISOString();
    const licenseData = { token, machineId, activatedAt: now, lastVerified: now };
    const checksum = generateChecksum(licenseData, machineId);
    const fullData = { ...licenseData, checksum };
    const encrypted = encryptLicenseData(fullData, machineId);
    fs.writeFileSync(getLicenseFilePath(), encrypted, 'utf8');
    return true;
  } catch (err) {
    console.error('Failed to save license:', err);
    return false;
  }
}

// Load license from file
function loadLicenseFromFile(machineId) {
  try {
    const licensePath = getLicenseFilePath();
    if (!fs.existsSync(licensePath)) return null;

    const encrypted = fs.readFileSync(licensePath, 'utf8');
    const data = decryptLicenseData(encrypted, machineId);
    if (!data) return null;

    // Verify checksum
    const { checksum, ...rest } = data;
    const expectedChecksum = generateChecksum(rest, machineId);
    if (checksum !== expectedChecksum) {
      console.error('License checksum mismatch');
      return null;
    }

    // Verify machine ID
    if (data.machineId !== machineId) {
      console.error('License machine ID mismatch');
      return null;
    }

    return data;
  } catch (err) {
    console.error('Failed to load license:', err);
    return null;
  }
}

// Delete license file
function deleteLicenseFile() {
  try {
    const licensePath = getLicenseFilePath();
    if (fs.existsSync(licensePath)) fs.unlinkSync(licensePath);
    return true;
  } catch { return false; }
}

// Validate token structure (no expiration - works forever after activation)
function isTokenValid(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split(':');
    // Token format: version:machineId:timestamp:signature
    return parts.length >= 4;
  } catch { return false; }
}

// API call helper
function apiCall(action, machineId, token = null, appVersion = null) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ action, machineId, token, appVersion });
    const url = new URL(LICENSE_API_URL);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) resolve(JSON.parse(data));
          else reject(new Error(`API error: ${res.statusCode}`));
        } catch (e) { reject(e); }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData);
    req.end();
  });
}

// Main license check function
// Main license check function
async function checkLicenseSecure(machineId) {
  if (!machineId) {
    return { activated: false, source: 'offline', error: 'No machine ID' };
  }

  const storedLicense = loadLicenseFromFile(machineId);
  const appVersion = app.getVersion();

  // Try online verification ONCE on startup
  // This updates "last active" on server and checks for deactivation
  try {
    const token = storedLicense ? storedLicense.token : null;
    // Always call verify/refresh to update server state
    const action = token ? 'refresh' : 'verify';

    // Set a short timeout for the check so we don't block startup too long if offline
    // apiCall helper already has a timeout, but we rely on it here
    const result = await apiCall(action, machineId, token, appVersion);

    // 1. License explicitly revoked/deactivated on server
    if (result.revoked || result.activated === false) {
      console.log('License deactivated by server');
      deleteLicenseFile();
      return { activated: false, source: 'online', error: 'License deactivated' };
    }

    // 2. Verified/Activated successfully
    if (result.activated && result.token) {
      saveLicenseToFile(result.token, machineId);
      return { activated: true, source: 'online', machineId };
    }
  } catch (err) {
    console.log('Online check failed (offline mode):', err.message);
    // Continue to offline fallback
  }

  // Offline fallback - works if we have a valid stored license
  if (storedLicense && storedLicense.token) {
    if (isTokenValid(storedLicense.token)) {
      return { activated: true, source: 'offline', machineId };
    }
    // Invalid token structure
    deleteLicenseFile();
    return { activated: false, source: 'offline', error: 'Invalid license', machineId };
  }

  return { activated: false, source: 'offline', error: 'Internet required for first activation', machineId };
}

// ============================================
// HARDWARE MACHINE ID
// ============================================

function getHardwareMachineId() {
  try {
    let machineId = '';

    if (process.platform === 'win32') {
      // Method 1: Motherboard serial (original order — matches existing licenses)
      try {
        const mbSerial = execSync('powershell -NoProfile -command "(Get-WmiObject Win32_BaseBoard).SerialNumber"', { encoding: 'utf8', windowsHide: true, timeout: 10000 });
        const mbMatch = mbSerial.trim();
        if (mbMatch && mbMatch !== 'To be filled by O.E.M.' && mbMatch !== 'Default string' && mbMatch.length > 3) {
          machineId = mbMatch;
        }
      } catch (e) {
        try {
          const mbSerial = execSync('wmic baseboard get serialnumber', { encoding: 'utf8', windowsHide: true, timeout: 10000 });
          const mbMatch = mbSerial.split('\n')[1]?.trim();
          if (mbMatch && mbMatch !== 'To be filled by O.E.M.' && mbMatch.length > 3) {
            machineId = mbMatch;
          }
        } catch (e2) { }
      }

      // Method 2: BIOS serial
      if (!machineId) {
        try {
          const biosSerial = execSync('powershell -NoProfile -command "(Get-WmiObject Win32_BIOS).SerialNumber"', { encoding: 'utf8', windowsHide: true, timeout: 10000 });
          const biosMatch = biosSerial.trim();
          if (biosMatch && biosMatch !== 'To be filled by O.E.M.' && biosMatch !== 'Default string' && biosMatch.length > 3) {
            machineId = biosMatch;
          }
        } catch (e) { }
      }

      // Method 3: CPU ID
      if (!machineId) {
        try {
          const cpuId = execSync('powershell -NoProfile -command "(Get-WmiObject Win32_Processor).ProcessorId"', { encoding: 'utf8', windowsHide: true, timeout: 10000 });
          const cpuMatch = cpuId.trim();
          if (cpuMatch && cpuMatch.length > 3) machineId = cpuMatch;
        } catch (e) { }
      }

      // Method 4 (last fallback): Registry MachineGuid
      if (!machineId) {
        try {
          const regResult = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', { encoding: 'utf8', windowsHide: true, timeout: 5000 });
          const match = regResult.match(/MachineGuid\s+REG_SZ\s+(.+)/);
          if (match && match[1].trim().length > 3) {
            machineId = match[1].trim();
          }
        } catch (e) { }
      }
    } else if (process.platform === 'darwin') {
      try {
        const result = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf8' });
        machineId = result.split(':')[1]?.trim() || '';
      } catch (e) { }
    } else {
      try {
        if (fs.existsSync('/sys/class/dmi/id/product_uuid')) {
          machineId = fs.readFileSync('/sys/class/dmi/id/product_uuid', 'utf8').trim();
        } else if (fs.existsSync('/etc/machine-id')) {
          machineId = fs.readFileSync('/etc/machine-id', 'utf8').trim();
        }
      } catch (e) { }
    }

    if (machineId) {
      machineId = machineId.replace(/\//g, '_').replace(/^[_\-\.]+/, '').replace(/[_\-\.]+$/, '').replace(/\s+/g, '');
    }

    return machineId || null;
  } catch (err) {
    console.error('Failed to get hardware machine ID:', err);
    return null;
  }
}

// ============================================
// WINDOW CREATION
// ============================================

function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = Math.round(screenWidth * 0.9);
  const windowHeight = Math.round(screenHeight * 0.9);

  Menu.setApplicationMenu(null);

  const iconPath = isDev
    ? path.join(__dirname, 'build', 'icon.png')
    : path.join(process.resourcesPath, 'build', 'icon.png');

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    frame: true,
    center: true,
    show: false, // Hidden until ready-to-show fires — eliminates white flash
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: false, // Disabled for production
      webSecurity: false, // Allow external API calls (Hugging Face, etc.)
    },
  });

  // Block DevTools shortcuts in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') event.preventDefault();
    if (input.control && input.shift && input.key.toLowerCase() === 'i') event.preventDefault();
    if (input.control && input.shift && input.key.toLowerCase() === 'j') event.preventDefault();
    if (input.control && input.key.toLowerCase() === 'u') event.preventDefault();
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // All dist files served through encrypted pppro:// protocol
    mainWindow.loadURL('pppro://app/index.html');
  }

  // Show window only when renderer is fully painted — no white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(1.0);
    if (fileToOpen) {
      pendingFileToOpen = fileToOpen;
      fileToOpen = null;
      setTimeout(() => {
        if (pendingFileToOpen) {
          openProjectFile(pendingFileToOpen);
          pendingFileToOpen = null;
        }
      }, 1000);
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key === '+' || input.key === '-' || input.key === '=' || input.key === '0')) {
      event.preventDefault();
    }
  });
}

// ============================================
// LICENSE STATE - CONTROLS ALL FEATURES
// ============================================

let isLicenseValid = false;
let cachedMachineId = null;
let heartbeatInterval = null;
let updateCheckInterval = null;
let lastKnownActivationState = null;
let lastNotifiedUpdateVersion = null;

// Heartbeat with activity detection - REMOVED (using WebSocket now)
// WebSocket connection = online, disconnect = offline
// Durable Objects handles connection persistence automatically

let wsPingInterval = null; // Ping interval for keeping connection alive

// Connect WebSocket for real-time online status
// WebSocket functions removed
function connectWebSocket(machineId) {
  // Disabled
}

// Disconnect WebSocket
function disconnectWebSocket() {
  if (wsPingInterval) {
    clearInterval(wsPingInterval);
    wsPingInterval = null;
  }
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (wsConnection) {
    wsConnection.close();
    wsConnection = null;
  }
}

// Quick license check (uses cached state)
function requireLicense() {
  if (!isLicenseValid) {
    return { success: false, error: 'LICENSE_REQUIRED', message: 'بەرنامە چالاک نەکراوە' };
  }
  return { success: true };
}

// Start WebSocket connection
function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (updateCheckInterval) clearInterval(updateCheckInterval);

  // WebSocket connection REMOVED

  // Check for app updates every 5 minutes (reduced from 30 seconds)
  checkForAppUpdate();
  updateCheckInterval = setInterval(checkForAppUpdate, 300000); // 5 minutes
}

// Check for app updates from GitHub
async function checkForAppUpdate() {
  if (!mainWindow || !mainWindow.webContents) return;

  try {
    const release = await fetchLatestRelease();
    if (!release || !release.tag_name) return;

    const latestVersion = release.tag_name.replace('v', '');
    const currentVersion = app.getVersion();
    const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true }) > 0;

    if (isNewer && latestVersion !== lastNotifiedUpdateVersion) {
      lastNotifiedUpdateVersion = latestVersion;
      console.log('New update available:', latestVersion);

      mainWindow.webContents.send('server-update-notification', {
        title: 'نوێکردنەوەی نوێ',
        message: `وەشانی ${latestVersion} بەردەستە. تکایە بەرنامەکە نوێ بکەرەوە.`,
        version: latestVersion,
        forceUpdate: false
      });

      mainWindow.webContents.send('update-status', {
        status: 'available',
        message: `نوێکردنەوەی نوێ بەردەستە: ${latestVersion}`,
        messageEn: `New update available: ${latestVersion}`,
        version: latestVersion
      });

      latestReleaseInfo = release;
    }
  } catch (err) {
    // Silent fail
  }
}

// Stop WebSocket and mark offline
async function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
    updateCheckInterval = null;
  }

  // Disconnect WebSocket (server will mark as offline automatically)
  disconnectWebSocket();
}

// ============================================
// IPC HANDLERS
// ============================================

// Window controls
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle('window-is-maximized', () => mainWindow ? mainWindow.isMaximized() : false);
ipcMain.handle('get-machine-id', () => getHardwareMachineId());
ipcMain.handle('get-app-version', () => app.getVersion());

// Settings handlers - JSON file
ipcMain.handle('load-settings', () => loadSettings());
ipcMain.handle('save-settings', (event, settings) => saveSettings(settings));

// Tasks handlers - JSON file
ipcMain.handle('load-tasks', () => loadTasks());
ipcMain.handle('save-tasks', (event, tasks) => saveTasks(tasks));

// User activity tracking (scroll, click, keypress, mouse move)
// Note: Activity tracking now handled via WebSocket connection
ipcMain.on('user-activity', () => {
  // WebSocket connection handles online status automatically
});

// ============================================
// TRIAL SYSTEM - IPC HANDLERS
// ============================================

// Check trial status (called from renderer before or alongside license check)
ipcMain.handle('check-trial', () => {
  cachedTrialStatus = trialManager.checkTrial();
  return cachedTrialStatus;
});

// Get cached trial status without re-checking
ipcMain.handle('get-trial-status', () => {
  return cachedTrialStatus || trialManager.checkTrial();
});

// Start trial (called when user clicks "Try for 10 hours" button)
ipcMain.handle('start-trial', () => {
  const result = trialManager.startTrial();
  cachedTrialStatus = result;
  if (result.isValid) {
    isLicenseValid = true;
  }
  return result;
});

/**
 * Show trial expired dialog.
 * Returns: 'enter-license' | 'purchase' | 'exit'
 * Does NOT quit the app — lets the license manager handle activation.
 */
function showTrialExpiredDialog(tampered) {
  const message = tampered
    ? 'Cannot reset trial. Please purchase a license.'
    : 'Trial expired. Please enter your license key or purchase the full version.';

  const result = dialog.showMessageBoxSync(mainWindow, {
    type: 'warning',
    title: 'Photo Printer Pro - Trial Expired',
    message: message,
    buttons: ['Enter License', 'Purchase', 'Exit'],
    defaultId: 0,
    cancelId: 2,
    noLink: true
  });

  // 0 = Enter License, 1 = Purchase, 2 = Exit
  if (result === 1) {
    // Open purchase page in default browser
    require('electron').shell.openExternal('https://photo-printer-pro.netlify.app/');
    return 'purchase';
  } else if (result === 2) {
    return 'exit';
  }
  return 'enter-license';
}

// IPC handler to show the trial dialog from the renderer
ipcMain.handle('show-trial-expired-dialog', (event, tampered) => {
  return showTrialExpiredDialog(tampered === true);
});

// SECURE LICENSE CHECK
ipcMain.handle('check-license', async () => {
  const machineId = getHardwareMachineId();
  cachedMachineId = machineId;

  if (!machineId) {
    isLicenseValid = false;
    return { activated: false, machineId: null, error: 'Could not get machine ID' };
  }

  // ASAR integrity check
  if (app.isPackaged) {
    const asarPath = path.join(process.resourcesPath, 'app.asar');
    const extractedPath = path.join(process.resourcesPath, 'app');

    if (fs.existsSync(extractedPath) || !fs.existsSync(asarPath)) {
      isLicenseValid = false;
      dialog.showMessageBoxSync({
        type: 'error',
        title: 'Error',
        message: 'Application files corrupted. Please reinstall.',
        buttons: ['OK']
      });
      app.quit();
      return { activated: false, machineId, error: 'Integrity check failed' };
    }
  }

  // ---- NATIVE MODULE PROTECTION LAYER (additive) ----
  // Cross-verify the machine ID from C++ to detect JS tampering
  if (nativeLicense && nativeLicense.isAvailable()) {
    try {
      const nativeMachineIdMatch = nativeLicense.verifyMachineIdMatch(machineId);
      if (!nativeMachineIdMatch) {
        console.error('[NativeProtection] Machine ID mismatch between JS and native module');
        isLicenseValid = false;
        dialog.showMessageBoxSync({
          type: 'error',
          title: 'Security Error',
          message: 'Hardware verification failed. Please reinstall the application.',
          buttons: ['OK']
        });
        app.quit();
        return { activated: false, machineId, error: 'Native integrity check failed' };
      }
    } catch (nativeErr) {
      console.warn('[NativeProtection] Verification warning:', nativeErr.message);
      // Don't block on native module errors - JS system continues independently
    }
  }
  // ---- END NATIVE MODULE PROTECTION LAYER ----

  // Use secure license check
  const result = await checkLicenseSecure(machineId);
  isLicenseValid = result.activated;
  lastKnownActivationState = result.activated;

  // ---- NATIVE POST-VALIDATION (additive) ----
  // After JS license check succeeds, also validate via native module
  if (result.activated && nativeLicense && nativeLicense.isAvailable()) {
    try {
      const storedLicense = loadLicenseFromFile(machineId);
      if (storedLicense && storedLicense.token) {
        const nativeResult = nativeLicense.validateLicenseComplete(storedLicense.token, machineId);
        if (nativeResult.nativeAvailable && !nativeResult.valid) {
          console.error('[NativeProtection] Native validation rejected license:', nativeResult.error);
          isLicenseValid = false;
          return { activated: false, machineId, error: 'License validation failed (native)', source: 'native' };
        }
      }
    } catch (nativeErr) {
      console.warn('[NativeProtection] Post-validation warning:', nativeErr.message);
      // Don't block on native module errors
    }
  }
  // ---- END NATIVE POST-VALIDATION ----

  // Always start heartbeat (for tracking and live status updates)
  startHeartbeat();

  // ---- TRIAL SYSTEM INTEGRATION ----
  // If license is not activated, check trial status and pass to renderer.
  // The renderer ALWAYS shows the activation dialog when no license.
  // User must click "Try" button each launch — that triggers start-trial IPC
  // which sets isLicenseValid = true and lets the app run.
  if (!result.activated) {
    cachedTrialStatus = trialManager.checkTrial();
    result.trial = cachedTrialStatus;
  }
  // ---- END TRIAL SYSTEM INTEGRATION ----

  return result;
});

// Project file handling - ALL REQUIRE LICENSE
let currentProjectPath = null;
let pendingFileToOpen = null;

ipcMain.handle('save-project', async (event, { content, filePath }) => {
  const licenseCheck = requireLicense();
  if (!licenseCheck.success) return licenseCheck;

  try {
    // ATOMIC WRITE: Write to temp file first, then rename
    // This prevents corruption if app crashes during write
    const tempPath = filePath + '.tmp';
    const backupPath = filePath + '.backup';
    
    // Write to temporary file first
    await fs.promises.writeFile(tempPath, content, 'utf-8');
    
    // Create backup of existing file if it exists
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.copyFile(filePath, backupPath);
      } catch (backupErr) {
        console.warn('Could not create backup:', backupErr);
        // Continue anyway - better to save than fail
      }
    }
    
    // Atomically replace the old file with the new one
    await fs.promises.rename(tempPath, filePath);
    
    // Delete backup after successful save (keep it for one save cycle)
    if (fs.existsSync(backupPath)) {
      try {
        // Wait a bit before deleting backup to ensure file system sync
        setTimeout(() => {
          if (fs.existsSync(backupPath)) {
            fs.unlinkSync(backupPath);
          }
        }, 1000);
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
    }
    
    currentProjectPath = filePath;
    return { success: true, filePath };
  } catch (err) {
    console.error('Save project error:', err);
    
    // Try to restore from backup if save failed
    const backupPath = filePath + '.backup';
    if (fs.existsSync(backupPath)) {
      try {
        await fs.promises.copyFile(backupPath, filePath);
        console.log('Restored from backup after save failure');
      } catch (restoreErr) {
        console.error('Could not restore from backup:', restoreErr);
      }
    }
    
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-project-as', async (event, { content, defaultName }) => {
  const licenseCheck = requireLicense();
  if (!licenseCheck.success) return licenseCheck;

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Project As',
      defaultPath: defaultName || 'project.pppro',
      filters: [{ name: 'Photo Printer Pro Project', extensions: ['pppro'] }]
    });

    if (result.canceled || !result.filePath) return { success: false, canceled: true };

    // ATOMIC WRITE: Write to temp file first, then rename
    const tempPath = result.filePath + '.tmp';
    
    // Write to temporary file first
    await fs.promises.writeFile(tempPath, content, 'utf-8');
    
    // Atomically move temp file to final destination
    await fs.promises.rename(tempPath, result.filePath);
    
    currentProjectPath = result.filePath;
    return { success: true, filePath: result.filePath };
  } catch (err) {
    console.error('Save project as error:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-current-project-path', () => currentProjectPath);
ipcMain.handle('set-current-project-path', (event, filePath) => { currentProjectPath = filePath; return true; });
ipcMain.handle('set-window-title', (event, title) => { if (mainWindow) mainWindow.setTitle(title); return true; });

ipcMain.handle('open-dropped-project', async (event, filePath) => {
  if (filePath) openProjectFile(filePath);
  return true;
});

ipcMain.handle('open-project-dialog', async () => {
  const licenseCheck = requireLicense();
  if (!licenseCheck.success) return licenseCheck;

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Project',
      filters: [{ name: 'Photo Printer Pro Project', extensions: ['pppro'] }],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    currentProjectPath = filePath;
    return { success: true, content, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-pending-file', () => {
  // Allow pending file only if licensed
  if (!isLicenseValid) return { success: false, noPendingFile: true };

  if (pendingFileToOpen && fs.existsSync(pendingFileToOpen)) {
    try {
      const content = fs.readFileSync(pendingFileToOpen, 'utf-8');
      const filePath = pendingFileToOpen;
      currentProjectPath = filePath;
      pendingFileToOpen = null;
      return { success: true, content, filePath };
    } catch (err) {
      pendingFileToOpen = null;
      return { success: false, error: err.message };
    }
  }
  return { success: false, noPendingFile: true };
});

function openProjectFile(filePath) {
  if (!isLicenseValid) return; // Block if not licensed
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    const encryptedContent = fs.readFileSync(filePath, 'utf-8');
    currentProjectPath = filePath;
    if (mainWindow) {
      mainWindow.webContents.send('open-project-encrypted', { content: encryptedContent, filePath });
    }
  } catch (err) {
    console.error('Failed to read project file', err);
  }
}

// ============================================
// AUTO UPDATER
// ============================================

const GITHUB_OWNER = 'Azhersallah';
const GITHUB_REPO = 'photo-printer-pro';
let latestReleaseInfo = null;
let downloadedFilePath = null;

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: { 'User-Agent': 'Photo-Printer-Pro-Updater', 'Accept': 'application/vnd.github.v3+json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) resolve(JSON.parse(data));
          else reject(new Error(`GitHub API error: ${res.statusCode}`));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function downloadAsset(assetId, assetName, totalSize) {
  return new Promise((resolve, reject) => {
    const tempDir = app.getPath('temp');
    const filePath = path.join(tempDir, assetName);
    const file = fs.createWriteStream(filePath, { highWaterMark: 1024 * 1024 });

    let downloadedBytes = 0;
    let lastProgressUpdate = 0;
    let lastBytes = 0;
    let lastTime = Date.now();
    let speed = 0;

    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/assets/${assetId}`,
      method: 'GET',
      headers: { 'User-Agent': 'Photo-Printer-Pro-Updater', 'Accept': 'application/octet-stream' }
    };

    const makeRequest = (opts) => {
      const req = https.request(opts, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const redirectUrl = new URL(res.headers.location);
          makeRequest({
            hostname: redirectUrl.hostname,
            path: redirectUrl.pathname + redirectUrl.search,
            method: 'GET', port: 443,
            headers: { 'User-Agent': 'Photo-Printer-Pro-Updater', 'Connection': 'keep-alive' }
          });
          return;
        }

        if (res.statusCode !== 200) { reject(new Error(`Download failed: ${res.statusCode}`)); return; }

        res.pipe(file);
        res.on('data', (chunk) => {
          downloadedBytes += chunk.length;
          const now = Date.now();
          if (now - lastProgressUpdate > 200) {
            const timeDiff = (now - lastTime) / 1000;
            const bytesDiff = downloadedBytes - lastBytes;
            speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
            lastTime = now; lastBytes = downloadedBytes; lastProgressUpdate = now;
            const percent = Math.round((downloadedBytes / totalSize) * 100);

            if (mainWindow && mainWindow.webContents) {
              mainWindow.webContents.send('update-status', {
                status: 'downloading', message: `داگرتن... ${percent}%`, messageEn: `Downloading... ${percent}%`,
                percent, transferred: formatBytes(downloadedBytes), total: formatBytes(totalSize), speed: formatBytes(speed) + '/s'
              });
            }
          }
        });
        res.on('end', () => file.end(() => resolve(filePath)));
        res.on('error', (err) => { file.close(); fs.unlink(filePath, () => { }); reject(err); });
      });
      req.setTimeout(300000);
      req.on('error', (err) => { file.close(); fs.unlink(filePath, () => { }); reject(err); });
      req.end();
    };
    makeRequest(options);
  });
}

ipcMain.handle('check-for-updates', async () => {
  try {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', { status: 'checking', message: 'گەڕان بۆ نوێکردنەوە...', messageEn: 'Checking for updates...' });
    }

    const release = await fetchLatestRelease();
    latestReleaseInfo = release;

    const latestVersion = release.tag_name.replace('v', '');
    const currentVersion = app.getVersion();
    const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true }) > 0;

    if (isNewer) {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', {
          status: 'available', message: `نوێکردنەوەی نوێ بەردەستە: ${latestVersion}`,
          messageEn: `New update available: ${latestVersion}`, version: latestVersion
        });
      }
      return { success: true, updateAvailable: true, version: latestVersion };
    } else {
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-status', { status: 'not-available', message: 'هیچ نوێکردنەوەیەک بەردەست نییە', messageEn: 'No updates available' });
      }
      return { success: true, updateAvailable: false, version: currentVersion };
    }
  } catch (error) {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', { status: 'error', message: 'هەڵەیەک ڕوویدا', messageEn: 'Error checking for updates' });
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    if (!latestReleaseInfo) throw new Error('No release info available');
    const exeAsset = latestReleaseInfo.assets.find(a => a.name.endsWith('.exe') && !a.name.includes('blockmap'));
    if (!exeAsset) throw new Error('No installer found');

    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', { status: 'downloading', message: 'داگرتن... 0%', messageEn: 'Downloading... 0%', percent: 0 });
    }

    downloadedFilePath = await downloadAsset(exeAsset.id, exeAsset.name, exeAsset.size);

    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', { status: 'downloaded', message: 'نوێکردنەوە ئامادەیە', messageEn: 'Update ready to install' });
    }
    return { success: true };
  } catch (error) {
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', { status: 'error', message: 'هەڵەیەک ڕوویدا', messageEn: 'Error downloading' });
    }
    return { success: false, error: error.message };
  }
});

ipcMain.handle('install-update', () => {
  if (downloadedFilePath && fs.existsSync(downloadedFilePath)) {
    const { spawn } = require('child_process');
    spawn(downloadedFilePath, [], { detached: true, stdio: 'ignore' }).unref();
    app.quit();
  }
});

// Background removal - not supported
ipcMain.handle('remove-background', async () => {
  return { success: false, error: 'Background removal not available in desktop app.', notSupported: true };
});

// ============================================
// PROTECTED FEATURES - REQUIRE LICENSE
// ============================================

// Check if action is allowed (for renderer to verify before actions)
ipcMain.handle('check-feature-access', async (event, feature) => {
  if (!isLicenseValid) {
    return { allowed: false, error: 'LICENSE_REQUIRED' };
  }
  return { allowed: true };
});

// Periodic license re-verification (called from renderer)
ipcMain.handle('verify-license-state', async () => {
  // Re-check license from file to ensure it wasn't tampered
  const machineId = cachedMachineId || getHardwareMachineId();
  if (!machineId) {
    isLicenseValid = false;
    return { valid: false };
  }

  const storedLicense = loadLicenseFromFile(machineId);
  if (!storedLicense || !storedLicense.token || !isTokenValid(storedLicense.token)) {
    isLicenseValid = false;
    return { valid: false };
  }

  // ---- NATIVE RE-VERIFICATION (additive) ----
  if (nativeLicense && nativeLicense.isAvailable()) {
    try {
      if (!nativeLicense.verifyMachineIdMatch(machineId)) {
        isLicenseValid = false;
        return { valid: false, error: 'native_hwid_mismatch' };
      }
      if (storedLicense && storedLicense.token) {
        const nativeCheck = nativeLicense.validateLicenseComplete(storedLicense.token, machineId);
        if (nativeCheck.nativeAvailable && !nativeCheck.valid) {
          isLicenseValid = false;
          return { valid: false, error: 'native_validation_failed' };
        }
      }
    } catch (e) {
      // Don't block on native module errors
    }
  }
  // ---- END NATIVE RE-VERIFICATION ----

  isLicenseValid = true;
  return { valid: true };
});

const http = require('http');
let transferServer = null;
let transferServerPort = 0;

function getLocalIP() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function getMobileUploadPage() {
  return `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Photo Printer Pro</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600&display=swap');
    :root {
      --background: 240 10% 3.9%;
      --foreground: 0 0% 98%;
      --card: 240 10% 3.9%;
      --card-foreground: 0 0% 98%;
      --primary: 0 0% 98%;
      --primary-foreground: 240 5.9% 10%;
      --secondary: 240 3.7% 15.9%;
      --secondary-foreground: 0 0% 98%;
      --muted: 240 3.7% 15.9%;
      --muted-foreground: 240 5% 64.9%;
      --accent: 240 3.7% 15.9%;
      --accent-foreground: 0 0% 98%;
      --destructive: 0 62.8% 30.6%;
      --destructive-foreground: 0 0% 98%;
      --border: 240 3.7% 15.9%;
      --input: 240 3.7% 15.9%;
      --radius: 0.5rem;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Kufi Arabic', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: hsl(var(--background));
      color: hsl(var(--foreground));
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 2rem 1rem;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      width: 100%;
      max-width: 28rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    
    .header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 0.5rem;
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.5rem;
      height: 3.5rem;
      border-radius: 0.75rem;
      background-color: hsl(var(--secondary));
      border: 1px solid hsl(var(--border));
      margin-bottom: 0.5rem;
    }
    .icon-container svg { width: 1.75rem; height: 1.75rem; stroke: hsl(var(--foreground)); }
    .title { font-size: 1.5rem; font-weight: 600; letter-spacing: -0.025em; }
    .subtitle { font-size: 0.875rem; color: hsl(var(--muted-foreground)); }

    .card {
      background-color: hsl(var(--card));
      border: 1px solid hsl(var(--border));
      border-radius: var(--radius);
      box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid hsl(var(--border));
    }
    .card-title { font-size: 0.875rem; font-weight: 600; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: hsl(var(--muted-foreground));
      background-color: hsl(var(--secondary));
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
    }
    .status-dot { width: 0.375rem; height: 0.375rem; background-color: #10b981; border-radius: 50%; }

    .card-content {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .upload-area {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      border: 1px dashed hsl(var(--border));
      border-radius: var(--radius);
      background-color: transparent;
      cursor: pointer;
      position: relative;
      transition: background-color 0.2s, border-color 0.2s;
      text-align: center;
    }
    .upload-area:active { background-color: hsl(var(--muted) / 0.5); }
    .upload-area input { position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%; }
    .upload-icon {
      width: 2.5rem; height: 2.5rem; color: hsl(var(--muted-foreground)); margin-bottom: 0.75rem;
    }
    .upload-text { font-size: 0.875rem; font-weight: 500; margin-bottom: 0.25rem; color: hsl(var(--foreground)); }
    .upload-subtext { font-size: 0.75rem; color: hsl(var(--muted-foreground)); }

    .preview-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem;
    }
    .preview-item {
      position: relative; aspect-ratio: 1;
      border-radius: calc(var(--radius) - 2px);
      border: 1px solid hsl(var(--border));
      overflow: hidden; background-color: hsl(var(--muted));
    }
    .preview-item img { width: 100%; height: 100%; object-fit: cover; }
    .remove-btn {
      position: absolute; top: 0.25rem; left: 0.25rem;
      width: 1.5rem; height: 1.5rem;
      background-color: hsl(var(--background) / 0.8);
      backdrop-filter: blur(4px);
      border: 1px solid hsl(var(--border));
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      color: hsl(var(--foreground)); cursor: pointer; transition: 0.2s; z-index: 10;
    }
    .remove-btn:active { background-color: hsl(var(--destructive)); color: hsl(var(--destructive-foreground)); border-color: hsl(var(--destructive)); }

    .action-bar { display: flex; gap: 0.75rem; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: calc(var(--radius) - 2px);
      font-size: 0.875rem; font-weight: 500; height: 2.5rem; padding: 0 1rem;
      transition: opacity 0.2s, background-color 0.2s;
      cursor: pointer; outline: none; border: none; white-space: nowrap;
      font-family: inherit; gap: 0.5rem;
    }
    .btn-full { flex: 1; }
    .btn:disabled { opacity: 0.5; pointer-events: none; }
    .btn-primary { background-color: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
    .btn-primary:active { opacity: 0.9; }
    .btn-outline { border: 1px solid hsl(var(--input)); background-color: transparent; color: hsl(var(--foreground)); }
    .btn-outline:active { background-color: hsl(var(--accent)); color: hsl(var(--accent-foreground)); }

    .progress-container { display: flex; flex-direction: column; gap: 0.5rem; display: none; }
    .progress-container.active { display: flex; }
    .progress-bar { width: 100%; height: 0.5rem; background-color: hsl(var(--secondary)); border-radius: 9999px; overflow: hidden; }
    .progress-fill { height: 100%; background-color: hsl(var(--primary)); width: 0%; transition: width 0.3s ease; }
    .counter { text-align: center; font-size: 0.75rem; color: hsl(var(--muted-foreground)); }

    .alert { 
      display: none; padding: 1rem; border-radius: var(--radius); border: 1px solid hsl(var(--border)); 
      background-color: hsl(var(--card)); align-items: flex-start; gap: 0.75rem; 
    }
    .alert.show { display: flex; }
    .alert-icon { color: hsl(var(--foreground)); width: 1.25rem; height: 1.25rem; flex-shrink: 0; }
    .alert-icon.success { color: #10b981; }
    .alert-icon.error { color: hsl(var(--destructive)); }
    .alert-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .alert-title { font-weight: 500; font-size: 0.875rem; line-height: 1.25rem; }
    .alert-desc { font-size: 0.875rem; line-height: 1.25rem; color: hsl(var(--muted-foreground)); }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Header -->
    <div class="header">
      <div class="icon-container">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
      </div>
      <h1 class="title">ناردنی وێنە</h1>
      <p class="subtitle">لە مۆبایلەکەتەوە وێنە بنێرە بۆ ناو بەرنامەکە</p>
    </div>

    <!-- Alert -->
    <div id="alertBox" class="alert">
      <div id="alertIcon" class="alert-icon"></div>
      <div class="alert-content">
        <div id="alertTitle" class="alert-title"></div>
        <div id="alertDesc" class="alert-desc"></div>
      </div>
    </div>

    <!-- Card -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">هەڵبژاردنی وێنەکان</h2>
        <div class="status-badge">
          <div class="status-dot"></div>
          پەیوەندیدارە
        </div>
      </div>

      <div class="card-content">
        <div class="upload-area" id="dropZone">
          <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          <div class="upload-text">لێرە دابگرە بۆ هەڵبژاردنی وێنە</div>
          <div class="upload-subtext">هەموو جۆرە وێنەیەک پشتگیری دەکرێت</div>
          <input type="file" id="fileInput" accept="image/*" multiple />
        </div>

        <div class="preview-grid" id="previewGrid" style="display:none;"></div>
        
        <div class="progress-container" id="progressContainer">
          <div class="progress-bar"><div class="progress-fill" id="progressFill"></div></div>
          <div class="counter" id="counter"></div>
        </div>

        <div class="action-bar">
          <button class="btn btn-outline" id="clearBtn" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
          <button class="btn btn-primary btn-full" id="sendBtn" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
            <span id="sendBtnText">ناردن</span>
          </button>
        </div>
      </div>
    </div>
  </div>

  <script>
    const fileInput = document.getElementById('fileInput');
    const previewGrid = document.getElementById('previewGrid');
    const sendBtn = document.getElementById('sendBtn');
    const clearBtn = document.getElementById('clearBtn');
    const sendBtnText = document.getElementById('sendBtnText');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const counter = document.getElementById('counter');
    const alertBox = document.getElementById('alertBox');
    const alertIcon = document.getElementById('alertIcon');
    const alertTitle = document.getElementById('alertTitle');
    const alertDesc = document.getElementById('alertDesc');
    
    let selectedFiles = [];
    
    fileInput.addEventListener('change', (e) => {
      Array.from(e.target.files).forEach(file => {
        if (file.type.startsWith('image/')) { selectedFiles.push(file); addPreview(file, selectedFiles.length - 1); }
      });
      updateUI(); fileInput.value = '';
    });
    
    clearBtn.addEventListener('click', () => {
      selectedFiles = [];
      previewGrid.innerHTML = '';
      updateUI();
    });

    function addPreview(file, index) {
      const div = document.createElement('div'); div.className = 'preview-item'; div.dataset.index = index;
      const img = document.createElement('img'); const url = URL.createObjectURL(file); img.src = url; img.onload = () => URL.revokeObjectURL(url);
      const removeBtn = document.createElement('button'); removeBtn.className = 'remove-btn'; 
      removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>';
      removeBtn.onclick = (e) => { e.stopPropagation(); selectedFiles[index] = null; div.remove(); updateUI(); };
      div.appendChild(img); div.appendChild(removeBtn); previewGrid.appendChild(div);
    }

    function updateUI() {
      const count = selectedFiles.filter(f => f !== null).length;
      const canSend = count > 0;
      sendBtn.disabled = !canSend;
      clearBtn.disabled = !canSend;
      previewGrid.style.display = canSend ? 'grid' : 'none';
      sendBtnText.textContent = canSend ? 'ناردنی ' + count + ' وێنە' : 'ناردن';
      alertBox.className = 'alert';
    }

    function showAlert(type, title, desc) {
      alertBox.className = 'alert show';
      alertTitle.textContent = title;
      alertDesc.textContent = desc;
      if (type === 'success') {
        alertIcon.className = 'alert-icon success';
        alertIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';
      } else {
        alertIcon.className = 'alert-icon error';
        alertIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>';
      }
    }

    sendBtn.addEventListener('click', async () => {
      const validFiles = selectedFiles.filter(f => f !== null);
      if (validFiles.length === 0) return;
      
      sendBtn.disabled = true; clearBtn.disabled = true;
      progressContainer.classList.add('active');
      alertBox.className = 'alert';
      
      let sent = 0;
      for (const file of validFiles) {
        try {
          const formData = new FormData(); formData.append('photo', file);
          const resp = await fetch('/upload', { method: 'POST', body: formData });
          if (resp.ok) sent++;
          progressFill.style.width = Math.round((sent / validFiles.length) * 100) + '%';
          counter.textContent = sent + ' / ' + validFiles.length;
        } catch (err) { console.error('Upload error:', err); }
      }
      
      if (sent > 0) {
        showAlert('success', 'سەرکەوتوو بوو', sent + ' وێنە بە سەرکەوتوویی نێردرا بۆ بەرنامەکە.');
        selectedFiles = []; previewGrid.innerHTML = '';
      } else {
        showAlert('error', 'هەڵە ڕوویدا', 'نەتوانرا وێنەکان بنێردرێت.');
      }
      
      setTimeout(() => {
        updateUI();
        progressContainer.classList.remove('active'); progressFill.style.width = '0%';
        counter.textContent = '';
      }, 3000);
    });
  </script>
</body>
</html>`;
}

function createTransferServer(mode, savePath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(getMobileUploadPage());
        return;
      }
      if (req.method === 'POST' && req.url === '/upload') {
        const chunks = []; let totalSize = 0;
        const MAX_SIZE = 50 * 1024 * 1024;
        req.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > MAX_SIZE) { res.writeHead(413, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'File too large' })); req.destroy(); return; }
          chunks.push(chunk);
        });
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            const contentType = req.headers['content-type'] || '';
            if (contentType.includes('multipart/form-data')) {
              const boundary = contentType.split('boundary=')[1];
              if (!boundary) { res.writeHead(400); res.end(JSON.stringify({ error: 'No boundary' })); return; }
              const parts = parseMultipart(body, boundary);
              if (parts.length > 0) {
                const part = parts[0];
                const fileName = part.filename || 'photo_' + Date.now() + '.jpg';
                if (mode === 'folder' && savePath) {
                  const fs = require('fs');
                  const path = require('path');
                  fs.writeFileSync(path.join(savePath, fileName), part.data);
                  if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('wireless-photo-received', { name: fileName, folder: true });
                  }
                } else {
                  const base64 = part.data.toString('base64');
                  const mimeType = part.contentType || 'image/jpeg';
                  const dataUrl = 'data:' + mimeType + ';base64,' + base64;
                  if (mainWindow && mainWindow.webContents) {
                    mainWindow.webContents.send('wireless-photo-received', { src: dataUrl, name: fileName });
                  }
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, name: fileName }));
              } else { res.writeHead(400); res.end(JSON.stringify({ error: 'No file found' })); }
            } else { res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid content type' })); }
          } catch (err) { console.error('[Transfer] Upload error:', err); res.writeHead(500); res.end(JSON.stringify({ error: 'Server error' })); }
        });
        return;
      }
      res.writeHead(404); res.end('Not Found');
    });
    let port = 8847;
    const tryListen = () => {
      server.listen(port, '0.0.0.0', () => {
        transferServer = server; transferServerPort = port;
        console.log('[Transfer] Server running on port ' + port);
        resolve({ port, ip: getLocalIP() });
      });
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') { port++; if (port > 8900) reject(new Error('No available port')); else tryListen(); }
        else reject(err);
      });
    };
    tryListen();
  });
}

function parseMultipart(body, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from('--' + boundary);
  let idx = body.indexOf(boundaryBuffer, 0);
  while (idx !== -1) {
    const nextIdx = body.indexOf(boundaryBuffer, idx + boundaryBuffer.length);
    if (nextIdx === -1) break;
    const partData = body.slice(idx + boundaryBuffer.length, nextIdx);
    let partStart = 0;
    if (partData[0] === 0x0d && partData[1] === 0x0a) partStart = 2;
    const headerEnd = partData.indexOf('\r\n\r\n', partStart);
    if (headerEnd === -1) { idx = nextIdx; continue; }
    const headerStr = partData.slice(partStart, headerEnd).toString('utf8');
    let fileData = partData.slice(headerEnd + 4);
    if (fileData.length >= 2 && fileData[fileData.length - 2] === 0x0d && fileData[fileData.length - 1] === 0x0a) {
      fileData = fileData.slice(0, fileData.length - 2);
    }
    let filename = null; let ct = 'application/octet-stream';
    for (const line of headerStr.split('\r\n')) {
      if (line.toLowerCase().startsWith('content-disposition:')) { const m = line.match(/filename=\"([^\"]+)\"/i); if (m) filename = m[1]; }
      if (line.toLowerCase().startsWith('content-type:')) { ct = line.split(':')[1].trim(); }
    }
    if (filename) parts.push({ filename, contentType: ct, data: fileData });
    idx = nextIdx;
  }
  return parts;
}

function stopTransferServer() {
  return new Promise((resolve) => {
    if (transferServer) {
      transferServer.close(() => { transferServer = null; transferServerPort = 0; console.log('[Transfer] Server stopped'); resolve(true); });
    } else { resolve(true); }
  });
}

ipcMain.handle('start-transfer-server', async (event, args) => {
  try {
    const mode = args?.mode || 'app';
    const savePath = args?.savePath || '';
    if (transferServer) { return { success: true, ip: getLocalIP(), port: transferServerPort }; }
    const result = await createTransferServer(mode, savePath);
    return { success: true, ip: result.ip, port: result.port };
  } catch (err) {
    console.error('[Transfer] Failed to start server:', err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-transfer-server', async () => {
  await stopTransferServer();
  return { success: true };
});

ipcMain.handle('start-hotspot', async () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const psScript = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
      function Await($WinRtTask, $ResultType) {
          $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
          $netTask = $asTask.Invoke($null, @($WinRtTask))
          $netTask.Wait(-1) | Out-Null
          $netTask.Result
      }
      [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime] | Out-Null
      $connectionProfile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
      if ($connectionProfile -eq $null) {
          $profiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
          foreach ($p in $profiles) {
              if ($p.IsWlanConnectionProfile) {
                  $connectionProfile = $p
                  break
              }
          }
      }
      if ($connectionProfile -eq $null) { Write-Host "ERROR:NO_PROFILE"; exit 1 }
      try {
          $tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($connectionProfile)
          $config = $tetheringManager.GetCurrentAccessPointConfiguration()
          $startResult = Await $tetheringManager.StartTetheringAsync() ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
          Start-Sleep -Seconds 3
          $hotspotIP = "Unknown"
          $adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like '*Local Area Connection*' -or $_.InterfaceAlias -like '*Hotspot*' -or $_.InterfaceAlias -match 'Direct' }
          foreach ($adapter in $adapters) {
              if ($adapter.IPAddress -like '192.168.137.*') {
                  $hotspotIP = $adapter.IPAddress
              }
          }
          Write-Host "SUCCESS:SSID:$($config.Ssid)|PASS:$($config.Passphrase)|IP:$hotspotIP"
      } catch {
          Write-Host "ERROR:$($_.Exception.Message)"
      }
    `;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -ExecutionPolicy Bypass -NoProfile -EncodedCommand ${encoded}`, (error, stdout, stderr) => {
      const output = stdout.toString().trim();
      if (output.includes("SUCCESS:")) {
        const parts = output.replace("SUCCESS:", "").split("|");
        const data = {};
        parts.forEach(p => {
          const [k, v] = p.split(":");
          if (k === 'SSID') data.ssid = v;
          if (k === 'PASS') data.passphrase = v;
          if (k === 'IP') data.ip = v;
        });
        resolve({ success: true, ...data });
      } else {
        resolve({ success: false, error: output || stderr || (error && error.message) || 'Unknown error' });
      }
    });
  });
});

ipcMain.handle('stop-hotspot', async () => {
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    const psScript = `
      Add-Type -AssemblyName System.Runtime.WindowsRuntime
      $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation\`1' })[0]
      function Await($WinRtTask, $ResultType) {
          $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
          $netTask = $asTask.Invoke($null, @($WinRtTask))
          $netTask.Wait(-1) | Out-Null
          $netTask.Result
      }
      [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType = WindowsRuntime] | Out-Null
      $connectionProfile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
      if ($connectionProfile -eq $null) {
          $profiles = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()
          foreach ($p in $profiles) {
              if ($p.IsWlanConnectionProfile) {
                  $connectionProfile = $p
                  break
              }
          }
      }
      if ($connectionProfile -ne $null) {
          $tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($connectionProfile)
          Await $tetheringManager.StopTetheringAsync() ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult])
      }
      Write-Host "STOPPED"
    `;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    exec(`powershell -ExecutionPolicy Bypass -NoProfile -EncodedCommand ${encoded}`, () => {
      resolve({ success: true });
    });
  });
});

ipcMain.handle('select-folder', async () => {
  const { dialog } = require('electron');
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0] || null;
});

ipcMain.handle('get-local-ip', () => {
  return { ip: getLocalIP(), port: transferServerPort };
});

// ============================================
// APP LIFECYCLE
// ============================================

app.on('open-file', (event, filePath) => {
  event.preventDefault();
  if (mainWindow) openProjectFile(filePath);
  else fileToOpen = filePath;
});

// MIME type lookup for custom protocol
function getProtocolMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
    '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.ttf': 'font/ttf', '.otf': 'font/otf', '.wasm': 'application/wasm',
    '.map': 'application/json', '.txt': 'text/plain',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Allow multiple instances of the app
app.whenReady().then(() => {
  // Register pppro:// protocol — decrypts encrypted assets, serves others directly
  // Without the native .node binary, no JS/CSS/HTML can be decrypted = app is useless
  if (!isDev) {
    protocol.handle('pppro', async (request) => {
      try {
        const url = new URL(request.url);
        let relPath = decodeURIComponent(url.pathname);
        if (relPath.startsWith('/')) relPath = relPath.substring(1);
        
        // Build the file path inside dist/
        let filePath = path.join(__dirname, 'dist', relPath);
        
        // Check for encrypted version (.enc) — requires native module to decrypt
        let encPath = filePath + '.enc';
        if (__dirname.includes('app.asar')) {
          encPath = encPath.replace('app.asar', 'app.asar.unpacked');
        }
        
        if (fs.existsSync(encPath) && nativeLicense && nativeLicense.isAvailable()) {
          const decrypted = nativeLicense.decryptModule(encPath);
          return new Response(decrypted, {
            headers: { 'Content-Type': getProtocolMimeType(filePath) }
          });
        }
        
        // Non-encrypted files (images, fonts, wasm, etc.) — serve from ASAR
        if (fs.existsSync(filePath)) {
          const data = fs.readFileSync(filePath);
          return new Response(data, {
            headers: { 'Content-Type': getProtocolMimeType(filePath) }
          });
        }
        
        return new Response('Not found', { status: 404 });
      } catch (e) {
        console.error('[pppro protocol] Error:', e.message);
        return new Response('Server error', { status: 500 });
      }
    });
  }

  const argv = process.argv;
  const filePath = argv.find((arg) => arg.endsWith('.pppro'));
  if (filePath) fileToOpen = filePath;
  createWindow();
});

app.on('window-all-closed', async () => {
  trialManager.stopSession();
  await stopHeartbeat();
  await stopTransferServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  trialManager.stopSession();
  await stopHeartbeat();
  await stopTransferServer();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
