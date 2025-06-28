// src/components/modules/notes/NotesSidebar.tsx
import React, { useRef } from 'react';
import { PlusCircle, Search, X, Clock, FileText } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Card, CardContent } from '../../../ui/card';
import { ScrollArea } from '../../../ui/scroll-area';
import { Separator } from '../../../ui/separator';
import { NotesStatsCard } from './NotesStatsCard';
import { NoteListItem } from './NoteListItem';
import { Note } from '../../../../types/modules';

interface NotesSidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  showSearch: boolean;
  setShowSearch: (show: boolean) => void;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  onSelectNote: (note: Note) => void;
  onCreateNew: () => void;
  onDeleteNote: (noteId: string) => void;
  totalNotes: number;
  totalWords: number;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  notes,
  selectedNote,
  searchTerm,
  setSearchTerm,
  showSearch,
  setShowSearch,
  saveStatus,
  onSelectNote,
  onCreateNew,
  onDeleteNote,
  totalNotes,
  totalWords
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearchToggle = () => {
    setShowSearch(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleSearchClose();
    }
  };

  return (
    <div className="w-96 border-r bg-card flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b space-y-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Notes</h1>
            <p className="text-sm text-muted-foreground">
              {notes.length} notes
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={onCreateNew}
              size="icon"
              variant="outline"
              className="h-8 w-8"
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        {showSearch ? (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              ref={searchInputRef}
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-10 text-sm"
            />
            <Button
              onClick={handleSearchClose}
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSearchToggle}
            variant="outline"
            className="w-full justify-start text-muted-foreground text-sm"
          >
            <Search className="mr-2 h-4 w-4" />
            Search notes... (Ctrl+F)
          </Button>
        )}
      </div>

      {/* Stats Card */}
      <NotesStatsCard
        totalNotes={totalNotes}
        totalWords={totalWords}
        saveStatus={saveStatus}
      />

      {/* Notes List */}
      <div className="flex-1 px-4 pb-4 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-3">
            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">
                    {searchTerm ? 'No notes match your search' : 'No notes yet. Start writing!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              notes.map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isSelected={selectedNote?.id === note.id}
                  onClick={() => onSelectNote(note)}
                  onDelete={() => onDeleteNote(note.id)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};