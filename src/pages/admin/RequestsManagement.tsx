import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  LifeBuoy,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  XCircle,
  Loader2,
  Activity,
  TrendingUp,
  Waves,
  ShieldCheck,
  Ban,
  Play,
  UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescueRequest } from '@/types/database';

// ─── Severity Config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: {
    label: 'Critical', color: 'text-red-600', bg: 'bg-red-100',
    border: 'border-red-200', bar: 'bg-red-500', strip: 'bg-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200', width: '100%',
    iconBg: 'bg-red-100', iconColor: 'text-red-600', pulse: true,
  },
  high: {
    label: 'High', color: 'text-amber-600', bg: 'bg-amber-100',
    border: 'border-amber-200', bar: 'bg-amber-500', strip: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200', width: '75%',
    iconBg: 'bg-amber-100', iconColor: 'text-amber-600', pulse: false,
  },
  medium: {
    label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100',
    border: 'border-blue-200', bar: 'bg-blue-500', strip: 'bg-blue-400',
    badge: 'bg-blue-100 text-blue-700 border-blue-200', width: '50%',
    iconBg: 'bg-blue-100', iconColor: 'text-blue-600', pulse: false,
  },
  low: {
    label: 'Low', color: 'text-slate-500', bg: 'bg-slate-100',
    border: 'border-slate-200', bar: 'bg-slate-400', strip: 'bg-slate-300',
    badge: 'bg-slate-100 text-slate-600 border-slate-200', width: '25%',
    iconBg: 'bg-slate-100', iconColor: 'text-slate-500', pulse: false,
  },
};

const getSeverityMeta = (s: string) =>
  SEVERITY_CONFIG[s as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.medium;

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100',
    border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bar: 'bg-amber-400',
  },
  assigned: {
    label: 'Assigned', color: 'text-blue-600', bg: 'bg-blue-100',
    border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700 border-blue-200',
    bar: 'bg-blue-400',
  },
  in_progress: {
    label: 'In Progress', color: 'text-primary', bg: 'bg-primary/10',
    border: 'border-primary/20', badge: 'bg-primary/10 text-primary border-primary/20',
    bar: 'bg-primary',
  },
  completed: {
    label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-100',
    border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bar: 'bg-emerald-500',
  },
  cancelled: {
    label: 'Cancelled', color: 'text-slate-400', bg: 'bg-slate-100',
    border: 'border-slate-200', badge: 'bg-slate-100 text-slate-500 border-slate-200',
    bar: 'bg-slate-300',
  },
};

