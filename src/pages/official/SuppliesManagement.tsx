import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Package, Plus, Trash2, Edit2,
  Droplets, Utensils, Pill, Baby, ShieldCheck,
  AlertTriangle, ChevronRight, X, Activity,
  TrendingUp, Minus,
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
  { id: 'food',    label: 'Food',         icon: Utensils,   color: 'bg-orange-100 text-orange-600',  strip: 'bg-orange-500' },
  { id: 'water',   label: 'Water',        icon: Droplets,   color: 'bg-blue-100 text-blue-600',      strip: 'bg-blue-500' },
  { id: 'medicine',label: 'Medicine',     icon: Pill,       color: 'bg-red-100 text-red-600',        strip: 'bg-red-500' },
  { id: 'baby',    label: 'Baby Supplies',icon: Baby,       color: 'bg-pink-100 text-pink-600',      strip: 'bg-pink-500' },
  { id: 'hygiene', label: 'Hygiene',      icon: ShieldCheck,color: 'bg-green-100 text-green-600',    strip: 'bg-green-600' },
  { id: 'other',   label: 'Other',        icon: Package,    color: 'bg-slate-100 text-slate-600',    strip: 'bg-slate-500' },
];

const EMPTY_FORM = { name: '', category: 'food', currentStock: '0', maxStock: '100', unit: 'packs' };

