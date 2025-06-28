// src/lib/ai-analysis.ts (Updated with better priority detection)

export interface AnalysisResult {
  category: string;
  confidence: number;
  tags: string[];
  extractedEntities: {
    dates: string[];
    emails: string[];
    phones: string[];
    people: string[];
    tasks: string[];
    locations: string[];
  };
  insights: string[];
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
}

export interface CategoryPattern {
  name: string;
  keywords: string[];
  patterns: RegExp[];
  weight: number;
}

// Enhanced priority keywords with more comprehensive detection
const PRIORITY_KEYWORDS = {
  high: [
    // Urgency words
    'urgent', 'asap', 'immediately', 'emergency', 'critical', 'important', 'priority',
    'deadline', 'due today', 'due now', 'overdue', 'rush', 'quick', 'fast',
    // Action words indicating urgency
    'must', 'need to', 'have to', 'required', 'essential', 'crucial', 'vital',
    // Time pressure
    'today', 'now', 'right away', 'this morning', 'before', 'by end of day',
    // Business urgency
    'client', 'customer', 'boss', 'meeting', 'presentation', 'report due',
    // Emotional urgency
    'stressed', 'worried', 'panic', 'help', 'problem', 'issue', 'fix',
    // Financial urgency
    'payment', 'invoice', 'bill', 'tax', 'budget', 'money', 'cost'
  ],
  medium: [
    // Planned activities
    'soon', 'this week', 'next week', 'follow up', 'review', 'discuss', 'plan',
    'schedule', 'organize', 'prepare', 'research', 'investigate', 'consider',
    // Work tasks
    'project', 'update', 'check', 'call', 'email', 'send', 'create', 'write',
    'develop', 'build', 'design', 'implement', 'test', 'deploy',
    // Learning/improvement
    'learn', 'study', 'practice', 'improve', 'optimize', 'enhance', 'upgrade'
  ],
  low: [
    // Future/optional
    'later', 'someday', 'eventually', 'when possible', 'if time', 'maybe',
    'nice to have', 'consider', 'think about', 'explore', 'investigate',
    // Leisure/personal
    'hobby', 'fun', 'entertainment', 'relax', 'vacation', 'weekend',
    'personal', 'optional', 'backup', 'alternative', 'extra', 'bonus',
    // Low commitment
    'might', 'could', 'should consider', 'possibly', 'perhaps', 'potentially'
  ]
};

// Category detection patterns (existing code)
const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    name: 'Meeting',
    keywords: ['meeting', 'agenda', 'attendees', 'minutes', 'discussion', 'conference', 'call', 'zoom', 'teams'],
    patterns: [
      /\b(meeting|call|conference)\s+(with|about|regarding)/i,
      /\b(agenda|attendees|minutes)\b/i,
      /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i
    ],
    weight: 1.0
  },
  {
    name: 'Task',
    keywords: ['todo', 'task', 'deadline', 'due', 'remind', 'action', 'complete', 'finish', 'implement'],
    patterns: [
      /\b(todo|task|deadline|due|remind|action)\b/i,
      /\b(need to|have to|must|should)\s+\w+/i,
      /\b(complete|finish|implement|work on)\b/i
    ],
    weight: 1.2
  },
  {
    name: 'Idea',
    keywords: ['idea', 'brainstorm', 'concept', 'innovation', 'proposal', 'suggestion', 'thought'],
    patterns: [
      /\b(idea|concept|thought|brainstorm)\b/i,
      /\b(what if|imagine|could we)\b/i,
      /\b(innovation|creative|proposal)\b/i
    ],
    weight: 0.8
  },
  {
    name: 'Contact',
    keywords: ['contact', 'phone', 'email', 'address', 'reach', 'call', 'message'],
    patterns: [
      /\b[\w.-]+@[\w.-]+\.\w+\b/i,
      /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
      /\b(contact|reach|call|email|message)\b/i
    ],
    weight: 1.1
  },
  {
    name: 'Project',
    keywords: ['project', 'milestone', 'sprint', 'feature', 'development', 'release', 'version'],
    patterns: [
      /\b(project|milestone|sprint|feature)\b/i,
      /\b(development|release|version)\s+\w+/i,
      /\b(timeline|roadmap|planning)\b/i
    ],
    weight: 0.9
  },
  {
    name: 'Finance',
    keywords: ['budget', 'cost', 'price', 'money', 'payment', 'invoice', 'expense'],
    patterns: [
      /\$\d+/i,
      /\b(budget|cost|price|payment|invoice)\b/i,
      /\b(expense|revenue|profit|loss)\b/i
    ],
    weight: 1.0
  }
];

