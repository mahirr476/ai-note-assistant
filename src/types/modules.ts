// src/types/modules.ts

import { AnalysisResult } from '../lib/ai-analysis';

// Enhanced Note interface with AI analysis
export interface Note {
  id: string;
  content: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  location: any;
  tags: string[];
  category: string;
  aiAnalysis?: AnalysisResult;
  assistantActions?: AssistantAction[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  sourceNoteId?: string;
  category: string;
  tags: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  attendees: string[];
  createdAt: string;
  updatedAt: string;
  sourceNoteId?: string;
  category: string;
  allDay: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  sourceNoteId?: string;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  startDate?: string;
  endDate?: string;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  sourceNoteId?: string;
  tasks: string[]; // Task IDs
  team: string[]; // Contact IDs or names
  budget?: number;
  tags: string[];
}

export interface Module {
  id: string;
  name: string;
  icon: React.ComponentType;
  description: string;
  count: number;
  color: string;
}

export type ModuleType = 'notes' | 'tasks' | 'calendar' | 'contacts' | 'projects';

export interface ModuleData {
  notes: Note[]; // 👈 Changed from any[] to Note[]
  tasks: Task[];
  calendar: CalendarEvent[];
  contacts: Contact[];
  projects: Project[];
}

// AI Assistant Actions that can be performed
export interface AssistantAction {
  id: string;
  type: 'create-task' | 'create-event' | 'create-contact' | 'create-project' | 'set-reminder';
  title: string;
  description: string;
  data: any;
  sourceNoteId: string;
  executed: boolean;
  createdAt: string;
}