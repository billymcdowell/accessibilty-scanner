import { DashboardLayout, Dashboard } from '@/components/dashboard';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <ThemeProvider>
      <DashboardLayout>
        <Dashboard />
      </DashboardLayout>
      <Toaster richColors position="bottom-right" />
    </ThemeProvider>
  );
}

export default App;
