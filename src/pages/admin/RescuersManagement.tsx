import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  RefreshCw
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

export default function RescuersManagementPage() {
  const [rescuers, setRescuers] = useState<RescuerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRescuers();
  }, []);

  const fetchRescuers = async () => {
    setRefreshing(true);
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'rescuer');

    if (!roleData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const rescuerList: RescuerInfo[] = [];
    for (const role of roleData) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', role.user_id)
        .maybeSingle();

      const { count: completedCount } = await supabase
        .from('rescue_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_rescuer_id', role.user_id)
        .eq('status', 'completed');

      const { count: activeCount } = await supabase
        .from('rescue_requests')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_rescuer_id', role.user_id)
        .in('status', ['assigned', 'in_progress']);

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

  const filteredRescuers = rescuers.filter(r =>
    (r.profile?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.assigned_zone || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = rescuers.filter(r => r.activeMissions > 0).length;
  const totalCompleted = rescuers.reduce((s, r) => s + r.completedMissions, 0);

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
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
        <Button variant="outline" size="sm" onClick={fetchRescuers} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-fluid-sm">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-primary">{rescuers.length}</p>
            <p className="text-fluid-xs text-muted-foreground">Total Rescuers</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-warning">{totalActive}</p>
            <p className="text-fluid-xs text-muted-foreground">On Mission</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-success">{totalCompleted}</p>
            <p className="text-fluid-xs text-muted-foreground">Total Completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search rescuers by name or zone..."
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-fluid-md h-24" /></Card>)}
        </div>
      ) : filteredRescuers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Rescuers Found</h3>
            <p className="text-fluid-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'No rescuers registered yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md">
          {filteredRescuers.map((rescuer) => (
            <Card key={rescuer.user_id} className="dashboard-card">
              <CardContent className="p-fluid-md">
                <div className="flex items-start gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                      {rescuer.profile?.full_name?.charAt(0) || 'R'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-fluid-base truncate">
                      {rescuer.profile?.full_name || 'Unknown Rescuer'}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      {rescuer.activeMissions > 0 ? (
                        <Badge className="bg-warning text-warning-foreground text-fluid-xs">
                          <Radio className="w-3 h-3 mr-1 animate-pulse" />
                          On Mission
                        </Badge>
                      ) : (
                        <Badge className="bg-success text-success-foreground text-fluid-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Available
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {rescuer.profile?.phone_number && (
                    <p className="text-fluid-xs flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${rescuer.profile.phone_number}`} className="text-primary hover:underline">
                        {rescuer.profile.phone_number}
                      </a>
                    </p>
                  )}
                  {rescuer.assigned_zone && (
                    <p className="text-fluid-xs flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      Zone: {rescuer.assigned_zone}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span className="text-fluid-xs font-medium">{rescuer.completedMissions} completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-warning" />
                    <span className="text-fluid-xs font-medium">{rescuer.activeMissions} active</span>
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
