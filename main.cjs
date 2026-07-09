const { app, BrowserWindow, ipcMain, dialog, screen, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { execSync, exec } = require('child_process');
const https = require('https');

// Enable SharedArrayBuffer for WASM threading
app.commandLine.appendSwitch('enable-features', 'SharedArrayBuffer');

const isDev = !require('electron').app.isPackaged;
let mainWindow;
let fileToOpen = null;

// On Windows, double-clicking a .ppfree or .pppro file passes it as a command-line argument.
// We grab it here at startup, before the window is created.
const args = process.argv.slice(isDev ? 2 : 1);
const fileArg = args.find(a => a.endsWith('.ppfree') || a.endsWith('.pppro') || a.endsWith('.cyr'));
if (fileArg) {
  fileToOpen = fileArg;
}

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
    show: false,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: isDev,
      webSecurity: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(1.0);
    if (fileToOpen) {
      setTimeout(() => {
        if (fileToOpen) {
          openProjectFile(fileToOpen);
          fileToOpen = null;
        }
      }, 1000);
    }
    
    // Auto-check for updates when app starts (after 3 seconds)
    setTimeout(async () => {
      console.log('[Update] Starting auto-check for updates...');
      console.log('[Update] isDev =', isDev, ', isPackaged =', app.isPackaged);
      try {
        const release = await fetchLatestRelease();
        const latestVersion = release.tag_name.replace('v', '');
        const currentVersion = app.getVersion();
        console.log(`[Update] Current version: ${currentVersion}, Latest version: ${latestVersion}`);
        const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true }) > 0;
        
        if (isNewer && mainWindow) {
          console.log('[Update] New version available! Sending notification...');
          latestReleaseInfo = release;
          mainWindow.webContents.send('update-status', {
            status: 'available',
            version: latestVersion
          });
          mainWindow.webContents.send('update-available-toast', {
            version: latestVersion,
            message: 'نوێکردنەوەیەکی نوێ بەردەستە',
            messageEn: 'New update available'
          });
          console.log('[Update] Toast notification sent!');
        } else {
          console.log('[Update] App is up to date');
        }
      } catch (err) {
        console.log('[Update] Auto-check for updates failed:', err.message);
      }
    }, 3000);
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key === '+' || input.key === '-' || input.key === '=' || input.key === '0')) {
      event.preventDefault();
    }
  });
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
ipcMain.handle('get-app-version', () => app.getVersion());

// Settings handlers
ipcMain.handle('load-settings', () => loadSettings());
ipcMain.handle('save-settings', (event, settings) => saveSettings(settings));

// Tasks handlers
ipcMain.handle('load-tasks', () => loadTasks());
ipcMain.handle('save-tasks', (event, tasks) => saveTasks(tasks));

// Project file handling
let currentProjectPath = null;

// Returns any file that was opened via double-click / file association before the window was ready
ipcMain.handle('get-pending-file', () => {
  if (fileToOpen && fs.existsSync(fileToOpen)) {
    try {
      const content = fs.readFileSync(fileToOpen, 'utf-8');
      const filePath = fileToOpen;
      currentProjectPath = filePath;
      fileToOpen = null;
      return { success: true, content, filePath };
    } catch (err) {
      fileToOpen = null;
      return { success: false, error: err.message };
    }
  }
  return { success: false };
});

