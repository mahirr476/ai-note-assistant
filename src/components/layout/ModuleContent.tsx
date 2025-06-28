// src/components/layout/ModuleContent.tsx
import React from 'react';
import { ModuleType, ModuleData } from '../../types/modules';
import { NotesModule } from '../modules/NotesModule';
import { TasksModule } from '../modules/TasksModule';
import { CalendarModule } from '../modules/CalendarModule';
import { ContactsModule } from '../modules/ContactsModule';
import { ProjectsModule } from '../modules/ProjectsModule';

interface ModuleContentProps {
  activeModule: ModuleType;
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onDeleteNote: (noteId: string) => void;
  onShowToast: (message: string, type: 'saving' | 'saved' | 'error') => void;
}

export const ModuleContent: React.FC<ModuleContentProps> = ({
  activeModule,
  moduleData,
  setModuleData,
  searchTerm,
  setSearchTerm,
  showSearch,
  setShowSearch,
  saveStatus,
  onDeleteNote,
  onShowToast
}) => {
  const renderModule = () => {
    switch (activeModule) {
      case 'notes':
        return (
          <NotesModule
            moduleData={moduleData}
            setModuleData={setModuleData}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showSearch={showSearch}
            setShowSearch={setShowSearch}
            saveStatus={saveStatus}
            onDeleteNote={onDeleteNote}
            onShowToast={onShowToast}
          />
        );
      case 'tasks':
        return <TasksModule moduleData={moduleData} setModuleData={setModuleData} />;
      case 'calendar':
        return <CalendarModule moduleData={moduleData} setModuleData={setModuleData} />;
      case 'contacts':
        return <ContactsModule moduleData={moduleData} setModuleData={setModuleData} />;
      case 'projects':
        return <ProjectsModule moduleData={moduleData} setModuleData={setModuleData} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex">
      {renderModule()}
    </div>
  );
};