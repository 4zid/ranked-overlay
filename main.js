const { app, BrowserWindow, globalShortcut, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { getAllData } = require('./src/valorant/api');

let controlWindow = null;
let overlayWindow = null;
let tray = null;
let updateInterval = null;
let overlayActive = false; // Whether the overlay system is "started"
let rankedReminderEnabled = false;
let alertShowing = false;
const SHORTCUT = 'Alt+Shift+T';
const NON_RANKED_QUEUES = ['unrated', 'spikerush', 'deathmatch', 'ggteam', 'onefa', 'swiftplay', 'hurm'];

// ── Control Window ─────────────────────────────────────────────

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 340,
    height: 440,
    frame: false,
    resizable: false,
    maximizable: false,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload-control.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  controlWindow.loadFile(path.join(__dirname, 'src', 'control', 'index.html'));

  controlWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      controlWindow.hide();
    } else {
      // App is actually quitting — make sure everything is cleaned up
      stopOverlay();
    }
  });
}

// ── Overlay Window ─────────────────────────────────────────────

function createOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) return;

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 340,
    height: 300,
    x: screenWidth - 360,
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  overlayWindow.setIgnoreMouseEvents(true);
  overlayWindow.loadFile(path.join(__dirname, 'src', 'renderer', 'index.html'));

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function destroyOverlayWindow() {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.destroy();
    overlayWindow = null;
  }
}

function toggleOverlay() {
  if (!overlayActive || !overlayWindow) return;

  if (overlayWindow.isVisible()) {
    overlayWindow.webContents.send('overlay-hide');
    setTimeout(() => {
      if (overlayWindow && !overlayWindow.isDestroyed()) overlayWindow.hide();
    }, 300);
  } else {
    overlayWindow.show();
    overlayWindow.webContents.send('overlay-show');
    fetchAndSendData();
  }
}

// ── Data Fetching ──────────────────────────────────────────────

async function fetchAndSendData() {
  const data = await getAllData();

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('rank-data', data);
  }
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('rank-update', data);
  }

  // Ranked reminder: alert when entering a non-competitive queue
  checkRankedReminder(data);
}

function checkRankedReminder(data) {
  if (!rankedReminderEnabled || !overlayActive || !overlayWindow) return;

  const isNonRanked = data.ok
    && (data.gameStatus === 'agent_select' || data.gameStatus === 'in_game')
    && data.queueId
    && NON_RANKED_QUEUES.includes(data.queueId);

  if (isNonRanked && !alertShowing) {
    alertShowing = true;
    overlayWindow.show();
    overlayWindow.webContents.send('ranked-alert', { show: true, modeName: data.gameMode });
  } else if (!isNonRanked && alertShowing) {
    alertShowing = false;
    overlayWindow.webContents.send('ranked-alert', { show: false });
  }
}

function startAutoUpdate() {
  stopAutoUpdate();
  updateInterval = setInterval(fetchAndSendData, 30000);
}

function stopAutoUpdate() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// ── Start / Stop ───────────────────────────────────────────────

function startOverlay() {
  if (overlayActive) return;
  overlayActive = true;

  createOverlayWindow();

  globalShortcut.register(SHORTCUT, toggleOverlay);

  fetchAndSendData();
  startAutoUpdate();

  sendStateToControl();
}

function stopOverlay() {
  if (!overlayActive) return;
  overlayActive = false;

  globalShortcut.unregisterAll();
  stopAutoUpdate();
  destroyOverlayWindow();

  sendStateToControl();
}

function sendStateToControl() {
  if (controlWindow && !controlWindow.isDestroyed()) {
    controlWindow.webContents.send('state-change', { running: overlayActive });
  }
}

// ── System Tray ────────────────────────────────────────────────

function createTray() {
  // Create a simple 16x16 red square icon via nativeImage
  const icon = nativeImage.createFromBuffer(
    createTrayIconBuffer(), { width: 16, height: 16 }
  );

  tray = new Tray(icon);
  tray.setToolTip('Ranked Overlay');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir',
      click: () => {
        if (controlWindow) controlWindow.show();
      }
    },
    {
      label: 'Iniciar Overlay',
      click: () => startOverlay()
    },
    {
      label: 'Detener Overlay',
      click: () => stopOverlay()
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (controlWindow) controlWindow.show();
  });
}

function createTrayIconBuffer() {
  // 16x16 RGBA raw pixel data — red (#ff4655) square
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = 0xff;     // R
    buf[i * 4 + 1] = 0x46; // G
    buf[i * 4 + 2] = 0x55; // B
    buf[i * 4 + 3] = 0xff; // A
  }
  return buf;
}

// ── App Lifecycle ──────────────────────────────────────────────

app.whenReady().then(() => {
  createControlWindow();
  createTray();

  // IPC from overlay renderer
  ipcMain.handle('get-rank-data', async () => {
    return await getAllData();
  });

  // IPC from control window
  ipcMain.handle('control-start', () => {
    startOverlay();
    return { ok: true };
  });

  ipcMain.handle('control-stop', () => {
    stopOverlay();
    return { ok: true };
  });

  ipcMain.on('control-minimize', () => {
    if (controlWindow) controlWindow.minimize();
  });

  ipcMain.on('control-close-to-tray', () => {
    if (controlWindow) controlWindow.hide();
  });

  ipcMain.on('set-ranked-reminder', (_e, enabled) => {
    rankedReminderEnabled = enabled;
    if (!enabled && alertShowing) {
      alertShowing = false;
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('ranked-alert', { show: false });
      }
    }
  });
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopOverlay();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  stopAutoUpdate();
});

app.on('window-all-closed', (e) => {
  // Don't quit — we live in the tray
});
