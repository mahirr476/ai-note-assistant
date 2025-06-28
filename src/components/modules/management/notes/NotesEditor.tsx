// src/components/modules/notes/NotesEditor.tsx
import React, { useRef } from 'react';
import { Save, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Textarea } from '../../../ui/textarea';
import { Badge } from '../../../ui/badge';
import { Note, ModuleData } from '../../../../types/modules';
import { NotesAnalysisSidebar } from './NotesAnalysisSidebar';
import { getCategoryColor, getPriorityColor } from '../../../../utils/noteUtils';

interface NotesEditorProps {
  selectedNote: Note | null;
  currentNote: string;
  setCurrentNote: (content: string) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onSave: () => void;
  onDelete?: () => void;
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
  onShowToast: (message: string, type: 'saving' | 'saved' | 'error') => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  selectedNote,
  currentNote,
  setCurrentNote,
  saveStatus,
  onSave,
  onDelete,
  moduleData,
  setModuleData,
  onShowToast
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave();
    }
  };

  const showAnalysisSidebar = selectedNote && (selectedNote.aiAnalysis || selectedNote.assistantActions?.length);

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Editor Header */}
      <div className="p-4 border-b bg-card flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-foreground">
              {selectedNote ? 'Edit Note' : 'New Note'}
            </h2>
            {selectedNote && (
              <Badge variant="outline" className="text-xs">
                {selectedNote.wordCount} words
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {selectedNote && (
              <>
                <Badge className={getCategoryColor(selectedNote.category)}>
                  {selectedNote.category}
                </Badge>
                <Badge className={getPriorityColor(selectedNote.aiAnalysis?.priority || 'medium')}>
                  {selectedNote.aiAnalysis?.priority || 'medium'} priority
                </Badge>
                {onDelete && (
                  <Button
                    onClick={onDelete}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
            
            <Button
              onClick={onSave}
              disabled={!currentNote.trim() || saveStatus === 'saving'}
              className="gap-2"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {selectedNote ? 'Update' : 'Save'} Note
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main Editor */}
        <div className="flex-1 p-4 overflow-hidden">
          <div className="h-full">
            <Textarea
              ref={textAreaRef}
              placeholder="Start writing your note... (Ctrl+Enter to save)"
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              onKeyDown={handleKeyPress}
              className="h-full resize-none text-base leading-relaxed"
            />
          </div>
        </div>

        {/* AI Analysis Sidebar */}
        {showAnalysisSidebar && (
          <NotesAnalysisSidebar
            note={selectedNote}
            moduleData={moduleData}
            setModuleData={setModuleData}
            onShowToast={onShowToast}
          />
        )}
      </div>
    </div>
  );
};