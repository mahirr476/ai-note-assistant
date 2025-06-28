// src/components/modules/tasks/CreateTodoListModal.tsx (Updated)
import React, { useState } from 'react';
import { X, ListTodo, Plus, Check, Trash2, FileText, Calendar, Flag } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { ScrollArea } from '../../../ui/scroll-area';
import { Separator } from '../../../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Task, AssistantAction } from '../../../../types/modules';
import { getCategoryColor, getPriorityColor } from '../../../../utils/noteUtils';

interface CreateTodoListModalProps {
  tasks: Task[];
  availableActions?: AssistantAction[]; // Actions from notes
  defaultName?: string;
  onClose: () => void;
  onSave: (todoListData: {
    name: string;
    description: string;
    category: string;
    selectedTasks: string[];
    selectedActions: string[]; // Actions from notes
    newTasks: { 
      title: string; 
      description: string; 
      priority: Task['priority'];
      dueDate?: string;
    }[];
  }) => void;
}

export const CreateTodoListModal: React.FC<CreateTodoListModalProps> = ({
  tasks,
  availableActions = [],
  defaultName = '',
  onClose,
  onSave
}) => {
  const [listName, setListName] = useState(defaultName);
  const [listDescription, setListDescription] = useState('');
  const [listCategory, setListCategory] = useState('Todo List');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [newTasks, setNewTasks] = useState<{ 
    title: string; 
    description: string; 
    priority: Task['priority'];
    dueDate?: string;
  }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Filter available tasks (not completed)
  const availableTasks = tasks.filter(task => !task.completed);

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleActionSelection = (actionId: string, checked: boolean) => {
    const newSelected = new Set(selectedActions);
    if (checked) {
      newSelected.add(actionId);
    } else {
      newSelected.delete(actionId);
    }
    setSelectedActions(newSelected);
  };

  const addNewTask = () => {
    if (newTaskTitle.trim()) {
      setNewTasks(prev => [...prev, {
        title: newTaskTitle.trim(),
        description: '',
        priority: 'medium',
        dueDate: undefined
      }]);
      setNewTaskTitle('');
    }
  };

  const removeNewTask = (index: number) => {
    setNewTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateNewTask = (index: number, updates: Partial<typeof newTasks[0]>) => {
    setNewTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  };

  const handleSave = () => {
    if (!listName.trim()) return;

    onSave({
      name: listName.trim(),
      description: listDescription.trim(),
      category: listCategory,
      selectedTasks: Array.from(selectedTasks),
      selectedActions: Array.from(selectedActions),
      newTasks
    });
  };

  const totalItems = selectedTasks.size + selectedActions.size + newTasks.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Create Todo List
            </CardTitle>
            <div className="flex items-center gap-2">
              {totalItems > 0 && (
                <Badge variant="secondary">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </Badge>
              )}
              <Button onClick={onClose} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            {/* Left Side - List Details */}
            <div className="p-6 border-r">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">List Name *</label>
                  <Input
                    placeholder="Enter list name..."
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Textarea
                    placeholder="Enter list description..."
                    value={listDescription}
                    onChange={(e) => setListDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Input
                    placeholder="Enter category..."
                    value={listCategory}
                    onChange={(e) => setListCategory(e.target.value)}
                  />
                </div>

                <Separator />

                {/* Add New Tasks */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Add New Tasks</h3>
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Enter new task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addNewTask();
                          }
                        }}
                      />
                      <Button onClick={addNewTask} size="sm" className="gap-1">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    {newTasks.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {newTasks.map((task, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateNewTask(index, { title: e.target.value })}
                                  className="text-sm"
                                  placeholder="Task title"
                                />
                                <Button
                                  onClick={() => removeNewTask(index)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive ml-2"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                value={task.description}
                                onChange={(e) => updateNewTask(index, { description: e.target.value })}
                                placeholder="Description (optional)"
                                className="text-xs"
                              />
                              <div className="flex items-center space-x-2">
                                <Select 
                                  value={task.priority} 
                                  onValueChange={(value: Task['priority']) => updateNewTask(index, { priority: value })}
                                >
                                  <SelectTrigger className="w-24 h-7 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  type="date"
                                  value={task.dueDate || ''}
                                  onChange={(e) => updateNewTask(index, { dueDate: e.target.value || undefined })}
                                  className="text-xs h-7"
                                />
                                <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                  <Flag className="h-3 w-3 mr-1" />
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Available Items */}
            <div className="p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Select Items</h3>
                  <Badge variant="outline">
                    {selectedTasks.size + selectedActions.size} / {availableTasks.length + availableActions.length} selected
                  </Badge>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-4">
                    {/* Note Actions */}
                    {availableActions.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          From Current Note ({availableActions.length})
                        </h4>
                        <div className="space-y-2">
                          {availableActions.map((action) => (
                            <Card
                              key={action.id}
                              className={`p-3 cursor-pointer transition-colors ${
                                selectedActions.has(action.id) ? 'ring-2 ring-primary bg-accent/50' : ''
                              }`}
                              onClick={() => handleActionSelection(action.id, !selectedActions.has(action.id))}
                            >
                              <div className="flex items-start space-x-3">
                                <Checkbox
                                  checked={selectedActions.has(action.id)}
                                  onCheckedChange={(checked) => handleActionSelection(action.id, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{action.title}</h4>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {action.description}
                                  </p>
                                  <Badge variant="outline" className="mt-2 text-xs">
                                    New Task
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Existing Tasks */}
                    {availableTasks.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Existing Tasks ({availableTasks.length})
                        </h4>
                        <div className="space-y-2">
                          {availableTasks.map((task) => (
                            <Card
                              key={task.id}
                              className={`p-3 cursor-pointer transition-colors ${
                                selectedTasks.has(task.id) ? 'ring-2 ring-primary bg-accent/50' : ''
                              }`}
                              onClick={() => handleTaskSelection(task.id, !selectedTasks.has(task.id))}
                            >
                              <div className="flex items-start space-x-3">
                                <Checkbox
                                  checked={selectedTasks.has(task.id)}
                                  onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {task.description}
                                    </p>
                                  )}
                                  <div className="flex items-center space-x-2 mt-2">
                                    <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                      <Flag className="h-3 w-3 mr-1" />
                                      {task.priority}
                                    </Badge>
                                    <Badge className={getCategoryColor(task.category)} variant="secondary">
                                      {task.category}
                                    </Badge>
                                    {task.dueDate && (
                                      <Badge variant="outline" className="text-xs">
                                        <Calendar className="h-3 w-3 mr-1" />
                                        Due
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {availableTasks.length === 0 && availableActions.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No available items</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end space-x-2">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!listName.trim() || totalItems === 0}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Create Todo List
          </Button>
        </div>
      </Card>
    </div>
  );
};