// src/components/modules/tasks/TodoListsView.tsx
import React, { useMemo } from 'react';
import { ListTodo, Calendar, Flag, CheckSquare, Circle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { ScrollArea } from '../../../ui/scroll-area';
import { Task } from '../../../../types/modules';
import { formatDate, getPriorityColor } from '../../../../utils/noteUtils';

interface TodoListsViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}

export const TodoListsView: React.FC<TodoListsViewProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete
}) => {
  // Group tasks by todo list tags
  const todoLists = useMemo(() => {
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

  const todoListNames = Object.keys(todoLists);

  if (todoListNames.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <ListTodo className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No todo lists found</p>
          <p className="text-sm">Create a todo list from your notes to get started</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {todoListNames.map((listName) => {
          const listTasks = todoLists[listName];
          const completedCount = listTasks.filter(t => t.completed).length;
          const totalCount = listTasks.length;
          const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
          
          return (
            <Card key={listName} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg capitalize">
                    <ListTodo className="h-5 w-5 text-primary" />
                    {listName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {completedCount}/{totalCount} completed
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      {Math.round(progressPercentage)}%
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {listTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`p-3 cursor-pointer transition-all duration-200 hover:shadow-sm group ${
                        task.completed ? 'opacity-60' : ''
                      }`}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className="flex items-start space-x-3">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskComplete(task.id);
                          }}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 mt-0.5"
                        >
                          {task.completed ? (
                            <CheckSquare className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground hover:text-green-600" />
                          )}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm ${
                            task.completed ? 'line-through text-muted-foreground' : ''
                          }`}>
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-2">
                              <Badge className={getPriorityColor(task.priority)} variant="secondary">
                                <Flag className="h-3 w-3 mr-1" />
                                {task.priority}
                              </Badge>
                              {task.dueDate && (
                                <Badge variant="outline" className="text-xs">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {formatDate(task.dueDate)}
                                </Badge>
                              )}
                            </div>
                            
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTaskDelete(task.id);
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};