import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import WeatherWidget from '@/components/weather/WeatherWidget';
import {
  AlertTriangle,
  MapPin,
  Phone,
  Users,
  ClipboardList,
  Bell,
  CheckCircle,
  Clock,
  Shield,
  ArrowRight
} from 'lucide-react';
import type { RescueRequest, WeatherAlert } from '@/types/database';

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function ResidentDashboard() {
  const { profile } = useAuth();
  const [myRequests, setMyRequests] = useState<RescueRequest[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('resident_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weather_alerts' }, fetchData)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    try {
      const { data: requests } = await supabase
        .from('rescue_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (requests) setMyRequests(requests as RescueRequest[]);

      const { data: alerts } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (alerts) setActiveAlerts(alerts as WeatherAlert[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/15 text-warning border border-warning/25';
      case 'assigned': return 'bg-info/15 text-info border border-info/25';
      case 'in_progress': return 'bg-primary/15 text-primary border border-primary/25';
      case 'completed': return 'bg-success/15 text-success border border-success/25';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const activeRequest = myRequests.find(r => ['pending', 'assigned', 'in_progress'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, <span className="text-gradient-primary">{profile?.full_name?.split(' ')[0] || 'Resident'}</span>!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base mt-1">
            Stay safe and stay informed with real-time updates
          </p>
        </div>
        <Link to="/resident/emergency">
          <Button size="lg" className="btn-emergency w-full sm:w-auto">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Emergency SOS
          </Button>
        </Link>
      </div>

      {/* Active Request Alert */}
      {activeRequest && (
        <Card className="border-warning/40 bg-warning/5 backdrop-blur-sm animate-fade-up stagger-1" style={{ boxShadow: 'var(--glow-warning)' }}>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold font-display">Active Rescue Request</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge className={getStatusColor(activeRequest.status)}>{formatStatus(activeRequest.status)}</Badge>
                  </p>
                </div>
              </div>
              <Link to="/resident/requests">
                <Button variant="outline" size="sm" className="rounded-xl border-warning/30 hover:bg-warning/10">
                  Track Request
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Widget */}
      <div className="animate-fade-up stagger-2">
        <WeatherWidget variant="detailed" />
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-up stagger-3">
        {[
          { icon: MapPin, label: 'View Flood Map', href: '/resident/map', gradient: 'from-info to-primary' },
          { icon: Bell, label: 'View Alerts', href: '/resident/alerts', gradient: 'from-warning to-orange-500', badge: activeAlerts.length },
          { icon: ClipboardList, label: 'My Requests', href: '/resident/requests', gradient: 'from-accent to-success' },
          { icon: Users, label: 'Family Status', href: '/resident/family', gradient: 'from-primary to-info' },
        ].map((action, i) => (
          <Link key={i} to={action.href}>
            <Card className="dashboard-card h-full cursor-pointer group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 relative`}>
                  <action.icon className="w-6 h-6 text-white" />
                  {action.badge && action.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-white text-[0.6rem] font-bold rounded-full flex items-center justify-center ring-2 ring-card">
                      {action.badge}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Requests */}
      <Card className="dashboard-card animate-fade-up stagger-4">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-display">Recent Requests</CardTitle>
          <Link to="/resident/requests">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No rescue requests yet</p>
              <p className="text-sm mt-1">Use the Emergency SOS button when you need help</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.slice(0, 3).map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors duration-200 border border-transparent hover:border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      request.status === 'completed' ? 'bg-success/15' : 'bg-warning/15'
                    }`}>
                      {request.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Clock className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm capitalize">{request.severity} Priority</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(request.status)}>{formatStatus(request.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card className="dashboard-card animate-fade-up stagger-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Emergency Hotlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { name: 'MDRRMO Catmon', number: '(043) 123-4567' },
              { name: 'Municipal Disaster Office', number: '(043) 987-6543' },
              { name: 'Philippine Red Cross', number: '143' },
              { name: 'National Emergency', number: '911' },
            ].map((contact, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-transparent hover:border-primary/10 transition-colors duration-200">
                <span className="text-sm font-medium">{contact.name}</span>
                <a 
                  href={`tel:${contact.number.replace(/[^0-9]/g, '')}`}
                  className="text-sm text-primary font-bold hover:underline"
                >
                  {contact.number}
                </a>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
