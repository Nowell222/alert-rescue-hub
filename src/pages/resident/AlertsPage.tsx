import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Bell, AlertTriangle, Info, Clock,
  X, Droplets, Wind, Thermometer, MapPin, Users,
  Navigation, ChevronRight, Shield, AlertCircle,
  TrendingUp, Eye, Home, Activity
} from 'lucide-react';
import type { WeatherAlert } from '@/types/database';

// Extended alert type with rich details
interface DetailedAlert extends WeatherAlert {
  // These fields may come from the DB or be derived
  weather_condition?: string;
  wind_speed?: number;
  rainfall_mm?: number;
  temperature?: number;
  flood_risk_level?: string; // 'low' | 'moderate' | 'high' | 'extreme'
  water_level_meters?: number;
  water_level_status?: string; // 'normal' | 'alert' | 'critical'
  evacuation_centers?: { name: string; address: string; capacity: number; available: boolean }[];
  affected_population?: number;
  instructions?: string[];
  expires_at?: string;
}

const MOCK_DETAILS: Record<string, Partial<DetailedAlert>> = {
  // Keyed by priority for demo; in production, fetch from DB by alert ID
  warning: {
    weather_condition: 'Heavy Rain',
    wind_speed: 45,
    rainfall_mm: 78,
    temperature: 24,
    flood_risk_level: 'high',
    water_level_meters: 4.2,
    water_level_status: 'alert',
    affected_population: 3200,
    instructions: [
      'Monitor water levels at your location every hour',
      'Prepare a go-bag with essentials (documents, medicine, water)',
      'Identify your nearest evacuation center',
      'Avoid crossing flooded roads or bridges',
      'Keep phones charged and stay tuned to official channels',
    ],
    evacuation_centers: [
      { name: 'Riverside Elementary School', address: 'Zone 1 - Riverside Blvd', capacity: 500, available: true },
      { name: 'Barangay Hall Covered Court', address: 'Zone 1 - Main St', capacity: 300, available: true },
    ],
  },
  informational: {
    weather_condition: 'Continuous Rain',
    wind_speed: 20,
    rainfall_mm: 35,
    temperature: 22,
    flood_risk_level: 'moderate',
    water_level_meters: 2.8,
    water_level_status: 'normal',
    affected_population: 8500,
    instructions: [
      'Stock up on food and water for at least 3 days',
      'Secure loose objects around your home',
      'Stay indoors as much as possible',
      'Check on elderly or vulnerable neighbors',
    ],
    evacuation_centers: [],
  },
  critical: {
    weather_condition: 'Typhoon Signal #2',
    wind_speed: 120,
    rainfall_mm: 180,
    temperature: 19,
    flood_risk_level: 'extreme',
    water_level_meters: 6.5,
    water_level_status: 'critical',
    affected_population: 12000,
    instructions: [
      'EVACUATE IMMEDIATELY — do not wait for water to rise',
      'Bring: IDs, medicine, water, food, clothing for 3 days',
      'Turn off electricity and gas before leaving',
      'Do NOT use elevators; use stairs only',
      'Stay together as a family and account for everyone',
      'Report to evacuation centers listed below',
    ],
    evacuation_centers: [
      { name: 'San Isidro High School Gym', address: 'Zone 2 - Lowlands, Rizal St', capacity: 800, available: true },
      { name: 'Municipal Sports Complex', address: 'Zone 3 - Center, Lopez Ave', capacity: 1200, available: true },
      { name: 'Creek Area Community Center', address: 'Zone 5 - Creek Area', capacity: 400, available: false },
    ],
  },
};

