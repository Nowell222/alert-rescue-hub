import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Building2,
  Plus,
  Users,
  MapPin,
  Package,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import type { EvacuationCenter } from '@/types/database';

export default function CentersManagementPage() {
  const [centers, setCenters] = useState<EvacuationCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('100');

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    const { data } = await supabase
      .from('evacuation_centers')
      .select('*')
      .order('name');

    if (data) setCenters(data as EvacuationCenter[]);
    setLoading(false);
  };

  const createCenter = async () => {
    if (!name.trim() || !address.trim()) {
      toast.error('Please fill in name and address');
      return;
    }

    const { error } = await supabase
      .from('evacuation_centers')
      .insert({
        name: name.trim(),
        address: address.trim(),
        max_capacity: parseInt(capacity) || 100,
        current_occupancy: 0,
        status: 'operational',
        supplies_status: 'adequate'
      });

    if (error) {
      toast.error('Failed to create center');
    } else {
      toast.success('Evacuation center added');
      setName('');
      setAddress('');
      setCapacity('100');
      setDialogOpen(false);
      fetchCenters();
    }
  };

  const updateOccupancy = async (id: string, occupancy: number) => {
    const { error } = await supabase
      .from('evacuation_centers')
      .update({ current_occupancy: Math.max(0, occupancy) })
      .eq('id', id);

    if (!error) {
      fetchCenters();
    }
  };

  const deleteCenter = async (id: string) => {
    const { error } = await supabase
      .from('evacuation_centers')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Center deleted');
      fetchCenters();
    }
  };

  const totalCapacity = centers.reduce((sum, c) => sum + c.max_capacity, 0);
  const totalOccupancy = centers.reduce((sum, c) => sum + c.current_occupancy, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-fluid-md flex-wrap">
        <div className="flex items-center gap-fluid-md">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-display text-fluid-2xl font-bold flex items-center gap-2">
              <Building2 className="w-6 h-6 text-accent" />
              Evacuation Centers
            </h1>
            <p className="text-muted-foreground text-fluid-sm">Manage evacuation facilities</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-1 shrink-0">
              <Plus className="w-4 h-4" />
              Add Center
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Evacuation Center</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Center Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., San Juan Covered Court"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Max Capacity</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  min={1}
                />
              </div>
              <Button onClick={createCenter} className="w-full">Add Center</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <Card className="stat-card">
        <CardContent className="p-fluid-md">
          <div className="grid grid-cols-3 gap-fluid-md text-center">
            <div>
              <p className="text-fluid-2xl font-bold text-primary">{centers.length}</p>
              <p className="text-fluid-xs text-muted-foreground">Centers</p>
            </div>
            <div>
              <p className="text-fluid-2xl font-bold text-info">{totalOccupancy}</p>
              <p className="text-fluid-xs text-muted-foreground">Current Evacuees</p>
            </div>
            <div>
              <p className="text-fluid-2xl font-bold text-success">{totalCapacity - totalOccupancy}</p>
              <p className="text-fluid-xs text-muted-foreground">Available Spaces</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Centers List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-fluid-md h-32" />
            </Card>
          ))}
        </div>
      ) : centers.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="icon-box-lg mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-fluid-lg mb-2">No Centers Added</h3>
            <p className="text-fluid-sm text-muted-foreground">
              Add evacuation centers to manage capacity
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-md">
          {centers.map((center) => {
            const occupancyPercent = Math.round((center.current_occupancy / center.max_capacity) * 100);
            const isNearCapacity = occupancyPercent >= 80;

            return (
              <Card key={center.id}>
                <CardContent className="p-fluid-md">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-fluid-base">{center.name}</h3>
                      <p className="text-fluid-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {center.address}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCenter(center.id)}
                      className="text-destructive hover:text-destructive shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-fluid-sm mb-1">
                      <span>Occupancy</span>
                      <span className={`font-bold ${isNearCapacity ? 'text-destructive' : 'text-success'}`}>
                        {center.current_occupancy} / {center.max_capacity}
                      </span>
                    </div>
                    <Progress 
                      value={occupancyPercent} 
                      className={`h-2 ${isNearCapacity ? '[&>div]:bg-destructive' : '[&>div]:bg-success'}`}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOccupancy(center.id, center.current_occupancy - 1)}
                      >
                        -
                      </Button>
                      <span className="px-3 text-fluid-sm font-medium">{center.current_occupancy}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateOccupancy(center.id, center.current_occupancy + 1)}
                      >
                        +
                      </Button>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-fluid-xs">
                        {center.status}
                      </Badge>
                      <Badge variant="outline" className="text-fluid-xs">
                        <Package className="w-3 h-3 mr-1" />
                        {center.supplies_status}
                      </Badge>
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
