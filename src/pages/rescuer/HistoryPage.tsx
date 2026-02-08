import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  Users,
  MapPin,
  Trophy
} from 'lucide-react';
import type { RescueRequest } from '@/types/database';

export default function MissionHistoryPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('rescue_requests')
      .select('*')
      .eq('assigned_rescuer_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (data) setMissions(data as RescueRequest[]);
    setLoading(false);
  };

  const totalPeopleRescued = missions.reduce((sum, m) => sum + (m.household_count || 1), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-fluid-md">
        <Link to="/rescuer">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-warning" />
            Mission History
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Your completed rescue operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-fluid-md">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-md">
            <p className="text-fluid-3xl font-bold text-primary">{missions.length}</p>
            <p className="text-fluid-xs text-muted-foreground">Missions Completed</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-md">
            <p className="text-fluid-3xl font-bold text-success">{totalPeopleRescued}</p>
            <p className="text-fluid-xs text-muted-foreground">People Rescued</p>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-20" />
            </Card>
          ))}
        </div>
      ) : missions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Trophy className="icon-box-lg mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Completed Missions</h3>
            <p className="text-fluid-sm text-muted-foreground">
              Your completed rescue missions will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((mission) => (
            <Card key={mission.id}>
              <CardContent className="p-fluid-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-md">
                  <div className="flex items-center gap-fluid-md">
                    <div className="icon-box-md rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="capitalize text-fluid-xs">
                          {mission.severity}
                        </Badge>
                        <span className="text-fluid-sm flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {mission.household_count} rescued
                        </span>
                      </div>
                      {mission.location_address && (
                        <p className="text-fluid-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {mission.location_address}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-fluid-sm font-medium">
                      {mission.completed_at ? new Date(mission.completed_at).toLocaleDateString() : '-'}
                    </p>
                    <p className="text-fluid-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      {mission.completed_at ? new Date(mission.completed_at).toLocaleTimeString() : '-'}
                    </p>
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
