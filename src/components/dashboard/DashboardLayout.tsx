import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { DashboardProvider } from '@/context/DashboardContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <DashboardProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </DashboardProvider>
  );
}

