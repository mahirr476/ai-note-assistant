// src/components/modules/tasks/TasksSidebar.tsx
import React from 'react';
import { Search, Plus, Filter, ListTodo, Trash2, Check, LayoutGrid, List, Columns } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select';
import { Separator } from '../../../ui/separator';
import { TaskSortBy, TaskFilterBy, TaskViewMode } from '../../TasksModule';
import { Task } from '../../../../types/modules';

interface TasksSidebarProps {
  tasks: Task[];
  filteredTasks: Task[];
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    highPriority: number;
    todoLists: number;
  };
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterBy: TaskFilterBy;
  setFilterBy: (filter: TaskFilterBy) => void;
  sortBy: TaskSortBy;
  setSortBy: (sort: TaskSortBy) => void;
  selectedTasks: Set<string>;
  viewMode: TaskViewMode;
  setViewMode: (mode: TaskViewMode) => void;
  onBulkDelete: () => void;
  onBulkComplete: () => void;
  onCreateTask: () => void;
  onCreateTodoList: () => void;
}

export const TasksSidebar: React.FC<TasksSidebarProps> = ({
  taskStats,
  searchTerm,
  setSearchTerm,
  filterBy,
  setFilterBy,
  sortBy,
  setSortBy,
  selectedTasks,
  viewMode,
  setViewMode,
  onBulkDelete,
  onBulkComplete,
  onCreateTask,
  onCreateTodoList
}) => {
  const filterOptions = [
    { value: 'all', label: 'All Tasks', count: taskStats.total },
    { value: 'pending', label: 'Pending', count: taskStats.pending },
    { value: 'completed', label: 'Completed', count: taskStats.completed },
    { value: 'overdue', label: 'Overdue', count: taskStats.overdue },
    { value: 'today', label: 'Due Today', count: 0 },
    { value: 'thisWeek', label: 'This Week', count: 0 }
  ];

  const viewModeButtons = [
    { mode: 'list' as TaskViewMode, icon: List, label: 'List' },
    { mode: 'grid' as TaskViewMode, icon: LayoutGrid, label: 'Grid' },
    { mode: 'kanban' as TaskViewMode, icon: Columns, label: 'Kanban' },
    { mode: 'todo-lists' as TaskViewMode, icon: ListTodo, label: 'Todo Lists' }
  ];

  return (
    <div className="w-80 border-r bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              {taskStats.pending} pending, {taskStats.completed} completed
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={onCreateTodoList} size="icon" variant="outline" className="h-8 w-8">
              <ListTodo className="h-4 w-4" />
            </Button>
            <Button onClick={onCreateTask} size="icon" variant="outline" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search - only show for non-todo-lists view */}
        {viewMode !== 'todo-lists' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e: { target: { value: string; }; }) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="p-4 border-b">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">View Mode</label>
          <div className="grid grid-cols-2 gap-1">
            {viewModeButtons.map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                onClick={() => setViewMode(mode)}
                variant={viewMode === mode ? "default" : "outline"}
                size="sm"
                className="gap-1 text-xs"
              >
                <Icon className="h-3 w-3" />
                {label === 'Todo Lists' ? 'Lists' : label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{taskStats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </Card>
        </div>
        
        {taskStats.todoLists > 0 && (
          <Card className="p-3 border-purple-200 bg-purple-50 dark:bg-purple-950/20">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{taskStats.todoLists}</div>
              <div className="text-xs text-purple-600">Todo Lists</div>
            </div>
          </Card>
        )}
        
        {taskStats.overdue > 0 && (
          <Card className="p-3 border-red-200 bg-red-50 dark:bg-red-950/20">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">{taskStats.overdue}</div>
              <div className="text-xs text-red-600">Overdue</div>
            </div>
          </Card>
        )}

        {taskStats.highPriority > 0 && (
          <Card className="p-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">{taskStats.highPriority}</div>
              <div className="text-xs text-orange-600">High Priority</div>
            </div>
          </Card>
        )}
      </div>

      {/* Bulk Actions - only show for non-todo-lists view */}
      {selectedTasks.size > 0 && viewMode !== 'todo-lists' && (
        <div className="p-4 border-t border-b bg-accent/50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedTasks.size} selected
            </span>
            <div className="flex space-x-2">
              <Button onClick={onBulkComplete} size="sm" variant="outline" className="gap-1">
                <Check className="h-3 w-3" />
                Complete
              </Button>
              <Button onClick={onBulkDelete} size="sm" variant="outline" className="gap-1 text-destructive">
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Filters - only show for non-todo-lists view */}
      {viewMode !== 'todo-lists' && (
        <div className="p-4 space-y-4 flex-1 overflow-auto">
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter & Sort
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Filter by</label>
                <Select value={filterBy} onValueChange={(value: TaskFilterBy) => setFilterBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {option.count}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sort by</label>
                <Select value={sortBy} onValueChange={(value: TaskSortBy) => setSortBy(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dueDate">Due Date</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="created">Date Created</SelectItem>
                    <SelectItem value="updated">Last Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Todo Lists Info - show when in todo-lists view */}
      {viewMode === 'todo-lists' && (
        <div className="p-4 flex-1">
          <div className="text-center text-muted-foreground">
            <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Todo Lists View</p>
            <p className="text-xs">Organized task collections</p>
            {taskStats.todoLists === 0 && (
              <p className="text-xs mt-2">Create todo lists from your notes to get started!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};