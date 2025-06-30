// src/components/modules/tasks/TodoListsView.tsx (Navigation-based View - Fixed)
import React, { useMemo, useState } from 'react';
import { ListTodo, Calendar, Flag, CheckSquare, Circle, Trash2, MoreHorizontal, Edit3, Plus, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '../../../ui/button';
import { ScrollArea } from '../../../ui/scroll-area';
import { Progress } from '../../../ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/dropdown-menu';
import { Task } from '../../../../types/modules';
import { formatDate, getPriorityColor } from '../../../../utils/noteUtils';

interface TodoListsViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
  onCreateTodoList?: () => void;
}

export const TodoListsView: React.FC<TodoListsViewProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onCreateTodoList
}) => {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  
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

  const getListStats = (listTasks: Task[]) => {
    const completed = listTasks.filter(t => t.completed).length;
    const total = listTasks.length;
    const overdue = listTasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    const highPriority = listTasks.filter(t => t.priority === 'high' && !t.completed).length;
    const mediumPriority = listTasks.filter(t => t.priority === 'medium' && !t.completed).length;
    const lowPriority = listTasks.filter(t => t.priority === 'low' && !t.completed).length;
    
    return { completed, total, overdue, highPriority, mediumPriority, lowPriority };
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handleDeleteList = (listName: string) => {
    // Delete all tasks with this todo-list tag
    const listTasks = todoLists[listName];
    listTasks.forEach(task => {
      onTaskDelete(task.id);
    });
    // If we're currently viewing this list, go back to grid
    if (selectedList === listName) {
      setSelectedList(null);
    }
  };

  // If no todo lists exist
  if (todoListNames.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 rounded-full flex items-center justify-center">
            <ListTodo className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Todo Lists Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create organized task collections to stay productive.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={onCreateTodoList} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Todo List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If a specific list is selected, show detailed view
  if (selectedList && todoLists[selectedList]) {
    const listTasks = todoLists[selectedList];
    const stats = getListStats(listTasks);
    const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return (
      <div className="h-full w-full flex flex-col">
        {/* Header for individual list view */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setSelectedList(null)}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <ListTodo className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold capitalize">{selectedList}</h1>
                  <p className="text-muted-foreground">
                    {stats.completed}/{stats.total} tasks completed • {Math.round(progressPercentage)}% done
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={onCreateTodoList} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive"
                    onClick={() => handleDeleteList(selectedList)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Tasks list */}
        <ScrollArea className="flex-1">
          <div className="p-6">
            {listTasks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ListTodo className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <p className="text-sm">Add your first task to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="group p-4 rounded-xl border bg-background hover:bg-accent/30 transition-all duration-200"
                    style={{ 
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.3s ease-out forwards'
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <Button
                        onClick={() => onTaskComplete(task.id)}
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 mt-1 flex-shrink-0 rounded-full"
                      >
                        {task.completed ? (
                          <CheckSquare className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground hover:text-green-500" />
                        )}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-medium text-base flex-1 ${
                            task.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}>
                            {task.title}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <div className={`px-2 py-1 text-xs rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                              <Flag className="h-3 w-3 mr-1 inline" />
                              {task.priority}
                            </div>
                            
                            {task.dueDate && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                              </div>
                            )}
                            
                            <Button
                              onClick={() => onTaskClick(task)}
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit3 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            
                            <Button
                              onClick={() => onTaskDelete(task.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Default grid view
  return (
    <div className="h-full w-full flex flex-col">
      <ScrollArea className="flex-1">
        <div className="w-full p-6">
          {/* Grid of Todo Lists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todoListNames.map((listName, index) => {
              const listTasks = todoLists[listName];
              const stats = getListStats(listTasks);
              const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
              
              return (
                <div
                  key={listName}
                  className={`group relative bg-background border border-border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 ${
                    hoveredCard === listName ? 'transform -translate-y-1' : ''
                  }`}
                  onClick={() => setSelectedList(listName)}
                  onMouseEnter={() => setHoveredCard(listName)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{ 
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards'
                  }}
                >
                  {/* List Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg capitalize truncate mb-1">
                        {listName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {stats.completed}/{stats.total} tasks completed
                      </p>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setSelectedList(listName);
                        }}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          View List
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteList(listName);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete List
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">Progress</span>
                      <span className="text-xs font-medium">{Math.round(progressPercentage)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Stats Pills */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {stats.overdue > 0 && (
                      <div className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full">
                        {stats.overdue} overdue
                      </div>
                    )}
                    {stats.highPriority > 0 && (
                      <div className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs rounded-full">
                        {stats.highPriority} high
                      </div>
                    )}
                    {stats.mediumPriority > 0 && (
                      <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                        {stats.mediumPriority} medium
                      </div>
                    )}
                    {stats.lowPriority > 0 && (
                      <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full">
                        {stats.lowPriority} low
                      </div>
                    )}
                  </div>

                  {/* Recent Tasks Preview */}
                  <div className="space-y-2">
                    {listTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm">
                        {task.completed ? (
                          <CheckSquare className="h-3 w-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={`truncate ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </span>
                      </div>
                    ))}
                    {listTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{listTasks.length - 3} more tasks
                      </div>
                    )}
                  </div>

                  {/* Hover Effect */}
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-xl transition-all duration-300 ${
                    hoveredCard === listName ? 'w-full' : 'w-0'
                  }`} />
                </div>
              );
            })}

            {/* Add New List Card */}
            <div
              className="group bg-background border-2 border-dashed border-border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-accent/20 flex flex-col items-center justify-center min-h-[200px]"
              onClick={onCreateTodoList}
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium text-center mb-1">Create New List</h3>
              <p className="text-sm text-muted-foreground text-center">
                Organize your tasks into lists
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};