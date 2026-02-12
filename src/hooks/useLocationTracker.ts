import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Updates the user's last known location in the profiles table
 * whenever their GPS position changes while they are actively using the app.
 * When they leave or go idle, the last recorded position remains.
 */
export function useLocationTracker() {
  const { user } = useAuth();
  const lastUpdate = useRef<number>(0);

  useEffect(() => {
    if (!user || !navigator.geolocation) return;

    const updateLocation = async (position: GeolocationPosition) => {
      // Throttle updates to once every 30 seconds
      const now = Date.now();
      if (now - lastUpdate.current < 30000) return;
      lastUpdate.current = now;

      await supabase
        .from('profiles')
        .update({
          last_known_lat: position.coords.latitude,
          last_known_lng: position.coords.longitude,
          last_active_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(updateLocation, () => {}, {
      enableHighAccuracy: true,
      timeout: 10000,
    });

    // Watch for movement
    const watchId = navigator.geolocation.watchPosition(updateLocation, () => {}, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    });

    // Also update last_active_at on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        navigator.geolocation.getCurrentPosition(updateLocation, () => {}, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);
}
