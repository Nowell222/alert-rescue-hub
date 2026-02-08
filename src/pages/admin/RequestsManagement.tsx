import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  LifeBuoy,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescueRequest } from '@/types/database';

export default function RequestsManagementPage() {
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchRequests)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('rescue_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setRequests(data as RescueRequest[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === 'completed') update.completed_at = new Date().toISOString();
    if (status === 'cancelled') update.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('rescue_requests')
      .update(update)
      .eq('id', id);

    if (!error) {
      toast.success(`Status updated to ${status}`);
      fetchRequests();
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

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
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-primary" />
              Rescue Requests
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Manage all rescue operations</p>
          </div>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ({requests.length})</SelectItem>
            <SelectItem value="pending">Pending ({statusCounts.pending})</SelectItem>
            <SelectItem value="assigned">Assigned ({statusCounts.assigned})</SelectItem>
            <SelectItem value="in_progress">In Progress ({statusCounts.in_progress})</SelectItem>
            <SelectItem value="completed">Completed ({statusCounts.completed})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-fluid-sm">
        {[
          { label: 'Pending', count: statusCounts.pending, color: 'text-warning' },
          { label: 'Assigned', count: statusCounts.assigned, color: 'text-info' },
          { label: 'In Progress', count: statusCounts.in_progress, color: 'text-primary' },
          { label: 'Completed', count: statusCounts.completed, color: 'text-success' },
        ].map((stat) => (
          <Card key={stat.label} className="stat-card text-center">
            <CardContent className="p-fluid-sm">
              <p className={`text-fluid-xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-fluid-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-28" />
            </Card>
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckCircle className="icon-box-lg mx-auto mb-4 text-success opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Requests</h3>
            <p className="text-fluid-sm text-muted-foreground">
              {filter === 'all' ? 'No rescue requests yet' : `No ${filter} requests`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-fluid-md">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-fluid-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge className={getSeverityColor(request.severity)}>
                        {request.severity}
                      </Badge>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-fluid-sm flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {request.household_count} people
                      </span>
                      <span className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleString()}
                      </span>
                    </div>
                    {request.location_address && (
                      <p className="text-fluid-sm flex items-center gap-1 mb-1">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        {request.location_address}
                      </p>
                    )}
                    {request.special_needs && request.special_needs.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {request.special_needs.map((need, i) => (
                          <Badge key={i} variant="outline" className="text-fluid-xs">
                            {need}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {request.status === 'pending' && (
                      <Button size="sm" onClick={() => updateStatus(request.id, 'assigned')}>
                        Assign
                      </Button>
                    )}
                    {request.status === 'assigned' && (
                      <Button size="sm" onClick={() => updateStatus(request.id, 'in_progress')}>
                        Start
                      </Button>
                    )}
                    {request.status === 'in_progress' && (
                      <Button size="sm" onClick={() => updateStatus(request.id, 'completed')}>
                        Complete
                      </Button>
                    )}
                    {['pending', 'assigned'].includes(request.status) && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'cancelled')}>
                        Cancel
                      </Button>
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
