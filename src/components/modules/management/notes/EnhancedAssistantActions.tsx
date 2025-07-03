// src/components/modules/notes/EnhancedAssistantActions.tsx (Fixed)
import React, { useState, useEffect } from 'react';
import { Brain, Plus, ListTodo, CheckSquare, Calendar, User, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { Note, ModuleData, AssistantAction } from '../../../../types/modules';

interface EnhancedAssistantActionsProps {
  note: Note;
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
  onShowToast: (message: string, type: 'saving' | 'saved' | 'error') => void;
}

export const EnhancedAssistantActions: React.FC<EnhancedAssistantActionsProps> = ({
  note,
  moduleData,
  setModuleData,
  onShowToast
}) => {
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());

  if (!note.assistantActions || note.assistantActions.length === 0) {
    return null;
  }

  // Check if action is actually executed by looking for created items in moduleData
  const isActionReallyExecuted = (action: AssistantAction): boolean => {
    // First check if it's marked as executed in the note
    if (action.executed) return true;
    
    // Then check if the item actually exists in the moduleData
    switch (action.type) {
      case 'create-task':
        return moduleData.tasks?.some(task => 
          task.sourceNoteId === action.sourceNoteId && 
          task.title === action.data.title
        ) || false;
        
      case 'create-event':
        return moduleData.calendar?.some(event => 
          event.sourceNoteId === action.sourceNoteId && 
          event.title === action.data.title
        ) || false;
        
      case 'create-contact':
        return moduleData.contacts?.some(contact => 
          contact.sourceNoteId === action.sourceNoteId && 
          contact.name === action.data.name
        ) || false;
        
      case 'create-project':
        return moduleData.projects?.some(project => 
          project.sourceNoteId === action.sourceNoteId && 
          project.name === action.data.name
        ) || false;
        
      default:
        return false;
    }
  };

  // Update the note's action execution status based on what actually exists
  useEffect(() => {
    let needsUpdate = false;
    const updatedActions = note.assistantActions?.map(action => {
      const actuallyExecuted = isActionReallyExecuted(action);
      if (action.executed !== actuallyExecuted) {
        needsUpdate = true;
        return { ...action, executed: actuallyExecuted };
      }
      return action;
    });

    if (needsUpdate && updatedActions) {
      const updatedNote = { ...note, assistantActions: updatedActions };
      const updatedNotes = moduleData.notes.map(n => 
        n.id === note.id ? updatedNote : n
      );
      setModuleData({ ...moduleData, notes: updatedNotes });
    }
  }, [note.id, moduleData]); // Re-run when moduleData changes

  // Group actions by type
  const taskActions = note.assistantActions.filter(action => action.type === 'create-task');
  const otherActions = note.assistantActions.filter(action => action.type !== 'create-task');

  const handleActionSelection = (actionId: string, checked: boolean) => {
    const newSelected = new Set(selectedActions);
    if (checked) {
      newSelected.add(actionId);
    } else {
      newSelected.delete(actionId);
    }
    setSelectedActions(newSelected);
  };

  const executeAction = async (action: AssistantAction) => {
    const now = new Date().toISOString();
    const baseId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    switch (action.type) {
      case 'create-task':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          completed: false,
          ...action.data
        };
        
      case 'create-event':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          allDay: false,
          attendees: [],
          ...action.data
        };
        
      case 'create-contact':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          tags: [],
          ...action.data
        };
        
      case 'create-project':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          status: 'planning',
          progress: 0,
          tasks: [],
          team: [],
          tags: [],
          ...action.data
        };
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  };

  const executeSingleAction = async (action: AssistantAction) => {
    // Check if already executed or executing
    if (isActionReallyExecuted(action) || executingActions.has(action.id)) {
      return;
    }

    // Mark as executing immediately
    setExecutingActions(prev => new Set(prev).add(action.id));
    
    try {
      const result = await executeAction(action);
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
      
      // Mark action as executed in note data
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
    } finally {
      // Remove from executing state
      setExecutingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(action.id);
        return newSet;
      });
    }
  };

  const executeSelectedActions = async () => {
    const actionsToExecute = note.assistantActions?.filter(action => 
      selectedActions.has(action.id) && !isActionReallyExecuted(action)
    ) || [];

    if (actionsToExecute.length === 0) return;

    try {
      const updatedData = { ...moduleData };
      let executedCount = 0;

      for (const action of actionsToExecute) {
        if (!isActionReallyExecuted(action)) {
          const result = await executeAction(action);
          
          switch (action.type) {
            case 'create-task':
              updatedData.tasks = [result as any, ...updatedData.tasks];
              break;
            case 'create-event':
              updatedData.calendar = [result as any, ...updatedData.calendar];
              break;
            case 'create-contact':
              updatedData.contacts = [result as any, ...updatedData.contacts];
              break;
            case 'create-project':
              updatedData.projects = [result as any, ...updatedData.projects];
              break;
          }
          
          executedCount++;
        }
      }

      // Mark actions as executed in note
      const updatedNote = {
        ...note,
        assistantActions: note.assistantActions?.map(a => 
          selectedActions.has(a.id) ? { ...a, executed: true } : a
        )
      };
      const updatedNotes = moduleData.notes.map(n => 
        n.id === note.id ? updatedNote : n
      );
      updatedData.notes = updatedNotes;

      setModuleData(updatedData);
      setSelectedActions(new Set());
      onShowToast(`${executedCount} actions executed successfully!`, 'saved');
    } catch (error) {
      onShowToast('Failed to execute actions', 'error');
      console.error('Error executing actions:', error);
    }
  };

  const createTodoListFromAllTasks = async () => {
    if (taskActions.length === 0) return;
    
    try {
      onShowToast('Creating todo list...', 'saving');
      
      const updatedData = { ...moduleData };
      let createdCount = 0;
      
      // Auto-generate a smart todo list name based on the note content
      const listName = generateTodoListName(note.title, note.content);
      const listTag = `todo-list:${listName.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Execute all task actions and add them to the todo list
      for (const action of taskActions) {
        if (!isActionReallyExecuted(action)) {
          const result = await executeAction(action);
          // Add the todo list tag to the created task
          const taskWithTodoTag = {
            ...result,
            tags: [...(result.tags || []), listTag]
          };
          updatedData.tasks = [taskWithTodoTag as any, ...updatedData.tasks];
          createdCount++;
        }
      }
      
      // Mark all task actions as executed in the note
      const updatedNote = {
        ...note,
        assistantActions: note.assistantActions?.map(a => 
          taskActions.some(ta => ta.id === a.id) ? { ...a, executed: true } : a
        )
      };
      const updatedNotes = moduleData.notes.map(n => 
        n.id === note.id ? updatedNote : n
      );
      updatedData.notes = updatedNotes;
      
      setModuleData(updatedData);
      onShowToast(`Todo list "${listName}" created with ${createdCount} tasks!`, 'saved');
    } catch (error) {
      onShowToast('Failed to create todo list', 'error');
      console.error('Error creating todo list:', error);
    }
  };

  const generateTodoListName = (title: string, content: string): string => {
    // Extract key themes from the note
    const titleWords = title.toLowerCase().split(/\s+/).filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(word)
    );
    
    // Look for project or category indicators
    const projectKeywords = ['project', 'website', 'app', 'system', 'platform', 'product'];
    const meetingKeywords = ['meeting', 'call', 'conference', 'discussion'];
    const businessKeywords = ['budget', 'financial', 'review', 'quarterly', 'business'];
    
    const lowerContent = content.toLowerCase();
    
    // Generate smart name based on content
    if (projectKeywords.some(keyword => lowerContent.includes(keyword))) {
      const projectWord = titleWords.find(word => 
        projectKeywords.some(keyword => word.includes(keyword.slice(0, -1)))
      ) || titleWords[0];
      return `${projectWord?.charAt(0).toUpperCase()}${projectWord?.slice(1)} Project Tasks`;
    }
    
    if (meetingKeywords.some(keyword => lowerContent.includes(keyword))) {
      return `${titleWords[0]?.charAt(0).toUpperCase()}${titleWords[0]?.slice(1)} Meeting Action Items`;
    }
    
    if (businessKeywords.some(keyword => lowerContent.includes(keyword))) {
      return `${titleWords[0]?.charAt(0).toUpperCase()}${titleWords[0]?.slice(1)} Business Tasks`;
    }
    
    // Default naming strategy
    if (titleWords.length > 0) {
      const mainWord = titleWords[0];
      return `${mainWord.charAt(0).toUpperCase()}${mainWord.slice(1)} Tasks`;
    }
    
    // Fallback
    return `Note Tasks - ${new Date().toLocaleDateString()}`;
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create-task': return CheckSquare;
      case 'create-event': return Calendar;
      case 'create-contact': return User;
      case 'create-project': return Briefcase;
      default: return Plus;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'create-task': return 'text-green-600';
      case 'create-event': return 'text-purple-600';
      case 'create-contact': return 'text-orange-600';
      case 'create-project': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  const isActionExecuting = (action: AssistantAction) => {
    return executingActions.has(action.id);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Brain className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Suggested Actions</h3>
        {selectedActions.size > 0 && (
          <Badge variant="secondary" className="text-xs">
            {selectedActions.size} selected
          </Badge>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Task Actions Section */}
        {taskActions.length > 0 && (
          <Card className="p-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Task Actions ({taskActions.length})</span>
                </div>
                <div className="flex items-center gap-2">
                  {taskActions.length > 1 && (
                    <Button
                      onClick={createTodoListFromAllTasks}
                      size="sm"
                      variant="default"
                      className="gap-1 text-xs"
                    >
                      <ListTodo className="h-3 w-3" />
                      Quick Todo List
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {taskActions.map((action) => (
                  <div key={action.id} className="flex items-start space-x-2 p-2 rounded border">
                    <Checkbox
                      checked={selectedActions.has(action.id)}
                      onCheckedChange={(checked: boolean) => handleActionSelection(action.id, checked as boolean)}
                      disabled={isActionReallyExecuted(action)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{action.title}</span>
                        <div className="flex items-center gap-2">
                          {isActionReallyExecuted(action) && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Done
                            </Badge>
                          )}
                          {!isActionReallyExecuted(action) && (
                            <Button
                              onClick={() => executeSingleAction(action)}
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-xs h-6"
                              disabled={isActionExecuting(action)}
                            >
                              {isActionExecuting(action) ? (
                                <>Creating...</>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" />
                                  Create
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Other Actions */}
        {otherActions.length > 0 && (
          <div className="space-y-2">
            {otherActions.map((action) => {
              const IconComponent = getActionIcon(action.type);
              return (
                <Card key={action.id} className="p-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      checked={selectedActions.has(action.id)}
                      onCheckedChange={(checked: boolean) => handleActionSelection(action.id, checked as boolean)}
                      disabled={isActionReallyExecuted(action)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${getActionColor(action.type)}`} />
                          <span className="text-sm font-medium">{action.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActionReallyExecuted(action) && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Done
                            </Badge>
                          )}
                          {!isActionReallyExecuted(action) && (
                            <Button
                              onClick={() => executeSingleAction(action)}
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-xs h-6"
                              disabled={isActionExecuting(action)}
                            >
                              {isActionExecuting(action) ? (
                                <>Creating...</>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3" />
                                  Create
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Bulk Actions */}
        {selectedActions.size > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={executeSelectedActions}
              size="sm"
              className="gap-1 flex-1"
            >
              <Plus className="h-3 w-3" />
              Execute {selectedActions.size} Action{selectedActions.size > 1 ? 's' : ''}
            </Button>
            <Button
              onClick={() => setSelectedActions(new Set())}
              size="sm"
              variant="outline"
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};