ipcMain.handle('save-project', async (event, { content, filePath }) => {
  try {
    const tempPath = filePath + '.tmp';
    const backupPath = filePath + '.backup';
    
    await fs.promises.writeFile(tempPath, content, 'utf-8');
    
    if (fs.existsSync(filePath)) {
      try {
        await fs.promises.copyFile(filePath, backupPath);
      } catch (backupErr) {
        console.warn('Could not create backup:', backupErr);
      }
    }
    
    await fs.promises.rename(tempPath, filePath);
    
    if (fs.existsSync(backupPath)) {
      try {
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
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-project-as', async (event, { content, defaultName }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Project As',
      defaultPath: defaultName || 'project.cyr',
      filters: [{ name: 'Cyber Report Project', extensions: ['cyr'] }]
    });

    if (result.canceled || !result.filePath) return { success: false, canceled: true };

    const tempPath = result.filePath + '.tmp';
    await fs.promises.writeFile(tempPath, content, 'utf-8');
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
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Project',
      filters: [
        { name: 'Cyber Report Projects (*.cyr, *.ppfree, *.pppro)', extensions: ['cyr', 'ppfree', 'pppro'] },
        { name: 'Cyber Report Project (*.cyr)', extensions: ['cyr'] },
        { name: 'Legacy Projects (*.ppfree, *.pppro)', extensions: ['ppfree', 'pppro'] }
      ],
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

function openProjectFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    currentProjectPath = filePath;
    if (mainWindow) {
      mainWindow.webContents.send('open-project-encrypted', { content, filePath });
    }
  } catch (err) {
    console.error('Failed to read project file', err);
  }
}

// ============================================
// AUTO UPDATER
// ============================================

const GITHUB_OWNER = 'Azhersallah';
const GITHUB_REPO = 'Cyber_Report';
let latestReleaseInfo = null;

async function fetchLatestRelease() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      method: 'GET',
      headers: { 'User-Agent': 'Photo-Printer-Free-Updater', 'Accept': 'application/vnd.github.v3+json' }
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

ipcMain.handle('check-for-updates', async () => {
  try {
    const release = await fetchLatestRelease();
    latestReleaseInfo = release;

    const latestVersion = release.tag_name.replace('v', '');
    const currentVersion = app.getVersion();
    const isNewer = latestVersion.localeCompare(currentVersion, undefined, { numeric: true }) > 0;

    if (isNewer) {
      // Notify the renderer that an update is available
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'available',
          version: latestVersion
        });
        
        // Send toast notification for update availability
        mainWindow.webContents.send('update-available-toast', {
          version: latestVersion,
          message: 'نوێکردنەوەیەکی نوێ بەردەستە',
          messageEn: 'New update available'
        });
      }
      return { success: true, updateAvailable: true, version: latestVersion };
    } else {
      // Notify the renderer that the app is up to date
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'not-available',
          version: currentVersion
        });
      }
      return { success: true, updateAvailable: false, version: currentVersion };
    }
  } catch (error) {
    // Notify the renderer of the error
    if (mainWindow) {
      mainWindow.webContents.send('update-status', {
        status: 'error',
        error: error.message
      });
    }
    return { success: false, error: error.message };
  }
});

let downloadedInstallerPath = null;

