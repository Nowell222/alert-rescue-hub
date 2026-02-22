import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';
import InteractiveMap from '@/components/map/InteractiveMap';
import {
  ArrowLeft, MapPin, Building2, AlertTriangle, Navigation, Droplets, RefreshCw, Loader2
} from 'lucide-react';
import type { EvacuationCenter, FloodZone } from '@/types/database';

export default function FloodMapPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRoute, setActiveRoute] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const location = useLocation(true);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('flood_map_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'flood_zones' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evacuation_centers' }, fetchData)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const fetchData = async () => {
    const [centersRes, zonesRes] = await Promise.all([
      supabase.from('evacuation_centers').select('*'),
      supabase.from('flood_zones').select('*')
    ]);
    if (centersRes.data) setCenters(centersRes.data as EvacuationCenter[]);
    if (zonesRes.data) setZones(zonesRes.data as FloodZone[]);
    setLoading(false);
  };

  const handleRefresh = async () => { setRefreshing(true); await fetchData(); setRefreshing(false); };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-destructive/15 text-destructive border border-destructive/20';
      case 'high': return 'bg-warning/15 text-warning border border-warning/20';
      case 'moderate': return 'bg-info/15 text-info border border-info/20';
      default: return 'bg-success/15 text-success border border-success/20';
    }
  };

  const getRiskBorderColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'border-l-destructive';
      case 'high': return 'border-l-warning';
      case 'moderate': return 'border-l-info';
      default: return 'border-l-success';
    }
  };

  const getWaterLevelPercent = (level: number | null) => {
    if (!level) return 0;
    return Math.min((level / 100) * 100, 100);
  };

  const getWaterBarColor = (level: number | null) => {
    if (!level) return 'bg-success';
    if (level >= 60) return 'bg-destructive';
    if (level >= 30) return 'bg-warning';
    if (level >= 10) return 'bg-info';
    return 'bg-success';
  };

  const mapMarkers = centers.map(center => ({
    id: center.id,
    lat: center.location_lat || 13.8240,
    lng: center.location_lng || 121.3945,
    type: 'evacuation' as const,
    title: center.name,
    description: `Capacity: ${center.current_occupancy}/${center.max_capacity}`,
    status: center.status || 'operational'
  }));

  const mapFloodZones = zones.map(zone => ({
    id: zone.id, name: zone.zone_name,
    lat: 13.8240 + (Math.random() - 0.5) * 0.02,
    lng: 121.3945 + (Math.random() - 0.5) * 0.02,
    radius: 200 + Math.random() * 300,
    riskLevel: zone.risk_level.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical',
    waterLevel: zone.current_water_level
  }));

  const getUserZoneRisk = () => {
    if (!location.hasLocation || zones.length === 0) return null;
    const risks = ['critical', 'high', 'moderate', 'low'];
    for (const risk of risks) {
      if (zones.some(z => z.risk_level.toLowerCase() === risk)) return risk;
    }
    return 'low';
  };
  const userZoneRisk = getUserZoneRisk();

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap animate-fade-up">
        <div className="flex items-center gap-fluid-md">
          <Link to="/resident">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" />
              Flood Map
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Real-time flood zones and evacuation centers</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2 rounded-xl">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* User Zone Status */}
      {userZoneRisk && (
        <Card className={`dashboard-card border-l-4 ${getRiskBorderColor(userZoneRisk)} animate-fade-up stagger-1`}>
          <CardContent className="p-fluid-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${
                userZoneRisk === 'critical' ? 'text-destructive' :
                userZoneRisk === 'high' ? 'text-warning' :
                userZoneRisk === 'moderate' ? 'text-info' : 'text-success'
              }`} />
              <div>
                <p className="font-medium text-fluid-sm">Your Current Zone Status</p>
                <p className="text-fluid-xs text-muted-foreground">
                  Based on your location: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                </p>
              </div>
            </div>
            <Badge className={getRiskColor(userZoneRisk)}>{userZoneRisk.toUpperCase()} RISK</Badge>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card className="dashboard-card overflow-hidden animate-fade-up stagger-2">
        {loading ? (
          <div className="h-80 flex items-center justify-center bg-muted/20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <InteractiveMap
            markers={mapMarkers} floodZones={mapFloodZones}
            userLocation={location.hasLocation ? { lat: location.latitude!, lng: location.longitude! } : null}
            height="400px"
            route={activeRoute ? {
              from: { lat: location.hasLocation ? location.latitude! : 13.8240, lng: location.hasLocation ? location.longitude! : 121.3945, label: 'Your Location' },
              to: activeRoute
            } : null}
          />
        )}
      </Card>

      {/* Flood Zones */}
      <Card className="dashboard-card animate-fade-up stagger-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg font-display flex items-center gap-2">
            <Droplets className="w-5 h-5 text-info" />
            Flood Zone Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-fluid-sm text-muted-foreground text-center py-4">No flood zones configured</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-fluid-sm">
              {zones.map((zone) => (
                <div key={zone.id} className={`p-fluid-sm rounded-2xl bg-muted/30 border border-l-4 ${getRiskBorderColor(zone.risk_level)} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-fluid-sm">{zone.zone_name}</p>
                    <Badge className={getRiskColor(zone.risk_level)}>{zone.risk_level}</Badge>
                  </div>
                  {/* Water level bar */}
                  <div>
                    <div className="flex items-center justify-between text-fluid-xs text-muted-foreground mb-1">
                      <span>Water Level</span>
                      <span className="font-semibold">{zone.current_water_level}cm</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 rounded-full ${getWaterBarColor(zone.current_water_level)}`}
                        style={{ width: `${getWaterLevelPercent(zone.current_water_level)}%` }} />
                    </div>
                  </div>
                  {zone.last_reading_at && (
                    <p className="text-fluid-xs text-muted-foreground">
                      Updated: {new Date(zone.last_reading_at).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evacuation Centers */}
      <Card className="dashboard-card animate-fade-up stagger-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg font-display flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            Evacuation Centers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {centers.length === 0 ? (
            <p className="text-fluid-sm text-muted-foreground text-center py-4">No evacuation centers configured</p>
          ) : (
            <div className="space-y-3">
              {centers.map((center) => {
                const occupancyPercent = Math.round((center.current_occupancy / center.max_capacity) * 100);
                return (
                  <div key={center.id} className="p-fluid-md rounded-2xl bg-muted/30 border border-border/50 hover:border-border transition-colors duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-fluid-base">{center.name}</p>
                        <p className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{center.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-fluid-lg ${occupancyPercent >= 90 ? 'text-destructive' : occupancyPercent >= 70 ? 'text-warning' : 'text-success'}`}>
                          {center.current_occupancy}/{center.max_capacity}
                        </span>
                        <p className="text-fluid-xs text-muted-foreground">Occupancy</p>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden mb-3">
                      <div className={`h-full transition-all duration-500 rounded-full ${occupancyPercent >= 90 ? 'bg-destructive' : occupancyPercent >= 70 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(occupancyPercent, 100)}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className={`${
                        center.status === 'operational' || !center.status ? 'bg-success/15 text-success border border-success/20' : 'bg-warning/15 text-warning border border-warning/20'
                      }`}>
                        {center.status || 'operational'}
                      </Badge>
                      <Button size="sm" variant="outline" className="gap-1 text-fluid-xs rounded-xl"
                        onClick={() => setActiveRoute({ lat: center.location_lat || 13.8240, lng: center.location_lng || 121.3945, label: center.name })}>
                        <Navigation className="w-3 h-3" />Get Directions
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="dashboard-card">
        <CardContent className="p-fluid-md">
          <p className="font-semibold text-fluid-sm mb-3 font-display">Map Legend</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
            {[
              { color: 'bg-success', label: 'Safe (0-10cm)' },
              { color: 'bg-info', label: 'Monitor (10-30cm)' },
              { color: 'bg-warning', label: 'Warning (30-60cm)' },
              { color: 'bg-destructive', label: 'Critical (60cm+)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-fluid-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
