import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Users,
  Plus,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  status: 'safe' | 'evacuated' | 'need_help';
}

export default function FamilyStatusPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberAge, setNewMemberAge] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem(`family_${user?.id}`);
    if (saved) {
      setMembers(JSON.parse(saved));
    }
  }, [user]);

  const saveMembers = (newMembers: FamilyMember[]) => {
    setMembers(newMembers);
    localStorage.setItem(`family_${user?.id}`, JSON.stringify(newMembers));
  };

  const addMember = () => {
    if (!newMemberName.trim() || !newMemberAge) return;
    
    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      name: newMemberName.trim(),
      age: parseInt(newMemberAge),
      status: 'safe'
    };

    saveMembers([...members, newMember]);
    setNewMemberName('');
    setNewMemberAge('');
    setDialogOpen(false);
    toast.success('Family member added');
  };

  const updateStatus = (id: string, status: FamilyMember['status']) => {
    const updated = members.map(m => m.id === id ? { ...m, status } : m);
    saveMembers(updated);
    toast.success('Status updated');
  };

  const removeMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    saveMembers(updated);
    toast.success('Member removed');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'safe':
        return { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Safe' };
      case 'evacuated':
        return { icon: Users, color: 'text-info', bg: 'bg-info/10', label: 'Evacuated' };
      case 'need_help':
        return { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Need Help' };
      default:
        return { icon: HelpCircle, color: 'text-muted', bg: 'bg-muted', label: 'Unknown' };
    }
  };

  const statusCounts = {
    safe: members.filter(m => m.status === 'safe').length,
    evacuated: members.filter(m => m.status === 'evacuated').length,
    need_help: members.filter(m => m.status === 'need_help').length,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-fluid-md">
        <div className="flex items-center gap-fluid-md">
          <Link to="/resident">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Family Status
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Track your family's safety</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Member</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Family Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={newMemberAge}
                  onChange={(e) => setNewMemberAge(e.target.value)}
                  placeholder="Enter age"
                  min={0}
                  max={120}
                />
              </div>
              <Button onClick={addMember} className="w-full">Add Member</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-fluid-md">
        {[
          { key: 'safe', label: 'Safe', color: 'from-success to-accent' },
          { key: 'evacuated', label: 'Evacuated', color: 'from-info to-primary' },
          { key: 'need_help', label: 'Need Help', color: 'from-destructive to-warning' },
        ].map((item) => (
          <Card key={item.key} className="stat-card text-center">
            <CardContent className="p-fluid-sm">
              <div className={`text-fluid-2xl font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                {statusCounts[item.key as keyof typeof statusCounts]}
              </div>
              <div className="text-fluid-xs text-muted-foreground">{item.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members List */}
      {members.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="icon-box-lg mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Family Members Added</h3>
            <p className="text-fluid-sm text-muted-foreground mb-4">
              Add your family members to track their safety status during emergencies
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const statusConfig = getStatusConfig(member.status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={member.id} className="overflow-hidden">
                <CardContent className="p-fluid-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-fluid-md">
                    <div className="flex items-center gap-fluid-md">
                      <div className={`icon-box-md rounded-full ${statusConfig.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-fluid-base">{member.name}</p>
                        <p className="text-fluid-xs text-muted-foreground">{member.age} years old</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.status}
                        onValueChange={(value) => updateStatus(member.id, value as FamilyMember['status'])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="safe">✓ Safe</SelectItem>
                          <SelectItem value="evacuated">📍 Evacuated</SelectItem>
                          <SelectItem value="need_help">⚠ Need Help</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(member.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
