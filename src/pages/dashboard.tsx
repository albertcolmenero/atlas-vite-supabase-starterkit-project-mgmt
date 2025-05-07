import { Heading } from '../components/ui/heading'
import { useUser } from '@clerk/clerk-react'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsMobile } from '@/hooks/use-mobile'
import { Project } from './projects/columns'
import { Task } from './tasks/columns'

// Define a type for our chart data
interface TaskActivityChartData {
  date: string;
  created: number;
  closed: number;
  open?: number; // For the snapshot chart later
}

export default function DashboardPage() {
  const { user } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskActivity, setTaskActivity] = useState<TaskActivityChartData[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingTaskActivity, setLoadingTaskActivity] = useState(true)
  const [timeRange, setTimeRange] = useState<'90d' | '30d' | '7d'>('30d')
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) setTimeRange('7d')
  }, [isMobile])

  useEffect(() => {
    if (!user) return
    fetchProjects()
    fetchAllTasks()
    fetchTaskActivityData()
    // eslint-disable-next-line
  }, [user, timeRange])

  async function fetchProjects() {
    if (!user) return;
    
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id);
      
    if (!error && data) setProjects(data);
    setLoadingProjects(false);
  }

  async function fetchAllTasks() {
    if (!user) return;
    
    // Get user's projects directly instead of using project_members table
    const { data: userProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id);
    
    if (projectsError) {
      console.error("Error fetching user projects:", projectsError);
      setTasks([]);
      return;
    }
    
    if (!userProjects || userProjects.length === 0) {
      setTasks([]);
      return;
    }
    
    // Extract project IDs
    const projectIds = userProjects.map(p => p.id);
    
    // Fetch tasks for these projects
    const { data, error } = await supabase
      .from('tasks')
      .select('id, created_at, status, project_id')
      .in('project_id', projectIds);
    
    if (error) {
      console.error("Error fetching all tasks:", error);
      setTasks([]);
      return;
    }
    
    if (data) {
      setTasks(data as Task[]);
    }
  }

  async function fetchTaskActivityData() {
    if (!user || tasks.length === 0) {
      if (tasks.length === 0 && user) {
        // No tasks to analyze yet
        setTaskActivity([]);
        setLoadingTaskActivity(false);
        return;
      }
      if (!user) return;
    }
    
    setLoadingTaskActivity(true);

    // Get user's projects directly instead of using project_members table
    const { data: userProjects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id);
    
    if (projectsError) {
      console.error("Error fetching user projects:", projectsError);
      setTaskActivity([]);
      setLoadingTaskActivity(false);
      return;
    }
    
    if (!userProjects || userProjects.length === 0) {
      setTaskActivity([]);
      setLoadingTaskActivity(false);
      return;
    }
    
    // Extract project IDs
    const projectIds = userProjects.map(p => p.id);

    const { data: historyData, error: historyError } = await supabase
      .from('task_status_history')
      .select('task_id, status, changed_at, project_id')
      .in('project_id', projectIds)
      .order('changed_at', { ascending: true });

    if (historyError) {
      console.error("Error fetching task history:", historyError);
      setTaskActivity([]);
      setLoadingTaskActivity(false);
      return;
    }

    if (!historyData) {
      setTaskActivity([]);
      setLoadingTaskActivity(false);
      return;
    }

    // Determine date range based on timeRange state
    const endDate = new Date();
    const startDate = new Date();
    let daysToDisplay = 30;
    if (timeRange === '90d') daysToDisplay = 90;
    else if (timeRange === '7d') daysToDisplay = 7;
    startDate.setDate(endDate.getDate() - daysToDisplay + 1);

    const activityByDate: Record<string, { created: number; closed: number, openTasks?: Set<string> }> = {};

    // Initialize date range in activityByDate
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().slice(0, 10);
      activityByDate[dateKey] = { created: 0, closed: 0, openTasks: new Set() };
    }
    
    const createdTasksToday: Record<string, Set<string>> = {}; 
    const closedTasksToday: Record<string, Set<string>> = {};

    // --- Open Tasks Calculation --- 
    // Iterate through each day in the generated date range
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const currentDateKey = d.toISOString().slice(0, 10);
      let openOnThisDayCount = 0;

      tasks.forEach(task => {
        const taskCreationDate = new Date(task.created_at);
        // Check if task was created on or before the current day in the series
        if (taskCreationDate <= d) {
          let lastKnownStatus = task.status; // Default to its current status or initial status if no history
          let lastStatusDate = taskCreationDate;

          // Find the last status from history for this task on or before currentDateKey
          const relevantHistory = historyData
            .filter(h => h.task_id === task.id && new Date(h.changed_at) <= d)
            .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());

          if (relevantHistory.length > 0) {
            lastKnownStatus = relevantHistory[0].status;
            lastStatusDate = new Date(relevantHistory[0].changed_at)
          }
          
          // If task created today, its initial status already considers it if not done.
          // If its last known status (even if on a previous day) was not 'done', it's open.
          if (lastKnownStatus.toLowerCase() !== 'done') {
            openOnThisDayCount++;
          }
        }
      });
      if (activityByDate[currentDateKey]) {
        activityByDate[currentDateKey].openTasks = new Set(); // Placeholder, actual count is directly assigned
        // Assign the calculated open count to the date key
        (activityByDate[currentDateKey] as any).open = openOnThisDayCount; 
      }
    }
    // --- End Open Tasks Calculation ---

    historyData.forEach(item => {
      const itemDate = new Date(item.changed_at);
      const dateKey = itemDate.toISOString().slice(0, 10);

      if (activityByDate[dateKey]) { // Only process items within our desired date range
        if (!createdTasksToday[dateKey]) createdTasksToday[dateKey] = new Set();
        if (!closedTasksToday[dateKey]) closedTasksToday[dateKey] = new Set();

        // Count as created if it's the first 'to do' status for this task on this day
        // This simplistic approach assumes 'to do' is the very first status.
        // A more robust way is to check if this is the *earliest* entry for this task_id.
        if (item.status.toLowerCase() === 'to do' && !createdTasksToday[dateKey].has(item.task_id)) {
          activityByDate[dateKey].created += 1;
          createdTasksToday[dateKey].add(item.task_id);
        }
        // Count as closed if it's the first 'done' status for this task on this day
        if (item.status.toLowerCase() === 'done' && !closedTasksToday[dateKey].has(item.task_id)) {
          activityByDate[dateKey].closed += 1;
          closedTasksToday[dateKey].add(item.task_id);
        }
      }
    });

    const formattedChartData: TaskActivityChartData[] = Object.entries(activityByDate)
      .map(([date, counts]) => ({ 
        date, 
        created: counts.created, 
        closed: counts.closed, 
        open: (counts as any).open ?? 0,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    setTaskActivity(formattedChartData);
    setLoadingTaskActivity(false);
  }

  // Calculate stats
  const totalProjects = projects.length
  const now = new Date()
  const projectsLast30Days = projects.filter(p => {
    const created = new Date(p.created_at)
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) <= 30
  }).length

  // Chart data: group by day for the selected range
  const projectChartData = useMemo(() => {
    // Determine range
    let days = 90
    if (timeRange === '30d') days = 30
    if (timeRange === '7d') days = 7
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days + 1)
    // Build a map of date => count
    const dateMap: Record<string, number> = {}
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10)
      dateMap[key] = 0
    }
    projects.forEach(p => {
      const date = p.created_at.slice(0, 10)
      if (dateMap[date] !== undefined) dateMap[date]++
    })
    // Format for recharts
    return Object.entries(dateMap).map(([date, count]) => ({ date, count }))
  }, [projects, timeRange])

  return (
    <div className="p-8">
      <Heading>Welcome, {user?.firstName || 'User'}!</Heading>
      <p className="text-lg text-muted-foreground mb-4">This is your dashboard. Quick stats and links will go here.</p>
      {/* First row: two widgets, each 25% width on desktop, full width on mobile */}
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/4">
          <CardHeader>
            <CardTitle>Total Projects</CardTitle>
            <CardDescription>All projects you have created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{loadingProjects ? '—' : totalProjects}</span>
              {!loadingProjects && <Badge variant="outline" className="ml-2">All Time</Badge>}
            </div>
          </CardContent>
        </Card>
        <Card className="w-full md:w-1/4">
          <CardHeader>
            <CardTitle>Projects (Last 30 Days)</CardTitle>
            <CardDescription>Recently created projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{loadingProjects ? '—' : projectsLast30Days}</span>
              {!loadingProjects && <Badge variant={projectsLast30Days > 0 ? 'default' : 'outline'} className="ml-2">30 Days</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Second row: two charts, each 50% width on desktop, full width on mobile */}
      <div className="mt-6 flex flex-col md:flex-row gap-6">
        <Card className="w-full md:w-1/2">
          <CardHeader className="relative flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Projects Created</CardTitle>
                <CardDescription>
                  <span className="hidden sm:inline">Progression over time</span>
                  <span className="sm:hidden">Project trend</span>
                </CardDescription>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <ToggleGroup
                  type="single"
                  value={timeRange}
                  onValueChange={v => v && setTimeRange(v as '90d' | '30d' | '7d')}
                  variant="outline"
                  className="hidden sm:flex"
                >
                  <ToggleGroupItem value="90d" className="h-8 px-2.5">Last 3 months</ToggleGroupItem>
                  <ToggleGroupItem value="30d" className="h-8 px-2.5">Last 30 days</ToggleGroupItem>
                  <ToggleGroupItem value="7d" className="h-8 px-2.5">Last 7 days</ToggleGroupItem>
                </ToggleGroup>
                <Select value={timeRange} onValueChange={v => setTimeRange(v as '90d' | '30d' | '7d')}>
                  <SelectTrigger className="sm:hidden flex w-32" aria-label="Select a value">
                    <SelectValue placeholder="Last 30 days" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="90d" className="rounded-lg">Last 3 months</SelectItem>
                    <SelectItem value="30d" className="rounded-lg">Last 30 days</SelectItem>
                    <SelectItem value="7d" className="rounded-lg">Last 7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 min-h-[260px] flex items-center justify-center">
            {projectChartData.some(d => d.count > 0) ? (
              <ChartContainer
                config={{ count: { label: 'Projects', color: 'hsl(var(--primary))' } }}
                className="aspect-auto h-[220px] w-full"
              >
                <AreaChart data={projectChartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillProjects" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={value => {
                      const date = new Date(value)
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={30}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent labelFormatter={value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} indicator="dot" />}
                  />
                  <Area
                    dataKey="count"
                    type="monotone"
                    fill="url(#fillProjects)"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground text-center w-full py-8">No projects created in this period.</div>
            )}
          </CardContent>
        </Card>

        <Card className="w-full md:w-1/2">
          <CardHeader className="relative flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Task Activity</CardTitle>
                <CardDescription>
                  Tasks created and closed over time.
                </CardDescription>
              </div>
              {/* Potentially reuse the same timeRange selector as projects or have a dedicated one */}
            </div>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 min-h-[260px] flex items-center justify-center">
            {loadingTaskActivity ? (
              <div>Loading task activity...</div>
            ) : taskActivity.some(d => d.created > 0 || d.closed > 0) ? (
              <ChartContainer
                config={{
                  created: { label: 'Created', color: 'hsl(var(--chart-1))' }, 
                  closed: { label: 'Closed', color: 'hsl(var(--chart-2))' },
                  open: { label: 'Open', color: 'hsl(var(--chart-3))' },
                }}
                className="aspect-auto h-[220px] w-full"
              >
                <AreaChart data={taskActivity} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillCreated" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-created)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-created)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillClosed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-closed)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-closed)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-open)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-open)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={24}
                    tickFormatter={value => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tickMargin={8} width={30} />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent labelFormatter={value => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} indicator="dot" />}
                  />
                  <Area
                    dataKey="created"
                    type="monotone"
                    fill="url(#fillCreated)"
                    stroke="var(--color-created)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    dataKey="closed"
                    type="monotone"
                    fill="url(#fillClosed)"
                    stroke="var(--color-closed)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area
                    dataKey="open"
                    type="monotone"
                    fill="url(#fillOpen)"
                    stroke="var(--color-open)"
                    strokeWidth={2}
                    dot={false}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground text-center w-full py-8">No task activity in this period.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 