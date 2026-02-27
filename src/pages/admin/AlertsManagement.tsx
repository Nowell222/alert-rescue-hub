import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Bell,
  Plus,
  Send,
  AlertTriangle,
  Info,
  Trash2,
  X,
  Clock,
  MapPin,
  ChevronRight,
  Shield,
  Zap,
  ToggleLeft,
  ToggleRight,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import type { WeatherAlert, AlertPriority } from '@/types/database';

const QUICK_TEMPLATES = [
  {
    title: 'Flood Warning',
    message: 'Water levels are rising. Stay alert and prepare for possible evacuation.',
    priority: 'warning' as AlertPriority,
  },
  {
    title: 'Evacuation Order',
    message: 'Immediate evacuation required. Proceed to nearest evacuation center.',
    priority: 'critical' as AlertPriority,
  },
  {
    title: 'All Clear',
    message: 'Flood waters have receded. It is now safe to return home.',
    priority: 'informational' as AlertPriority,
  },
];

export default function AlertsManagementPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<WeatherAlert | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AlertPriority>('informational');
  const [targetZones, setTargetZones] = useState('');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('weather_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setAlerts(data as WeatherAlert[]);
    setLoading(false);
  };

  const createAlert = async () => {
    if (!user || !title.trim() || !message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    const zones = targetZones.trim()
      ? targetZones.split(',').map((z) => z.trim()).filter(Boolean)
      : null;

    const { error } = await supabase.from('weather_alerts').insert({
      title: title.trim(),
      message: message.trim(),
      priority,
      target_zones: zones,
      created_by: user.id,
      is_active: true,
    });

    if (error) {
      toast.error('Failed to create alert');
    } else {
      toast.success('Alert broadcasted!');
      setTitle('');
      setMessage('');
      setPriority('informational');
      setTargetZones('');
      setShowForm(false);
      fetchAlerts();
    }
  };

  const toggleAlert = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from('weather_alerts')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (!error) {
      toast.success(isActive ? 'Alert deactivated' : 'Alert activated');
      fetchAlerts();
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => prev ? { ...prev, is_active: !isActive } : null);
      }
    }
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase.from('weather_alerts').delete().eq('id', id);

    if (!error) {
      toast.success('Alert deleted');
      setSelectedAlert(null);
      fetchAlerts();
    }
  };

  const getPriorityConfig = (p: string) => {
    switch (p) {
      case 'critical':
        return {
          bg: 'bg-red-50 border-l-4 border-red-500',
          icon: AlertTriangle,
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-700 border border-red-200',
          stripBg: 'bg-red-500',
          dot: 'bg-red-500',
          label: 'CRITICAL',
          numberBg: 'bg-red-100 text-red-600',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-l-4 border-amber-500',
          icon: AlertTriangle,
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700 border border-amber-200',
          stripBg: 'bg-amber-500',
          dot: 'bg-amber-500',
          label: 'WARNING',
          numberBg: 'bg-amber-100 text-amber-600',
        };
      default:
        return {
          bg: 'bg-blue-50 border-l-4 border-blue-400',
          icon: Info,
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700 border border-blue-200',
          stripBg: 'bg-blue-500',
          dot: 'bg-blue-500',
          label: 'INFO',
          numberBg: 'bg-blue-100 text-blue-600',
        };
    }
  };

  const applyTemplate = (template: (typeof QUICK_TEMPLATES)[number]) => {
    setTitle(template.title);
    setMessage(template.message);
    setPriority(template.priority);
    setShowForm(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <Link to="/admin">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-warning" />
            Alert Management
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Broadcast alerts to residents</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="gap-1.5 shrink-0 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          New Alert
        </Button>
      </div>

      {/* Quick Templates */}
      <div className="animate-fade-up stagger-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" /> Quick Templates
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_TEMPLATES.map((template, i) => {
            const cfg = getPriorityConfig(template.priority);
            const IconComponent = cfg.icon;
            return (
              <button
                key={i}
                onClick={() => applyTemplate(template)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all hover:shadow-sm ${cfg.badge}`}
              >
                <IconComponent className="w-3 h-3" />
                {template.title}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up stagger-2">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Alerts Created</h3>
            <p className="text-fluid-sm text-muted-foreground">Create your first alert to notify residents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, idx) => {
            const cfg = getPriorityConfig(alert.priority);
            const IconComponent = cfg.icon;
            return (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up ${cfg.bg} ${!alert.is_active ? 'opacity-50' : ''}`}
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
                      {!alert.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-fluid-sm text-foreground/75 mb-2 line-clamp-2">{alert.message}</p>
                    <div className="flex items-center gap-4 flex-wrap">
                      {alert.target_zones && alert.target_zones.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {alert.target_zones.join(', ')}
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

      {/* Detail / Manage Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAlert(null); }}
        >
          <div className="bg-background w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
            {(() => {
              const cfg = getPriorityConfig(selectedAlert.priority);
              const IconComponent = cfg.icon;
              return (
                <>
                  {/* Colored top strip */}
                  <div className={`rounded-t-3xl sm:rounded-t-3xl p-5 ${cfg.stripBg} text-white`}>
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
                      <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                        selectedAlert.is_active ? 'bg-white/20 text-white' : 'bg-black/20 text-white/60'
                      }`}>
                        {selectedAlert.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Modal body */}
                  <div className="p-5 space-y-5 flex-1">

                    {/* Alert Details */}
                    <section>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Alert Details
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="bg-muted/50 rounded-2xl p-3 text-center">
                          <Shield className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Priority</p>
                          <p className={`font-semibold text-sm mt-0.5 capitalize`}>{selectedAlert.priority}</p>
                        </div>
                        <div className="bg-muted/50 rounded-2xl p-3 text-center">
                          <MapPin className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="font-semibold text-sm mt-0.5">
                            {selectedAlert.target_zones?.length
                              ? `${selectedAlert.target_zones.length} Zone${selectedAlert.target_zones.length > 1 ? 's' : ''}`
                              : 'All Zones'}
                          </p>
                        </div>
                        <div className="bg-muted/50 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                          <Bell className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">Status</p>
                          <p className={`font-semibold text-sm mt-0.5 ${selectedAlert.is_active ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {selectedAlert.is_active ? 'Broadcasting' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                    </section>

                    {/* Target Zones */}
                    {selectedAlert.target_zones && selectedAlert.target_zones.length > 0 && (
                      <section>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" /> Target Zones
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedAlert.target_zones.map((zone, i) => (
                            <div key={i} className="flex items-center gap-1.5 bg-muted/50 border border-border rounded-xl px-3 py-2">
                              <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${cfg.numberBg}`}>{i + 1}</span>
                              <span className="text-sm font-medium">{zone}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                  </div>

                  {/* Action Footer */}
                  <div className="p-4 border-t border-border flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 gap-2"
                      onClick={() => toggleAlert(selectedAlert.id, selectedAlert.is_active)}
                    >
                      {selectedAlert.is_active
                        ? <><ToggleRight className="w-4 h-4 text-amber-500" /> Deactivate</>
                        : <><ToggleLeft className="w-4 h-4 text-green-600" /> Activate</>
                      }
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl h-11 px-4 text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
                      onClick={() => deleteAlert(selectedAlert.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Create Alert Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-background w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
            {/* Form header strip */}
            <div className="rounded-t-3xl p-5 bg-primary text-primary-foreground">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Admin Action</p>
                    <h2 className="font-bold text-lg leading-tight">Create New Alert</h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Form body */}
            <div className="p-5 space-y-4 flex-1">
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Flood Warning for Zone 3"
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter alert details..."
                  rows={3}
                  className="mt-1.5 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as AlertPriority)}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="informational">ℹ️ Informational</SelectItem>
                    <SelectItem value="warning">⚠️ Warning</SelectItem>
                    <SelectItem value="critical">🚨 Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Target Zones
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  value={targetZones}
                  onChange={(e) => setTargetZones(e.target.value)}
                  placeholder="e.g., Zone 1, Zone 2, Zone 3"
                  className="mt-1.5 rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to broadcast to all zones</p>
              </div>

              {/* Priority preview */}
              {(title || message) && (() => {
                const cfg = getPriorityConfig(priority);
                const IconComponent = cfg.icon;
                return (
                  <div className={`rounded-2xl p-3 ${cfg.bg} border`}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 rounded-lg ${cfg.iconBg} flex items-center justify-center shrink-0 ${cfg.iconColor}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{title || 'Alert title...'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{message || 'Alert message...'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Submit footer */}
            <div className="p-4 border-t border-border">
              <Button onClick={createAlert} className="w-full rounded-xl h-12 font-semibold gap-2">
                <Send className="w-4 h-4" />
                Broadcast Alert
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}