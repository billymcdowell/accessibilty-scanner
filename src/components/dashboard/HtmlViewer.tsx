import { useState, useEffect } from 'react';
import { useDashboard } from '@/context/DashboardContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  X,
  FileCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HtmlViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pageLabel: string;
}

export function HtmlViewer({ open, onOpenChange, pageLabel }: HtmlViewerProps) {
  const { selectedDayFolder } = useDashboard();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Build the HTML file URL
  const getHtmlUrl = () => {
    const BASE_URL = import.meta.env.BASE_URL || '/';
    const RESULTS_BASE_URL = `${BASE_URL}results`.replace('//', '/');
    return `${RESULTS_BASE_URL}/${selectedDayFolder}/${pageLabel}.html`;
  };

  useEffect(() => {
    if (!open || !selectedDayFolder || !pageLabel) {
      return;
    }

    const loadHtml = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const htmlUrl = getHtmlUrl();
        const response = await fetch(htmlUrl);
        
        if (!response.ok) {
          throw new Error(`HTML file not found (${response.status})`);
        }
        
        const content = await response.text();
        setHtmlContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load HTML file');
        setHtmlContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadHtml();
  }, [open, selectedDayFolder, pageLabel]);

  const handleCopy = async () => {
    if (htmlContent) {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenExternal = () => {
    const htmlUrl = getHtmlUrl();
    window.open(htmlUrl, '_blank');
  };

  const handleRefresh = () => {
    if (selectedDayFolder && pageLabel) {
      setLoading(true);
      const htmlUrl = getHtmlUrl();
      fetch(htmlUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((content) => {
          setHtmlContent(content);
          setError(null);
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-none !w-screen !h-screen !max-h-screen p-0 gap-0 flex flex-col overflow-hidden !rounded-none !border-0 !inset-0 !translate-x-0 !translate-y-0"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-4 py-3 border-b bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30">
                <FileCode className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold truncate text-zinc-100">
                  {formatPageTitle(pageLabel)}
                </DialogTitle>
                <DialogDescription className="text-xs truncate text-zinc-400">
                  {pageLabel}.html
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={handleRefresh} disabled={loading}>
                      <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Refresh</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={handleCopy} disabled={!htmlContent}>
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? 'Copied!' : 'Copy HTML'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={handleOpenExternal}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open in new tab</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <div className="h-6 w-px bg-zinc-700 mx-1" />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={() => onOpenChange(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Close (Esc)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </DialogHeader>

        {/* Content - Rendered HTML View */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-zinc-950">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Skeleton className="w-16 h-16 rounded-xl bg-zinc-800" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-zinc-500 animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-zinc-500">Loading HTML...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center bg-zinc-950">
              <div className="text-center space-y-4 max-w-md px-4">
                <div className="mx-auto w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <FileCode className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-zinc-100">Unable to Load HTML</h3>
                  <p className="text-sm text-zinc-400">{error}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleRefresh} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <iframe
              srcDoc={htmlContent || ''}
              className="w-full h-full border-0 bg-white"
              title={`HTML preview of ${pageLabel}`}
              sandbox="allow-scripts allow-same-origin"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-2 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs text-zinc-500">
          <span>
            {htmlContent ? `${(htmlContent.length / 1024).toFixed(1)} KB` : 'No content'}
          </span>
          <span className="flex items-center gap-2">
            <span className={cn(
              "w-2 h-2 rounded-full",
              loading ? "bg-yellow-500 animate-pulse" : error ? "bg-red-500" : "bg-green-500"
            )} />
            {loading ? 'Loading...' : error ? 'Error' : 'Loaded'}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatPageTitle(label: string): string {
  const parts = label.split('/');
  const lastPart = parts[parts.length - 1];
  
  if (!lastPart || lastPart === '' || lastPart === 'index') {
    if (parts.length > 0) {
      return parts[0];
    }
    return 'Home';
  }
  
  return lastPart
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Export a button component for triggering the HTML viewer
interface HtmlViewerButtonProps {
  pageLabel: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function HtmlViewerButton({ pageLabel, variant = 'outline', size = 'sm', className }: HtmlViewerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={cn("gap-2", className)}
              onClick={() => setOpen(true)}
            >
              <FileCode className="w-4 h-4" />
              {size !== 'icon' && 'View HTML'}
            </Button>
          </TooltipTrigger>
          <TooltipContent>View captured HTML source</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <HtmlViewer open={open} onOpenChange={setOpen} pageLabel={pageLabel} />
    </>
  );
}
