import { useDashboard } from '@/context/DashboardContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { LEVEL_COLORS } from '@/types/accessibility';

export function Overview() {
  const { summary, pages, dataLoading, setSelectedPage, selectedDay } = useDashboard();

  if (dataLoading) {
    return <OverviewSkeleton />;
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Data Found</h3>
            <p className="text-sm text-muted-foreground">
              {selectedDay 
                ? 'No accessibility scan results found for this date.'
                : 'Select a scan date from the sidebar to view results.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalIssues = summary.counts.violation + summary.counts.potentialviolation;
  const passRate = Math.round(
    (summary.counts.pass / (summary.counts.pass + totalIssues)) * 100
  );

  const scanDuration = Math.round((summary.endReport - summary.startReport) / 1000);

  const pieData = [
    { name: 'Violations', value: summary.counts.violation, color: LEVEL_COLORS.violation },
    { name: 'Potential', value: summary.counts.potentialviolation, color: LEVEL_COLORS.potentialviolation },
    { name: 'Recommendations', value: summary.counts.recommendation, color: LEVEL_COLORS.recommendation },
    { name: 'Passed', value: Math.min(summary.counts.pass, 1000), color: LEVEL_COLORS.pass },
  ].filter(d => d.value > 0);

  const barData = pages.map(page => ({
    name: formatPageLabel(page.label),
    violations: page.counts.violation,
    potential: page.counts.potentialviolation,
    recommendations: page.counts.recommendation,
  }));

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/25">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Accessibility Report</h1>
            <p className="text-muted-foreground">
              Scanned {pages.length} pages • {new Date(summary.startReport).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{summary.counts.violation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Accessibility failures that must be fixed
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Potential Issues</CardTitle>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{summary.counts.potentialviolation.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Issues requiring manual review
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{passRate}%</div>
            <Progress value={passRate} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Elements Scanned</CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.counts.elements.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {pages.length} pages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Issues Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Issues Distribution
            </CardTitle>
            <CardDescription>Breakdown of all accessibility issues by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg px-3 py-2 shadow-lg">
                            <p className="font-medium">{payload[0].name}</p>
                            <p className="text-muted-foreground text-sm">
                              {payload[0].value?.toLocaleString()} issues
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Issues by Page Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Issues by Page
            </CardTitle>
            <CardDescription>Comparison of issues across scanned pages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} fontSize={12} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg px-3 py-2 shadow-lg">
                            <p className="font-medium mb-1">{label}</p>
                            {payload.map((p, i) => (
                              <p key={i} className="text-sm" style={{ color: p.color }}>
                                {p.name}: {p.value?.toLocaleString()}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="violations" name="Violations" fill={LEVEL_COLORS.violation} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="potential" name="Potential" fill={LEVEL_COLORS.potentialviolation} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="recommendations" name="Recommendations" fill={LEVEL_COLORS.recommendation} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pages Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Scanned Pages</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => {
            const totalPageIssues = page.counts.violation + page.counts.potentialviolation;
            const pagePassRate = Math.round(
              (page.counts.pass / (page.counts.pass + totalPageIssues)) * 100
            );

            return (
              <Card
                key={page.label}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
                onClick={() => setSelectedPage(page)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {formatPageLabel(page.label)}
                    </CardTitle>
                    {page.counts.violation > 0 ? (
                      <Badge variant="destructive" className="text-xs">
                        {page.counts.violation} violations
                      </Badge>
                    ) : page.counts.potentialviolation > 0 ? (
                      <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                        {page.counts.potentialviolation} potential
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                        All passed
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs truncate">
                    {page.label}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">{page.counts.violation}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-muted-foreground">{page.counts.potentialviolation}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">{pagePassRate}% pass</span>
                    </div>
                  </div>
                  <Progress value={pagePassRate} className="mt-3 h-1" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Scan Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Scan Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Tool</p>
              <p className="font-medium">{summary.toolID}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Duration</p>
              <p className="font-medium">{scanDuration} seconds</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Policies</p>
              <div className="flex gap-1.5 flex-wrap mt-0.5">
                {summary.policies.map((policy) => (
                  <Badge key={policy} variant="secondary" className="text-xs">
                    {policy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div>
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-full mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
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
