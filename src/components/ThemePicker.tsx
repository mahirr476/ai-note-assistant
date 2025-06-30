// 5. CREATE: src/components/ThemePicker.tsx (Alternative full modal version)
import React, { useState } from 'react';
import { Palette, Check, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useColorTheme } from '../hooks/useColorTheme';
import { colorThemes } from '../lib/theme';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';

export const ThemePicker: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { colorTheme, changeColorTheme } = useColorTheme();
  const [isOpen, setIsOpen] = useState(false);

  const categoryGroups = {
    minimal: Object.values(colorThemes).filter(t => t.category === 'minimal'),
    warm: Object.values(colorThemes).filter(t => t.category === 'warm'),
    natural: Object.values(colorThemes).filter(t => t.category === 'natural'),
    bold: Object.values(colorThemes).filter(t => t.category === 'bold'),
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'minimal': return '🎯';
      case 'warm': return '🌅';
      case 'natural': return '🌱';
      case 'bold': return '⚡';
      default: return '🎨';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Open theme picker</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Choose Your Theme
          </DialogTitle>
        </DialogHeader>
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="font-medium">Dark Mode</span>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setTheme('light')} 
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
            >
              <Sun className="h-4 w-4 mr-1" />
              Light
            </Button>
            <Button 
              onClick={() => setTheme('dark')} 
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
            >
              <Moon className="h-4 w-4 mr-1" />
              Dark
            </Button>
          </div>
        </div>

        {/* Color Theme Categories */}
        <div className="space-y-6">
          {Object.entries(categoryGroups).map(([category, categoryThemes]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                <span>{getCategoryIcon(category)}</span>
                {category} Themes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryThemes.map((themeConfig) => (
                  <Card 
                    key={themeConfig.name}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      colorTheme === themeConfig.name 
                        ? 'ring-2 ring-primary shadow-lg' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => changeColorTheme(themeConfig.name)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          {themeConfig.displayName}
                          {colorTheme === themeConfig.name && (
                            <Check className="h-4 w-4 text-primary" />
                          )}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {themeConfig.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {themeConfig.description}
                      </p>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Color Preview */}
                      <div className="flex items-center gap-2 mb-3">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: themeConfig.colors.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: themeConfig.colors.secondary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: themeConfig.colors.accent }}
                        />
                        <div className="text-xs text-muted-foreground ml-2">
                          Primary • Secondary • Accent
                        </div>
                      </div>
                      
                      {/* Mini UI Preview */}
                      <div className="p-3 rounded-lg border text-xs space-y-2">
                        <div 
                          className="px-2 py-1 rounded text-white text-center font-medium"
                          style={{ backgroundColor: themeConfig.colors.primary }}
                        >
                          Button
                        </div>
                        <div 
                          className="p-2 rounded"
                          style={{ backgroundColor: themeConfig.colors.secondary }}
                        >
                          Card content
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};