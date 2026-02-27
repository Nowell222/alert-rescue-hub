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
  MessageSquare,
  Waves,
  Siren,
  ShieldAlert,
  TrendingUp,
  Activity,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescueRequest, Profile } from '@/types/database';

interface MissionWithProfile extends RescueRequest {
  requester_profile?: Profile | null;
}

// ─── Severity Config ────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bg: 'bg-red-100',
    border: 'border-red-200',
    bar: 'bg-red-500',
    dot: 'bg-red-500',
    pulse: true,
    cardBorder: 'border-red-200/60 bg-red-50/30',
    strip: 'bg-red-500',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200',
  },
  high: {
    label: 'High',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    bar: 'bg-amber-500',
    dot: 'bg-amber-500',
    pulse: false,
    cardBorder: 'border-amber-200/60 bg-amber-50/30',
    strip: 'bg-amber-500',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    bar: 'bg-blue-500',
    dot: 'bg-blue-500',
    pulse: false,
    cardBorder: 'border-blue-200/40 bg-blue-50/20',
    strip: 'bg-blue-400',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  low: {
    label: 'Low',
    color: 'text-slate-500',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    bar: 'bg-slate-400',
    dot: 'bg-slate-400',
    pulse: false,
    cardBorder: 'border-slate-200/40',
    strip: 'bg-slate-300',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

const getSeverityMeta = (severity: string) =>
  SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.medium;

// ─── Status Config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100' },
  assigned: { label: 'Assigned', color: 'text-blue-600', bg: 'bg-blue-100' },
  in_progress: { label: 'In Progress', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  completed: { label: 'Completed', color: 'text-slate-500', bg: 'bg-slate-100' },
};

// ─── Time Ago Helper ─────────────────────────────────────────────────────────

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<MissionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
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

    if (error) { console.error('Error fetching missions:', error); setLoading(false); return; }

    const missionsWithProfiles: MissionWithProfile[] = [];
    for (const mission of (missionsData || [])) {
      if (mission.requester_id) {
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('user_id', mission.requester_id).maybeSingle();
        missionsWithProfiles.push({ ...mission, requester_profile: profileData as Profile | null });
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
    const { error } = await supabase.from('rescue_requests')
      .update({ status: 'assigned', assigned_rescuer_id: user.id, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to accept mission');
    else { toast.success('Mission accepted! Navigate to the location.'); fetchMissions(); }
    setProcessingId(null);
  };

  const handleStartMission = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from('rescue_requests')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Failed to start mission');
    else { toast.success('Mission started!'); fetchMissions(); }
    setProcessingId(null);
  };

  const handleCompleteMission = async (id: string) => {
    setProcessingId(id);
    const { error } = await supabase.from('rescue_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) toast.error('Failed to complete mission');
    else { toast.success('Mission completed! Great work!'); fetchMissions(); }
    setProcessingId(null);
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
      status: m.status,
    }));

  const myMissions = missions.filter(m => m.assigned_rescuer_id === user?.id);
  const availableMissions = missions.filter(m => m.status === 'pending');
  const criticalCount = availableMissions.filter(m => m.severity === 'critical').length;
  const highCount = availableMissions.filter(m => m.severity === 'high').length;

  const filteredAvailable = availableMissions.filter(m =>
    filterSeverity === 'all' || m.severity === filterSeverity
  );

  const totalPeople = availableMissions.reduce((s, m) => s + (m.household_count || 0), 0);

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap animate-fade-up">
        <div className="flex items-center gap-3">
          <Link to="/rescuer">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
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
        <Button variant="outline" size="sm" onClick={fetchMissions} className="gap-2 rounded-xl">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* ── Situation Overview Banner ───────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Flood Response — Live</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-primary">{availableMissions.length}</span>
              <span className="text-sm text-muted-foreground mb-1">active requests</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg text-red-500">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-amber-500">{highCount}</p>
              <p className="text-xs text-muted-foreground">High</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg">{totalPeople}</p>
              <p className="text-xs text-muted-foreground">People</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-emerald-500">{myMissions.length}</p>
              <p className="text-xs text-muted-foreground">My Missions</p>
            </div>
          </div>
        </div>
        {/* Urgency bar */}
        {availableMissions.length > 0 && (
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex gap-0.5">
            {criticalCount > 0 && (
              <div
                className="h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${(criticalCount / availableMissions.length) * 100}%` }}
              />
            )}
            {highCount > 0 && (
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(highCount / availableMissions.length) * 100}%` }}
              />
            )}
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500 flex-1"
            />
          </div>
        )}
      </div>

      {/* ── Severity Filter Chips ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 animate-fade-up">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
          const meta = getSeverityMeta(sev);
          const count = availableMissions.filter(m => m.severity === sev).length;
          return (
            <button
              key={sev}
              onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
              className={`rounded-2xl p-3 text-center border-2 transition-all duration-150 ${
                filterSeverity === sev
                  ? `${meta.bg} ${meta.border} shadow-sm`
                  : 'bg-card border-border hover:border-muted-foreground/30'
              }`}
            >
              <p className={`text-xl font-bold ${meta.color}`}>{count}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{sev}</p>
              <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${meta.bar} transition-all`}
                  style={{ width: availableMissions.length ? `${(count / availableMissions.length) * 100}%` : '0%' }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-border animate-fade-up">
        <div className="px-4 py-3 flex items-center gap-2 border-b border-border bg-card">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">SOS Locations</span>
          <span className="ml-auto text-xs text-muted-foreground">{mapMarkers.length} markers</span>
        </div>
        <InteractiveMap
          markers={mapMarkers}
          height="280px"
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
      </div>

      {/* ── My Active Missions ───────────────────────────────────────────── */}
      {myMissions.length > 0 && (
        <div className="animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-fluid-lg">Your Active Missions</h2>
              <p className="text-xs text-muted-foreground">{myMissions.length} mission{myMissions.length > 1 ? 's' : ''} in progress</p>
            </div>
          </div>

          <div className="space-y-3">
            {myMissions.map((mission) => {
              const sevMeta = getSeverityMeta(mission.severity);
              return (
                <div key={mission.id} className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  {/* Top strip */}
                  <div className={`h-1 ${sevMeta.strip}`} />
                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${sevMeta.iconBg} flex items-center justify-center shrink-0 relative`}>
                          <Waves className={`w-5 h-5 ${sevMeta.iconColor}`} />
                          {sevMeta.pulse && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-fluid-base leading-tight">
                            {mission.requester_profile?.full_name || 'Unknown Requester'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            <Users className="w-3 h-3" />
                            <span>{mission.household_count} people</span>
                            <span>•</span>
                            <Activity className="w-3 h-3" />
                            <span>Score {mission.priority_score}</span>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sevMeta.badge}`}>
                        {sevMeta.label}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-2 bg-muted/50 rounded-xl px-3 py-2 mb-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{mission.location_address || `${mission.location_lat?.toFixed(4)}, ${mission.location_lng?.toFixed(4)}`}</span>
                    </div>

                    {/* Phone */}
                    {mission.requester_profile?.phone_number && (
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <a href={`tel:${mission.requester_profile.phone_number}`} className="text-primary hover:underline font-medium">
                          {mission.requester_profile.phone_number}
                        </a>
                      </div>
                    )}

                    {/* Special needs */}
                    {mission.special_needs && mission.special_needs.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {mission.special_needs.map((need, i) => (
                          <Badge key={i} variant="outline" className="text-xs rounded-lg">{need}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    {mission.situation_description && (
                      <div className="p-2.5 rounded-xl bg-muted/50 mb-3 flex gap-2 items-start">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground">{mission.situation_description}</p>
                      </div>
                    )}

                    <Separator className="my-3" />

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-xl h-9 text-xs gap-1.5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary"
                        onClick={() => {
                          if (mission.location_lat && mission.location_lng) {
                            setActiveRoute({ lat: mission.location_lat, lng: mission.location_lng, label: mission.requester_profile?.full_name || 'Rescuee' });
                          }
                        }}
                      >
                        <Navigation className="w-3 h-3" />
                        Route
                      </Button>
                      {mission.status === 'assigned' && (
                        <Button size="sm" className="flex-1 btn-hero rounded-xl h-9 gap-1.5" onClick={() => handleStartMission(mission.id)} disabled={processingId === mission.id}>
                          {processingId === mission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Start Rescue
                        </Button>
                      )}
                      {mission.status === 'in_progress' && (
                        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-9 gap-1.5" onClick={() => handleCompleteMission(mission.id)} disabled={processingId === mission.id}>
                          {processingId === mission.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Available Missions ──────────────────────────────────────────── */}
      <div className="animate-fade-up">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-fluid-lg">Available Missions</h2>
            <p className="text-xs text-muted-foreground">Sorted by priority score</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse bg-muted rounded-2xl h-48" />
            ))}
          </div>
        ) : filteredAvailable.length === 0 ? (
          <div className="text-center py-14 border-2 border-dashed border-border rounded-2xl">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <h3 className="font-display text-base font-semibold mb-1">No Pending Missions</h3>
            <p className="text-muted-foreground text-sm">All clear for now</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAvailable.map((mission, idx) => {
              const sevMeta = getSeverityMeta(mission.severity);
              return (
                <div
                  key={mission.id}
                  className={`bg-card rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up ${sevMeta.cardBorder}`}
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  {/* Top condition color strip */}
                  <div className={`h-1 ${sevMeta.strip}`} />

                  <div className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${sevMeta.iconBg} flex items-center justify-center shrink-0 relative`}>
                          <AlertTriangle className={`w-5 h-5 ${sevMeta.iconColor}`} />
                          {sevMeta.pulse && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm leading-tight truncate">
                            {mission.requester_profile?.full_name || 'Anonymous Request'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(mission.created_at)}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${sevMeta.badge}`}>
                        {sevMeta.label}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">People</span>
                        <span className="text-sm font-bold ml-auto">{mission.household_count}</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                        <TrendingUp className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Score</span>
                        <span className="text-sm font-bold ml-auto">{mission.priority_score}</span>
                      </div>
                    </div>

                    {/* Priority bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Urgency</span>
                        <span className={sevMeta.color}>{sevMeta.label}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${sevMeta.bar} rounded-full transition-all`}
                          style={{ width: mission.severity === 'critical' ? '100%' : mission.severity === 'high' ? '75%' : mission.severity === 'medium' ? '50%' : '25%' }} />
                      </div>
                    </div>

                    {/* Location */}
                    {mission.location_address && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {mission.location_address}
                      </p>
                    )}

                    {/* Special needs */}
                    {mission.special_needs && mission.special_needs.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {mission.special_needs.map((need, i) => (
                          <Badge key={i} variant="outline" className="text-xs rounded-lg">{need}</Badge>
                        ))}
                      </div>
                    )}

                    {/* Accept button */}
                    <Button
                      size="sm"
                      className="w-full mt-1 btn-hero rounded-xl h-9 gap-2"
                      onClick={() => handleAcceptMission(mission.id)}
                      disabled={processingId === mission.id}
                    >
                      {processingId === mission.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <CheckCircle className="w-4 h-4" />}
                      Accept Mission
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}