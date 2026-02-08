import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Droplets, 
  Shield, 
  Users, 
  MapPin, 
  Bell, 
  Phone,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Radio,
  Clock,
  LifeBuoy,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WeatherWidget from '@/components/weather/WeatherWidget';

export default function LandingPage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      // Navigate based on role
      switch (userRole) {
        case 'mdrrmo_admin':
          navigate('/admin');
          break;
        case 'rescuer':
          navigate('/rescuer');
          break;
        case 'barangay_official':
          navigate('/official');
          break;
        default:
          navigate('/resident');
      }
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg sm:text-xl text-foreground">FloodWatch</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
              <a href="#roles" className="text-muted-foreground hover:text-foreground transition-colors">User Roles</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <Button onClick={handleGetStarted} className="btn-hero text-sm sm:text-base px-4 sm:px-6 py-2">
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Link to="/auth">
                    <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button className="btn-hero text-sm sm:text-base px-4 sm:px-6 py-2">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-background" />
        <div className="absolute top-20 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-48 h-48 sm:w-72 sm:h-72 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning/10 text-warning border border-warning/20 mb-6">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Flood Alert System for Barangay Catmon</span>
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Protecting Our Community Through{' '}
              <span className="text-gradient-primary">Real-Time Flood Response</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
              A comprehensive web-based disaster risk response system designed for Barangay Catmon, San Juan, Batangas. 
              Get real-time alerts, request rescue assistance, and stay connected with emergency responders.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button onClick={handleGetStarted} size="lg" className="btn-hero group w-full sm:w-auto">
                {user ? 'Go to Dashboard' : 'Register Now'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <a href="#how-it-works">Learn More</a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto">
              {[
                { value: '24/7', label: 'Monitoring' },
                { value: '< 5min', label: 'Response Time' },
                { value: '100%', label: 'Coverage' },
                { value: 'Real-time', label: 'Updates' }
              ].map((stat, i) => (
                <div key={i} className="text-center p-3 sm:p-4 rounded-xl bg-card border border-border">
                  <div className="font-display text-xl sm:text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-muted-foreground" />
          </div>
        </div>
      </section>

      {/* Live Weather Widget */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-center mb-8">
              Current Weather Conditions
            </h2>
            <WeatherWidget variant="detailed" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Flood Response Features
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Our system provides end-to-end disaster management capabilities designed 
              specifically for flood-prone barangays in the Philippines.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: Bell,
                title: 'Real-Time Alerts',
                description: 'Receive instant notifications about flood warnings, evacuation orders, and weather updates directly to your device.',
                color: 'from-destructive to-orange-500'
              },
              {
                icon: MapPin,
                title: 'GPS Location Tracking',
                description: 'Precise location tracking for rescue requests and responder coordination with terrain mapping.',
                color: 'from-primary to-info'
              },
              {
                icon: LifeBuoy,
                title: 'Emergency SOS',
                description: 'One-tap emergency button to request immediate rescue assistance with severity levels.',
                color: 'from-warning to-orange-400'
              },
              {
                icon: Radio,
                title: 'Offline SMS Capability',
                description: 'Send emergency requests via SMS when internet connection is unavailable.',
                color: 'from-accent to-success'
              },
              {
                icon: Building2,
                title: 'Evacuation Centers',
                description: 'Live capacity tracking of evacuation centers with navigation to nearest safe locations.',
                color: 'from-info to-primary'
              },
              {
                icon: Clock,
                title: '7-Day Forecast',
                description: 'Advanced weather forecasting to help you prepare ahead of potential flood events.',
                color: 'from-success to-accent'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="dashboard-card group hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm sm:text-base">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              How FloodWatch Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              A simple yet powerful system connecting residents with emergency responders.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8 sm:space-y-12">
              {[
                {
                  step: '01',
                  title: 'Register & Set Up',
                  description: 'Create your account and register your household information. Set your location and emergency contacts for quick access during emergencies.'
                },
                {
                  step: '02',
                  title: 'Stay Informed',
                  description: 'Receive real-time weather updates, flood alerts, and announcements from MDRRMO. Monitor flood risk levels in your zone.'
                },
                {
                  step: '03',
                  title: 'Request Help When Needed',
                  description: 'Use the emergency SOS button to request rescue assistance. Provide your location, number of people, and special needs.'
                },
                {
                  step: '04',
                  title: 'Track Response',
                  description: 'Monitor your rescue request status in real-time. See when a rescuer is assigned and track their approach on the map.'
                }
              ].map((item, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                  <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="font-display text-xl sm:text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-lg sm:text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm sm:text-base">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-16 sm:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
              Role-Based Access System
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
              Each user role has specialized features designed for their specific responsibilities.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Users,
                role: 'Resident',
                features: [
                  'Emergency SOS requests',
                  'Weather & flood alerts',
                  'Family safety check-in',
                  'Evacuation center info',
                  'Request tracking'
                ],
                color: 'from-info to-primary'
              },
              {
                icon: LifeBuoy,
                role: 'Rescuer',
                features: [
                  'Mission queue management',
                  'GPS navigation',
                  'Real-time tracking',
                  'Equipment checklist',
                  'Status updates'
                ],
                color: 'from-warning to-orange-500'
              },
              {
                icon: Shield,
                role: 'MDRRMO Admin',
                features: [
                  'Operations dashboard',
                  'Alert broadcasting',
                  'Resource management',
                  'Rescuer coordination',
                  'Analytics & reports'
                ],
                color: 'from-destructive to-warning'
              },
              {
                icon: Building2,
                role: 'Barangay Official',
                features: [
                  'Evacuation management',
                  'Evacuee registration',
                  'Supply tracking',
                  'Capacity monitoring',
                  'Zone oversight'
                ],
                color: 'from-success to-accent'
              }
            ].map((item, i) => (
              <div key={i} className="dashboard-card text-center group">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="font-display text-lg sm:text-xl font-semibold mb-4">{item.role}</h3>
                <ul className="space-y-2 text-left">
                  {item.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-24 bg-gradient-to-b from-secondary/30 to-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="dashboard-card text-center">
              <Phone className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-primary mb-6" />
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-4">
                Emergency Hotline
              </h2>
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                For immediate assistance during flood emergencies, contact our 24/7 hotline:
              </p>
              <div className="text-3xl sm:text-4xl font-display font-bold text-primary mb-4">
                (043) 123-4567
              </div>
              <p className="text-muted-foreground text-sm">
                MDRRMO Barangay Catmon, San Juan, Batangas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-foreground text-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Droplets className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="font-display font-bold text-base sm:text-lg">FloodWatch Catmon</span>
            </div>
            
            <p className="text-xs sm:text-sm text-background/70 text-center">
              © 2026 Barangay Catmon Flood Disaster Risk Response System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
