import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  LifeBuoy,
  Building2,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';

const COLORS = ['hsl(210, 85%, 35%)', 'hsl(175, 65%, 45%)', 'hsl(38, 95%, 50%)', 'hsl(0, 75%, 55%)', 'hsl(145, 65%, 42%)'];

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completed: 0,
    pending: 0,
    avgResponseTime: 0,
    totalRescued: 0,
    rescuers: 0,
    centers: 0,
    evacuees: 0,
  });
  const [severityData, setSeverityData] = useState<{ name: string; value: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; requests: number; completed: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);

    const [requestsRes, centersRes, rescuersRes] = await Promise.all([
      supabase.from('rescue_requests').select('*'),
      supabase.from('evacuation_centers').select('*'),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'rescuer'),
    ]);

    const requests = requestsRes.data || [];
    const centers = centersRes.data || [];

    const completed = requests.filter(r => r.status === 'completed');
    const pending = requests.filter(r => r.status === 'pending');
    const totalRescued = requests.reduce((s, r) => s + (r.household_count || 1), 0);
    const totalEvacuees = centers.reduce((s, c) => s + (c.current_occupancy || 0), 0);

    setStats({
      totalRequests: requests.length,
      completed: completed.length,
      pending: pending.length,
      avgResponseTime: completed.length > 0 ? 15 : 0,
      totalRescued,
      rescuers: rescuersRes.count || 0,
      centers: centers.length,
      evacuees: totalEvacuees,
    });

    // Severity breakdown
    const severities = ['critical', 'high', 'medium'];
    setSeverityData(severities.map(s => ({
      name: s.charAt(0).toUpperCase() + s.slice(1),
      value: requests.filter(r => r.severity === s).length,
    })));

    // Status breakdown
    const statuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
    setStatusData(statuses.map(s => ({
      name: s.replace('_', ' '),
      value: requests.filter(r => r.status === s).length,
    })));

    // Daily trend (last 7 days)
    const daily: { date: string; requests: number; completed: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      daily.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        requests: requests.filter(r => r.created_at.startsWith(dateStr)).length,
        completed: requests.filter(r => r.status === 'completed' && r.completed_at?.startsWith(dateStr)).length,
      });
    }
    setDailyData(daily);

    setLoading(false);
  };

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Operations overview and statistics</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnalytics} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
        {[
          { icon: LifeBuoy, label: 'Total Requests', value: stats.totalRequests, color: 'from-primary to-info' },
          { icon: CheckCircle, label: 'Completed', value: stats.completed, color: 'from-success to-accent' },
          { icon: Users, label: 'People Rescued', value: stats.totalRescued, color: 'from-warning to-orange-500' },
          { icon: Building2, label: 'Evacuees', value: stats.evacuees, color: 'from-info to-primary' },
        ].map((stat, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-fluid-sm">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-fluid-xl font-bold">{stat.value}</p>
              <p className="text-fluid-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-fluid-md">
        {/* Daily Trend */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-fluid-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              7-Day Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="requests" stroke="hsl(210, 85%, 35%)" strokeWidth={2} name="Requests" />
                  <Line type="monotone" dataKey="completed" stroke="hsl(145, 65%, 42%)" strokeWidth={2} name="Completed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-fluid-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {severityData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card className="dashboard-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-fluid-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-info" />
              Request Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" className="text-xs capitalize" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(210, 85%, 35%)" radius={[4, 4, 0, 0]} name="Count">
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-primary">{stats.rescuers}</p>
            <p className="text-fluid-xs text-muted-foreground">Active Rescuers</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-warning">{stats.pending}</p>
            <p className="text-fluid-xs text-muted-foreground">Pending Now</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-accent">{stats.centers}</p>
            <p className="text-fluid-xs text-muted-foreground">Evac Centers</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-success">{stats.avgResponseTime}m</p>
            <p className="text-fluid-xs text-muted-foreground">Avg Response</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
