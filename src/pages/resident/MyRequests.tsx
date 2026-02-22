import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Clock, CheckCircle, MapPin, Users, AlertTriangle, Phone, Navigation
} from 'lucide-react';
import type { RescueRequest } from '@/types/database';

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

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
      .from('rescue_requests').select('*').eq('requester_id', user.id).order('created_at', { ascending: false });
    if (data) setRequests(data as RescueRequest[]);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning/15 text-warning border border-warning/20';
      case 'assigned': return 'bg-info/15 text-info border border-info/20';
      case 'in_progress': return 'bg-primary/15 text-primary border border-primary/20';
      case 'completed': return 'bg-success/15 text-success border border-success/20';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive/15 text-destructive border border-destructive/20';
      case 'high': return 'bg-warning/15 text-warning border border-warning/20';
      default: return 'bg-info/15 text-info border border-info/20';
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
      <div className="flex items-center gap-fluid-md animate-fade-up">
        <Link to="/resident">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
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
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up stagger-1">
          <CardContent>
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Requests Yet</h3>
            <p className="text-fluid-sm text-muted-foreground mb-4">
              Use the Emergency SOS button when you need rescue assistance
            </p>
            <Link to="/resident/emergency">
              <Button className="btn-emergency rounded-2xl">Request Help Now</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request, idx) => (
            <Card key={request.id} className="overflow-hidden dashboard-card animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              {/* Status top bar */}
              <div className={`h-1 ${
                request.status === 'completed' ? 'bg-success' :
                request.status === 'in_progress' ? 'bg-primary' :
                request.status === 'assigned' ? 'bg-info' : 'bg-warning'
              }`} />
              <CardContent className="p-fluid-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-md">
                  <div className="flex items-start gap-fluid-md">
                    <div className="w-10 h-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                      {getStatusIcon(request.status)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={getSeverityColor(request.severity)}>
                          {request.severity}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block ${
                            request.status === 'in_progress' ? 'bg-primary animate-pulse' :
                            request.status === 'completed' ? 'bg-success' : 'bg-warning'
                          }`} />
                          {formatStatus(request.status)}
                        </Badge>
                      </div>
                      <p className="text-fluid-sm font-medium flex items-center gap-1">
                        <Users className="w-4 h-4 shrink-0 text-muted-foreground" />
                        {request.household_count} people
                      </p>
                      {request.location_address && (
                        <p className="text-fluid-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3 shrink-0" />{request.location_address}
                        </p>
                      )}
                      {request.special_needs && request.special_needs.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {request.special_needs.map((need, i) => (
                            <Badge key={i} variant="outline" className="text-fluid-xs rounded-lg">{need}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-fluid-xs text-muted-foreground">{new Date(request.created_at).toLocaleDateString()}</p>
                    <p className="text-fluid-xs text-muted-foreground">{new Date(request.created_at).toLocaleTimeString()}</p>
                    {request.status === 'in_progress' && (
                      <div className="mt-2">
                        <a href="tel:0431234567">
                          <Button size="sm" variant="outline" className="gap-1 rounded-xl">
                            <Phone className="w-3 h-3" />Call Rescuer
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