function downloadFileWithRedirects(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    let receivedBytes = 0;
    let totalBytes = 0;
    let startTime = Date.now();

    function get(requestUrl) {
      const parsedUrl = new URL(requestUrl);
      const req = https.get({
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        headers: { 'User-Agent': 'Photo-Printer-Free-Updater' }
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) {
          // Follow redirect
          get(res.headers.location);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Server returned status code ${res.statusCode}`));
          return;
        }

        totalBytes = parseInt(res.headers['content-length'], 10) || 0;
        const file = fs.createWriteStream(destPath);
        res.pipe(file);

        res.on('data', (chunk) => {
          receivedBytes += chunk.length;
          if (totalBytes > 0) {
            const percent = Math.round((receivedBytes / totalBytes) * 100);
            const elapsed = (Date.now() - startTime) / 1000;
            const speedBytes = elapsed > 0 ? (receivedBytes / elapsed) : 0;
            let speed = '';
            if (speedBytes > 1024 * 1024) speed = (speedBytes / (1024 * 1024)).toFixed(1) + ' MB/s';
            else if (speedBytes > 1024) speed = (speedBytes / 1024).toFixed(0) + ' KB/s';
            
            const transferred = (receivedBytes / (1024 * 1024)).toFixed(1) + ' MB';
            const total = (totalBytes / (1024 * 1024)).toFixed(1) + ' MB';
            onProgress({ percent, speed, transferred, total });
          }
        });

        file.on('finish', () => {
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      });

      req.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    get(url);
  });
}

ipcMain.handle('download-update', async () => {
  try {
    if (!latestReleaseInfo || !latestReleaseInfo.assets) {
      throw new Error('No release info available. Check for updates first.');
    }

    // Find the .exe installer
    const exeAsset = latestReleaseInfo.assets.find(asset => asset.name.endsWith('.exe'));
    if (!exeAsset) {
      throw new Error('No executable installer found in the latest release.');
    }

    const tempDir = app.getPath('temp');
    downloadedInstallerPath = path.join(tempDir, exeAsset.name);

    // Start download
    const url = exeAsset.browser_download_url;
    
    // Download async and report progress
    downloadFileWithRedirects(url, downloadedInstallerPath, (progress) => {
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'downloading',
          version: latestReleaseInfo.tag_name,
          ...progress
        });
      }
    }).then(() => {
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'downloaded',
          version: latestReleaseInfo.tag_name
        });
      }
    }).catch(err => {
      if (mainWindow) {
        mainWindow.webContents.send('update-status', {
          status: 'error',
          error: err.message
        });
      }
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-update', async () => {
  try {
    if (!downloadedInstallerPath || !fs.existsSync(downloadedInstallerPath)) {
      throw new Error('Installer file not found.');
    }

    // Run the installer as a detached process
    const { spawn } = require('child_process');
    const child = spawn(downloadedInstallerPath, [], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Quit the app immediately so installer can overwrite the files
    app.quit();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ============================================
// WIRELESS TRANSFER SERVER
// ============================================

let transferServer = null;
let transferServerPort = 0;

function getLocalIP() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function buildUploadPage(mode, savePath) {
  const isFolder = mode === 'folder' && savePath;
  const acceptAttr = isFolder ? '*/*' : 'image/*,.jpg,.jpeg,.png,.gif,.bmp,.webp,.heic,.heif,.tiff,.tif,.raw,.arw,.cr2,.nef,.orf,.dng';
  const folderPath = isFolder ? savePath.replace(/\\/g, '\\\\') : '';

  // Inline SVG icons (Lucide/Shadcn style)
  const iconCamera = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
  const iconFolder = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
  const iconUpload = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  const iconSend   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const iconVideo  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`;
  const iconFile   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>`;
  const iconCheck  = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconWarn   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
  const iconX      = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  return `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Photo Transfer</title>
<style>
/* offline-first styling using standard system font stack, mimicking shadcn/ui */
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#09090b;
  --surface:#09090b;
  --card:#18181b;
  --border:#27272a;
  --text:#f4f4f5;
  --muted:#a1a1aa;
  --primary:#f4f4f5;
  --primary-foreground:#09090b;
  --green:#22c55e;
  --red:#ef4444;
  --font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Kufi Arabic",sans-serif;
  --radius:8px;
}
html,body{height:100%}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100dvh;display:flex;flex-direction:column;align-items:center;padding:0 0 40px;overscroll-behavior:none}

/* Header (Shadcn style) */
.header{width:100%;max-width:480px;background:var(--bg);border-bottom:1px solid var(--border);padding:14px 16px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:10;backdrop-filter:blur(8px)}
.header-icon{width:32px;height:32px;border-radius:var(--radius);background:var(--card);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:var(--text);flex-shrink:0}
.header-icon svg{width:16px;height:16px}
.header-title{font-size:.88rem;font-weight:600;letter-spacing:-.01em}
.header-sub{font-size:.7rem;color:var(--muted);margin-top:1px}

/* Container */
.body{width:100%;max-width:480px;padding:16px;display:flex;flex-direction:column;gap:16px}

/* Badge & Mode Description */
.mode-section{display:flex;flex-direction:column;gap:6px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px}
.mode-badge{display:inline-flex;align-items:center;gap:6px;font-size:.75rem;font-weight:600;color:var(--text)}
.mode-badge svg{width:14px;height:14px;color:var(--muted)}
.mode-path{font-size:.7rem;color:var(--muted);word-break:break-all;font-family:monospace;margin-top:4px}

/* Drop Zone / Selection Card */
.drop-zone{border:1px dashed var(--border);border-radius:var(--radius);padding:28px 16px;text-align:center;cursor:pointer;transition:border-color .15s,background .15s;position:relative;background:var(--card)}
.drop-zone:hover,.drop-zone.drag{border-color:var(--muted);background:rgba(255,255,255,.01)}
.drop-zone input{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%}
.drop-icon{width:42px;height:42px;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;color:var(--muted)}
.drop-icon svg{width:24px;height:24px}
.drop-title{font-size:.85rem;font-weight:500;margin-bottom:4px}
.drop-hint{font-size:.72rem;color:var(--muted);line-height:1.4}

/* Preview Grid & Lists */
.preview-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px;display:flex;flex-direction:column;gap:10px}
.count-row{display:flex;align-items:center;justify-content:space-between}
.count-badge{font-size:.78rem;font-weight:500;color:var(--muted)}
.clear-btn{font-size:.75rem;color:var(--muted);background:none;border:none;cursor:pointer;padding:2px 6px;border-radius:4px;font-family:var(--font)}
.clear-btn:hover{color:var(--red)}

.preview-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.thumb-wrap{position:relative;aspect-ratio:1;border-radius:6px;overflow:hidden;background:#000;border:1px solid var(--border)}
.thumb-wrap img,.thumb-wrap video{width:100%;height:100%;object-fit:cover}

/* Remove button overlay on top right of each item */
.remove-badge{position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:rgba(9,9,11,.8);color:var(--text);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2}
.remove-badge svg{width:10px;height:10px}
.thumb-size{position:absolute;bottom:2px;left:2px;right:2px;font-size:.58rem;color:var(--muted);background:rgba(9,9,11,.75);border-radius:3px;padding:1px 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center}

.file-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:6px;border:1px solid var(--border);position:relative}
.file-row-icon{width:28px;height:28px;border-radius:4px;background:var(--card);display:flex;align-items:center;justify-content:center;color:var(--muted);flex-shrink:0}
.file-row-icon svg{width:14px;height:14px}
.file-row-info{flex:1;min-width:0;padding-right:20px}
.file-row-name{font-size:.75rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.file-row-size{font-size:.65rem;color:var(--muted);margin-top:1px}
.file-row-remove{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:22px;height:22px;display:flex;align-items:center;justify-content:center;color:var(--muted);cursor:pointer}
.file-row-remove svg{width:12px;height:12px}
.file-row-remove:hover{color:var(--red)}

/* Progress Card (Shadcn style) */
.prog-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:12px;display:none;flex-direction:column;gap:8px}
.prog-header{display:flex;justify-content:space-between;align-items:center}
.prog-file{font-size:.75rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.prog-pct{font-size:.75rem;font-weight:600;color:var(--text);margin-left:8px;flex-shrink:0}
.prog-bar-bg{width:100%;height:4px;background:var(--border);border-radius:2px;overflow:hidden}
.prog-bar-fill{height:100%;width:0%;background:var(--text);border-radius:2px;transition:width .1s linear}
.prog-sub{font-size:.68rem;color:var(--muted);text-align:center}

/* Send Button (Shadcn UI primary button) */
.send-btn{width:100%;padding:12px;border:none;border-radius:var(--radius);background:var(--primary);color:var(--primary-foreground);font-size:.85rem;font-weight:600;font-family:var(--font);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity .15s}
.send-btn:disabled{opacity:.5;cursor:not-allowed}
.send-btn:not(:disabled):active{opacity:.9}
.send-btn svg{width:14px;height:14px;flex-shrink:0}

/* Status Alert (Shadcn Alert component) */
.status-card{display:none;align-items:flex-start;gap:10px;padding:12px;border-radius:var(--radius);border:1px solid}
.status-card.ok{background:rgba(34,197,94,.05);border-color:rgba(34,197,94,.2);color:#4ade80}
.status-card.err{background:rgba(239,68,68,.05);border-color:rgba(239,68,68,.2);color:#f87171}
.status-icon{width:18px;height:18px;flex-shrink:0;margin-top:2px}
.status-icon svg{width:100%;height:100%}
.status-text{font-size:.78rem;font-weight:500;line-height:1.4}
</style>
</head>
<body>

<div class="header">
  <div class="header-icon">${isFolder ? iconFolder : iconCamera}</div>
  <div>
    <div class="header-title">Cyber Report</div>
    <div class="header-sub">${isFolder ? 'Wireless File Hub' : 'Wireless Photo Receiver'}</div>
  </div>
</div>

<div class="body">
  <div class="mode-section">
    <div class="mode-badge">
      ${isFolder ? iconFolder : iconCamera}
      <span>${isFolder ? 'Folder Mode' : 'App Workspace Mode'}</span>
    </div>
    ${isFolder ? `<div class="mode-path">${folderPath}</div>` : `<div style="font-size:.7rem;color:var(--muted)">Files will load directly into the Cyber Report workspace.</div>`}
  </div>

  <div class="drop-zone" id="dz">
    <input type="file" id="file" accept="${acceptAttr}" multiple>
    <div class="drop-icon">${iconUpload}</div>
    <div class="drop-title">Select Files to Upload</div>
    <div class="drop-hint">Tap to browse files<br>or drag and drop them here</div>
  </div>

  <div class="preview-card" id="previewWrap" style="display:none">
    <div class="count-row">
      <span class="count-badge" id="count"></span>
      <button class="clear-btn" id="clearBtn">Clear All</button>
    </div>
    <div id="preview"></div>
  </div>

  <div class="prog-card" id="progCard">
    <div class="prog-header">
      <span class="prog-file" id="progFile"></span>
      <span class="prog-pct" id="progPct">0%</span>
    </div>
    <div class="prog-bar-bg"><div class="prog-bar-fill" id="progFill"></div></div>
    <div class="prog-sub" id="progSub"></div>
  </div>

  <button class="send-btn" id="sendBtn" disabled>${iconSend} <span id="sendLabel">Send to PC</span></button>

  <div class="status-card" id="statusCard">
    <div class="status-icon" id="statusIcon"></div>
    <div class="status-text" id="statusText"></div>
  </div>
</div>

<script>
// Main state array to accumulate selected files
let selectedFiles = [];

const fileInput   = document.getElementById('file');
const preview     = document.getElementById('preview');
const previewWrapCard = document.getElementById('previewWrap');
const countEl     = document.getElementById('count');
const clearBtn    = document.getElementById('clearBtn');
const sendBtn     = document.getElementById('sendBtn');
const sendLabel   = document.getElementById('sendLabel');
const dz          = document.getElementById('dz');
const progCard    = document.getElementById('progCard');
const progFile    = document.getElementById('progFile');
const progPct     = document.getElementById('progPct');
const progFill    = document.getElementById('progFill');
const progSub     = document.getElementById('progSub');
const statusCard  = document.getElementById('statusCard');
const statusIcon  = document.getElementById('statusIcon');
const statusText  = document.getElementById('statusText');
const isFolder    = ${isFolder ? 'true' : 'false'};

const iconCheckSVG = ${JSON.stringify(iconCheck)};
const iconWarnSVG  = ${JSON.stringify(iconWarn)};
const iconVideoSVG = ${JSON.stringify(iconVideo)};
const iconFileSVG  = ${JSON.stringify(iconFile)};
const iconXSVG     = ${JSON.stringify(iconX)};

function fmt(b){if(b<1024)return b+'B';if(b<1048576)return(b/1024).toFixed(1)+'KB';return(b/1048576).toFixed(1)+'MB';}
function fileKind(f){
  if(f.type.startsWith('image/'))return'image';
  if(f.type.startsWith('video/'))return'video';
  return'file';
}
function fileLabel(kind,n){
  if(kind==='image')return n===1?'photo':'photos';
  if(kind==='video')return n===1?'video':'videos';
  return n===1?'file':'files';
}

function removeFile(index){
  selectedFiles.splice(index, 1);
  renderPreview(selectedFiles);
}

window.removeFile = removeFile;

function renderPreview(files){
  preview.innerHTML='';
  if(!files.length){
    previewWrapCard.style.display='none';
    sendBtn.disabled=true;
    return;
  }
  previewWrapCard.style.display='flex';

  // Determine dominant kind for button label
  let imgs=0,vids=0,other=0;
  files.forEach(f=>{const k=fileKind(f);if(k==='image')imgs++;else if(k==='video')vids++;else other++;});
  const dominant = imgs>=vids&&imgs>=other?'image':vids>=other?'video':'file';

  // Images → grid, others → rows
  const images = files.filter(f=>f.type.startsWith('image/'));
  const rest   = files.filter(f=>!f.type.startsWith('image/'));

  if(images.length){
    const grid=document.createElement('div');grid.className='preview-grid';
    images.forEach(f=>{
      const origIndex = files.indexOf(f);
      const wrap=document.createElement('div');wrap.className='thumb-wrap';
      
      const img=document.createElement('img');
      img.src=URL.createObjectURL(f);
      
      const rem=document.createElement('div');
      rem.className='remove-badge';
      rem.innerHTML=iconXSVG;
      rem.setAttribute('onclick', 'removeFile('+origIndex+')');
      
      const ov=document.createElement('div');ov.className='thumb-size';ov.textContent=fmt(f.size);
      
      wrap.appendChild(img);
      wrap.appendChild(rem);
      wrap.appendChild(ov);
      grid.appendChild(wrap);
    });
    preview.appendChild(grid);
  }
  
  rest.forEach(f=>{
    const origIndex = files.indexOf(f);
    const row=document.createElement('div');row.className='file-row';
    const icon=document.createElement('div');icon.className='file-row-icon';
    icon.innerHTML=f.type.startsWith('video/')?iconVideoSVG:iconFileSVG;
    
    const info=document.createElement('div');info.className='file-row-info';
    info.innerHTML='<div class="file-row-name">'+f.name+'</div><div class="file-row-size">'+fmt(f.size)+'</div>';
    
    const rem=document.createElement('div');
    rem.className='file-row-remove';
    rem.innerHTML=iconXSVG;
    rem.setAttribute('onclick', 'removeFile('+origIndex+')');
    
    row.appendChild(icon);
    row.appendChild(info);
    row.appendChild(rem);
    preview.appendChild(row);
  });

  countEl.textContent=files.length+' '+fileLabel(dominant,files.length)+' selected';
  sendBtn.disabled=false;
  sendLabel.textContent='Send '+files.length+' '+fileLabel(dominant,files.length);
}

// Handle file input selection with accumulation (append to state array)
fileInput.addEventListener('change',()=>{
  if(fileInput.files.length){
    let rejected = 0;
    Array.from(fileInput.files).forEach(f=>{
      // Filter: In app workspace mode, only accept images
      if(!isFolder && !f.type.startsWith('image/') && !/\\.(heic|heif)$/i.test(f.name)){
        rejected++;
        return; // Skip non-image files in workspace mode
      }
      
      // Avoid duplicate files by checking name and size
      const exists = selectedFiles.some(old => old.name === f.name && old.size === f.size);
      if(!exists){
        selectedFiles.push(f);
      }
    });
    
    // Show warning if files were rejected
    if(rejected > 0 && !isFolder){
      statusCard.style.display='flex';
      statusCard.className='status-card err';
      statusIcon.innerHTML=iconWarnSVG;
      statusText.textContent='Only image files are allowed in App Workspace mode. '+rejected+' file(s) were skipped.';
      setTimeout(()=>{ statusCard.style.display='none'; }, 4000);
    }
    
    fileInput.value = ''; // clear input so change event fires again for same files
    renderPreview(selectedFiles);
  }
});

clearBtn.addEventListener('click',()=>{
  selectedFiles = [];
  renderPreview(selectedFiles);
  statusCard.style.display='none';
});

// Drag & drop
dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag');});
dz.addEventListener('dragleave',()=>dz.classList.remove('drag'));
dz.addEventListener('drop',e=>{
  e.preventDefault();dz.classList.remove('drag');
  if(e.dataTransfer.files.length){
    let rejected = 0;
    Array.from(e.dataTransfer.files).forEach(f=>{
      // Filter: In app workspace mode, only accept images
      if(!isFolder && !f.type.startsWith('image/') && !/\\.(heic|heif)$/i.test(f.name)){
        rejected++;
        return; // Skip non-image files in workspace mode
      }
      
      const exists = selectedFiles.some(old => old.name === f.name && old.size === f.size);
      if(!exists){
        selectedFiles.push(f);
      }
    });
    
    // Show warning if files were rejected
    if(rejected > 0 && !isFolder){
      statusCard.style.display='flex';
      statusCard.className='status-card err';
      statusIcon.innerHTML=iconWarnSVG;
      statusText.textContent='Only image files are allowed in App Workspace mode. '+rejected+' file(s) were skipped.';
      setTimeout(()=>{ statusCard.style.display='none'; }, 4000);
    }
    
    renderPreview(selectedFiles);
  }
});

// Upload with XHR for real per-file progress
function uploadFile(file, index, total){
  return new Promise((resolve)=>{
    const fd=new FormData();fd.append('photo',file,file.name);
    const xhr=new XMLHttpRequest();
    xhr.upload.addEventListener('progress',e=>{
      if(!e.lengthComputable)return;
      const filePct=Math.round(e.loaded/e.total*100);
      const totalPct=Math.round(((index+e.loaded/e.total)/total)*100);
      progFill.style.width=totalPct+'%';
      progPct.textContent=totalPct+'%';
      progFile.textContent='('+(index+1)+'/'+total+') '+file.name;
      progSub.textContent=fmt(e.loaded)+' / '+fmt(e.total)+' — file: '+filePct+'%';
    });
    xhr.addEventListener('load',()=>resolve(xhr.status>=200&&xhr.status<300));
    xhr.addEventListener('error',()=>resolve(false));
    xhr.open('POST','/upload');
    xhr.send(fd);
  });
}

sendBtn.addEventListener('click',async()=>{
  if(!selectedFiles.length)return;
  const filesToUpload = [...selectedFiles];
  sendBtn.disabled=true;
  progCard.style.display='flex';
  statusCard.style.display='none';
  progFill.style.width='0%';progPct.textContent='0%';
  let ok=0,fail=0;
  for(let i=0;i<filesToUpload.length;i++){
    progFile.textContent='('+(i+1)+'/'+filesToUpload.length+') '+filesToUpload[i].name;
    const success=await uploadFile(filesToUpload[i],i,filesToUpload.length);
    if(success){
      ok++;
    } else {
      fail++;
    }
  }
  progFill.style.width='100%';progPct.textContent='100%';
  setTimeout(()=>{ progCard.style.display='none'; },600);

  statusCard.style.display='flex';
  if(fail===0){
    statusCard.className='status-card ok';
    statusIcon.innerHTML=iconCheckSVG;
    // Determine what was sent
    let imgs=0,vids=0,other=0;
    filesToUpload.forEach(f=>{const k=fileKind(f);if(k==='image')imgs++;else if(k==='video')vids++;else other++;});
    let parts=[];
    if(imgs)parts.push(imgs+' '+(imgs===1?'photo':'photos'));
    if(vids)parts.push(vids+' '+(vids===1?'video':'videos'));
    if(other)parts.push(other+' '+(other===1?'file':'files'));
    statusText.textContent='Successfully sent: '+parts.join(', ')+'.';
    
    // Clear list upon successful transmission of all files
    selectedFiles = [];
    renderPreview(selectedFiles);
  } else {
    statusCard.className='status-card err';
    statusIcon.innerHTML=iconWarnSVG;
    statusText.textContent='Sent '+ok+', failed '+fail+'. Please try again.';
  }
  sendBtn.disabled=false;
  sendLabel.textContent='Send more';
});
</script>
</body>
</html>`;
}

function parseMultipart(body, boundary) {
  const results = [];
  const boundaryBuf = Buffer.from('--' + boundary);
  let start = 0;
  while (true) {
    const idx = body.indexOf(boundaryBuf, start);
    if (idx === -1) break;
    const end = body.indexOf(boundaryBuf, idx + boundaryBuf.length);
    const part = end === -1 ? body.slice(idx + boundaryBuf.length) : body.slice(idx + boundaryBuf.length, end);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd !== -1) {
      const headers = part.slice(0, headerEnd).toString();
      const data = part.slice(headerEnd + 4, part.length - 2); // trim trailing \r\n
      const nameMatch = headers.match(/name="([^"]+)"/);
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      if (filenameMatch && data.length > 0) {
        results.push({ fieldname: nameMatch ? nameMatch[1] : '', filename: filenameMatch[1], data });
      }
    }
    start = idx + boundaryBuf.length;
    if (end === -1) break;
  }
  return results;
}

ipcMain.handle('start-transfer-server', async (event, { mode, savePath }) => {
  try {
    // Stop any existing server
    if (transferServer) {
      await new Promise(resolve => transferServer.close(resolve));
      transferServer = null;
    }

    const server = http.createServer((req, res) => {
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(buildUploadPage(mode, savePath));
        return;
      }

      if (req.method === 'POST' && req.url === '/upload') {
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=([^\s;]+)/);
        if (!boundaryMatch) {
          res.writeHead(400); res.end('Missing boundary');
          return;
        }
        const boundary = boundaryMatch[1];
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
          try {
            const body = Buffer.concat(chunks);
            const parts = parseMultipart(body, boundary);
            for (const part of parts) {
              const ext = path.extname(part.filename).slice(1).toLowerCase() || 'bin';
              const isImage = ['jpg','jpeg','png','gif','bmp','webp','heic','heif','tiff','tif','svg'].includes(ext);
              const MAX_BASE64_SIZE = 4 * 1024 * 1024; // 4MB limit for base64

              if (mode === 'folder' && savePath) {
                // Folder mode: always save to the chosen folder
                try {
                  const dest = path.join(savePath, part.filename);
                  fs.writeFileSync(dest, part.data);
                  // For notification, only send base64 if small image
                  let src = '';
                  if (isImage && part.data.length <= MAX_BASE64_SIZE) {
                    src = `data:image/${ext};base64,${part.data.toString('base64')}`;
                  }
                  if (mainWindow) mainWindow.webContents.send('wireless-photo-received', { src, name: part.filename, folder: true });
                } catch (e) {
                  console.error('Save to folder error:', e);
                }
              } else {
                // App mode: save to temp, then read as file path or base64 for small images
                if (isImage && part.data.length <= MAX_BASE64_SIZE) {
                  const src = `data:image/${ext};base64,${part.data.toString('base64')}`;
                  if (mainWindow) mainWindow.webContents.send('wireless-photo-received', { src, name: part.filename, folder: false });
                } else {
                  // Save to temp folder and send file path
                  try {
                    const tempDir = path.join(app.getPath('temp'), 'photo-printer-transfer');
                    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                    const tempFile = path.join(tempDir, `${Date.now()}_${part.filename}`);
                    fs.writeFileSync(tempFile, part.data);
                    const src = `file://${tempFile.replace(/\\/g, '/')}`;
                    if (mainWindow) mainWindow.webContents.send('wireless-photo-received', { src, name: part.filename, folder: false });
                  } catch (e) {
                    console.error('Save to temp error:', e);
                  }
                }
              }
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, received: parts.length }));
          } catch (err) {
            console.error('Upload processing error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
          }
        });
        return;
      }

      res.writeHead(404); res.end('Not found');
    });

    await new Promise((resolve, reject) => {
      server.listen(0, '0.0.0.0', () => resolve());
      server.once('error', reject);
    });

    transferServer = server;
    transferServerPort = server.address().port;
    const ip = getLocalIP();

    return { success: true, ip, port: transferServerPort };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('stop-transfer-server', async () => {
  try {
    if (transferServer) {
      await new Promise(resolve => transferServer.close(resolve));
      transferServer = null;
      transferServerPort = 0;
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ============================================
// HOTSPOT (Windows netsh)
// ============================================

let hotspotSSID = 'PhotoPrinter';
let hotspotPass = '';

// Load or generate persistent hotspot credentials (never change once created)
function ensureHotspotCreds() {
  if (hotspotPass) return; // already loaded
  try {
    const settingsPath = getSettingsFilePath();
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data && data.hotspotPass) {
        hotspotSSID = data.hotspotSSID || 'PhotoPrinter';
        hotspotPass = data.hotspotPass;
        return;
      }
    }
  } catch (e) {}
  // Generate for the first time and persist
  hotspotSSID = 'PhotoPrinter';
  hotspotPass = Math.random().toString(36).slice(2, 10).toUpperCase();
  try {
    const settingsPath = getSettingsFilePath();
    let existing = {};
    if (fs.existsSync(settingsPath)) {
      try { existing = JSON.parse(fs.readFileSync(settingsPath, 'utf8')); } catch(e) {}
    }
    existing.hotspotSSID = hotspotSSID;
    existing.hotspotPass = hotspotPass;
    fs.writeFileSync(settingsPath, JSON.stringify(existing, null, 2), 'utf8');
  } catch (e) { console.error('Could not persist hotspot creds:', e); }
}

ipcMain.handle('start-hotspot', async () => {
  ensureHotspotCreds();

  // â”€â”€ Strategy 1: Modern Windows Mobile Hotspot (Win10/11) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Uses the built-in "Internet Connection Sharing" / TetheringManager via PowerShell
  const psScript = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
function Await($WinRtTask, $ResultType) {
  $asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and !$_.IsGenericMethod })[0]
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}
$connectionProfile = [Windows.Networking.Connectivity.NetworkInformation,Windows.Networking.Connectivity,ContentType=WindowsRuntime]::GetInternetConnectionProfile()
$tetheringManager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager,Windows.Networking.NetworkOperators,ContentType=WindowsRuntime]::CreateFromConnectionProfile($connectionProfile)
$config = $tetheringManager.GetCurrentAccessPointConfiguration()
$config.Ssid = "${hotspotSSID}"
$config.Passphrase = "${hotspotPass}"
Await ($tetheringManager.ConfigureAccessPointAsync($config)) $null
Await ($tetheringManager.StartTetheringAsync()) $null
Write-Output "OK"
`.trim();

  let usedModern = false;
  try {
    const result = execSync(`powershell -NoProfile -NonInteractive -Command "${psScript.replace(/"/g, '\\"').replace(/\n/g, '; ')}"`, {
      timeout: 15000, encoding: 'utf8', stdio: 'pipe'
    });
    if (result && result.includes('OK')) {
      usedModern = true;
    }
  } catch (_) { /* fall through */ }

  // â”€â”€ Strategy 2: Legacy netsh hostednetwork â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (!usedModern) {
    try {
      execSync(`netsh wlan set hostednetwork mode=allow ssid="${hotspotSSID}" key="${hotspotPass}"`, { stdio: 'pipe', timeout: 8000 });
      execSync('netsh wlan start hostednetwork', { stdio: 'pipe', timeout: 8000 });
    } catch (netshErr) {
      // Both strategies failed â€“ return a friendly, actionable error
      const isAdmin = (() => {
        try { execSync('net session', { stdio: 'pipe' }); return true; } catch { return false; }
      })();
      const hint = isAdmin
        ? 'Your Wi-Fi driver does not support Windows Hosted Network. Please enable Mobile Hotspot from Windows Settings â†’ Network & Internet â†’ Mobile hotspot, then use the Standard Wi-Fi mode instead.'
        : 'Please run Cyber Report as Administrator to use the hotspot feature, or enable Mobile Hotspot from Windows Settings â†’ Network & Internet â†’ Mobile hotspot and use Standard mode.';
      return { success: false, error: hint };
    }
  }

  // Wait a moment for the adapter to come up
  await new Promise(r => setTimeout(r, 2500));

  // Find the hotspot adapter IP
  let hotspotIP = '';
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const lname = name.toLowerCase();
    if (lname.includes('local area connection') || lname.includes('hosted') || lname.includes('virtual') || lname.includes('wi-fi')) {
      for (const iface of ifaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168.')) {
          hotspotIP = iface.address;
          break;
        }
      }
      if (hotspotIP) break;
    }
  }
  if (!hotspotIP) hotspotIP = getLocalIP();

  return { success: true, ssid: hotspotSSID, passphrase: hotspotPass, ip: hotspotIP };
});


ipcMain.handle('stop-hotspot', async () => {
  try {
    execSync('netsh wlan stop hostednetwork', { stdio: 'pipe' });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Save Folder'
    });
    if (result.canceled || !result.filePaths.length) return null;
    return result.filePaths[0];
  } catch (err) {
    return null;
  }
});

// Background removal - not supported
ipcMain.handle('remove-background', async () => {
  return { success: false, error: 'Background removal not available in desktop app.', notSupported: true };
});

// ============================================
// APP INITIALIZATION
// ============================================

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Handle file associations
app.on('open-file', (event, path) => {
  event.preventDefault();
  if (mainWindow) {
    openProjectFile(path);
  } else {
    fileToOpen = path;
  }
});

// Multi-instance support: Allow multiple windows for different projects
// Each double-click opens a new independent window
// Removed single instance lock to allow multiple project windows