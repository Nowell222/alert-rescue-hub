import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Package, Plus, Trash2, Edit2, Wrench,
  CheckCircle, AlertTriangle, XCircle, Shield,
  Radio, Anchor, Hammer, LifeBuoy, ChevronRight,
  Hash, RefreshCw, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescuerEquipment } from '@/types/database';

const EQUIPMENT_CATEGORIES = [
  { id: 'rescue', label: 'Rescue Equipment', icon: LifeBuoy, color: 'text-blue-600', bg: 'bg-blue-100', items: ['Life Vest', 'Rescue Rope', 'Life Ring', 'Rescue Boat', 'Stretcher', 'First Aid Kit'] },
  { id: 'safety', label: 'Safety Gear', icon: Shield, color: 'text-green-600', bg: 'bg-green-100', items: ['Helmet', 'Boots', 'Gloves', 'Raincoat', 'Reflective Vest', 'Goggles'] },
  { id: 'communication', label: 'Communication', icon: Radio, color: 'text-purple-600', bg: 'bg-purple-100', items: ['Two-Way Radio', 'Megaphone', 'Flashlight', 'Whistle', 'Signal Flare'] },
  { id: 'tools', label: 'Tools', icon: Hammer, color: 'text-orange-600', bg: 'bg-orange-100', items: ['Rope Cutter', 'Multi-Tool', 'Axe', 'Crowbar', 'Bolt Cutter'] },
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-500', border: 'border-emerald-200', dot: 'bg-emerald-500', width: 'w-full' },
  { value: 'good', label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100', bar: 'bg-blue-500', border: 'border-blue-200', dot: 'bg-blue-500', width: 'w-3/4' },
  { value: 'fair', label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-100', bar: 'bg-amber-500', border: 'border-amber-200', dot: 'bg-amber-500', width: 'w-1/2' },
  { value: 'poor', label: 'Poor', color: 'text-red-600', bg: 'bg-red-100', bar: 'bg-red-500', border: 'border-red-200', dot: 'bg-red-500', width: 'w-1/4' },
];

const getCategoryMeta = (name: string) => {
  for (const cat of EQUIPMENT_CATEGORIES) {
    if (cat.items.some(i => i.toLowerCase() === name.toLowerCase())) {
      return cat;
    }
  }
  return { icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-100', label: 'General' };
};

const getConditionMeta = (condition: string) =>
  CONDITIONS.find(c => c.value === condition) || CONDITIONS[1];

export default function EquipmentPage() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<RescuerEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RescuerEquipment | null>(null);
  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [formData, setFormData] = useState({
    equipment_name: '',
    quantity: '1',
    condition: 'good',
  });

  useEffect(() => {
    if (user) fetchEquipment();
  }, [user]);

  const fetchEquipment = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('rescuer_equipment')
      .select('*')
      .eq('rescuer_id', user.id)
      .order('equipment_name');
    if (data) setEquipment(data as RescuerEquipment[]);
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({ equipment_name: '', quantity: '1', condition: 'good' });
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: RescuerEquipment) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        equipment_name: item.equipment_name,
        quantity: item.quantity.toString(),
        condition: item.condition || 'good',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user || !formData.equipment_name) {
      toast.error('Please fill in equipment name');
      return;
    }
    const equipmentData = {
      rescuer_id: user.id,
      equipment_name: formData.equipment_name,
      quantity: parseInt(formData.quantity) || 1,
      condition: formData.condition,
      last_updated: new Date().toISOString(),
    };
    if (editingItem) {
      const { error } = await supabase.from('rescuer_equipment').update(equipmentData).eq('id', editingItem.id);
      if (error) { toast.error('Failed to update equipment'); return; }
      toast.success('Equipment updated');
    } else {
      const { error } = await supabase.from('rescuer_equipment').insert(equipmentData);
      if (error) { toast.error('Failed to add equipment'); return; }
      toast.success('Equipment added');
    }
    setIsDialogOpen(false);
    resetForm();
    fetchEquipment();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('rescuer_equipment').delete().eq('id', id);
    if (error) { toast.error('Failed to delete equipment'); return; }
    toast.success('Equipment removed');
    fetchEquipment();
  };

  const filteredEquipment = equipment.filter(e => {
    const matchesSearch = e.equipment_name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterCondition === 'all' || e.condition === filterCondition;
    return matchesSearch && matchesFilter;
  });

  const counts = {
    excellent: equipment.filter(e => e.condition === 'excellent').length,
    good: equipment.filter(e => e.condition === 'good').length,
    fair: equipment.filter(e => e.condition === 'fair').length,
    poor: equipment.filter(e => e.condition === 'poor').length,
  };
  const totalItems = equipment.reduce((sum, e) => sum + e.quantity, 0);
  const readyPct = equipment.length
    ? Math.round(((counts.excellent + counts.good) / equipment.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap animate-fade-up">
        <div className="flex items-center gap-3">
          <Link to="/rescuer">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-primary" />
              Equipment Inventory
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Manage your rescue equipment and gear</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="btn-hero gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Equipment
        </Button>
      </div>

      {/* Readiness Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-4 animate-fade-up">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Overall Readiness</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-primary">{readyPct}%</span>
              <span className="text-sm text-muted-foreground mb-1">equipment ready</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold text-lg">{equipment.length}</p>
              <p className="text-xs text-muted-foreground">Types</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg">{totalItems}</p>
              <p className="text-xs text-muted-foreground">Total Items</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="font-bold text-lg text-red-500">{counts.poor}</p>
              <p className="text-xs text-muted-foreground">Need Repair</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${readyPct}%` }}
          />
        </div>
      </div>

      {/* Condition Stats */}
      <div className="grid grid-cols-4 gap-2 animate-fade-up">
        {CONDITIONS.map(cond => (
          <button
            key={cond.value}
            onClick={() => setFilterCondition(filterCondition === cond.value ? 'all' : cond.value)}
            className={`rounded-2xl p-3 text-center border-2 transition-all duration-150 ${
              filterCondition === cond.value
                ? `${cond.bg} ${cond.border} shadow-sm`
                : 'bg-card border-border hover:border-muted-foreground/30'
            }`}
          >
            <p className={`text-xl font-bold ${cond.color}`}>{counts[cond.value as keyof typeof counts]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{cond.label}</p>
            <div className={`mt-1.5 h-1 rounded-full bg-muted overflow-hidden`}>
              <div className={`h-full ${cond.bar} ${cond.width}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Search + Filter bar */}
      {equipment.length > 0 && (
        <div className="flex gap-2 animate-fade-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search equipment..."
              className="pl-9 rounded-xl border-border"
            />
          </div>
          {filterCondition !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterCondition('all')}
              className="rounded-xl gap-1.5 text-xs"
            >
              <Filter className="w-3 h-3" />
              {CONDITIONS.find(c => c.value === filterCondition)?.label}
              <XCircle className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}

      {/* Equipment Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-muted rounded-2xl h-36" />
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">No Equipment Yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Add your rescue equipment to track inventory and condition
          </p>
          <Button onClick={() => handleOpenDialog()} className="btn-hero gap-2 rounded-xl">
            <Plus className="w-4 h-4" />
            Add First Equipment
          </Button>
        </div>
      ) : filteredEquipment.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No equipment matches your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredEquipment.map((item, idx) => {
            const catMeta = getCategoryMeta(item.equipment_name);
            const condMeta = getConditionMeta(item.condition || 'good');
            const CatIcon = catMeta.icon;

            return (
              <div
                key={item.id}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up group"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                {/* Top condition color strip */}
                <div className={`h-1 ${condMeta.bar}`} />

                <div className="p-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${catMeta.bg} flex items-center justify-center shrink-0`}>
                        <CatIcon className={`w-5 h-5 ${catMeta.color}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{item.equipment_name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{catMeta.label}</p>
                      </div>
                    </div>

                    {/* Condition indicator */}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${condMeta.bg} ${condMeta.color} ${condMeta.border} border shrink-0`}>
                      {condMeta.label}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Qty</span>
                      <span className="text-sm font-bold ml-auto">{item.quantity}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-muted/60 rounded-xl px-2.5 py-1.5 flex-1">
                      <RefreshCw className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {new Date(item.last_updated).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Condition bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Condition</span>
                      <span className={condMeta.color}>{condMeta.label}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${condMeta.bar} ${condMeta.width} rounded-full transition-all`} />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl h-8 text-xs gap-1.5 hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-colors"
                      onClick={() => handleOpenDialog(item)}
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-4 h-4 text-primary" />
              </div>
              {editingItem ? 'Edit Equipment' : 'Add Equipment'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update equipment details and condition' : 'Add new equipment to your inventory'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Equipment name */}
            <div className="space-y-2">
              <Label htmlFor="equipment_name" className="text-sm font-semibold">Equipment Name *</Label>
              <Select
                value={formData.equipment_name}
                onValueChange={(v) => setFormData({ ...formData, equipment_name: v })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select from list..." />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {cat.label}
                      </div>
                      {cat.items.map((item) => (
                        <SelectItem key={item} value={item}>{item}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="equipment_name"
                value={formData.equipment_name}
                onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                placeholder="Or type custom equipment name"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-sm font-semibold">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData({ ...formData, condition: v })}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cond.dot} inline-block`} />
                          {cond.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Condition preview */}
            {formData.condition && (
              <div className={`rounded-xl p-3 border ${getConditionMeta(formData.condition).bg} ${getConditionMeta(formData.condition).border}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-semibold ${getConditionMeta(formData.condition).color}`}>
                    {getConditionMeta(formData.condition).label} Condition
                  </span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div className={`h-full ${getConditionMeta(formData.condition).bar} ${getConditionMeta(formData.condition).width} rounded-full`} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSave} className="btn-hero rounded-xl">
              {editingItem ? 'Save Changes' : 'Add Equipment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}