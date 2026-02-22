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
    case 'critical': return 'bg-destructive/15 text-destructive border border-destructive/20';
    case 'warning': return 'bg-warning/15 text-warning border border-warning/20';
    default: return 'bg-info/15 text-info border border-info/20';
  }
};

export default function WeatherWidget({ variant = 'compact', className }: WeatherWidgetProps) {
  const { currentWeather, forecast, alerts, loading, error } = useWeather();

  if (loading) {
    return (
      <Card className={cn('overflow-hidden dashboard-card', className)}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl" />
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
      <Card className={cn('overflow-hidden border-warning/40 dashboard-card', className)}>
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
      <Card className={cn('overflow-hidden dashboard-card', className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-info/20 to-primary/20 flex items-center justify-center">
                <WeatherIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold font-display">{currentWeather.temperature}°C</div>
                <div className="text-xs text-muted-foreground">{currentWeather.condition}</div>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1 justify-end">
                <Droplets className="w-3 h-3 text-info" />
                <span>{currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Wind className="w-3 h-3 text-accent" />
                <span>{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
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
                'p-3 sm:p-4 rounded-xl',
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
                    <h4 className="font-semibold font-display text-sm sm:text-base">{alert.title}</h4>
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
      <Card className="overflow-hidden dashboard-card bg-gradient-to-br from-primary/5 via-card to-accent/5">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-info/25 to-primary/25 flex items-center justify-center backdrop-blur-sm border border-white/10">
              <WeatherIcon className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <div className="text-5xl sm:text-6xl font-extrabold font-display tracking-tighter">{currentWeather.temperature}°<span className="text-2xl sm:text-3xl text-muted-foreground">C</span></div>
              <div className="text-base sm:text-lg text-muted-foreground font-medium">{currentWeather.condition}</div>
              <div className="text-xs text-muted-foreground/70 mt-0.5">{currentWeather.location}</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-3 sm:ml-auto text-xs sm:text-sm">
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                <Thermometer className="w-4 h-4 text-warning" />
                <span>Feels {currentWeather.feelsLike}°C</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2">
                <Droplets className="w-4 h-4 text-info" />
                <span>{currentWeather.humidity}%</span>
              </div>
              <div className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2 col-span-2 sm:col-span-1">
                <Wind className="w-4 h-4 text-accent" />
                <span>{currentWeather.windSpeed} km/h</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-Day Forecast */}
      <Card className="dashboard-card">
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
                    'text-center p-2 sm:p-3 rounded-xl transition-all duration-200',
                    i === 0 ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/60'
                  )}
                >
                  <div className="text-xs font-semibold mb-1 sm:mb-2">
                    {i === 0 ? 'Today' : day.dayName}
                  </div>
                  <DayIcon className={cn(
                    'w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1 sm:mb-2',
                    day.condition.toLowerCase().includes('rain') ? 'text-info' : 'text-warning'
                  )} />
                  <div className="text-sm font-bold">{day.tempHigh}°</div>
                  <div className="text-xs text-muted-foreground">{day.tempLow}°</div>
                  {day.precipChance > 30 && (
                    <div className="text-[0.6rem] text-info mt-1 flex items-center justify-center gap-0.5">
                      <Droplets className="w-2.5 h-2.5" />
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
