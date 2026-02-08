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

export default function ResidentDashboard() {
  const { profile } = useAuth();
  const [myRequests, setMyRequests] = useState<RescueRequest[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Real-time subscription
    const channel = supabase
      .channel('resident_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weather_alerts' }, fetchData)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    try {
      // Fetch user's rescue requests
      const { data: requests } = await supabase
        .from('rescue_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (requests) {
        setMyRequests(requests as RescueRequest[]);
      }

      // Fetch active alerts
      const { data: alerts } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (alerts) {
        setActiveAlerts(alerts as WeatherAlert[]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const activeRequest = myRequests.find(r => ['pending', 'assigned', 'in_progress'].includes(r.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Resident'}!
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Stay safe and stay informed with real-time updates
          </p>
        </div>
        <Link to="/resident/emergency">
          <Button size="lg" className="btn-emergency w-full sm:w-auto animate-none hover:animate-none">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Emergency SOS
          </Button>
        </Link>
      </div>

      {/* Active Request Alert */}
      {activeRequest && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold">Active Rescue Request</p>
                  <p className="text-sm text-muted-foreground">
                    Status: <Badge className={getStatusColor(activeRequest.status)}>{activeRequest.status}</Badge>
                  </p>
                </div>
              </div>
              <Link to="/resident/requests">
                <Button variant="outline" size="sm">
                  Track Request
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Widget */}
      <WeatherWidget variant="detailed" />

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: MapPin, label: 'View Flood Map', href: '/resident/map', color: 'from-info to-primary' },
          { icon: Bell, label: 'View Alerts', href: '/resident/alerts', color: 'from-warning to-orange-500', badge: activeAlerts.length },
          { icon: ClipboardList, label: 'My Requests', href: '/resident/requests', color: 'from-accent to-success' },
          { icon: Users, label: 'Family Status', href: '/resident/family', color: 'from-primary to-info' },
        ].map((action, i) => (
          <Link key={i} to={action.href}>
            <Card className="dashboard-card h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform relative`}>
                  <action.icon className="w-6 h-6 text-white" />
                  {action.badge && action.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-bold rounded-full flex items-center justify-center">
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-display">Recent Requests</CardTitle>
          <Link to="/resident/requests">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {myRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rescue requests yet</p>
              <p className="text-sm">Use the Emergency SOS button when you need help</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myRequests.slice(0, 3).map((request) => (
                <div 
                  key={request.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      request.status === 'completed' ? 'bg-success/20' : 'bg-warning/20'
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
                  <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
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
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm font-medium">{contact.name}</span>
                <a 
                  href={`tel:${contact.number.replace(/[^0-9]/g, '')}`}
                  className="text-sm text-primary font-semibold hover:underline"
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
