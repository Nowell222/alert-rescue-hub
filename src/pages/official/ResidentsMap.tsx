import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InteractiveMap from '@/components/map/InteractiveMap';
import {
  ArrowLeft,
  MapPin,
  Users,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface ResidentLocation {
  id: string;
  user_id: string;
  full_name: string;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_active_at: string | null;
  barangay_zone: string | null;
}

export default function ResidentsMapPage() {
  const [residents, setResidents] = useState<ResidentLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResidents();

    // Refresh every 30 seconds
    const interval = setInterval(fetchResidents, 30000);

    // Also subscribe to real-time profile updates
    const channel = supabase
      .channel('resident_locations')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, fetchResidents)
      .subscribe();

    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const fetchResidents = async () => {
    // Get resident user IDs
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'resident');

    if (!roleData || roleData.length === 0) {
      setResidents([]);
      setLoading(false);
      return;
    }

    const userIds = roleData.map(r => r.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, last_known_lat, last_known_lng, last_active_at, barangay_zone')
      .in('user_id', userIds)
      .not('last_known_lat', 'is', null);

    if (profiles) {
      setResidents(profiles as ResidentLocation[]);
    }
    setLoading(false);
  };

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return 'inactive';
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = diff / 60000;
    if (minutes < 5) return 'online';
    if (minutes < 60) return 'recent';
    return 'inactive';
  };

  const mapMarkers = residents
    .filter(r => r.last_known_lat && r.last_known_lng)
    .map(r => {
      const status = getActivityStatus(r.last_active_at);
      return {
        id: r.id,
        lat: r.last_known_lat!,
        lng: r.last_known_lng!,
        type: 'household' as const,
        title: r.full_name,
        description: r.barangay_zone ? `Zone: ${r.barangay_zone}` : undefined,
        status: status === 'online' ? 'Online' : status === 'recent' ? 'Recently active' : 'Last seen: ' + (r.last_active_at ? new Date(r.last_active_at).toLocaleString() : 'Unknown'),
      };
    });

  const onlineCount = residents.filter(r => getActivityStatus(r.last_active_at) === 'online').length;
  const recentCount = residents.filter(r => getActivityStatus(r.last_active_at) === 'recent').length;

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/official">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Residents Map
            </h1>
            <p className="text-muted-foreground text-fluid-sm">
              Showing locations of {residents.length} residents
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResidents} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-fluid-sm">
        <Card className="dashboard-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-fluid-2xl font-bold font-display">{onlineCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Online Now</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-info" />
              <span className="text-fluid-2xl font-bold font-display">{recentCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Recent</p>
          </CardContent>
        </Card>
        <Card className="dashboard-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span className="text-fluid-2xl font-bold font-display">{residents.length}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Total Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Live Resident Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="h-96 flex items-center justify-center bg-muted/20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <InteractiveMap
              markers={mapMarkers}
              height="500px"
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="dashboard-card">
        <CardContent className="p-fluid-md">
          <p className="font-medium text-fluid-sm mb-3">How it works</p>
          <div className="space-y-2 text-fluid-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success" />
              <span><strong>Online</strong> — Resident is currently using the app (location updates live)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-info" />
              <span><strong>Recent</strong> — Was active within the last hour</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span><strong>Inactive</strong> — Last known location shown (not currently using the app)</span>
            </div>
            <p className="mt-2 italic">Locations only update when residents actively use the website. No background tracking.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
