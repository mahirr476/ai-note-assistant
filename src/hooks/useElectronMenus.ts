// src/hooks/useElectronMenus.ts
import { useEffect } from 'react';

interface ElectronMenuHandlers {
  onNewNote: () => void;
  onSave: () => void;
  onSearch: () => void;
  onExport: (filePath: string) => void;
  onImport: (filePath: string) => void;
}

export const useElectronMenus = (handlers: ElectronMenuHandlers) => {
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuNewNote(() => {
        handlers.onNewNote();
      });

      window.electronAPI.onMenuSaveNote(() => {
        handlers.onSave();
      });

      window.electronAPI.onMenuFind(() => {
        handlers.onSearch();
      });

      window.electronAPI.onMenuExportNotes((event, filePath) => {
        handlers.onExport(filePath);
      });

      window.electronAPI.onMenuImportNotes((event, filePath) => {
        handlers.onImport(filePath);
      });

      window.electronAPI.onGlobalNewNote(() => {
        handlers.onNewNote();
      });
    }
  }, [handlers]);
};