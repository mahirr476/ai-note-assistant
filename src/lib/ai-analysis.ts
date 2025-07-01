// src/lib/ai-analysis.ts (Enhanced Version with Better Accuracy)

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

// Enhanced category patterns with better precision
const CATEGORY_PATTERNS: CategoryPattern[] = [
  {
    name: 'Meeting',
    keywords: ['meeting', 'agenda', 'attendees', 'minutes', 'discussion', 'conference', 'call', 'zoom', 'teams', 'standup', 'sync'],
    patterns: [
      /\b(meeting|call|conference|standup|sync)\s+(with|about|regarding|for)/i,
      /\b(agenda|attendees|minutes)\b/i,
      /\b\d{1,2}:\d{2}\s*(am|pm)?\b/i,
      /\b(zoom|teams|skype|google meet)\b/i
    ],
    weight: 1.2
  },
  {
    name: 'Task',
    keywords: ['todo', 'task', 'deadline', 'due', 'remind', 'action', 'complete', 'finish', 'implement', 'work on'],
    patterns: [
      /\b(todo|task|deadline|due|remind|action)\b/i,
      /\b(need to|have to|must|should)\s+\w+/i,
      /\b(complete|finish|implement|work on)\b/i,
      /^[-•*]\s+/m, // Bullet points
      /\[\s*\]\s+/m // Checkboxes
    ],
    weight: 1.3
  },
  {
    name: 'Idea',
    keywords: ['idea', 'brainstorm', 'concept', 'innovation', 'proposal', 'suggestion', 'thought', 'inspiration'],
    patterns: [
      /\b(idea|concept|thought|brainstorm)\b/i,
      /\b(what if|imagine|could we|maybe we should)\b/i,
      /\b(innovation|creative|proposal|inspiration)\b/i
    ],
    weight: 0.8
  },
  {
    name: 'Contact',
    keywords: ['contact', 'phone', 'email', 'address', 'reach', 'call', 'message', 'connect'],
    patterns: [
      /\b[\w.-]+@[\w.-]+\.\w+\b/i,
      /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/i,
      /\b(contact|reach|call|email|message|connect)\s+(info|information|details)\b/i
    ],
    weight: 1.2
  },
  {
    name: 'Project',
    keywords: ['project', 'milestone', 'sprint', 'feature', 'development', 'release', 'version', 'roadmap'],
    patterns: [
      /\b(project|milestone|sprint|feature)\b/i,
      /\b(development|release|version)\s+\w+/i,
      /\b(timeline|roadmap|planning|scope)\b/i
    ],
    weight: 1.0
  },
  {
    name: 'Finance',
    keywords: ['budget', 'cost', 'price', 'money', 'payment', 'invoice', 'expense', 'revenue'],
    patterns: [
      /\$\d+/i,
      /\b(budget|cost|price|payment|invoice)\b/i,
      /\b(expense|revenue|profit|loss|financial)\b/i
    ],
    weight: 1.0
  }
];

