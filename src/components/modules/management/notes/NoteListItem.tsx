// src/components/modules/notes/NoteListItem.tsx
import React from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { Note } from '../../../../types/modules';
import { formatDate, getCategoryColor } from '../../../../utils/noteUtils';

interface NoteListItemProps {
  note: Note;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export const NoteListItem: React.FC<NoteListItemProps> = ({
  note,
  isSelected,
  onClick,
  onDelete
}) => {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
        isSelected
          ? 'border-ring ring-primary bg-accent/50'
          : 'hover:bg-accent/50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-sm text-foreground line-clamp-1 flex-1">
              {note.title}
            </h3>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              size="icon"
              variant="ghost"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2">
            {note.content.substring(0, 100)}...
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge className={getCategoryColor(note.category)} variant="secondary">
                {note.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {note.wordCount} words
              </span>
            </div>
            
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(note.updatedAt)}</span>
            </div>
          </div>
          
          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {note.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {note.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{note.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};