// src/components/modules/ContactsModule.tsx
import React from 'react';
import { User } from 'lucide-react';
import { ModuleData } from '../../types/modules';

interface ContactsModuleProps {
  moduleData: ModuleData;
  setModuleData: (data: ModuleData) => void;
}

export const ContactsModule: React.FC<ContactsModuleProps> = ({ moduleData }) => {
  return (
    <div className="flex-1 p-4 overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-foreground">
              Contacts Module
            </h3>
            <p>Contact management interface coming soon!</p>
            <p className="text-sm">You have {moduleData.contacts.length} contacts.</p>
          </div>
        </div>
      </div>
    </div>
  );
};