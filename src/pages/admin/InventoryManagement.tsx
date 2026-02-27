import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Wrench,
  ChevronRight,
  X,
  Users,
  Activity,
  Shield,
  Hash,
} from 'lucide-react';
import type { RescuerEquipment, Profile } from '@/types/database';

interface EquipmentWithOwner extends RescuerEquipment {
  ownerName: string;
}

type GroupedEntry = { name: string; items: EquipmentWithOwner[] };

export default function InventoryManagementPage() {
  const [equipment, setEquipment] = useState<EquipmentWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<GroupedEntry | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data: rescuerRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'rescuer');

    if (!rescuerRoles) { setLoading(false); return; }

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

  const getConditionConfig = (condition: string) => {
    switch (condition) {
      case 'excellent':
        return {
          bg: 'bg-green-50 border-l-4 border-green-500',
          iconBg: 'bg-green-100', iconColor: 'text-green-600',
          badge: 'bg-green-100 text-green-700 border border-green-200',
          stripBg: 'bg-green-600', bar: 'bg-green-500',
          label: 'EXCELLENT', dot: 'bg-green-500',
          icon: CheckCircle,
        };
      case 'good':
        return {
          bg: 'bg-blue-50 border-l-4 border-blue-400',
          iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700 border border-blue-200',
          stripBg: 'bg-blue-500', bar: 'bg-blue-500',
          label: 'GOOD', dot: 'bg-blue-500',
          icon: CheckCircle,
        };
      case 'fair':
        return {
          bg: 'bg-amber-50 border-l-4 border-amber-500',
          iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
          badge: 'bg-amber-100 text-amber-700 border border-amber-200',
          stripBg: 'bg-amber-500', bar: 'bg-amber-500',
          label: 'FAIR', dot: 'bg-amber-500',
          icon: AlertTriangle,
        };
      case 'poor':
        return {
          bg: 'bg-red-50 border-l-4 border-red-500',
          iconBg: 'bg-red-100', iconColor: 'text-red-600',
          badge: 'bg-red-100 text-red-700 border border-red-200',
          stripBg: 'bg-red-500', bar: 'bg-red-500',
          label: 'POOR', dot: 'bg-red-500',
          icon: XCircle,
        };
      default:
        return {
          bg: 'bg-muted/50 border-l-4 border-border',
          iconBg: 'bg-muted', iconColor: 'text-muted-foreground',
          badge: 'bg-muted text-muted-foreground border',
          stripBg: 'bg-muted-foreground', bar: 'bg-muted-foreground',
          label: 'UNKNOWN', dot: 'bg-muted-foreground',
          icon: Package,
        };
    }
  };

  // Determine dominant condition for a group
  const getDominantCondition = (items: EquipmentWithOwner[]) => {
    const priority = ['poor', 'fair', 'good', 'excellent'];
    for (const p of priority) {
      if (items.some(i => i.condition === p)) return p;
    }
    return 'good';
  };

  const stats = {
    total: equipment.length,
    excellent: equipment.filter(e => e.condition === 'excellent').length,
    good: equipment.filter(e => e.condition === 'good').length,
    needsRepair: equipment.filter(e => e.condition === 'fair' || e.condition === 'poor').length,
  };

  const grouped: GroupedEntry[] = Object.entries(
    equipment.reduce((acc, item) => {
      if (!acc[item.equipment_name]) acc[item.equipment_name] = [];
      acc[item.equipment_name].push(item);
      return acc;
    }, {} as Record<string, EquipmentWithOwner[]>)
  ).map(([name, items]) => ({ name, items }));

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
            <Package className="w-6 h-6 text-accent" />
            Equipment Inventory
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Overview of all rescuer equipment</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInventory} className="gap-2 rounded-xl shrink-0">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Strip */}
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground animate-fade-up stagger-1 shadow-md">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-white/70 mt-0.5">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-300">{stats.excellent}</p>
            <p className="text-xs text-white/70 mt-0.5">Excellent</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-300">{stats.good}</p>
            <p className="text-xs text-white/70 mt-0.5">Good</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-300">{stats.needsRepair}</p>
            <p className="text-xs text-white/70 mt-0.5">Needs Repair</p>
          </div>
        </div>
      </div>

      {/* Equipment Group List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up stagger-2">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Equipment Tracked</h3>
            <p className="text-fluid-sm text-muted-foreground">Rescuers haven't added equipment yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ name, items }, idx) => {
            const dominant = getDominantCondition(items);
            const cfg = getConditionConfig(dominant);
            const totalQty = items.reduce((s, i) => s + i.quantity, 0);
            const poorCount = items.filter(i => i.condition === 'fair' || i.condition === 'poor').length;

            return (
              <button
                key={name}
                onClick={() => setSelectedGroup({ name, items })}
                className={`w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up ${cfg.bg}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0 ${cfg.iconColor}`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-fluid-base font-display">{name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-fluid-sm text-foreground/75 mb-2">
                      Assigned to {items.length} rescuer{items.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Hash className="w-3 h-3" />
                        {totalQty} units total
                      </span>
                      {poorCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="w-3 h-3" />
                          {poorCount} need{poorCount === 1 ? 's' : ''} attention
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
      {selectedGroup && (() => {
        const dominant = getDominantCondition(selectedGroup.items);
        const cfg = getConditionConfig(dominant);
        const totalQty = selectedGroup.items.reduce((s, i) => s + i.quantity, 0);
        const conditionBreakdown = ['excellent', 'good', 'fair', 'poor'].map(c => ({
          label: c,
          count: selectedGroup.items.filter(i => i.condition === c).length,
          cfg: getConditionConfig(c),
        })).filter(c => c.count > 0);

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedGroup(null); }}
          >
            <div className="bg-background w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
              {/* Colored top strip */}
              <div className={`rounded-t-3xl p-5 ${cfg.stripBg} text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{cfg.label}</p>
                      <h2 className="font-bold text-lg leading-tight">{selectedGroup.name}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-4 mt-3 text-white/70 text-xs flex-wrap">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {selectedGroup.items.length} rescuer{selectedGroup.items.length !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {totalQty} total units
                  </span>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-5 space-y-5 flex-1">

                {/* Stats grid */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Condition Overview
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Package className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Total Items</p>
                      <p className="font-semibold text-sm mt-0.5">{selectedGroup.items.length}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Hash className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs text-muted-foreground">Total Units</p>
                      <p className="font-semibold text-sm mt-0.5">{totalQty}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                      <p className="text-xs text-muted-foreground">Operational</p>
                      <p className="font-semibold text-sm mt-0.5 text-green-600">
                        {selectedGroup.items.filter(i => i.condition === 'excellent' || i.condition === 'good').length}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                      <p className="text-xs text-muted-foreground">Needs Repair</p>
                      <p className="font-semibold text-sm mt-0.5 text-amber-600">
                        {selectedGroup.items.filter(i => i.condition === 'fair' || i.condition === 'poor').length}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Condition breakdown bars */}
                {conditionBreakdown.length > 0 && (
                  <section>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Condition Breakdown
                    </h3>
                    <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
                      {conditionBreakdown.map(({ label, count, cfg: c }) => {
                        const pct = Math.round((count / selectedGroup.items.length) * 100);
                        return (
                          <div key={label}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-semibold capitalize ${c.iconColor}`}>{label}</span>
                              <span className="text-xs text-muted-foreground">{count} item{count !== 1 ? 's' : ''} · {pct}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Per-rescuer list */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Assigned Rescuers
                  </h3>
                  <div className="space-y-2">
                    {selectedGroup.items.map((item, i) => {
                      const itemCfg = getConditionConfig(item.condition || 'good');
                      const ItemIcon = itemCfg.icon;
                      return (
                        <div key={item.id} className={`flex items-center gap-3 rounded-xl p-3 ${itemCfg.bg} border`}>
                          <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${itemCfg.badge}`}>
                            {i + 1}
                          </span>
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {item.ownerName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{item.ownerName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${itemCfg.badge}`}>
                            <ItemIcon className="w-3 h-3" />
                            {item.condition}
                          </div>
                        </div>
                      );
                    })}
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