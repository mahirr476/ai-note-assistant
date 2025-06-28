// src/components/layout/MainLayout.tsx
import React, { useState, useEffect } from 'react';
import { ModuleType, ModuleData } from '../../types/modules';
import { ModuleNavigation } from './ModuleNavigation';
import { ModuleContent } from './ModuleContent';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { Toast } from '../ui/toast';
import { useDataPersistence } from '../../hooks/useDataPersistance';
import { useElectronMenus } from '../../hooks/useElectronMenus';

interface MainLayoutProps {}

export const MainLayout: React.FC<MainLayoutProps> = () => {
  // State management
  const [activeModule, setActiveModule] = useState<ModuleType>('notes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Delete confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    noteId: string | null;
    step: 1 | 2;
  }>({
    show: false,
    noteId: null,
    step: 1
  });

  // Toast notification state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'saving' | 'saved' | 'error';
  }>({
    show: false,
    message: '',
    type: 'saved'
  });

  // Custom hooks for data management
  const {
    moduleData,
    setModuleData,
    isLoading,
    saveStatus,
    saveDataToFile,
    exportData,
    importData
  } = useDataPersistence();

  // Electron menu integration
  useElectronMenus({
    onNewNote: () => setActiveModule('notes'),
    onSave: saveDataToFile,
    onSearch: () => setShowSearch(true),
    onExport: exportData,
    onImport: importData
  });

  // Toast helpers
  const showToast = (message: string, type: 'saving' | 'saved' | 'error') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  // Delete handlers
  const startDeleteNote = (noteId: string) => {
    setDeleteConfirm({ show: true, noteId, step: 1 });
  };

  const confirmDeleteNote = async () => {
    if (deleteConfirm.step === 1) {
      setDeleteConfirm(prev => ({ ...prev, step: 2 }));
    } else if (deleteConfirm.step === 2 && deleteConfirm.noteId) {
      showToast('Deleting note...', 'saving');
      
      const updatedNotes = moduleData.notes.filter(note => note.id !== deleteConfirm.noteId);
      const updatedData = { ...moduleData, notes: updatedNotes };
      setModuleData(updatedData);
      
      setDeleteConfirm({ show: false, noteId: null, step: 1 });
      showToast('Note deleted successfully!', 'saved');
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, noteId: null, step: 1 });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin mx-auto text-primary border-2 border-primary border-t-transparent rounded-full" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Module Navigation Sidebar */}
      <ModuleNavigation 
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        moduleData={moduleData}
      />

      {/* Main Content Area */}
      <ModuleContent
        activeModule={activeModule}
        moduleData={moduleData}
        setModuleData={setModuleData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        saveStatus={saveStatus}
        onDeleteNote={startDeleteNote}
        onShowToast={showToast}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={deleteConfirm.show}
        step={deleteConfirm.step}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDelete}
      />

      {/* Toast Notification */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </div>
  );
};