-- Create enum types for the system
CREATE TYPE public.app_role AS ENUM ('resident', 'rescuer', 'mdrrmo_admin', 'barangay_official');
CREATE TYPE public.alert_priority AS ENUM ('informational', 'warning', 'critical');
CREATE TYPE public.request_status AS ENUM ('pending', 'assigned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.request_severity AS ENUM ('medium', 'high', 'critical');
CREATE TYPE public.rescuer_status AS ENUM ('available', 'on_mission', 'on_break', 'off_duty');

-- Create profiles table for user information
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    address TEXT,
    barangay_zone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (security best practice - separate from profiles)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'resident',
    assigned_zone TEXT,
    assigned_evacuation_center TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create weather_alerts table for MDRRMO broadcasts
CREATE TABLE public.weather_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority alert_priority NOT NULL DEFAULT 'informational',
    target_zones TEXT[],
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weather_forecast table for 7-day forecast storage
CREATE TABLE public.weather_forecast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forecast_date DATE NOT NULL,
    temperature_high DECIMAL(4,1),
    temperature_low DECIMAL(4,1),
    condition TEXT NOT NULL,
    description TEXT,
    humidity INTEGER,
    wind_speed DECIMAL(5,1),
    precipitation_chance INTEGER,
    icon_code TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(forecast_date)
);

-- Create rescue_requests table
CREATE TABLE public.rescue_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    severity request_severity NOT NULL DEFAULT 'medium',
    status request_status NOT NULL DEFAULT 'pending',
    household_count INTEGER NOT NULL DEFAULT 1,
    special_needs TEXT[],
    situation_description TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    assigned_rescuer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    priority_score INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create evacuation_centers table
CREATE TABLE public.evacuation_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    max_capacity INTEGER NOT NULL DEFAULT 100,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    assigned_official_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'operational',
    supplies_status TEXT DEFAULT 'adequate',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create evacuees table
CREATE TABLE public.evacuees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_name TEXT NOT NULL,
    adults_count INTEGER NOT NULL DEFAULT 1,
    children_count INTEGER NOT NULL DEFAULT 0,
    home_address TEXT,
    contact_number TEXT,
    special_needs TEXT[],
    evacuation_center_id UUID REFERENCES public.evacuation_centers(id) ON DELETE SET NULL,
    checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    checked_out_at TIMESTAMP WITH TIME ZONE,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create rescuer_equipment table
CREATE TABLE public.rescuer_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rescuer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    equipment_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    condition TEXT DEFAULT 'good',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flood_zones table
CREATE TABLE public.flood_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT NOT NULL UNIQUE,
    risk_level TEXT NOT NULL DEFAULT 'low',
    current_water_level DECIMAL(5, 2) DEFAULT 0,
    last_reading_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    polygon_coordinates JSONB
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evacuation_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evacuees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescuer_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flood_zones ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'mdrrmo_admin'));

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'mdrrmo_admin'));

-- RLS Policies for weather_alerts
CREATE POLICY "Anyone authenticated can view weather alerts"
ON public.weather_alerts FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Only admins can manage alerts"
ON public.weather_alerts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'mdrrmo_admin'));

-- RLS Policies for weather_forecast (public read)
CREATE POLICY "Anyone can view weather forecast"
ON public.weather_forecast FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can update forecast"
ON public.weather_forecast FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'mdrrmo_admin'));

-- RLS Policies for rescue_requests
CREATE POLICY "Users can view their own requests"
ON public.rescue_requests FOR SELECT
TO authenticated
USING (
    requester_id = auth.uid() 
    OR assigned_rescuer_id = auth.uid()
    OR public.has_role(auth.uid(), 'mdrrmo_admin')
    OR public.has_role(auth.uid(), 'rescuer')
    OR public.has_role(auth.uid(), 'barangay_official')
);

CREATE POLICY "Residents can create rescue requests"
ON public.rescue_requests FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Rescuers and admins can update requests"
ON public.rescue_requests FOR UPDATE
TO authenticated
USING (
    assigned_rescuer_id = auth.uid()
    OR public.has_role(auth.uid(), 'mdrrmo_admin')
    OR public.has_role(auth.uid(), 'rescuer')
);

-- RLS Policies for evacuation_centers
CREATE POLICY "Anyone authenticated can view evacuation centers"
ON public.evacuation_centers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Officials and admins can manage centers"
ON public.evacuation_centers FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'mdrrmo_admin')
    OR public.has_role(auth.uid(), 'barangay_official')
);

-- RLS Policies for evacuees
CREATE POLICY "Officials and admins can view evacuees"
ON public.evacuees FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), 'mdrrmo_admin')
    OR public.has_role(auth.uid(), 'barangay_official')
);

CREATE POLICY "Officials can manage evacuees"
ON public.evacuees FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'mdrrmo_admin')
    OR public.has_role(auth.uid(), 'barangay_official')
);

-- RLS Policies for rescuer_equipment
CREATE POLICY "Rescuers can view own equipment"
ON public.rescuer_equipment FOR SELECT
TO authenticated
USING (
    rescuer_id = auth.uid()
    OR public.has_role(auth.uid(), 'mdrrmo_admin')
);

CREATE POLICY "Rescuers can manage own equipment"
ON public.rescuer_equipment FOR ALL
TO authenticated
USING (rescuer_id = auth.uid() OR public.has_role(auth.uid(), 'mdrrmo_admin'));

-- RLS Policies for flood_zones
CREATE POLICY "Anyone authenticated can view flood zones"
ON public.flood_zones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can manage flood zones"
ON public.flood_zones FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'mdrrmo_admin'));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'resident');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rescue_requests_updated_at
    BEFORE UPDATE ON public.rescue_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_evacuation_centers_updated_at
    BEFORE UPDATE ON public.evacuation_centers
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.weather_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rescue_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.evacuation_centers;