// src/components/modules/notes/NotesAnalysisSidebar.tsx
import React from 'react';
import { Brain, Tag, Users, Calendar, MapPin, Clock, Plus } from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Note, ModuleData, AssistantAction } from '../../../../types/modules';
import { assistantEngine } from '../../../../lib/assistant-engine';
import { formatDate } from '../../../../utils/noteUtils';

interface NotesAnalysisSidebarProps {
  note: Note | null;
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
  onShowToast: (message: string, type: 'saving' | 'saved' | 'error') => void;
}

export const NotesAnalysisSidebar: React.FC<NotesAnalysisSidebarProps> = ({
  note,
  moduleData,
  setModuleData,
  onShowToast
}) => {
  if (!note) return null;

  const executeAssistantAction = async (action: AssistantAction) => {
    try {
      const result = assistantEngine.executeAction(action);
      
      // Add to appropriate module
      const updatedData = { ...moduleData };
      
      switch (action.type) {
        case 'create-task':
          updatedData.tasks = [result as any, ...updatedData.tasks];
          onShowToast('Task created successfully!', 'saved');
          break;
        case 'create-event':
          updatedData.calendar = [result as any, ...updatedData.calendar];
          onShowToast('Event added to calendar!', 'saved');
          break;
        case 'create-contact':
          updatedData.contacts = [result as any, ...updatedData.contacts];
          onShowToast('Contact saved!', 'saved');
          break;
        case 'create-project':
          updatedData.projects = [result as any, ...updatedData.projects];
          onShowToast('Project created!', 'saved');
          break;
      }
      
      // Mark action as executed in the note
      const updatedNote = {
        ...note,
        assistantActions: note.assistantActions?.map(a => 
          a.id === action.id ? { ...a, executed: true } : a
        )
      };
      const updatedNotes = moduleData.notes.map(n => 
        n.id === note.id ? updatedNote : n
      );
      updatedData.notes = updatedNotes;
      
      setModuleData(updatedData);
    } catch (error) {
      onShowToast('Failed to execute action', 'error');
      console.error('Error executing action:', error);
    }
  };

  return (
    <div className="w-80 border-l bg-card p-4 overflow-y-auto flex-shrink-0">
      <div className="space-y-6">
        {/* AI Analysis */}
        {note.aiAnalysis && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">AI Analysis</h3>
            </div>
            
            <div className="space-y-3">
              {/* Tags */}
              {note.tags.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <Tag className="h-3 w-3" />
                    <span className="text-xs font-medium">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {note.aiAnalysis.insights.length > 0 && (
                <div>
                  <span className="text-xs font-medium mb-2 block">Insights</span>
                  <div className="space-y-1">
                    {note.aiAnalysis.insights.map((insight, index) => (
                      <p key={index} className="text-xs text-muted-foreground bg-accent/50 rounded p-2">
                        {insight}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Entities */}
              {Object.values(note.aiAnalysis.extractedEntities).some(arr => arr.length > 0) && (
                <div>
                  <span className="text-xs font-medium mb-2 block">Detected Information</span>
                  <div className="space-y-2">
                    {note.aiAnalysis.extractedEntities.people.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="h-3 w-3" />
                          <span className="text-xs">People</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {note.aiAnalysis.extractedEntities.people.map((person, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {person}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {note.aiAnalysis.extractedEntities.dates.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">Dates</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {note.aiAnalysis.extractedEntities.dates.map((date, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {date}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {note.aiAnalysis.extractedEntities.locations.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">Locations</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {note.aiAnalysis.extractedEntities.locations.map((location, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Assistant Actions */}
        {note.assistantActions && note.assistantActions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Suggested Actions</h3>
            </div>
            
            <div className="space-y-2">
              {note.assistantActions.map((action) => (
                <Card key={action.id} className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{action.title}</span>
                      {action.executed && (
                        <Badge variant="secondary" className="text-xs">
                          ✓ Done
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                    {!action.executed && (
                      <Button
                        onClick={() => executeAssistantAction(action)}
                        size="sm"
                        className="w-full gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Execute
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Note Info</h3>
          </div>
          
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>Created: {formatDate(note.createdAt)}</div>
            {note.updatedAt !== note.createdAt && (
              <div>Updated: {formatDate(note.updatedAt)}</div>
            )}
            <div>Words: {note.wordCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};