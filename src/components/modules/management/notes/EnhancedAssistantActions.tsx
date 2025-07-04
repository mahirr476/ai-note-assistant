// src/components/modules/notes/EnhancedAssistantActions.tsx (Final Fixed Version)
import React, { useState } from 'react';
import { Brain, Plus, ListTodo, CheckSquare, Calendar, User, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { Note, ModuleData, AssistantAction } from '../../../../types/modules';
import { CreateTodoListModal } from '../tasks/CreateTodoListModal';

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
  const [showTodoListModal, setShowTodoListModal] = useState(false);
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [executedActions, setExecutedActions] = useState<Set<string>>(new Set());

  if (!note.assistantActions || note.assistantActions.length === 0) {
    return null;
  }

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
    if (action.executed || executingActions.has(action.id) || executedActions.has(action.id)) {
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
      
      // Mark action as executed in local state AND note data
      setExecutedActions(prev => new Set(prev).add(action.id));
      
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
      selectedActions.has(action.id) && !action.executed && !executedActions.has(action.id)
    ) || [];

    if (actionsToExecute.length === 0) return;

    try {
      const updatedData = { ...moduleData };
      let executedCount = 0;

      for (const action of actionsToExecute) {
        if (!executedActions.has(action.id)) {
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
          
          setExecutedActions(prev => new Set(prev).add(action.id));
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

  const createTodoListFromAllTasks = () => {
    if (taskActions.length === 0) return;
    
    // Auto-generate a todo list name based on the note title
    const defaultName = `${note.title.substring(0, 30)}${note.title.length > 30 ? '...' : ''} - Tasks`;
    setShowTodoListModal(true);
  };

  const handleTodoListSave = async (todoListData: any) => {
    try {
      const updatedData = { ...moduleData };
      let createdCount = 0;
      
      // Handle selected task actions from the note
      if (todoListData.selectedActions && todoListData.selectedActions.length > 0) {
        const selectedTaskActions = taskActions.filter(action => 
          todoListData.selectedActions.includes(action.id)
        );

        // Execute selected task actions
        for (const action of selectedTaskActions) {
          if (!executedActions.has(action.id)) {
            const result = await executeAction(action);
            updatedData.tasks = [result as any, ...updatedData.tasks];
            setExecutedActions(prev => new Set(prev).add(action.id));
            createdCount++;
          }
        }

        // Mark executed actions as completed in the note
        const updatedNote = {
          ...note,
          assistantActions: note.assistantActions?.map(a => 
            selectedTaskActions.some(sa => sa.id === a.id) ? { ...a, executed: true } : a
          )
        };
        const updatedNotes = moduleData.notes.map(n => 
          n.id === note.id ? updatedNote : n
        );
        updatedData.notes = updatedNotes;
      }

      // Create new tasks from the modal
      for (const newTask of todoListData.newTasks || []) {
        const task = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: newTask.title,
          description: newTask.description || `From todo list: ${todoListData.name}`,
          completed: false,
          priority: newTask.priority,
          dueDate: newTask.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sourceNoteId: note.id,
          category: todoListData.category || 'Todo List',
          tags: [`todo-list:${todoListData.name.toLowerCase().replace(/\s+/g, '-')}`]
        };
        updatedData.tasks = [task, ...updatedData.tasks];
        createdCount++;
      }

      // Handle selected existing tasks (if any)
      if (todoListData.selectedTasks && todoListData.selectedTasks.length > 0) {
        const updatedTasks = updatedData.tasks.map(task => {
          if (todoListData.selectedTasks.includes(task.id)) {
            return {
              ...task,
              tags: [...task.tags, `todo-list:${todoListData.name.toLowerCase().replace(/\s+/g, '-')}`],
              updatedAt: new Date().toISOString()
            };
          }
          return task;
        });
        updatedData.tasks = updatedTasks;
      }

      setModuleData(updatedData);
      setShowTodoListModal(false);
      onShowToast(`Todo list "${todoListData.name}" created with ${createdCount} tasks!`, 'saved');
    } catch (error) {
      onShowToast('Failed to create todo list', 'error');
      console.error('Error creating todo list:', error);
    }
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

  const isActionExecuted = (action: AssistantAction) => {
    return action.executed || executedActions.has(action.id);
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
                      variant="outline"
                      className="gap-1 text-xs"
                    >
                      <ListTodo className="h-3 w-3" />
                      Create Todo List
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {taskActions.map((action) => (
                  <div key={action.id} className="flex items-start space-x-2 p-2 rounded border">
                    <Checkbox
                      checked={selectedActions.has(action.id)}
                      onCheckedChange={(checked) => handleActionSelection(action.id, checked as boolean)}
                      disabled={isActionExecuted(action)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{action.title}</span>
                        <div className="flex items-center gap-2">
                          {isActionExecuted(action) && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Done
                            </Badge>
                          )}
                          {!isActionExecuted(action) && (
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
                      onCheckedChange={(checked) => handleActionSelection(action.id, checked as boolean)}
                      disabled={isActionExecuted(action)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconComponent className={`h-4 w-4 ${getActionColor(action.type)}`} />
                          <span className="text-sm font-medium">{action.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isActionExecuted(action) && (
                            <Badge variant="secondary" className="text-xs">
                              ✓ Done
                            </Badge>
                          )}
                          {!isActionExecuted(action) && (
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

      {/* Todo List Modal */}
      {showTodoListModal && (
        <CreateTodoListModal
          tasks={moduleData.tasks}
          availableActions={taskActions}
          defaultName={`${note.title.substring(0, 30)}${note.title.length > 30 ? '...' : ''} - Tasks`}
          onClose={() => setShowTodoListModal(false)}
          onSave={handleTodoListSave}
        />
      )}
    </div>
  );
};