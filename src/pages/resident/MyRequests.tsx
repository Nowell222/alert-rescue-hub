import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Clock, CheckCircle, MapPin, Users, AlertTriangle, Phone, Navigation,
  X, ChevronRight, User, Calendar, FileText, Siren, Heart,
  Home, MessageSquare, Shield, Loader2, Radio, BadgeCheck,
  LocateFixed, Info
} from 'lucide-react';
import type { RescueRequest } from '@/types/database';

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

// Timeline steps per status
const STATUS_STEPS = ['pending', 'assigned', 'in_progress', 'completed'];

const STATUS_META: Record<string, { label: string; description: string; icon: any; color: string; bg: string; bar: string }> = {
  pending: {
    label: 'Pending',
    description: 'Your request has been submitted and is awaiting assignment.',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    bar: 'bg-amber-500',
  },
  assigned: {
    label: 'Assigned',
    description: 'A rescue team has been assigned and is preparing to respond.',
    icon: Radio,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    bar: 'bg-blue-500',
  },
  in_progress: {
    label: 'En Route',
    description: 'Your rescue team is on the way to your location.',
    icon: Navigation,
    color: 'text-primary',
    bg: 'bg-primary/10',
    bar: 'bg-primary',
  },
  completed: {
    label: 'Completed',
    description: 'Your rescue request has been successfully completed.',
    icon: BadgeCheck,
    color: 'text-green-600',
    bg: 'bg-green-100',
    bar: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    description: 'This request has been cancelled.',
    icon: X,
    color: 'text-muted-foreground',
    bg: 'bg-muted',
    bar: 'bg-muted-foreground',
  },
};

const SEVERITY_META: Record<string, { label: string; color: string; bg: string; description: string }> = {
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bg: 'bg-red-100',
    description: 'Life-threatening situation requiring immediate response.',
  },
  high: {
    label: 'High',
    color: 'text-amber-600',
    bg: 'bg-amber-100',
    description: 'Urgent situation with potential for serious harm.',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    description: 'Moderate situation that needs timely assistance.',
  },
  low: {
    label: 'Low',
    color: 'text-green-600',
    bg: 'bg-green-100',
    description: 'Non-urgent request for assistance.',
  },
};

function StatusTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status);
  if (status === 'cancelled') return null;

  return (
    <div className="flex items-center gap-0 w-full">
      {STATUS_STEPS.map((step, i) => {
        const meta = STATUS_META[step];
        const done = i < currentIdx;
        const active = i === currentIdx;
        const IconComp = meta.icon;

        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? 'bg-green-500 border-green-500' :
                active ? `${meta.bg} border-current ${meta.color}` :
                'bg-muted border-border'
              }`}>
                {done
                  ? <CheckCircle className="w-4 h-4 text-white" />
                  : <IconComp className={`w-4 h-4 ${active ? meta.color : 'text-muted-foreground'} ${active && step === 'in_progress' ? 'animate-pulse' : ''}`} />
                }
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${
                done ? 'text-green-600' : active ? meta.color : 'text-muted-foreground'
              }`}>
                {meta.label}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-5 rounded ${done ? 'bg-green-400' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RescueRequest | null>(null);

  useEffect(() => {
    fetchRequests();
    const channel = supabase
      .channel('my_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rescue_requests' }, fetchRequests)
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rescue_requests')
      .select('*')
      .eq('requester_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setRequests(data as RescueRequest[]);
    setLoading(false);
  };

  const getStatusBarColor = (status: string) => STATUS_META[status]?.bar || 'bg-muted-foreground';
  const getSeverityMeta = (severity: string) => SEVERITY_META[severity] || SEVERITY_META['medium'];
  const getStatusMeta = (status: string) => STATUS_META[status] || STATUS_META['pending'];

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
          <h1 className="font-display text-fluid-2xl font-bold">My Rescue Requests</h1>
          <p className="text-muted-foreground text-fluid-sm">Track all your submitted requests</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up stagger-1">
          <CardContent>
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Requests Yet</h3>
            <p className="text-fluid-sm text-muted-foreground mb-4">
              Use the Emergency SOS button when you need rescue assistance
            </p>
            <Link to="/resident/emergency">
              <Button className="btn-emergency rounded-2xl">Request Help Now</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request, idx) => {
            const statusMeta = getStatusMeta(request.status);
            const severityMeta = getSeverityMeta(request.severity);
            const StatusIcon = statusMeta.icon;
            const isActive = request.status === 'in_progress' || request.status === 'assigned';
            const isCompleted = request.status === 'completed';

            // Left accent color
            const accentColor =
              request.severity === 'critical' ? 'bg-red-500' :
              request.severity === 'high' ? 'bg-amber-500' :
              request.severity === 'medium' ? 'bg-blue-500' : 'bg-green-500';

            return (
              <button
                key={request.id}
                onClick={() => setSelected(request)}
                className="w-full text-left bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border border-border animate-fade-up group"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex">
                  {/* Left colored accent strip */}
                  <div className={`w-1.5 shrink-0 ${accentColor} rounded-l-2xl`} />

                  <div className="flex-1 p-4 min-w-0">
                    {/* Top row: severity + status + date */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Severity pill */}
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${severityMeta.bg} ${severityMeta.color} tracking-wide`}>
                          {severityMeta.label.toUpperCase()}
                        </span>

                        {/* Status pill */}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${statusMeta.bg} ${statusMeta.color}`}>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />
                          )}
                          {isCompleted && <CheckCircle className="w-3 h-3" />}
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* Date + chevron */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="text-right">
                          <p className="text-xs font-medium text-foreground/70">
                            {new Date(request.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all ml-1" />
                      </div>
                    </div>

                    {/* Middle row: icon + key info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 rounded-xl ${statusMeta.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className={`w-4 h-4 ${statusMeta.color} ${request.status === 'in_progress' ? 'animate-pulse' : ''}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span>{request.household_count} {request.household_count === 1 ? 'person' : 'people'} in household</span>
                        </div>
                        {request.location_address && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{request.location_address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom row: special needs + mini progress */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      {/* Special needs tags */}
                      <div className="flex gap-1 flex-wrap">
                        {request.special_needs && request.special_needs.length > 0 ? (
                          <>
                            {request.special_needs.slice(0, 2).map((need, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-medium flex items-center gap-1">
                                <Heart className="w-2.5 h-2.5" />
                                {need.replace(/_/g, ' ')}
                              </span>
                            ))}
                            {request.special_needs.length > 2 && (
                              <span className="text-xs px-2 py-0.5 rounded-lg bg-muted text-muted-foreground border border-border">
                                +{request.special_needs.length - 2}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">No special needs noted</span>
                        )}
                      </div>

                      {/* Mini step dots */}
                      {request.status !== 'cancelled' && (
                        <div className="flex items-center gap-1">
                          {STATUS_STEPS.map((step, si) => {
                            const currentIdx = STATUS_STEPS.indexOf(request.status);
                            const done = si <= currentIdx;
                            return (
                              <div
                                key={step}
                                className={`rounded-full transition-all ${
                                  done
                                    ? `${accentColor} ${si === currentIdx ? 'w-4 h-2' : 'w-2 h-2'}`
                                    : 'w-2 h-2 bg-muted'
                                }`}
                              />
                            );
                          })}
                        </div>
                      )}

                      {request.status === 'cancelled' && (
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Cancelled</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (() => {
        const statusMeta = getStatusMeta(selected.status);
        const severityMeta = getSeverityMeta(selected.severity);
        const StatusIcon = statusMeta.icon;

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <div className="bg-background w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">

              {/* Modal Header */}
              <div className={`p-5 rounded-t-3xl sm:rounded-t-3xl ${
                selected.severity === 'critical' ? 'bg-red-500' :
                selected.severity === 'high' ? 'bg-amber-500' :
                selected.severity === 'medium' ? 'bg-blue-500' : 'bg-green-500'
              } text-white`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Siren className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs uppercase tracking-wider font-medium">Rescue Request</p>
                      <h2 className="font-bold text-lg leading-tight">{severityMeta.label} Severity</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-white/85 text-sm">{severityMeta.description}</p>
                <div className="flex items-center gap-3 mt-3 text-white/70 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selected.created_at).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    ID: {selected.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 flex-1 overflow-y-auto">

                {/* Status Timeline */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Radio className="w-4 h-4" /> Request Status
                  </h3>
                  <StatusTimeline status={selected.status} />
                  <div className={`mt-4 rounded-2xl p-3 flex items-start gap-3 ${statusMeta.bg}`}>
                    <StatusIcon className={`w-5 h-5 shrink-0 mt-0.5 ${statusMeta.color} ${selected.status === 'in_progress' ? 'animate-pulse' : ''}`} />
                    <div>
                      <p className={`font-semibold text-sm ${statusMeta.color}`}>{statusMeta.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{statusMeta.description}</p>
                    </div>
                  </div>
                </section>

                {/* Location */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <LocateFixed className="w-4 h-4" /> Location Details
                  </h3>
                  <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                    {selected.location_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">{selected.location_address}</p>
                        </div>
                      </div>
                    )}
                    {selected.location_lat && selected.location_lng && (
                      <div className="flex items-start gap-2">
                        <Navigation className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Coordinates</p>
                          <p className="text-sm font-mono">{Number(selected.location_lat).toFixed(5)}, {Number(selected.location_lng).toFixed(5)}</p>
                        </div>
                      </div>
                    )}
                    {selected.zone_id && (
                      <div className="flex items-start gap-2">
                        <Home className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Zone</p>
                          <p className="text-sm font-medium">{selected.zone_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Household Info */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Household Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted/50 rounded-2xl p-4 text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground">Total People</p>
                      <p className="text-2xl font-bold mt-0.5">{selected.household_count}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-4 text-center">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-xs text-muted-foreground">Special Needs</p>
                      <p className="text-2xl font-bold mt-0.5">
                        {selected.special_needs?.length || 0}
                      </p>
                    </div>
                  </div>

                  {selected.special_needs && selected.special_needs.length > 0 && (
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                      <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> Special Needs / Vulnerabilities
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selected.special_needs.map((need, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 font-medium">
                            {need}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Additional Notes */}
                {selected.notes && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Additional Notes
                    </h3>
                    <div className="bg-muted/50 rounded-2xl p-4">
                      <p className="text-sm leading-relaxed text-foreground/80">{selected.notes}</p>
                    </div>
                  </section>
                )}

                {/* Responder Info (if assigned or in progress) */}
                {(selected.status === 'assigned' || selected.status === 'in_progress' || selected.status === 'completed') && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" /> Assigned Responder
                    </h3>
                    <div className="border border-border rounded-2xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        {selected.responder_id ? (
                          <>
                            <p className="font-semibold text-sm">Rescue Team</p>
                            <p className="text-xs text-muted-foreground">ID: {selected.responder_id.slice(0, 8).toUpperCase()}</p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-sm">Team Being Assigned</p>
                            <p className="text-xs text-muted-foreground">A rescuer will be confirmed shortly</p>
                          </>
                        )}
                      </div>
                      {selected.status === 'in_progress' && (
                        <a href="tel:0431234567">
                          <Button size="sm" className="gap-1.5 rounded-xl bg-green-500 hover:bg-green-600 text-white">
                            <Phone className="w-3.5 h-3.5" />
                            Call
                          </Button>
                        </a>
                      )}
                    </div>
                  </section>
                )}

                {/* Completion Info */}
                {selected.status === 'completed' && selected.completed_at && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Completion Details
                    </h3>
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-700">Request Successfully Completed</span>
                      </div>
                      <p className="text-xs text-green-600">
                        Completed on {new Date(selected.completed_at).toLocaleString()}
                      </p>
                      {selected.completion_notes && (
                        <p className="text-sm text-green-700 mt-2 border-t border-green-200 pt-2">
                          {selected.completion_notes}
                        </p>
                      )}
                    </div>
                  </section>
                )}

                {/* Cancellation Info */}
                {selected.status === 'cancelled' && (
                  <section>
                    <div className="bg-muted rounded-2xl p-4 flex items-start gap-3">
                      <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">Request Cancelled</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          This rescue request has been cancelled. If you still need help, please submit a new request.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-border flex gap-3">
                {(selected.status === 'pending' || selected.status === 'assigned') && (
                  <Button variant="outline" className="flex-1 rounded-xl text-red-500 border-red-200 hover:bg-red-50">
                    Cancel Request
                  </Button>
                )}
                {selected.status === 'cancelled' || selected.status === 'completed' ? (
                  <Link to="/resident/emergency-sos" className="flex-1">
                    <Button className="w-full rounded-xl btn-emergency gap-2">
                      <Siren className="w-4 h-4" />
                      New Request
                    </Button>
                  </Link>
                ) : (
                  <Link to="/resident/emergency-sos" className="flex-1">
                    <Button variant="outline" className="w-full rounded-xl gap-2">
                      <Siren className="w-4 h-4" />
                      New Request
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}