import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Package, Plus, Trash2, Edit2,
  Droplets, Utensils, Pill, Baby, ShieldCheck, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface Supply {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  maxStock: number;
  unit: string;
  lastUpdated: string;
}

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'water', label: 'Water', icon: Droplets },
  { id: 'medicine', label: 'Medicine', icon: Pill },
  { id: 'baby', label: 'Baby Supplies', icon: Baby },
  { id: 'hygiene', label: 'Hygiene', icon: ShieldCheck },
  { id: 'other', label: 'Other', icon: Package },
];

export default function SuppliesManagementPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Supply | null>(null);
  const [formData, setFormData] = useState({
    name: '', category: 'food', currentStock: '0', maxStock: '100', unit: 'packs',
  });

  useEffect(() => {
    const saved = localStorage.getItem('evac_supplies');
    if (saved) setSupplies(JSON.parse(saved));
  }, []);

  const save = (items: Supply[]) => {
    localStorage.setItem('evac_supplies', JSON.stringify(items));
    setSupplies(items);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error('Enter supply name'); return; }
    const item: Supply = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name,
      category: formData.category,
      currentStock: parseInt(formData.currentStock) || 0,
      maxStock: parseInt(formData.maxStock) || 100,
      unit: formData.unit,
      lastUpdated: new Date().toISOString(),
    };

    if (editingItem) {
      save(supplies.map(s => s.id === editingItem.id ? item : s));
      toast.success('Supply updated');
    } else {
      save([...supplies, item]);
      toast.success('Supply added');
    }
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ name: '', category: 'food', currentStock: '0', maxStock: '100', unit: 'packs' });
  };

  const handleEdit = (item: Supply) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category,
      currentStock: item.currentStock.toString(), maxStock: item.maxStock.toString(), unit: item.unit,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    save(supplies.filter(s => s.id !== id));
    toast.success('Supply removed');
  };

  const updateStock = (id: string, delta: number) => {
    save(supplies.map(s => s.id === id ? { ...s, currentStock: Math.max(0, s.currentStock + delta), lastUpdated: new Date().toISOString() } : s));
  };

  const getStockLevel = (current: number, max: number) => {
    const pct = (current / max) * 100;
    if (pct <= 20) return { label: 'Critical', color: 'text-destructive', barColor: '[&>div]:bg-destructive' };
    if (pct <= 50) return { label: 'Low', color: 'text-warning', barColor: '[&>div]:bg-warning' };
    return { label: 'Adequate', color: 'text-success', barColor: '[&>div]:bg-success' };
  };

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORIES.find(c => c.id === cat);
    return found ? found.icon : Package;
  };

  const lowStockCount = supplies.filter(s => (s.currentStock / s.maxStock) * 100 <= 20).length;

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
              <Package className="w-6 h-6 text-accent" />
              Supplies Management
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Track evacuation center supplies</p>
          </div>
        </div>
        <Button onClick={() => { setEditingItem(null); setFormData({ name: '', category: 'food', currentStock: '0', maxStock: '100', unit: 'packs' }); setIsDialogOpen(true); }} className="btn-hero gap-2">
          <Plus className="w-4 h-4" />
          Add Supply
        </Button>
      </div>

      {lowStockCount > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-fluid-md flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <div>
              <p className="font-semibold text-fluid-sm text-destructive">Low Stock Alert</p>
              <p className="text-fluid-xs text-muted-foreground">{lowStockCount} supply item(s) critically low</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-fluid-sm">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-primary">{supplies.length}</p>
            <p className="text-fluid-xs text-muted-foreground">Items Tracked</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-success">
              {supplies.filter(s => (s.currentStock / s.maxStock) * 100 > 50).length}
            </p>
            <p className="text-fluid-xs text-muted-foreground">Adequate</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-destructive">{lowStockCount}</p>
            <p className="text-fluid-xs text-muted-foreground">Critical</p>
          </CardContent>
        </Card>
      </div>

      {supplies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Supplies Tracked</h3>
            <p className="text-fluid-sm text-muted-foreground">Add supplies to track inventory levels</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md">
          {supplies.map((item) => {
            const stockLevel = getStockLevel(item.currentStock, item.maxStock);
            const pct = Math.round((item.currentStock / item.maxStock) * 100);
            const CategoryIcon = getCategoryIcon(item.category);
            return (
              <Card key={item.id} className="dashboard-card">
                <CardContent className="p-fluid-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-success flex items-center justify-center">
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-fluid-base">{item.name}</h3>
                        <p className="text-fluid-xs text-muted-foreground capitalize">{item.category}</p>
                      </div>
                    </div>
                    <Badge className={stockLevel.color} variant="outline">{stockLevel.label}</Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-fluid-xs mb-1">
                      <span>Stock Level</span>
                      <span className={`font-bold ${stockLevel.color}`}>{item.currentStock}/{item.maxStock} {item.unit}</span>
                    </div>
                    <Progress value={pct} className={`h-2 ${stockLevel.barColor}`} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="outline" onClick={() => updateStock(item.id, -1)}>-</Button>
                      <span className="px-2 text-fluid-sm font-medium">{item.currentStock}</span>
                      <Button size="sm" variant="outline" onClick={() => updateStock(item.id, 1)}>+</Button>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}><Edit2 className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingItem ? 'Edit Supply' : 'Add Supply'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Supply Name *</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Rice, Canned Goods" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Current</Label>
                <Input type="number" min="0" value={formData.currentStock} onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Max</Label>
                <Input type="number" min="1" value={formData.maxStock} onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="packs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="btn-hero">{editingItem ? 'Save' : 'Add Supply'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
