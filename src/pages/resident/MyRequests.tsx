import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  MapPin,
  Users,
  AlertTriangle,
  Phone,
  Navigation
} from 'lucide-react';
import type { RescueRequest } from '@/types/database';

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('my_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchRequests)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('rescue_requests')
      .select('*')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setRequests(data as RescueRequest[]);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'assigned': return 'bg-info text-info-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'in_progress': return <Navigation className="w-5 h-5 text-primary animate-pulse" />;
      default: return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-fluid-md">
        <Link to="/resident">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-fluid-2xl font-bold">My Rescue Requests</h1>
          <p className="text-muted-foreground text-fluid-sm">Track all your submitted requests</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <AlertTriangle className="icon-box-lg mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Requests Yet</h3>
            <p className="text-fluid-sm text-muted-foreground mb-4">
              Use the Emergency SOS button when you need rescue assistance
            </p>
            <Link to="/resident/emergency">
              <Button className="btn-emergency">Request Help Now</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-fluid-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-md">
                  <div className="flex items-start gap-fluid-md">
                    <div className="icon-box-md rounded-full bg-muted flex items-center justify-center shrink-0">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={getSeverityColor(request.severity)}>
                          {request.severity}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-fluid-sm font-medium flex items-center gap-1">
                        <Users className="w-4 h-4 shrink-0" />
                        {request.household_count} people
                      </p>
                      {request.location_address && (
                        <p className="text-fluid-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {request.location_address}
                        </p>
                      )}
                      {request.special_needs && request.special_needs.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {request.special_needs.map((need, i) => (
                            <Badge key={i} variant="outline" className="text-fluid-xs">
                              {need}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-fluid-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-fluid-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleTimeString()}
                    </p>
                    {request.status === 'in_progress' && (
                      <div className="mt-2">
                        <a href="tel:0431234567">
                          <Button size="sm" variant="outline" className="gap-1">
                            <Phone className="w-3 h-3" />
                            Call Rescuer
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