// Entity extraction patterns (existing)
const ENTITY_PATTERNS = {
  dates: [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}\b/gi,
    /\b(today|tomorrow|yesterday|next week|last week|this week|next month)\b/gi
  ],
  emails: [/\b[\w.-]+@[\w.-]+\.\w+\b/g],
  phones: [
    /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
  ],
  people: [
    /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g,
    /\b(mr|mrs|ms|dr|prof)\.\s+[A-Z][a-z]+/gi
  ],
  tasks: [
    /\b(todo|task|action):\s*(.+)/gi,
    /\b(need to|have to|must|should)\s+([^.!?\n]+)/gi,
    /\b(remind|deadline|due)\s+([^.!?\n]+)/gi
  ],
  locations: [
    /\b\d+\s+[A-Z][a-z]+\s+(street|st|avenue|ave|road|rd|drive|dr)\b/gi,
    /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/g,
    /\b(office|building|room|floor)\s+\w+/gi
  ]
};

export class LocalAIAnalyzer {
  
  analyzeNote(content: string): AnalysisResult {
    const normalizedContent = content.toLowerCase();
    
    // Analyze category
    const categoryResult = this.detectCategory(content, normalizedContent);
    
    // Extract entities
    const entities = this.extractEntities(content);
    
    // Generate tags
    const tags = this.generateTags(content, normalizedContent, categoryResult.category);
    
    // Determine priority with enhanced detection
    const priority = this.determinePriority(content, normalizedContent);
    
    // Generate insights
    const insights = this.generateInsights(content, categoryResult.category, entities, priority);
    
    // Suggest actions
    const suggestedActions = this.suggestActions(categoryResult.category, entities, content);
    
    return {
      category: categoryResult.category,
      confidence: categoryResult.confidence,
      tags,
      extractedEntities: entities,
      insights,
      priority,
      suggestedActions
    };
  }
  
  private detectCategory(content: string, normalizedContent: string): { category: string; confidence: number } {
    const scores: { [key: string]: number } = {};
    
    for (const pattern of CATEGORY_PATTERNS) {
      let score = 0;
      
      // Check keywords
      for (const keyword of pattern.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          score += matches.length * pattern.weight;
        }
      }
      
      // Check regex patterns
      for (const regex of pattern.patterns) {
        const matches = content.match(regex);
        if (matches) {
          score += matches.length * pattern.weight * 1.5;
        }
      }
      
      scores[pattern.name] = score;
    }
    
    const maxScore = Math.max(...Object.values(scores));
    const bestCategory = Object.keys(scores).find(key => scores[key] === maxScore) || 'General';
    const confidence = Math.min(maxScore / 3, 1);
    
