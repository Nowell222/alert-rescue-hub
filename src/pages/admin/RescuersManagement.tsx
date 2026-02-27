import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Users,
  Search,
  Radio,
  MapPin,
  Phone,
  CheckCircle,
  Clock,
  RefreshCw,
  Shield,
  TrendingUp,
  Activity,
  Hash,
  Waves,
  Star,
  XCircle,
} from 'lucide-react';
import type { Profile } from '@/types/database';

interface RescuerInfo {
  user_id: string;
  role: string;
  assigned_zone: string | null;
  profile?: Profile | null;
  completedMissions: number;
  activeMissions: number;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const getStatusMeta = (active: number) =>
  active > 0
    ? { label: 'On Mission', color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', dot: 'bg-amber-500', pulse: true }
    : { label: 'Available', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', dot: 'bg-emerald-500', pulse: false };

// ─── Rank Helper ──────────────────────────────────────────────────────────────

const getRank = (completed: number) => {
  if (completed >= 50) return { label: 'Elite', color: 'text-amber-500', icon: '🏅' };
  if (completed >= 20) return { label: 'Senior', color: 'text-blue-500', icon: '⭐' };
  if (completed >= 5) return { label: 'Active', color: 'text-emerald-500', icon: '✅' };
  return { label: 'Rookie', color: 'text-slate-500', icon: '🔰' };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function RescuersManagementPage() {
  const [rescuers, setRescuers] = useState<RescuerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'available'>('all');

  useEffect(() => {
    fetchRescuers();
  }, []);

  const fetchRescuers = async () => {
    setRefreshing(true);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'rescuer');

    if (!roleData) { setLoading(false); setRefreshing(false); return; }

    const rescuerList: RescuerInfo[] = [];
    for (const role of roleData) {
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('user_id', role.user_id).maybeSingle();
      const { count: completedCount } = await supabase
        .from('rescue_requests').select('*', { count: 'exact', head: true })
        .eq('assigned_rescuer_id', role.user_id).eq('status', 'completed');
      const { count: activeCount } = await supabase
        .from('rescue_requests').select('*', { count: 'exact', head: true })
        .eq('assigned_rescuer_id', role.user_id).in('status', ['assigned', 'in_progress']);

      rescuerList.push({
        user_id: role.user_id,
        role: role.role,
        assigned_zone: role.assigned_zone,
        profile: profileData as Profile | null,
        completedMissions: completedCount || 0,
        activeMissions: activeCount || 0,
      });
    }

    setRescuers(rescuerList);
    setLoading(false);
    setRefreshing(false);
  };

  const totalActive = rescuers.filter(r => r.activeMissions > 0).length;
  const totalAvailable = rescuers.filter(r => r.activeMissions === 0).length;
  const totalCompleted = rescuers.reduce((s, r) => s + r.completedMissions, 0);

  const filtered = rescuers.filter(r => {
    const matchesSearch =
      (r.profile?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.assigned_zone || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && r.activeMissions > 0) ||
      (filterStatus === 'available' && r.activeMissions === 0);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap animate-fade-up">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Radio className="w-6 h-6 text-primary" />
              Rescuer Management
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Monitor and manage rescue team members</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRescuers} disabled={refreshing} className="gap-2 rounded-xl">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── Overview Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rescue Team</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-primary">{rescuers.length}</span>
              <span className="text-sm text-muted-foreground mb-1">registered rescuers</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg text-amber-500">{totalActive}</p>
              <p className="text-xs text-muted-foreground">On Mission</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-emerald-500">{totalAvailable}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg">{totalCompleted}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </div>
        {/* Deployment bar */}
        {rescuers.length > 0 && (
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex gap-0.5">
            <div
              className="h-full bg-amber-500 rounded-l-full transition-all duration-500"
              style={{ width: `${(totalActive / rescuers.length) * 100}%` }}
            />
            <div
              className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
              style={{ width: `${(totalAvailable / rescuers.length) * 100}%` }}
            />
          </div>
        )}
        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />On Mission</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Available</span>
        </div>
      </div>

      {/* ── Status Filter Chips ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 animate-fade-up">
        {[
          { value: 'all', label: 'All', count: rescuers.length, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', bar: 'bg-primary' },
          { value: 'active', label: 'On Mission', count: totalActive, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', bar: 'bg-amber-500' },
          { value: 'available', label: 'Available', count: totalAvailable, color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200', bar: 'bg-emerald-500' },
        ].map(chip => (
          <button
            key={chip.value}
            onClick={() => setFilterStatus(chip.value as typeof filterStatus)}
            className={`rounded-2xl p-3 text-center border-2 transition-all duration-150 ${
              filterStatus === chip.value
                ? `${chip.bg} ${chip.border} shadow-sm`
                : 'bg-card border-border hover:border-muted-foreground/30'
            }`}
          >
            <p className={`text-xl font-bold ${chip.color}`}>{chip.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{chip.label}</p>
            <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${chip.bar} transition-all`}
                style={{ width: rescuers.length ? `${(chip.count / rescuers.length) * 100}%` : '0%' }} />
            </div>
          </button>
        ))}
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="relative animate-fade-up">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or zone..."
          className="pl-9 rounded-xl border-border"
        />
      </div>

      {/* ── Rescuer Grid ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-muted rounded-2xl h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <h3 className="font-display text-base font-semibold mb-1">No Rescuers Found</h3>
          <p className="text-muted-foreground text-sm">
            {search ? 'Try a different search term' : 'No rescuers registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((rescuer, idx) => {
            const statusMeta = getStatusMeta(rescuer.activeMissions);
            const rank = getRank(rescuer.completedMissions);
            const initials = rescuer.profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'R';
            const completionRate = rescuer.completedMissions + rescuer.activeMissions > 0
              ? Math.round((rescuer.completedMissions / (rescuer.completedMissions + rescuer.activeMissions)) * 100)
              : 0;

            return (
              <div
                key={rescuer.user_id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Top strip — green if available, amber if on mission */}
                <div className={`h-1 ${rescuer.activeMissions > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />

                <div className="p-4">
                  {/* Header — Avatar + Name + Status */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative shrink-0">
                      <Avatar className="w-12 h-12 rounded-xl">
                        <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusMeta.dot} ${statusMeta.pulse ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate">
                        {rescuer.profile?.full_name || 'Unknown Rescuer'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                          {statusMeta.label}
                        </span>
                        <span className="text-xs">{rank.icon}</span>
                        <span className={`text-xs font-medium ${rank.color}`}>{rank.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats pills */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Done</span>
                      <span className="text-sm font-bold ml-auto">{rescuer.completedMissions}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <Activity className="w-3 h-3 text-amber-500" />
                      <span className="text-xs text-muted-foreground">Active</span>
                      <span className="text-sm font-bold ml-auto">{rescuer.activeMissions}</span>
                    </div>
                  </div>

                  {/* Success rate bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Completion Rate</span>
                      <span className="text-emerald-600 font-medium">{completionRate}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  {rescuer.profile?.phone_number && (
                    <div className="flex items-center gap-2 text-xs mb-1.5">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <a href={`tel:${rescuer.profile.phone_number}`} className="text-primary hover:underline font-medium">
                        {rescuer.profile.phone_number}
                      </a>
                    </div>
                  )}
                  {rescuer.assigned_zone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>Zone: <span className="font-medium text-foreground">{rescuer.assigned_zone}</span></span>
                    </div>
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