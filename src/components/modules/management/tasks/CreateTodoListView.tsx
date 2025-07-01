// src/components/modules/tasks/CreateTodoListView.tsx (Enhanced)
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Users, Plus, Check, Trash2, FileText, Flag, Save, X, Calendar, Target, Clock, Star, TrendingUp, BarChart3, Lightbulb, Zap, CheckCircle, ListTodo } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { ScrollArea } from '../../../ui/scroll-area';
import { Separator } from '../../../ui/separator';
import { Progress } from '../../../ui/progress';
import { Task } from '../../../../types/modules';
import { getCategoryColor, getPriorityColor } from '../../../../utils/noteUtils';

interface CreateTodoListViewProps {
  tasks: Task[];
  onSave: (todoListData: {
    name: string;
    description: string;
    selectedTasks: string[];
    newTasks: { title: string; description: string; priority: Task['priority']; dueDate?: string }[];
    category?: string;
    tags?: string[];
    isEditingExisting?: boolean;
    existingListName?: string;
  }) => void;
  onCancel: () => void;
}

export const CreateTodoListView: React.FC<CreateTodoListViewProps> = ({
  tasks,
  onSave,
  onCancel
}) => {
  const [mode, setMode] = useState<'create' | 'add-to-existing'>('create');
  const [selectedExistingList, setSelectedExistingList] = useState<string>('');
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listCategory, setListCategory] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [newTasks, setNewTasks] = useState<{ 
    title: string; 
    description: string; 
    priority: Task['priority'];
    dueDate?: string;
  }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [quickAddMode, setQuickAddMode] = useState(false);

  // Get existing todo lists
  const existingTodoLists = useMemo(() => {
    const lists: { [key: string]: Task[] } = {};
    
    tasks.forEach(task => {
      const todoListTags = task.tags.filter(tag => tag.startsWith('todo-list:'));
      
      if (todoListTags.length > 0) {
        todoListTags.forEach(tag => {
          const listName = tag.replace('todo-list:', '').replace(/-/g, ' ');
          if (!lists[listName]) {
            lists[listName] = [];
          }
          lists[listName].push(task);
        });
      }
    });
    
    return lists;
  }, [tasks]);

  // Filter available tasks (not completed and not already in the selected todo list if adding to existing)
  const availableTasks = useMemo(() => {
    return tasks.filter(task => {
      if (task.completed) return false;
      
      if (mode === 'add-to-existing' && selectedExistingList) {
        // Don't show tasks that are already in the selected list
        const todoListTag = `todo-list:${selectedExistingList.toLowerCase().replace(/\s+/g, '-')}`;
        return !task.tags.includes(todoListTag);
      } else {
        // For creating new lists, don't show tasks already in any todo list
        return !task.tags.some(tag => tag.startsWith('todo-list:'));
      }
    });
  }, [tasks, mode, selectedExistingList]);

  // Get existing categories for suggestions
  const existingCategories = useMemo(() => {
    const categories = new Set<string>();
    tasks.forEach(task => {
      if (task.category && task.category !== 'General') {
        categories.add(task.category);
      }
    });
    return Array.from(categories);
  }, [tasks]);

  // Template suggestions based on common patterns
  const templateSuggestions = [
    {
      name: 'Daily Routine',
      description: 'Morning and evening habits',
      tasks: [
        { title: 'Morning workout', priority: 'high' as const },
        { title: 'Check emails', priority: 'medium' as const },
        { title: 'Review daily goals', priority: 'high' as const },
        { title: 'Evening reflection', priority: 'low' as const }
      ]
    },
    {
      name: 'Project Launch',
      description: 'Essential steps for launching a new project',
      tasks: [
        { title: 'Define project scope', priority: 'high' as const },
        { title: 'Set up project timeline', priority: 'high' as const },
        { title: 'Assign team roles', priority: 'medium' as const },
        { title: 'Create project documentation', priority: 'medium' as const },
        { title: 'Schedule kickoff meeting', priority: 'high' as const }
      ]
    },
    {
      name: 'Weekly Review',
      description: 'Weekly planning and reflection',
      tasks: [
        { title: 'Review previous week accomplishments', priority: 'medium' as const },
        { title: 'Plan upcoming week priorities', priority: 'high' as const },
        { title: 'Update project status', priority: 'medium' as const },
        { title: 'Schedule important meetings', priority: 'low' as const }
      ]
    }
  ];

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const addNewTask = (taskData?: Partial<typeof newTasks[0]>) => {
    const title = taskData?.title || newTaskTitle.trim();
    if (title) {
      setNewTasks(prev => [...prev, {
        title,
        description: taskData?.description || '',
        priority: taskData?.priority || 'medium',
        dueDate: taskData?.dueDate
      }]);
      setNewTaskTitle('');
    }
  };

  const addMultipleTasks = () => {
    const lines = newTaskTitle.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      addNewTask({ title: line.trim() });
    });
    setNewTaskTitle('');
    setQuickAddMode(false);
  };

  const removeNewTask = (index: number) => {
    setNewTasks(prev => prev.filter((_, i) => i !== index));
  };

  const updateNewTask = (index: number, updates: Partial<typeof newTasks[0]>) => {
    setNewTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, ...updates } : task
    ));
  };

  const applyTemplate = (template: typeof templateSuggestions[0]) => {
    setListName(template.name);
    setListDescription(template.description);
    setNewTasks(template.tasks.map(task => ({ ...task, description: '' })));
  };

  const handleSave = () => {
    if (mode === 'create' && !listName.trim()) return;
    if (mode === 'add-to-existing' && !selectedExistingList) return;
    if (totalTasks === 0) return;

    onSave({
      name: mode === 'create' ? listName.trim() : selectedExistingList,
      description: listDescription.trim(),
      selectedTasks: Array.from(selectedTasks),
      newTasks,
      category: listCategory || 'Todo List',
      tags: [],
      isEditingExisting: mode === 'add-to-existing',
      existingListName: mode === 'add-to-existing' ? selectedExistingList : undefined
    });
  };

  const totalTasks = selectedTasks.size + newTasks.length;
  const highPriorityTasks = newTasks.filter(t => t.priority === 'high').length;
  const completionEstimate = totalTasks * 2; // 2 hours per task estimate

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={onCancel}
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  {mode === 'create' ? 'Create Todo List' : 'Add to Todo List'}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {mode === 'create' 
                    ? 'Organize your tasks into a focused collection'
                    : `Add more tasks to "${selectedExistingList}"`
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {totalTasks > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {totalTasks} {totalTasks === 1 ? 'task' : 'tasks'}
                </Badge>
                {highPriorityTasks > 0 && (
                  <Badge variant="destructive" className="text-sm px-3 py-1">
                    {highPriorityTasks} high priority
                  </Badge>
                )}
              </div>
            )}
            <Button onClick={onCancel} variant="outline" className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={(mode === 'create' && !listName.trim()) || (mode === 'add-to-existing' && !selectedExistingList) || totalTasks === 0}
              className="gap-2 px-6"
            >
              <Save className="h-4 w-4" />
              {mode === 'create' ? 'Create List' : 'Add Tasks'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-6 p-6 min-h-full">
          {/* Left Side - Mode Selection & List Details */}
          <div className="col-span-4 space-y-6">
            {/* Mode Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Action Type
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      setMode('create');
                      setSelectedExistingList('');
                      setListName('');
                      setListDescription('');
                    }}
                    variant={mode === 'create' ? 'default' : 'outline'}
                    className="h-16 flex flex-col gap-1"
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm">Create New</span>
                  </Button>
                  <Button
                    onClick={() => {
                      setMode('add-to-existing');
                      setListName('');
                      setListDescription('');
                    }}
                    variant={mode === 'add-to-existing' ? 'default' : 'outline'}
                    className="h-16 flex flex-col gap-1"
                    disabled={Object.keys(existingTodoLists).length === 0}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-sm">Add to Existing</span>
                  </Button>
                </div>
                
                {mode === 'add-to-existing' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Select Todo List</label>
                    <select
                      value={selectedExistingList}
                      onChange={(e) => setSelectedExistingList(e.target.value)}
                      className="w-full border rounded-md px-3 py-2 bg-background"
                    >
                      <option value="">Choose a list...</option>
                      {Object.keys(existingTodoLists).map(listName => (
                        <option key={listName} value={listName}>
                          {listName} ({existingTodoLists[listName].length} tasks)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* List Details - Only show for creating new lists */}
            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    New List Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">List Name *</label>
                    <Input
                      placeholder="Enter list name..."
                      value={listName}
                      onChange={(e) => setListName(e.target.value)}
                      className="text-base"
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
                      placeholder="e.g., Work, Personal, Health..."
                      value={listCategory}
                      onChange={(e) => setListCategory(e.target.value)}
                      list="categories"
                    />
                    <datalist id="categories">
                      {existingCategories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Existing List Info - Show when adding to existing */}
            {mode === 'add-to-existing' && selectedExistingList && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    {selectedExistingList}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Current tasks:</span>
                      <span className="font-medium">{existingTodoLists[selectedExistingList].length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-medium text-green-600">
                        {existingTodoLists[selectedExistingList].filter(t => t.completed).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending:</span>
                      <span className="font-medium text-orange-600">
                        {existingTodoLists[selectedExistingList].filter(t => !t.completed).length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Adding {totalTasks} new tasks to this list
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Templates - Only for creating new lists */}
            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Quick Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {templateSuggestions.map((template, index) => (
                      <div 
                        key={index}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => applyTemplate(template)}
                      >
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {template.tasks.length} tasks
                          </Badge>
                          <Button variant="ghost" size="sm" className="h-6 text-xs">
                            Apply Template
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* List Statistics */}
            {totalTasks > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    List Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{totalTasks}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{highPriorityTasks}</div>
                      <div className="text-xs text-muted-foreground">High Priority</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Estimated completion time</span>
                      <span className="font-medium">{completionEstimate}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>From existing tasks</span>
                      <span className="font-medium">{selectedTasks.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>New tasks</span>
                      <span className="font-medium">{newTasks.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Middle - Add New Tasks */}
          <div className="col-span-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Tasks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setQuickAddMode(!quickAddMode)}
                      variant={quickAddMode ? "default" : "outline"}
                      size="sm"
                      className="gap-1"
                    >
                      <Zap className="h-3 w-3" />
                      {quickAddMode ? 'Single Mode' : 'Bulk Mode'}
                    </Button>
                  </div>

                  {quickAddMode ? (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Enter multiple tasks (one per line)..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        rows={4}
                        className="text-sm"
                      />
                      <Button onClick={addMultipleTasks} className="w-full gap-1">
                        <Plus className="h-4 w-4" />
                        Add {newTaskTitle.split('\n').filter(l => l.trim()).length} Tasks
                      </Button>
                    </div>
                  ) : (
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
                        className="flex-1"
                      />
                      <Button onClick={() => addNewTask()} className="gap-1 flex-shrink-0">
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {newTasks.length > 0 && (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      New Tasks ({newTasks.length})
                    </h4>
                    {newTasks.map((task, index) => (
                      <Card key={index} className="p-3">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <Input
                              value={task.title}
                              onChange={(e) => updateNewTask(index, { title: e.target.value })}
                              className="text-sm flex-1"
                              placeholder="Task title..."
                            />
                            <Button
                              onClick={() => removeNewTask(index)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive flex-shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={task.priority}
                              onChange={(e) => updateNewTask(index, { priority: e.target.value as Task['priority'] })}
                              className="text-xs border rounded px-2 py-1 bg-background"
                            >
                              <option value="high">High Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="low">Low Priority</option>
                            </select>
                            
                            <Input
                              type="date"
                              value={task.dueDate || ''}
                              onChange={(e) => updateNewTask(index, { dueDate: e.target.value })}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Existing Tasks */}
          <div className="col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {mode === 'create' ? 'Select Existing Tasks' : `Add Tasks to "${selectedExistingList}"`}
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {selectedTasks.size} / {availableTasks.length} selected
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto px-6 pb-6">
                  {availableTasks.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h4 className="text-lg font-medium mb-2">No Available Tasks</h4>
                      <p className="text-sm">
                        {mode === 'add-to-existing' 
                          ? `All available tasks are already in "${selectedExistingList}" or completed.`
                          : 'All tasks are either completed or already in todo lists.'
                        }
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableTasks.map((task) => (
                        <Card
                          key={task.id}
                          className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-md ${
                            selectedTasks.has(task.id) ? 'ring-2 ring-primary bg-accent/50' : 'hover:bg-accent/30'
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
                              <h4 className="font-medium text-sm mb-1">{task.title}</h4>
                              {task.description && (
                                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                  <Flag className="h-3 w-3 mr-1" />
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};