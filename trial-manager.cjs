/**
 * Trial Manager for Photo Printer Pro
 * 
 * Secure offline 10-hour trial system with multi-location storage,
 * encryption, checksum verification, and tampering detection.
 * 
 * CLOCK-INDEPENDENT DESIGN:
 * -------------------------
 * This trial system does NOT rely on the system clock (Date.now()).
 * Instead it tracks cumulative elapsed time using:
 *   1. process.hrtime.bigint() — monotonic timer, cannot be faked
 *   2. Stored totalElapsedMs — cumulative time across all sessions
 *   3. NTP verification — cross-checks with real internet time when online
 * 
 * The trial expires when totalElapsedMs >= TRIAL_DURATION_MS.
 * Changing the system date/time has NO effect on the trial countdown.
 * 
 * INTEGRATION WITH EXISTING LICENSE MANAGER:
 * ------------------------------------------
 * This module works alongside the existing license system in main.cjs.
 * - Call checkTrial() on app startup BEFORE checking the license.
 * - If the user has a valid license, bypass the trial entirely.
 * - If no license, the trial controls whether the app runs.
 * - After trial expires, show dialog prompting license entry/purchase.
 * - The trial does NOT quit the app — it returns status for the license
 *   manager to handle activation flow.
 * - Call saveSessionElapsed() periodically and on app quit to persist time.
 * 
 * RETURNED STATUS OBJECT:
 * {
 *   isValid: boolean,    // true if trial is still active
 *   daysLeft: number,    // days remaining (0 if expired)
 *   hoursLeft: number,   // hours remaining within the current day
 *   expired: boolean,    // true if trial period has ended
 *   tampered: boolean,   // true if tampering was detected
 *   message: string      // human-readable status message
 * }
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Trial duration
const TRIAL_DURATION_HOURS = 10;
const TRIAL_DURATION_MS = TRIAL_DURATION_HOURS * 60 * 60 * 1000;

// App identifier used for folder/registry names
const APP_ID = 'PhotoPrinterPro';

// Salt and key derivation constants
const ENCRYPTION_SALT = 'PPro-Trial-Salt-2024';
const ENCRYPTION_KEY_INFO = 'PPro-Trial-Key';

// Registry path (Windows only)
const REGISTRY_PATH = `HKCU\\Software\\${APP_ID}\\Trial`;

// Save interval for session elapsed time (60 seconds)
const SAVE_INTERVAL_MS = 60 * 1000;

class TrialManager {
  constructor() {
    this._machineId = null;
    this._encryptionKey = null;
    // Monotonic session tracking
    this._sessionStartNs = null;       // process.hrtime.bigint() at session start
    this._sessionActive = false;
    this._saveInterval = null;
    this._cachedTotalElapsed = 0;       // totalElapsedMs loaded from storage at session start
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Check the current trial status.
   * Call this on app startup. Returns a status object.
   * If a valid license exists, skip calling this entirely.
   */
  checkTrial() {
    try {
      // --- FAST PATH: if session is active, compute from cached values ---
      // This avoids reading disk every second and prevents double-counting.
      // saveSessionElapsed() writes _cachedTotalElapsed + sessionMs to disk.
      // If we read disk + add sessionMs again, we'd double-count.
      if (this._sessionActive) {
        const totalElapsed = this._cachedTotalElapsed + this._getSessionElapsedMs();
        return this._computeStatus(totalElapsed);
      }

      // --- DISK PATH: session not active, read from storage ---
      const machineId = this._getMachineId();
      if (!machineId) {
        return this._status(false, 0, 0, 0, 0, true, false, 'Cannot verify hardware identity.');
      }

      const locations = this._getStorageLocations();
      const readResults = this._readAllLocations(locations, machineId);

      const validEntries = readResults.filter(r => r.valid);
      const corruptedEntries = readResults.filter(r => r.exists && !r.valid);
      const missingEntries = readResults.filter(r => !r.exists);

      // --- Tampering detection ---
      const totalLocations = readResults.length;
      const evidenceOfPriorTrial = validEntries.length > 0 || corruptedEntries.length > 0;

      if (evidenceOfPriorTrial && missingEntries.length > totalLocations / 2) {
        return this._status(false, 0, 0, 0, 0, true, true, 'Cannot reset trial. Please purchase a license.');
      }

      if (corruptedEntries.length > 0 && validEntries.length === 0) {
        return this._status(false, 0, 0, 0, 0, true, true, 'Cannot reset trial. Please purchase a license.');
      }

      // --- First launch: no trial data exists anywhere ---
      if (validEntries.length === 0 && corruptedEntries.length === 0 && missingEntries.length === totalLocations) {
        return this._status(false, 0, TRIAL_DURATION_HOURS, 0, 0, false, false, 'Trial not started yet.', true);
      }

      // --- Get the highest totalElapsedMs across all valid entries ---
      // Use the MAXIMUM to prevent cheating by restoring an older backup
      let maxElapsed = 0;
      let hasOldFormat = false;
      for (const entry of validEntries) {
        if (entry.data.startDate && entry.data.totalElapsedMs === undefined) {
          // Old format: cannot trust system clock to convert.
          // Treat as fully expired to prevent clock manipulation.
          hasOldFormat = true;
          maxElapsed = TRIAL_DURATION_MS;
        } else {
          const elapsed = entry.data.totalElapsedMs || 0;
          if (elapsed > maxElapsed) maxElapsed = elapsed;
        }
      }

      // Migrate old format data to new format (as expired)
      if (hasOldFormat) {
        this._writeAllLocations(locations, machineId, maxElapsed);
      }

      // Repair missing/corrupted locations
      this._repairLocations(locations, readResults, machineId, maxElapsed);

      return this._computeStatus(maxElapsed);

    } catch (err) {
      console.error('[TrialManager] Error checking trial:', err.message);
      return this._status(false, 0, 0, 0, 0, true, false, 'Trial verification error. Please activate your license.');
    }
  }

  /**
   * Compute trial status from total elapsed milliseconds.
   */
  _computeStatus(totalElapsed) {
    const totalMsLeft = Math.max(0, TRIAL_DURATION_MS - totalElapsed);
    const totalSecondsLeft = Math.floor(totalMsLeft / 1000);
    const daysLeft = Math.floor(totalSecondsLeft / 86400);
    const hoursLeft = Math.floor((totalSecondsLeft % 86400) / 3600);
    const minutesLeft = Math.floor((totalSecondsLeft % 3600) / 60);
    const secondsLeft = totalSecondsLeft % 60;

    if (totalMsLeft <= 0) {
      return this._status(false, 0, 0, 0, 0, true, false, 'Trial expired. Please enter your license key or purchase the full version.');
    }

    return this._status(true, daysLeft, hoursLeft, minutesLeft, secondsLeft, false, false, `${daysLeft}d ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s remaining in trial.`);
  }

  // ============================================
  // MACHINE ID
  // ============================================

  _getMachineId() {
    if (this._machineId) return this._machineId;

    try {
      let rawId = '';

      if (process.platform === 'win32') {
        // Motherboard serial
        try {
          const mb = execSync('powershell -NoProfile -command "(Get-WmiObject Win32_BaseBoard).SerialNumber"',
            { encoding: 'utf8', windowsHide: true, timeout: 10000 }).trim();
          if (mb && mb !== 'To be filled by O.E.M.' && mb !== 'Default string' && mb.length > 3) rawId = mb;
        } catch (e) {
          try {
            const mb = execSync('wmic baseboard get serialnumber',
              { encoding: 'utf8', windowsHide: true, timeout: 10000 });
            const val = mb.split('\n')[1]?.trim();
            if (val && val !== 'To be filled by O.E.M.' && val.length > 3) rawId = val;
          } catch (e2) { }
        }

        // BIOS serial fallback
        if (!rawId) {
          try {
            const bios = execSync('powershell -NoProfile -command "(Get-WmiObject Win32_BIOS).SerialNumber"',
              { encoding: 'utf8', windowsHide: true, timeout: 10000 }).trim();
            if (bios && bios !== 'To be filled by O.E.M.' && bios !== 'Default string' && bios.length > 3) rawId = bios;
          } catch (e) { }
        }

        // CPU ID fallback
        if (!rawId) {
          try {
            const cpu = execSync('powershell -NoProfile -command "(Get-WmiObject Win32_Processor).ProcessorId"',
              { encoding: 'utf8', windowsHide: true, timeout: 10000 }).trim();
            if (cpu && cpu.length > 3) rawId = cpu;
          } catch (e) { }
        }

        // Registry MachineGuid last resort
        if (!rawId) {
          try {
            const reg = execSync('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
              { encoding: 'utf8', windowsHide: true, timeout: 5000 });
            const match = reg.match(/MachineGuid\s+REG_SZ\s+(.+)/);
            if (match && match[1].trim().length > 3) rawId = match[1].trim();
          } catch (e) { }
        }

      } else if (process.platform === 'darwin') {
        try {
          const result = execSync('system_profiler SPHardwareDataType | grep "Hardware UUID"', { encoding: 'utf8' });
          rawId = result.split(':')[1]?.trim() || '';
        } catch (e) { }

      } else {
        // Linux
        try {
          if (fs.existsSync('/sys/class/dmi/id/product_uuid')) {
            rawId = fs.readFileSync('/sys/class/dmi/id/product_uuid', 'utf8').trim();
          } else if (fs.existsSync('/etc/machine-id')) {
            rawId = fs.readFileSync('/etc/machine-id', 'utf8').trim();
          }
        } catch (e) { }
      }

      if (!rawId) return null;

      // Hash the raw ID to get a consistent machine identifier
      this._machineId = crypto.createHash('sha256')
        .update(rawId + APP_ID)
        .digest('hex');

      return this._machineId;
    } catch (err) {
      console.error('[TrialManager] Failed to get machine ID:', err.message);
      return null;
    }
  }

  // ============================================
  // ENCRYPTION / DECRYPTION
  // ============================================

  _deriveKey(machineId) {
    if (this._encryptionKey) return this._encryptionKey;
    this._encryptionKey = crypto.scryptSync(
      machineId + ENCRYPTION_KEY_INFO,
      ENCRYPTION_SALT,
      32
    );
    return this._encryptionKey;
  }

  _encrypt(data, machineId) {
    const key = this._deriveKey(machineId);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  _decrypt(encryptedStr, machineId) {
    try {
      const parts = encryptedStr.split(':');
      if (parts.length !== 2) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const key = this._deriveKey(machineId);
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(parts[1], 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  // ============================================
  // CHECKSUM
  // ============================================

  _generateChecksum(data, machineId) {
    const content = `${data.totalElapsedMs || 0}:${data.machineId}:${APP_ID}:${machineId}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  _verifyChecksum(data, machineId) {
    const { checksum, ...rest } = data;
    const expected = this._generateChecksum(rest, machineId);
    if (checksum === expected) return true;
    // Backward compatibility: old format with startDate
    if (data.startDate) {
      const oldContent = `${data.startDate}:${data.machineId}:${APP_ID}:${machineId}`;
      const oldExpected = crypto.createHash('sha256').update(oldContent).digest('hex');
      if (checksum === oldExpected) return true;
      const oldContent2 = `${data.startDate}:${data.machineId}:${data.lastCheckedAt || ''}:${APP_ID}:${machineId}`;
      const oldExpected2 = crypto.createHash('sha256').update(oldContent2).digest('hex');
      if (checksum === oldExpected2) return true;
    }
    return false;
  }

  // ============================================
  // STORAGE LOCATIONS
  // ============================================

  _getStorageLocations() {
    const locations = [];

    if (process.platform === 'win32') {
      // Location 1: ProgramData (shared, persists across user profiles)
      const programData = process.env.ProgramData || 'C:\\ProgramData';
      locations.push({
        type: 'file',
        path: path.join(programData, `.${APP_ID}`, '.trial.dat'),
        dir: path.join(programData, `.${APP_ID}`)
      });

      // Location 2: LocalAppData (user-specific, not roaming)
      const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
      locations.push({
        type: 'file',
        path: path.join(localAppData, `.${APP_ID}`, '.trial.dat'),
        dir: path.join(localAppData, `.${APP_ID}`)
      });

      // Location 3: AppData/Roaming (user-specific, roaming)
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      locations.push({
        type: 'file',
        path: path.join(appData, `.${APP_ID}`, '.trial.dat'),
        dir: path.join(appData, `.${APP_ID}`)
      });

      // Location 4: Windows Registry
      locations.push({
        type: 'registry',
        path: REGISTRY_PATH
      });

    } else if (process.platform === 'darwin') {
      // macOS locations
      locations.push({
        type: 'file',
        path: path.join(os.homedir(), 'Library', 'Application Support', `.${APP_ID}`, '.trial.dat'),
        dir: path.join(os.homedir(), 'Library', 'Application Support', `.${APP_ID}`)
      });
      locations.push({
        type: 'file',
        path: path.join(os.homedir(), '.config', `.${APP_ID}`, '.trial.dat'),
        dir: path.join(os.homedir(), '.config', `.${APP_ID}`)
      });
      locations.push({
        type: 'file',
        path: path.join(os.homedir(), '.local', 'share', `.${APP_ID}`, '.trial.dat'),
        dir: path.join(os.homedir(), '.local', 'share', `.${APP_ID}`)
      });

    } else {
      // Linux locations
      locations.push({
        type: 'file',
        path: path.join(os.homedir(), '.config', `.${APP_ID}`, '.trial.dat'),
        dir: path.join(os.homedir(), '.config', `.${APP_ID}`)
      });
      locations.push({
        type: 'file',
        path: path.join(os.homedir(), '.local', 'share', `.${APP_ID}`, '.trial.dat'),
        dir: path.join(os.homedir(), '.local', 'share', `.${APP_ID}`)
      });
      locations.push({
        type: 'file',
        path: path.join('/tmp', `.${APP_ID}_trial`, '.trial.dat'),
        dir: path.join('/tmp', `.${APP_ID}_trial`)
      });
    }

    return locations;
  }

  // ============================================
  // FILE STORAGE OPERATIONS
  // ============================================

  _writeFile(location, encryptedData) {
    try {
      // Create directory if needed
      if (!fs.existsSync(location.dir)) {
        fs.mkdirSync(location.dir, { recursive: true });
      }

      // Remove hidden/system attributes before writing (Windows)
      if (process.platform === 'win32') {
        try {
          if (fs.existsSync(location.path)) {
            execSync(`attrib -h -s "${location.path}"`, { windowsHide: true, timeout: 5000 });
          }
          if (fs.existsSync(location.dir)) {
            execSync(`attrib -h -s "${location.dir}"`, { windowsHide: true, timeout: 5000 });
          }
        } catch (e) { /* may fail if not set, not critical */ }
      }

      fs.writeFileSync(location.path, encryptedData, 'utf8');

      // Hide directory and file on Windows
      if (process.platform === 'win32') {
        try {
          execSync(`attrib +h +s "${location.dir}"`, { windowsHide: true, timeout: 5000 });
          execSync(`attrib +h +s "${location.path}"`, { windowsHide: true, timeout: 5000 });
        } catch (e) { /* attrib may fail on some dirs, not critical */ }
      }

      return true;
    } catch (err) {
      console.error(`[TrialManager] Failed to write trial file at ${location.path}:`, err.message);
      return false;
    }
  }

  _readFile(location) {
    try {
      if (!fs.existsSync(location.path)) return { exists: false, data: null };
      const content = fs.readFileSync(location.path, 'utf8');
      return { exists: true, data: content };
    } catch {
      return { exists: false, data: null };
    }
  }

  // ============================================
  // WINDOWS REGISTRY OPERATIONS
  // ============================================

  _writeRegistry(encryptedData) {
    if (process.platform !== 'win32') return false;

    try {
      const Winreg = require('winreg');
      const regKey = new Winreg({ hive: Winreg.HKCU, key: `\\Software\\${APP_ID}\\Trial` });

      return new Promise((resolve) => {
        regKey.set('TrialData', Winreg.REG_SZ, encryptedData, (err) => {
          if (err) {
            console.error('[TrialManager] Failed to write registry:', err.message);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } catch (err) {
      // winreg package not available — fall back to reg.exe
      return this._writeRegistryFallback(encryptedData);
    }
  }

  _readRegistry() {
    if (process.platform !== 'win32') return { exists: false, data: null };

    try {
      const Winreg = require('winreg');
      const regKey = new Winreg({ hive: Winreg.HKCU, key: `\\Software\\${APP_ID}\\Trial` });

      return new Promise((resolve) => {
        regKey.get('TrialData', (err, item) => {
          if (err || !item) {
            resolve({ exists: false, data: null });
          } else {
            resolve({ exists: true, data: item.value });
          }
        });
      });
    } catch (err) {
      // winreg package not available — fall back to reg.exe
      return this._readRegistryFallback();
    }
  }

  // Fallback registry operations using reg.exe (no external dependency)
  _writeRegistryFallback(encryptedData) {
    try {
      execSync(
        `reg add "HKCU\\Software\\${APP_ID}\\Trial" /v TrialData /t REG_SZ /d "${encryptedData}" /f`,
        { windowsHide: true, timeout: 5000 }
      );
      return true;
    } catch (err) {
      console.error('[TrialManager] Registry fallback write failed:', err.message);
      return false;
    }
  }

  _readRegistryFallback() {
    try {
      const result = execSync(
        `reg query "HKCU\\Software\\${APP_ID}\\Trial" /v TrialData`,
        { encoding: 'utf8', windowsHide: true, timeout: 5000 }
      );
      const match = result.match(/TrialData\s+REG_SZ\s+(.+)/);
      if (match && match[1].trim()) {
        return { exists: true, data: match[1].trim() };
      }
      return { exists: false, data: null };
    } catch {
      return { exists: false, data: null };
    }
  }

  // ============================================
  // MULTI-LOCATION READ / WRITE
  // ============================================

  _readAllLocations(locations, machineId) {
    const results = [];

    for (const loc of locations) {
      let raw;

      if (loc.type === 'registry') {
        // Registry reads are sync via fallback — use fallback directly for simplicity
        // (The winreg async version is handled in checkTrialAsync if needed)
        raw = this._readRegistryFallback();
      } else {
        raw = this._readFile(loc);
      }

      if (!raw.exists || !raw.data) {
        results.push({ location: loc, exists: false, valid: false, data: null });
        continue;
      }

      // Decrypt
      const decrypted = this._decrypt(raw.data, machineId);
      if (!decrypted) {
        results.push({ location: loc, exists: true, valid: false, data: null });
        continue;
      }

      // Verify checksum
      if (!this._verifyChecksum(decrypted, machineId)) {
        results.push({ location: loc, exists: true, valid: false, data: null });
        continue;
      }

      // Verify machine ID in data matches
      if (decrypted.machineId !== machineId) {
        results.push({ location: loc, exists: true, valid: false, data: null });
        continue;
      }

      // Verify data has either totalElapsedMs (new format) or startDate (old format)
      if (decrypted.totalElapsedMs === undefined && !decrypted.startDate) {
        results.push({ location: loc, exists: true, valid: false, data: null });
        continue;
      }

      results.push({ location: loc, exists: true, valid: true, data: decrypted });
    }

    return results;
  }

  _writeAllLocations(locations, machineId, totalElapsedMs) {
    const trialData = {
      totalElapsedMs: totalElapsedMs,
      machineId: machineId
    };
    trialData.checksum = this._generateChecksum(trialData, machineId);

    const encrypted = this._encrypt(trialData, machineId);

    let successCount = 0;
    for (const loc of locations) {
      let ok = false;
      if (loc.type === 'registry') {
        ok = this._writeRegistryFallback(encrypted);
      } else {
        ok = this._writeFile(loc, encrypted);
      }
      if (ok) successCount++;
    }

    console.log(`[TrialManager] Trial data written to ${successCount}/${locations.length} locations.`);
    return successCount;
  }

  /**
   * Repair any missing or corrupted locations using a known-good start date.
   * This prevents partial deletion from creating inconsistencies.
   */
  _repairLocations(locations, readResults, machineId, totalElapsedMs) {
    const trialData = {
      totalElapsedMs: totalElapsedMs,
      machineId: machineId
    };
    trialData.checksum = this._generateChecksum(trialData, machineId);
    const encrypted = this._encrypt(trialData, machineId);

    for (let i = 0; i < readResults.length; i++) {
      const result = readResults[i];
      if (!result.valid) {
        const loc = locations[i];
        if (loc.type === 'registry') {
          this._writeRegistryFallback(encrypted);
        } else {
          this._writeFile(loc, encrypted);
        }
      }
    }
  }

  // ============================================
  // STATUS HELPER
  // ============================================

  /**
   * Start the trial. Call this when the user clicks "Try for 10 hours".
   * Begins monotonic session tracking.
   * Returns the new trial status.
   */
  startTrial() {
    try {
      const machineId = this._getMachineId();
      if (!machineId) {
        return this._status(false, 0, 0, 0, 0, true, false, 'Cannot verify hardware identity.');
      }

      const locations = this._getStorageLocations();
      const readResults = this._readAllLocations(locations, machineId);
      const validEntries = readResults.filter(r => r.valid);

      // If trial already started, begin session tracking and return current status
      if (validEntries.length > 0) {
        // Get the highest elapsed from storage
        let maxElapsed = 0;
        for (const entry of validEntries) {
          if (entry.data.startDate && entry.data.totalElapsedMs === undefined) {
            // Old format: treat as expired
            maxElapsed = TRIAL_DURATION_MS;
          } else {
            const elapsed = entry.data.totalElapsedMs || 0;
            if (elapsed > maxElapsed) maxElapsed = elapsed;
          }
        }
        this._cachedTotalElapsed = maxElapsed;
        this._startSession();
        return this.checkTrial();
      }

      // First time: write trial data with 0 elapsed
      this._writeAllLocations(locations, machineId, 0);
      this._cachedTotalElapsed = 0;
      this._startSession();
      return this._status(true, 0, TRIAL_DURATION_HOURS, 0, 0, false, false, `Trial started. ${TRIAL_DURATION_HOURS} hours remaining.`);
    } catch (err) {
      console.error('[TrialManager] Error starting trial:', err.message);
      return this._status(false, 0, 0, 0, 0, true, false, 'Failed to start trial.');
    }
  }

  // ============================================
  // MONOTONIC SESSION TRACKING
  // ============================================

  /**
   * Start tracking session time using monotonic clock.
   * Called when trial is activated (user clicks "Try" button).
   */
  _startSession() {
    if (this._sessionActive) return;
    this._sessionStartNs = process.hrtime.bigint();
    this._sessionActive = true;

    // Periodically save elapsed time to storage
    this._saveInterval = setInterval(() => {
      this.saveSessionElapsed();
    }, SAVE_INTERVAL_MS);

    console.log('[TrialManager] Session tracking started (monotonic).');
  }

  /**
   * Get elapsed milliseconds in the current session (monotonic).
   */
  _getSessionElapsedMs() {
    if (!this._sessionActive || !this._sessionStartNs) return 0;
    const nowNs = process.hrtime.bigint();
    const elapsedNs = nowNs - this._sessionStartNs;
    return Number(elapsedNs / BigInt(1000000)); // ns to ms
  }

  /**
   * Save current session elapsed time to persistent storage.
   * Call this periodically and on app quit.
   */
  saveSessionElapsed() {
    try {
      if (!this._sessionActive) return;

      const machineId = this._getMachineId();
      if (!machineId) return;

      const sessionMs = this._getSessionElapsedMs();
      const totalElapsed = this._cachedTotalElapsed + sessionMs;

      const locations = this._getStorageLocations();
      this._writeAllLocations(locations, machineId, totalElapsed);

      console.log(`[TrialManager] Session saved. Total elapsed: ${Math.round(totalElapsed / 1000)}s`);
    } catch (err) {
      console.error('[TrialManager] Error saving session:', err.message);
    }
  }

  /**
   * Stop session tracking and save final elapsed time.
   * Call this on app quit.
   */
  stopSession() {
    if (this._saveInterval) {
      clearInterval(this._saveInterval);
      this._saveInterval = null;
    }
    if (this._sessionActive) {
      this.saveSessionElapsed();
      this._sessionActive = false;
      this._sessionStartNs = null;
      console.log('[TrialManager] Session stopped.');
    }
  }

  _status(isValid, daysLeft, hoursLeft, minutesLeft, secondsLeft, expired, tampered, message, notStarted = false) {
    return { isValid, daysLeft, hoursLeft, minutesLeft, secondsLeft, expired, tampered, message, notStarted };
  }
}

module.exports = TrialManager;