const getStatusMeta = (s: string) =>
  STATUS_CONFIG[s as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;

// ─── Time Ago ─────────────────────────────────────────────────────────────────

const timeAgo = (date: string) => {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Status Filter Tabs ───────────────────────────────────────────────────────

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RequestsManagementPage() {
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel('admin_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchRequests)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, []);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('rescue_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data as RescueRequest[]);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setProcessingId(id);
    const update: Record<string, string> = { status };
    if (status === 'completed' || status === 'cancelled')
      update.completed_at = new Date().toISOString();
    const { error } = await supabase.from('rescue_requests').update(update).eq('id', id);
    if (!error) { toast.success(`Status updated to ${status}`); fetchRequests(); }
    else toast.error('Failed to update status');
    setProcessingId(null);
  };

  const statusCounts = {
    pending: requests.filter(r => r.status === 'pending').length,
    assigned: requests.filter(r => r.status === 'assigned').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  const sevCounts = {
    critical: requests.filter(r => r.severity === 'critical').length,
    high: requests.filter(r => r.severity === 'high').length,
    medium: requests.filter(r => r.severity === 'medium').length,
    low: requests.filter(r => r.severity === 'low').length,
  };

  const totalPeople = requests.reduce((s, r) => s + (r.household_count || 0), 0);
  const activeCount = statusCounts.pending + statusCounts.assigned + statusCounts.in_progress;

  const filtered = requests.filter(r => {
    const matchesStatus = filter === 'all' || r.status === filter;
    const matchesSev = filterSeverity === 'all' || r.severity === filterSeverity;
    const matchesSearch = !search ||
      (r.location_address || '').toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSev && matchesSearch;
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
              <LifeBuoy className="w-6 h-6 text-primary" />
              Rescue Requests
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Manage all rescue operations</p>
          </div>
        </div>
      </div>

      {/* ── Overview Banner ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Operations Overview</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-primary">{requests.length}</span>
              <span className="text-sm text-muted-foreground mb-1">total requests</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg text-amber-500">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-emerald-500">{statusCounts.completed}</p>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg">{totalPeople}</p>
              <p className="text-xs text-muted-foreground">People</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-red-500">{sevCounts.critical}</p>
              <p className="text-xs text-muted-foreground">Critical</p>
            </div>
          </div>
        </div>
        {/* Stacked status bar */}
        {requests.length > 0 && (
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden flex gap-0.5">
            {statusCounts.pending > 0 && (
              <div className="h-full bg-amber-400 rounded-l-full transition-all duration-500"
                style={{ width: `${(statusCounts.pending / requests.length) * 100}%` }} />
            )}
            {statusCounts.assigned > 0 && (
              <div className="h-full bg-blue-400 transition-all duration-500"
                style={{ width: `${(statusCounts.assigned / requests.length) * 100}%` }} />
            )}
            {statusCounts.in_progress > 0 && (
              <div className="h-full bg-primary transition-all duration-500"
                style={{ width: `${(statusCounts.in_progress / requests.length) * 100}%` }} />
            )}
            {statusCounts.completed > 0 && (
              <div className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                style={{ width: `${(statusCounts.completed / requests.length) * 100}%` }} />
            )}
          </div>
        )}
        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Pending</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />Assigned</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" />In Progress</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Completed</span>
        </div>
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
                <div className={`h-full ${meta.bar} transition-all`}
                  style={{ width: requests.length ? `${(count / requests.length) * 100}%` : '0%' }} />
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Status Tabs + Search ─────────────────────────────────────────── */}
      <div className="space-y-2 animate-fade-up">
        {/* Tab strip */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_TABS.map(tab => {
            const count = tab.value === 'all'
              ? requests.length
              : statusCounts[tab.value as keyof typeof statusCounts] ?? 0;
            const active = filter === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold border transition-all duration-150 ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {tab.label}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-muted'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by location..."
            className="pl-9 rounded-xl border-border"
          />
        </div>
      </div>

      {/* ── Requests Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-muted rounded-2xl h-52" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-muted flex items-center justify-center">
            <CheckCircle className="w-7 h-7 text-muted-foreground/30" />
          </div>
          <h3 className="font-display text-base font-semibold mb-1">No Requests Found</h3>
          <p className="text-muted-foreground text-sm">
            {filter === 'all' && filterSeverity === 'all' && !search
              ? 'No rescue requests yet'
              : 'Try adjusting your filters'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((request, idx) => {
            const sevMeta = getSeverityMeta(request.severity);
            const statusMeta = getStatusMeta(request.status);
            const isProcessing = processingId === request.id;

            return (
              <div
                key={request.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                {/* Top color strip */}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${sevMeta.badge}`}>
                            {sevMeta.label}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusMeta.badge}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{timeAgo(request.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">People</span>
                      <span className="text-sm font-bold ml-auto">{request.household_count}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <TrendingUp className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Score</span>
                      <span className="text-sm font-bold ml-auto">{request.priority_score}</span>
                    </div>
                  </div>

                  {/* Severity bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Urgency</span>
                      <span className={sevMeta.color}>{sevMeta.label}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${sevMeta.bar} rounded-full transition-all`}
                        style={{ width: sevMeta.width }} />
                    </div>
                  </div>

                  {/* Location */}
                  {request.location_address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {request.location_address}
                    </p>
                  )}

                  {/* Special needs */}
                  {request.special_needs && request.special_needs.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {request.special_needs.map((need, i) => (
                        <Badge key={i} variant="outline" className="text-xs rounded-lg">{need}</Badge>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  {(request.status === 'pending' || request.status === 'assigned' || request.status === 'in_progress') && (
                    <div className="flex gap-2 mt-1">
                      {request.status === 'pending' && (
                        <Button size="sm" className="flex-1 btn-hero rounded-xl h-8 text-xs gap-1.5"
                          onClick={() => updateStatus(request.id, 'assigned')} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                          Assign
                        </Button>
                      )}
                      {request.status === 'assigned' && (
                        <Button size="sm" className="flex-1 btn-hero rounded-xl h-8 text-xs gap-1.5"
                          onClick={() => updateStatus(request.id, 'in_progress')} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          Start
                        </Button>
                      )}
                      {request.status === 'in_progress' && (
                        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-8 text-xs gap-1.5"
                          onClick={() => updateStatus(request.id, 'completed')} disabled={isProcessing}>
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                          Complete
                        </Button>
                      )}
                      {['pending', 'assigned'].includes(request.status) && (
                        <Button size="sm" variant="ghost"
                          className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => updateStatus(request.id, 'cancelled')} disabled={isProcessing}>
                          <Ban className="w-3.5 h-3.5" />
                        </Button>
                      )}
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