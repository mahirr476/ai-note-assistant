// src/components/modules/TasksModule.tsx (Fixed Layout)
import React, { useState, useMemo } from 'react';
import { ModuleData, Task } from '../../types/modules';
import { TasksSidebar } from './management/tasks/TasksSidebar';
import { TasksMainView } from './management/tasks/TasksMainView';
import { TodoListsView } from './management/tasks/TodoListsView';
import { CreateTodoListView } from './management/tasks/CreateTodoListView'; // New component
import { TaskModal } from './management/tasks/TaskModal';
import { TasksHeader } from './management/tasks/TasksHeader';

export type TaskViewMode = 'list' | 'grid' | 'kanban' | 'todo-lists' | 'create-todo-list';
export type TaskSortBy = 'priority' | 'dueDate' | 'category' | 'created' | 'updated';
export type TaskFilterBy = 'all' | 'pending' | 'completed' | 'overdue' | 'today' | 'thisWeek';

interface TasksModuleProps {
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
}

export const TasksModule: React.FC<TasksModuleProps> = ({
  moduleData,
  setModuleData
}) => {
  // View state
  const [viewMode, setViewMode] = useState<TaskViewMode>('list');
  const [sortBy, setSortBy] = useState<TaskSortBy>('priority');
  const [filterBy, setFilterBy] = useState<TaskFilterBy>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());

  // Modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filtering and sorting logic
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = moduleData.tasks || [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    switch (filterBy) {
      case 'pending':
        filtered = filtered.filter(task => !task.completed);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed);
        break;
      case 'overdue':
        filtered = filtered.filter(task => {
          if (!task.dueDate || task.completed) return false;
          return new Date(task.dueDate) < new Date();
        });
        break;
      case 'today':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const today = new Date().toDateString();
          return new Date(task.dueDate).toDateString() === today;
        });
        break;
      case 'thisWeek':
        filtered = filtered.filter(task => {
          if (!task.dueDate) return false;
          const weekFromNow = new Date();
          weekFromNow.setDate(weekFromNow.getDate() + 7);
          return new Date(task.dueDate) <= weekFromNow;
        });
        break;
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        default:
          return 0;
      }
    });
  }, [moduleData.tasks, searchTerm, filterBy, sortBy]);

  // Todo lists count
  const todoListsCount = useMemo(() => {
    const todoListTags = new Set<string>();
    (moduleData.tasks || []).forEach(task => {
      task.tags.forEach(tag => {
        if (tag.startsWith('todo-list:')) {
          todoListTags.add(tag);
        }
      });
    });
    return todoListTags.size;
  }, [moduleData.tasks]);

  // Task management functions
  const createTask = (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description,
      completed: false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceNoteId: taskData.sourceNoteId,
      category: taskData.category || 'General',
      tags: taskData.tags || []
    };

    const updatedData = {
      ...moduleData,
      tasks: [newTask, ...(moduleData.tasks || [])]
    };
    setModuleData(updatedData);
  };

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updatedTasks = (moduleData.tasks || []).map(task =>
      task.id === taskId
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );
    setModuleData({ ...moduleData, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = (moduleData.tasks || []).filter(task => task.id !== taskId);
    setModuleData({ ...moduleData, tasks: updatedTasks });
  };

  const toggleTaskComplete = (taskId: string) => {
    const task = (moduleData.tasks || []).find(t => t.id === taskId);
    updateTask(taskId, { 
      completed: !task?.completed 
    });
  };

  // FIXED: Todo list delete function - only remove tags, don't delete tasks
  const deleteTodoList = (listName: string) => {
    const todoListTag = `todo-list:${listName.toLowerCase().replace(/\s+/g, '-')}`;
    
    const updatedTasks = (moduleData.tasks || []).map(task => ({
      ...task,
      tags: task.tags.filter(tag => tag !== todoListTag),
      updatedAt: new Date().toISOString()
    }));
    
    setModuleData({ ...moduleData, tasks: updatedTasks });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskModalClose = () => {
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskModalSave = (taskData: Partial<Task>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      createTask(taskData);
    }
    handleTaskModalClose();
  };

  const handleBulkDelete = () => {
    const updatedTasks = (moduleData.tasks || []).filter(task => !selectedTasks.has(task.id));
    setModuleData({ ...moduleData, tasks: updatedTasks });
    setSelectedTasks(new Set());
  };

  const handleBulkComplete = () => {
    const updatedTasks = (moduleData.tasks || []).map(task =>
      selectedTasks.has(task.id)
        ? { ...task, completed: true, updatedAt: new Date().toISOString() }
        : task
    );
    setModuleData({ ...moduleData, tasks: updatedTasks });
    setSelectedTasks(new Set());
  };

  const handleCreateTodoList = () => {
    setViewMode('create-todo-list');
  };

  const handleTodoListSave = (todoListData: any) => {
    const updatedData = { ...moduleData };
    
    if (!updatedData.tasks) {
      updatedData.tasks = [];
    }
    
    const listTag = `todo-list:${todoListData.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Create new tasks
    for (const newTask of todoListData.newTasks || []) {
      const task: Task = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: newTask.title,
        description: newTask.description || `From todo list: ${todoListData.name}`,
        completed: false,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sourceNoteId: undefined,
        category: todoListData.category || 'Todo List',
        tags: [listTag]
      };
      updatedData.tasks = [task, ...updatedData.tasks];
    }

    // Update selected existing tasks with todo list tags
    if (todoListData.selectedTasks && todoListData.selectedTasks.length > 0) {
      const updatedTasks = updatedData.tasks.map(task => {
        if (todoListData.selectedTasks.includes(task.id)) {
          return {
            ...task,
            tags: [...task.tags, listTag],
            updatedAt: new Date().toISOString()
          };
        }
        return task;
      });
      updatedData.tasks = updatedTasks;
    }

    setModuleData(updatedData);
    setViewMode('todo-lists');
  };

  const handleCancelCreateTodoList = () => {
    setViewMode('todo-lists');
  };

  // Get statistics
  const taskStats = useMemo(() => {
    const tasks = moduleData.tasks || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = tasks.filter(t => {
      if (!t.dueDate || t.completed) return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    const highPriority = tasks.filter(t => t.priority === 'high' && !t.completed).length;

    return { total, completed, pending, overdue, highPriority, todoLists: todoListsCount };
  }, [moduleData.tasks, todoListsCount]);

  const renderMainContent = () => {
    // Create Todo List View
    if (viewMode === 'create-todo-list') {
      return (
        <CreateTodoListView
          tasks={moduleData.tasks || []}
          onSave={handleTodoListSave}
          onCancel={handleCancelCreateTodoList}
        />
      );
    }

    // Todo Lists View (WITH HEADER)
    if (viewMode === 'todo-lists') {
      return (
        <div className="flex flex-col h-full">
          <TasksHeader
            taskStats={taskStats}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedCount={0}
          />
          
          <div className="flex-1 min-h-0 overflow-hidden">
            <TodoListsView
              tasks={moduleData.tasks || []}
              onTaskClick={handleEditTask}
              onTaskComplete={toggleTaskComplete}
              onTaskDelete={deleteTask}
              onTodoListDelete={deleteTodoList}
              onCreateTodoList={handleCreateTodoList}
            />
          </div>
        </div>
      );
    }

    // Regular task views (WITH SIDEBAR)
    return (
      <div className="flex h-full w-full">
        {/* Sidebar only for regular task views */}
        <TasksSidebar
          tasks={moduleData.tasks || []}
          filteredTasks={filteredAndSortedTasks}
          taskStats={taskStats}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          sortBy={sortBy}
          setSortBy={setSortBy}
          selectedTasks={selectedTasks}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onBulkDelete={handleBulkDelete}
          onBulkComplete={handleBulkComplete}
          onCreateTask={() => setShowTaskModal(true)}
          onCreateTodoList={handleCreateTodoList}
        />

        {/* Main task content - FIXED: Added proper flex constraints */}
        <div className="flex-1 h-full min-h-0 min-w-0 overflow-hidden">
          <TasksMainView
            tasks={filteredAndSortedTasks}
            viewMode={viewMode}
            setViewMode={setViewMode}
            selectedTasks={selectedTasks}
            setSelectedTasks={setSelectedTasks}
            onTaskClick={handleEditTask}
            onTaskComplete={toggleTaskComplete}
            onTaskDelete={deleteTask}
            taskStats={taskStats}
            onCreateTask={() => setShowTaskModal(true)}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {renderMainContent()}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onSave={handleTaskModalSave}
          onClose={handleTaskModalClose}
        />
      )}
    </div>
  );
};

export default TasksModule;