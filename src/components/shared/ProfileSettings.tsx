import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Save,
  Loader2,
  CheckCircle2,
  Building2,
  Calendar
} from 'lucide-react';

export default function ProfileSettings() {
  const { user, profile, userRole, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    address: '',
    barangay_zone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        address: profile.address || '',
        barangay_zone: profile.barangay_zone || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await updateProfile(formData);
      if (error) throw error;
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'mdrrmo_admin': return 'bg-destructive text-destructive-foreground';
      case 'rescuer': return 'bg-warning text-warning-foreground';
      case 'barangay_official': return 'bg-success text-success-foreground';
      default: return 'bg-info text-info-foreground';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'mdrrmo_admin': return 'MDRRMO Administrator';
      case 'rescuer': return 'Rescue Team Member';
      case 'barangay_official': return 'Barangay Official';
      default: return 'Resident';
    }
  };

  return (
    <div className="space-y-fluid-lg max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-fluid-2xl font-bold flex items-center justify-center gap-2">
          <User className="w-6 h-6 text-primary" />
          Profile & Settings
        </h1>
        <p className="text-muted-foreground text-fluid-sm mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Card */}
      <Card className="dashboard-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary to-accent" />
        <CardContent className="relative pt-0 pb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {profile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 shadow"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="font-display text-fluid-xl font-bold">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-muted-foreground text-fluid-sm">{user?.email}</p>
              <Badge className={`mt-2 ${getRoleBadgeColor(userRole || '')}`}>
                <Shield className="w-3 h-3 mr-1" />
                {getRoleDisplayName(userRole || '')}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-fluid-lg flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Account Information
          </CardTitle>
          <CardDescription>Your account details and registration info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-muted-foreground text-fluid-xs">Email Address</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-fluid-sm">{user?.email}</span>
                <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-muted-foreground text-fluid-xs">Member Since</Label>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-fluid-sm">
                  {profile?.created_at 
                    ? new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    : 'N/A'
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Form */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-fluid-lg flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g., 09123456789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Home Address
                </Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your complete home address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barangay_zone" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Barangay Zone / Purok
                </Label>
                <Input
                  id="barangay_zone"
                  value={formData.barangay_zone}
                  onChange={(e) => setFormData({ ...formData, barangay_zone: e.target.value })}
                  placeholder="e.g., Purok 3, Zone A"
                />
              </div>
            </div>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="btn-hero">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Emergency Contact (for residents) */}
      {userRole === 'resident' && (
        <Card className="dashboard-card border-warning/30 bg-warning/5">
          <CardHeader>
            <CardTitle className="text-fluid-lg flex items-center gap-2 text-warning">
              <Phone className="w-5 h-5" />
              Emergency Contact
            </CardTitle>
            <CardDescription>
              This information will be used during rescue operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-fluid-sm text-muted-foreground">
              Make sure your phone number is up to date. In case of emergency, rescuers will use this 
              information to contact you or your household.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
