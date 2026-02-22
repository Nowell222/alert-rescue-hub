import { useState, useEffect } from 'react';
import { useLocationTracker } from '@/hooks/useLocationTracker';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Droplets,
  Menu,
  X,
  Home,
  AlertTriangle,
  MapPin,
  Users,
  Settings,
  LogOut,
  Bell,
  LifeBuoy,
  Building2,
  ClipboardList,
  Package,
  BarChart3,
  Radio,
  Shield,
  UserCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppRole } from '@/types/database';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const roleNavItems: Record<AppRole, NavItem[]> = {
  resident: [
    { icon: Home, label: 'Dashboard', href: '/resident' },
    { icon: AlertTriangle, label: 'Emergency SOS', href: '/resident/emergency' },
    { icon: MapPin, label: 'Flood Map', href: '/resident/map' },
    { icon: Bell, label: 'Alerts', href: '/resident/alerts' },
    { icon: ClipboardList, label: 'My Requests', href: '/resident/requests' },
    { icon: Users, label: 'Family Status', href: '/resident/family' },
  ],
  rescuer: [
    { icon: Home, label: 'Dashboard', href: '/rescuer' },
    { icon: Radio, label: 'Mission Queue', href: '/rescuer/missions' },
    { icon: MapPin, label: 'Navigation', href: '/rescuer/map' },
    { icon: Package, label: 'Equipment', href: '/rescuer/equipment' },
    { icon: ClipboardList, label: 'Mission History', href: '/rescuer/history' },
  ],
  mdrrmo_admin: [
    { icon: Home, label: 'Dashboard', href: '/admin' },
    { icon: LifeBuoy, label: 'Rescue Requests', href: '/admin/requests' },
    { icon: Users, label: 'Rescuers', href: '/admin/rescuers' },
    { icon: Bell, label: 'Alerts', href: '/admin/alerts' },
    { icon: Building2, label: 'Evacuation Centers', href: '/admin/centers' },
    { icon: Package, label: 'Inventory', href: '/admin/inventory' },
    { icon: ClipboardList, label: 'Registered Residents', href: '/admin/residents' },
    { icon: MapPin, label: "Residents' Map", href: '/admin/residents-map' },
    { icon: MapPin, label: 'Flood Map', href: '/admin/map' },
    { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
  ],
  barangay_official: [
    { icon: Home, label: 'Dashboard', href: '/official' },
    { icon: Building2, label: 'Evacuation Center', href: '/official/center' },
    { icon: Users, label: 'Evacuees', href: '/official/evacuees' },
    { icon: ClipboardList, label: 'Registered Residents', href: '/official/residents' },
    { icon: MapPin, label: "Residents' Map", href: '/official/residents-map' },
    { icon: Package, label: 'Supplies', href: '/official/supplies' },
    { icon: Bell, label: 'Alerts', href: '/official/alerts' },
    { icon: Shield, label: 'Zone Status', href: '/official/zone' },
  ],
};

const roleTitles: Record<AppRole, string> = {
  resident: 'Resident Dashboard',
  rescuer: 'Rescuer Dashboard',
  mdrrmo_admin: 'MDRRMO Admin',
  barangay_official: 'Barangay Official',
};

export default function DashboardLayout() {
  const { user, profile, userRole, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useLocationTracker();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-teal">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <p className="text-muted-foreground font-display">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !userRole) return null;

  const navItems = roleNavItems[userRole] || roleNavItems.resident;
  const roleTitle = roleTitles[userRole] || 'Dashboard';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-sidebar-border/50">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
            <Droplets className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-display font-bold text-sidebar-foreground text-lg tracking-tight">FloodWatch</span>
            <div className="text-[0.65rem] text-sidebar-primary font-medium uppercase tracking-widest">{roleTitle}</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm relative',
                isActive
                  ? 'bg-sidebar-primary/15 text-sidebar-primary font-semibold'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              {/* Glowing left accent for active */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary shadow-[0_0_8px_hsl(168_80%_48%/0.6)]" />
              )}
              <item.icon className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110',
                isActive && 'text-sidebar-primary'
              )} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 border-t border-sidebar-border/50 mt-auto shrink-0">
        <Link
          to={`/${userRole === 'mdrrmo_admin' ? 'admin' : userRole === 'barangay_official' ? 'official' : userRole}/profile`}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
        >
          <Settings className="w-[18px] h-[18px] group-hover:rotate-45 transition-transform duration-300" />
          <span className="text-sm">Settings</span>
        </Link>
        
        <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl bg-sidebar-accent/40 border border-sidebar-border/30">
          <Avatar className="w-9 h-9 ring-2 ring-sidebar-primary/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm font-bold">
              {profile?.full_name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-[0.65rem] text-sidebar-foreground/50 truncate capitalize">
              {userRole.replace('_', ' ')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-gradient-to-b from-sidebar to-[hsl(220_35%_7%)] border-r border-sidebar-border/40">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between h-14 px-4">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-gradient-to-b from-sidebar to-[hsl(220_35%_7%)]">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Droplets className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">{roleTitle}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-sm">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span>{profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{userRole.replace('_', ' ')}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={`/${userRole === 'mdrrmo_admin' ? 'admin' : userRole === 'barangay_official' ? 'official' : userRole}/profile`}>
                  <UserCircle className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/${userRole === 'mdrrmo_admin' ? 'admin' : userRole === 'barangay_official' ? 'official' : userRole}/settings`}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        <div className="pt-14 lg:pt-0 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