const WATER_LEVEL_MAX = 8; // meters for gauge

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DetailedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<DetailedAlert | null>(null);

  useEffect(() => {
    fetchAlerts();
    const channel = supabase
      .channel('alerts_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'weather_alerts' }, fetchAlerts)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('weather_alerts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      // Enrich with mock detail data (replace with real DB fields in production)
      const enriched = (data as WeatherAlert[]).map(alert => ({
        ...alert,
        ...(MOCK_DETAILS[alert.priority] || MOCK_DETAILS['informational']),
      }));
      setAlerts(enriched);
    }
    setLoading(false);
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-l-4 border-red-500',
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-700 border border-red-200',
          dot: 'bg-red-500',
          glow: 'shadow-red-100',
          label: 'CRITICAL',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-l-4 border-amber-500',
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700 border border-amber-200',
          dot: 'bg-amber-500',
          glow: 'shadow-amber-100',
          label: 'WARNING',
        };
      default:
        return {
          bg: 'bg-blue-50 border-l-4 border-blue-400',
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700 border border-blue-200',
          dot: 'bg-blue-500',
          glow: 'shadow-blue-100',
          label: 'INFO',
        };
    }
  };

  const getFloodRiskColor = (level?: string) => {
    switch (level) {
      case 'extreme': return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50', label: 'Extreme Risk' };
      case 'high': return { bar: 'bg-orange-500', text: 'text-orange-600', bg: 'bg-orange-50', label: 'High Risk' };
      case 'moderate': return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', label: 'Moderate Risk' };
      default: return { bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50', label: 'Low Risk' };
    }
  };

  const getWaterLevelColor = (status?: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'alert': return 'bg-amber-500';
      default: return 'bg-blue-400';
    }
  };

  const floodRiskPercent = (level?: string) => {
    switch (level) {
      case 'extreme': return 95;
      case 'high': return 72;
      case 'moderate': return 45;
      default: return 18;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <Link to="/resident">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Weather Alerts
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Stay informed about current warnings</p>
        </div>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up stagger-1">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-success/15 flex items-center justify-center border border-success/20">
              <Bell className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">All Clear!</h3>
            <p className="text-fluid-sm text-muted-foreground">No active weather alerts at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const cfg = getPriorityConfig(alert.priority);
            const IconComponent = cfg.icon;
            const riskColor = getFloodRiskColor(alert.flood_risk_level);

            return (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${cfg.bg} animate-fade-up`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0 ${cfg.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-fluid-base font-display">{alert.title}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-fluid-sm text-foreground/75 mb-2 line-clamp-2">{alert.message}</p>

                    {/* Quick stats row */}
                    <div className="flex items-center gap-4 flex-wrap">
                      {alert.water_level_meters && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Droplets className="w-3 h-3" />
                          {alert.water_level_meters}m water level
                        </span>
                      )}
                      {alert.wind_speed && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Wind className="w-3 h-3" />
                          {alert.wind_speed} km/h
                        </span>
                      )}
                      {alert.flood_risk_level && (
                        <span className={`text-xs font-medium ${riskColor.text}`}>
                          {riskColor.label}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAlert(null); }}
        >
          <div className="bg-background w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
            {/* Modal Header */}
            {(() => {
              const cfg = getPriorityConfig(selectedAlert.priority);
              const IconComponent = cfg.icon;
              const riskColor = getFloodRiskColor(selectedAlert.flood_risk_level);
              const waterPct = selectedAlert.water_level_meters
                ? Math.min((selectedAlert.water_level_meters / WATER_LEVEL_MAX) * 100, 100)
                : 0;

              return (
                <>
                  {/* Colored top strip */}
                  <div className={`rounded-t-3xl sm:rounded-t-3xl p-5 ${
                    selectedAlert.priority === 'critical' ? 'bg-red-500' :
                    selectedAlert.priority === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                  } text-white`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{cfg.label}</p>
                          <h2 className="font-bold text-lg leading-tight">{selectedAlert.title}</h2>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedAlert(null)}
                        className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="mt-3 text-white/90 text-sm leading-relaxed">{selectedAlert.message}</p>

                    <div className="flex items-center gap-3 mt-3 text-white/70 text-xs flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(selectedAlert.created_at).toLocaleString()}
                      </span>
                      {selectedAlert.target_zones && selectedAlert.target_zones.length > 0 && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {selectedAlert.target_zones.join(', ')}
                        </span>
                      )}
                      {selectedAlert.affected_population && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          ~{selectedAlert.affected_population.toLocaleString()} residents affected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Modal Body */}
                  <div className="p-5 space-y-5 flex-1 overflow-y-auto">

                    {/* Weather Conditions Grid */}
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" /> Current Conditions
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {selectedAlert.weather_condition && (
                          <div className="bg-muted/50 rounded-2xl p-3 text-center">
                            <Eye className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Condition</p>
                            <p className="font-semibold text-sm mt-0.5">{selectedAlert.weather_condition}</p>
                          </div>
                        )}
                        {selectedAlert.wind_speed !== undefined && (
                          <div className="bg-muted/50 rounded-2xl p-3 text-center">
                            <Wind className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                            <p className="text-xs text-muted-foreground">Wind Speed</p>
                            <p className="font-semibold text-sm mt-0.5">{selectedAlert.wind_speed} km/h</p>
                          </div>
                        )}
                        {selectedAlert.rainfall_mm !== undefined && (
                          <div className="bg-muted/50 rounded-2xl p-3 text-center">
                            <Droplets className="w-5 h-5 mx-auto mb-1 text-cyan-500" />
                            <p className="text-xs text-muted-foreground">Rainfall</p>
                            <p className="font-semibold text-sm mt-0.5">{selectedAlert.rainfall_mm} mm</p>
                          </div>
                        )}
                        {selectedAlert.temperature !== undefined && (
                          <div className="bg-muted/50 rounded-2xl p-3 text-center">
                            <Thermometer className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                            <p className="text-xs text-muted-foreground">Temperature</p>
                            <p className="font-semibold text-sm mt-0.5">{selectedAlert.temperature}°C</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Water Level */}
                    {selectedAlert.water_level_meters !== undefined && (
                      <section>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Droplets className="w-4 h-4" /> Water Level
                        </h3>
                        <div className="bg-muted/50 rounded-2xl p-4">
                          <div className="flex items-end justify-between mb-2">
                            <div>
                              <span className="text-3xl font-bold">{selectedAlert.water_level_meters}</span>
                              <span className="text-muted-foreground ml-1">m</span>
                            </div>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize ${
                              selectedAlert.water_level_status === 'critical' ? 'bg-red-100 text-red-600' :
                              selectedAlert.water_level_status === 'alert' ? 'bg-amber-100 text-amber-600' :
                              'bg-green-100 text-green-600'
                            }`}>
                              {selectedAlert.water_level_status || 'Normal'}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getWaterLevelColor(selectedAlert.water_level_status)}`}
                              style={{ width: `${waterPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>0m</span>
                            <span>Normal: 2m</span>
                            <span>Critical: 6m+</span>
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Flood Risk */}
                    {selectedAlert.flood_risk_level && (
                      <section>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" /> Flood Risk Assessment
                        </h3>
                        <div className={`rounded-2xl p-4 ${riskColor.bg}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-bold text-lg ${riskColor.text}`}>{riskColor.label}</span>
                            <span className={`text-sm font-medium ${riskColor.text}`}>
                              {floodRiskPercent(selectedAlert.flood_risk_level)}%
                            </span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${riskColor.bar}`}
                              style={{ width: `${floodRiskPercent(selectedAlert.flood_risk_level)}%` }}
                            />
                          </div>
                        </div>
                      </section>
                    )}

                    {/* Safety Instructions */}
                    {selectedAlert.instructions && selectedAlert.instructions.length > 0 && (
                      <section>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Safety Instructions
                        </h3>
                        <div className="space-y-2">
                          {selectedAlert.instructions.map((instruction, i) => (
                            <div key={i} className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
                              <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                selectedAlert.priority === 'critical' ? 'bg-red-100 text-red-600' :
                                selectedAlert.priority === 'warning' ? 'bg-amber-100 text-amber-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>{i + 1}</span>
                              <p className="text-sm leading-relaxed">{instruction}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Evacuation Centers */}
                    {selectedAlert.evacuation_centers && selectedAlert.evacuation_centers.length > 0 && (
                      <section>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Navigation className="w-4 h-4" /> Evacuation Centers
                        </h3>
                        <div className="space-y-2">
                          {selectedAlert.evacuation_centers.map((center, i) => (
                            <div key={i} className="flex items-start gap-3 border border-border rounded-2xl p-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                center.available ? 'bg-green-100' : 'bg-muted'
                              }`}>
                                <Home className={`w-4 h-4 ${center.available ? 'text-green-600' : 'text-muted-foreground'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm">{center.name}</p>
                                <p className="text-xs text-muted-foreground">{center.address}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Capacity: {center.capacity.toLocaleString()}
                                  </span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    center.available
                                      ? 'bg-green-100 text-green-700'
                                      : 'bg-red-100 text-red-600'
                                  }`}>
                                    {center.available ? 'Open' : 'Full'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* No evacuation centers but critical/warning */}
                    {(!selectedAlert.evacuation_centers || selectedAlert.evacuation_centers.length === 0) &&
                      (selectedAlert.priority === 'critical' || selectedAlert.priority === 'warning') && (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-2xl p-4">
                        <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          No evacuation centers designated for this alert. Monitor updates for changes.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CTA Footer */}
                  {selectedAlert.priority === 'critical' && (
                    <div className="p-4 border-t border-border">
                      <Link to="/resident/emergency-sos">
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-semibold">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Request Emergency Assistance
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}