import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  MapPin,
  Users,
  Loader2,
  CheckCircle2,
  Phone,
  ArrowLeft,
  Zap,
  ClipboardList,
  Shield,
  Heart,
  Baby,
  Accessibility,
  Stethoscope,
  Dog,
  Clock
} from 'lucide-react';
import type { RequestSeverity, WeatherAlert } from '@/types/database';

const SPECIAL_NEEDS_OPTIONS = [
  { id: 'elderly', label: 'Elderly (60+)', icon: Heart },
  { id: 'pwd', label: 'Person with Disability', icon: Accessibility },
  { id: 'pregnant', label: 'Pregnant Woman', icon: Heart },
  { id: 'infant', label: 'Children (0-5 years)', icon: Baby },
  { id: 'medical', label: 'Medical Emergency', icon: Stethoscope },
  { id: 'pet', label: 'Pet Rescue', icon: Dog },
];

export default function EmergencySOSPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(true);
  
  const [activeTab, setActiveTab] = useState<'quick' | 'detailed'>('quick');
  const [severity, setSeverity] = useState<RequestSeverity>('critical');
  const [householdCount, setHouseholdCount] = useState(1);
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAlert, setCurrentAlert] = useState<WeatherAlert | null>(null);

  useEffect(() => {
    if (profile?.address) setAddress(profile.address);
  }, [profile]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) setCurrentAlert(data[0] as WeatherAlert);
    };
    fetchAlerts();
  }, []);

  const handleSpecialNeedChange = (id: string, checked: boolean) => {
    if (checked) setSpecialNeeds([...specialNeeds, id]);
    else setSpecialNeeds(specialNeeds.filter(n => n !== id));
  };

  const calculatePriority = (isQuickSOS: boolean) => {
    let score = 50;
    if (isQuickSOS) { score = 90; }
    else {
      if (severity === 'critical') score += 40;
      else if (severity === 'high') score += 25;
      else score += 10;
      score += Math.min(householdCount * 3, 15);
      score += specialNeeds.length * 5;
    }
    if (currentAlert?.priority === 'critical') score += 10;
    else if (currentAlert?.priority === 'warning') score += 5;
    return Math.min(score, 100);
  };

  const handleQuickSOS = async () => {
    if (!user) { setError('You must be logged in to submit a request'); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: submitError } = await supabase.from('rescue_requests').insert({
        requester_id: user.id, severity: 'critical', household_count: 1,
        special_needs: null,
        situation_description: `QUICK SOS - Immediate assistance needed. Alert Level: ${currentAlert?.priority || 'unknown'}`,
        location_lat: location.latitude, location_lng: location.longitude,
        location_address: profile?.address || address || null,
        priority_score: calculatePriority(true)
      });
      if (submitError) throw submitError;
      setSuccess(true);
      setTimeout(() => navigate('/resident/requests'), 2000);
    } catch (err: any) { setError(err.message || 'Failed to submit request'); }
    finally { setLoading(false); }
  };

  const handleDetailedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setError('You must be logged in to submit a request'); return; }
    setLoading(true);
    setError(null);
    try {
      const { error: submitError } = await supabase.from('rescue_requests').insert({
        requester_id: user.id, severity, household_count: householdCount,
        special_needs: specialNeeds.length > 0 ? specialNeeds : null,
        situation_description: description || null,
        location_lat: location.latitude, location_lng: location.longitude,
        location_address: address || null,
        priority_score: calculatePriority(false)
      });
      if (submitError) throw submitError;
      setSuccess(true);
      setTimeout(() => navigate('/resident/requests'), 2000);
    } catch (err: any) { setError(err.message || 'Failed to submit request'); }
    finally { setLoading(false); }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center dashboard-card">
          <CardContent className="p-fluid-lg">
            <div className="w-20 h-20 rounded-3xl bg-success/15 flex items-center justify-center mx-auto mb-6 border border-success/20" style={{ boxShadow: 'var(--glow-success)' }}>
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="font-display text-fluid-xl font-bold mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-4 text-fluid-sm">
              Your rescue request has been sent to MDRRMO. A rescuer will be assigned shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-fluid-xs">
              <Clock className="w-4 h-4" />
              <span>Redirecting to your requests...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-fluid-md">
      {/* Header */}
      <div className="flex items-center gap-fluid-md animate-fade-up">
        <Link to="/resident">
          <Button variant="ghost" size="icon" className="shrink-0 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-fluid-2xl font-bold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Emergency SOS
          </h1>
          <p className="text-muted-foreground text-fluid-sm">Request immediate rescue assistance</p>
        </div>
      </div>

      {/* Current Alert Status */}
      {currentAlert && (
        <div className={`animate-fade-up stagger-1 ${
          currentAlert.priority === 'critical' ? 'alert-critical' :
          currentAlert.priority === 'warning' ? 'alert-warning' : 'alert-info'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-fluid-sm">
                <strong>Current Alert:</strong> {currentAlert.title}
              </span>
            </div>
            <Badge className={getPriorityBadge(currentAlert.priority)}>
              {currentAlert.priority}
            </Badge>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* SOS Options Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'detailed')}>
        <TabsList className="grid w-full grid-cols-2 h-auto rounded-xl bg-muted/60 p-1">
          <TabsTrigger value="quick" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Zap className="w-4 h-4" />
            <span className="text-fluid-sm">Quick SOS</span>
          </TabsTrigger>
          <TabsTrigger value="detailed" className="flex items-center gap-2 py-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <ClipboardList className="w-4 h-4" />
            <span className="text-fluid-sm">Detailed Request</span>
          </TabsTrigger>
        </TabsList>

        {/* Quick SOS Tab */}
        <TabsContent value="quick" className="mt-4 space-y-4 animate-fade-up">
          <Card className="dashboard-card border-destructive/20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-destructive via-orange-500 to-destructive" />
            <CardHeader className="text-center pb-2">
              <div className="relative mx-auto mb-4">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-destructive to-orange-500 flex items-center justify-center animate-sos-pulse">
                  <Zap className="w-12 h-12 text-white" />
                </div>
                <div className="absolute inset-0 w-24 h-24 rounded-3xl animate-pulse-ring bg-destructive/20 mx-auto" />
              </div>
              <CardTitle className="text-fluid-xl text-destructive font-display">One-Tap Emergency</CardTitle>
              <CardDescription className="text-fluid-sm">
                For immediate danger — no forms to fill. We'll use your location and profile data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Location Status */}
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium text-fluid-sm">Your Location</span>
                </div>
                {location.loading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-fluid-xs">Getting your location...</span>
                  </div>
                ) : location.error ? (
                  <div className="text-warning text-fluid-xs">{location.error}</div>
                ) : (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-fluid-xs">
                      Location ready ({location.accuracy?.toFixed(0)}m accuracy)
                    </span>
                  </div>
                )}
                {profile?.address && (
                  <p className="text-fluid-xs text-muted-foreground mt-2">
                    Address: {profile.address}
                  </p>
                )}
              </div>

              {/* What will be sent */}
              <div className="p-4 rounded-2xl bg-muted/25 space-y-2 border border-border/30">
                <p className="font-medium text-fluid-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  What rescuers will receive:
                </p>
                <ul className="text-fluid-xs text-muted-foreground space-y-1.5 ml-6">
                  <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Your GPS coordinates (real-time)</li>
                  <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Your saved address: {profile?.address || 'Not set'}</li>
                  <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Your phone: {profile?.phone_number || 'Not set'}</li>
                  <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-primary" /> Current alert level: {currentAlert?.priority || 'Normal'}</li>
                  <li className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-destructive" /> Priority: CRITICAL (highest)</li>
                </ul>
              </div>

              <Button 
                onClick={handleQuickSOS}
                disabled={loading || location.loading}
                className="w-full h-16 text-lg btn-emergency rounded-2xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Sending SOS...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 mr-2" />
                    SEND EMERGENCY SOS
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detailed Request Tab */}
        <TabsContent value="detailed" className="mt-4 animate-fade-up">
          <form onSubmit={handleDetailedSubmit} className="space-y-4">
            {/* Severity Selection */}
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-fluid-lg font-display">Emergency Level</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={severity} 
                  onValueChange={(v) => setSeverity(v as RequestSeverity)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  {[
                    { value: 'critical', label: 'Critical', desc: 'Immediate danger', color: 'border-destructive bg-destructive/5', icon: '🔴' },
                    { value: 'high', label: 'High', desc: 'Rising water', color: 'border-warning bg-warning/5', icon: '🟠' },
                    { value: 'medium', label: 'Medium', desc: 'Need assistance', color: 'border-info bg-info/5', icon: '🔵' },
                  ].map((level) => (
                    <div key={level.value}>
                      <RadioGroupItem value={level.value} id={level.value} className="peer sr-only" />
                      <Label
                        htmlFor={level.value}
                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${severity === level.value ? level.color : 'border-border hover:border-primary/30'}`}
                      >
                        <span className="text-xl mb-1">{level.icon}</span>
                        <span className="font-semibold text-fluid-sm">{level.label}</span>
                        <span className="text-fluid-xs text-muted-foreground">{level.desc}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Household Count */}
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-fluid-lg flex items-center gap-2 font-display">
                  <Users className="w-5 h-5 text-primary" />
                  People Needing Rescue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button type="button" variant="outline" size="icon" className="w-12 h-12 rounded-2xl"
                    onClick={() => setHouseholdCount(Math.max(1, householdCount - 1))}>-</Button>
                  <Input type="number" value={householdCount}
                    onChange={(e) => setHouseholdCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center text-xl font-bold h-12 rounded-xl" min={1} max={50} />
                  <Button type="button" variant="outline" size="icon" className="w-12 h-12 rounded-2xl"
                    onClick={() => setHouseholdCount(householdCount + 1)}>+</Button>
                  <span className="text-muted-foreground text-fluid-sm">people</span>
                </div>
              </CardContent>
            </Card>

            {/* Special Needs */}
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-fluid-lg font-display">Special Needs (Optional)</CardTitle>
                <CardDescription className="text-fluid-xs">Select if applicable for priority routing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {SPECIAL_NEEDS_OPTIONS.map((option) => {
                    const IconComponent = option.icon;
                    const isChecked = specialNeeds.includes(option.id);
                    return (
                      <div 
                        key={option.id} 
                        className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}
                        onClick={() => handleSpecialNeedChange(option.id, !isChecked)}
                      >
                        <Checkbox id={option.id} checked={isChecked}
                          onCheckedChange={(checked) => handleSpecialNeedChange(option.id, checked as boolean)} />
                        <IconComponent className={`w-4 h-4 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                        <Label htmlFor={option.id} className="text-fluid-xs cursor-pointer flex-1">{option.label}</Label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-fluid-lg flex items-center gap-2 font-display">
                  <MapPin className="w-5 h-5 text-primary" />
                  Your Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 rounded-2xl bg-muted/40">
                  {location.loading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-fluid-sm">Getting your location...</span>
                    </div>
                  ) : location.error ? (
                    <div className="text-warning text-fluid-sm">{location.error}</div>
                  ) : (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-fluid-sm">Location found ({location.accuracy?.toFixed(0)}m accuracy)</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="address" className="text-fluid-sm">Address / Landmark</Label>
                  <Input id="address" placeholder="e.g., Near San Juan Bridge, Purok 3"
                    value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1 rounded-xl" />
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-fluid-lg font-display">Situation Description (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea placeholder="Describe your situation, water level, any dangers..."
                  value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="rounded-xl" />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button type="submit" className="w-full h-14 text-lg btn-emergency rounded-2xl" disabled={loading}>
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Sending Request...</>
              ) : (
                <><AlertTriangle className="w-5 h-5 mr-2" />Send Rescue Request</>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Emergency Hotline */}
      <Card className="dashboard-card bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-fluid-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-fluid-sm font-medium">Can't submit online?</p>
                <p className="text-fluid-xs text-muted-foreground">Call the emergency hotline</p>
              </div>
            </div>
            <a href="tel:0431234567" className="text-fluid-lg font-bold text-primary hover:underline">
              (043) 123-4567
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'critical': return 'bg-destructive/15 text-destructive border border-destructive/20';
    case 'warning': return 'bg-warning/15 text-warning border border-warning/20';
    default: return 'bg-info/15 text-info border border-info/20';
  }
}
