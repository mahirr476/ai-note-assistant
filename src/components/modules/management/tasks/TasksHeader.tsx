// src/components/modules/tasks/TasksHeader.tsx
import React from 'react';
import { LayoutGrid, List, Columns, ListTodo, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { Progress } from '../../../ui/progress';
import { TaskViewMode } from '../../TasksModule';

interface TasksHeaderProps {
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    highPriority: number;
    todoLists: number;
  };
  viewMode: TaskViewMode;
  setViewMode: (mode: TaskViewMode) => void;
  selectedCount: number;
}

export const TasksHeader: React.FC<TasksHeaderProps> = ({
  taskStats,
  viewMode,
  setViewMode,
  selectedCount
}) => {
  const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

  const viewModeButtons = [
    { mode: 'list' as TaskViewMode, icon: List, label: 'List' },
    { mode: 'grid' as TaskViewMode, icon: LayoutGrid, label: 'Grid' },
    { mode: 'kanban' as TaskViewMode, icon: Columns, label: 'Kanban' },
    { mode: 'todo-lists' as TaskViewMode, icon: ListTodo, label: 'Todo Lists' }
  ];

  return (
    <div className="p-4 border-b bg-background space-y-4">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-semibold">Task Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {selectedCount > 0 ? `${selectedCount} selected` : `${taskStats.total} total tasks`}
            </p>
          </div>
        </div>
        
        {/* Main View Mode Toggle */}
        <div className="flex items-center space-x-1 bg-muted p-1 rounded-lg">
          {viewModeButtons.map(({ mode, icon: Icon, label }) => (
            <Button
              key={mode}
              onClick={() => setViewMode(mode)}
              variant={viewMode === mode ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Row - Only show for non-todo-lists view */}
      {viewMode !== 'todo-lists' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Completion Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">{Math.round(completionRate)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{taskStats.completed} done</span>
                <span>{taskStats.pending} left</span>
              </div>
            </CardContent>
          </Card>

          {/* High Priority */}
          <Card className={taskStats.highPriority > 0 ? "border-orange-200 bg-orange-50 dark:bg-orange-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-lg font-bold text-orange-600">{taskStats.highPriority}</div>
                  <div className="text-xs text-orange-600">High Priority</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overdue */}
          <Card className={taskStats.overdue > 0 ? "border-red-200 bg-red-50 dark:bg-red-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-red-600" />
                <div>
                  <div className="text-lg font-bold text-red-600">{taskStats.overdue}</div>
                  <div className="text-xs text-red-600">Overdue</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Todo Lists */}
          <Card className={taskStats.todoLists > 0 ? "border-purple-200 bg-purple-50 dark:bg-purple-950/20" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ListTodo className="h-4 w-4 text-purple-600" />
                <div>
                  <div className="text-lg font-bold text-purple-600">{taskStats.todoLists}</div>
                  <div className="text-xs text-purple-600">Todo Lists</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      
    </div>
  );
};