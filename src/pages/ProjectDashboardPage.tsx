import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';

// Types for our dashboard data
type ProjectMetrics = {
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  avg_cycle_time: number;
  avg_lead_time: number;
};

type BurndownPoint = {
  date: string;
  open_tasks: number;
  created_tasks: number;
  closed_tasks: number;
};

type CycleTimeDistribution = {
  category: string;
  count: number;
};

// Container component for charts with loading state
const ChartContainer = ({ 
  title, 
  children, 
  isLoading, 
  error = null
}: { 
  title: string; 
  children: React.ReactNode; 
  isLoading: boolean; 
  error?: string | null 
}) => (
  <Card className="w-full">
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent className="h-[300px]">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        children
      )}
    </CardContent>
  </Card>
);

export function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useUser();
  const [projectName, setProjectName] = useState<string>('');
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [burndownData, setBurndownData] = useState<BurndownPoint[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<CycleTimeDistribution[]>([]);
  const [leadTimeData, setLeadTimeData] = useState<{ name: string; value: number }[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user || !projectId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user has access to this project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();
          
        if (projectError || !projectData) {
          console.error('Project access check failed:', projectError);
          setAccessDenied(true);
          setIsLoading(false);
          return;
        }
        
        setProjectName(projectData.name);
        
        // Call the Supabase function to get project metrics
        const { data: metricsData, error: metricsError } = await supabase
          .rpc('get_project_metrics', { project_id_param: projectId });
          
        if (metricsError) {
          throw new Error(`Failed to fetch project metrics: ${metricsError.message}`);
        }
        
        setMetrics(metricsData);
        
        // Get burndown chart data
        const { data: burndownData, error: burndownError } = await supabase
          .rpc('get_project_burndown', { project_id_param: projectId, days_param: 30 });
          
        if (burndownError) {
          throw new Error(`Failed to fetch burndown data: ${burndownError.message}`);
        }
        
        setBurndownData(burndownData || []);
        
        // Get cycle time distribution
        const { data: cycleTimeData, error: cycleTimeError } = await supabase
          .rpc('get_project_cycle_time_distribution', { project_id_param: projectId });
          
        if (cycleTimeError) {
          throw new Error(`Failed to fetch cycle time data: ${cycleTimeError.message}`);
        }
        
        setCycleTimeData(cycleTimeData || []);
        
        // For lead time, we'll use a similar approach with mock data for now
        // In a real implementation, you'd call another RPC function
        setLeadTimeData([
          { name: '< 1 day', value: 5 },
          { name: '1-2 days', value: 10 },
          { name: '3-7 days', value: 8 },
          { name: '1-2 weeks', value: 4 },
          { name: '> 2 weeks', value: 2 },
        ]);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, [projectId, user]);

  if (accessDenied) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have access to this project dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const completionPercentage = metrics ? 
    Math.round((metrics.completed_tasks / (metrics.total_tasks || 1)) * 100) : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {projectName || 'Project'} Dashboard
        </h1>
        <p className="text-muted-foreground">
          View metrics and progress for this project
        </p>
      </div>

      <Separator />
      
      {/* Key metrics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_tasks ?? 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <Progress className="mt-2" value={completionPercentage} />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Cycle Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_cycle_time ? `${metrics.avg_cycle_time.toFixed(1)} days` : 'N/A'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Lead Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avg_lead_time ? `${metrics.avg_lead_time.toFixed(1)} days` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="burndown" className="w-full">
        <TabsList>
          <TabsTrigger value="burndown">Burndown</TabsTrigger>
          <TabsTrigger value="cycletime">Cycle Time</TabsTrigger>
          <TabsTrigger value="leadtime">Lead Time</TabsTrigger>
        </TabsList>
        
        <TabsContent value="burndown" className="space-y-4">
          <ChartContainer title="Burndown Chart (30 Days)" isLoading={isLoading} error={error}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={burndownData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="open_tasks" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Open Tasks"
                />
                <Area 
                  type="monotone" 
                  dataKey="created_tasks" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Created Tasks"
                />
                <Area 
                  type="monotone" 
                  dataKey="closed_tasks" 
                  stackId="3"
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  name="Closed Tasks"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="cycletime" className="space-y-4">
          <ChartContainer title="Cycle Time Distribution" isLoading={isLoading} error={error}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cycleTimeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Number of Tasks" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
        
        <TabsContent value="leadtime" className="space-y-4">
          <ChartContainer title="Lead Time Distribution" isLoading={isLoading} error={error}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={leadTimeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Number of Tasks" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </TabsContent>
      </Tabs>
    </div>
  );
} 