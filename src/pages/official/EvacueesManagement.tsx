import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft, Users, Plus, Search, Phone, MapPin, Clock,
  Baby, Heart, Accessibility, Stethoscope, Trash2, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { Evacuee, EvacuationCenter } from '@/types/database';

const SPECIAL_NEEDS = [
  { id: 'elderly', label: 'Elderly (60+)', icon: Heart },
  { id: 'pwd', label: 'Person with Disability', icon: Accessibility },
  { id: 'infant', label: 'Infant/Toddler', icon: Baby },
  { id: 'medical', label: 'Medical Condition', icon: Stethoscope },
  { id: 'pregnant', label: 'Pregnant', icon: Heart },
];

export default function EvacueesManagementPage() {
  const { user } = useAuth();
  const [evacuees, setEvacuees] = useState<Evacuee[]>([]);
  const [center, setCenter] = useState<EvacuationCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    family_name: '',
    adults_count: '1',
    children_count: '0',
    home_address: '',
    contact_number: '',
    special_needs: [] as string[],
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const { data: centerData } = await supabase
      .from('evacuation_centers')
      .select('*')
      .eq('assigned_official_id', user.id)
      .maybeSingle();

    if (centerData) {
      setCenter(centerData as EvacuationCenter);

      const { data: evacueeData } = await supabase
        .from('evacuees')
        .select('*')
        .eq('evacuation_center_id', centerData.id)
        .is('checked_out_at', null)
        .order('checked_in_at', { ascending: false });

      if (evacueeData) setEvacuees(evacueeData as Evacuee[]);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!user || !center || !formData.family_name.trim()) {
      toast.error('Please fill in the family name');
      return;
    }

    const { error } = await supabase.from('evacuees').insert({
      family_name: formData.family_name.trim(),
      adults_count: parseInt(formData.adults_count) || 1,
      children_count: parseInt(formData.children_count) || 0,
      home_address: formData.home_address || null,
      contact_number: formData.contact_number || null,
      special_needs: formData.special_needs.length > 0 ? formData.special_needs : null,
      evacuation_center_id: center.id,
      registered_by: user.id,
    });

    if (error) {
      toast.error('Failed to register evacuee');
    } else {
      const totalPeople = (parseInt(formData.adults_count) || 1) + (parseInt(formData.children_count) || 0);
      await supabase.from('evacuation_centers').update({
        current_occupancy: center.current_occupancy + totalPeople,
      }).eq('id', center.id);

      toast.success('Evacuee registered successfully');
      setIsDialogOpen(false);
      setFormData({ family_name: '', adults_count: '1', children_count: '0', home_address: '', contact_number: '', special_needs: [] });
      fetchData();
    }
  };

  const handleCheckout = async (evacuee: Evacuee) => {
    const { error } = await supabase.from('evacuees').update({
      checked_out_at: new Date().toISOString(),
    }).eq('id', evacuee.id);

    if (!error && center) {
      const totalPeople = evacuee.adults_count + evacuee.children_count;
      await supabase.from('evacuation_centers').update({
        current_occupancy: Math.max(0, center.current_occupancy - totalPeople),
      }).eq('id', center.id);

      toast.success(`${evacuee.family_name} family checked out`);
      fetchData();
    }
  };

  const toggleSpecialNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      special_needs: prev.special_needs.includes(need)
        ? prev.special_needs.filter(n => n !== need)
        : [...prev.special_needs, need]
    }));
  };

  const filtered = evacuees.filter(e =>
    e.family_name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPeople = evacuees.reduce((s, e) => s + e.adults_count + e.children_count, 0);

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
              <Users className="w-6 h-6 text-primary" />
              Evacuee Registration
            </h1>
            <p className="text-muted-foreground text-fluid-sm">
              {center ? center.name : 'No center assigned'}
            </p>
          </div>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="btn-hero gap-2" disabled={!center}>
          <Plus className="w-4 h-4" />
          Register Family
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-fluid-sm">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-primary">{evacuees.length}</p>
            <p className="text-fluid-xs text-muted-foreground">Families</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-info">{totalPeople}</p>
            <p className="text-fluid-xs text-muted-foreground">Total People</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <p className="text-fluid-2xl font-bold text-success">
              {center ? center.max_capacity - center.current_occupancy : 0}
            </p>
            <p className="text-fluid-xs text-muted-foreground">Spaces Left</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search families..." className="pl-10" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Card key={i} className="animate-pulse"><CardContent className="p-fluid-md h-24" /></Card>)}
        </div>
      ) : !center ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Center Assigned</h3>
            <p className="text-fluid-sm text-muted-foreground">Contact MDRRMO to be assigned to an evacuation center</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Evacuees Registered</h3>
            <p className="text-fluid-sm text-muted-foreground">Register families as they arrive</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((evacuee) => (
            <Card key={evacuee.id} className="dashboard-card">
              <CardContent className="p-fluid-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-fluid-base">{evacuee.family_name} Family</h3>
                      <div className="flex items-center gap-3 text-fluid-xs text-muted-foreground flex-wrap">
                        <span>{evacuee.adults_count} adults</span>
                        <span>{evacuee.children_count} children</span>
                        {evacuee.contact_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {evacuee.contact_number}
                          </span>
                        )}
                      </div>
                      {evacuee.special_needs && evacuee.special_needs.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {evacuee.special_needs.map((n, i) => (
                            <Badge key={i} variant="outline" className="text-fluid-xs">{n}</Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-fluid-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Checked in: {new Date(evacuee.checked_in_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCheckout(evacuee)} className="gap-1 shrink-0">
                    <CheckCircle className="w-3 h-3" />
                    Check Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Register Evacuee Family
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="family_name">Family Name *</Label>
              <Input id="family_name" value={formData.family_name} onChange={(e) => setFormData({ ...formData, family_name: e.target.value })} placeholder="e.g., Dela Cruz" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <Input id="adults" type="number" min="1" value={formData.adults_count} onChange={(e) => setFormData({ ...formData, adults_count: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <Input id="children" type="number" min="0" value={formData.children_count} onChange={(e) => setFormData({ ...formData, children_count: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input id="contact" type="tel" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} placeholder="09XXXXXXXXX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Home Address</Label>
              <Input id="address" value={formData.home_address} onChange={(e) => setFormData({ ...formData, home_address: e.target.value })} placeholder="Original home address" />
            </div>
            <div className="space-y-2">
              <Label>Special Needs</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIAL_NEEDS.map((need) => {
                  const isSelected = formData.special_needs.includes(need.id);
                  return (
                    <div key={need.id} onClick={() => toggleSpecialNeed(need.id)} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <Checkbox checked={isSelected} />
                      <need.icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-fluid-xs">{need.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRegister} className="btn-hero">Register Family</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
