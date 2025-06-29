// src/components/modules/tasks/TasksSidebar.tsx (Fixed Layout)
import React, { useState } from 'react';
import { Search, Filter, SortAsc, Plus, ListTodo, CheckSquare, Calendar, Flag, Target, TrendingUp, Clock, Settings, Archive, Zap, BarChart3, ChevronRight, Star, AlertCircle } from 'lucide-react';
import { Input } from '../../../ui/input';
import { Button } from '../../../ui/button';
import { Badge } from '../../../ui/badge';
import { ScrollArea } from '../../../ui/scroll-area';
import { Progress } from '../../../ui/progress';
import { Task } from '../../../../types/modules';
import { TaskViewMode, TaskSortBy, TaskFilterBy } from '../../TasksModule';

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
  tasks,
  filteredTasks,
  taskStats,
  searchTerm,
  setSearchTerm,
  filterBy,
  setFilterBy,
  sortBy,
  setSortBy,
  selectedTasks,
  viewMode,
  onBulkDelete,
  onBulkComplete,
  onCreateTask,
  onCreateTodoList
}) => {
  const filterOptions = [
    { value: 'all' as TaskFilterBy, label: 'All Tasks', icon: ListTodo, count: taskStats.total },
    { value: 'pending' as TaskFilterBy, label: 'Pending', icon: Clock, count: taskStats.pending },
    { value: 'completed' as TaskFilterBy, label: 'Completed', icon: CheckSquare, count: taskStats.completed },
    { value: 'overdue' as TaskFilterBy, label: 'Overdue', icon: Flag, count: taskStats.overdue },
    { value: 'today' as TaskFilterBy, label: 'Due Today', icon: Calendar, count: 0 },
    { value: 'thisWeek' as TaskFilterBy, label: 'This Week', icon: TrendingUp, count: 0 }
  ];

  const sortOptions = [
    { value: 'priority' as TaskSortBy, label: 'Priority', icon: Flag },
    { value: 'dueDate' as TaskSortBy, label: 'Due Date', icon: Calendar },
    { value: 'category' as TaskSortBy, label: 'Category', icon: Target },
    { value: 'created' as TaskSortBy, label: 'Created', icon: Plus },
    { value: 'updated' as TaskSortBy, label: 'Updated', icon: Clock }
  ];

  // Todo list specific options
  const todoListFilterOptions = [
    { value: 'all' as TaskFilterBy, label: 'All Lists', icon: ListTodo, count: taskStats.todoLists },
    { value: 'pending' as TaskFilterBy, label: 'With Pending', icon: Clock, count: taskStats.pending },
    { value: 'completed' as TaskFilterBy, label: 'Completed Lists', icon: CheckSquare, count: 0 },
    { value: 'overdue' as TaskFilterBy, label: 'With Overdue', icon: Flag, count: taskStats.overdue },
  ];

  // Get recent activity
  const getRecentActivity = () => {
    if (viewMode === 'todo-lists') {
      return tasks
        .filter(task => task.tags.some(tag => tag.startsWith('todo-list:')))
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);
    } else {
      return tasks
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 4);
    }
  };

  const recentActivity = getRecentActivity();

  // Todo list specific stats
  const todoListTasks = tasks.filter(task => task.tags.some(tag => tag.startsWith('todo-list:')));
  const todoListStats = {
    lists: taskStats.todoLists,
    tasks: todoListTasks.length,
    completed: todoListTasks.filter(t => t.completed).length,
    overdue: todoListTasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length
  };

  return (
    <div className="w-80 h-full bg-background border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">
            {viewMode === 'todo-lists' ? 'Todo Lists' : 'Tasks'}
          </h2>
          {viewMode === 'todo-lists' ? (
            <Button onClick={onCreateTodoList} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          ) : (
            <Button onClick={onCreateTask} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={viewMode === 'todo-lists' ? 'Search lists and tasks...' : 'Search tasks...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Progress Overview */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {viewMode === 'todo-lists' ? 'Lists Overview' : 'Overview'}
            </h3>
            
            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {viewMode === 'todo-lists' 
                      ? `${todoListStats.completed}/${todoListStats.tasks}`
                      : `${taskStats.completed}/${taskStats.total}`
                    }
                  </span>
                </div>
                <Progress 
                  value={viewMode === 'todo-lists' 
                    ? (todoListStats.tasks > 0 ? (todoListStats.completed / todoListStats.tasks) * 100 : 0)
                    : (taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0)
                  } 
                  className="h-2"
                />
                <div className="text-xs text-muted-foreground text-center">
                  {viewMode === 'todo-lists' 
                    ? (todoListStats.tasks > 0 ? Math.round((todoListStats.completed / todoListStats.tasks) * 100) : 0)
                    : (taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0)
                  }% Complete
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {viewMode === 'todo-lists' ? 'List Filters' : 'Filters'}
              </h3>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-1">
              {(viewMode === 'todo-lists' ? todoListFilterOptions : filterOptions).map((option) => (
                <Button
                  key={option.value}
                  onClick={() => setFilterBy(option.value)}
                  variant={filterBy === option.value ? 'secondary' : 'ghost'}
                  className="w-full justify-between h-9"
                >
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    {option.label}
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    {option.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTasks.size > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Bulk Actions ({selectedTasks.size} selected)
              </h3>
              
              <div className="space-y-2">
                <Button
                  onClick={onBulkComplete}
                  variant="outline"
                  className="w-full justify-start gap-2 text-green-700 border-green-200 hover:bg-green-50"
                >
                  <CheckSquare className="h-4 w-4" />
                  Mark Complete
                </Button>
                <Button
                  onClick={onBulkDelete}
                  variant="outline"
                  className="w-full justify-start gap-2 text-red-700 border-red-200 hover:bg-red-50"
                >
                  <Archive className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredTasks.length} of {taskStats.total} tasks</span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Settings className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};