import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import InteractiveMap from '@/components/map/InteractiveMap';
import { useLocation as useGeoLocation } from '@/hooks/useLocation';
import {
  ArrowLeft,
  Radio,
  MapPin,
  Users,
  Clock,
  Phone,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Play,
  Loader2,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescueRequest, Profile } from '@/types/database';

interface MissionWithProfile extends RescueRequest {
  requester_profile?: Profile | null;
}

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const geoLocation = useGeoLocation(true);

  useEffect(() => {
    fetchMissions();

    const channel = supabase
      .channel('rescuer_missions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchMissions)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user]);

  const fetchMissions = async () => {
    if (!user) return;

    const { data: missionsData, error } = await supabase
      .from('rescue_requests')
      .select('*')
      .or(`status.eq.pending,status.eq.assigned,and(status.eq.in_progress,assigned_rescuer_id.eq.${user.id})`)
      .order('priority_score', { ascending: false });

    if (error) {
      console.error('Error fetching missions:', error);
      setLoading(false);
      return;
    }

    const missionsWithProfiles: MissionWithProfile[] = [];
    for (const mission of (missionsData || [])) {
      if (mission.requester_id) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', mission.requester_id)
          .maybeSingle();
        
        missionsWithProfiles.push({
          ...mission,
          requester_profile: profileData as Profile | null
        });
      } else {
        missionsWithProfiles.push({ ...mission, requester_profile: null });
      }
    }

    setMissions(missionsWithProfiles as MissionWithProfile[]);
    setLoading(false);
  };

  const handleAcceptMission = async (id: string) => {
    if (!user) return;
    setProcessingId(id);

    const { error } = await supabase
      .from('rescue_requests')
      .update({ status: 'assigned', assigned_rescuer_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) toast.error('Failed to accept mission');
    else {
      toast.success('Mission accepted! Navigate to the location.');
      fetchMissions();
    }
    setProcessingId(null);
  };

  const handleStartMission = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('rescue_requests')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) toast.error('Failed to start mission');
    else {
      toast.success('Mission started!');
      fetchMissions();
    }
    setProcessingId(null);
  };

  const handleCompleteMission = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase
      .from('rescue_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) toast.error('Failed to complete mission');
    else {
      toast.success('Mission completed! Great work!');
      fetchMissions();
    }
    setProcessingId(null);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  const mapMarkers = missions
    .filter(m => m.location_lat && m.location_lng)
    .map(m => ({
      id: m.id,
      lat: m.location_lat!,
      lng: m.location_lng!,
      type: 'sos' as const,
      title: m.requester_profile?.full_name || 'Unknown',
      description: m.location_address || 'No address',
      severity: m.severity,
      status: m.status
    }));

  const myMissions = missions.filter(m => m.assigned_rescuer_id === user?.id);
  const availableMissions = missions.filter(m => m.status === 'pending');

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
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
            <p className="text-muted-foreground text-fluid-sm">
              {availableMissions.length} pending • {myMissions.length} assigned to you
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMissions} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            SOS Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <InteractiveMap
            markers={mapMarkers}
            height="300px"
            route={activeRoute ? {
              from: {
                lat: geoLocation.hasLocation ? geoLocation.latitude! : 13.8240,
                lng: geoLocation.hasLocation ? geoLocation.longitude! : 121.3945,
                label: 'Your Location',
              },
              to: activeRoute,
            } : null}
            userLocation={geoLocation.hasLocation ? { lat: geoLocation.latitude!, lng: geoLocation.longitude! } : null}
          />
        </CardContent>
      </Card>

      {myMissions.length > 0 && (
        <Card className="dashboard-card border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-fluid-lg flex items-center gap-2 text-primary">
              <CheckCircle className="w-5 h-5" />
              Your Active Missions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myMissions.map((mission) => (
              <div key={mission.id} className="p-fluid-md rounded-xl bg-card border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${mission.severity === 'critical' ? 'bg-destructive animate-pulse' : mission.severity === 'high' ? 'bg-warning' : 'bg-info'}`} />
                    <div>
                      <p className="font-semibold text-fluid-base">{mission.requester_profile?.full_name || 'Unknown Requester'}</p>
                      <p className="text-fluid-xs text-muted-foreground">{mission.household_count} people • Priority: {mission.priority_score}</p>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(mission.severity)}>{mission.severity}</Badge>
                </div>

                <div className="flex items-center gap-2 text-fluid-sm mb-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>{mission.location_address || `${mission.location_lat?.toFixed(4)}, ${mission.location_lng?.toFixed(4)}`}</span>
                </div>

                {mission.requester_profile?.phone_number && (
                  <div className="flex items-center gap-2 text-fluid-sm mb-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a href={`tel:${mission.requester_profile.phone_number}`} className="text-primary hover:underline">
                      {mission.requester_profile.phone_number}
                    </a>
                  </div>
                )}

                {mission.special_needs && mission.special_needs.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {mission.special_needs.map((need, i) => (
                      <Badge key={i} variant="outline" className="text-fluid-xs">{need}</Badge>
                    ))}
                  </div>
                )}

                {mission.situation_description && (
                  <div className="p-2 rounded-lg bg-muted/50 mb-3">
                    <p className="text-fluid-xs text-muted-foreground flex items-start gap-2">
                      <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                      {mission.situation_description}
                    </p>
                  </div>
                )}

                <Separator className="my-3" />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1"
                    onClick={() => {
                      if (mission.location_lat && mission.location_lng) {
                        setActiveRoute({
                          lat: mission.location_lat, lng: mission.location_lng,
                          label: mission.requester_profile?.full_name || 'Rescuee',
                        });
                      }
                    }}
                  >
                    <Navigation className="w-3 h-3" />
                    Show Route
                  </Button>
                  {mission.status === 'assigned' && (
                    <Button size="sm" className="flex-1 btn-hero gap-1" onClick={() => handleStartMission(mission.id)} disabled={processingId === mission.id}>
                      {processingId === mission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                      Start Rescue
                    </Button>
                  )}
                  {mission.status === 'in_progress' && (
                    <Button size="sm" className="flex-1 bg-success hover:bg-success/90 gap-1" onClick={() => handleCompleteMission(mission.id)} disabled={processingId === mission.id}>
                      {processingId === mission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Available Missions
          </CardTitle>
          <CardDescription>Pending rescue requests sorted by priority</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="p-fluid-md rounded-xl bg-muted/30 animate-pulse h-24" />)}
            </div>
          ) : availableMissions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 mx-auto text-success/30 mb-3" />
              <p className="text-muted-foreground text-fluid-sm">No pending missions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableMissions.map((mission) => (
                <div 
                  key={mission.id} 
                  className={`p-fluid-md rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                    mission.severity === 'critical' ? 'border-destructive/50 bg-destructive/5' :
                    mission.severity === 'high' ? 'border-warning/50 bg-warning/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        mission.severity === 'critical' ? 'bg-destructive/20' :
                        mission.severity === 'high' ? 'bg-warning/20' : 'bg-info/20'
                      }`}>
                        <AlertTriangle className={`w-5 h-5 ${
                          mission.severity === 'critical' ? 'text-destructive' :
                          mission.severity === 'high' ? 'text-warning' : 'text-info'
                        }`} />
                      </div>
                      <div>
                        <p className="font-semibold text-fluid-base">{mission.requester_profile?.full_name || 'Anonymous Request'}</p>
                        <div className="flex items-center gap-2 text-fluid-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{mission.household_count} people</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>{new Date(mission.created_at).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getSeverityColor(mission.severity)}>{mission.severity}</Badge>
                      <p className="text-fluid-xs text-muted-foreground mt-1">Score: {mission.priority_score}</p>
                    </div>
                  </div>

                  {mission.location_address && (
                    <p className="text-fluid-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3" />
                      {mission.location_address}
                    </p>
                  )}

                  {mission.special_needs && mission.special_needs.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-2">
                      {mission.special_needs.map((need, i) => (
                        <Badge key={i} variant="outline" className="text-fluid-xs">{need}</Badge>
                      ))}
                    </div>
                  )}

                  <Button size="sm" className="w-full mt-2 btn-hero" onClick={() => handleAcceptMission(mission.id)} disabled={processingId === mission.id}>
                    {processingId === mission.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                    Accept Mission
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
