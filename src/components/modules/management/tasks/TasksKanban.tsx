// src/components/modules/tasks/TasksKanban.tsx (Scroll Fixed)
import React from 'react';
import { CheckCircle2, Clock, Calendar, Flag, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/dropdown-menu';
import { ScrollArea } from '../../../ui/scroll-area';
import { Task } from '../../../../types/modules';
import { formatDate, getPriorityColor, getCategoryColor } from '../../../../utils/noteUtils';

interface TasksKanbanProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export const TasksKanban: React.FC<TasksKanbanProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete
}) => {
  // Group tasks by priority
  const taskColumns = {
    high: tasks.filter(task => task.priority === 'high' && !task.completed),
    medium: tasks.filter(task => task.priority === 'medium' && !task.completed),
    low: tasks.filter(task => task.priority === 'low' && !task.completed),
    completed: tasks.filter(task => task.completed)
  };

  const columnConfig = [
    { key: 'high', title: 'High Priority', color: 'border-red-200 bg-red-50/50 dark:bg-red-950/20', count: taskColumns.high.length },
    { key: 'medium', title: 'Medium Priority', color: 'border-orange-200 bg-orange-50/50 dark:bg-orange-950/20', count: taskColumns.medium.length },
    { key: 'low', title: 'Low Priority', color: 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20', count: taskColumns.low.length },
    { key: 'completed', title: 'Completed', color: 'border-green-200 bg-green-50/50 dark:bg-green-950/20', count: taskColumns.completed.length }
  ];

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  };

  const renderTaskCard = (task: Task) => (
    <Card
      key={task.id}
      className={`mb-3 cursor-pointer transition-all duration-200 hover:shadow-md group ${
        task.completed ? 'opacity-75' : ''
      } ${isOverdue(task) ? 'border-red-300' : ''}`}
      onClick={() => onTaskClick(task)}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <h3 className={`font-medium text-sm leading-tight flex-1 pr-2 ${
              task.completed ? 'line-through text-muted-foreground' : ''
            }`}>
              {task.title}
            </h3>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onTaskComplete(task.id);
                }}
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    onClick={(e) => e.stopPropagation()}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onTaskClick(task)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onTaskDelete(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Category */}
          <Badge className={getCategoryColor(task.category)} variant="secondary">
            {task.category}
          </Badge>

          {/* Due Date */}
          {task.dueDate && (
            <div className={`flex items-center space-x-1 text-xs ${
              isOverdue(task) ? 'text-red-600' : 'text-muted-foreground'
            }`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Updated Time */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDate(task.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Use flexbox instead of grid for better height control */}
      <div className="flex-1 flex p-4 gap-4 min-h-0">
        {columnConfig.map((column) => (
          <div key={column.key} className="flex-1 flex flex-col min-w-0 max-w-sm">
            {/* Column Header - Fixed Height */}
            <div className={`p-3 rounded-t-lg border-b ${column.color} flex-shrink-0`}>
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm truncate">{column.title}</h3>
                <Badge variant="secondary" className="text-xs ml-2">
                  {column.count}
                </Badge>
              </div>
            </div>

            {/* Column Content - Scrollable */}
            <div className={`flex-1 border-x border-b rounded-b-lg ${column.color} min-h-0 relative`}>
              <div className="absolute inset-0">
                <ScrollArea className="h-full w-full">
                  <div className="p-3">
                    {taskColumns[column.key as keyof typeof taskColumns].length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tasks</p>
                      </div>
                    ) : (
                      <div className="space-y-3 pb-4">
                        {taskColumns[column.key as keyof typeof taskColumns].map(renderTaskCard)}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};