    return {
      category: confidence < 0.3 ? 'General' : bestCategory,
      confidence: confidence < 0.3 ? 0.5 : confidence
    };
  }
  
  private extractEntities(content: string) {
    const entities = {
      dates: [] as string[],
      emails: [] as string[],
      phones: [] as string[],
      people: [] as string[],
      tasks: [] as string[],
      locations: [] as string[]
    };
    
    // Extract all entity types
    for (const [type, patterns] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          if (type === 'tasks') {
            // Special handling for tasks to extract clean task text
            entities.tasks.push(...matches.map(match => 
              match.replace(/^(todo|task|action|need to|have to|must|should|remind|deadline|due):\s*/i, '').trim()
            ));
          } else {
            entities[type as keyof typeof entities].push(...matches);
          }
        }
      }
    }
    
    // Remove duplicates
    Object.keys(entities).forEach(key => {
      entities[key as keyof typeof entities] = [...new Set(entities[key as keyof typeof entities])];
    });
    
    return entities;
  }
  
  private generateTags(content: string, normalizedContent: string, category: string): string[] {
    const tags = new Set<string>();
    
    // Add category as a tag
    tags.add(category.toLowerCase());
    
    // Extract meaningful words
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that', 'these', 'those']);
    
    const words = normalizedContent.match(/\b\w{3,}\b/g) || [];
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (!commonWords.has(word)) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Add most frequent meaningful words as tags
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    sortedWords.forEach(word => tags.add(word));
    
    // Add specific tags based on content patterns
    if (/\b(urgent|asap|critical)\b/i.test(content)) tags.add('urgent');
    if (/\b(weekly|daily|monthly)\b/i.test(content)) tags.add('recurring');
    if (/\b(follow.?up|check.?in)\b/i.test(content)) tags.add('follow-up');
    if (/\b(research|investigate|look.?into)\b/i.test(content)) tags.add('research');
    
    return Array.from(tags).slice(0, 8);
  }
  
  private determinePriority(content: string, normalizedContent: string): 'high' | 'medium' | 'low' {
    let highScore = 0;
    let mediumScore = 0;
    let lowScore = 0;
    
    // Score based on keyword frequency and weight
    for (const keyword of PRIORITY_KEYWORDS.high) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        highScore += matches.length * 2; // High priority gets higher weight
      }
    }
    
    for (const keyword of PRIORITY_KEYWORDS.medium) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        mediumScore += matches.length;
      }
    }
    
    for (const keyword of PRIORITY_KEYWORDS.low) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        lowScore += matches.length;
      }
    }
    
    // Additional context-based scoring
    // Time-based indicators
    if (/\b(today|now|immediately|asap|right away)\b/i.test(content)) highScore += 3;
    if (/\b(tomorrow|this week|soon)\b/i.test(content)) mediumScore += 2;
    if (/\b(next week|next month|someday|later)\b/i.test(content)) lowScore += 2;
    
    // Punctuation patterns (multiple exclamation marks indicate urgency)
    if (/!{2,}/.test(content)) highScore += 2;
    if (/\?{2,}/.test(content)) mediumScore += 1;
    
    // ALL CAPS words (urgency indicator)
    const capsWords = content.match(/\b[A-Z]{3,}\b/g);
    if (capsWords && capsWords.length > 0) {
      highScore += capsWords.length;
    }
    
    // Determine priority based on scores
    if (highScore > mediumScore && highScore > lowScore && highScore >= 2) {
      return 'high';
    } else if (lowScore > highScore && lowScore > mediumScore && lowScore >= 2) {
      return 'low';
    } else {
      return 'medium';
    }
  }
  
  private generateInsights(content: string, category: string, entities: any, priority: 'high' | 'medium' | 'low'): string[] {
    const insights: string[] = [];
    
    // Priority-based insights
    if (priority === 'high') {
      insights.push('High priority task detected - consider addressing soon');
    } else if (priority === 'low') {
      insights.push('Low priority task - can be scheduled for later');
    }
    
    // Category-specific insights
    switch (category) {
      case 'Meeting':
        if (entities.people.length > 0) {
          insights.push(`Meeting involves ${entities.people.length} people: ${entities.people.slice(0, 3).join(', ')}`);
        }
        if (entities.dates.length > 0) {
          insights.push(`Scheduled for: ${entities.dates[0]}`);
        }
        if (entities.tasks.length > 0) {
          insights.push(`${entities.tasks.length} action items identified`);
        }
        break;
        
      case 'Task':
        if (entities.dates.length > 0) {
          insights.push(`Due date mentioned: ${entities.dates[0]}`);
        }
        if (entities.people.length > 0) {
          insights.push(`Involves: ${entities.people.join(', ')}`);
        }
        break;
        
      case 'Contact':
        if (entities.emails.length > 0) {
          insights.push(`Email found: ${entities.emails[0]}`);
        }
        if (entities.phones.length > 0) {
          insights.push(`Phone number found: ${entities.phones[0]}`);
        }
        break;
        
      case 'Project':
        if (entities.dates.length > 0) {
          insights.push(`Timeline mentioned: ${entities.dates.join(', ')}`);
        }
        break;
    }
    
    // General insights
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 200) {
      insights.push('Detailed note - consider summarizing key points');
    }
    
    if (entities.dates.length > 2) {
      insights.push('Multiple dates mentioned - check for scheduling conflicts');
    }
    
    return insights;
  }
  
  private suggestActions(category: string, entities: any, content: string): string[] {
    const actions: string[] = [];
    
    switch (category) {
      case 'Meeting':
        if (entities.dates.length > 0) {
          actions.push('Add to calendar');
        }
        if (entities.people.length > 0) {
          actions.push('Send meeting invite');
        }
        if (entities.tasks.length > 0) {
          actions.push('Create follow-up tasks');
        }
        break;
        
      case 'Task':
        actions.push('Set reminder');
        if (entities.dates.length > 0) {
          actions.push('Add deadline to calendar');
        }
        if (entities.people.length > 0) {
          actions.push('Assign task');
        }
        break;
        
      case 'Contact':
        if (entities.emails.length > 0) {
          actions.push('Save to contacts');
        }
        if (entities.phones.length > 0) {
          actions.push('Add to phone book');
        }
        actions.push('Schedule follow-up');
        break;
        
      case 'Idea':
        actions.push('Research feasibility');
        actions.push('Create project plan');
        actions.push('Discuss with team');
        break;
        
      case 'Project':
        actions.push('Create project timeline');
        actions.push('Assign responsibilities');
        actions.push('Set milestones');
        break;
    }
    
    // Universal actions based on content patterns
    if (/\b(follow.?up|check.?in)\b/i.test(content)) {
      actions.push('Schedule follow-up');
    }
    
    if (/\b(research|investigate|look.?into)\b/i.test(content)) {
      actions.push('Start research');
    }
    
    return actions.slice(0, 4);
  }
}

// Export singleton instance
export const aiAnalyzer = new LocalAIAnalyzer();