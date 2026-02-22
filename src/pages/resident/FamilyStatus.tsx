import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Users, Plus, Trash2, Phone, MapPin, Heart, ShieldCheck, AlertTriangle,
  HelpCircle, Clock, User, Baby, Accessibility, Stethoscope, Edit2
} from 'lucide-react';
import { toast } from 'sonner';

interface FamilyMember {
  id: string; name: string; relationship: string; age: number; phone: string;
  address: string; specialNeeds: string[]; medicalConditions: string;
  status: 'safe' | 'needs_help' | 'unknown'; lastUpdate: string; notes: string;
}

const RELATIONSHIPS = [
  'Spouse', 'Parent', 'Child', 'Sibling', 'Grandparent', 'Grandchild',
  'Uncle/Aunt', 'Cousin', 'Nephew/Niece', 'In-Law', 'Other'
];

const SPECIAL_NEEDS = [
  { id: 'elderly', label: 'Elderly (60+)', icon: Heart },
  { id: 'pwd', label: 'Person with Disability', icon: Accessibility },
  { id: 'infant', label: 'Infant/Child', icon: Baby },
  { id: 'medical', label: 'Medical Condition', icon: Stethoscope },
];

export default function FamilyStatusPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: '', relationship: '', age: '', phone: '', address: '',
    specialNeeds: [] as string[], medicalConditions: '', notes: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('family_members');
    if (saved) setMembers(JSON.parse(saved));
  }, []);

  const saveMembers = (newMembers: FamilyMember[]) => {
    localStorage.setItem('family_members', JSON.stringify(newMembers));
    setMembers(newMembers);
  };

  const resetForm = () => {
    setFormData({ name: '', relationship: '', age: '', phone: '', address: '', specialNeeds: [], medicalConditions: '', notes: '' });
    setEditingMember(null);
  };

  const handleOpenDialog = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({ name: member.name, relationship: member.relationship, age: member.age.toString(),
        phone: member.phone, address: member.address, specialNeeds: member.specialNeeds,
        medicalConditions: member.medicalConditions, notes: member.notes });
    } else { resetForm(); }
    setIsDialogOpen(true);
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.relationship) { toast.error('Please fill in name and relationship'); return; }
    const memberData: FamilyMember = {
      id: editingMember?.id || Date.now().toString(), name: formData.name,
      relationship: formData.relationship, age: parseInt(formData.age) || 0,
      phone: formData.phone, address: formData.address, specialNeeds: formData.specialNeeds,
      medicalConditions: formData.medicalConditions, status: editingMember?.status || 'unknown',
      lastUpdate: new Date().toISOString(), notes: formData.notes,
    };
    if (editingMember) {
      saveMembers(members.map(m => m.id === editingMember.id ? memberData : m));
      toast.success('Family member updated');
    } else {
      saveMembers([...members, memberData]);
      toast.success('Family member added');
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const handleDeleteMember = (id: string) => { saveMembers(members.filter(m => m.id !== id)); toast.success('Family member removed'); };
  const handleUpdateStatus = (id: string, status: FamilyMember['status']) => {
    saveMembers(members.map(m => m.id === id ? { ...m, status, lastUpdate: new Date().toISOString() } : m));
    toast.success('Status updated');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-success/15 text-success border border-success/20';
      case 'needs_help': return 'bg-destructive/15 text-destructive border border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) { case 'safe': return ShieldCheck; case 'needs_help': return AlertTriangle; default: return HelpCircle; }
  };

  const toggleSpecialNeed = (need: string) => {
    if (formData.specialNeeds.includes(need)) {
      setFormData({ ...formData, specialNeeds: formData.specialNeeds.filter(n => n !== need) });
    } else {
      setFormData({ ...formData, specialNeeds: [...formData.specialNeeds, need] });
    }
  };

  const safeCount = members.filter(m => m.status === 'safe').length;
  const needsHelpCount = members.filter(m => m.status === 'needs_help').length;
  const unknownCount = members.filter(m => m.status === 'unknown').length;

  return (
    <div className="space-y-fluid-md">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap animate-fade-up">
        <div className="flex items-center gap-fluid-md">
          <Link to="/resident">
            <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Family Safety Status
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Track your family members' safety during emergencies</p>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="btn-hero gap-2 rounded-xl">
          <Plus className="w-4 h-4" />Add Member
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-fluid-sm animate-fade-up stagger-1">
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-success" />
              <span className="text-fluid-xl font-bold text-success font-display">{safeCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Safe</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-fluid-xl font-bold text-destructive font-display">{needsHelpCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Needs Help</p>
          </CardContent>
        </Card>
        <Card className="stat-card text-center">
          <CardContent className="p-fluid-sm">
            <div className="flex items-center justify-center gap-2 mb-1">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-fluid-xl font-bold font-display">{unknownCount}</span>
            </div>
            <p className="text-fluid-xs text-muted-foreground">Unknown</p>
          </CardContent>
        </Card>
      </div>

      {/* Member Cards */}
      {members.length === 0 ? (
        <Card className="dashboard-card text-center py-12 animate-fade-up stagger-2">
          <CardContent>
            <Users className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="font-display text-fluid-lg font-semibold mb-2">No Family Members Added</h3>
            <p className="text-muted-foreground text-fluid-sm mb-6">Add your family members to track their safety during emergencies</p>
            <Button onClick={() => handleOpenDialog()} className="btn-hero gap-2 rounded-xl">
              <Plus className="w-4 h-4" />Add Your First Family Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md">
          {members.map((member, idx) => {
            const StatusIcon = getStatusIcon(member.status);
            return (
              <Card key={member.id} className="dashboard-card overflow-hidden animate-fade-up" style={{ animationDelay: `${(idx + 2) * 0.05}s` }}>
                <div className={`h-1 ${member.status === 'safe' ? 'bg-success' : member.status === 'needs_help' ? 'bg-destructive' : 'bg-muted'}`} />
                <CardContent className="p-fluid-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-fluid-base font-display">{member.name}</h3>
                        <p className="text-fluid-xs text-muted-foreground">
                          {member.relationship} {member.age > 0 && `• ${member.age} yrs`}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(member.status)}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {member.status === 'safe' ? 'Safe' : member.status === 'needs_help' ? 'Needs Help' : 'Unknown'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {member.phone && (
                      <div className="flex items-center gap-2 text-fluid-xs">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <a href={`tel:${member.phone}`} className="text-primary hover:underline">{member.phone}</a>
                      </div>
                    )}
                    {member.address && (
                      <div className="flex items-center gap-2 text-fluid-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /><span>{member.address}</span>
                      </div>
                    )}
                  </div>

                  {member.specialNeeds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {member.specialNeeds.map((need) => (
                        <Badge key={need} variant="outline" className="text-fluid-xs rounded-lg">
                          {SPECIAL_NEEDS.find(n => n.id === need)?.label || need}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {member.medicalConditions && (
                    <div className="p-2 rounded-xl bg-warning/5 border border-warning/15 mb-3">
                      <p className="text-fluid-xs text-warning">
                        <Stethoscope className="w-3 h-3 inline mr-1" />{member.medicalConditions}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-fluid-xs text-muted-foreground mb-3">
                    <Clock className="w-3 h-3" />
                    <span>Updated: {new Date(member.lastUpdate).toLocaleString()}</span>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant={member.status === 'safe' ? 'default' : 'outline'}
                      className={`rounded-xl ${member.status === 'safe' ? 'bg-success hover:bg-success/90' : ''}`}
                      onClick={() => handleUpdateStatus(member.id, 'safe')}>
                      <ShieldCheck className="w-3 h-3 mr-1" />Safe
                    </Button>
                    <Button size="sm" variant={member.status === 'needs_help' ? 'destructive' : 'outline'} className="rounded-xl"
                      onClick={() => handleUpdateStatus(member.id, 'needs_help')}>
                      <AlertTriangle className="w-3 h-3 mr-1" />Needs Help
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleOpenDialog(member)}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive rounded-xl"
                      onClick={() => handleDeleteMember(member.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {editingMember ? 'Edit Family Member' : 'Add Family Member'}
            </DialogTitle>
            <DialogDescription>Enter information about your family member for emergency tracking</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship *</Label>
                <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((rel) => (<SelectItem key={rel} value={rel}>{rel}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input id="age" type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Enter age" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09123456789" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address / Location</Label>
              <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g., Purok 3, Brgy. Catmon" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Special Needs</Label>
              <div className="grid grid-cols-2 gap-2">
                {SPECIAL_NEEDS.map((need) => {
                  const isSelected = formData.specialNeeds.includes(need.id);
                  return (
                    <div key={need.id} onClick={() => toggleSpecialNeed(need.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>
                      <need.icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm">{need.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical">Medical Conditions</Label>
              <Textarea id="medical" value={formData.medicalConditions}
                onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                placeholder="List any important medical conditions..." rows={2} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea id="notes" value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any other important information..." rows={2} className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleSaveMember} className="btn-hero rounded-xl">
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
