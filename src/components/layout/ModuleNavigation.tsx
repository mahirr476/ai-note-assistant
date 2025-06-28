// src/components/layout/ModuleNavigation.tsx
import React from 'react';
import { FileText, CheckSquare, Calendar, User, Briefcase, Home } from 'lucide-react';
import { ModuleType, ModuleData } from '../../types/modules';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ThemeToggle } from '../theme-toggle';

interface ModuleNavigationProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  moduleData: ModuleData;
}

export const ModuleNavigation: React.FC<ModuleNavigationProps> = ({
  activeModule,
  onModuleChange,
  moduleData
}) => {
  const modules = [
    { id: 'notes' as ModuleType, name: 'Notes', icon: FileText, color: 'text-blue-600', count: moduleData.notes.length },
    { id: 'tasks' as ModuleType, name: 'Tasks', icon: CheckSquare, color: 'text-green-600', count: moduleData.tasks.length },
    { id: 'calendar' as ModuleType, name: 'Calendar', icon: Calendar, color: 'text-purple-600', count: moduleData.calendar.length },
    { id: 'contacts' as ModuleType, name: 'Contacts', icon: User, color: 'text-orange-600', count: moduleData.contacts.length },
    { id: 'projects' as ModuleType, name: 'Projects', icon: Briefcase, color: 'text-indigo-600', count: moduleData.projects.length }
  ];

  return (
    <div className="w-16 bg-card border-r flex flex-col items-center py-4 space-y-4">
      <div className="p-2">
        <Home className="h-6 w-6 text-primary" />
      </div>
      
      <Separator className="w-8" />
      
      {modules.map((module) => {
        const IconComponent = module.icon;
        return (
          <button
            key={module.id}
            onClick={() => onModuleChange(module.id)}
            className={`relative p-3 rounded-lg transition-colors ${
              activeModule === module.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
            title={module.name}
          >
            <IconComponent className="h-5 w-5" />
            {module.count > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center">
                {module.count > 99 ? '99+' : module.count}
              </Badge>
            )}
          </button>
        );
      })}
      
      <div className="flex-1" />
      
      <ThemeToggle />
    </div>
  );
};
