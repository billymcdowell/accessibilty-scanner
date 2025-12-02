// Types for IBM Accessibility Checker results

export interface Bounds {
  left: number;
  top: number;
  height: number;
  width: number;
}

export interface Path {
  dom: string;
  aria: string;
}

export interface AccessibilityResult {
  ruleId: string;
  value: string[];
  path: Path;
  ruleTime: number;
  reasonId: string;
  message: string;
  messageArgs: string[];
  apiArgs: string[];
  bounds: Bounds;
  snippet: string;
  category: string;
  level: 'violation' | 'potentialviolation' | 'recommendation' | 'potentialrecommendation' | 'manual' | 'pass';
  ignored: boolean;
  help: string;
}

export interface PageReport {
  results: AccessibilityResult[];
  counts?: Counts;
  summary?: string;
}

export interface Counts {
  ignored: number;
  violation: number;
  recommendation: number;
  pass: number;
  potentialviolation: number;
  potentialrecommendation: number;
  manual: number;
  elements: number;
  elementsViolation: number;
  elementsViolationReview: number;
}

export interface PageScanSummary {
  label: string;
  counts: Counts;
}

export interface ScanSummary {
  counts: Counts;
  startReport: number;
  endReport: number;
  toolID: string;
  policies: string[];
  reportLevels: string[];
  failLevels: string[];
  scanID: string;
  pageScanSummary: PageScanSummary[];
}

export interface PageData {
  label: string;
  jsonFile: string;
  screenshotFile?: string;
  counts: Counts;
  results?: AccessibilityResult[];
}

export type LevelType = 'violation' | 'potentialviolation' | 'recommendation' | 'potentialrecommendation' | 'manual' | 'pass';

export const LEVEL_LABELS: Record<LevelType, string> = {
  violation: 'Violations',
  potentialviolation: 'Potential Violations',
  recommendation: 'Recommendations',
  potentialrecommendation: 'Potential Recommendations',
  manual: 'Manual Review',
  pass: 'Passed',
};

export const LEVEL_COLORS: Record<LevelType, string> = {
  violation: '#ef4444',
  potentialviolation: '#f97316',
  recommendation: '#3b82f6',
  potentialrecommendation: '#8b5cf6',
  manual: '#eab308',
  pass: '#22c55e',
};

