import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Radio,
  MapPin,
  Users,
  Clock,
  Navigation,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescueRequest } from '@/types/database';

export default function MissionsPage() {
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<RescueRequest[]>([]);
  const [myMissions, setMyMissions] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('missions_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  const fetchData = async () => {
    const [pendingRes, myRes] = await Promise.all([
      supabase
        .from('rescue_requests')
        .select('*')
        .eq('status', 'pending')
        .order('priority_score', { ascending: false }),
      user ? supabase
        .from('rescue_requests')
        .select('*')
        .eq('assigned_rescuer_id', user.id)
        .in('status', ['assigned', 'in_progress'])
        .order('created_at', { ascending: false })
        : Promise.resolve({ data: [] })
    ]);

    if (pendingRes.data) setPendingRequests(pendingRes.data as RescueRequest[]);
    if (myRes.data) setMyMissions(myRes.data as RescueRequest[]);
    setLoading(false);
  };

  const acceptMission = async (requestId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('rescue_requests')
      .update({ assigned_rescuer_id: user.id, status: 'assigned' })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to accept mission');
    } else {
      toast.success('Mission accepted!');
      fetchData();
    }
  };

  const updateMissionStatus = async (requestId: string, status: string) => {
    const update: any = { status };
    if (status === 'completed') update.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('rescue_requests')
      .update(update)
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Status updated to ${status}`);
      fetchData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  const getTimeSince = (date: string) => {
    const minutes = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-fluid-md">
        <Link to="/rescuer">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
            <Radio className="w-6 h-6 text-primary" />
            Mission Queue
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Manage rescue operations</p>
        </div>
      </div>

      {/* Active Missions */}
      {myMissions.length > 0 && (
        <Card className="border-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-fluid-lg font-display flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary animate-pulse" />
              Your Active Missions ({myMissions.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myMissions.map((mission) => (
              <div key={mission.id} className="p-fluid-md rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex flex-col gap-fluid-md">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={getSeverityColor(mission.severity)}>
                        {mission.severity.toUpperCase()}
                      </Badge>
                      <span className="text-fluid-sm">
                        <Users className="w-4 h-4 inline mr-1" />
                        {mission.household_count} people
                      </span>
                    </div>
                    <span className="text-fluid-xs text-muted-foreground">
                      {getTimeSince(mission.created_at)}
                    </span>
                  </div>
                  
                  {mission.location_address && (
                    <p className="text-fluid-sm flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                      {mission.location_address}
                    </p>
                  )}

                  {mission.special_needs && mission.special_needs.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {mission.special_needs.map((need, i) => (
                        <Badge key={i} variant="outline" className="text-fluid-xs">
                          {need}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {mission.status === 'assigned' && (
                      <Button size="sm" onClick={() => updateMissionStatus(mission.id, 'in_progress')}>
                        <Navigation className="w-4 h-4 mr-1" />
                        Start Navigation
                      </Button>
                    )}
                    {mission.status === 'in_progress' && (
                      <Button size="sm" variant="default" onClick={() => updateMissionStatus(mission.id, 'completed')}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Complete Mission
                      </Button>
                    )}
                    <Link to="/rescuer/map">
                      <Button size="sm" variant="outline">
                        <MapPin className="w-4 h-4 mr-1" />
                        View Map
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Requests */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg font-display flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Pending Requests
            {pendingRequests.length > 0 && (
              <Badge variant="destructive">{pendingRequests.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="icon-box-lg mx-auto mb-3 text-success opacity-50" />
              <p className="text-fluid-base">No pending requests</p>
              <p className="text-fluid-sm">All clear! Stay alert.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-fluid-md rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-md">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getSeverityColor(request.severity)}>
                          {request.severity}
                        </Badge>
                        <span className="text-fluid-sm font-medium">
                          {request.household_count} people
                        </span>
                        <span className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeSince(request.created_at)}
                        </span>
                      </div>
                      {request.location_address && (
                        <p className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.location_address}
                        </p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => acceptMission(request.id)} className="shrink-0">
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
