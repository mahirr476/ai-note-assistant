// src/components/modals/DeleteConfirmModal.tsx
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Button } from '../ui/button';

interface DeleteConfirmModalProps {
  show: boolean;
  step: 1 | 2;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  step,
  onConfirm,
  onCancel
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 shadow-xl">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">
            {step === 1 ? 'Delete Note?' : 'Are you sure?'}
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            {step === 1 
              ? 'This action cannot be undone. The note will be permanently deleted.'
              : 'This is your final confirmation. The note will be permanently deleted and cannot be recovered.'
            }
          </p>
          
          <div className="flex justify-end space-x-2">
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {step === 1 ? 'Delete' : 'Confirm Delete'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};