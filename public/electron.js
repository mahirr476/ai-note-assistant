const { app, BrowserWindow, Menu, ipcMain, dialog, globalShortcut } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// Keep a global reference of the window object
let mainWindow;

// App data directory
const appDataPath = path.join(os.homedir(), '.ai-note-assistant');

// Force production mode if no dev server is running
const isDevMode = isDev && process.env.ELECTRON_IS_DEV !== 'false';

// Ensure app data directory exists
async function ensureAppDataDir() {
  try {
    await fs.access(appDataPath);
  } catch {
    await fs.mkdir(appDataPath, { recursive: true });
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false // Don't show until ready
  });

  // Load the app
  const startUrl = isDevMode 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  console.log('isDevMode:', isDevMode);
  console.log('isDev:', isDev);
  console.log('ELECTRON_IS_DEV:', process.env.ELECTRON_IS_DEV);
  console.log('__dirname:', __dirname);
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Set up application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-note');
          }
        },
        {
          label: 'Save Note',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-note');
          }
        },
        { type: 'separator' },
        {
          label: 'Export Notes',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Notes',
              defaultPath: 'notes-export.json',
              filters: [
                { name: 'JSON files', extensions: ['json'] },
                { name: 'All files', extensions: ['*'] }
              ]
            });

            if (!result.canceled) {
              mainWindow.webContents.send('menu-export-notes', result.filePath);
            }
          }
        },
        {
          label: 'Import Notes',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Notes',
              filters: [
                { name: 'JSON files', extensions: ['json'] },
                { name: 'All files', extensions: ['*'] }
              ],
              properties: ['openFile']
            });

            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow.webContents.send('menu-import-notes', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
        { type: 'separator' },
        {
          label: 'Find',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow.webContents.send('menu-find');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // Window menu
    template[4].submenu = [
      { role: 'close' },
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' }
    ];
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC handlers for file operations
ipcMain.handle('save-notes', async (event, notes) => {
  try {
    await ensureAppDataDir();
    const notesPath = path.join(appDataPath, 'notes.json');
    await fs.writeFile(notesPath, JSON.stringify(notes, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving notes:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-notes', async () => {
  try {
    await ensureAppDataDir();
    const notesPath = path.join(appDataPath, 'notes.json');
    const data = await fs.readFile(notesPath, 'utf8');
    return { success: true, notes: JSON.parse(data) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      return { success: true, notes: [] };
    }
    console.error('Error loading notes:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-notes', async (event, notes, filePath) => {
  try {
    await fs.writeFile(filePath, JSON.stringify(notes, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error exporting notes:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-notes', async (event, filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const notes = JSON.parse(data);
    return { success: true, notes };
  } catch (error) {
    console.error('Error importing notes:', error);
    return { success: false, error: error.message };
  }
});

// App event handlers
app.whenReady().then(() => {
  createWindow();

  // Register global shortcuts
  globalShortcut.register('CmdOrCtrl+Shift+N', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('global-new-note');
    }
  });

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    event.preventDefault();
  });
});