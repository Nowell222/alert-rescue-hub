import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Package,
  Users,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench
} from 'lucide-react';
import type { RescuerEquipment, Profile } from '@/types/database';

interface EquipmentWithOwner extends RescuerEquipment {
  ownerName: string;
}

export default function InventoryManagementPage() {
  const [equipment, setEquipment] = useState<EquipmentWithOwner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data: rescuerRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'rescuer');

    if (!rescuerRoles) {
      setLoading(false);
      return;
    }

    const allEquipment: EquipmentWithOwner[] = [];
    for (const role of rescuerRoles) {
      const { data: equipData } = await supabase
        .from('rescuer_equipment')
        .select('*')
        .eq('rescuer_id', role.user_id);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', role.user_id)
        .maybeSingle();

      if (equipData) {
        for (const e of equipData) {
          allEquipment.push({
            ...(e as RescuerEquipment),
            ownerName: (profileData as any)?.full_name || 'Unknown',
          });
        }
      }
    }

    setEquipment(allEquipment);
    setLoading(false);
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-success text-success-foreground';
      case 'good': return 'bg-info text-info-foreground';
      case 'fair': return 'bg-warning text-warning-foreground';
      case 'poor': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'excellent': case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'fair': return <AlertTriangle className="w-4 h-4" />;
      case 'poor': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  const stats = {
    total: equipment.length,
    excellent: equipment.filter(e => e.condition === 'excellent').length,
    good: equipment.filter(e => e.condition === 'good').length,
    needsRepair: equipment.filter(e => e.condition === 'fair' || e.condition === 'poor').length,
  };

  // Group by equipment name
  const grouped = equipment.reduce((acc, item) => {
    if (!acc[item.equipment_name]) acc[item.equipment_name] = [];
    acc[item.equipment_name].push(item);
    return acc;
  }, {} as Record<string, EquipmentWithOwner[]>);

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
              <Package className="w-6 h-6 text-accent" />
              Equipment Inventory
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Overview of all rescuer equipment</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInventory} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-fluid-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-success">{stats.excellent}</p>
            <p className="text-fluid-xs text-muted-foreground">Excellent</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-info">{stats.good}</p>
            <p className="text-fluid-xs text-muted-foreground">Good</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-destructive">{stats.needsRepair}</p>
            <p className="text-fluid-xs text-muted-foreground">Needs Repair</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-fluid-md h-24" /></Card>)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Equipment Tracked</h3>
            <p className="text-fluid-sm text-muted-foreground">Rescuers haven't added equipment yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-fluid-md">
          {Object.entries(grouped).map(([name, items]) => (
            <Card key={name} className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-fluid-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    {name}
                  </span>
                  <Badge variant="outline">
                    {items.reduce((s, i) => s + i.quantity, 0)} total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {item.ownerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-fluid-sm font-medium">{item.ownerName}</p>
                          <p className="text-fluid-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <Badge className={`${getConditionColor(item.condition || 'good')} gap-1`}>
                        {getConditionIcon(item.condition || 'good')}
                        {item.condition}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
