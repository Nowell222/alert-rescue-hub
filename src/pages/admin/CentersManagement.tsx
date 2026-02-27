import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Building2,
  Plus,
  Users,
  MapPin,
  Package,
  Trash2,
  X,
  ChevronRight,
  Home,
  Activity,
  Minus,
  CheckCircle2,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { EvacuationCenter } from '@/types/database';

const WATER_LEVEL_MAX = 100; // occupancy percentage

export default function CentersManagementPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<EvacuationCenter | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('100');

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    const { data } = await supabase
      .from('evacuation_centers')
      .select('*')
      .order('name');

    if (data) setCenters(data as EvacuationCenter[]);
    setLoading(false);
  };

  const createCenter = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error('Please fill in name and address');
      return;
    }

    const { error } = await supabase.from('evacuation_centers').insert({
      name: name.trim(),
      address: address.trim(),
      max_capacity: parseInt(capacity) || 100,
      current_occupancy: 0,
      status: 'operational',
      supplies_status: 'adequate',
    });

    if (error) {
      toast.error('Failed to create center');
    } else {
      toast.success('Evacuation center added');
      setName('');
      setAddress('');
      setCapacity('100');
      setShowForm(false);
      fetchCenters();
    }
  };

  const updateOccupancy = async (id: string, occupancy: number) => {
    const { error } = await supabase
      .from('evacuation_centers')
      .update({ current_occupancy: Math.max(0, occupancy) })
      .eq('id', id);

    if (!error) {
      fetchCenters();
      if (selectedCenter?.id === id) {
        setSelectedCenter((prev) =>
          prev ? { ...prev, current_occupancy: Math.max(0, occupancy) } : null
        );
      }
    }
  };

  const deleteCenter = async (id: string) => {
    const { error } = await supabase.from('evacuation_centers').delete().eq('id', id);

    if (!error) {
      toast.success('Center deleted');
      setSelectedCenter(null);
      fetchCenters();
    }
  };

  const totalCapacity = centers.reduce((sum, c) => sum + c.max_capacity, 0);
  const totalOccupancy = centers.reduce((sum, c) => sum + c.current_occupancy, 0);

  const getOccupancyConfig = (current: number, max: number) => {
    const pct = Math.round((current / max) * 100);
    if (pct >= 95) return {
      bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50',
      border: 'border-l-4 border-red-500', iconBg: 'bg-red-100',
      stripBg: 'bg-red-500', label: 'Full', statusBadge: 'bg-red-100 text-red-700 border border-red-200',
    };
    if (pct >= 80) return {
      bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50',
      border: 'border-l-4 border-amber-500', iconBg: 'bg-amber-100',
      stripBg: 'bg-amber-500', label: 'Near Capacity', statusBadge: 'bg-amber-100 text-amber-700 border border-amber-200',
    };
    return {
      bar: 'bg-green-500', text: 'text-green-600', bg: 'bg-green-50',
      border: 'border-l-4 border-green-500', iconBg: 'bg-green-100',
      stripBg: 'bg-green-600', label: 'Available', statusBadge: 'bg-green-100 text-green-700 border border-green-200',
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'full': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  const getSuppliesIcon = (status: string) => {
    switch (status) {
      case 'adequate': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
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
            <Building2 className="w-6 h-6 text-accent" />
            Evacuation Centers
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Manage evacuation facilities</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-1.5 shrink-0 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Center
        </Button>
      </div>

      {/* Summary Strip */}
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground animate-fade-up stagger-1 shadow-md">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-bold">{centers.length}</p>
            <p className="text-xs text-white/70 mt-0.5">Centers</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalOccupancy}</p>
            <p className="text-xs text-white/70 mt-0.5">Evacuees</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalCapacity - totalOccupancy}</p>
            <p className="text-xs text-white/70 mt-0.5">Available</p>
          </div>
        </div>
        {totalCapacity > 0 && (
          <div className="mt-3">
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-white transition-all"
                style={{ width: `${Math.min((totalOccupancy / totalCapacity) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-white/60 mt-1 text-right">
              {Math.round((totalOccupancy / totalCapacity) * 100)}% overall occupancy
            </p>
          </div>
        )}
      </div>

      {/* Centers List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : centers.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up stagger-2">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Centers Added</h3>
            <p className="text-fluid-sm text-muted-foreground">Add evacuation centers to manage capacity.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {centers.map((center, idx) => {
            const pct = Math.round((center.current_occupancy / center.max_capacity) * 100);
            const cfg = getOccupancyConfig(center.current_occupancy, center.max_capacity);

            return (
              <button
                key={center.id}
                onClick={() => setSelectedCenter(center)}
                className={`w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up ${cfg.bg} ${cfg.border}`}
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0`}>
                    <Home className={`w-5 h-5 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-fluid-base font-display">{center.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.statusBadge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-fluid-sm text-foreground/75 mb-2 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {center.address}
                    </p>
                    {/* Occupancy bar */}
                    <div className="mb-1">
                      <div className="w-full bg-black/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${cfg.bar}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {center.current_occupancy} / {center.max_capacity}
                      </span>
                      <span className={`text-xs font-medium ${cfg.text}`}>{pct}% full</span>
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
      {selectedCenter && (() => {
        const pct = Math.round((selectedCenter.current_occupancy / selectedCenter.max_capacity) * 100);
        const cfg = getOccupancyConfig(selectedCenter.current_occupancy, selectedCenter.max_capacity);

        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedCenter(null); }}
          >
            <div className="bg-background w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
              {/* Colored top strip */}
              <div className={`rounded-t-3xl p-5 ${cfg.stripBg} text-white`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{cfg.label}</p>
                      <h2 className="font-bold text-lg leading-tight">{selectedCenter.name}</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCenter(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="mt-3 text-white/90 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  {selectedCenter.address}
                </p>

                {/* Occupancy bar in strip */}
                <div className="mt-3">
                  <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-white/70 text-xs mt-1">
                    <span>{selectedCenter.current_occupancy} occupants</span>
                    <span>{pct}% of {selectedCenter.max_capacity} capacity</span>
                  </div>
                </div>
              </div>

              {/* Modal body */}
              <div className="p-5 space-y-5 flex-1">

                {/* Stats grid */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Center Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Users className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="font-semibold text-sm mt-0.5">{selectedCenter.current_occupancy}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Building2 className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-semibold text-sm mt-0.5">{selectedCenter.max_capacity}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Home className={`w-5 h-5 mx-auto mb-1 ${cfg.text}`} />
                      <p className="text-xs text-muted-foreground">Available</p>
                      <p className={`font-semibold text-sm mt-0.5 ${cfg.text}`}>
                        {Math.max(selectedCenter.max_capacity - selectedCenter.current_occupancy, 0)}
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Activity className={`w-5 h-5 mx-auto mb-1 ${cfg.text}`} />
                      <p className="text-xs text-muted-foreground">Usage</p>
                      <p className={`font-semibold text-sm mt-0.5 ${cfg.text}`}>{pct}%</p>
                    </div>
                  </div>
                </section>

                {/* Occupancy gauge */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Occupancy Level
                  </h3>
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <span className="text-3xl font-bold">{selectedCenter.current_occupancy}</span>
                        <span className="text-muted-foreground ml-1">/ {selectedCenter.max_capacity}</span>
                      </div>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full capitalize ${cfg.statusBadge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cfg.bar}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>50%</span>
                      <span>Full: {selectedCenter.max_capacity}</span>
                    </div>
                  </div>
                </section>

                {/* Operational Info */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Operational Info
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                      {getStatusIcon(selectedCenter.status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">Facility Status</p>
                        <p className="text-xs text-muted-foreground capitalize">{selectedCenter.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                      {getSuppliesIcon(selectedCenter.supplies_status)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">Supplies Status</p>
                        <p className="text-xs text-muted-foreground capitalize">{selectedCenter.supplies_status}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Occupancy controls */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" /> Update Occupancy
                  </h3>
                  <div className="bg-muted/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-xl w-11 h-11 text-lg font-bold"
                      onClick={() => updateOccupancy(selectedCenter.id, selectedCenter.current_occupancy - 1)}
                    >
                      <Minus className="w-5 h-5" />
                    </Button>
                    <div className="text-center">
                      <span className="text-4xl font-bold">{selectedCenter.current_occupancy}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">occupants</p>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      className="rounded-xl w-11 h-11 text-lg font-bold"
                      onClick={() => updateOccupancy(selectedCenter.id, selectedCenter.current_occupancy + 1)}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </section>

              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="outline"
                  className="w-full rounded-xl h-11 text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
                  onClick={() => deleteCenter(selectedCenter.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove This Center
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Center Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false); }}
        >
          <div className="bg-background w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
            {/* Form header strip */}
            <div className="rounded-t-3xl p-5 bg-accent text-accent-foreground">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Admin Action</p>
                    <h2 className="font-bold text-lg leading-tight">Add Evacuation Center</h2>
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
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Center Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., San Juan Covered Court"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address</Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  className="mt-1.5 rounded-xl"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Max Capacity</Label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={1}
                  className="mt-1.5 rounded-xl"
                />
              </div>

              {/* Preview */}
              {(name || address) && (
                <div className="rounded-2xl p-3 bg-green-50 border-l-4 border-green-500">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <Home className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{name || 'Center name...'}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{address || 'Address...'}</p>
                      <p className="text-xs text-green-600 mt-0.5">Capacity: {capacity || '100'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit footer */}
            <div className="p-4 border-t border-border">
              <Button onClick={createCenter} className="w-full rounded-xl h-12 font-semibold gap-2">
                <Building2 className="w-4 h-4" />
                Add Center
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}