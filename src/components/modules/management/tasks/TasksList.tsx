// src/components/modules/tasks/TasksList.tsx
import React from 'react';
import { Clock, Calendar, Flag, MoreHorizontal, CheckCircle2, Circle, Trash2, Edit } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Checkbox } from '../../../ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/dropdown-menu';
import { ScrollArea } from '../../../ui/scroll-area';
import { Task } from '../../../../types/modules';
import { formatDate, getPriorityColor, getCategoryColor } from '../../../../utils/noteUtils';

interface TasksListProps {
  tasks: Task[];
  selectedTasks: Set<string>;
  setSelectedTasks: (tasks: Set<string>) => void;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export const TasksList: React.FC<TasksListProps> = ({
  tasks,
  selectedTasks,
  setSelectedTasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete
}) => {
  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  };

  const getDueDateColor = (task: Task) => {
    if (!task.dueDate || task.completed) return 'text-muted-foreground';
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'text-red-600';
    if (daysDiff === 0) return 'text-orange-600';
    if (daysDiff <= 3) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No tasks found</p>
          <p className="text-sm">Create a new task to get started</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3">
        {tasks.map((task) => (
          <Card
            key={task.id}
            className={`transition-all duration-200 hover:shadow-md group cursor-pointer ${
              task.completed ? 'opacity-60' : ''
            } ${selectedTasks.has(task.id) ? 'ring-2 ring-primary' : ''} ${
              isOverdue(task) ? 'border-red-200 bg-red-50/50 dark:bg-red-950/10' : ''
            }`}
            onClick={() => onTaskClick(task)}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                {/* Checkbox */}
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={(checked) => handleSelectTask(task.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskComplete(task.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground hover:text-green-600" />
                    )}
                  </Button>
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`font-medium text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
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

                  {/* Task Meta */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)} variant="secondary">
                        <Flag className="h-3 w-3 mr-1" />
                        {task.priority}
                      </Badge>
                      <Badge className={getCategoryColor(task.category)} variant="secondary">
                        {task.category}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      {task.dueDate && (
                        <div className={`flex items-center space-x-1 ${getDueDateColor(task)}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(task.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {task.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {task.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{task.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};