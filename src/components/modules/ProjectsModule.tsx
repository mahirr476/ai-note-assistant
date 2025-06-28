// src/components/modules/ProjectsModule.tsx
import React from 'react';
import { Briefcase } from 'lucide-react';
import { ModuleData } from '../../types/modules';

interface ProjectsModuleProps {
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({ moduleData }) => {
  return (
    <div className="flex-1 p-4 overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Projects Module
            </h3>
            <p>Project management interface coming soon!</p>
            <p className="text-sm">You have {moduleData.projects.length} projects.</p>
          </div>
        </div>
      </div>
    </div>
  );
};