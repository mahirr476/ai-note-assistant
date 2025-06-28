// src/hooks/useDataPersistence.ts
import { useState, useEffect } from 'react';
import { ModuleData } from '../types/modules';

// Type definitions for Electron API
interface ElectronAPI {
  saveNotes: (notes: any[]) => Promise<{ success: boolean; error?: string }>;
  loadNotes: () => Promise<{ success: boolean; notes?: any[]; error?: string }>;
  exportNotes: (notes: any[], filePath: string) => Promise<{ success: boolean; error?: string }>;
  importNotes: (filePath: string) => Promise<{ success: boolean; notes?: any[]; error?: string }>;
  onMenuNewNote: (callback: () => void) => void;
  onMenuSaveNote: (callback: () => void) => void;
  onMenuFind: (callback: () => void) => void;
  onMenuExportNotes: (callback: (event: any, filePath: string) => void) => void;
  onMenuImportNotes: (callback: (event: any, filePath: string) => void) => void;
  onGlobalNewNote: (callback: () => void) => void;
  platform: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export type SaveStatus = 'saved' | 'saving' | 'unsaved';

export const useDataPersistence = () => {
  const [moduleData, setModuleData] = useState<ModuleData>({
    notes: [],
    tasks: [],
    calendar: [],
    contacts: [],
    projects: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // Load data from file system on component mount
  useEffect(() => {
    loadDataFromFile();
  }, []);

  // Auto-save data whenever module data changes
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveDataToFile();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [moduleData, isLoading]);

  const loadDataFromFile = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.loadNotes();
        if (result.success && result.notes) {
          // Parse existing data structure or create new one
          const data = result.notes[0]?.moduleData || { 
            notes: result.notes, 
            tasks: [], 
            calendar: [], 
            contacts: [], 
            projects: [] 
          };
          setModuleData(data);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    } else {
      // Browser fallback
      try {
        const savedData = localStorage.getItem('aiNoteAssistant_moduleData');
        if (savedData) {
          setModuleData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    }
    setIsLoading(false);
  };

  const saveDataToFile = async () => {
    if (window.electronAPI) {
      setSaveStatus('saving');
      try {
        // Save as a single module data object
        const result = await window.electronAPI.saveNotes([{ moduleData }]);
        if (result.success) {
          setSaveStatus('saved');
        } else {
          console.error('Error saving data:', result.error);
          setSaveStatus('unsaved');
        }
      } catch (error) {
        console.error('Error saving data:', error);
        setSaveStatus('unsaved');
      }
    } else {
      // Browser fallback
      setSaveStatus('saving');
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        localStorage.setItem('aiNoteAssistant_moduleData', JSON.stringify(moduleData));
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error saving data to localStorage:', error);
        setSaveStatus('unsaved');
      }
    }
  };

  const exportData = async (filePath: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.exportNotes([{ moduleData }], filePath);
        if (result.success) {
          console.log('Data exported successfully');
        }
      } catch (error) {
        console.error('Error exporting data:', error);
      }
    }
  };

  const importData = async (filePath: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.importNotes(filePath);
        if (result.success && result.notes) {
          const importedData = result.notes[0]?.moduleData;
          if (importedData) {
            setModuleData(importedData);
          }
        }
      } catch (error) {
        console.error('Error importing data:', error);
      }
    }
  };

  return {
    moduleData,
    setModuleData,
    isLoading,
    saveStatus,
    saveDataToFile,
    exportData,
    importData
  };
};