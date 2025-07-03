// src/lib/assistant-engine.ts (Clean Enhanced Version)

import { AnalysisResult } from './ai-analysis';
import { Task, CalendarEvent, Contact, Project, AssistantAction } from '../types/modules';

export class AssistantEngine {
  
  generateActions(analysis: AnalysisResult, noteContent: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    // Generate tasks from analyzed content with enhanced extraction
    if (analysis.category === 'Task' || analysis.extractedEntities.tasks.length > 0) {
      const taskActions = this.generateTaskActions(analysis, noteContent, noteId);
      actions.push(...taskActions);
    }
    
    // Generate calendar events from meeting notes or date mentions
    if (analysis.category === 'Meeting' || (analysis.extractedEntities.dates.length > 0 && this.hasMeetingContext(noteContent))) {
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
    
    // IMPORTANT: Ensure all actions have a consistent ID that won't change on re-analysis
    return actions.map(action => ({
      ...action,
      id: this.generateConsistentActionId(action, noteId)
    }));
  }
  
  // Add this new method to generate consistent IDs
  private generateConsistentActionId(action: AssistantAction, noteId: string): string {
    // Create a deterministic ID based on action content and note ID
    // This ensures the same action gets the same ID every time
    const contentHash = this.simpleHash(action.title + action.description + action.type);
    return `${action.type}-${noteId}-${contentHash}`;
  }
  
  // Simple hash function for consistent IDs
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  private hasMeetingContext(content: string): boolean {
    const meetingIndicators = [
      'meeting', 'call', 'conference', 'standup', 'sync', 'discussion',
      'agenda', 'attendees', 'zoom', 'teams', 'schedule', 'appointment'
    ];
    
    return meetingIndicators.some(indicator => 
      new RegExp(`\\b${indicator}\\b`, 'i').test(content)
    );
  }
  
  private generateTaskActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    // Enhanced task extraction patterns
    const taskPatterns = [
      {
        pattern: /(?:todo|task|action(?:\s+item)?):\s*(.+)/gi,
        priority: 'high'
      },
      {
        pattern: /\b(need to|have to|must|should)\s+([^.!?\n]+?)(?=\.|!|\?|\n|$)/gi,
        priority: 'medium',
        extract: (match: RegExpMatchArray) => match[2]?.trim()
      },
      {
        pattern: /^(call|email|send|create|write|update|review|check|schedule|book|order|buy|purchase|complete|finish|start|begin|contact|reach out|follow up)\s+([^.!?\n]+?)(?=\.|!|\?|\n|$)/gmi,
        priority: 'medium',
        extract: (match: RegExpMatchArray) => `${match[1]} ${match[2]}`.trim()
      },
      {
        pattern: /^[-•*]\s*(.+?)(?=\n|$)/gm,
        priority: 'medium'
      },
      {
        pattern: /\[\s*\]\s*(.+?)(?=\n|$)/gm,
        priority: 'medium'
      },
      {
        pattern: /\b(remind|deadline|due)(?:\s+me)?\s+(?:to\s+)?(.+?)(?=\.|!|\?|\n|$)/gi,
        priority: 'high',
        extract: (match: RegExpMatchArray) => match[2]?.trim()
      }
    ];
    
    const foundTasks = new Map<string, { text: string; priority: 'high' | 'medium' | 'low'; context: string }>();
    
    taskPatterns.forEach(({ pattern, priority, extract }) => {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        let taskText = extract ? extract(match) : (match[1] || match[0]);
        
        if (!taskText) continue;
        
        taskText = this.cleanTaskText(taskText);
        
        if (this.isValidTask(taskText)) {
          const contextStart = Math.max(0, match.index - 50);
          const contextEnd = Math.min(content.length, match.index + match[0].length + 50);
          const context = content.slice(contextStart, contextEnd).trim();
          
          // Avoid duplicates by checking similarity
          const isDuplicate = Array.from(foundTasks.keys()).some(existing => 
            this.calculateSimilarity(taskText.toLowerCase(), existing.toLowerCase()) > 0.8
          );
          
          if (!isDuplicate) {
            foundTasks.set(taskText, { 
              text: taskText, 
              priority: priority as 'high' | 'medium' | 'low',
              context 
            });
          }
        }
      }
    });
    
