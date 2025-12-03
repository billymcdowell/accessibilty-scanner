import { useState } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import { useTheme } from '@/context/ThemeContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigEditor } from '@/components/config';
import {
  LayoutDashboard,
  FileWarning,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Sun,
  Moon,
  Monitor,
  Calendar,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const isDev = import.meta.env.DEV;

export function Sidebar() {
  const [configOpen, setConfigOpen] = useState(false);
  const { 
    availableDays, 
    selectedDay, 
    setSelectedDay, 
    daysLoading,
    pages, 
    dataLoading, 
    dataError, 
    refreshData,
    selectedPage, 
    setSelectedPage 
  } = useDashboard();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="w-72 border-r border-border bg-sidebar flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center">
            <FileWarning className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sidebar-foreground">A11y Scanner</h1>
            <p className="text-xs text-sidebar-foreground/60">Dashboard</p>
          </div>
        </div>
      </div>

      {/* Day Selector */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            Scan Date
          </span>
        </div>
        <Select 
          value={selectedDay || ''} 
          onValueChange={setSelectedDay}
          disabled={daysLoading}
        >
          <SelectTrigger className="w-full bg-sidebar-accent/50">
            <SelectValue placeholder={daysLoading ? "Loading..." : "Select a day"}>
              {(() => {
                const selected = availableDays.find(d => d.name === selectedDay);
                if (!selected) return null;
                return (
                  <div className="flex flex-col items-start text-left">
                    {selected.projects && selected.projects.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selected.projects.join(', ')}
                      </span>
                    )}
                    <span className="font-medium">{selected.displayName}</span>
                  </div>
                );
              })()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableDays.map((day) => (
              <SelectItem key={day.name} value={day.name}>
                <div className="flex flex-col">
                  {day.projects && day.projects.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {day.projects.join(', ')}
                    </span>
                  )}
                  <span className="font-medium">{day.displayName}</span>
                </div>
              </SelectItem>
            ))}
            {availableDays.length === 0 && !daysLoading && (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No scan results found
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          <Button
            variant={selectedPage === null ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-3',
              selectedPage === null && 'bg-sidebar-accent'
            )}
            onClick={() => setSelectedPage(null)}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </Button>
        </div>

        <Separator className="my-4" />

        <div className="mb-2 px-2">
          <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider">
            Scanned Pages
          </span>
        </div>

        {dataLoading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {dataError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {dataError}
          </div>
        )}

        {!selectedDay && !daysLoading && (
          <div className="p-3 text-sm text-muted-foreground text-center">
            Select a scan date to view results
          </div>
        )}

        <div className="space-y-1">
          {pages.map((page) => {
            const isSelected = selectedPage?.label === page.label;
            const hasViolations = page.counts.violation > 0;
            const hasPotential = page.counts.potentialviolation > 0;
            
            return (
              <Button
                key={page.label}
                variant={isSelected ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2 h-auto py-2.5 px-3 group',
                  isSelected && 'bg-sidebar-accent'
                )}
                onClick={() => setSelectedPage(page)}
              >
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    {hasViolations ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : hasPotential ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      </div>
                    )}
                    <span className="truncate text-sm">
                      {formatPageLabel(page.label)}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    {page.counts.violation > 0 && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        {page.counts.violation} violations
                      </Badge>
                    )}
                    {page.counts.potentialviolation > 0 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-orange-500/50 text-orange-500">
                        {page.counts.potentialviolation} potential
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className={cn(
                  'w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
                  isSelected && 'opacity-100'
                )} />
              </Button>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-md',
                theme === 'light' && 'bg-background shadow-sm'
              )}
              onClick={() => setTheme('light')}
              title="Light mode"
            >
              <Sun className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-md',
                theme === 'dark' && 'bg-background shadow-sm'
              )}
              onClick={() => setTheme('dark')}
              title="Dark mode"
            >
              <Moon className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-7 w-7 rounded-md',
                theme === 'system' && 'bg-background shadow-sm'
              )}
              onClick={() => setTheme('system')}
              title="System preference"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full gap-2 text-muted-foreground"
          onClick={refreshData}
          disabled={dataLoading}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', dataLoading && 'animate-spin')} />
          <span>Refresh Data</span>
        </Button>

        {/* Dev-only Config Editor Button */}
        {isDev && (
          <>
            <Separator className="my-2" />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-dashed border-violet-500/50 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 hover:border-violet-500"
              onClick={() => setConfigOpen(true)}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Edit Scan Config</span>
              <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4 bg-violet-500/20 text-violet-600 dark:text-violet-400">
                DEV
              </Badge>
            </Button>
          </>
        )}
      </div>

      {/* Config Editor Sheet */}
      {isDev && (
        <ConfigEditor open={configOpen} onOpenChange={setConfigOpen} />
      )}
    </aside>
  );
}

function formatPageLabel(label: string): string {
  // Handle new format like "tailwindcss.com/index" or "tailwindcss.com/docs/installation/using-vite"
  const parts = label.split('/');
  
  // Get the last part (e.g., "index" or "using-vite")
  const lastPart = parts[parts.length - 1];
  
  if (!lastPart || lastPart === '' || lastPart === 'index') {
    // If it's "index" or empty, use the domain or parent path
    if (parts.length > 1) {
      // Return domain for homepage
      return parts[0];
    }
    return 'Home';
  }
  
  // Format the last part nicely
  return lastPart
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
