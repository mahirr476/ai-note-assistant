// src/components/modules/tasks/TodoListsView.tsx (Fixed)
import React, { useMemo, useState } from 'react';
import { ListTodo, Calendar, Flag, CheckSquare, Circle, Trash2, MoreHorizontal, Edit3, Plus, ArrowLeft, Search, Filter, SortAsc, X, BarChart3, Zap, TrendingUp } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { ScrollArea } from '../../../ui/scroll-area';
import { Progress } from '../../../ui/progress';
import { Badge } from '../../../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/dropdown-menu';
import { Task } from '../../../../types/modules';
import { formatDate, getPriorityColor } from '../../../../utils/noteUtils';

interface TodoListsViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTodoListDelete: (listName: string) => void;
  onCreateTodoList?: () => void;
}

export const TodoListsView: React.FC<TodoListsViewProps> = ({
  tasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  onTodoListDelete,
  onCreateTodoList
}) => {
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'tasks' | 'updated'>('name');
  
  // FIXED: Move helper functions before useMemo
  const getListStats = (listTasks: Task[]) => {
    const completed = listTasks.filter(t => t.completed).length;
    const total = listTasks.length;
    const pending = total - completed; // FIXED: Add pending calculation
    const overdue = listTasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    const highPriority = listTasks.filter(t => t.priority === 'high' && !t.completed).length;
    const mediumPriority = listTasks.filter(t => t.priority === 'medium' && !t.completed).length;
    const lowPriority = listTasks.filter(t => t.priority === 'low' && !t.completed).length;
    
    return { completed, total, pending, overdue, highPriority, mediumPriority, lowPriority };
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

  // Filter and sort todo lists
  const filteredAndSortedLists = useMemo(() => {
    let filteredLists = Object.keys(todoLists);

    // Apply search filter
    if (searchTerm) {
      filteredLists = filteredLists.filter(listName =>
        listName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todoLists[listName].some(task =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filteredLists = filteredLists.filter(listName => {
        const listTasks = todoLists[listName];
        switch (filterBy) {
          case 'pending':
            return listTasks.some(task => !task.completed);
          case 'completed':
            return listTasks.every(task => task.completed);
          case 'overdue':
            return listTasks.some(task => {
              if (!task.dueDate || task.completed) return false;
              return new Date(task.dueDate) < new Date();
            });
          default:
            return true;
        }
      });
    }

    // Apply sorting
    return filteredLists.sort((a, b) => {
      const aStats = getListStats(todoLists[a]);
      const bStats = getListStats(todoLists[b]);
      
      switch (sortBy) {
        case 'name':
          return a.localeCompare(b);
        case 'progress':
          const aProgress = aStats.total > 0 ? (aStats.completed / aStats.total) : 0;
          const bProgress = bStats.total > 0 ? (bStats.completed / bStats.total) : 0;
          return bProgress - aProgress;
        case 'tasks':
          return bStats.total - aStats.total;
        case 'updated':
          const aLatest = Math.max(...todoLists[a].map(t => new Date(t.updatedAt).getTime()));
          const bLatest = Math.max(...todoLists[b].map(t => new Date(t.updatedAt).getTime()));
          return bLatest - aLatest;
        default:
          return 0;
      }
    });
  }, [todoLists, searchTerm, filterBy, sortBy, getListStats]);

  const handleDeleteList = (listName: string) => {
    onTodoListDelete(listName); // Use the proper delete function
    if (selectedList === listName) {
      setSelectedList(null);
    }
  };

  // If no todo lists exist
  if (Object.keys(todoLists).length === 0) {
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

    // Enhanced stats for detailed view
    const completedToday = listTasks.filter(task => {
      if (!task.completed) return false;
      const today = new Date().toDateString();
      return new Date(task.updatedAt).toDateString() === today;
    }).length;

    const dueSoon = listTasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
      return dueDate <= threeDaysFromNow && dueDate >= new Date();
    }).length;

    const estimatedTime = listTasks.filter(t => !t.completed).length * 1.5; // 1.5 hours per task estimate

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
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                  <ListTodo className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold capitalize">{selectedList}</h1>
                  <p className="text-muted-foreground text-lg">
                    {stats.completed}/{stats.total} tasks completed • {Math.round(progressPercentage)}% done
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
          
          
        </div>

        {/* Enhanced Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-12 gap-6 p-6">
            {/* Left Sidebar - List Info & Quick Actions */}
            <div className="col-span-3 space-y-6">
              {/* List Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    List Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                      <div className="text-xs text-muted-foreground">Total Tasks</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{stats.pending}</div>
                      <div className="text-xs text-muted-foreground">Remaining</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High Priority</span>
                      <Badge variant="destructive" className="text-xs">{stats.highPriority}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Medium Priority</span>
                      <Badge variant="secondary" className="text-xs">{stats.mediumPriority}</Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Low Priority</span>
                      <Badge variant="outline" className="text-xs">{stats.lowPriority}</Badge>
                    </div>
                    {stats.overdue > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Overdue</span>
                        <Badge variant="destructive" className="text-xs">{stats.overdue}</Badge>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Estimated time to complete</span>
                      <span className="font-medium">{estimatedTime}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              
            </div>

            {/* Main Content - Tasks List */}
            <div className="col-span-9">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-5 w-5" />
                      Tasks ({listTasks.length})
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Task filtering could go here */}
                      <Badge variant="outline" className="text-sm">
                        {stats.pending} pending
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[600px] overflow-y-auto px-6 pb-6">
                    {listTasks.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ListTodo className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                        <p className="text-sm">Add your first task to get started!</p>
                        <Button onClick={onCreateTodoList} className="mt-4 gap-2">
                          <Plus className="h-4 w-4" />
                          Add Task
                        </Button>
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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default grid view with search and filters
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header with Search and Filters */}
      <div className="border-b bg-background p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Todo Lists</h1>
            <p className="text-muted-foreground">
              {filteredAndSortedLists.length} of {Object.keys(todoLists).length} lists
            </p>
          </div>
          
          <Button onClick={onCreateTodoList} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Todo List
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lists and tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            {searchTerm && (
              <Button
                onClick={() => setSearchTerm('')}
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterBy === 'all' ? 'All Lists' : 
                 filterBy === 'pending' ? 'With Pending' :
                 filterBy === 'completed' ? 'Completed' : 'With Overdue'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterBy('all')}>
                All Lists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('pending')}>
                With Pending Tasks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('completed')}>
                Completed Lists
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterBy('overdue')}>
                With Overdue Tasks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SortAsc className="h-4 w-4" />
                Sort by {sortBy === 'name' ? 'Name' : 
                        sortBy === 'progress' ? 'Progress' :
                        sortBy === 'tasks' ? 'Tasks' : 'Updated'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('progress')}>
                Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('tasks')}>
                Task Count
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('updated')}>
                Last Updated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="w-full p-6">
          {filteredAndSortedLists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No matching lists found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                  className="mt-4 gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedLists.map((listName, index) => {
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

              {/* Add New List Card - RESTORED from old version */}
              <div
                className="group bg-background border-2 border-dashed border-border rounded-xl p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 hover:bg-accent/20 flex flex-col items-center justify-center min-h-[200px]"
                onClick={onCreateTodoList}
                style={{ 
                  animationDelay: `${filteredAndSortedLists.length * 100}ms`,
                  animation: 'fadeInUp 0.5s ease-out forwards'
                }}
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
          )}
        </div>
      </ScrollArea>
    </div>
  );
};