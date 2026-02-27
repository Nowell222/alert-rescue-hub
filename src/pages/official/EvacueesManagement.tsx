import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Users, Plus, Search, Phone, MapPin, Clock,
  Baby, Heart, Accessibility, Stethoscope, CheckCircle,
  ChevronRight, X, Activity, Navigation, Building2,
  Shield, Hash, ExternalLink, Locate, AlertCircle,
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

const EMPTY_FORM = {
  family_name: '',
  adults_count: '1',
  children_count: '0',
  home_address: '',
  contact_number: '',
  special_needs: [] as string[],
};

// ─── Modal component ──────────────────────────────────────────────────────────
// Backdrop does NOT close the modal on click. Only the X button closes it.
// This prevents any interaction inside the modal from accidentally dismissing it.
function Modal({ open, children }: { open: boolean; children: React.ReactNode }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-background w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EvacueesManagementPage() {
  const { user } = useAuth();
  const [evacuees, setEvacuees] = useState<Evacuee[]>([]);
  const [center, setCenter] = useState<EvacuationCenter | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedEvacuee, setSelectedEvacuee] = useState<Evacuee | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });

  useEffect(() => { fetchData(); }, [user]);

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
    if (!user || !center) { toast.error('No center assigned'); return; }
    if (!formData.family_name.trim()) { toast.error('Please fill in the family name'); return; }
    if (submitting) return;

    setSubmitting(true);
    const { error } = await supabase.from('evacuees').insert({
      family_name: formData.family_name.trim(),
      adults_count: parseInt(formData.adults_count) || 1,
      children_count: parseInt(formData.children_count) || 0,
      home_address: formData.home_address.trim() || null,
      contact_number: formData.contact_number.trim() || null,
      special_needs: formData.special_needs.length > 0 ? formData.special_needs : null,
      evacuation_center_id: center.id,
      registered_by: user.id,
    });

    if (error) {
      toast.error('Failed to register evacuee');
      setSubmitting(false);
      return;
    }

    const totalPeople = (parseInt(formData.adults_count) || 1) + (parseInt(formData.children_count) || 0);
    await supabase
      .from('evacuation_centers')
      .update({ current_occupancy: center.current_occupancy + totalPeople })
      .eq('id', center.id);

    toast.success(`${formData.family_name} family registered!`);
    setShowForm(false);
    setFormData({ ...EMPTY_FORM });
    setSubmitting(false);
    fetchData();
  };

  const handleCheckout = async (evacuee: Evacuee) => {
    const { error } = await supabase
      .from('evacuees')
      .update({ checked_out_at: new Date().toISOString() })
      .eq('id', evacuee.id);

    if (!error && center) {
      const totalPeople = evacuee.adults_count + evacuee.children_count;
      await supabase
        .from('evacuation_centers')
        .update({ current_occupancy: Math.max(0, center.current_occupancy - totalPeople) })
        .eq('id', center.id);
      toast.success(`${evacuee.family_name} family checked out`);
      setSelectedEvacuee(null);
      fetchData();
    }
  };

  const handleAutolocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          setFormData(p => ({ ...p, home_address: data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
          toast.success('Location detected');
        } catch {
          setFormData(p => ({ ...p, home_address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` }));
          toast.success('Coordinates captured');
        }
        setLocating(false);
      },
      () => { toast.error('Location access denied'); setLocating(false); }
    );
  };

  const toggleSpecialNeed = (id: string) =>
    setFormData(p => ({
      ...p,
      special_needs: p.special_needs.includes(id)
        ? p.special_needs.filter(n => n !== id)
        : [...p.special_needs, id],
    }));

  const getNeedLabel = (id: string) => SPECIAL_NEEDS.find(n => n.id === id)?.label || id;

  const filtered = evacuees.filter(e => e.family_name.toLowerCase().includes(search.toLowerCase()));
  const totalPeople = evacuees.reduce((s, e) => s + e.adults_count + e.children_count, 0);

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
            <Users className="w-6 h-6 text-primary" />
            Evacuee Registration
          </h1>
          <p className="text-muted-foreground text-fluid-sm">
            {center ? center.name : 'No center assigned'}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={!center}
          className="gap-1.5 shrink-0 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          Register Evacuation
        </Button>
      </div>

      {/* Summary strip */}
      <div className="rounded-2xl bg-primary p-4 text-primary-foreground animate-fade-up stagger-1 shadow-md">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-2xl font-bold">{evacuees.length}</p>
            <p className="text-xs text-white/70 mt-0.5">Families</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalPeople}</p>
            <p className="text-xs text-white/70 mt-0.5">Total People</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-300">
              {center ? Math.max(center.max_capacity - center.current_occupancy, 0) : 0}
            </p>
            <p className="text-xs text-white/70 mt-0.5">Spaces Left</p>
          </div>
        </div>
        {center && (
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white/80 text-xs min-w-0">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{center.address || center.name}</span>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(center.address || center.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1 rounded-full shrink-0"
            >
              <Navigation className="w-3 h-3" />
              Get Directions
            </a>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative animate-fade-up stagger-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search families..."
          className="pl-10 rounded-xl"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse dashboard-card">
              <CardContent className="p-fluid-md h-24" />
            </Card>
          ))}
        </div>
      ) : !center ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">No Center Assigned</h3>
            <p className="text-fluid-sm text-muted-foreground">Contact MDRRMO to be assigned to an evacuation center</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12 dashboard-card animate-fade-up">
          <CardContent>
            <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-semibold text-fluid-lg mb-2 font-display">
              {search ? 'No results found' : 'No Evacuees Registered'}
            </h3>
            <p className="text-fluid-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'Register families as they arrive'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((evacuee, idx) => (
            <button
              key={evacuee.id}
              type="button"
              onClick={() => setSelectedEvacuee(evacuee)}
              className="w-full text-left rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-up bg-blue-50 border-l-4 border-blue-400"
              style={{ animationDelay: `${idx * 0.04}s` }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 font-bold text-sm text-blue-600">
                  {evacuee.family_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-fluid-base font-display">{evacuee.family_name} Family</h3>
                    {evacuee.special_needs && evacuee.special_needs.length > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        Special Needs
                      </span>
                    )}
                  </div>
                  <p className="text-fluid-sm text-foreground/75 mb-2">
                    {evacuee.adults_count} adult{evacuee.adults_count !== 1 ? 's' : ''} · {evacuee.children_count} child{evacuee.children_count !== 1 ? 'ren' : ''}
                  </p>
                  <div className="flex items-center gap-4 flex-wrap">
                    {evacuee.contact_number && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />{evacuee.contact_number}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Clock className="w-3 h-3" />{new Date(evacuee.checked_in_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── EVACUEE DETAIL MODAL ── */}
      <Modal open={!!selectedEvacuee}>
        {selectedEvacuee && (
          <>
            <div className="p-5 bg-blue-500 text-white flex-shrink-0 rounded-t-3xl sm:rounded-t-3xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-sm">
                    {selectedEvacuee.family_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Evacuee Record</p>
                    <h2 className="font-bold text-lg leading-tight">{selectedEvacuee.family_name} Family</h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEvacuee(null)}
                  className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-3 text-white/70 text-xs flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Checked in {new Date(selectedEvacuee.checked_in_at).toLocaleString()}
                </span>
                {selectedEvacuee.special_needs && selectedEvacuee.special_needs.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/30 text-white text-xs font-semibold">Special Needs</span>
                )}
              </div>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Family Details
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: <Users className="w-5 h-5 text-blue-500" />, label: 'Adults', value: selectedEvacuee.adults_count },
                    { icon: <Baby className="w-5 h-5 text-pink-400" />, label: 'Children', value: selectedEvacuee.children_count },
                    { icon: <Hash className="w-5 h-5 text-muted-foreground" />, label: 'Total', value: selectedEvacuee.adults_count + selectedEvacuee.children_count },
                  ].map(({ icon, label, value }) => (
                    <div key={label} className="bg-muted/50 rounded-2xl p-3 text-center">
                      <div className="flex justify-center mb-1">{icon}</div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="font-semibold text-sm mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Contact & Location
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Contact Number</p>
                      {selectedEvacuee.contact_number
                        ? <a href={`tel:${selectedEvacuee.contact_number}`} className="text-sm font-medium text-primary hover:underline">{selectedEvacuee.contact_number}</a>
                        : <p className="text-sm text-muted-foreground">Not on file</p>
                      }
                    </div>
                  </div>
                  <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Home Address</p>
                      {selectedEvacuee.home_address ? (
                        <>
                          <p className="text-sm font-medium">{selectedEvacuee.home_address}</p>
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(selectedEvacuee.home_address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />View on map
                          </a>
                        </>
                      ) : <p className="text-sm text-muted-foreground">Not on file</p>}
                    </div>
                  </div>
                </div>
              </section>

              {selectedEvacuee.special_needs && selectedEvacuee.special_needs.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Special Needs
                  </h3>
                  <div className="space-y-2">
                    {selectedEvacuee.special_needs.map((need, i) => {
                      const def = SPECIAL_NEEDS.find(n => n.id === need);
                      const Icon = def?.icon || AlertCircle;
                      return (
                        <div key={i} className="flex items-center gap-3 bg-amber-50 rounded-xl p-3">
                          <span className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 bg-amber-100 text-amber-600">{i + 1}</span>
                          <Icon className="w-4 h-4 text-amber-600 shrink-0" />
                          <p className="text-sm">{getNeedLabel(need)}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>

            <div className="p-4 border-t border-border flex-shrink-0">
              <button
                type="button"
                onClick={() => handleCheckout(selectedEvacuee)}
                className="w-full rounded-xl h-12 font-semibold flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Check Out Family
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── REGISTER FORM MODAL ── */}
      <Modal open={showForm}>
        {/* Header strip */}
        <div className="p-5 bg-primary text-primary-foreground flex-shrink-0 rounded-t-3xl sm:rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">{center?.name}</p>
                <h2 className="font-bold text-lg leading-tight">Register Evacuation</h2>
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
          {center && (
            <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-white/80 text-xs min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{center.address || center.name}</span>
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(center.address || center.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-white bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1 rounded-full shrink-0"
              >
                <Navigation className="w-3 h-3" />
                View Center
              </a>
            </div>
          )}
        </div>

        {/* Scrollable form body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">

          {/* Family name */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Family Name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.family_name}
              onChange={(e) => setFormData(p => ({ ...p, family_name: e.target.value }))}
              placeholder="e.g., Dela Cruz"
              className="mt-1.5 rounded-xl"
            />
          </div>

          {/* Adults & children */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Adults</Label>
              <Input
                type="number"
                min="1"
                value={formData.adults_count}
                onChange={(e) => setFormData(p => ({ ...p, adults_count: e.target.value }))}
                className="mt-1.5 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Children</Label>
              <Input
                type="number"
                min="0"
                value={formData.children_count}
                onChange={(e) => setFormData(p => ({ ...p, children_count: e.target.value }))}
                className="mt-1.5 rounded-xl"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contact Number</Label>
            <Input
              type="tel"
              value={formData.contact_number}
              onChange={(e) => setFormData(p => ({ ...p, contact_number: e.target.value }))}
              placeholder="09XXXXXXXXX"
              className="mt-1.5 rounded-xl"
            />
          </div>

          {/* Address + GPS */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Home Address</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                value={formData.home_address}
                onChange={(e) => setFormData(p => ({ ...p, home_address: e.target.value }))}
                placeholder="Original home address"
                className="rounded-xl flex-1"
              />
              <button
                type="button"
                onClick={handleAutolocate}
                disabled={locating}
                title="Use current GPS location"
                className="w-11 h-10 rounded-xl border border-input bg-background hover:bg-accent flex items-center justify-center transition-colors shrink-0 disabled:opacity-50"
              >
                <Locate className={`w-4 h-4 ${locating ? 'animate-pulse text-primary' : 'text-muted-foreground'}`} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              Tap the locate button to auto-fill using GPS
            </p>
            {formData.home_address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(formData.home_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              >
                <ExternalLink className="w-3 h-3" />Preview on Google Maps
              </a>
            )}
          </div>

          {/* Evacuation center card */}
          {center && (
            <div className="rounded-2xl bg-blue-50 border-l-4 border-blue-400 p-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Evacuation Center
              </p>
              <p className="font-semibold text-sm">{center.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{center.address || 'Address not specified'}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(center.address || center.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <Navigation className="w-3 h-3" />Get Directions
                </a>
                <span className="text-xs text-muted-foreground">
                  {Math.max(center.max_capacity - center.current_occupancy, 0)} spaces available
                </span>
              </div>
            </div>
          )}

          {/* Special needs */}
          <div>
            <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Special Needs
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SPECIAL_NEEDS.map((need) => {
                const isSelected = formData.special_needs.includes(need.id);
                return (
                  <button
                    key={need.id}
                    type="button"
                    onClick={() => toggleSpecialNeed(need.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30 bg-background'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40'
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <need.icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs">{need.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          {formData.family_name.trim() && (
            <div className="rounded-2xl p-3 bg-blue-50 border-l-4 border-blue-500">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 font-bold text-xs text-blue-600">
                  {formData.family_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{formData.family_name} Family</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.adults_count} adults · {formData.children_count} children
                    {formData.special_needs.length > 0 && ` · ${formData.special_needs.length} special need(s)`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit — plain <button> avoids any shadcn Button quirks */}
        <div className="p-4 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleRegister}
            disabled={submitting || !formData.family_name.trim()}
            className="w-full rounded-xl h-12 font-semibold flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Registering...
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                Register Evacuation
              </>
            )}
          </button>
        </div>
      </Modal>

    </div>
  );
}