import { useWeather } from '@/hooks/useWeather';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Cloud, 
  Droplets, 
  Wind, 
  Thermometer,
  AlertTriangle,
  Sun,
  CloudRain,
  CloudLightning,
  CloudSnow
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherWidgetProps {
  variant?: 'compact' | 'detailed';
  className?: string;
}

const getWeatherIcon = (condition: string) => {
  const lower = condition.toLowerCase();
  if (lower.includes('thunder') || lower.includes('storm')) return CloudLightning;
  if (lower.includes('rain')) return CloudRain;
  if (lower.includes('cloud')) return Cloud;
  if (lower.includes('snow')) return CloudSnow;
  return Sun;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-destructive text-destructive-foreground';
    case 'warning':
      return 'bg-warning text-warning-foreground';
    default:
      return 'bg-info text-info-foreground';
  }
};

export default function WeatherWidget({ variant = 'compact', className }: WeatherWidgetProps) {
  const { currentWeather, forecast, alerts, loading, error } = useWeather();

  if (loading) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 sm:h-8 w-16 sm:w-20" />
              <Skeleton className="h-4 w-24 sm:w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !currentWeather) {
    return (
      <Card className={cn('overflow-hidden border-warning', className)}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle className="w-5 h-5" />
            <span className="text-sm">Weather data unavailable</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentWeather) return null;

  const WeatherIcon = getWeatherIcon(currentWeather.condition);

  if (variant === 'compact') {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-info/20 to-primary/20 flex items-center justify-center">
                <WeatherIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold">{currentWeather.temperature}°C</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{currentWeather.condition}</div>
              </div>
            </div>
            <div className="text-right text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1 justify-end">
                <Droplets className="w-3 h-3" />
                <span>{currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Wind className="w-3 h-3" />
                <span>{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  {alerts.length} active alert{alerts.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Detailed variant
  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 sm:space-y-3">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={cn(
                'p-3 sm:p-4 rounded-lg border-l-4',
                alert.priority === 'critical' && 'alert-critical',
                alert.priority === 'warning' && 'alert-warning',
                alert.priority === 'informational' && 'alert-info'
              )}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn(
                  'w-5 h-5 flex-shrink-0 mt-0.5',
                  alert.priority === 'critical' && 'text-destructive',
                  alert.priority === 'warning' && 'text-warning',
                  alert.priority === 'informational' && 'text-info'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-sm sm:text-base">{alert.title}</h4>
                    <Badge className={cn('text-xs', getPriorityColor(alert.priority))}>
                      {alert.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{alert.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current Weather Card */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-info/30 to-primary/30 flex items-center justify-center">
              <WeatherIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-4xl sm:text-5xl font-bold font-display">{currentWeather.temperature}°C</div>
              <div className="text-base sm:text-lg text-muted-foreground">{currentWeather.condition}</div>
              <div className="text-xs sm:text-sm text-muted-foreground mt-1">{currentWeather.location}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3 sm:ml-auto text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-warning" />
                <span>Feels like {currentWeather.feelsLike}°C</span>
              </div>
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-info" />
                <span>Humidity {currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
                <Wind className="w-4 h-4 text-accent" />
                <span>Wind {currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg font-display">7-Day Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-2">
            {forecast.slice(0, 7).map((day, i) => {
              const DayIcon = getWeatherIcon(day.condition);
              return (
                <div 
                  key={i}
                  className={cn(
                    'text-center p-2 sm:p-3 rounded-lg transition-colors',
                    i === 0 ? 'bg-primary/10' : 'hover:bg-muted'
                  )}
                >
                  <div className="text-xs font-medium mb-1 sm:mb-2">
                    {i === 0 ? 'Today' : day.dayName}
                  </div>
                  <DayIcon className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2',
                    day.condition.toLowerCase().includes('rain') ? 'text-info' : 'text-warning'
                  )} />
                  <div className="text-xs sm:text-sm font-semibold">{day.tempHigh}°</div>
                  <div className="text-xs text-muted-foreground">{day.tempLow}°</div>
                  {day.precipChance > 30 && (
                    <div className="text-xs text-info mt-1 flex items-center justify-center gap-0.5">
                      <Droplets className="w-3 h-3" />
                      {day.precipChance}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
