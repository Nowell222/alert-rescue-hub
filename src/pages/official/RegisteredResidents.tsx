import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
  ChevronRight,
  X,
  Activity,
  Calendar,
  Navigation,
  Shield,
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
  const [selectedResident, setSelectedResident] = useState<ResidentProfile | null>(null);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    setLoading(true);

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

    if (profiles) setResidents(profiles as ResidentProfile[]);
    setLoading(false);
  };

  const getActivityConfig = (lastActive: string | null) => {
    if (!lastActive) return {
      label: 'Never active',
      bg: 'bg-muted/50 border-l-4 border-border',
      iconBg: 'bg-muted', iconColor: 'text-muted-foreground',
      badge: 'bg-muted text-muted-foreground border',
      stripBg: 'bg-slate-500', dot: 'bg-muted-foreground',
    };
    const diff = Date.now() - new Date(lastActive).getTime();
    const minutes = diff / 60000;
    if (minutes < 5) return {
      label: 'Online now',
      bg: 'bg-green-50 border-l-4 border-green-500',
      iconBg: 'bg-green-100', iconColor: 'text-green-600',
      badge: 'bg-green-100 text-green-700 border border-green-200',
      stripBg: 'bg-green-600', dot: 'bg-green-500',
    };
    if (minutes < 60) return {
      label: `${Math.round(minutes)}m ago`,
      bg: 'bg-blue-50 border-l-4 border-blue-400',
      iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-700 border border-blue-200',
      stripBg: 'bg-blue-500', dot: 'bg-blue-500',
    };
    if (minutes < 1440) return {
      label: `${Math.round(minutes / 60)}h ago`,
      bg: 'bg-amber-50 border-l-4 border-amber-400',
      iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border border-amber-200',
      stripBg: 'bg-amber-500', dot: 'bg-amber-500',
    };
    return {
      label: new Date(lastActive!).toLocaleDateString(),
      bg: 'bg-muted/50 border-l-4 border-border',
      iconBg: 'bg-muted', iconColor: 'text-muted-foreground',
      badge: 'bg-muted text-muted-foreground border',
      stripBg: 'bg-slate-500', dot: 'bg-slate-400',
    };
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const filtered = residents.filter(r =>
    r.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (r.address || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.barangay_zone || '').toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = residents.filter(r => {
    if (!r.last_active_at) return false;
    return (Date.now() - new Date(r.last_active_at).getTime()) / 60000 < 5;
  }).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-up">
        <Link to="/official">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Registered Residents
          </h1>
          <p className="text-muted-foreground text-fluid-sm">
            {residents.length} registered residents
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResidents} className="gap-2 rounded-xl shrink-0">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Strip */}
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground animate-fade-up stagger-1 shadow-md">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{residents.length}</p>
            <p className="text-xs text-white/70 mt-0.5">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-300">{onlineCount}</p>
            <p className="text-xs text-white/70 mt-0.5">Online Now</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-white/70 mt-0.5">Showing</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative animate-fade-up stagger-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, address, or zone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Residents List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-20" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">
              {search ? 'No results found' : 'No residents registered yet'}
            </h3>
            <p className="text-fluid-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Residents will appear here once they register'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((resident, idx) => {
            const cfg = getActivityConfig(resident.last_active_at);
            return (
              <button
                key={resident.id}
                onClick={() => setSelectedResident(resident)}
                className={`w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up ${cfg.bg}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0 font-bold text-sm ${cfg.iconColor}`}>
                    {getInitials(resident.full_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-fluid-base font-display truncate">{resident.full_name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      {resident.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground truncate max-w-[180px]">
                          <MapPin className="w-3 h-3 shrink-0" />
                          {resident.address}
                        </span>
                      )}
                      {resident.barangay_zone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Shield className="w-3 h-3" />
                          {resident.barangay_zone}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedResident && (() => {
        const cfg = getActivityConfig(selectedResident.last_active_at);
        const hasLocation = selectedResident.last_known_lat && selectedResident.last_known_lng;

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedResident(null); }}
          >
            <div className="bg-background w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
              {/* Colored top strip */}
              <div className={`rounded-t-3xl p-5 ${cfg.stripBg} text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                      {getInitials(selectedResident.full_name)}
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Resident Profile</p>
                      <h2 className="font-bold text-lg leading-tight">{selectedResident.full_name}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedResident(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-3 text-white/70 text-xs flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold`}>
                    {cfg.label}
                  </span>
                  {selectedResident.barangay_zone && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {selectedResident.barangay_zone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Joined {new Date(selectedResident.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-5 space-y-5 flex-1">

                {/* Stats grid */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Profile Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Activity className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Last Active</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {selectedResident.last_active_at
                          ? new Date(selectedResident.last_active_at).toLocaleDateString()
                          : 'Never'}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Shield className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Zone</p>
                      <p className="font-semibold text-sm mt-0.5">
                        {selectedResident.barangay_zone || '—'}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
                      <Navigation className={`w-5 h-5 mx-auto mb-1 ${hasLocation ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className={`font-semibold text-sm mt-0.5 ${hasLocation ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {hasLocation ? 'Available' : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Contact info */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" /> Contact Information
                  </h3>
                  <div className="space-y-2">
                    {selectedResident.phone_number ? (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Phone Number</p>
                          <a href={`tel:${selectedResident.phone_number}`} className="text-sm font-medium text-primary hover:underline">
                            {selectedResident.phone_number}
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 opacity-60">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No phone number on file</p>
                      </div>
                    )}

                    {selectedResident.address ? (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm font-medium">{selectedResident.address}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3 opacity-60">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No address on file</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Last known location */}
                {hasLocation && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Navigation className="w-4 h-4" /> Last Known Location
                    </h3>
                    <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                        <Navigation className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {selectedResident.last_known_lat?.toFixed(5)}, {selectedResident.last_known_lng?.toFixed(5)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">GPS Coordinates</p>
                      </div>
                      <a
                        href={`https://maps.google.com/?q=${selectedResident.last_known_lat},${selectedResident.last_known_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View Map
                      </a>
                    </div>
                  </section>
                )}

                {/* Registration timeline */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Timeline
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 bg-primary/10 text-primary`}>1</span>
                      <div>
                        <p className="text-sm font-medium">Registered</p>
                        <p className="text-xs text-muted-foreground">{new Date(selectedResident.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedResident.last_active_at && (
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${cfg.badge}`}>2</span>
                        <div>
                          <p className="text-sm font-medium">Last Active</p>
                          <p className="text-xs text-muted-foreground">{new Date(selectedResident.last_active_at).toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}