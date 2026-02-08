import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowLeft,
  MapPin,
  Building2,
  AlertTriangle,
  Navigation,
  Droplets
} from 'lucide-react';
import type { EvacuationCenter, FloodZone } from '@/types/database';

export default function FloodMapPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [zones, setZones] = useState<FloodZone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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

  return (
    <div className="space-y-4 sm:space-y-6">
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
          <p className="text-muted-foreground text-fluid-sm">View flood zones and evacuation centers</p>
        </div>
      </div>

      {/* Map Placeholder */}
      <Card className="map-container">
        <div className="h-64 sm:h-80 bg-gradient-to-br from-info/20 to-primary/10 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
              <rect width="100" height="100" fill="url(#grid)"/>
            </svg>
          </div>
          <div className="text-center z-10">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-primary animate-bounce" />
            <p className="text-fluid-base font-medium">Interactive Map</p>
            <p className="text-fluid-sm text-muted-foreground">Barangay Catmon, San Juan, Batangas</p>
          </div>
        </div>
      </Card>

      {/* Flood Zones */}
      <Card>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-fluid-md">
              {zones.map((zone) => (
                <div key={zone.id} className="p-fluid-sm rounded-lg bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fluid-sm">{zone.zone_name}</p>
                    <p className="text-fluid-xs text-muted-foreground">
                      Water Level: {zone.current_water_level}cm
                    </p>
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
      <Card>
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
                  <div key={center.id} className="p-fluid-md rounded-lg bg-muted/50">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-fluid-base">{center.name}</p>
                        <p className="text-fluid-xs text-muted-foreground">{center.address}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-bold text-fluid-base ${getOccupancyColor(center.current_occupancy, center.max_capacity)}`}>
                          {center.current_occupancy}/{center.max_capacity}
                        </span>
                        <p className="text-fluid-xs text-muted-foreground">Occupancy</p>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${occupancyPercent >= 90 ? 'bg-destructive' : occupancyPercent >= 70 ? 'bg-warning' : 'bg-success'}`}
                        style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-end mt-2">
                      <Button size="sm" variant="outline" className="gap-1 text-fluid-xs">
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
      <Card>
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
                <div className={`w-4 h-4 rounded ${item.color}`} />
                <span className="text-fluid-xs">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
