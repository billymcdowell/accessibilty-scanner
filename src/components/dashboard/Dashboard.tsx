import { useDashboard } from '@/context/DashboardContext';
import { Overview } from './Overview';
import { PageDetails } from './PageDetails';

export function Dashboard() {
  const { selectedPage } = useDashboard();

  if (selectedPage) {
    return <PageDetails />;
  }

  return <Overview />;
}

