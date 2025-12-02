import { useState, useMemo } from 'react';
import { usePageResults } from '@/hooks/useAccessibilityData';
import { useDashboard } from '@/context/DashboardContext';
import { ScreenshotViewer } from './ScreenshotViewer';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ArrowLeft,
  Search,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Code,
  Filter,
  X,
  List,
  Layers,
} from 'lucide-react';
import { LEVEL_LABELS, LEVEL_COLORS, type AccessibilityResult, type LevelType } from '@/types/accessibility';
import { cn } from '@/lib/utils';

export function PageDetails() {
  const { 
    selectedPage, 
    setSelectedPage, 
    searchQuery, 
    setSearchQuery, 
    selectedLevel, 
    setSelectedLevel,
    selectedDayFolder,
    getScreenshotUrl,
  } = useDashboard();
  const { results, loading } = usePageResults(selectedPage?.jsonFile ?? null, selectedDayFolder);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [selectedRuleFilter, setSelectedRuleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'visual'>('list');

  // Filter and group results
  const filteredResults = useMemo(() => {
    if (!results.length) return [];

    return results.filter((result) => {
      // Exclude passed results by default
      if (result.level === 'pass') return false;

      // Level filter
      if (selectedLevel !== 'all' && result.level !== selectedLevel) return false;

      // Rule filter
      if (selectedRuleFilter !== 'all' && result.ruleId !== selectedRuleFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          result.message.toLowerCase().includes(query) ||
          result.ruleId.toLowerCase().includes(query) ||
          result.snippet.toLowerCase().includes(query) ||
          result.path.dom.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [results, selectedLevel, selectedRuleFilter, searchQuery]);

  // Group by rule
  const groupedByRule = useMemo(() => {
    const groups: Record<string, AccessibilityResult[]> = {};
    filteredResults.forEach((result) => {
      if (!groups[result.ruleId]) {
        groups[result.ruleId] = [];
      }
      groups[result.ruleId].push(result);
    });
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredResults]);

  // Get unique rules for filter
  const uniqueRules = useMemo(() => {
    const rules = new Set<string>();
    results.forEach((r) => {
      if (r.level !== 'pass') rules.add(r.ruleId);
    });
    return Array.from(rules).sort();
  }, [results]);

  // Count by level
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      violation: 0,
      potentialviolation: 0,
      recommendation: 0,
      potentialrecommendation: 0,
      manual: 0,
    };
    results.forEach((r) => {
      if (r.level !== 'pass' && counts[r.level] !== undefined) {
        counts[r.level]++;
      }
    });
    return counts;
  }, [results]);

  const handleCopySnippet = async (snippet: string) => {
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(snippet);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  if (!selectedPage) return null;

  const screenshotUrl = selectedPage.screenshotFile
    ? getScreenshotUrl(selectedPage.screenshotFile)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedPage(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {formatPageLabel(selectedPage.label)}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              {selectedPage.label}
            </p>
          </div>
          
          {/* View mode toggle */}
          <div className="flex items-center border rounded-lg p-1 bg-muted/50">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2 h-8"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
              List
            </Button>
            {screenshotUrl && (
              <Button
                variant={viewMode === 'visual' ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2 h-8"
                onClick={() => setViewMode('visual')}
              >
                <Layers className="w-4 h-4" />
                Visual
              </Button>
            )}
          </div>
        </div>

        {/* Stats Bar - only show in list mode */}
        {viewMode === 'list' && (
          <>
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              <Badge
                variant={selectedLevel === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedLevel('all')}
              >
                All ({Object.values(levelCounts).reduce((a, b) => a + b, 0)})
              </Badge>
              {Object.entries(levelCounts).map(([level, count]) => {
                if (count === 0) return null;
                const isSelected = selectedLevel === level;
                return (
                  <Badge
                    key={level}
                    variant={isSelected ? 'default' : 'outline'}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderColor: LEVEL_COLORS[level as LevelType],
                      backgroundColor: isSelected ? LEVEL_COLORS[level as LevelType] : 'transparent',
                      color: isSelected ? 'white' : LEVEL_COLORS[level as LevelType],
                    }}
                    onClick={() => setSelectedLevel(level as LevelType)}
                  >
                    {LEVEL_LABELS[level as LevelType]} ({count})
                  </Badge>
                );
              })}
            </div>

            {/* Search and Filters */}
            <div className="px-4 pb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search violations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <Select value={selectedRuleFilter} onValueChange={setSelectedRuleFilter}>
                <SelectTrigger className="w-[220px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rules</SelectItem>
                  {uniqueRules.map((rule) => (
                    <SelectItem key={rule} value={rule}>
                      {rule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      {/* Content */}
      {viewMode === 'visual' && screenshotUrl ? (
        <ScreenshotViewer 
          screenshotUrl={screenshotUrl} 
          pageLabel={selectedPage.label} 
        />
      ) : (
        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredResults.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Results Found</h3>
                  <p className="text-sm text-muted-foreground">
                    {searchQuery || selectedLevel !== 'all' || selectedRuleFilter !== 'all'
                      ? 'Try adjusting your filters or search query'
                      : 'No accessibility issues found on this page'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="grouped" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="grouped">Grouped by Rule</TabsTrigger>
                  <TabsTrigger value="list">All Issues ({filteredResults.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="grouped" className="mt-0">
                  <Accordion type="multiple" className="space-y-2">
                    {groupedByRule.map(([ruleId, ruleResults]) => (
                      <AccordionItem
                        key={ruleId}
                        value={ruleId}
                        className="border rounded-lg px-4 bg-card"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3 text-left">
                            <LevelIcon level={ruleResults[0].level} />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{ruleId}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {ruleResults[0].message}
                              </div>
                            </div>
                            <Badge variant="secondary">{ruleResults.length}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3 pt-2 pb-4">
                            {ruleResults.slice(0, 50).map((result, idx) => (
                              <ViolationCard
                                key={`${result.ruleId}-${idx}`}
                                result={result}
                                onCopy={handleCopySnippet}
                                copiedSnippet={copiedSnippet}
                                compact
                              />
                            ))}
                            {ruleResults.length > 50 && (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                ... and {ruleResults.length - 50} more
                              </p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </TabsContent>

                <TabsContent value="list" className="mt-0">
                  <div className="space-y-3">
                    {filteredResults.slice(0, 100).map((result, idx) => (
                      <ViolationCard
                        key={`${result.ruleId}-${idx}`}
                        result={result}
                        onCopy={handleCopySnippet}
                        copiedSnippet={copiedSnippet}
                      />
                    ))}
                    {filteredResults.length > 100 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Showing first 100 of {filteredResults.length} results
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

interface ViolationCardProps {
  result: AccessibilityResult;
  onCopy: (snippet: string) => void;
  copiedSnippet: string | null;
  compact?: boolean;
}

function ViolationCard({ result, onCopy, copiedSnippet, compact }: ViolationCardProps) {
  const isCopied = copiedSnippet === result.snippet;

  return (
    <Card className={cn('overflow-hidden', compact && 'border-dashed')}>
      <CardHeader className={cn('pb-2', compact && 'py-3')}>
        <div className="flex items-start gap-3">
          {!compact && <LevelIcon level={result.level} />}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {!compact && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: LEVEL_COLORS[result.level],
                    color: LEVEL_COLORS[result.level],
                  }}
                >
                  {result.ruleId}
                </Badge>
              )}
              <LevelBadge level={result.level} />
            </div>
            <CardDescription className="mt-1.5 text-foreground">
              {result.message}
            </CardDescription>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  asChild
                >
                  <a
                    href={result.help}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View rule documentation</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className={cn(compact && 'py-3 pt-0')}>
        <div className="space-y-3">
          {/* DOM Path */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">DOM Path</p>
            <code className="text-xs bg-muted px-2 py-1 rounded block overflow-x-auto">
              {result.path.dom}
            </code>
          </div>

          {/* Snippet */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Code className="w-3 h-3" />
                HTML Snippet
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onCopy(result.snippet)}
              >
                {isCopied ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <pre className="text-xs bg-muted/50 border rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all">
              {result.snippet}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelIcon({ level }: { level: string }) {
  switch (level) {
    case 'violation':
      return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
    case 'potentialviolation':
      return <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />;
    case 'recommendation':
    case 'potentialrecommendation':
      return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    default:
      return <Info className="w-5 h-5 text-muted-foreground shrink-0" />;
  }
}

function LevelBadge({ level }: { level: string }) {
  return (
    <Badge
      variant="secondary"
      className="text-[10px] font-medium"
      style={{
        backgroundColor: `${LEVEL_COLORS[level as LevelType]}20`,
        color: LEVEL_COLORS[level as LevelType],
      }}
    >
      {LEVEL_LABELS[level as LevelType] || level}
    </Badge>
  );
}

function formatPageLabel(label: string): string {
  // Handle new format like "tailwindcss.com/index" or "tailwindcss.com/docs/installation/using-vite"
  const parts = label.split('/');
  
  // Get the last part (e.g., "index" or "using-vite")
  const lastPart = parts[parts.length - 1];
  
  if (!lastPart || lastPart === '' || lastPart === 'index') {
    // If it's "index" or empty, use the domain
    if (parts.length > 0) {
      return parts[0];
    }
    return 'Home';
  }
  
  // Format the last part nicely
  return lastPart
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
