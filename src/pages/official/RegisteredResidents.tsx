import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  MapPin,
  Phone,
  Clock,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ResidentProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  address: string | null;
  barangay_zone: string | null;
  last_known_lat: number | null;
  last_known_lng: number | null;
  last_active_at: string | null;
  created_at: string;
}

export default function RegisteredResidentsPage() {
  const [residents, setResidents] = useState<ResidentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);

    // Fetch all profiles that have the 'resident' role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'resident');

    if (!roleData || roleData.length === 0) {
      setResidents([]);
      setLoading(false);
      return;
    }

    const userIds = roleData.map(r => r.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds)
      .order('full_name');

    if (profiles) {
      setResidents(profiles as ResidentProfile[]);
    }
    setLoading(false);
  };

  const getActivityStatus = (lastActive: string | null) => {
    if (!lastActive) return { label: 'Never active', color: 'bg-muted text-muted-foreground' };
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = diff / 60000;
    if (minutes < 5) return { label: 'Online now', color: 'bg-success text-success-foreground' };
    if (minutes < 60) return { label: `${Math.round(minutes)}m ago`, color: 'bg-info text-info-foreground' };
    if (minutes < 1440) return { label: `${Math.round(minutes / 60)}h ago`, color: 'bg-warning text-warning-foreground' };
    return { label: new Date(lastActive).toLocaleDateString(), color: 'bg-muted text-muted-foreground' };
  };

  const filtered = residents.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.barangay_zone || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/official">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Registered Residents
            </h1>
            <p className="text-muted-foreground text-fluid-sm">
              {residents.length} registered residents
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResidents} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, address, or zone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-fluid-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            All Residents ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse h-20" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-fluid-sm">
                {search ? 'No residents match your search' : 'No residents registered yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((resident) => {
                const activity = getActivityStatus(resident.last_active_at);
                return (
                  <div
                    key={resident.id}
                    className="p-fluid-md rounded-xl border bg-card hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-fluid-base truncate">{resident.full_name}</p>
                          {resident.address && (
                            <p className="text-fluid-xs text-muted-foreground flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {resident.address}
                            </p>
                          )}
                          {resident.phone_number && (
                            <p className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3 shrink-0" />
                              <a href={`tel:${resident.phone_number}`} className="text-primary hover:underline">
                                {resident.phone_number}
                              </a>
                            </p>
                          )}
                          {resident.barangay_zone && (
                            <Badge variant="outline" className="text-fluid-xs mt-1">
                              Zone: {resident.barangay_zone}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={`${activity.color} text-fluid-xs`}>
                          {activity.label}
                        </Badge>
                        <p className="text-fluid-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          Joined {new Date(resident.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
