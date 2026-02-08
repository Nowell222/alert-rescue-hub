export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      evacuation_centers: {
        Row: {
          address: string
          assigned_official_id: string | null
          created_at: string
          current_occupancy: number
          id: string
          location_lat: number | null
          location_lng: number | null
          max_capacity: number
          name: string
          status: string | null
          supplies_status: string | null
          updated_at: string
        }
        Insert: {
          address: string
          assigned_official_id?: string | null
          created_at?: string
          current_occupancy?: number
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          max_capacity?: number
          name: string
          status?: string | null
          supplies_status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          assigned_official_id?: string | null
          created_at?: string
          current_occupancy?: number
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          max_capacity?: number
          name?: string
          status?: string | null
          supplies_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      evacuees: {
        Row: {
          adults_count: number
          checked_in_at: string
          checked_out_at: string | null
          children_count: number
          contact_number: string | null
          evacuation_center_id: string | null
          family_name: string
          home_address: string | null
          id: string
          registered_by: string | null
          special_needs: string[] | null
        }
        Insert: {
          adults_count?: number
          checked_in_at?: string
          checked_out_at?: string | null
          children_count?: number
          contact_number?: string | null
          evacuation_center_id?: string | null
          family_name: string
          home_address?: string | null
          id?: string
          registered_by?: string | null
          special_needs?: string[] | null
        }
        Update: {
          adults_count?: number
          checked_in_at?: string
          checked_out_at?: string | null
          children_count?: number
          contact_number?: string | null
          evacuation_center_id?: string | null
          family_name?: string
          home_address?: string | null
          id?: string
          registered_by?: string | null
          special_needs?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "evacuees_evacuation_center_id_fkey"
            columns: ["evacuation_center_id"]
            isOneToOne: false
            referencedRelation: "evacuation_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      flood_zones: {
        Row: {
          current_water_level: number | null
          id: string
          last_reading_at: string | null
          polygon_coordinates: Json | null
          risk_level: string
          zone_name: string
        }
        Insert: {
          current_water_level?: number | null
          id?: string
          last_reading_at?: string | null
          polygon_coordinates?: Json | null
          risk_level?: string
          zone_name: string
        }
        Update: {
          current_water_level?: number | null
          id?: string
          last_reading_at?: string | null
          polygon_coordinates?: Json | null
          risk_level?: string
          zone_name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          barangay_zone: string | null
          created_at: string
          full_name: string
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          barangay_zone?: string | null
          created_at?: string
          full_name: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          barangay_zone?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rescue_requests: {
        Row: {
          assigned_rescuer_id: string | null
          completed_at: string | null
          created_at: string
          household_count: number
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          priority_score: number | null
          requester_id: string | null
          severity: Database["public"]["Enums"]["request_severity"]
          situation_description: string | null
          special_needs: string[] | null
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          assigned_rescuer_id?: string | null
          completed_at?: string | null
          created_at?: string
          household_count?: number
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          priority_score?: number | null
          requester_id?: string | null
          severity?: Database["public"]["Enums"]["request_severity"]
          situation_description?: string | null
          special_needs?: string[] | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          assigned_rescuer_id?: string | null
          completed_at?: string | null
          created_at?: string
          household_count?: number
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          priority_score?: number | null
          requester_id?: string | null
          severity?: Database["public"]["Enums"]["request_severity"]
          situation_description?: string | null
          special_needs?: string[] | null
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: []
      }
      rescuer_equipment: {
        Row: {
          condition: string | null
          equipment_name: string
          id: string
          last_updated: string
          quantity: number
          rescuer_id: string
        }
        Insert: {
          condition?: string | null
          equipment_name: string
          id?: string
          last_updated?: string
          quantity?: number
          rescuer_id: string
        }
        Update: {
          condition?: string | null
          equipment_name?: string
          id?: string
          last_updated?: string
          quantity?: number
          rescuer_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_evacuation_center: string | null
          assigned_zone: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_evacuation_center?: string | null
          assigned_zone?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_evacuation_center?: string | null
          assigned_zone?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          priority: Database["public"]["Enums"]["alert_priority"]
          target_zones: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          priority?: Database["public"]["Enums"]["alert_priority"]
          target_zones?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          priority?: Database["public"]["Enums"]["alert_priority"]
          target_zones?: string[] | null
          title?: string
        }
        Relationships: []
      }
      weather_forecast: {
        Row: {
          condition: string
          description: string | null
          forecast_date: string
          humidity: number | null
          icon_code: string | null
          id: string
          precipitation_chance: number | null
          temperature_high: number | null
          temperature_low: number | null
          updated_at: string
          wind_speed: number | null
        }
        Insert: {
          condition: string
          description?: string | null
          forecast_date: string
          humidity?: number | null
          icon_code?: string | null
          id?: string
          precipitation_chance?: number | null
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string
          wind_speed?: number | null
        }
        Update: {
          condition?: string
          description?: string | null
          forecast_date?: string
          humidity?: number | null
          icon_code?: string | null
          id?: string
          precipitation_chance?: number | null
          temperature_high?: number | null
          temperature_low?: number | null
          updated_at?: string
          wind_speed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      alert_priority: "informational" | "warning" | "critical"
      app_role: "resident" | "rescuer" | "mdrrmo_admin" | "barangay_official"
      request_severity: "medium" | "high" | "critical"
      request_status:
        | "pending"
        | "assigned"
        | "in_progress"
        | "completed"
        | "cancelled"
      rescuer_status: "available" | "on_mission" | "on_break" | "off_duty"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      alert_priority: ["informational", "warning", "critical"],
      app_role: ["resident", "rescuer", "mdrrmo_admin", "barangay_official"],
      request_severity: ["medium", "high", "critical"],
      request_status: [
        "pending",
        "assigned",
        "in_progress",
        "completed",
        "cancelled",
      ],
      rescuer_status: ["available", "on_mission", "on_break", "off_duty"],
    },
  },
} as const
