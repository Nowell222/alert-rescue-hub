import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { WeatherAlert, AlertPriority } from '@/types/database';

export default function AlertsManagementPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
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
      ? targetZones.split(',').map(z => z.trim()).filter(Boolean)
      : null;

    const { error } = await supabase
      .from('weather_alerts')
      .insert({
        title: title.trim(),
        message: message.trim(),
        priority,
        target_zones: zones,
        created_by: user.id,
        is_active: true
      });

    if (error) {
      toast.error('Failed to create alert');
    } else {
      toast.success('Alert broadcasted!');
      setTitle('');
      setMessage('');
      setPriority('informational');
      setTargetZones('');
      setDialogOpen(false);
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
    }
  };

  const deleteAlert = async (id: string) => {
    const { error } = await supabase
      .from('weather_alerts')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Alert deleted');
      fetchAlerts();
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'warning': return 'bg-warning text-warning-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Bell className="w-6 h-6 text-warning" />
              Alert Management
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Broadcast alerts to residents</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />
              New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Flood Warning for Zone 3"
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter alert details..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as AlertPriority)}>
                  <SelectTrigger>
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
                <Label htmlFor="zones">Target Zones (optional)</Label>
                <Input
                  id="zones"
                  value={targetZones}
                  onChange={(e) => setTargetZones(e.target.value)}
                  placeholder="e.g., Zone 1, Zone 2, Zone 3"
                />
                <p className="text-fluid-xs text-muted-foreground mt-1">
                  Leave empty to send to all zones
                </p>
              </div>
              <Button onClick={createAlert} className="w-full gap-2">
                <Send className="w-4 h-4" />
                Broadcast Alert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-base">Quick Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              { title: 'Flood Warning', msg: 'Water levels are rising. Stay alert and prepare for possible evacuation.', priority: 'warning' },
              { title: 'Evacuation Order', msg: 'Immediate evacuation required. Proceed to nearest evacuation center.', priority: 'critical' },
              { title: 'All Clear', msg: 'Flood waters have receded. It is now safe to return home.', priority: 'informational' },
            ].map((template, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => {
                  setTitle(template.title);
                  setMessage(template.msg);
                  setPriority(template.priority as AlertPriority);
                  setDialogOpen(true);
                }}
                className="text-fluid-xs"
              >
                {template.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Bell className="icon-box-lg mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Alerts Created</h3>
            <p className="text-fluid-sm text-muted-foreground">
              Create your first alert to notify residents
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className={!alert.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-fluid-md">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-fluid-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-fluid-base">{alert.title}</h3>
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      {!alert.is_active && (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-fluid-sm text-muted-foreground mb-2">{alert.message}</p>
                    <p className="text-fluid-xs text-muted-foreground">
                      {new Date(alert.created_at).toLocaleString()}
                      {alert.target_zones && ` • Zones: ${alert.target_zones.join(', ')}`}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAlert(alert.id, alert.is_active)}
                    >
                      {alert.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteAlert(alert.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
