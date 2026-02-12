import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import InteractiveMap from '@/components/map/InteractiveMap';
import { useLocation } from '@/hooks/useLocation';
import {
  ArrowLeft, MapPin, Users, Building2, AlertTriangle,
  RefreshCw, Loader2, Droplets
} from 'lucide-react';
import type { EvacuationCenter, FloodZone, RescueRequest, Profile } from '@/types/database';

export default function HouseholdMapViewPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [sosRequests, setSosRequests] = useState<RescueRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation(true);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('official_map_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flood_zones' }, fetchData)
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const [centersRes, zonesRes, requestsRes, profilesRes] = await Promise.all([
      supabase.from('evacuation_centers').select('*'),
      supabase.from('flood_zones').select('*'),
      supabase.from('rescue_requests').select('*').in('status', ['pending', 'assigned', 'in_progress']),
      supabase.from('profiles').select('*'),
    ]);

    if (centersRes.data) setCenters(centersRes.data as EvacuationCenter[]);
    if (zonesRes.data) setZones(zonesRes.data as FloodZone[]);
    if (requestsRes.data) setSosRequests(requestsRes.data as RescueRequest[]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const mapMarkers = [
    ...centers.map(c => ({
      id: c.id,
      lat: c.location_lat || 13.8240,
      lng: c.location_lng || 121.3945,
      type: 'evacuation' as const,
      title: c.name,
      description: `${c.current_occupancy}/${c.max_capacity} capacity`,
      status: c.status || 'operational',
    })),
    ...sosRequests.filter(r => r.location_lat && r.location_lng).map(r => {
      const p = profiles.find(pr => pr.user_id === r.requester_id);
      return {
        id: r.id,
        lat: r.location_lat!,
        lng: r.location_lng!,
        type: 'sos' as const,
        title: p?.full_name || 'SOS Request',
        description: `${r.household_count} people - ${r.severity}`,
        severity: r.severity,
        status: r.status,
      };
    }),
    ...profiles.filter(p => p.address).map((p, i) => ({
      id: `household-${p.id}`,
      lat: 13.8240 + (Math.sin(i * 1.7) * 0.008),
      lng: 121.3945 + (Math.cos(i * 1.7) * 0.008),
      type: 'household' as const,
      title: p.full_name,
      description: p.address || 'No address',
    })),
  ];

  const mapFloodZones = zones.map(zone => ({
    id: zone.id,
    name: zone.zone_name,
    lat: 13.8240 + (Math.random() - 0.5) * 0.02,
    lng: 121.3945 + (Math.random() - 0.5) * 0.02,
    radius: 200 + Math.random() * 300,
    riskLevel: zone.risk_level.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical',
    waterLevel: zone.current_water_level,
  }));

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
              Zone Status & Households
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Real-time map of households, SOS, and flood zones</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-fluid-sm">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-primary">{profiles.length}</p>
            <p className="text-fluid-xs text-muted-foreground">Households</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-destructive">{sosRequests.length}</p>
            <p className="text-fluid-xs text-muted-foreground">Active SOS</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-warning">{zones.filter(z => z.risk_level.toLowerCase() === 'high' || z.risk_level.toLowerCase() === 'critical').length}</p>
            <p className="text-fluid-xs text-muted-foreground">High Risk Zones</p>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-card overflow-hidden">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <InteractiveMap
            markers={mapMarkers}
            floodZones={mapFloodZones}
            userLocation={location.hasLocation ? { lat: location.latitude!, lng: location.longitude! } : null}
            height="500px"
          />
        )}
      </Card>

      {/* Legend */}
      <Card className="dashboard-card">
        <CardContent className="p-fluid-md">
          <p className="font-medium text-fluid-sm mb-3">Map Legend</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-fluid-sm">
            {[
              { color: 'bg-red-500', label: 'SOS Request' },
              { color: 'bg-blue-500', label: 'Evacuation Center' },
              { color: 'bg-amber-500', label: 'Household' },
              { color: 'bg-purple-500', label: 'Your Location' },
              { color: 'bg-green-500', label: 'Safe Zone' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-fluid-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active SOS */}
      {sosRequests.length > 0 && (
        <Card className="dashboard-card border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-fluid-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Active SOS Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sosRequests.map(r => {
                const p = profiles.find(pr => pr.user_id === r.requester_id);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <div>
                      <p className="font-medium text-fluid-sm">{p?.full_name || 'Unknown'}</p>
                      <p className="text-fluid-xs text-muted-foreground">{r.household_count} people • {r.location_address || 'Location pending'}</p>
                    </div>
                    <Badge className="bg-destructive text-destructive-foreground">{r.severity}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