// ── Reliable Modal — no backdrop dismiss ──────────────────────────────────────
function Modal({ open, children }: { open: boolean; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function SuppliesManagementPage() {
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState<Supply | null>(null);
  const [editingItem, setEditingItem] = useState<Supply | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    const saved = localStorage.getItem('evac_supplies');
    if (saved) setSupplies(JSON.parse(saved));
  }, []);

  const persist = (items: Supply[]) => {
    localStorage.setItem('evac_supplies', JSON.stringify(items));
    setSupplies(items);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormData({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEdit = (item: Supply) => {
    setEditingItem(item);
    setFormData({
      name: item.name, category: item.category,
      currentStock: item.currentStock.toString(),
      maxStock: item.maxStock.toString(),
      unit: item.unit,
    });
    setSelectedSupply(null);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) { toast.error('Enter supply name'); return; }
    const item: Supply = {
      id: editingItem?.id || Date.now().toString(),
      name: formData.name.trim(),
      category: formData.category,
      currentStock: parseInt(formData.currentStock) || 0,
      maxStock: parseInt(formData.maxStock) || 100,
      unit: formData.unit.trim() || 'packs',
      lastUpdated: new Date().toISOString(),
    };
    if (editingItem) {
      persist(supplies.map(s => s.id === editingItem.id ? item : s));
      toast.success('Supply updated');
    } else {
      persist([...supplies, item]);
      toast.success('Supply added');
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    persist(supplies.filter(s => s.id !== id));
    setSelectedSupply(null);
    toast.success('Supply removed');
  };

  const updateStock = (id: string, delta: number) => {
    const updated = supplies.map(s =>
      s.id === id
        ? { ...s, currentStock: Math.max(0, s.currentStock + delta), lastUpdated: new Date().toISOString() }
        : s
    );
    persist(updated);
    // Keep detail modal in sync
    const updatedItem = updated.find(s => s.id === id);
    if (updatedItem && selectedSupply?.id === id) setSelectedSupply(updatedItem);
  };

  const getStockConfig = (current: number, max: number) => {
    const pct = max > 0 ? (current / max) * 100 : 0;
    if (pct <= 20) return {
      label: 'Critical', bar: 'bg-red-500',
      bg: 'bg-red-50 border-l-4 border-red-500',
      iconBg: 'bg-red-100', iconColor: 'text-red-600',
      badge: 'bg-red-100 text-red-700 border border-red-200',
      text: 'text-red-600', stripBg: 'bg-red-500',
    };
    if (pct <= 50) return {
      label: 'Low', bar: 'bg-amber-500',
      bg: 'bg-amber-50 border-l-4 border-amber-500',
      iconBg: 'bg-amber-100', iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700 border border-amber-200',
      text: 'text-amber-600', stripBg: 'bg-amber-500',
    };
    return {
      label: 'Adequate', bar: 'bg-green-500',
      bg: 'bg-green-50 border-l-4 border-green-500',
      iconBg: 'bg-green-100', iconColor: 'text-green-600',
      badge: 'bg-green-100 text-green-700 border border-green-200',
      text: 'text-green-600', stripBg: 'bg-green-600',
    };
  };

  const getCatDef = (id: string) => CATEGORIES.find(c => c.id === id) || CATEGORIES[5];

  const lowStockCount = supplies.filter(s => (s.currentStock / s.maxStock) * 100 <= 20).length;
  const adequateCount = supplies.filter(s => (s.currentStock / s.maxStock) * 100 > 50).length;

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
            <Package className="w-6 h-6 text-accent" />
            Supplies Management
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Track evacuation center supplies</p>
        </div>
        <Button type="button" onClick={openAdd} className="gap-1.5 shrink-0 rounded-xl">
          <Plus className="w-4 h-4" />
          Add Supply
        </Button>
      </div>

      {/* Low stock warning */}
      {lowStockCount > 0 && (
        <div className="rounded-2xl bg-red-50 border-l-4 border-red-500 p-4 flex items-center gap-3 animate-fade-up stagger-1">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-red-700">Low Stock Alert</p>
            <p className="text-xs text-muted-foreground">{lowStockCount} supply item{lowStockCount !== 1 ? 's' : ''} critically low</p>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground animate-fade-up stagger-1 shadow-md">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{supplies.length}</p>
            <p className="text-xs text-white/70 mt-0.5">Tracked</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-300">{adequateCount}</p>
            <p className="text-xs text-white/70 mt-0.5">Adequate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-300">{lowStockCount}</p>
            <p className="text-xs text-white/70 mt-0.5">Critical</p>
          </div>
        </div>
      </div>

      {/* Supply List */}
      {supplies.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Supplies Tracked</h3>
            <p className="text-fluid-sm text-muted-foreground">Add supplies to track inventory levels</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {supplies.map((item, idx) => {
            const pct = Math.round((item.currentStock / item.maxStock) * 100);
            const stock = getStockConfig(item.currentStock, item.maxStock);
            const cat = getCatDef(item.category);
            const CatIcon = cat.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSupply(item)}
                className={`w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up ${stock.bg}`}
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${stock.iconBg} flex items-center justify-center shrink-0 ${stock.iconColor}`}>
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-fluid-base font-display">{item.name}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stock.badge}`}>
                        {stock.label}
                      </span>
                    </div>
                    <p className="text-fluid-sm text-foreground/75 mb-2 capitalize">{cat.label}</p>
                    {/* Mini bar */}
                    <div className="w-full bg-black/10 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div className={`h-full rounded-full ${stock.bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className={`text-xs font-medium ${stock.text}`}>
                        {item.currentStock} / {item.maxStock} {item.unit}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {pct}% remaining
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── SUPPLY DETAIL MODAL ── */}
      <Modal open={!!selectedSupply}>
        {selectedSupply && (() => {
          const pct = Math.round((selectedSupply.currentStock / selectedSupply.maxStock) * 100);
          const stock = getStockConfig(selectedSupply.currentStock, selectedSupply.maxStock);
          const cat = getCatDef(selectedSupply.category);
          const CatIcon = cat.icon;
          return (
            <>
              {/* Colored strip */}
              <div className={`p-5 ${stock.stripBg} text-white flex-shrink-0 rounded-t-3xl sm:rounded-t-3xl`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{cat.label}</p>
                      <h2 className="font-bold text-lg leading-tight">{selectedSupply.name}</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedSupply(null)}
                    className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-3 text-white/70 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-semibold">{stock.label}</span>
                  <span>Updated {new Date(selectedSupply.lastUpdated).toLocaleString()}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-5 overflow-y-auto flex-1">

                {/* Stats grid */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Stock Overview
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <CatIcon className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className={`font-semibold text-sm mt-0.5 ${stock.text}`}>{selectedSupply.currentStock}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <Package className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Capacity</p>
                      <p className="font-semibold text-sm mt-0.5">{selectedSupply.maxStock}</p>
                    </div>
                    <div className="bg-muted/50 rounded-2xl p-3 text-center">
                      <TrendingUp className={`w-5 h-5 mx-auto mb-1 ${stock.iconColor}`} />
                      <p className="text-xs text-muted-foreground">Fill %</p>
                      <p className={`font-semibold text-sm mt-0.5 ${stock.text}`}>{pct}%</p>
                    </div>
                  </div>
                </section>

                {/* Stock gauge */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Stock Level
                  </h3>
                  <div className="bg-muted/50 rounded-2xl p-4">
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <span className="text-3xl font-bold">{selectedSupply.currentStock}</span>
                        <span className="text-muted-foreground ml-1">{selectedSupply.unit}</span>
                      </div>
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${stock.badge}`}>
                        {stock.label}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${stock.bar}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0</span>
                      <span>Max: {selectedSupply.maxStock} {selectedSupply.unit}</span>
                    </div>
                  </div>
                </section>

                {/* Adjust stock */}
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Adjust Stock
                  </h3>
                  <div className="bg-muted/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => updateStock(selectedSupply.id, -1)}
                      className="w-11 h-11 rounded-xl border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                      <span className="text-4xl font-bold">{selectedSupply.currentStock}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedSupply.unit}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateStock(selectedSupply.id, 1)}
                      className="w-11 h-11 rounded-xl border border-input bg-background flex items-center justify-center hover:bg-accent transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </section>

              </div>

              {/* Footer actions */}
              <div className="p-4 border-t border-border flex gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(selectedSupply)}
                  className="flex-1 rounded-xl h-11 font-semibold flex items-center justify-center gap-2 border border-input bg-background hover:bg-accent transition-colors text-sm"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedSupply.id)}
                  className="rounded-xl h-11 px-4 font-semibold flex items-center justify-center gap-2 border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* ── ADD / EDIT FORM MODAL ── */}
      <Modal open={showForm}>
        {/* Strip */}
        <div className={`p-5 text-white flex-shrink-0 rounded-t-3xl sm:rounded-t-3xl ${
          editingItem
            ? getCatDef(formData.category).strip
            : 'bg-primary'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {(() => { const I = getCatDef(formData.category).icon; return <I className="w-5 h-5" />; })()}
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">
                  {editingItem ? 'Editing Supply' : 'New Supply'}
                </p>
                <h2 className="font-bold text-lg leading-tight">
                  {editingItem ? editingItem.name : 'Add Supply'}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Name */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Supply Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g., Rice, Canned Goods"
              className="mt-1.5 rounded-xl"
            />
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Category</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {CATEGORIES.map((cat) => {
                const isSelected = formData.category === cat.id;
                const CIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, category: cat.id }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-background'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary/10' : cat.color.split(' ')[0]}`}>
                      <CIcon className={`w-4 h-4 ${isSelected ? 'text-primary' : cat.color.split(' ')[1]}`} />
                    </div>
                    <span className="text-xs font-medium leading-tight text-center">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Current</Label>
              <Input
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData(p => ({ ...p, currentStock: e.target.value }))}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Max</Label>
              <Input
                type="number"
                min="1"
                value={formData.maxStock}
                onChange={(e) => setFormData(p => ({ ...p, maxStock: e.target.value }))}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Unit</Label>
              <Input
                value={formData.unit}
                onChange={(e) => setFormData(p => ({ ...p, unit: e.target.value }))}
                placeholder="packs"
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>

          {/* Preview */}
          {formData.name.trim() && (() => {
            const previewStock = getStockConfig(parseInt(formData.currentStock) || 0, parseInt(formData.maxStock) || 100);
            const previewCat = getCatDef(formData.category);
            const PreviewIcon = previewCat.icon;
            return (
              <div className={`rounded-2xl p-3 ${previewStock.bg}`}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg ${previewStock.iconBg} flex items-center justify-center shrink-0`}>
                    <PreviewIcon className={`w-3.5 h-3.5 ${previewStock.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{formData.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.currentStock}/{formData.maxStock} {formData.unit} · {previewStock.label}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Submit */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="w-full rounded-xl h-12 font-semibold flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Package className="w-4 h-4" />
            {editingItem ? 'Save Changes' : 'Add Supply'}
          </button>
        </div>
      </Modal>

    </div>
  );
}