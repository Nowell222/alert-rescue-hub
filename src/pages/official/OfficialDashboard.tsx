import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import WeatherWidget from '@/components/weather/WeatherWidget';
import {
  Building2,
  Users,
  Package,
  AlertTriangle,
  Bell,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  Phone,
  MapPin
} from 'lucide-react';
import type { EvacuationCenter, Evacuee } from '@/types/database';

export default function OfficialDashboard() {
  const { profile, user } = useAuth();
  const [center, setCenter] = useState<EvacuationCenter | null>(null);
  const [evacuees, setEvacuees] = useState<Evacuee[]>([]);
  const [stats, setStats] = useState({
    totalEvacuees: 0,
    families: 0,
    adults: 0,
    children: 0,
    specialNeeds: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('official_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evacuation_centers' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'evacuees' }, fetchData)
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch assigned evacuation center
      if (user) {
        const { data: centerData } = await supabase
          .from('evacuation_centers')
          .select('*')
          .eq('assigned_official_id', user.id)
          .single();

        if (centerData) {
          setCenter(centerData as EvacuationCenter);

          // Fetch evacuees at this center
          const { data: evacueeData } = await supabase
            .from('evacuees')
            .select('*')
            .eq('evacuation_center_id', centerData.id)
            .is('checked_out_at', null);

          if (evacueeData) {
            setEvacuees(evacueeData as Evacuee[]);
            
            const totalAdults = evacueeData.reduce((sum, e) => sum + (e.adults_count || 1), 0);
            const totalChildren = evacueeData.reduce((sum, e) => sum + (e.children_count || 0), 0);
            const withSpecialNeeds = evacueeData.filter(e => e.special_needs && e.special_needs.length > 0).length;

            setStats({
              totalEvacuees: totalAdults + totalChildren,
              families: evacueeData.length,
              adults: totalAdults,
              children: totalChildren,
              specialNeeds: withSpecialNeeds
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const occupancyPercent = center ? Math.round((center.current_occupancy / center.max_capacity) * 100) : 0;
  const isNearCapacity = occupancyPercent >= 80;
  const isFull = occupancyPercent >= 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">
            Evacuation Center Management
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {center ? center.name : 'No center assigned'}
          </p>
        </div>
        <Link to="/official/evacuees">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Register Evacuee
          </Button>
        </Link>
      </div>

      {/* Capacity Alert */}
      {isFull && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-destructive" />
              <div>
                <p className="font-semibold text-destructive">Center at Maximum Capacity!</p>
                <p className="text-sm text-muted-foreground">
                  Coordinate with MDRRMO for evacuee transfers
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Center Info Card */}
      {center ? (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">{center.name}</h2>
                <p className="text-white/80 text-sm flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {center.address}
                </p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Capacity</span>
                  <span className={`text-sm font-bold ${isNearCapacity ? 'text-destructive' : 'text-success'}`}>
                    {center.current_occupancy} / {center.max_capacity}
                  </span>
                </div>
                <Progress 
                  value={Math.min(occupancyPercent, 100)} 
                  className={`h-3 ${isNearCapacity ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {center.max_capacity - center.current_occupancy} spaces available
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.families}</p>
                  <p className="text-xs text-muted-foreground">Families</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-info">{stats.specialNeeds}</p>
                  <p className="text-xs text-muted-foreground">Special Needs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-2">No Evacuation Center Assigned</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contact MDRRMO to be assigned to an evacuation center
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Evacuees', value: stats.totalEvacuees, color: 'from-primary to-info' },
          { icon: Users, label: 'Adults', value: stats.adults, color: 'from-success to-accent' },
          { icon: Users, label: 'Children', value: stats.children, color: 'from-warning to-orange-500' },
          { icon: AlertTriangle, label: 'Special Needs', value: stats.specialNeeds, color: 'from-destructive to-warning' },
        ].map((stat, i) => (
          <Card key={i} className="stat-card">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weather */}
      <WeatherWidget variant="compact" />

      {/* Recent Evacuees */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Recent Registrations
          </CardTitle>
          <Link to="/official/evacuees">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {evacuees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No evacuees registered yet</p>
              <Link to="/official/evacuees">
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="w-4 h-4 mr-1" /> Register Evacuee
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {evacuees.slice(0, 5).map((evacuee) => (
                <div 
                  key={evacuee.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{evacuee.family_name} Family</p>
                      <p className="text-xs text-muted-foreground">
                        {evacuee.adults_count} adults, {evacuee.children_count} children
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {evacuee.special_needs && evacuee.special_needs.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Special Needs
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(evacuee.checked_in_at).toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Package, label: 'Supplies', href: '/official/supplies', color: 'from-accent to-success' },
          { icon: Bell, label: 'Alerts', href: '/official/alerts', color: 'from-warning to-orange-500' },
          { icon: MapPin, label: 'Zone Status', href: '/official/zone', color: 'from-info to-primary' },
          { icon: Phone, label: 'Contact MDRRMO', href: '/official/contact', color: 'from-destructive to-warning' },
        ].map((action, i) => (
          <Link key={i} to={action.href}>
            <Card className="dashboard-card h-full hover:shadow-lg transition-all duration-300 cursor-pointer group">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
