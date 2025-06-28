const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveNotes: (notes) => ipcRenderer.invoke('save-notes', notes),
  loadNotes: () => ipcRenderer.invoke('load-notes'),
  exportNotes: (notes, filePath) => ipcRenderer.invoke('export-notes', notes, filePath),
  importNotes: (filePath) => ipcRenderer.invoke('import-notes', filePath),

  // Menu event listeners
  onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
  onMenuSaveNote: (callback) => ipcRenderer.on('menu-save-note', callback),
  onMenuFind: (callback) => ipcRenderer.on('menu-find', callback),
  onMenuExportNotes: (callback) => ipcRenderer.on('menu-export-notes', callback),
  onMenuImportNotes: (callback) => ipcRenderer.on('menu-import-notes', callback),
  onGlobalNewNote: (callback) => ipcRenderer.on('global-new-note', callback),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // System info
  platform: process.platform,
  version: process.versions.electron
});