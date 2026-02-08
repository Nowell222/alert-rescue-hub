import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Package,
  Plus,
  CheckCircle,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { RescuerEquipment } from '@/types/database';

const DEFAULT_EQUIPMENT = [
  'Rescue Boat',
  'Life Vests',
  'Rope (50m)',
  'First Aid Kit',
  'Flashlight',
  'Radio',
  'Megaphone',
  'Stretcher'
];

export default function EquipmentPage() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState<RescuerEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newQty, setNewQty] = useState('1');

  useEffect(() => {
    if (user) fetchEquipment();
  }, [user]);

  const fetchEquipment = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('rescuer_equipment')
      .select('*')
      .eq('rescuer_id', user.id);

    if (data) setEquipment(data as RescuerEquipment[]);
    setLoading(false);
  };

  const addEquipment = async () => {
    if (!user || !newItem.trim()) return;

    const { error } = await supabase
      .from('rescuer_equipment')
      .insert({
        rescuer_id: user.id,
        equipment_name: newItem.trim(),
        quantity: parseInt(newQty) || 1,
        condition: 'good'
      });

    if (error) {
      toast.error('Failed to add equipment');
    } else {
      toast.success('Equipment added');
      setNewItem('');
      setNewQty('1');
      setDialogOpen(false);
      fetchEquipment();
    }
  };

  const updateCondition = async (id: string, condition: string) => {
    const { error } = await supabase
      .from('rescuer_equipment')
      .update({ condition, last_updated: new Date().toISOString() })
      .eq('id', id);

    if (!error) {
      toast.success('Condition updated');
      fetchEquipment();
    }
  };

  const removeEquipment = async (id: string) => {
    const { error } = await supabase
      .from('rescuer_equipment')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Equipment removed');
      fetchEquipment();
    }
  };

  const addDefaultEquipment = async () => {
    if (!user) return;

    const items = DEFAULT_EQUIPMENT.map(name => ({
      rescuer_id: user.id,
      equipment_name: name,
      quantity: name.includes('Vest') ? 5 : 1,
      condition: 'good'
    }));

    const { error } = await supabase
      .from('rescuer_equipment')
      .insert(items);

    if (!error) {
      toast.success('Equipment checklist added');
      fetchEquipment();
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'good': return 'bg-success text-success-foreground';
      case 'needs_repair': return 'bg-warning text-warning-foreground';
      case 'out_of_service': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/rescuer">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Package className="w-6 h-6 text-accent" />
              Equipment
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Manage your rescue gear</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="item">Equipment Name</Label>
                <Input
                  id="item"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="e.g., Life Vest"
                />
              </div>
              <div>
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                  min={1}
                />
              </div>
              <Button onClick={addEquipment} className="w-full">Add Equipment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-16" />
            </Card>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="icon-box-lg mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Equipment Logged</h3>
            <p className="text-fluid-sm text-muted-foreground mb-4">
              Add your rescue equipment to track condition and availability
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={addDefaultEquipment}>
                Add Default Checklist
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(true)}>
                Add Custom Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {equipment.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-fluid-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-md">
                  <div className="flex items-center gap-fluid-md">
                    <div className="icon-box-md rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-semibold text-fluid-base">{item.equipment_name}</p>
                      <p className="text-fluid-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={item.condition}
                      onChange={(e) => updateCondition(item.id, e.target.value)}
                      className={`text-fluid-xs px-2 py-1 rounded-full border-0 ${getConditionColor(item.condition)}`}
                    >
                      <option value="good">✓ Good</option>
                      <option value="needs_repair">⚠ Needs Repair</option>
                      <option value="out_of_service">✕ Out of Service</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEquipment(item.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {equipment.length > 0 && (
        <Card className="stat-card">
          <CardContent className="p-fluid-md">
            <div className="grid grid-cols-3 gap-fluid-md text-center">
              <div>
                <p className="text-fluid-2xl font-bold text-success">
                  {equipment.filter(e => e.condition === 'good').length}
                </p>
                <p className="text-fluid-xs text-muted-foreground">Good</p>
              </div>
              <div>
                <p className="text-fluid-2xl font-bold text-warning">
                  {equipment.filter(e => e.condition === 'needs_repair').length}
                </p>
                <p className="text-fluid-xs text-muted-foreground">Needs Repair</p>
              </div>
              <div>
                <p className="text-fluid-2xl font-bold text-destructive">
                  {equipment.filter(e => e.condition === 'out_of_service').length}
                </p>
                <p className="text-fluid-xs text-muted-foreground">Out of Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
