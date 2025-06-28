// src/components/modules/NotesModule.tsx
import React, { useState } from 'react';
import { ModuleData, Note } from '../../types/modules';
import { NotesSidebar } from './management/notes/NotesSidebar';
import { NotesEditor } from './management/notes/NotesEditor';
import { aiAnalyzer } from '../../lib/ai-analysis';
import { assistantEngine } from '../../lib/assistant-engine';

interface NotesModuleProps {
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

export const NotesModule: React.FC<NotesModuleProps> = ({
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
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [currentNote, setCurrentNote] = useState('');

  // Filter notes based on search term
  const filteredNotes = moduleData.notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const createNote = async () => {
    if (currentNote.trim()) {
      onShowToast('Analyzing and saving note...', 'saving');
      
      const analysis = aiAnalyzer.analyzeNote(currentNote.trim());
      const assistantActions = assistantEngine.generateActions(analysis, currentNote.trim(), Date.now().toString());
      
      const newNote: Note = {
        id: Date.now().toString(),
        content: currentNote.trim(),
        title: currentNote.trim().split('\n')[0].substring(0, 35) + (currentNote.trim().split('\n')[0].length > 35 ? '...' : ''),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: currentNote.trim().split(/\s+/).length,
        location: null,
        tags: analysis.tags,
        category: analysis.category,
        aiAnalysis: analysis,
        assistantActions: assistantActions
      };

      const updatedData = { ...moduleData, notes: [newNote, ...moduleData.notes] };
      setModuleData(updatedData);
      setCurrentNote('');
      setSelectedNote(null);
      onShowToast('Note saved successfully!', 'saved');
    }
  };

  const updateNote = async () => {
    if (selectedNote && currentNote.trim()) {
      onShowToast('Analyzing and updating note...', 'saving');
      
      const analysis = aiAnalyzer.analyzeNote(currentNote.trim());
      const assistantActions = assistantEngine.generateActions(analysis, currentNote.trim(), selectedNote.id);
      
      const updatedNote: Note = {
        ...selectedNote,
        content: currentNote.trim(),
        title: currentNote.trim().split('\n')[0].substring(0, 35) + (currentNote.trim().split('\n')[0].length > 35 ? '...' : ''),
        updatedAt: new Date().toISOString(),
        wordCount: currentNote.trim().split(/\s+/).length,
        tags: analysis.tags,
        category: analysis.category,
        aiAnalysis: analysis,
        assistantActions: assistantActions
      };

      const updatedNotes = moduleData.notes.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      );
      const updatedData = { ...moduleData, notes: updatedNotes };
      setModuleData(updatedData);
      setSelectedNote(updatedNote);
      onShowToast('Note updated successfully!', 'saved');
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setCurrentNote(note.content);
  };

  const createNewNote = () => {
    setCurrentNote('');
    setSelectedNote(null);
  };

  return (
    <>
      {/* Notes Sidebar */}
      <NotesSidebar
        notes={filteredNotes}
        selectedNote={selectedNote}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        showSearch={showSearch}
        setShowSearch={setShowSearch}
        saveStatus={saveStatus}
        onSelectNote={selectNote}
        onCreateNew={createNewNote}
        onDeleteNote={onDeleteNote}
        totalNotes={moduleData.notes.length}
        totalWords={moduleData.notes.reduce((acc, note) => acc + note.wordCount, 0)}
      />

      {/* Notes Editor */}
      <NotesEditor
        selectedNote={selectedNote}
        currentNote={currentNote}
        setCurrentNote={setCurrentNote}
        saveStatus={saveStatus}
        onSave={selectedNote ? updateNote : createNote}
        onDelete={selectedNote ? () => onDeleteNote(selectedNote.id) : undefined}
        moduleData={moduleData}
        setModuleData={setModuleData}
        onShowToast={onShowToast}
      />
    </>
  );
};