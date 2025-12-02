import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { PageData, LevelType } from '@/types/accessibility';
import { useAvailableDays, useAccessibilityData, type DayFolder } from '@/hooks/useAccessibilityData';

interface DashboardContextValue {
  // Day selection
  availableDays: DayFolder[];
  selectedDay: string | null;
  selectedDayFolder: string | null; // The actual folder name for path building
  setSelectedDay: (day: string | null) => void;
  daysLoading: boolean;
  
  // Data from selected day
  summary: ReturnType<typeof useAccessibilityData>['summary'];
  pages: ReturnType<typeof useAccessibilityData>['pages'];
  dataLoading: boolean;
  dataError: string | null;
  refreshData: () => void;
  loadPageResults: ReturnType<typeof useAccessibilityData>['loadPageResults'];
  getScreenshotUrl: ReturnType<typeof useAccessibilityData>['getScreenshotUrl'];
  
  // Page selection
  selectedPage: PageData | null;
  setSelectedPage: (page: PageData | null) => void;
  
  // Filters
  selectedLevel: LevelType | 'all';
  setSelectedLevel: (level: LevelType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRuleId: string | null;
  setSelectedRuleId: (ruleId: string | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  // Day management
  const { days: availableDays, loading: daysLoading } = useAvailableDays();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Auto-select the most recent day when days are loaded
  useEffect(() => {
    if (availableDays.length > 0 && !selectedDay) {
      setSelectedDay(availableDays[0].name);
    }
  }, [availableDays, selectedDay]);
  
  // Get the summary file name for the selected day
  const selectedDayInfo = useMemo(() => {
    return availableDays.find(d => d.name === selectedDay);
  }, [availableDays, selectedDay]);
  
  // Data from selected day - use folder for path building, not the unique name
  const {
    summary,
    pages,
    loading: dataLoading,
    error: dataError,
    refresh: refreshData,
    loadPageResults,
    getScreenshotUrl,
  } = useAccessibilityData(selectedDayInfo?.folder ?? null, selectedDayInfo?.summaryFile);
  
  // Page selection
  const [selectedPage, setSelectedPage] = useState<PageData | null>(null);
  
  // Clear selected page when day changes
  useEffect(() => {
    setSelectedPage(null);
  }, [selectedDay]);
  
  // Filters
  const [selectedLevel, setSelectedLevel] = useState<LevelType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  return (
    <DashboardContext.Provider
      value={{
        availableDays,
        selectedDay,
        selectedDayFolder: selectedDayInfo?.folder ?? null,
        setSelectedDay,
        daysLoading,
        
        summary,
        pages,
        dataLoading,
        dataError,
        refreshData,
        loadPageResults,
        getScreenshotUrl,
        
        selectedPage,
        setSelectedPage,
        
        selectedLevel,
        setSelectedLevel,
        searchQuery,
        setSearchQuery,
        selectedRuleId,
        setSelectedRuleId,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
