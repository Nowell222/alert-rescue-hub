// Database types for the Flood Response System

export type AppRole = 'resident' | 'rescuer' | 'mdrrmo_admin' | 'barangay_official';
export type AlertPriority = 'informational' | 'warning' | 'critical';
export type RequestStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type RequestSeverity = 'medium' | 'high' | 'critical';
export type RescuerStatus = 'available' | 'on_mission' | 'on_break' | 'off_duty';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string | null;
  address: string | null;
  barangay_zone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  assigned_zone: string | null;
  assigned_evacuation_center: string | null;
  created_at: string;
}

export interface WeatherAlert {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  target_zones: string[] | null;
  created_by: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface WeatherForecast {
  id: string;
  forecast_date: string;
  temperature_high: number | null;
  temperature_low: number | null;
  condition: string;
  description: string | null;
  humidity: number | null;
  wind_speed: number | null;
  precipitation_chance: number | null;
  icon_code: string | null;
  updated_at: string;
}

export interface RescueRequest {
  zone_id: ReactNode;
  notes: any;
  responder_id: any;
  completion_notes: ReactNode;
  id: string;
  requester_id: string | null;
  severity: RequestSeverity;
  status: RequestStatus;
  household_count: number;
  special_needs: string[] | null;
  situation_description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  assigned_rescuer_id: string | null;
  priority_score: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface EvacuationCenter {
  id: string;
  name: string;
  address: string;
  location_lat: number | null;
  location_lng: number | null;
  max_capacity: number;
  current_occupancy: number;
  assigned_official_id: string | null;
  status: string;
  supplies_status: string;
  created_at: string;
  updated_at: string;
}

export interface Evacuee {
  id: string;
  family_name: string;
  adults_count: number;
  children_count: number;
  home_address: string | null;
  contact_number: string | null;
  special_needs: string[] | null;
  evacuation_center_id: string | null;
  checked_in_at: string;
  checked_out_at: string | null;
  registered_by: string | null;
}

export interface RescuerEquipment {
  id: string;
  rescuer_id: string;
  equipment_name: string;
  quantity: number;
  condition: string;
  last_updated: string;
}

export interface FloodZone {
  id: string;
  zone_name: string;
  risk_level: string;
  current_water_level: number;
  last_reading_at: string | null;
  polygon_coordinates: object | null;
}

// API Response types
export interface WeatherAPIResponse {
  location: {
    name: string;
    region: string;
    country: string;
    localtime: string;
  };
  current: {
    temp_c: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    wind_kph: number;
    precip_mm: number;
    feelslike_c: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_c: number;
        mintemp_c: number;
        avghumidity: number;
        daily_chance_of_rain: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
      };
    }>;
  };
}
