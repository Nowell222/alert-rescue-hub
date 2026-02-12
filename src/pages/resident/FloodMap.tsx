import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';
import InteractiveMap from '@/components/map/InteractiveMap';
import type { RouteInfo } from '@/components/map/RouteLine';
import {
  ArrowLeft,
  MapPin,
  Building2,
  AlertTriangle,
  Navigation,
  Droplets,
  RefreshCw,
  Loader2
} from 'lucide-react';
import type { EvacuationCenter, FloodZone } from '@/types/database';

export default function FloodMapPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeRoute, setActiveRoute] = useState<RouteInfo | null>(null);
  const location = useLocation(true);

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time updates
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'moderate': return 'bg-info text-info-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  const getOccupancyColor = (current: number, max: number) => {
    const percent = (current / max) * 100;
    if (percent >= 90) return 'text-destructive';
    if (percent >= 70) return 'text-warning';
    return 'text-success';
  };

  // Convert data for map
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
    id: zone.id,
    name: zone.zone_name,
    lat: 13.8240 + (Math.random() - 0.5) * 0.02,
    lng: 121.3945 + (Math.random() - 0.5) * 0.02,
    radius: 200 + Math.random() * 300,
    riskLevel: zone.risk_level.toLowerCase() as 'low' | 'moderate' | 'high' | 'critical',
    waterLevel: zone.current_water_level
  }));

  // Determine user's current zone risk
  const getUserZoneRisk = () => {
    if (!location.hasLocation || zones.length === 0) return null;
    // In production, this would check if user's location falls within any flood zone polygons
    // For now, return the highest risk zone as demo
    const risks = ['critical', 'high', 'moderate', 'low'];
    for (const risk of risks) {
      if (zones.some(z => z.risk_level.toLowerCase() === risk)) {
        return risk;
      }
    }
    return 'low';
  };

  const userZoneRisk = getUserZoneRisk();

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/resident">
            <Button variant="ghost" size="icon" className="shrink-0">
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
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* User Zone Status */}
      {userZoneRisk && (
        <Card className={`dashboard-card border-l-4 ${
          userZoneRisk === 'critical' ? 'border-l-destructive bg-destructive/5' :
          userZoneRisk === 'high' ? 'border-l-warning bg-warning/5' :
          userZoneRisk === 'moderate' ? 'border-l-info bg-info/5' :
          'border-l-success bg-success/5'
        }`}>
          <CardContent className="p-fluid-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`w-5 h-5 ${
                userZoneRisk === 'critical' ? 'text-destructive' :
                userZoneRisk === 'high' ? 'text-warning' :
                userZoneRisk === 'moderate' ? 'text-info' :
                'text-success'
              }`} />
              <div>
                <p className="font-medium text-fluid-sm">Your Current Zone Status</p>
                <p className="text-fluid-xs text-muted-foreground">
                  Based on your location: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                </p>
              </div>
            </div>
            <Badge className={getRiskColor(userZoneRisk)}>
              {userZoneRisk.toUpperCase()} RISK
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Interactive Map */}
      <Card className="dashboard-card overflow-hidden">
        {loading ? (
          <div className="h-80 flex items-center justify-center bg-muted/20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <InteractiveMap
            markers={mapMarkers}
            floodZones={mapFloodZones}
            userLocation={location.hasLocation ? { lat: location.latitude!, lng: location.longitude! } : null}
            height="400px"
            route={activeRoute}
          />
        )}
      </Card>

      {/* Flood Zones */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg font-display flex items-center gap-2">
            <Droplets className="w-5 h-5 text-info" />
            Flood Zone Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zones.length === 0 ? (
            <p className="text-fluid-sm text-muted-foreground text-center py-4">
              No flood zones configured
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-fluid-sm">
              {zones.map((zone) => (
                <div key={zone.id} className="p-fluid-sm rounded-xl bg-muted/50 border flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fluid-sm">{zone.zone_name}</p>
                    <p className="text-fluid-xs text-muted-foreground">
                      Water Level: {zone.current_water_level}cm
                    </p>
                    {zone.last_reading_at && (
                      <p className="text-fluid-xs text-muted-foreground">
                        Updated: {new Date(zone.last_reading_at).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <Badge className={getRiskColor(zone.risk_level)}>
                    {zone.risk_level}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evacuation Centers */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg font-display flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            Evacuation Centers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {centers.length === 0 ? (
            <p className="text-fluid-sm text-muted-foreground text-center py-4">
              No evacuation centers configured
            </p>
          ) : (
            <div className="space-y-3">
              {centers.map((center) => {
                const occupancyPercent = Math.round((center.current_occupancy / center.max_capacity) * 100);
                
                return (
                  <div key={center.id} className="p-fluid-md rounded-xl bg-muted/50 border">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-fluid-base">{center.name}</p>
                        <p className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {center.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-fluid-base ${getOccupancyColor(center.current_occupancy, center.max_capacity)}`}>
                          {center.current_occupancy}/{center.max_capacity}
                        </span>
                        <p className="text-fluid-xs text-muted-foreground">Occupancy</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <div 
                        className={`h-full transition-all ${occupancyPercent >= 90 ? 'bg-destructive' : occupancyPercent >= 70 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-fluid-xs">
                        {center.status || 'operational'}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 text-fluid-xs"
                        onClick={() => {
                          const lat = center.location_lat || 13.8240;
                          const lng = center.location_lng || 121.3945;
                          if (location.hasLocation) {
                            setActiveRoute({
                              from: { lat: location.latitude!, lng: location.longitude!, label: 'Your Location' },
                              to: { lat, lng, label: center.name },
                            });
                          }
                        }}
                      >
                        <Navigation className="w-3 h-3" />
                        Get Directions
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
          <p className="font-medium text-fluid-sm mb-3">Map Legend</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
            {[
              { color: 'bg-success', label: 'Safe (0-10cm)' },
              { color: 'bg-info', label: 'Monitor (10-30cm)' },
              { color: 'bg-warning', label: 'Warning (30-60cm)' },
              { color: 'bg-destructive', label: 'Critical (60cm+)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full ${item.color}`} />
                <span className="text-fluid-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
