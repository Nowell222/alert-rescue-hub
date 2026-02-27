import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Users,
  MapPin,
  Trophy,
  Waves,
  TrendingUp,
  Calendar,
  Search,
  Star,
  Zap,
  Shield,
  Activity,
} from 'lucide-react';
import type { RescueRequest } from '@/types/database';

// ─── Severity Config (mirrors MissionsPage) ──────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical', color: 'text-red-600', bg: 'bg-red-100',
    border: 'border-red-200', bar: 'bg-red-500', strip: 'bg-red-500',
    iconBg: 'bg-red-100', iconColor: 'text-red-600',
    badge: 'bg-red-100 text-red-700 border-red-200', width: 'w-full',
  },
  high: {
    label: 'High', color: 'text-amber-600', bg: 'bg-amber-100',
    border: 'border-amber-200', bar: 'bg-amber-500', strip: 'bg-amber-500',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700 border-amber-200', width: 'w-3/4',
  },
  medium: {
    label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100',
    border: 'border-blue-200', bar: 'bg-blue-500', strip: 'bg-blue-400',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200', width: 'w-1/2',
  },
  low: {
    label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100',
    border: 'border-slate-200', bar: 'bg-slate-400', strip: 'bg-slate-300',
    iconBg: 'bg-slate-100', iconColor: 'text-slate-500',
    badge: 'bg-slate-100 text-slate-600 border-slate-200', width: 'w-1/4',
  },
};

const getSeverityMeta = (severity: string) =>
  SEVERITY_CONFIG[severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.medium;

// ─── Duration Helper ─────────────────────────────────────────────────────────

const calcDuration = (created: string, completed: string | null) => {
  if (!completed) return '—';
  const diff = Math.floor((new Date(completed).getTime() - new Date(created).getTime()) / 60000);
  if (diff < 60) return `${diff}m`;
  return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function MissionHistoryPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rescue_requests')
      .select('*')
      .eq('assigned_rescuer_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });
    if (data) setMissions(data as RescueRequest[]);
    setLoading(false);
  };

  const totalPeopleRescued = missions.reduce((sum, m) => sum + (m.household_count || 1), 0);
  const criticalCount = missions.filter(m => m.severity === 'critical').length;
  const avgScore = missions.length
    ? Math.round(missions.reduce((s, m) => s + (m.priority_score || 0), 0) / missions.length)
    : 0;

  const sevCounts = {
    critical: missions.filter(m => m.severity === 'critical').length,
    high: missions.filter(m => m.severity === 'high').length,
    medium: missions.filter(m => m.severity === 'medium').length,
    low: missions.filter(m => m.severity === 'low').length,
  };

  const filtered = missions.filter(m => {
    const matchesSev = filterSeverity === 'all' || m.severity === filterSeverity;
    const matchesSearch = !search ||
      (m.location_address || '').toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

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
              <Trophy className="w-6 h-6 text-amber-500" />
              Mission History
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Your completed rescue operations</p>
          </div>
        </div>
      </div>

      {/* ── Achievement Banner ───────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-200/40 rounded-2xl p-4 animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rescue Record</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-amber-500">{missions.length}</span>
              <span className="text-sm text-muted-foreground mb-1">missions completed</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg text-emerald-500">{totalPeopleRescued}</p>
              <p className="text-xs text-muted-foreground">Rescued</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-red-500">{criticalCount}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
          </div>
        </div>
        {/* Progress fill based on missions */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-500"
            style={{ width: missions.length > 0 ? `${Math.min((missions.length / 50) * 100, 100)}%` : '0%' }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{missions.length}/50 missions to next rank</p>
      </div>

      {/* ── Severity Filter Chips ─────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 animate-fade-up">
        {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
          const meta = getSeverityMeta(sev);
          const count = sevCounts[sev];
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
                <div
                  className={`h-full ${meta.bar}`}
                  style={{ width: missions.length ? `${(count / missions.length) * 100}%` : '0%' }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      {missions.length > 0 && (
        <div className="relative animate-fade-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by location..."
            className="pl-9 rounded-xl border-border"
          />
        </div>
      )}

      {/* ── History List ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-muted rounded-2xl h-44" />
          ))}
        </div>
      ) : missions.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Trophy className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">No Completed Missions</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Your completed rescue operations will appear here
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No missions match your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((mission, idx) => {
            const sevMeta = getSeverityMeta(mission.severity);
            const duration = calcDuration(mission.created_at, mission.completed_at || null);
            return (
              <div
                key={mission.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Top strip */}
                <div className={`h-1 ${sevMeta.strip}`} />

                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0`}>
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight">
                          {mission.completed_at
                            ? new Date(mission.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mission.completed_at
                            ? new Date(mission.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </p>
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
                      <span className="text-xs text-muted-foreground">Rescued</span>
                      <span className="text-sm font-bold ml-auto">{mission.household_count || 1}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Duration</span>
                      <span className="text-sm font-bold ml-auto">{duration}</span>
                    </div>
                  </div>

                  {/* Severity bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Severity</span>
                      <span className={sevMeta.color}>{sevMeta.label}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${sevMeta.bar} ${sevMeta.width} rounded-full`} />
                    </div>
                  </div>

                  {/* Location */}
                  {mission.location_address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {mission.location_address}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}