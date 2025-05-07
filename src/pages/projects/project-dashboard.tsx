import { useEffect, useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Task } from '../tasks/columns';
import { format, parseISO, isAfter, differenceInDays, subDays } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

// Types
interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface TaskActivityChartData {
  date: string;
  created: number;
  closed: number;
  open?: number;
}

interface CycleTimeData {
  taskId: string;
  taskName: string;
  cycleTime: number; // days
}

interface LeadTimeData {
  taskId: string;
  taskName: string;
  leadTime: number; // days
}

export default function ProjectDashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskActivity, setTaskActivity] = useState<TaskActivityChartData[]>([]);
  const [cycleTimeData, setCycleTimeData] = useState<CycleTimeData[]>([]);
  const [leadTimeData, setLeadTimeData] = useState<LeadTimeData[]>([]);
  const [totalEstimatedEffort, setTotalEstimatedEffort] = useState<number>(0);
  const [completedEffort, setCompletedEffort] = useState<number>(0);
  const [loadingProject, setLoadingProject] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [timeRange, setTimeRange] = useState<'90d' | '30d' | '7d'>('30d');
  const isMobile = useIsMobile();

  // Chart configurations
  const chartConfig = {
    open: { color: '#8884d8', label: 'Open Tasks' },
    created: { color: '#82ca9d', label: 'Created' },
    closed: { color: '#ffc658', label: 'Closed' },
    count: { color: '#8884d8', label: 'Tasks' }
  };

  useEffect(() => {
    if (isMobile) setTimeRange('7d');
  }, [isMobile]);

  useEffect(() => {
    if (!user || !projectId) return;
    fetchProject();
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, projectId]);

  useEffect(() => {
    if (tasks.length > 0) {
      fetchTaskActivityData();
      calculateMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, timeRange]);

  async function fetchProject() {
    setLoadingProject(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      if (data) setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoadingProject(false);
    }
  }

  async function fetchTasks() {
    setLoadingTasks(true);
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function fetchTaskActivityData() {
    setLoadingCharts(true);
    try {
      const { data: historyData, error: historyError } = await supabase
        .from('task_status_history')
        .select('*')
        .eq('project_id', projectId)
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      if (!historyData || historyData.length === 0) {
        setTaskActivity([]);
        setLoadingCharts(false);
        return;
      }

      // Determine date range based on timeRange state
      const endDate = new Date();
      const startDate = new Date();
      const days = timeRange === '90d' ? 90 : timeRange === '30d' ? 30 : 7;
      startDate.setDate(endDate.getDate() - days + 1);

      // Initialize data structure
      const activityByDate: Record<string, { created: number; closed: number; open?: number }> = {};
      // Initialize date range in activityByDate
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().slice(0, 10);
        activityByDate[dateKey] = { created: 0, closed: 0, open: 0 };
      }

      const createdTasksToday: Record<string, Set<string>> = {};
      const closedTasksToday: Record<string, Set<string>> = {};

      // Calculate open tasks for each day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const currentDateKey = d.toISOString().slice(0, 10);
        let openOnThisDayCount = 0;

        tasks.forEach(task => {
          const taskCreationDate = new Date(task.created_at);
          if (taskCreationDate <= d) {
            let lastKnownStatus = task.status;

            const relevantHistory = historyData
              .filter(h => h.task_id === task.id && new Date(h.changed_at) <= d)
              .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

            if (relevantHistory.length > 0) {
              lastKnownStatus = relevantHistory[0].status;
            }

            if (lastKnownStatus.toLowerCase() !== 'done') {
              openOnThisDayCount++;
            }
          }
        });

        if (activityByDate[currentDateKey]) {
          activityByDate[currentDateKey].open = openOnThisDayCount;
        }
      }

      // Process task history for created/closed events
      historyData.forEach(item => {
        const itemDate = new Date(item.changed_at);
        const dateKey = itemDate.toISOString().slice(0, 10);

        if (activityByDate[dateKey]) {
          if (!createdTasksToday[dateKey]) createdTasksToday[dateKey] = new Set();
          if (!closedTasksToday[dateKey]) closedTasksToday[dateKey] = new Set();

          if (item.status.toLowerCase() === 'to do' && !createdTasksToday[dateKey].has(item.task_id)) {
            activityByDate[dateKey].created += 1;
            createdTasksToday[dateKey].add(item.task_id);
          }
          
          if (item.status.toLowerCase() === 'done' && !closedTasksToday[dateKey].has(item.task_id)) {
            activityByDate[dateKey].closed += 1;
            closedTasksToday[dateKey].add(item.task_id);
          }
        }
      });

      // Format chart data
      const formattedChartData = Object.entries(activityByDate)
        .map(([date, counts]) => ({
          date,
          created: counts.created,
          closed: counts.closed,
          open: counts.open ?? 0,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setTaskActivity(formattedChartData);
    } catch (error) {
      console.error('Error fetching task activity data:', error);
      setTaskActivity([]);
    } finally {
      setLoadingCharts(false);
    }
  }

  async function calculateMetrics() {
    try {
      // Fetch any custom fields for effort estimation
      const { data: customFields, error: fieldsError } = await supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('entity_type', 'task')
        .eq('project_id', projectId)
        .or('project_id.eq.global');

      if (fieldsError) throw fieldsError;

      // Find effort field if it exists (assuming it's a number type field)
      const effortField = customFields?.find(f => 
        f.field_name.toLowerCase().includes('effort') || 
        f.field_name.toLowerCase().includes('estimate')
      );

      if (effortField) {
        // Fetch effort values
        const { data: fieldValues, error: valuesError } = await supabase
          .from('custom_field_values')
          .select('*')
          .eq('field_definition_id', effortField.id);

        if (valuesError) throw valuesError;

        if (fieldValues && fieldValues.length > 0) {
          let totalEffort = 0;
          let completedEffort = 0;

          fieldValues.forEach(value => {
            const task = tasks.find(t => t.id === value.entity_id);
            if (task) {
              const effort = value.number_value || 0;
              totalEffort += effort;
              if (task.status.toLowerCase() === 'done') {
                completedEffort += effort;
              }
            }
          });

          setTotalEstimatedEffort(totalEffort);
          setCompletedEffort(completedEffort);
        }
      }

      // Calculate cycle times and lead times
      const { data: historyData, error: historyError } = await supabase
        .from('task_status_history')
        .select('*')
        .eq('project_id', projectId)
        .order('changed_at', { ascending: true });

      if (historyError) throw historyError;

      const cycleTimeResults: CycleTimeData[] = [];
      const leadTimeResults: LeadTimeData[] = [];

      // Process each completed task
      tasks.filter(task => task.status.toLowerCase() === 'done').forEach(task => {
        const taskHistory = historyData?.filter(h => h.task_id === task.id) || [];
        if (taskHistory.length > 0) {
          // Find first working and done states
          const firstWorking = taskHistory.find(h => h.status.toLowerCase() === 'working');
          const lastDone = [...taskHistory]
            .reverse()
            .find(h => h.status.toLowerCase() === 'done');

          // Calculate cycle time (working to done)
          if (firstWorking && lastDone) {
            const workingDate = new Date(firstWorking.changed_at);
            const doneDate = new Date(lastDone.changed_at);
            if (isAfter(doneDate, workingDate)) {
              const cycleTime = differenceInDays(doneDate, workingDate);
              cycleTimeResults.push({
                taskId: task.id,
                taskName: task.name,
                cycleTime,
              });
            }
          }

          // Calculate lead time (created to done)
          if (lastDone) {
            const createdDate = new Date(task.created_at);
            const doneDate = new Date(lastDone.changed_at);
            const leadTime = differenceInDays(doneDate, createdDate);
            leadTimeResults.push({
              taskId: task.id,
              taskName: task.name,
              leadTime,
            });
          }
        }
      });

      setCycleTimeData(cycleTimeResults);
      setLeadTimeData(leadTimeResults);
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  }

  // Derived metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status.toLowerCase() === 'done').length;
  const openTasks = totalTasks - completedTasks;
  
  // Cycle time & lead time averages
  const avgCycleTime = cycleTimeData.length 
    ? Math.round(cycleTimeData.reduce((sum, item) => sum + item.cycleTime, 0) / cycleTimeData.length) 
    : 0;
  
  const avgLeadTime = leadTimeData.length 
    ? Math.round(leadTimeData.reduce((sum, item) => sum + item.leadTime, 0) / leadTimeData.length) 
    : 0;

  // Distribution data for charts
  const cycleTimeDistribution = useMemo(() => {
    const distribution: Record<number, number> = {};
    cycleTimeData.forEach(item => {
      const days = item.cycleTime;
      distribution[days] = (distribution[days] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([days, count]) => ({ days: Number(days), count }))
      .sort((a, b) => a.days - b.days);
  }, [cycleTimeData]);

  const leadTimeDistribution = useMemo(() => {
    const distribution: Record<number, number> = {};
    leadTimeData.forEach(item => {
      const days = item.leadTime;
      distribution[days] = (distribution[days] || 0) + 1;
    });
    return Object.entries(distribution)
      .map(([days, count]) => ({ days: Number(days), count }))
      .sort((a, b) => a.days - b.days);
  }, [leadTimeData]);

  return (
    <div className="p-8">
      <Heading>{project?.name || 'Project Dashboard'}</Heading>
      <p className="text-lg text-muted-foreground mb-6">
        {project?.description || 'Project-specific metrics and analytics'}
      </p>

      {/* Time range selector */}
      <div className="flex justify-end mb-6">
        <ToggleGroup
          type="single"
          value={timeRange}
          onValueChange={(value) => value && setTimeRange(value as '90d' | '30d' | '7d')}
        >
          <ToggleGroupItem value="7d">7d</ToggleGroupItem>
          <ToggleGroupItem value="30d">30d</ToggleGroupItem>
          <ToggleGroupItem value="90d">90d</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>Open and completed tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{openTasks}</span>
              <Badge variant="outline" className="ml-2">Open</Badge>
              <span className="text-lg ml-auto text-muted-foreground">{completedTasks} completed</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cycle Time</CardTitle>
            <CardDescription>Working to Done (avg)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{avgCycleTime || '—'}</span>
              {avgCycleTime > 0 && <Badge variant="outline" className="ml-2">Days</Badge>}
              <span className="text-lg ml-auto text-muted-foreground">{cycleTimeData.length} tasks</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Lead Time</CardTitle>
            <CardDescription>Created to Done (avg)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{avgLeadTime || '—'}</span>
              {avgLeadTime > 0 && <Badge variant="outline" className="ml-2">Days</Badge>}
              <span className="text-lg ml-auto text-muted-foreground">{leadTimeData.length} tasks</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Burn-down chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Burn-down Chart</CardTitle>
            <CardDescription>Open tasks over time</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loadingCharts ? (
              <div className="w-full h-full flex items-center justify-center">Loading chart data...</div>
            ) : taskActivity.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">No activity data available</div>
            ) : (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={taskActivity}>
                    <defs>
                      <linearGradient id="openTasksGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      scale="band"
                      tickFormatter={(date) => format(parseISO(date), 'MMM dd')}
                    />
                    <YAxis />
                    <ChartTooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent>
                              <p>{format(parseISO(label), 'MMMM dd, yyyy')}</p>
                              <p>Open: {payload[0].value}</p>
                              <p>Created: {payload.find(p => p.dataKey === 'created')?.value || 0}</p>
                              <p>Closed: {payload.find(p => p.dataKey === 'closed')?.value || 0}</p>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="open" 
                      stroke="#8884d8" 
                      fillOpacity={1} 
                      fill="url(#openTasksGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Cycle Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cycle Time Distribution</CardTitle>
            <CardDescription>Number of tasks by cycle time (days)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loadingCharts ? (
              <div className="w-full h-full flex items-center justify-center">Loading chart data...</div>
            ) : cycleTimeDistribution.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">No cycle time data available</div>
            ) : (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cycleTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
                    <XAxis 
                      dataKey="days" 
                      label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Lead Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Time Distribution</CardTitle>
            <CardDescription>Number of tasks by lead time (days)</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {loadingCharts ? (
              <div className="w-full h-full flex items-center justify-center">Loading chart data...</div>
            ) : leadTimeDistribution.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center">No lead time data available</div>
            ) : (
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={leadTimeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#888" opacity={0.2} />
                    <XAxis 
                      dataKey="days" 
                      label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Progress indication */}
      {totalEstimatedEffort > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progress by Effort</CardTitle>
            <CardDescription>Based on estimated effort</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-2">
              <div 
                className="bg-primary h-6 rounded-full" 
                style={{ width: `${Math.min(100, (completedEffort / totalEstimatedEffort) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span>{Math.round((completedEffort / totalEstimatedEffort) * 100)}% complete</span>
              <span>{completedEffort} / {totalEstimatedEffort} units</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 