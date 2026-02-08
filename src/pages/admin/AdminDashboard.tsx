import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import WeatherWidget from '@/components/weather/WeatherWidget';
import {
  LifeBuoy,
  Users,
  Building2,
  AlertTriangle,
  Bell,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  Radio
} from 'lucide-react';
import type { RescueRequest, EvacuationCenter } from '@/types/database';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [rescueRequests, setRescueRequests] = useState<RescueRequest[]>([]);
  const [evacuationCenters, setEvacuationCenters] = useState<EvacuationCenter[]>([]);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    activeRescuers: 0,
    totalEvacuees: 0,
    completedToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('admin_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evacuation_centers' }, fetchData)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all rescue requests
      const { data: requests } = await supabase
        .from('rescue_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requests) {
        setRescueRequests(requests as RescueRequest[]);
        
        const today = new Date().toISOString().split('T')[0];
        const pending = requests.filter(r => r.status === 'pending').length;
        const completedToday = requests.filter(r => 
          r.status === 'completed' && r.completed_at?.startsWith(today)
        ).length;

        setStats(prev => ({
          ...prev,
          pendingRequests: pending,
          completedToday
        }));
      }

      // Fetch evacuation centers
      const { data: centers } = await supabase
        .from('evacuation_centers')
        .select('*');

      if (centers) {
        setEvacuationCenters(centers as EvacuationCenter[]);
        const totalEvacuees = centers.reduce((sum, c) => sum + (c.current_occupancy || 0), 0);
        setStats(prev => ({ ...prev, totalEvacuees }));
      }

      // Fetch active rescuers count
      const { count: rescuerCount } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'rescuer');

      setStats(prev => ({ ...prev, activeRescuers: rescuerCount || 0 }));

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'assigned': return 'bg-info text-info-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const pendingRequests = rescueRequests.filter(r => r.status === 'pending');
  const activeRequests = rescueRequests.filter(r => ['assigned', 'in_progress'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            MDRRMO Operations Center
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Real-time disaster response monitoring and coordination
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/alerts">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Alert
            </Button>
          </Link>
        </div>
      </div>

      {/* Critical Alerts Banner */}
      {pendingRequests.some(r => r.severity === 'critical') && (
        <Card className="border-destructive bg-destructive/10 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Critical Rescue Requests Pending!</p>
                <p className="text-sm text-muted-foreground">
                  {pendingRequests.filter(r => r.severity === 'critical').length} critical requests need immediate attention
                </p>
              </div>
              <Link to="/admin/requests" className="ml-auto">
                <Button variant="destructive" size="sm">View Now</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: AlertTriangle, label: 'Pending Requests', value: stats.pendingRequests, color: 'from-destructive to-warning', urgent: stats.pendingRequests > 5 },
          { icon: Radio, label: 'Active Rescuers', value: stats.activeRescuers, color: 'from-success to-accent' },
          { icon: Users, label: 'Total Evacuees', value: stats.totalEvacuees, color: 'from-info to-primary' },
          { icon: CheckCircle, label: 'Completed Today', value: stats.completedToday, color: 'from-primary to-info' },
        ].map((stat, i) => (
          <Card key={i} className={`stat-card ${stat.urgent ? 'border-destructive' : ''}`}>
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className={`text-2xl font-bold font-display ${stat.urgent ? 'text-destructive' : ''}`}>
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weather & Alerts */}
      <WeatherWidget variant="detailed" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Rescue Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-primary" />
              Rescue Requests
              {pendingRequests.length > 0 && (
                <Badge variant="destructive">{pendingRequests.length} pending</Badge>
              )}
            </CardTitle>
            <Link to="/admin/requests">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {rescueRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
                <p>No active rescue requests</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {rescueRequests.slice(0, 6).map((request) => (
                  <div 
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={getSeverityColor(request.severity)}>
                        {request.severity}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">
                          {request.household_count} people
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(request.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evacuation Centers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Building2 className="w-5 h-5 text-accent" />
              Evacuation Centers
            </CardTitle>
            <Link to="/admin/centers">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {evacuationCenters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No evacuation centers configured</p>
                <Link to="/admin/centers">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="w-4 h-4 mr-1" /> Add Center
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {evacuationCenters.map((center) => {
                  const occupancyPercent = Math.round((center.current_occupancy / center.max_capacity) * 100);
                  const isNearCapacity = occupancyPercent >= 80;
                  
                  return (
                    <div 
                      key={center.id}
                      className="p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{center.name}</span>
                        <Badge variant={isNearCapacity ? 'destructive' : 'secondary'}>
                          {center.current_occupancy}/{center.max_capacity}
                        </Badge>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${isNearCapacity ? 'bg-destructive' : 'bg-success'}`}
                          style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Bell, label: 'Broadcast Alert', href: '/admin/alerts', color: 'from-destructive to-warning' },
          { icon: MapPin, label: 'Flood Map', href: '/admin/map', color: 'from-info to-primary' },
          { icon: Package, label: 'Inventory', href: '/admin/inventory', color: 'from-accent to-success' },
          { icon: TrendingUp, label: 'Analytics', href: '/admin/analytics', color: 'from-primary to-accent' },
        ].map((action, i) => (
          <Link key={i} to={action.href}>
            <Card className="dashboard-card h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
