-- Add location tracking columns to profiles for activity-based location updates
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_known_lat numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_known_lng numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT NULL;