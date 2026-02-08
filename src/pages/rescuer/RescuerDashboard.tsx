import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import WeatherWidget from '@/components/weather/WeatherWidget';
import {
  LifeBuoy,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Radio,
  Package,
  Trophy,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import type { RescueRequest } from '@/types/database';
import { Link } from 'react-router-dom';

export default function RescuerDashboard() {
  const { profile, user } = useAuth();
  const [status, setStatus] = useState<'available' | 'on_break' | 'off_duty'>('available');
  const [pendingRequests, setPendingRequests] = useState<RescueRequest[]>([]);
  const [myMissions, setMyMissions] = useState<RescueRequest[]>([]);
  const [stats, setStats] = useState({ completed: 0, peopleRescued: 0, avgTime: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription for rescue requests
    const channel = supabase
      .channel('rescuer_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchData)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch pending requests
      const { data: pending } = await supabase
        .from('rescue_requests')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false })
        .limit(10);

      if (pending) {
        setPendingRequests(pending as RescueRequest[]);
      }

      // Fetch my assigned missions
      if (user) {
        const { data: missions } = await supabase
          .from('rescue_requests')
          .select('*')
          .eq('assigned_rescuer_id', user.id)
          .in('status', ['assigned', 'in_progress'])
          .order('created_at', { ascending: false });

        if (missions) {
          setMyMissions(missions as RescueRequest[]);
        }

        // Calculate stats
        const { data: completed } = await supabase
          .from('rescue_requests')
          .select('*')
          .eq('assigned_rescuer_id', user.id)
          .eq('status', 'completed');

        if (completed) {
          const totalPeople = completed.reduce((sum, r) => sum + (r.household_count || 1), 0);
          setStats({
            completed: completed.length,
            peopleRescued: totalPeople,
            avgTime: 25 // placeholder
          });
        }
      }
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

  const acceptMission = async (requestId: string) => {
    if (!user) return;

    await supabase
      .from('rescue_requests')
      .update({ 
        assigned_rescuer_id: user.id, 
        status: 'assigned' 
      })
      .eq('id', requestId);

    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Header with Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Rescuer Dashboard
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {myMissions.length > 0 
              ? `You have ${myMissions.length} active mission(s)` 
              : 'Ready for rescue operations'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
          <span className="text-sm font-medium">Status:</span>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${status === 'available' ? 'bg-success animate-pulse' : 'bg-muted'}`} />
            <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
          </div>
          <Switch 
            checked={status === 'available'}
            onCheckedChange={(checked) => setStatus(checked ? 'available' : 'off_duty')}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Trophy, label: 'Completed Missions', value: stats.completed, color: 'from-success to-accent' },
          { icon: Users, label: 'People Rescued', value: stats.peopleRescued, color: 'from-primary to-info' },
          { icon: Clock, label: 'Avg. Response', value: `${stats.avgTime}m`, color: 'from-warning to-orange-500' },
          { icon: LifeBuoy, label: 'Active Missions', value: myMissions.length, color: 'from-destructive to-warning' },
        ].map((stat, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weather Alert */}
      <WeatherWidget variant="compact" />

      {/* Active Missions */}
      {myMissions.length > 0 && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Radio className="w-5 h-5 text-primary animate-pulse" />
              Active Missions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myMissions.map((mission) => (
                <div 
                  key={mission.id}
                  className="p-4 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getSeverityColor(mission.severity)}>
                            {mission.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {mission.household_count} people
                          </span>
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {mission.location_address || 'Location pending...'}
                        </p>
                        {mission.special_needs && mission.special_needs.length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {mission.special_needs.map((need, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {need}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/rescuer/map">
                        <Button size="sm" className="gap-2">
                          <Navigation className="w-4 h-4" />
                          Navigate
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Requests Queue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Incoming Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
          <Link to="/rescuer/missions">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-success opacity-50" />
              <p>No pending requests</p>
              <p className="text-sm">All clear! Stay alert for incoming requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.slice(0, 5).map((request) => (
                <div 
                  key={request.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(request.severity)}>
                      {request.severity}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {request.household_count} people • {request.location_address || 'Location pending'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => acceptMission(request.id)}
                    disabled={status !== 'available'}
                  >
                    Accept Mission
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Equipment', href: '/rescuer/equipment', color: 'from-accent to-success' },
          { icon: MapPin, label: 'Navigation', href: '/rescuer/map', color: 'from-info to-primary' },
          { icon: TrendingUp, label: 'History', href: '/rescuer/history', color: 'from-warning to-orange-500' },
          { icon: AlertTriangle, label: 'Report Issue', href: '/rescuer/report', color: 'from-destructive to-warning' },
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