    // Create action for each found task
    Array.from(foundTasks.values()).forEach((task, index) => {
      const dueDate = this.extractTaskDueDate(task.text, task.context, analysis.extractedEntities.dates);
      
      const taskData: Partial<Task> = {
        title: task.text.length > 100 ? task.text.substring(0, 97) + '...' : task.text,
        description: this.generateTaskDescription(task.text, task.context, noteId),
        priority: this.determineTaskPriority(task.priority, analysis.priority, task.text),
        dueDate: dueDate,
        category: this.determineTaskCategory(task.text, analysis.category),
        tags: this.generateTaskTags(task.text, analysis.tags),
        completed: false
      };
      
      actions.push({
        id: `task-${noteId}-${this.simpleHash(task.text)}`, // Use consistent ID based on task content
        type: 'create-task',
        title: `Create Task: ${this.shortenText(task.text, 40)}`,
        description: `Add "${this.shortenText(task.text, 60)}" to your task list${dueDate ? ` (Due: ${this.formatDateForDisplay(dueDate)})` : ''}`,
        data: taskData,
        sourceNoteId: noteId,
        executed: false,
        createdAt: new Date().toISOString()
      });
    });
    
    return actions;
  }
  
  private cleanTaskText(text: string): string {
    return text
      .replace(/^(todo|task|action(?:\s+item)?|need to|have to|must|should|remind|deadline|due):\s*/i, '')
      .replace(/^[-•*\[\]\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private isValidTask(text: string): boolean {
    if (text.length < 3 || text.length > 300) return false;
    if (/^\d+$/.test(text)) return false;
    if (/^[^\w\s]+$/.test(text)) return false;
    if (/^(yes|no|ok|okay|sure|maybe|perhaps)$/i.test(text)) return false;
    
    return true;
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }
  
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  private extractTaskDueDate(taskText: string, context: string, extractedDates: string[]): string | undefined {
    try {
      const combinedText = `${taskText} ${context}`.toLowerCase();
      
      // Debug logging
      console.log('=== TASK DUE DATE EXTRACTION ===');
      console.log('Task text:', taskText);
      console.log('Context:', context);
      console.log('Combined text:', combinedText);
      console.log('Extracted dates:', extractedDates);
      
      // Relative date mapping with explicit date creation to avoid timezone issues
      const createDateFromDaysOffset = (daysToAdd: number): Date => {
        const date = new Date();
        date.setDate(date.getDate() + daysToAdd);
        // Set to end of day to avoid timezone issues
        date.setHours(23, 59, 59, 999);
        return date;
      };
      
      // Check for explicit relative date phrases first (most reliable)
      const relativeDateMap: { [key: string]: number } = {
        'today': 0,
        'tomorrow': 1,
        'by today': 0,
        'by tomorrow': 1,
        'due today': 0,
        'due tomorrow': 1,
        'by end of day': 0,
        'by eod': 0,
        'this morning': 0,
        'this afternoon': 0,
        'this evening': 0,
        'tonight': 0,
        'by tonight': 0
      };
      
      // Check exact phrase matches first
      for (const [phrase, daysToAdd] of Object.entries(relativeDateMap)) {
        if (combinedText.includes(phrase)) {
          console.log(`Found exact phrase "${phrase}", adding ${daysToAdd} days`);
          const targetDate = createDateFromDaysOffset(daysToAdd);
          console.log(`Created date: ${targetDate.toISOString()}`);
          console.log(`Local date string: ${targetDate.toLocaleDateString()}`);
          return targetDate.toISOString();
        }
      }
      
      // Check for day-specific patterns
      const dayPatterns = [
        { pattern: /by\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: 'by_day' },
        { pattern: /due\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: 'due_day' },
        { pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i, type: 'day_only' }
      ];
      
      for (const { pattern, type } of dayPatterns) {
        const match = combinedText.match(pattern);
        if (match) {
          const dayName = match[1].toLowerCase();
          console.log(`Found day pattern "${match[0]}", day: ${dayName}, type: ${type}`);
          
          const daysUntil = this.getDaysUntilDay(dayName);
          console.log(`Days until ${dayName}: ${daysUntil}`);
          
          const targetDate = createDateFromDaysOffset(daysUntil);
          console.log(`Created date for ${dayName}: ${targetDate.toISOString()}`);
          return targetDate.toISOString();
        }
      }
      
      // Check for "next week" and "this week"
      if (combinedText.includes('next week')) {
        console.log('Found "next week"');
        const targetDate = createDateFromDaysOffset(7);
        console.log(`Created date for next week: ${targetDate.toISOString()}`);
        return targetDate.toISOString();
      }
      
      if (combinedText.includes('this week')) {
        console.log('Found "this week"');
        const daysUntilEndOfWeek = this.getDaysUntilEndOfWeek();
        console.log(`Days until end of week: ${daysUntilEndOfWeek}`);
        const targetDate = createDateFromDaysOffset(daysUntilEndOfWeek);
        console.log(`Created date for this week: ${targetDate.toISOString()}`);
        return targetDate.toISOString();
      }
      
      // Find most relevant date from extracted dates
      if (extractedDates && extractedDates.length > 0) {
        console.log('Checking extracted dates...');
        const taskRelevantDate = this.findMostRelevantDate(taskText, context, extractedDates);
        
        if (taskRelevantDate) {
          console.log('Most relevant date found:', taskRelevantDate);
          const parsedDate = this.parseDate(taskRelevantDate);
          
          if (parsedDate && this.isValidFutureDate(parsedDate)) {
            // Ensure we're setting to end of day in local time
            const localDate = new Date(parsedDate);
            localDate.setHours(23, 59, 59, 999);
            console.log('Parsed and adjusted date:', localDate.toISOString());
            console.log('Local date check:', localDate.toLocaleDateString());
            return localDate.toISOString();
          } else {
            console.log('Parsed date is invalid or not in future:', parsedDate);
          }
        } else {
          console.log('No relevant date found from extracted dates');
        }
      }
      
      console.log('No due date found for task');
      return undefined;
    } catch (error) {
      console.error('Error extracting task due date:', error);
      return undefined;
    }
  }
  
  private findMostRelevantDate(taskText: string, context: string, dates: string[]): string | undefined {
    // Score each date based on proximity to the task text
    const combinedText = `${taskText} ${context}`;
    let bestDate: string | undefined;
    let bestScore = -1;
    
    console.log('Finding most relevant date for task:', taskText);
    console.log('Available dates:', dates);
    console.log('Context:', context);
    
    for (const date of dates) {
      let score = 0;
      console.log(`\nScoring date: "${date}"`);
      
      // Higher score if date appears close to task-related keywords
      const taskKeywords = ['due', 'deadline', 'by', 'finish', 'complete', 'submit'];
      const dateIndex = combinedText.toLowerCase().indexOf(date.toLowerCase());
      
      console.log(`Date "${date}" found at index:`, dateIndex);
      
      if (dateIndex !== -1) {
        // Check for task keywords near the date
        const beforeDate = combinedText.slice(Math.max(0, dateIndex - 20), dateIndex).toLowerCase();
        const afterDate = combinedText.slice(dateIndex, Math.min(combinedText.length, dateIndex + date.length + 20)).toLowerCase();
        
        console.log(`Text before date: "${beforeDate}"`);
        console.log(`Text after date: "${afterDate}"`);
        
        for (const keyword of taskKeywords) {
          if (beforeDate.includes(keyword) || afterDate.includes(keyword)) {
            score += 10;
            console.log(`Found keyword "${keyword}" near date, +10 score`);
          }
        }
        
        // Prefer dates that appear in the task text itself rather than broader context
        if (taskText.toLowerCase().includes(date.toLowerCase())) {
          score += 5;
          console.log(`Date appears in task text, +5 score`);
        }
        
        // Prefer future dates
        const parsedDate = this.parseDate(date);
        if (parsedDate && this.isValidFutureDate(parsedDate)) {
          score += 3;
          console.log(`Date is valid future date, +3 score`);
        }
        
        // IMPORTANT FIX: If there's only one date and it's a relative date (today/tomorrow), 
        // and no other dates score higher, use it as fallback
        if (dates.length === 1 && ['today', 'tomorrow', 'yesterday'].includes(date.toLowerCase())) {
          score += 2;
          console.log(`Single relative date fallback, +2 score`);
        }
        
        // IMPORTANT FIX: If there's a direct temporal relationship in the task
        const temporalWords = ['today', 'tomorrow', 'next week', 'this week', 'by friday', 'by monday', 'by tuesday', 'by wednesday', 'by thursday', 'by saturday', 'by sunday'];
        if (temporalWords.some(word => taskText.toLowerCase().includes(word))) {
          score += 8;
          console.log(`Task contains temporal words, +8 score`);
        }
        
        console.log(`Total score for "${date}": ${score}`);
        
        if (score > bestScore) {
          bestScore = score;
          bestDate = date;
          console.log(`New best date: "${date}" with score ${score}`);
        }
      } else {
        console.log(`Date "${date}" not found in combined text`);
      }
    }
    
    // IMPORTANT FIX: If no date scored well but we have dates, pick the first valid future date
    if (!bestDate && dates.length > 0) {
      console.log('No date scored well, trying fallback to first valid future date...');
      for (const date of dates) {
        const parsedDate = this.parseDate(date);
        if (parsedDate && this.isValidFutureDate(parsedDate)) {
          console.log(`Using fallback date: "${date}"`);
          bestDate = date;
          break;
        }
      }
    }
    
    console.log(`Final selected date: "${bestDate}"`);
    return bestDate;
  }
  
  private getDaysUntilEndOfWeek(): number {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  }
  
  private getDaysUntilDay(targetDay: string): number {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
    const targetDayIndex = daysOfWeek.indexOf(targetDay.toLowerCase());
    
    console.log(`Current day: ${currentDay} (${daysOfWeek[currentDay]}), Target day: ${targetDayIndex} (${targetDay})`);
    
    if (targetDayIndex === -1) {
      console.log('Target day not found, defaulting to 7 days');
      return 7;
    }
    
    let daysUntil = targetDayIndex - currentDay;
    
    // If target day is today or in the past this week, move to next week
    if (daysUntil <= 0) {
      daysUntil += 7;
    }
    
    console.log(`Days until ${targetDay}: ${daysUntil}`);
    return daysUntil;
  }
  
  private isValidFutureDate(date: Date): boolean {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
    const oneYearFromNow = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
    
    return date >= threeDaysAgo && date <= oneYearFromNow;
  }
  
  private determineTaskPriority(extractedPriority: 'high' | 'medium' | 'low', notePriority: 'high' | 'medium' | 'low', taskText: string): 'high' | 'medium' | 'low' {
    const highPriorityWords = ['urgent', 'asap', 'immediately', 'critical', 'important', 'emergency'];
    const lowPriorityWords = ['when possible', 'sometime', 'eventually', 'later', 'nice to have'];
    
    const lowerTaskText = taskText.toLowerCase();
    
    if (highPriorityWords.some(word => lowerTaskText.includes(word))) {
      return 'high';
    }
    
    if (lowPriorityWords.some(word => lowerTaskText.includes(word))) {
      return 'low';
    }
    
    return extractedPriority === 'medium' ? notePriority : extractedPriority;
  }
  
  private determineTaskCategory(taskText: string, noteCategory: string): string {
    const lowerTaskText = taskText.toLowerCase();
    
    if (/\b(call|phone|ring)\b/.test(lowerTaskText)) return 'Communication';
    if (/\b(email|message|send|write)\b/.test(lowerTaskText)) return 'Communication';
    if (/\b(buy|purchase|order|shop)\b/.test(lowerTaskText)) return 'Shopping';
    if (/\b(review|check|analyze|evaluate)\b/.test(lowerTaskText)) return 'Review';
    if (/\b(create|build|develop|design)\b/.test(lowerTaskText)) return 'Development';
    if (/\b(meeting|schedule|book|appointment)\b/.test(lowerTaskText)) return 'Meeting';
    if (/\b(research|investigate|study|learn)\b/.test(lowerTaskText)) return 'Research';
    
    return noteCategory === 'General' ? 'Task' : noteCategory;
  }
  
  private generateTaskTags(taskText: string, noteTags: string[]): string[] {
    const tags = new Set([...noteTags]);
    const lowerTaskText = taskText.toLowerCase();
    
    if (/\b(urgent|asap|critical)\b/.test(lowerTaskText)) tags.add('urgent');
    if (/\b(call|phone)\b/.test(lowerTaskText)) tags.add('call');
    if (/\b(email|message)\b/.test(lowerTaskText)) tags.add('email');
    if (/\b(meeting|schedule)\b/.test(lowerTaskText)) tags.add('meeting');
    if (/\b(review|check)\b/.test(lowerTaskText)) tags.add('review');
    if (/\b(buy|purchase|order)\b/.test(lowerTaskText)) tags.add('shopping');
    if (/\b(research|study)\b/.test(lowerTaskText)) tags.add('research');
    if (/\b(follow.?up|check.?in)\b/.test(lowerTaskText)) tags.add('follow-up');
    
    return Array.from(tags).slice(0, 5);
  }
  
  private generateTaskDescription(taskText: string, context: string, noteId: string): string {
    const contextSnippet = context.length > 100 ? context.substring(0, 97) + '...' : context;
    return `Task extracted from note.\n\nContext: ${contextSnippet}\n\nSource Note ID: ${noteId}`;
  }
  
  private shortenText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }
  
  private formatDateForDisplay(isoDate: string): string {
    try {
      const date = new Date(isoDate);
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (this.isSameDay(date, now)) return 'Today';
      if (this.isSameDay(date, tomorrow)) return 'Tomorrow';
      
      return date.toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  }
  
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
  
  private generateEventActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    if (analysis.category === 'Meeting' || this.hasMeetingContext(content)) {
      const meetingTitle = this.extractMeetingTitle(content);
      const attendees = this.filterValidAttendees(analysis.extractedEntities.people);
      const dateTime = this.extractMeetingDateTime(content, analysis.extractedEntities.dates);
      const location = this.extractLocation(content);
      
      const eventData: Partial<CalendarEvent> = {
        title: meetingTitle || 'Meeting',
        description: this.generateMeetingDescription(content),
        startDate: dateTime.start || this.getDefaultMeetingTime(),
        endDate: dateTime.end,
        attendees: attendees,
        location: location,
        category: 'Meeting',
        allDay: false
      };
      
      actions.push({
        id: `event-${noteId}`,
        type: 'create-event',
        title: `Schedule: ${this.shortenText(meetingTitle || 'Meeting', 30)}`,
        description: `Add meeting to calendar${attendees.length > 0 ? ` with ${attendees.slice(0, 2).join(', ')}${attendees.length > 2 ? '...' : ''}` : ''}`,
        data: eventData,
        sourceNoteId: noteId,
        executed: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return actions;
  }
  
  private filterValidAttendees(people: string[]): string[] {
    return people.filter(person => {
      const lowerPerson = person.toLowerCase();
      const excludeWords = ['team', 'everyone', 'all', 'staff', 'group', 'department'];
      return !excludeWords.some(word => lowerPerson.includes(word)) && person.length > 2;
    });
  }
  
  private extractMeetingDateTime(content: string, dates: string[]): { start?: string; end?: string } {
    try {
      const timePattern = /\b(\d{1,2}):(\d{2})\s*(am|pm)?(?:\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)?)?\b/i;
      const timeMatch = content.match(timePattern);
      
      if (dates[0] && timeMatch) {
        const baseDate = this.parseDate(dates[0]);
        if (baseDate && this.isValidFutureDate(baseDate)) {
          let startHours = parseInt(timeMatch[1]);
          const startMinutes = parseInt(timeMatch[2]);
          const startAmPm = timeMatch[3]?.toLowerCase();
          
          if (startAmPm === 'pm' && startHours !== 12) startHours += 12;
          if (startAmPm === 'am' && startHours === 12) startHours = 0;
          
          const startDate = new Date(baseDate);
          startDate.setHours(startHours, startMinutes, 0, 0);
          
          let endDate: Date | undefined;
          
          if (timeMatch[4] && timeMatch[5]) {
            let endHours = parseInt(timeMatch[4]);
            const endMinutes = parseInt(timeMatch[5]);
            const endAmPm = timeMatch[6]?.toLowerCase() || startAmPm;
            
            if (endAmPm === 'pm' && endHours !== 12) endHours += 12;
            if (endAmPm === 'am' && endHours === 12) endHours = 0;
            
            endDate = new Date(baseDate);
            endDate.setHours(endHours, endMinutes, 0, 0);
          } else {
            endDate = new Date(startDate);
            endDate.setHours(startDate.getHours() + 1);
          }
          
          return {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          };
        }
      }
      
      if (dates[0]) {
        const parsedDate = this.parseDate(dates[0]);
        if (parsedDate && this.isValidFutureDate(parsedDate)) {
          parsedDate.setHours(10, 0, 0, 0);
          const endDate = new Date(parsedDate);
          endDate.setHours(11, 0, 0, 0);
          
          return {
            start: parsedDate.toISOString(),
            end: endDate.toISOString()
          };
        }
      }
      
      return { start: undefined, end: undefined };
    } catch (error) {
      console.warn('Error extracting meeting date time:', error);
      return { start: undefined, end: undefined };
    }
  }
  
  private generateMeetingDescription(content: string): string {
    const maxLength = 300;
    if (content.length <= maxLength) return content;
    
    const lines = content.split('\n');
    let description = '';
    
    for (const line of lines) {
      if (description.length + line.length + 1 <= maxLength - 3) {
        description += (description ? '\n' : '') + line;
      } else {
        break;
      }
    }
    
    return description + (content.length > description.length ? '...' : '');
  }
  
  private generateContactActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    if (analysis.category === 'Contact' || analysis.extractedEntities.emails.length > 0 || analysis.extractedEntities.phones.length > 0) {
      const name = this.extractContactName(content, analysis.extractedEntities.people);
      const email = analysis.extractedEntities.emails[0];
      const phone = analysis.extractedEntities.phones[0];
      const company = this.extractCompany(content);
      
      if (name || email || phone) {
        const contactData: Partial<Contact> = {
          name: name || this.generateNameFromEmail(email) || 'Unknown Contact',
          email: email,
          phone: phone,
          company: company,
          notes: this.generateContactNotes(content),
          tags: this.generateContactTags(analysis.tags, content)
        };
        
        actions.push({
          id: `contact-${noteId}`,
          type: 'create-contact',
          title: `Save Contact: ${contactData.name}`,
          description: `Add ${contactData.name} to your address book${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}`,
          data: contactData,
          sourceNoteId: noteId,
          executed: false,
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return actions;
  }
  
  private generateNameFromEmail(email?: string): string | undefined {
    if (!email) return undefined;
    
    const localPart = email.split('@')[0];
    const parts = localPart.split(/[._-]+/);
    
    return parts
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
  
  private generateContactNotes(content: string): string {
    const maxLength = 500;
    if (content.length <= maxLength) return content;
    
    return content.substring(0, maxLength - 3) + '...';
  }
  
  private generateContactTags(baseTags: string[], content: string): string[] {
    const tags = new Set([...baseTags]);
    const lowerContent = content.toLowerCase();
    
    if (/\b(client|customer)\b/.test(lowerContent)) tags.add('client');
    if (/\b(vendor|supplier|partner)\b/.test(lowerContent)) tags.add('vendor');
    if (/\b(colleague|coworker|team)\b/.test(lowerContent)) tags.add('colleague');
    if (/\b(lead|prospect|potential)\b/.test(lowerContent)) tags.add('lead');
    if (/\b(referral|reference)\b/.test(lowerContent)) tags.add('referral');
    
    return Array.from(tags).slice(0, 5);
  }
  
  private generateProjectActions(analysis: AnalysisResult, content: string, noteId: string): AssistantAction[] {
    const actions: AssistantAction[] = [];
    
    if (analysis.category === 'Project') {
      const projectName = this.extractProjectName(content);
      const timeline = this.extractProjectTimeline(content, analysis.extractedEntities.dates);
      const team = this.filterValidTeamMembers(analysis.extractedEntities.people);
      const budget = this.extractBudget(content);
      
      const projectData: Partial<Project> = {
        name: projectName || 'New Project',
        description: this.generateProjectDescription(content),
        status: 'planning',
        priority: analysis.priority,
        startDate: timeline.start,
        endDate: timeline.end,
        progress: 0,
        team: team,
        budget: budget,
        tags: this.generateProjectTags(analysis.tags, content),
        tasks: []
      };
      
      actions.push({
        id: `project-${noteId}`,
        type: 'create-project',
        title: `Create Project: ${this.shortenText(projectName || 'New Project', 30)}`,
        description: `Set up "${projectName || 'New Project'}" with timeline and team`,
        data: projectData,
        sourceNoteId: noteId,
        executed: false,
        createdAt: new Date().toISOString()
      });
    }
    
    return actions;
  }
  
  private filterValidTeamMembers(people: string[]): string[] {
    return people.filter(person => {
      const lowerPerson = person.toLowerCase();
      const excludeWords = ['team', 'department', 'company', 'organization', 'group', 'staff'];
      return !excludeWords.some(word => lowerPerson.includes(word)) && person.length > 2;
    });
  }
  
  private generateProjectDescription(content: string): string {
    const maxLength = 300;
    if (content.length > maxLength) {
      return content.substring(0, maxLength - 3) + '...';
    }
    return content;
  }
  
  private generateProjectTags(baseTags: string[], content: string): string[] {
    const tags = new Set([...baseTags]);
    const lowerContent = content.toLowerCase();
    
    if (/\b(web|website|app|application)\b/.test(lowerContent)) tags.add('development');
    if (/\b(marketing|campaign|promotion)\b/.test(lowerContent)) tags.add('marketing');
    if (/\b(research|analysis|study)\b/.test(lowerContent)) tags.add('research');
    if (/\b(design|creative|ui|ux)\b/.test(lowerContent)) tags.add('design');
    if (/\b(launch|release|deployment)\b/.test(lowerContent)) tags.add('launch');
    
    return Array.from(tags).slice(0, 5);
  }
  
  private parseDate(dateStr: string): Date | null {
    try {
      const cleanDateStr = dateStr.trim().toLowerCase();
      
      console.log(`Parsing date string: "${dateStr}"`);
      
      // Handle relative dates
      const relativeDates: Record<string, number> = {
        'today': 0,
        'tomorrow': 1,
        'yesterday': -1,
        'next week': 7,
        'this week': this.getDaysUntilEndOfWeek(),
        'next month': 30
      };
      
      if (relativeDates[cleanDateStr] !== undefined) {
        const date = new Date();
        date.setDate(date.getDate() + relativeDates[cleanDateStr]);
        console.log(`Relative date "${cleanDateStr}" parsed to:`, date.toISOString());
        return date;
      }
      
      // Handle day names
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayIndex = daysOfWeek.indexOf(cleanDateStr);
      if (dayIndex !== -1) {
        const today = new Date();
        const daysUntil = this.getDaysUntilDay(cleanDateStr);
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntil);
        console.log(`Day name "${cleanDateStr}" parsed to:`, targetDate.toISOString());
        return targetDate;
      }
      
      // Handle "next [day]" or "this [day]"
      const nextDayMatch = cleanDateStr.match(/^(next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
      if (nextDayMatch) {
        const modifier = nextDayMatch[1];
        const day = nextDayMatch[2];
        const daysUntil = this.getDaysUntilDay(day);
        const adjustedDays = modifier === 'next' ? daysUntil + 7 : daysUntil;
        
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + adjustedDays);
        console.log(`Pattern "${cleanDateStr}" parsed to:`, targetDate.toISOString());
        return targetDate;
      }
      
      // Try standard date parsing with better error handling
      const standardDate = new Date(dateStr);
      if (!isNaN(standardDate.getTime()) && standardDate.getFullYear() > 1900) {
        // Ensure the date is in the local timezone
        const localDate = new Date(standardDate.getFullYear(), standardDate.getMonth(), standardDate.getDate());
        console.log(`Standard parsing "${dateStr}" to:`, localDate.toISOString());
        return localDate;
      }
      
      // Try various date formats with more robust parsing
      const dateFormats = [
        // MM/DD/YYYY
        {
          pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
          parse: (match: RegExpMatchArray) => {
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            return new Date(year, month, day);
          }
        },
        // MM-DD-YYYY
        {
          pattern: /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
          parse: (match: RegExpMatchArray) => {
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            return new Date(year, month, day);
          }
        },
        // YYYY-MM-DD
        {
          pattern: /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
          parse: (match: RegExpMatchArray) => {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            return new Date(year, month, day);
          }
        },
        // MM/DD/YY
        {
          pattern: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,
          parse: (match: RegExpMatchArray) => {
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            let year = parseInt(match[3]);
            if (year < 50) year += 2000;
            else if (year < 100) year += 1900;
            return new Date(year, month, day);
          }
        }
      ];
      
      for (const format of dateFormats) {
        const match = dateStr.match(format.pattern);
        if (match) {
          const date = format.parse(match);
          if (!isNaN(date.getTime())) {
            console.log(`Format parsing "${dateStr}" to:`, date.toISOString());
            return date;
          }
        }
      }
      
      // Handle month names
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      
      const monthDayPattern = /^(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?$/i;
      const monthMatch = dateStr.match(monthDayPattern);
      
      if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase();
        const monthIndex = monthNames.indexOf(monthName);
        const day = parseInt(monthMatch[2]);
        const year = monthMatch[3] ? parseInt(monthMatch[3]) : new Date().getFullYear();
        
        if (monthIndex !== -1) {
          const date = new Date(year, monthIndex, day);
          if (!isNaN(date.getTime())) {
            console.log(`Month name parsing "${dateStr}" to:`, date.toISOString());
            return date;
          }
        }
      }
      
      console.log(`Could not parse date: "${dateStr}"`);
      return null;
    } catch (error) {
      console.error('Error parsing date:', dateStr, error);
      return null;
    }
  }
  
  private getDefaultMeetingTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // If it's weekend, move to Monday
    if (tomorrow.getDay() === 0) { // Sunday
      tomorrow.setDate(tomorrow.getDate() + 1);
    } else if (tomorrow.getDay() === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2);
    }
    
    tomorrow.setHours(10, 0, 0, 0);
    return tomorrow.toISOString();
  }
  
  private extractMeetingTitle(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    const meetingPatterns = [
      /^(.+?)\s+meeting/i,
      /^meeting\s+(?:with\s+)?(.+)/i,
      /^(.+?)\s+with/i,
      /^(.+?)\s+standup/i,
      /^(.+?)\s+sync/i,
      /^(.+?)\s+call/i
    ];
    
    for (const pattern of meetingPatterns) {
      const match = firstLine.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    const cleanTitle = firstLine
      .replace(/^(meeting|call|conference|standup|sync):\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleanTitle.length > 50 ? cleanTitle.substring(0, 47) + '...' : cleanTitle;
  }
  
  private extractLocation(content: string): string | undefined {
    const locationPatterns = [
      /(?:location|place|venue|address):\s*(.+)/i,
      /(?:room|conference room|meeting room)\s+([a-z0-9\-\s]+)/i,
      /\b(zoom|teams|skype|google meet|webex|slack|discord)\b/i,
      /\b\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)\b/i
    ];
    
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[1]?.trim() || match[0].trim();
      }
    }
    
    return undefined;
  }
  
  private extractContactName(content: string, people: string[]): string | undefined {
    const namePatterns = [
      /(?:name|contact):\s*(.+)/i,
      /(?:meet|meeting with|call with|email)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i
    ];
    
    for (const pattern of namePatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50) {
          return name;
        }
      }
    }
    
    return people.find(person => person.length > 2 && person.length < 50);
  }
  
  private extractCompany(content: string): string | undefined {
    const companyPatterns = [
      /(?:company|organization|employer):\s*(.+)/i,
      /(?:works? at|employed by|from)\s+([A-Z][a-z\s&]+(?:corp|inc|llc|ltd|co|company|corporation|incorporated)?)/i,
      /\b([A-Z][a-z\s&]+(?:corp|inc|llc|ltd|co|company|corporation|incorporated))\b/i
    ];
    
    for (const pattern of companyPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        if (company.length > 2 && company.length < 100) {
          return company;
        }
      }
    }
    
    return undefined;
  }
  
  private extractProjectName(content: string): string {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    const projectPatterns = [
      /^(.+?)\s+project/i,
      /^project:\s*(.+)/i,
      /^(.+?)\s+(?:timeline|roadmap|plan)/i,
      /^(?:project\s+)?(.+?)(?:\s+development|\s+implementation)?$/i
    ];
    
    for (const pattern of projectPatterns) {
      const match = firstLine.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        if (name.length > 2) {
          return name.length > 50 ? name.substring(0, 47) + '...' : name;
        }
      }
    }
    
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  }
  
  private extractProjectTimeline(content: string, dates: string[]): { start?: string; end?: string } {
    const timeline = { start: undefined as string | undefined, end: undefined as string | undefined };
    
    try {
      const timelinePatterns = [
        /(?:timeline|schedule|duration):\s*(.+)/i,
        /(?:from|start)(?:ing|s)?\s+(.+?)\s+(?:to|until|through)\s+(.+)/i,
        /(.+?)\s+(?:to|-)\s+(.+)/i
      ];
      
      for (const pattern of timelinePatterns) {
        const match = content.match(pattern);
        if (match) {
          if (match[2]) {
            const startDate = this.parseDate(match[1]);
            const endDate = this.parseDate(match[2]);
            
            if (startDate) timeline.start = startDate.toISOString();
            if (endDate) timeline.end = endDate.toISOString();
            
            return timeline;
          }
        }
      }
      
      if (dates.length >= 2) {
        const startDate = this.parseDate(dates[0]);
        const endDate = this.parseDate(dates[dates.length - 1]);
        
        if (startDate && this.isValidFutureDate(startDate)) {
          timeline.start = startDate.toISOString();
        }
        
        if (endDate && this.isValidFutureDate(endDate) && endDate > (startDate || new Date())) {
          timeline.end = endDate.toISOString();
        }
      } else if (dates.length === 1) {
        const date = this.parseDate(dates[0]);
        if (date && this.isValidFutureDate(date)) {
          timeline.start = date.toISOString();
        }
      }
    } catch (error) {
      console.warn('Error extracting project timeline:', error);
    }
    
    return timeline;
  }
  
  private extractBudget(content: string): number | undefined {
    const budgetPatterns = [
      /budget:\s*\$\s*([0-9,]+)/i,
      /cost:\s*\$\s*([0-9,]+)/i,
      /\$\s*([0-9,]+)(?:\s*(?:budget|cost|total|amount))?/i
    ];
    
    for (const pattern of budgetPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseInt(numStr);
        
        if (!isNaN(num) && num > 0 && num < 10000000) {
          return num;
        }
      }
    }
    
    return undefined;
  }
}

export const assistantEngine = new AssistantEngine();