// Enhanced entity extraction patterns with better accuracy
const ENTITY_PATTERNS = {
  dates: [
    // Standard date formats
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
    /\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
    
    // Day names (avoid false positives)
    /\b(next|this|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi,
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(morning|afternoon|evening)\b/gi,
    
    // Month names with days
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(?:st|nd|rd|th)?\b/gi,
    
    // Relative dates
    /\b(today|tomorrow|yesterday|next week|last week|this week|next month|end of week)\b/gi,
    
    // Specific time references
    /\bdue\s+(today|tomorrow|next week|this week|monday|tuesday|wednesday|thursday|friday)\b/gi
  ],
  
  emails: [
    /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g
  ],
  
  phones: [
    /\b\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    /\b\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g
  ],
  
  // Enhanced people detection (avoid common false positives)
  people: [
    // Proper names with common titles
    /\b(mr|mrs|ms|dr|prof|professor)\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/gi,
    
    // Names in contact contexts
    /\b(contact|call|email|meet with|meeting with)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/gi,
    
    // Names with possessive
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)'s\b/g,
    
    // Common name patterns (but exclude common words)
    /\b(?!(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December|Budget|Project|Task|Meeting|Call|Email|Team|Office|Company|Department|Manager|Director|President|CEO|CTO|Weekly|Daily|Monthly|Annual|Quarterly|Review|Report|Update|Status|Planning|Development|Marketing|Sales|Finance|HR|IT|Support|Client|Customer|User|System|Process|Policy|Strategy|Goal|Objective|Timeline|Deadline|Priority|Important|Critical|Urgent|Complete|Finish|Start|Begin|End|Stop|Continue|Pause|Resume|Cancel|Reschedule|Postpone|Delay|Rush|Quick|Slow|Fast|Easy|Hard|Simple|Complex|Basic|Advanced|New|Old|Current|Previous|Next|Last|First|Final|Initial|Primary|Secondary|Main|Major|Minor|High|Low|Medium|Large|Small|Big|Little|Great|Good|Bad|Best|Worst|Better|Worse|More|Less|Most|Least|All|Some|None|Any|Every|Each|Other|Another|Same|Different|Similar|Opposite|Related|Unrelated|Inside|Outside|Above|Below|Before|After|During|Within|Without|Including|Excluding|Except|Besides|Instead|Rather|Either|Neither|Both|Together|Separate|Apart|Close|Far|Near|Away|Here|There|Where|When|Why|What|Who|How|Which|Whose|Whom)$)[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g
  ],
  
  // Enhanced task detection
  tasks: [
    // Explicit task markers
    /(?:todo|task|action item):\s*(.+)/gi,
    
    // Need/must/should patterns
    /\b(need to|have to|must|should)\s+([^.!?\n]+)/gi,
    
    // Deadline/reminder patterns
    /\b(remind|deadline|due)\s+[^:]*:\s*(.+)/gi,
    
    // Bullet point tasks
    /^[-•*]\s*(.+)/gm,
    
    // Checkbox tasks
    /\[\s*\]\s*(.+)/gm,
    
    // Action verbs at start of sentence
    /^(call|email|send|create|write|update|review|check|schedule|book|order|buy|purchase|complete|finish|start|begin)\s+([^.!?\n]+)/gmi
  ],
  
  locations: [
    // Street addresses
    /\b\d+\s+[A-Z][a-z]+\s+(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|court|ct|place|pl)\b/gi,
    
    // City, State
    /\b[A-Z][a-z]+,\s*[A-Z]{2}\b/g,
    
    // Office/building references
    /\b(office|building|room|floor|conference room)\s+([A-Za-z0-9]+)\b/gi,
    
    // Virtual locations
    /\b(zoom|teams|skype|google meet|webex)\b/gi
  ]
};

// Words that should NOT be considered as people names
const EXCLUDED_PEOPLE_WORDS = new Set([
  // Days and months
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 
  'september', 'october', 'november', 'december',
  
  // Business terms
  'budget', 'project', 'task', 'meeting', 'call', 'email', 'team', 'office', 
  'company', 'department', 'manager', 'director', 'president', 'ceo', 'cto',
  'weekly', 'daily', 'monthly', 'annual', 'quarterly', 'review', 'report',
  'update', 'status', 'planning', 'development', 'marketing', 'sales', 'finance',
  
  // Common adjectives/adverbs
  'important', 'critical', 'urgent', 'complete', 'quick', 'easy', 'simple',
  'new', 'old', 'current', 'next', 'last', 'first', 'main', 'primary',
  
  // Action words
  'create', 'write', 'send', 'call', 'check', 'review', 'update', 'finish'
]);

export class LocalAIAnalyzer {
  
  analyzeNote(content: string): AnalysisResult {
    const normalizedContent = content.toLowerCase();
    
    // Analyze category
    const categoryResult = this.detectCategory(content, normalizedContent);
    
    // Extract entities with enhanced accuracy
    const entities = this.extractEntities(content);
    
    // Generate contextual tags
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
      
      // Check keywords with context awareness
      for (const keyword of pattern.keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          // Weight keywords higher if they appear in first line or with action words
          const firstLineBonus = content.split('\n')[0].toLowerCase().includes(keyword) ? 1.5 : 1;
          score += matches.length * pattern.weight * firstLineBonus;
        }
      }
      
      // Check regex patterns
      for (const regex of pattern.patterns) {
        const matches = content.match(regex);
        if (matches) {
          score += matches.length * pattern.weight * 2; // Patterns are more definitive
        }
      }
      
      scores[pattern.name] = score;
    }
    
    const maxScore = Math.max(...Object.values(scores));
    const bestCategory = Object.keys(scores).find(key => scores[key] === maxScore) || 'General';
    const confidence = Math.min(maxScore / 4, 1); // Adjusted threshold
    
    return {
      category: confidence < 0.4 ? 'General' : bestCategory,
      confidence: confidence < 0.4 ? 0.5 : confidence
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
    
    // Extract dates with better context awareness
    for (const pattern of ENTITY_PATTERNS.dates) {
      const matches = content.match(pattern);
      if (matches) {
        entities.dates.push(...matches.map(match => match.trim()));
      }
    }
    
    // Extract emails
    for (const pattern of ENTITY_PATTERNS.emails) {
      const matches = content.match(pattern);
      if (matches) {
        entities.emails.push(...matches);
      }
    }
    
    // Extract phones
    for (const pattern of ENTITY_PATTERNS.phones) {
      const matches = content.match(pattern);
      if (matches) {
        entities.phones.push(...matches);
      }
    }
    
    // Extract people with enhanced filtering
    for (const pattern of ENTITY_PATTERNS.people) {
      const matches = content.match(pattern);
      if (matches) {
        const cleanedNames = matches
          .map(match => {
            // Extract the name part from matches that might include context
            if (match.includes('contact') || match.includes('call') || match.includes('email') || match.includes('meet')) {
              const parts = match.split(/\s+/);
              return parts.slice(-2).join(' '); // Take last 2 words as likely name
            }
            return match.replace(/['']s$/, ''); // Remove possessive
          })
          .filter(name => {
            const cleanName = name.trim().toLowerCase();
            // Filter out excluded words and very short names
            return cleanName.length > 2 && 
                   !EXCLUDED_PEOPLE_WORDS.has(cleanName) &&
                   !/^\d+$/.test(cleanName) && // Not just numbers
                   !/^[a-z]+$/.test(cleanName); // Not all lowercase (proper names should have capitals)
          });
        
        entities.people.push(...cleanedNames);
      }
    }
    
    // Extract tasks with better cleaning
    for (const pattern of ENTITY_PATTERNS.tasks) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      while ((match = regex.exec(content)) !== null) {
        const taskText = (match[2] || match[1] || match[0]).trim();
        if (taskText && taskText.length > 3 && taskText.length < 200) {
          // Clean up task text
          const cleanTask = taskText
            .replace(/^(todo|task|action item|need to|have to|must|should|remind|deadline|due):\s*/i, '')
            .replace(/^[-•*\[\]\s]+/, '') // Remove bullet points and checkboxes
            .trim();
          
          if (cleanTask.length > 3) {
            entities.tasks.push(cleanTask);
          }
        }
      }
    }
    
    // Extract locations
    for (const pattern of ENTITY_PATTERNS.locations) {
      const matches = content.match(pattern);
      if (matches) {
        entities.locations.push(...matches);
      }
    }
    
    // Remove duplicates and sort by relevance
    Object.keys(entities).forEach(key => {
      entities[key as keyof typeof entities] = [...new Set(entities[key as keyof typeof entities])]
        .sort((a, b) => b.length - a.length) // Longer matches first (often more specific)
        .slice(0, 10); // Limit to most relevant
    });
    
    return entities;
  }
  
  private generateTags(content: string, normalizedContent: string, category: string): string[] {
    const tags = new Set<string>();
    
    // Add category as a tag
    tags.add(category.toLowerCase());
    
    // Extract meaningful words with better filtering
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'this', 'that',
      'these', 'those', 'they', 'them', 'their', 'there', 'then', 'than', 'when',
      'where', 'why', 'how', 'what', 'who', 'which', 'can', 'may', 'might', 'must'
    ]);
    
    const words = normalizedContent.match(/\b\w{3,}\b/g) || [];
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      if (!commonWords.has(word) && word.length >= 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Add most frequent meaningful words as tags
    const sortedWords = Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);
    
    sortedWords.forEach(word => tags.add(word));
    
    // Add contextual tags based on patterns
    if (/\b(urgent|asap|critical|immediately)\b/i.test(content)) tags.add('urgent');
    if (/\b(weekly|daily|monthly|recurring)\b/i.test(content)) tags.add('recurring');
    if (/\b(follow.?up|check.?in|touch.?base)\b/i.test(content)) tags.add('follow-up');
    if (/\b(research|investigate|look.?into|study)\b/i.test(content)) tags.add('research');
    if (/\b(meeting|call|conference|standup)\b/i.test(content)) tags.add('meeting');
    if (/\b(deadline|due|finish|complete)\b/i.test(content)) tags.add('deadline');
    if (/\b(budget|cost|expense|financial|money)\b/i.test(content)) tags.add('financial');
    if (/\b(client|customer|external|vendor)\b/i.test(content)) tags.add('external');
    
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
        highScore += matches.length * 3; // Increased weight for high priority
      }
    }
    
    for (const keyword of PRIORITY_KEYWORDS.medium) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        mediumScore += matches.length * 1.5;
      }
    }
    
    for (const keyword of PRIORITY_KEYWORDS.low) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        lowScore += matches.length;
      }
    }
    
    // Enhanced context-based scoring
    // Time-based indicators (stronger weights)
    if (/\b(today|now|immediately|asap|right now|this morning)\b/i.test(content)) highScore += 5;
    if (/\b(tomorrow|by end of day|this week|due soon)\b/i.test(content)) highScore += 3;
    if (/\b(next week|soon|upcoming)\b/i.test(content)) mediumScore += 2;
    if (/\b(next month|someday|later|eventually|when possible)\b/i.test(content)) lowScore += 3;
    
    // Punctuation patterns
    if (/!{2,}/.test(content)) highScore += 3;
    if (/\?{2,}/.test(content)) mediumScore += 1;
    
    // ALL CAPS words (urgency indicator)
    const capsWords = content.match(/\b[A-Z]{4,}\b/g); // Increased minimum length
    if (capsWords && capsWords.length > 0) {
      highScore += capsWords.length * 2;
    }
    
    // Deadline proximity detection
    if (/\bdue\s+(today|tomorrow|this week)\b/i.test(content)) highScore += 4;
    if (/\bdeadline\s+(today|tomorrow|this week)\b/i.test(content)) highScore += 4;
    
    // Business priority indicators
    if (/\b(client|customer|boss|ceo|president|urgent request)\b/i.test(content)) highScore += 2;
    if (/\b(meeting|presentation|demo|launch)\b/i.test(content)) mediumScore += 1;
    
    // Determine priority based on scores with better thresholds
    const totalScore = highScore + mediumScore + lowScore;
    const highRatio = totalScore > 0 ? highScore / totalScore : 0;
    const lowRatio = totalScore > 0 ? lowScore / totalScore : 0;
    
    if (highScore >= 3 && highRatio > 0.4) {
      return 'high';
    } else if (lowScore >= 2 && lowRatio > 0.5) {
      return 'low';
    } else {
      return 'medium';
    }
  }
  
  private generateInsights(content: string, category: string, entities: any, priority: 'high' | 'medium' | 'low'): string[] {
    const insights: string[] = [];
    
    // Priority-based insights with more context
    if (priority === 'high') {
      insights.push('⚡ High priority detected - recommend immediate attention');
    } else if (priority === 'low') {
      insights.push('📅 Low priority - can be scheduled for later');
    }
    
    // Category-specific insights with enhanced detail
    switch (category) {
      case 'Meeting':
        if (entities.people.length > 0) {
          insights.push(`👥 ${entities.people.length} participant${entities.people.length > 1 ? 's' : ''}: ${entities.people.slice(0, 3).join(', ')}${entities.people.length > 3 ? '...' : ''}`);
        }
        if (entities.dates.length > 0) {
          insights.push(`📅 Scheduled: ${entities.dates[0]}`);
        }
        if (entities.tasks.length > 0) {
          insights.push(`✅ ${entities.tasks.length} action item${entities.tasks.length > 1 ? 's' : ''} identified`);
        }
        if (entities.locations.length > 0) {
          insights.push(`📍 Location: ${entities.locations[0]}`);
        }
        break;
        
      case 'Task':
        if (entities.dates.length > 0) {
          insights.push(`⏰ Due: ${entities.dates[0]}`);
        }
        if (entities.people.length > 0) {
          insights.push(`👤 Involves: ${entities.people.slice(0, 2).join(', ')}`);
        }
        if (entities.tasks.length > 1) {
          insights.push(`📝 ${entities.tasks.length} subtasks identified`);
        }
        break;
        
      case 'Contact':
        if (entities.emails.length > 0) {
          insights.push(`📧 Email: ${entities.emails[0]}`);
        }
        if (entities.phones.length > 0) {
          insights.push(`📞 Phone: ${entities.phones[0]}`);
        }
        if (entities.people.length > 0) {
          insights.push(`👤 Contact: ${entities.people[0]}`);
        }
        break;
        
      case 'Project':
        if (entities.dates.length > 0) {
          insights.push(`📊 Timeline: ${entities.dates.slice(0, 2).join(' - ')}`);
        }
        if (entities.people.length > 0) {
          insights.push(`👥 Team: ${entities.people.slice(0, 3).join(', ')}`);
        }
        break;
        
      case 'Finance':
        const budgetMatch = content.match(/\$[\d,]+/);
        if (budgetMatch) {
          insights.push(`💰 Amount: ${budgetMatch[0]}`);
        }
        break;
    }
    
    // General insights with better intelligence
    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount > 200) {
      insights.push('📄 Detailed note - consider creating summary');
    } else if (wordCount < 20) {
      insights.push('💡 Brief note - might need more details');
    }
    
    if (entities.dates.length > 3) {
      insights.push('📅 Multiple dates - check for scheduling conflicts');
    }
    
    if (entities.emails.length > 1) {
      insights.push('📬 Multiple contacts - consider group communication');
    }
    
    // Sentiment and urgency indicators
    if (/\b(help|stuck|problem|issue|broken|failed|error)\b/i.test(content)) {
      insights.push('🚨 Problem identified - may need assistance');
    }
    
    if (/\b(great|excellent|awesome|perfect|love|happy)\b/i.test(content)) {
      insights.push('😊 Positive sentiment detected');
    }
    
    return insights.slice(0, 5); // Limit to most relevant insights
  }
  
  private suggestActions(category: string, entities: any, content: string): string[] {
    const actions: string[] = [];
    
    switch (category) {
      case 'Meeting':
        if (entities.dates.length > 0) {
          actions.push('📅 Add to calendar');
        }
        if (entities.people.length > 0) {
          actions.push('📧 Send meeting invite');
        }
        if (entities.tasks.length > 0) {
          actions.push('✅ Create follow-up tasks');
        }
        actions.push('📝 Prepare agenda');
        break;
        
      case 'Task':
        actions.push('⏰ Set reminder');
        if (entities.dates.length > 0) {
          actions.push('📅 Add deadline to calendar');
        }
        if (entities.people.length > 0) {
          actions.push('👤 Assign task');
        }
        actions.push('📋 Create task list');
        break;
        
      case 'Contact':
        if (entities.emails.length > 0) {
          actions.push('👤 Save to contacts');
        }
        if (entities.phones.length > 0) {
          actions.push('📞 Add to phone book');
        }
        actions.push('📅 Schedule follow-up');
        actions.push('📧 Send introduction email');
        break;
        
      case 'Idea':
        actions.push('🔍 Research feasibility');
        actions.push('📊 Create project plan');
        actions.push('💬 Discuss with team');
        actions.push('📝 Document requirements');
        break;
        
      case 'Project':
        actions.push('📊 Create project timeline');
        actions.push('👥 Assign responsibilities');
        actions.push('🎯 Set milestones');
        actions.push('📈 Track progress');
        break;
        
      case 'Finance':
        actions.push('💰 Update budget');
        actions.push('📊 Create expense report');
        actions.push('📅 Set payment reminder');
        break;
    }
    
    // Universal actions based on content patterns
    if (/\b(follow.?up|check.?in|touch.?base)\b/i.test(content)) {
      actions.push('📅 Schedule follow-up');
    }
    
    if (/\b(research|investigate|look.?into|study)\b/i.test(content)) {
      actions.push('🔍 Start research');
    }
    
    if (/\b(call|phone)\b/i.test(content)) {
      actions.push('📞 Make phone call');
    }
    
    if (/\b(email|send|message)\b/i.test(content)) {
      actions.push('📧 Send email');
    }
    
    return actions.slice(0, 4);
  }
}

// Export singleton instance
export const aiAnalyzer = new LocalAIAnalyzer();