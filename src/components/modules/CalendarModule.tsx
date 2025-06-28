// src/components/modules/CalendarModule.tsx
import React from 'react';
import { Calendar } from 'lucide-react';
import { ModuleData } from '../../types/modules';

interface CalendarModuleProps {
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
}

export const CalendarModule: React.FC<CalendarModuleProps> = ({ moduleData }) => {
  return (
    <div className="flex-1 p-4 overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Calendar Module
            </h3>
            <p>Calendar interface coming soon!</p>
            <p className="text-sm">You have {moduleData.calendar.length} events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
