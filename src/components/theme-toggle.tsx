// 4. UPDATE: src/components/theme-toggle.tsx
import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "next-themes"
import { useColorTheme } from "../hooks/useColorTheme"
import { colorThemes } from "../lib/theme"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const { colorTheme, changeColorTheme } = useColorTheme()

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Dark/Light Mode */}
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          Light Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          Dark Mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Palette className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Color Themes */}
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            Color Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-56">
            {Object.entries(categoryGroups).map(([category, themes]) => (
              <div key={category}>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-sm">
                    <span className="mr-2">{getCategoryIcon(category)}</span>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {themes.map((theme) => (
                      <DropdownMenuItem 
                        key={theme.name}
                        onClick={() => changeColorTheme(theme.name)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded-full mr-2 border border-border"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                          <span className="text-sm">{theme.displayName}</span>
                        </div>
                        {colorTheme === theme.name && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                {category !== 'bold' && <DropdownMenuSeparator />}
              </div>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}