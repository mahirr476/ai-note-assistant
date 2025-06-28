// src/lib/assistant-engine.ts (Fixed version with proper date handling)

import { AnalysisResult } from './ai-analysis';
import { Task, CalendarEvent, Contact, Project, AssistantAction } from '../types/modules';

export class AssistantEngine {
  
  // Generate assistant actions based on note analysis
  generateActions(analysis: AnalysisResult, noteContent: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    // Generate tasks from analyzed content
    if (analysis.category === 'Task' || analysis.extractedEntities.tasks.length > 0) {
      const taskActions = this.generateTaskActions(analysis, noteContent, noteId);
      actions.push(...taskActions);
    }
    
    // Generate calendar events from meeting notes or date mentions
    if (analysis.category === 'Meeting' || analysis.extractedEntities.dates.length > 0) {
      const eventActions = this.generateEventActions(analysis, noteContent, noteId);
      actions.push(...eventActions);
    }
    
    // Generate contacts from contact information
    if (analysis.category === 'Contact' || analysis.extractedEntities.emails.length > 0 || analysis.extractedEntities.phones.length > 0) {
      const contactActions = this.generateContactActions(analysis, noteContent, noteId);
      actions.push(...contactActions);
    }
    
    // Generate projects from project-related content
    if (analysis.category === 'Project') {
      const projectActions = this.generateProjectActions(analysis, noteContent, noteId);
      actions.push(...projectActions);
    }
    
    return actions;
  }
  
  private generateTaskActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    // Extract tasks from content
    const taskPatterns = [
      /(?:todo|task|action):\s*(.+)/gi,
      /(?:need to|have to|must|should)\s+([^.!?\n]+)/gi,
      /(?:remind|deadline|due)\s+([^.!?\n]+)/gi,
      /^[-•*]\s*(.+)/gm // Bullet points
    ];
    
    const foundTasks = new Set<string>();
    
    taskPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const taskText = match[1]?.trim();
        if (taskText && taskText.length > 3 && taskText.length < 200) {
          foundTasks.add(taskText);
        }
      }
    });
    
    // Create action for each found task
    foundTasks.forEach((taskText, index) => {
      const dueDate = this.extractDueDate(taskText, analysis.extractedEntities.dates);
      
      const taskData: Partial<Task> = {
        title: taskText.length > 100 ? taskText.substring(0, 97) + '...' : taskText,
        description: `Extracted from note: ${content.substring(0, 100)}...`,
        priority: analysis.priority,
        dueDate: dueDate,
        category: analysis.category === 'Task' ? 'Task' : analysis.category,
        tags: analysis.tags,
        completed: false
      };
      
      actions.push({
        id: `task-${noteId}-${index}`,
        type: 'create-task',
        title: `Create Task: ${taskText.substring(0, 30)}${taskText.length > 30 ? '...' : ''}`,
        description: `Add "${taskText}" to your task list`,
        data: taskData,
        sourceNoteId: noteId,
        executed: false,
        createdAt: new Date().toISOString()
      });
    });
    
    return actions;
  }
  
  private generateEventActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    if (analysis.category === 'Meeting') {
      // Extract meeting information
      const meetingTitle = this.extractMeetingTitle(content);
      const attendees = analysis.extractedEntities.people;
      const dateTime = this.extractDateTime(content, analysis.extractedEntities.dates);
      const location = this.extractLocation(content);
      
      const eventData: Partial<CalendarEvent> = {
        title: meetingTitle || 'Meeting',
        description: content.length > 200 ? content.substring(0, 197) + '...' : content,
        startDate: dateTime || this.getDefaultMeetingTime(),
        attendees: attendees,
        location: location,
        category: 'Meeting',
        allDay: false
      };
      
      actions.push({
        id: `event-${noteId}`,
        type: 'create-event',
        title: `Schedule: ${meetingTitle || 'Meeting'}`,
        description: `Add meeting to calendar${attendees.length > 0 ? ` with ${attendees.join(', ')}` : ''}`,
        data: eventData,
        sourceNoteId: noteId,
        executed: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return actions;
  }
  
  private generateContactActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    if (analysis.category === 'Contact') {
      const name = this.extractContactName(content, analysis.extractedEntities.people);
      const email = analysis.extractedEntities.emails[0];
      const phone = analysis.extractedEntities.phones[0];
      const company = this.extractCompany(content);
      
      if (name || email || phone) {
        const contactData: Partial<Contact> = {
          name: name || 'Unknown Contact',
          email: email,
          phone: phone,
          company: company,
          notes: content.length > 500 ? content.substring(0, 497) + '...' : content,
          tags: analysis.tags
        };
        
        actions.push({
          id: `contact-${noteId}`,
          type: 'create-contact',
          title: `Save Contact: ${name || email || phone}`,
          description: `Add contact information to your address book`,
          data: contactData,
          sourceNoteId: noteId,
          executed: false,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return actions;
  }
  
  private generateProjectActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    if (analysis.category === 'Project') {
      const projectName = this.extractProjectName(content);
      const timeline = this.extractProjectTimeline(content, analysis.extractedEntities.dates);
      const team = analysis.extractedEntities.people;
      const budget = this.extractBudget(content);
      
      const projectData: Partial<Project> = {
        name: projectName || 'New Project',
        description: content.length > 300 ? content.substring(0, 297) + '...' : content,
        status: 'planning',
        priority: analysis.priority,
        startDate: timeline.start,
        endDate: timeline.end,
        progress: 0,
        team: team,
        budget: budget,
        tags: analysis.tags,
        tasks: []
      };
      
      actions.push({
        id: `project-${noteId}`,
        type: 'create-project',
        title: `Create Project: ${projectName || 'New Project'}`,
        description: `Set up project with timeline and team`,
        data: projectData,
        sourceNoteId: noteId,
        executed: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return actions;
  }
  
  // Helper methods for extraction with better error handling
  private extractDueDate(taskText: string, dates: string[]): string | undefined {
    try {
      const taskWords = taskText.toLowerCase();
      
      // Handle relative dates first
      if (taskWords.includes('today')) {
        return new Date().toISOString();
      }
      
      if (taskWords.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString();
      }
      
      if (taskWords.includes('next week')) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return nextWeek.toISOString();
      }
      
      if (taskWords.includes('this week')) {
        const endOfWeek = new Date();
        endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
        return endOfWeek.toISOString();
      }
      
      // Try to parse provided dates
      if (dates && dates.length > 0) {
        for (const dateStr of dates) {
          const parsedDate = this.parseDate(dateStr);
          if (parsedDate) {
            return parsedDate.toISOString();
          }
        }
      }
      
      return undefined;
    } catch (error) {
      console.warn('Error extracting due date:', error);
      return undefined;
    }
  }
  
  private parseDate(dateStr: string): Date | null {
    try {
      // Clean up the date string
      const cleanDateStr = dateStr.trim().toLowerCase();
      
      // Handle relative dates
      if (cleanDateStr.includes('today')) return new Date();
      if (cleanDateStr.includes('tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow;
      }
      
      // Try different date formats
      const dateFormats = [
        // Standard formats
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // MM/DD/YYYY
        /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
        /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
        
        // Month name formats
        /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
        
        // Day name (return next occurrence)
        /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i
      ];
      
      // Try standard date parsing first
      const standardDate = new Date(dateStr);
      if (!isNaN(standardDate.getTime()) && standardDate.getFullYear() > 1900) {
        return standardDate;
      }
      
      // Try regex patterns
      for (const format of dateFormats) {
        const match = dateStr.match(format);
        if (match) {
          if (match[1] && match[2] && match[3]) {
            // Numeric date
            const date = new Date(parseInt(match[3]), parseInt(match[1]) - 1, parseInt(match[2]));
            if (!isNaN(date.getTime())) {
              return date;
            }
          } else if (match[1] && match[2]) {
            // Month name + day
            const monthNames = ['january', 'february', 'march', 'april', 'may', 'june',
                              'july', 'august', 'september', 'october', 'november', 'december'];
            const monthIndex = monthNames.indexOf(match[1].toLowerCase());
            if (monthIndex !== -1) {
              const currentYear = new Date().getFullYear();
              const date = new Date(currentYear, monthIndex, parseInt(match[2]));
              if (!isNaN(date.getTime())) {
                return date;
              }
            }
          } else if (match[1]) {
            // Day name - find next occurrence
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const targetDay = dayNames.indexOf(match[1].toLowerCase());
            if (targetDay !== -1) {
              const today = new Date();
              const daysUntilTarget = (targetDay + 7 - today.getDay()) % 7;
              const targetDate = new Date(today);
              targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
              return targetDate;
            }
          }
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing date:', dateStr, error);
      return null;
    }
  }
  
  private extractMeetingTitle(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // Look for meeting patterns
    const meetingPatterns = [
      /^(.+?)\s+meeting/i,
      /^meeting\s+(.+)/i,
      /^(.+?)\s+with/i,
      /^(.+?)\s+standup/i
    ];
    
    for (const pattern of meetingPatterns) {
      const match = firstLine.match(pattern);
      if (match) return match[1].trim();
    }
    
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }
  
  private extractDateTime(content: string, dates: string[]): string | undefined {
    try {
      // Try to find time patterns
      const timePattern = /\b(\d{1,2}):(\d{2})\s*(am|pm)?\b/i;
      const timeMatch = content.match(timePattern);
      
      if (dates[0] && timeMatch) {
        // Combine date and time
        const baseDate = this.parseDate(dates[0]);
        if (baseDate) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const ampm = timeMatch[3]?.toLowerCase();
          
          if (ampm === 'pm' && hours !== 12) hours += 12;
          if (ampm === 'am' && hours === 12) hours = 0;
          
          baseDate.setHours(hours, minutes, 0, 0);
          return baseDate.toISOString();
        }
      }
      
      if (dates[0]) {
        const parsedDate = this.parseDate(dates[0]);
        return parsedDate ? parsedDate.toISOString() : undefined;
      }
      
      return undefined;
    } catch (error) {
      console.warn('Error extracting date time:', error);
      return undefined;
    }
  }
  
  private getDefaultMeetingTime(): string {
    // Default to next business day at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString();
  }
  
  private extractLocation(content: string): string | undefined {
    const locationPatterns = [
      /location:\s*(.+)/i,
      /room\s+([a-z0-9]+)/i,
      /conference\s+room\s+([a-z0-9]+)/i,
      /zoom|teams|meet/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) return match[1] || match[0];
    }
    
    return undefined;
  }
  
  private extractContactName(content: string, people: string[]): string | undefined {
    // Look for name patterns
    const namePattern = /name:\s*(.+)/i;
    const match = content.match(namePattern);
    if (match) return match[1].trim();
    
    return people[0]; // Use first extracted person
  }
  
  private extractCompany(content: string): string | undefined {
    const companyPatterns = [
      /company:\s*(.+)/i,
      /organization:\s*(.+)/i,
      /(?:corp|inc|llc|ltd)\b/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = content.match(pattern);
      if (match) return match[1] || match[0];
    }
    
    return undefined;
  }
  
  private extractProjectName(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // Look for project patterns
    const projectPatterns = [
      /^(.+?)\s+project/i,
      /^project:\s*(.+)/i,
      /^(.+?)\s+timeline/i
    ];
    
    for (const pattern of projectPatterns) {
      const match = firstLine.match(pattern);
      if (match) return match[1].trim();
    }
    
    return firstLine.length > 30 ? firstLine.substring(0, 27) + '...' : firstLine;
  }
  
  private extractProjectTimeline(content: string, dates: string[]): { start?: string; end?: string } {
    const timeline = { start: undefined as string | undefined, end: undefined as string | undefined };
    
    try {
      if (dates.length >= 2) {
        const startDate = this.parseDate(dates[0]);
        const endDate = this.parseDate(dates[dates.length - 1]);
        
        timeline.start = startDate ? startDate.toISOString() : undefined;
        timeline.end = endDate ? endDate.toISOString() : undefined;
      } else if (dates.length === 1) {
        const parsedDate = this.parseDate(dates[0]);
        timeline.start = parsedDate ? parsedDate.toISOString() : undefined;
      }
    } catch (error) {
      console.warn('Error extracting project timeline:', error);
    }
    
    return timeline;
  }
  
  private extractBudget(content: string): number | undefined {
    const budgetPattern = /\$\s*([0-9,]+)/;
    const match = content.match(budgetPattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const num = parseInt(numStr);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }
  
  // Execute an assistant action
  executeAction(action: AssistantAction): Task | CalendarEvent | Contact | Project {
    const now = new Date().toISOString();
    const baseId = Date.now().toString();
    
    switch (action.type) {
      case 'create-task':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          ...action.data
        } as Task;
        
      case 'create-event':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          ...action.data
        } as CalendarEvent;
        
      case 'create-contact':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          ...action.data
        } as Contact;
        
      case 'create-project':
        return {
          id: baseId,
          createdAt: now,
          updatedAt: now,
          sourceNoteId: action.sourceNoteId,
          ...action.data
        } as Project;
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}

export const assistantEngine = new AssistantEngine();