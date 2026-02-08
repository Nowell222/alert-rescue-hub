import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { WeatherForecast, WeatherAlert } from '@/types/database';

// San Juan, Batangas coordinates
const DEFAULT_LOCATION = {
  lat: 13.8263,
  lng: 121.3960,
  name: 'San Juan, Batangas'
};

interface CurrentWeather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
  icon: string;
  location: string;
}

interface ForecastDay {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  humidity: number;
  precipChance: number;
  icon: string;
}

export function useWeather() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = async () => {
    try {
      setLoading(true);
      
      // Fetch weather forecast from database (cached by admin)
      const { data: forecastData, error: forecastError } = await supabase
        .from('weather_forecast')
        .select('*')
        .order('forecast_date', { ascending: true })
        .limit(7);

      if (forecastError) {
        console.error('Error fetching forecast:', forecastError);
      } else if (forecastData && forecastData.length > 0) {
        const formattedForecast: ForecastDay[] = forecastData.map((day: WeatherForecast) => ({
          date: day.forecast_date,
          dayName: new Date(day.forecast_date).toLocaleDateString('en-US', { weekday: 'short' }),
          tempHigh: day.temperature_high || 32,
          tempLow: day.temperature_low || 24,
          condition: day.condition,
          humidity: day.humidity || 75,
          precipChance: day.precipitation_chance || 0,
          icon: day.icon_code || '☀️'
        }));
        setForecast(formattedForecast);

        // Use first day as current weather approximation
        if (formattedForecast.length > 0) {
          setCurrentWeather({
            temperature: Math.round((formattedForecast[0].tempHigh + formattedForecast[0].tempLow) / 2),
            condition: formattedForecast[0].condition,
            humidity: formattedForecast[0].humidity,
            windSpeed: 15,
            feelsLike: Math.round((formattedForecast[0].tempHigh + formattedForecast[0].tempLow) / 2) + 2,
            icon: formattedForecast[0].icon,
            location: DEFAULT_LOCATION.name
          });
        }
      } else {
        // Generate mock data if no forecast in database
        generateMockForecast();
      }

      // Fetch active weather alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('weather_alerts')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (alertsError) {
        console.error('Error fetching alerts:', alertsError);
      } else {
        setAlerts(alertsData as WeatherAlert[] || []);
      }

      setError(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setError('Failed to fetch weather data');
      generateMockForecast();
    } finally {
      setLoading(false);
    }
  };

  const generateMockForecast = () => {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Thunderstorm'];
    const icons = ['☀️', '⛅', '☁️', '🌧️', '⛈️'];
    const today = new Date();
    
    const mockForecast: ForecastDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const conditionIndex = Math.floor(Math.random() * conditions.length);
      
      mockForecast.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        tempHigh: 30 + Math.floor(Math.random() * 5),
        tempLow: 23 + Math.floor(Math.random() * 3),
        condition: conditions[conditionIndex],
        humidity: 70 + Math.floor(Math.random() * 20),
        precipChance: Math.floor(Math.random() * 80),
        icon: icons[conditionIndex]
      });
    }

    setForecast(mockForecast);
    setCurrentWeather({
      temperature: 29,
      condition: 'Partly Cloudy',
      humidity: 78,
      windSpeed: 12,
      feelsLike: 32,
      icon: '⛅',
      location: DEFAULT_LOCATION.name
    });
  };

  useEffect(() => {
    fetchWeatherData();
    
    // Subscribe to real-time weather alert updates
    const channel = supabase
      .channel('weather_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'weather_alerts'
        },
        () => {
          fetchWeatherData();
        }
      )
      .subscribe();

    // Refresh weather every 30 minutes
    const interval = setInterval(fetchWeatherData, 30 * 60 * 1000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return {
    currentWeather,
    forecast,
    alerts,
    loading,
    error,
    refetch: fetchWeatherData
  };
}
