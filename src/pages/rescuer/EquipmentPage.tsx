import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Edit2,
  Wrench,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescuerEquipment } from '@/types/database';

const EQUIPMENT_CATEGORIES = [
  { id: 'rescue', label: 'Rescue Equipment', items: ['Life Vest', 'Rescue Rope', 'Life Ring', 'Rescue Boat', 'Stretcher', 'First Aid Kit'] },
  { id: 'safety', label: 'Safety Gear', items: ['Helmet', 'Boots', 'Gloves', 'Raincoat', 'Reflective Vest', 'Goggles'] },
  { id: 'communication', label: 'Communication', items: ['Two-Way Radio', 'Megaphone', 'Flashlight', 'Whistle', 'Signal Flare'] },
  { id: 'tools', label: 'Tools', items: ['Rope Cutter', 'Multi-Tool', 'Axe', 'Crowbar', 'Bolt Cutter'] },
];

const CONDITIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-success text-success-foreground' },
  { value: 'good', label: 'Good', color: 'bg-info text-info-foreground' },
  { value: 'fair', label: 'Fair', color: 'bg-warning text-warning-foreground' },
  { value: 'poor', label: 'Poor', color: 'bg-destructive text-destructive-foreground' },
];

export default function EquipmentPage() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<RescuerEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RescuerEquipment | null>(null);
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
      const { error } = await supabase
        .from('rescuer_equipment')
        .update(equipmentData)
        .eq('id', editingItem.id);

      if (error) {
        toast.error('Failed to update equipment');
        return;
      }
      toast.success('Equipment updated');
    } else {
      const { error } = await supabase
        .from('rescuer_equipment')
        .insert(equipmentData);

      if (error) {
        toast.error('Failed to add equipment');
        return;
      }
      toast.success('Equipment added');
    }

    setIsDialogOpen(false);
    resetForm();
    fetchEquipment();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('rescuer_equipment')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete equipment');
      return;
    }
    toast.success('Equipment removed');
    fetchEquipment();
  };

  const getConditionBadge = (condition: string) => {
    const cond = CONDITIONS.find(c => c.value === condition);
    return cond ? <Badge className={cond.color}>{cond.label}</Badge> : <Badge variant="outline">{condition}</Badge>;
  };

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-info" />;
      case 'fair': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'poor': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return null;
    }
  };

  const excellentCount = equipment.filter(e => e.condition === 'excellent').length;
  const goodCount = equipment.filter(e => e.condition === 'good').length;
  const fairCount = equipment.filter(e => e.condition === 'fair').length;
  const poorCount = equipment.filter(e => e.condition === 'poor').length;

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/rescuer">
            <Button variant="ghost" size="icon" className="shrink-0">
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
        <Button onClick={() => handleOpenDialog()} className="btn-hero gap-2">
          <Plus className="w-4 h-4" />
          Add Equipment
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-fluid-sm">
        <Card className="stat-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-fluid-xl font-bold text-success">{excellentCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Excellent</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-info" />
              <span className="text-fluid-xl font-bold text-info">{goodCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Good</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-fluid-xl font-bold text-warning">{fairCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Fair</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-fluid-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-destructive" />
              <span className="text-fluid-xl font-bold text-destructive">{poorCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Needs Repair</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-20" />
            </Card>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <Card className="dashboard-card text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-display text-fluid-lg font-semibold mb-2">No Equipment Added</h3>
            <p className="text-muted-foreground text-fluid-sm mb-6">
              Add your rescue equipment to track inventory and condition
            </p>
            <Button onClick={() => handleOpenDialog()} className="btn-hero gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Equipment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-md">
          {equipment.map((item) => (
            <Card key={item.id} className="dashboard-card">
              <CardContent className="p-fluid-md">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-fluid-base">{item.equipment_name}</h3>
                      <p className="text-fluid-xs text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  {getConditionIcon(item.condition || '')}
                </div>

                <div className="flex items-center justify-between mb-3">
                  {getConditionBadge(item.condition || 'good')}
                  <span className="text-fluid-xs text-muted-foreground">
                    Updated: {new Date(item.last_updated).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleOpenDialog(item)}>
                    <Edit2 className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {editingItem ? 'Edit Equipment' : 'Add Equipment'}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update equipment details' : 'Add new equipment to your inventory'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_name">Equipment Name *</Label>
              <Select
                value={formData.equipment_name}
                onValueChange={(v) => setFormData({ ...formData, equipment_name: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select or type equipment name" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{cat.label}</div>
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
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(v) => setFormData({ ...formData, condition: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((cond) => (
                      <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="btn-hero">{editingItem ? 'Save Changes' : 'Add Equipment'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
