import { useState, useRef, useMemo } from 'react';
import { usePageResults } from '@/hooks/useAccessibilityData';
import { useDashboard } from '@/context/DashboardContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Copy,
  Check,
  Code,
  X,
  Layers,
} from 'lucide-react';
import { LEVEL_LABELS, LEVEL_COLORS, type AccessibilityResult, type LevelType } from '@/types/accessibility';
import { cn } from '@/lib/utils';

interface ScreenshotViewerProps {
  screenshotUrl: string;
  pageLabel: string;
}

interface IssueGroup {
  key: string;
  bounds: { left: number; top: number; width: number; height: number };
  issues: AccessibilityResult[];
  primaryLevel: LevelType;
  overlapIndex?: number; // Index within overlapping cluster for badge offset
}

export function ScreenshotViewer({ screenshotUrl, pageLabel }: ScreenshotViewerProps) {
  const { selectedDayFolder } = useDashboard();
  const { results, loading } = usePageResults(`${pageLabel}.json`, selectedDayFolder);
  const [zoom, setZoom] = useState(100);
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<IssueGroup | null>(null);
  const [hoveredIssue, setHoveredIssue] = useState<AccessibilityResult | null>(null);
  const [levelFilter, setLevelFilter] = useState<LevelType | 'all'>('all');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Filter issues that have valid bounds (not all zeros)
  const issuesWithBounds = useMemo(() => {
    return results.filter((issue) => {
      // Skip passed issues
      if (issue.level === 'pass') return false;
      
      // Filter by level if set
      if (levelFilter !== 'all' && issue.level !== levelFilter) return false;
      
      // Check if bounds are valid (not all zeros)
      const { left, top, height, width } = issue.bounds;
      return !(left === 0 && top === 0 && height === 0 && width === 0);
    });
  }, [results, levelFilter]);

  // Group issues with identical bounds
  const groupedIssues = useMemo(() => {
    const groups: Map<string, AccessibilityResult[]> = new Map();
    
    issuesWithBounds.forEach((issue) => {
      const key = `${issue.bounds.left}-${issue.bounds.top}-${issue.bounds.width}-${issue.bounds.height}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(issue);
    });
    
    const issueGroups: IssueGroup[] = Array.from(groups.entries()).map(([key, issues]) => ({
      key,
      bounds: issues[0].bounds,
      issues,
      primaryLevel: getPrimaryLevel(issues),
      overlapIndex: 0,
    }));

    // Detect overlapping groups and assign cascade indices
    // Two groups overlap if their badge areas (top-right corner) would collide
    const badgeSize = 24; // Approximate badge size
    const badgeMargin = 8; // Space needed between badges
    
    // Check for overlaps between badge positions
    const boundsOverlap = (a: IssueGroup, b: IssueGroup) => {
      // Calculate badge positions (top-right of each overlay)
      const aBadgeX = a.bounds.left + Math.max(a.bounds.width, 20);
      const aBadgeY = a.bounds.top;
      const bBadgeX = b.bounds.left + Math.max(b.bounds.width, 20);
      const bBadgeY = b.bounds.top;
      
      // Check if badges would be within collision distance
      const distance = Math.sqrt(
        Math.pow(aBadgeX - bBadgeX, 2) + Math.pow(aBadgeY - bBadgeY, 2)
      );
      
      return distance < badgeSize + badgeMargin;
    };

    // Also check if the actual overlay bounds significantly overlap
    const overlaysOverlap = (a: IssueGroup, b: IssueGroup) => {
      const aRight = a.bounds.left + Math.max(a.bounds.width, 20);
      const aBottom = a.bounds.top + Math.max(a.bounds.height, 20);
      const bRight = b.bounds.left + Math.max(b.bounds.width, 20);
      const bBottom = b.bounds.top + Math.max(b.bounds.height, 20);
      
      // Check for significant overlap (more than 50% of the smaller area)
      const overlapLeft = Math.max(a.bounds.left, b.bounds.left);
      const overlapTop = Math.max(a.bounds.top, b.bounds.top);
      const overlapRight = Math.min(aRight, bRight);
      const overlapBottom = Math.min(aBottom, bBottom);
      
      if (overlapLeft < overlapRight && overlapTop < overlapBottom) {
        const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
        const aArea = (aRight - a.bounds.left) * (aBottom - a.bounds.top);
        const bArea = (bRight - b.bounds.left) * (bBottom - b.bounds.top);
        const minArea = Math.min(aArea, bArea);
        
        return overlapArea > minArea * 0.3; // 30% overlap threshold
      }
      
      return false;
    };

    // Group overlapping items and assign indices
    const processed = new Set<string>();
    
    issueGroups.forEach((group) => {
      if (processed.has(group.key)) return;
      
      // Find all groups that overlap with this one
      const overlappingGroups = issueGroups.filter(
        (other) => other.key !== group.key && 
                   !processed.has(other.key) &&
                   (boundsOverlap(group, other) || overlaysOverlap(group, other))
      );
      
      if (overlappingGroups.length > 0) {
        // Sort by severity (violations first) then by position
        const cluster = [group, ...overlappingGroups].sort((a, b) => {
          const priorityOrder: LevelType[] = ['violation', 'potentialviolation', 'recommendation', 'potentialrecommendation', 'manual'];
          const aPriority = priorityOrder.indexOf(a.primaryLevel);
          const bPriority = priorityOrder.indexOf(b.primaryLevel);
          if (aPriority !== bPriority) return aPriority - bPriority;
          return a.bounds.top - b.bounds.top || a.bounds.left - b.bounds.left;
        });
        
        cluster.forEach((g, idx) => {
          g.overlapIndex = idx;
          processed.add(g.key);
        });
      } else {
        processed.add(group.key);
      }
    });

    return issueGroups;
  }, [issuesWithBounds]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleCopySnippet = async (snippet: string, issueId: string) => {
    await navigator.clipboard.writeText(snippet);
    setCopiedSnippet(issueId);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const handleOpenGroup = (group: IssueGroup) => {
    setSelectedGroup(group);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 300));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 25));
  const handleResetZoom = () => setZoom(100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showOverlays ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowOverlays(!showOverlays)}
                >
                  {showOverlays ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{showOverlays ? 'Hide overlays' : 'Show overlays'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as LevelType | 'all')}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Filter issues" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Issues ({issuesWithBounds.length})</SelectItem>
              <SelectItem value="violation">Violations</SelectItem>
              <SelectItem value="potentialviolation">Potential Violations</SelectItem>
              <SelectItem value="recommendation">Recommendations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {groupedIssues.length} locations
          </span>
          
          <div className="flex items-center gap-1 border rounded-md">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm w-12 text-center">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleResetZoom}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-muted/30 text-xs">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border-2 border-red-500 bg-red-500/20" />
          <span>Violation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border-2 border-orange-500 bg-orange-500/20" />
          <span>Potential</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm border-2 border-blue-500 bg-blue-500/20" />
          <span>Recommendation</span>
        </div>
        <span className="text-muted-foreground ml-2">Click on highlighted areas to view issue details</span>
      </div>

      {/* Main content area with screenshot and side panel */}
      <div className="flex-1 flex min-h-0">
        {/* Screenshot with overlays */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-[#1a1a1a] bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:20px_20px] min-w-0"
        >
          <div 
            className="relative inline-block m-4 shadow-2xl"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top left',
            }}
          >
            <img
              ref={imageRef}
              src={screenshotUrl}
              alt={`Screenshot of ${pageLabel}`}
              className="block max-w-none"
              onLoad={handleImageLoad}
            />

            {/* Issue overlays */}
            {showOverlays && imageLoaded && groupedIssues.map((group, index) => (
              <IssueOverlay
                key={group.key}
                group={group}
                isHovered={hoveredIssue ? group.issues.includes(hoveredIssue) : false}
                isSelected={selectedGroup?.key === group.key}
                onClick={() => handleOpenGroup(group)}
                onMouseEnter={() => setHoveredIssue(group.issues[0])}
                onMouseLeave={() => setHoveredIssue(null)}
                baseZIndex={10 + index}
              />
            ))}
          </div>

          {/* Hover tooltip */}
          {hoveredIssue && !selectedGroup && (
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-popover border rounded-lg shadow-xl p-3 max-w-lg z-50">
              {(() => {
                const hoveredGroup = groupedIssues.find(g => g.issues.includes(hoveredIssue));
                const issueCount = hoveredGroup?.issues.length || 1;
                
                return (
                  <div className="flex items-start gap-2">
                    <LevelIcon level={hoveredIssue.level} className="shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs" style={{ borderColor: LEVEL_COLORS[hoveredIssue.level] }}>
                          {hoveredIssue.ruleId}
                        </Badge>
                        <LevelBadge level={hoveredIssue.level} />
                        {issueCount > 1 && (
                          <Badge variant="secondary" className="text-xs">
                            +{issueCount - 1} more
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{hoveredIssue.message}</p>
                      {issueCount > 1 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Click to see all {issueCount} issues at this location
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Issue Detail Side Panel */}
        <div 
          className={cn(
            "border-l bg-background flex flex-col transition-all duration-300 ease-in-out",
            selectedGroup ? "w-[420px] opacity-100" : "w-0 opacity-0 overflow-hidden"
          )}
        >
          {selectedGroup && (
            <>
              {/* Panel Header */}
              <div className="flex-shrink-0 p-4 pb-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold">
                      {selectedGroup.issues.length} {selectedGroup.issues.length === 1 ? 'Issue' : 'Issues'}
                    </h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setSelectedGroup(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Position: ({selectedGroup.bounds.left}, {selectedGroup.bounds.top})</span>
                  <span>•</span>
                  <span>Size: {selectedGroup.bounds.width}×{selectedGroup.bounds.height}</span>
                </div>
              </div>
              
              {/* Panel Content */}
              <div className="flex-1 overflow-auto">
                <div className="p-4 space-y-3">
                  {selectedGroup.issues.map((issue, idx) => (
                    <div 
                      key={idx} 
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Card Header */}
                      <div className="px-3 py-2.5 bg-muted/30 border-b">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-1 h-8 rounded-full flex-shrink-0"
                            style={{ backgroundColor: LEVEL_COLORS[issue.level] }}
                          />
                          <LevelIcon level={issue.level} className="flex-shrink-0 w-4 h-4" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Badge 
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                                style={{ borderColor: LEVEL_COLORS[issue.level], color: LEVEL_COLORS[issue.level] }}
                              >
                                {issue.ruleId}
                              </Badge>
                              <LevelBadge level={issue.level} />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="px-3 py-3 space-y-3">
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Message</h4>
                          <p className="text-sm">{issue.message}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">DOM Path</h4>
                          <code className="text-[10px] bg-muted px-2 py-1 rounded block overflow-x-auto">
                            {issue.path.dom}
                          </code>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                              <Code className="w-3 h-3" />
                              HTML Snippet
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 px-1.5 text-[10px]"
                              onClick={() => handleCopySnippet(issue.snippet, `${idx}`)}
                            >
                              {copiedSnippet === `${idx}` ? (
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
                          <pre className="text-[10px] bg-muted/50 border rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all max-h-24">
                            {issue.snippet}
                          </pre>
                        </div>

                        <div className="flex items-center justify-end pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs" asChild>
                            <a href={issue.help} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Docs
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface IssueOverlayProps {
  group: IssueGroup;
  isHovered: boolean;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  baseZIndex: number;
}

function IssueOverlay({ group, isHovered, isSelected, onClick, onMouseEnter, onMouseLeave, baseZIndex }: IssueOverlayProps) {
  const { bounds, issues, primaryLevel, overlapIndex = 0 } = group;
  const color = LEVEL_COLORS[primaryLevel];
  const count = issues.length;
  const isHighlighted = isHovered || isSelected;

  // Skip tiny or zero-size bounds
  if (bounds.width < 5 && bounds.height < 5) return null;

  // Z-index: hovered/selected items get highest, otherwise use overlap index
  const zIndex = isHighlighted ? 100 : baseZIndex + overlapIndex;

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-150',
        'border-2 rounded-sm',
        isHighlighted && 'shadow-lg'
      )}
      style={{
        left: bounds.left,
        top: bounds.top,
        width: Math.max(bounds.width, 20),
        height: Math.max(bounds.height, 20),
        borderColor: color,
        backgroundColor: isHighlighted ? `${color}40` : `${color}20`,
        boxShadow: isHighlighted 
          ? `0 0 0 4px ${color}40, 0 4px 12px ${color}30` 
          : 'none',
        borderWidth: isSelected ? '3px' : '2px',
        zIndex,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Badge showing issue count - positioned at top-right corner of overlay */}
      <div
        className={cn(
          "absolute min-w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md transition-all duration-150 cursor-pointer hover:scale-110",
          isSelected && "scale-125",
          isHighlighted && "ring-2 ring-white/50"
        )}
        style={{ 
          backgroundColor: color,
          top: -10,
          right: -10,
          zIndex: zIndex + 1,
        }}
      >
        {count}
      </div>

      {/* Pulsing animation for violations (only when not selected) */}
      {primaryLevel === 'violation' && !isSelected && (
        <div
          className="absolute inset-0 rounded-sm animate-pulse pointer-events-none"
          style={{ 
            backgroundColor: `${color}10`,
            animation: 'pulse 2s infinite',
          }}
        />
      )}
    </div>
  );
}

function getPrimaryLevel(issues: AccessibilityResult[]): LevelType {
  // Priority: violation > potentialviolation > recommendation > others
  const priority: LevelType[] = ['violation', 'potentialviolation', 'recommendation', 'potentialrecommendation', 'manual'];
  
  for (const level of priority) {
    if (issues.some(i => i.level === level)) {
      return level;
    }
  }
  
  return issues[0].level;
}

function LevelIcon({ level, className }: { level: string; className?: string }) {
  const iconClass = cn('w-5 h-5', className);
  
  switch (level) {
    case 'violation':
      return <AlertCircle className={cn(iconClass, 'text-red-500')} />;
    case 'potentialviolation':
      return <AlertTriangle className={cn(iconClass, 'text-orange-500')} />;
    case 'recommendation':
    case 'potentialrecommendation':
      return <Info className={cn(iconClass, 'text-blue-500')} />;
    default:
      return <Info className={cn(iconClass, 'text-muted-foreground')} />;
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
