// src/components/toast.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";

interface ToastProps {
  message: string;
  type: 'saving' | 'saved' | 'error';
  show: boolean;
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, show, onHide }) => {
  useEffect(() => {
    if (show && type === 'saved') {
      const timer = setTimeout(() => {
        onHide();
      }, 2000); // Auto-hide "saved" toast after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [show, type, onHide]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'saved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'saving':
        return 'border-blue-200 dark:border-blue-800';
      case 'saved':
        return 'border-green-200 dark:border-green-800';
      case 'error':
        return 'border-red-200 dark:border-red-800';
      default:
        return 'border-border';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'saving':
        return 'bg-blue-50 dark:bg-blue-950/50';
      case 'saved':
        return 'bg-green-50 dark:bg-green-950/50';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/50';
      default:
        return 'bg-background';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
      <Card className={`shadow-lg border-2 ${getBorderColor()} ${getBackgroundColor()}`}>
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <span className="text-sm font-medium text-foreground">
              {message}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};