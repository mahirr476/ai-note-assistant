
// src/components/modules/tasks/CreateTodoListModal.tsx
import React, { useState } from 'react';
import { X, Users, Plus, Check, Trash2, FileText } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { ScrollArea } from '../../../ui/scroll-area';
import { Separator } from '../../../ui/separator';
import { Task } from '../../../../types/modules';
import { getCategoryColor, getPriorityColor } from '../../../../utils/noteUtils';

interface CreateTodoListModalProps {
  tasks: Task[];
  onClose: () => void;
  onSave: (todoListData: {
    name: string;
    description: string;
    selectedTasks: string[];
    newTasks: { title: string; description: string; priority: Task['priority'] }[];
  }) => void;
}

export const CreateTodoListModal: React.FC<CreateTodoListModalProps> = ({
  tasks,
  onClose,
  onSave
}) => {
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [newTasks, setNewTasks] = useState<{ 
    title: string; 
    description: string; 
    priority: Task['priority'];
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

  const addNewTask = () => {
    if (newTaskTitle.trim()) {
      setNewTasks(prev => [...prev, {
        title: newTaskTitle.trim(),
        description: '',
        priority: 'medium'
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
      selectedTasks: Array.from(selectedTasks),
      newTasks
    });
  };

  const totalTasks = selectedTasks.size + newTasks.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Create To-Do List
            </CardTitle>
            <div className="flex items-center gap-2">
              {totalTasks > 0 && (
                <Badge variant="secondary">
                  {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
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
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {newTasks.map((task, index) => (
                          <Card key={index} className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <Input
                                  value={task.title}
                                  onChange={(e) => updateNewTask(index, { title: e.target.value })}
                                  className="text-sm"
                                />
                                <Button
                                  onClick={() => removeNewTask(index)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center space-x-2">
                                <select
                                  value={task.priority}
                                  onChange={(e) => updateNewTask(index, { priority: e.target.value as Task['priority'] })}
                                  className="text-xs border rounded px-2 py-1"
                                >
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>
                                <Badge className={getPriorityColor(task.priority)} variant="secondary">
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

            {/* Right Side - Existing Tasks */}
            <div className="p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium">Select Existing Tasks</h3>
                  <Badge variant="outline">
                    {selectedTasks.size} / {availableTasks.length} selected
                  </Badge>
                </div>

                <ScrollArea className="flex-1">
                  {availableTasks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No available tasks</p>
                    </div>
                  ) : (
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
                              onCheckedChange={(checked: boolean) => handleTaskSelection(task.id, checked as boolean)}
                              onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}
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
                                  {task.priority}
                                </Badge>
                                <Badge className={getCategoryColor(task.category)} variant="secondary">
                                  {task.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
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
            disabled={!listName.trim() || totalTasks === 0}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            Create To-Do List
          </Button>
        </div>
      </Card>
    </div>
  );
};