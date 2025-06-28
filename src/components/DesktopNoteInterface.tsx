import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Search, Clock, FileText, Save, X, Loader2, Trash2, Brain, Tag, Users, Calendar, MapPin } from 'lucide-react';
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "./theme-toggle";
import { Toast } from "./ui/toast";
import { aiAnalyzer, type AnalysisResult } from "../lib/ai-analysis";

// Enhanced Note interface with AI analysis
interface Note {
  id: string;
  content: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  location: any;
  tags: string[];
  category: string;
  aiAnalysis?: AnalysisResult;
}
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

const ShadcnDesktopInterface = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: 'saving' | 'saved' | 'error';
  }>({
    show: false,
    message: '',
    type: 'saved'
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    noteId: string | null;
    step: 1 | 2;
  }>({
    show: false,
    noteId: null,
    step: 1
  });
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();

  const analyzeNoteContent = (content: string): AnalysisResult => {
    if (!content.trim()) {
      return {
        category: 'General',
        confidence: 0.5,
        tags: [],
        extractedEntities: {
          dates: [],
          emails: [],
          phones: [],
          people: [],
          tasks: [],
          locations: []
        },
        insights: [],
        priority: 'medium',
        suggestedActions: []
      };
    }
    
    return aiAnalyzer.analyzeNote(content);
  };

  const showToast = (message: string, type: 'saving' | 'saved' | 'error') => {
    setToast({
      show: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  const startDeleteNote = (noteId: string) => {
    setDeleteConfirm({
      show: true,
      noteId,
      step: 1
    });
  };

  const confirmDeleteNote = async () => {
    if (deleteConfirm.step === 1) {
      setDeleteConfirm(prev => ({ ...prev, step: 2 }));
    } else if (deleteConfirm.step === 2 && deleteConfirm.noteId) {
      // Show deleting toast immediately
      showToast('Deleting note...', 'saving');
      
      // Find the note being deleted for reference
      const noteToDelete = notes.find(note => note.id === deleteConfirm.noteId);
      
      // Update the notes state
      const updatedNotes = notes.filter(note => note.id !== deleteConfirm.noteId);
      setNotes(updatedNotes);
      
      // If we're currently editing the deleted note, clear the editor
      if (selectedNote?.id === deleteConfirm.noteId) {
        setSelectedNote(null);
        setCurrentNote('');
      }
      
      // Close the delete modal
      setDeleteConfirm({ show: false, noteId: null, step: 1 });
      
      // Save the updated notes and show completion
      await saveNotesAfterDelete(updatedNotes);
    }
  };

  const saveNotesAfterDelete = async (updatedNotes: any[]) => {
    if (window.electronAPI) {
      // Desktop app - save to file system
      try {
        const result = await window.electronAPI.saveNotes(updatedNotes);
        if (result.success) {
          showToast('Note deleted successfully!', 'saved');
        } else {
          console.error('Error saving after delete:', result.error);
          showToast('Note deleted but failed to save changes', 'error');
        }
      } catch (error) {
        console.error('Error saving after delete:', error);
        showToast('Note deleted but failed to save changes', 'error');
      }
    } else {
      // Browser fallback - save to localStorage
      try {
        // Add a small delay to show the deleting state
        await new Promise(resolve => setTimeout(resolve, 400));
        localStorage.setItem('aiNoteAssistant_notes', JSON.stringify(updatedNotes));
        showToast('Note deleted successfully!', 'saved');
      } catch (error) {
        console.error('Error saving to localStorage after delete:', error);
        showToast('Note deleted but failed to save changes', 'error');
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, noteId: null, step: 1 });
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Meeting': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Task': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Idea': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Contact': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'Project': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      'Finance': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'General': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'low': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  // Load notes from file system on component mount
  useEffect(() => {
    loadNotesFromFile();
  }, []);

  // Set up Electron menu listeners
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onMenuNewNote(() => {
        createNewNote();
      });

      window.electronAPI.onMenuSaveNote(() => {
        saveNotesToFile();
      });

      window.electronAPI.onMenuFind(() => {
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      });

      window.electronAPI.onMenuExportNotes((event, filePath) => {
        exportNotes(filePath);
      });

      window.electronAPI.onMenuImportNotes((event, filePath) => {
        importNotes(filePath);
      });

      window.electronAPI.onGlobalNewNote(() => {
        createNewNote();
      });
    }
  }, []);

  // Auto-save notes to file system whenever notes change
  useEffect(() => {
    if (!isLoading && notes.length >= 0) {
      const timeoutId = setTimeout(() => {
        saveNotesToFile();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [notes, isLoading]);

  // Track unsaved changes
  useEffect(() => {
    if (currentNote.trim() && !selectedNote) {
      setSaveStatus('unsaved');
    } else if (selectedNote && currentNote !== selectedNote.content) {
      setSaveStatus('unsaved');
    } else {
      setSaveStatus('saved');
    }
  }, [currentNote, selectedNote]);

  const loadNotesFromFile = async () => {
    if (window.electronAPI) {
      // Desktop app - use file system
      try {
        const result = await window.electronAPI.loadNotes();
        if (result.success && result.notes) {
          setNotes(result.notes);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    } else {
      // Browser fallback - use localStorage
      try {
        const savedNotes = localStorage.getItem('aiNoteAssistant_notes');
        if (savedNotes) {
          setNotes(JSON.parse(savedNotes));
        }
      } catch (error) {
        console.error('Error loading notes from localStorage:', error);
      }
    }
    setIsLoading(false);
  };

  const saveNotesWithToast = async (notesToSave: any[]) => {
    if (window.electronAPI) {
      // Desktop app - save to file system
      setSaveStatus('saving');
      
      try {
        const result = await window.electronAPI.saveNotes(notesToSave);
        if (result.success) {
          setSaveStatus('saved');
          showToast('Note saved successfully!', 'saved');
        } else {
          console.error('Error saving notes:', result.error);
          showToast('Failed to save note', 'error');
        }
      } catch (error) {
        console.error('Error saving notes:', error);
        showToast('Failed to save note', 'error');
      }
    } else {
      // Browser fallback - save to localStorage
      setSaveStatus('saving');
      
      try {
        // Add a small delay to show the saving state
        await new Promise(resolve => setTimeout(resolve, 500));
        localStorage.setItem('aiNoteAssistant_notes', JSON.stringify(notesToSave));
        setSaveStatus('saved');
        showToast('Note saved locally!', 'saved');
      } catch (error) {
        console.error('Error saving notes to localStorage:', error);
        showToast('Failed to save note', 'error');
      }
    }
  };

  const saveNotesToFile = async () => {
    if (window.electronAPI) {
      // Desktop app - save to file system
      setSaveStatus('saving');
      
      try {
        const result = await window.electronAPI.saveNotes(notes);
        if (result.success) {
          setSaveStatus('saved');
        } else {
          console.error('Error saving notes:', result.error);
        }
      } catch (error) {
        console.error('Error saving notes:', error);
      }
    } else {
      // Browser fallback - save to localStorage
      setSaveStatus('saving');
      
      try {
        localStorage.setItem('aiNoteAssistant_notes', JSON.stringify(notes));
        setSaveStatus('saved');
      } catch (error) {
        console.error('Error saving notes to localStorage:', error);
      }
    }
  };

  const exportNotes = async (filePath: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.exportNotes(notes, filePath);
        if (result.success) {
          console.log('Notes exported successfully');
        }
      } catch (error) {
        console.error('Error exporting notes:', error);
      }
    } else {
      // Browser fallback - download as JSON file
      const dataStr = JSON.stringify(notes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'notes-export.json';
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const importNotes = async (filePath: string) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.importNotes(filePath);
        if (result.success && result.notes) {
          const importedNotes = result.notes.map((note: any) => ({
            ...note,
            id: `${note.id}_imported_${Date.now()}`
          }));
          setNotes(prev => [...importedNotes, ...prev]);
        }
      } catch (error) {
        console.error('Error importing notes:', error);
      }
    }
  };

  const createNote = async () => {
    if (currentNote.trim()) {
      // Show saving toast immediately when button is clicked
      showToast('Analyzing and saving note...', 'saving');
      
      // Analyze the note content with AI
      const analysis = analyzeNoteContent(currentNote.trim());
      
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
        aiAnalysis: analysis
      };

      const updatedNotes = [newNote, ...notes];
      setNotes(updatedNotes);
      setCurrentNote('');
      setSelectedNote(null);
      
      // Now save the notes and show completion toast
      await saveNotesWithToast(updatedNotes);
    }
  };

  const createNewNote = () => {
    setCurrentNote('');
    setSelectedNote(null);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (selectedNote) {
        updateNote();
      } else {
        createNote();
      }
    }
    if (e.key === 'Escape') {
      setShowSearch(false);
    }
  };

  const selectNote = (note: any) => {
    setSelectedNote(note);
    setCurrentNote(note.content);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  const updateNote = async () => {
    if (selectedNote && currentNote.trim()) {
      // Show saving toast immediately when button is clicked
      showToast('Analyzing and updating note...', 'saving');
      
      // Re-analyze the note content
      const analysis = analyzeNoteContent(currentNote.trim());
      
      const updatedNote: Note = {
        ...selectedNote,
        content: currentNote.trim(),
        title: currentNote.trim().split('\n')[0].substring(0, 35) + (currentNote.trim().split('\n')[0].length > 35 ? '...' : ''),
        updatedAt: new Date().toISOString(),
        wordCount: currentNote.trim().split(/\s+/).length,
        tags: analysis.tags,
        category: analysis.category,
        aiAnalysis: analysis
      };

      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id ? updatedNote : note
      );
      setNotes(updatedNotes);
      setSelectedNote(updatedNote);
      
      // Now save the notes and show completion toast
      await saveNotesWithToast(updatedNotes);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'unsaved': return <div className="h-2 w-2 bg-destructive rounded-full" />;
      case 'saved': return <div className="h-2 w-2 bg-green-500 rounded-full" />;
      default: return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'unsaved': return 'Unsaved changes';
      case 'saved': return 'All changes saved';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-96 border-r bg-card flex flex-col h-screen">
        {/* Header - Fixed */}
        <div className="p-4 border-b space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-foreground">AI Note Assistant</h1>
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button
                onClick={createNewNote}
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
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setShowSearch(false);
                    setSearchTerm('');
                  }
                }}
                className="pl-10 pr-10 text-sm"
              />
              <Button
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                }}
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              variant="outline"
              className="w-full justify-start text-muted-foreground text-sm"
            >
              <Search className="mr-2 h-4 w-4" />
              Search notes... (Ctrl+F)
            </Button>
          )}
        </div>

        {/* Stats Card - Fixed */}
        <div className="p-4 flex-shrink-0">
          <Card>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-foreground text-base">{notes.length}</div>
                  <div className="text-muted-foreground text-xs">Total Notes</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground text-base">
                    {notes.reduce((acc, note) => acc + note.wordCount, 0)}
                  </div>
                  <div className="text-muted-foreground text-xs">Total Words</div>
                </div>
              </div>
              
              {/* Save Status */}
              <Separator className="my-2" />
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                {getSaveStatusIcon()}
                <span>{getSaveStatusText()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes List - Scrollable */}
        <div className="flex-1 px-4 pb-4 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-3 pr-4">
              {filteredNotes.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">
                      {searchTerm ? 'No notes match your search' : 'No notes yet. Start writing!'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNote?.id === note.id 
                        ? 'ring-2 ring-primary bg-accent' 
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h3 
                          className="font-medium text-foreground text-sm flex-1 cursor-pointer mr-2 leading-tight break-words overflow-hidden"
                          onClick={() => selectNote(note)}
                          style={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                          }}
                        >
                          {note.title}
                        </h3>
                        <div className="flex items-center space-x-1 flex-shrink-0 ml-1">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5 whitespace-nowrap">
                            {note.wordCount}w
                          </Badge>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              startDeleteNote(note.id);
                            }}
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {/* AI Analysis Section */}
                      <div className="flex items-center gap-1 mb-2">
                        <Badge className={`text-xs px-1.5 py-0.5 ${getCategoryColor(note.category)}`}>
                          {note.category}
                        </Badge>
                        {note.aiAnalysis && (
                          <Badge className={`text-xs px-1.5 py-0.5 ${getPriorityColor(note.aiAnalysis.priority)}`}>
                            {note.aiAnalysis.priority}
                          </Badge>
                        )}
                        {note.aiAnalysis && note.aiAnalysis.confidence > 0.7 && (
                          <Brain className="h-3 w-3 text-primary" />
                        )}
                      </div>

                      {/* Tags */}
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {note.tags.slice(0, 3).map((tag: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs px-1 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              +{note.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      <p 
                        className="text-sm text-muted-foreground line-clamp-2 mb-2 cursor-pointer leading-relaxed"
                        onClick={() => selectNote(note)}
                      >
                        {note.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(note.createdAt)}
                        </div>
                        {note.createdAt !== note.updatedAt && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            edited
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Toolbar - Fixed */}
        <div className="bg-card border-b p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedNote ? 'Edit Note' : 'New Note'}
              </h2>
              {selectedNote && (
                <Button
                  onClick={createNewNote}
                  variant="ghost"
                  size="sm"
                >
                  New Note
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {window.electronAPI ? `Desktop App (${window.electronAPI.platform})` : 'Browser Mode'}
              </Badge>
              
              <Badge variant="secondary">
                {currentNote.trim() ? `${currentNote.trim().split(/\s+/).length} words` : '0 words'}
              </Badge>
              
              <Button
                onClick={selectedNote ? updateNote : createNote}
                disabled={!currentNote.trim()}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                {selectedNote ? 'Update' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>

        {/* Note Input Area - Scrollable */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex gap-6">
            {/* Main Textarea */}
            <div className="flex-1">
              <Textarea
                ref={textAreaRef}
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Start writing your note... (Ctrl/Cmd + Enter to save)"
                className="w-full h-full resize-none text-base leading-relaxed"
              />
            </div>

            {/* AI Insights Panel */}
            {currentNote.trim() && (
              <div className="w-80 flex-shrink-0">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">AI Analysis</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const analysis = analyzeNoteContent(currentNote);
                      return (
                        <>
                          {/* Category & Priority */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-medium text-muted-foreground">CLASSIFICATION</h4>
                            <div className="flex gap-2">
                              <Badge className={getCategoryColor(analysis.category)}>
                                {analysis.category}
                              </Badge>
                              <Badge className={getPriorityColor(analysis.priority)}>
                                {analysis.priority} priority
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Confidence: {Math.round(analysis.confidence * 100)}%
                            </div>
                          </div>

                          {/* Tags */}
                          {analysis.tags.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-muted-foreground">TAGS</h4>
                              <div className="flex flex-wrap gap-1">
                                {analysis.tags.map((tag: string, index: number) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Extracted Entities */}
                          {(analysis.extractedEntities.people.length > 0 || 
                            analysis.extractedEntities.dates.length > 0 || 
                            analysis.extractedEntities.emails.length > 0) && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-muted-foreground">EXTRACTED INFO</h4>
                              
                              {analysis.extractedEntities.people.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    People
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {analysis.extractedEntities.people.slice(0, 3).map((person: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {person}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {analysis.extractedEntities.dates.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    Dates
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {analysis.extractedEntities.dates.slice(0, 3).map((date: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {date}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {analysis.extractedEntities.emails.length > 0 && (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <FileText className="h-3 w-3" />
                                    Contacts
                                  </div>
                                  <div className="space-y-1">
                                    {analysis.extractedEntities.emails.slice(0, 2).map((email: string, index: number) => (
                                      <div key={index} className="text-xs text-foreground bg-muted px-2 py-1 rounded">
                                        {email}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Insights */}
                          {analysis.insights.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-muted-foreground">INSIGHTS</h4>
                              <div className="space-y-1">
                                {analysis.insights.slice(0, 3).map((insight: string, index: number) => (
                                  <div key={index} className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
                                    {insight}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested Actions */}
                          {analysis.suggestedActions.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-muted-foreground">SUGGESTED ACTIONS</h4>
                              <div className="space-y-1">
                                {analysis.suggestedActions.map((action: string, index: number) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-xs h-7"
                                    onClick={() => {
                                      // Future: Implement action handlers
                                      showToast(`Action: ${action}`, 'saved');
                                    }}
                                  >
                                    {action}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Status Bar - Fixed */}
        <div className="bg-muted/30 border-t px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-6">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+N</kbd>
              <span>New Note</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd>
              <span>Save</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+F</kbd>
              <span>Search</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Shift+N</kbd>
              <span>Quick Capture</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedNote && (
                <div className="text-xs">
                  Created: {formatDate(selectedNote.createdAt)}
                  {selectedNote.createdAt !== selectedNote.updatedAt && 
                    <span className="ml-2">• Modified: {formatDate(selectedNote.updatedAt)}</span>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 shadow-xl">
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">
                {deleteConfirm.step === 1 ? 'Delete Note?' : 'Are you sure?'}
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {deleteConfirm.step === 1 
                  ? 'This action cannot be undone. The note will be permanently deleted.'
                  : 'This is your final confirmation. The note will be permanently deleted and cannot be recovered.'
                }
              </p>
              
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={cancelDelete}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmDeleteNote}
                  variant="destructive"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleteConfirm.step === 1 ? 'Delete' : 'Confirm Delete'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Features Preview Card */}
      {/* <div className="fixed top-4 right-4 z-40">
        <Card className="w-64 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2 text-sm font-medium">
              <Brain className="h-4 w-4 text-primary" />
              <span>AI Analysis Active</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Smart categorization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Auto-tag generation</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Entity extraction</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Priority detection</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Smart insights</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span>Action suggestions</span>
            </div>
            <Separator className="my-2" />
            <div className="text-xs font-medium text-muted-foreground mb-1">Coming Soon:</div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full" />
              <span>Calendar integration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full" />
              <span>Advanced AI (GPT-4)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-1.5 bg-muted-foreground/50 rounded-full" />
              <span>Team collaboration</span>
            </div>
          </CardContent>
        </Card>
      </div> */}

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



export default ShadcnDesktopInterface;