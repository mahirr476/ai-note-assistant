// src/components/modules/tasks/TasksMainView.tsx
import React from 'react';
import { LayoutGrid, List, Columns } from 'lucide-react';
import { TaskViewMode } from '../../TasksModule';
import { Task } from '../../../../types/modules';
import { TasksList } from './TasksList';
import { TasksGrid } from './TasksGrid';
import { TasksKanban } from './TasksKanban';
import { TasksHeader } from './TasksHeader';

interface TasksMainViewProps {
  tasks: Task[];
  viewMode: TaskViewMode;
  setViewMode: (mode: TaskViewMode) => void;
  selectedTasks: Set<string>;
  setSelectedTasks: (tasks: Set<string>) => void;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
  taskStats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    highPriority: number;
  };
}

export const TasksMainView: React.FC<TasksMainViewProps> = ({
  tasks,
  viewMode,
  setViewMode,
  selectedTasks,
  setSelectedTasks,
  onTaskClick,
  onTaskComplete,
  onTaskDelete,
  taskStats
}) => {
  const renderContent = () => {
    switch (viewMode) {
      case 'list':
        return (
          <TasksList
            tasks={tasks}
            selectedTasks={selectedTasks}
            setSelectedTasks={setSelectedTasks}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onTaskDelete={onTaskDelete}
          />
        );
      case 'grid':
        return (
          <TasksGrid
            tasks={tasks}
            selectedTasks={selectedTasks}
            setSelectedTasks={setSelectedTasks}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onTaskDelete={onTaskDelete}
          />
        );
      case 'kanban':
        return (
          <TasksKanban
            tasks={tasks}
            onTaskClick={onTaskClick}
            onTaskComplete={onTaskComplete}
            onTaskDelete={onTaskDelete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <TasksHeader
        taskStats={taskStats}
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedCount={selectedTasks.size}
      />

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};