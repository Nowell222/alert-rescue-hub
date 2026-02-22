import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Bell, AlertTriangle, Info, Clock
} from 'lucide-react';
import type { WeatherAlert } from '@/types/database';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);

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
      .from('weather_alerts').select('*').eq('is_active', true).order('created_at', { ascending: false });
    if (data) setAlerts(data as WeatherAlert[]);
    setLoading(false);
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return { bg: 'alert-critical', icon: AlertTriangle, iconColor: 'text-destructive', badge: 'bg-destructive/15 text-destructive border border-destructive/20' };
      case 'warning':
        return { bg: 'alert-warning', icon: AlertTriangle, iconColor: 'text-warning', badge: 'bg-warning/15 text-warning border border-warning/20' };
      default:
        return { bg: 'alert-info', icon: Info, iconColor: 'text-info', badge: 'bg-info/15 text-info border border-info/20' };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-fluid-md animate-fade-up">
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-success/15 flex items-center justify-center border border-success/20" style={{ boxShadow: 'var(--glow-success)' }}>
              <Bell className="w-8 h-8 text-success" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">All Clear!</h3>
            <p className="text-fluid-sm text-muted-foreground">
              No active weather alerts at this time. Stay prepared!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, idx) => {
            const styles = getPriorityStyles(alert.priority);
            const IconComponent = styles.icon;
            
            return (
              <div key={alert.id} className={`${styles.bg} animate-fade-up`} style={{ animationDelay: `${idx * 0.05}s` }}>
                <div className="flex items-start gap-fluid-md">
                  <div className={`w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center shrink-0 ${styles.iconColor}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-fluid-base font-display">{alert.title}</h3>
                      <Badge className={styles.badge}>
                        {alert.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-fluid-sm text-foreground/80 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-fluid-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(alert.created_at).toLocaleString()}
                      </span>
                      {alert.target_zones && alert.target_zones.length > 0 && (
                        <span>Zones: {alert.target_zones.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
