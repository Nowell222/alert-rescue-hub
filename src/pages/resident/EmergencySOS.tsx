import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from '@/hooks/useLocation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  MapPin,
  Users,
  Loader2,
  CheckCircle2,
  Phone,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { RequestSeverity } from '@/types/database';

const SPECIAL_NEEDS_OPTIONS = [
  { id: 'elderly', label: 'Elderly (60+)' },
  { id: 'pwd', label: 'Person with Disability' },
  { id: 'pregnant', label: 'Pregnant Woman' },
  { id: 'infant', label: 'Children (0-5 years)' },
  { id: 'medical', label: 'Medical Emergency' },
  { id: 'pet', label: 'Pet Rescue' },
];

export default function EmergencySOSPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(true);
  
  const [severity, setSeverity] = useState<RequestSeverity>('high');
  const [householdCount, setHouseholdCount] = useState(1);
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSpecialNeedChange = (id: string, checked: boolean) => {
    if (checked) {
      setSpecialNeeds([...specialNeeds, id]);
    } else {
      setSpecialNeeds(specialNeeds.filter(n => n !== id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a request');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('rescue_requests')
        .insert({
          requester_id: user.id,
          severity,
          household_count: householdCount,
          special_needs: specialNeeds.length > 0 ? specialNeeds : null,
          situation_description: description || null,
          location_lat: location.latitude,
          location_lng: location.longitude,
          location_address: address || null,
          priority_score: calculatePriority()
        });

      if (submitError) throw submitError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/resident/requests');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const calculatePriority = () => {
    let score = 50;
    
    if (severity === 'critical') score += 40;
    else if (severity === 'high') score += 25;
    else score += 10;

    score += Math.min(householdCount * 3, 15);
    score += specialNeeds.length * 5;

    return Math.min(score, 100);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center p-8">
          <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold mb-2">Request Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your rescue request has been sent to MDRRMO. A rescuer will be assigned shortly.
          </p>
          <p className="text-sm text-muted-foreground">Redirecting to your requests...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/resident">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-destructive flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            Emergency SOS
          </h1>
          <p className="text-muted-foreground text-sm">Request immediate rescue assistance</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Severity Selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Emergency Level</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={severity} 
              onValueChange={(v) => setSeverity(v as RequestSeverity)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {[
                { value: 'critical', label: 'Critical', desc: 'Immediate danger', color: 'border-destructive bg-destructive/10' },
                { value: 'high', label: 'High', desc: 'Rising water', color: 'border-warning bg-warning/10' },
                { value: 'medium', label: 'Medium', desc: 'Need assistance', color: 'border-info bg-info/10' },
              ].map((level) => (
                <div key={level.value}>
                  <RadioGroupItem
                    value={level.value}
                    id={level.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={level.value}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all peer-checked:${level.color} ${severity === level.value ? level.color : 'border-border'}`}
                  >
                    <span className="font-semibold">{level.label}</span>
                    <span className="text-xs text-muted-foreground">{level.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Household Count */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              People Needing Rescue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setHouseholdCount(Math.max(1, householdCount - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                value={householdCount}
                onChange={(e) => setHouseholdCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center text-lg font-bold"
                min={1}
                max={50}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => setHouseholdCount(householdCount + 1)}
              >
                +
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Special Needs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Special Needs (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SPECIAL_NEEDS_OPTIONS.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.id}
                    checked={specialNeeds.includes(option.id)}
                    onCheckedChange={(checked) => handleSpecialNeedChange(option.id, checked as boolean)}
                  />
                  <Label htmlFor={option.id} className="text-sm cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Your Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
              {location.loading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Getting your location...</span>
                </div>
              ) : location.error ? (
                <div className="text-warning text-sm">
                  {location.error} - Using default location
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm">
                    Location found ({location.accuracy?.toFixed(0)}m accuracy)
                  </span>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="address">Address / Landmark (Optional)</Label>
              <Input
                id="address"
                placeholder="e.g., Near San Juan Bridge, Purok 3"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Situation Description (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Describe your situation, water level, any dangers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full btn-emergency py-6 text-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Sending Request...
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5 mr-2" />
              Send Rescue Request
            </>
          )}
        </Button>

        {/* Emergency Hotline */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Can't submit online?</p>
                  <p className="text-xs text-muted-foreground">Call the emergency hotline</p>
                </div>
              </div>
              <a href="tel:0431234567" className="text-lg font-bold text-primary">
                (043) 123-4567
              </a>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
