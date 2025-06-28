// src/components/modules/notes/NotesStatsCard.tsx
import React from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { Separator } from '../../../ui/separator';

interface NotesStatsCardProps {
  totalNotes: number;
  totalWords: number;
  saveStatus: 'saved' | 'saving' | 'unsaved';
}

export const NotesStatsCard: React.FC<NotesStatsCardProps> = ({
  totalNotes,
  totalWords,
  saveStatus
}) => {
  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving': return <Loader2 className="h-3 w-3 animate-spin" />;
      case 'unsaved': return <div className="h-2 w-2 bg-destructive rounded-full" />;
      case 'saved': return <div className="h-2 w-2 bg-green-500 rounded-full" />;
      default: return null;
    }
  };

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'unsaved': return 'Unsaved changes';
      case 'saved': return 'All changes saved';
      default: return '';
    }
  };

  return (
    <div className="p-4 flex-shrink-0">
      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-center">
              <div className="font-semibold text-foreground text-base">{totalNotes}</div>
              <div className="text-muted-foreground text-xs">Total Notes</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-foreground text-base">{totalWords}</div>
              <div className="text-muted-foreground text-xs">Total Words</div>
            </div>
          </div>
          
          <Separator className="my-2" />
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
            {getSaveStatusIcon()}
            <span>{getSaveStatusText()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};