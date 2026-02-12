import { useEffect, useState, useRef } from 'react';
import { Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

export interface RouteInfo {
  from: { lat: number; lng: number; label?: string };
  to: { lat: number; lng: number; label?: string };
}

const startIcon = L.divIcon({
  html: `<div style="
    background: #22c55e;
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: 'route-marker',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const endIcon = L.divIcon({
  html: `<div style="
    background: #ef4444;
    width: 20px; height: 20px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  className: 'route-marker',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Minimum change in degrees before re-fetching route (~50m)
const MIN_CHANGE = 0.0005;

export default function RouteLine({ route }: { route: RouteInfo }) {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [distance, setDistance] = useState<string>('');
  const [duration, setDuration] = useState<string>('');
  const lastFetchRef = useRef({ lat: 0, lng: 0 });
  const initialFitDone = useRef(false);

  useEffect(() => {
    const fromLat = route.from.lat;
    const fromLng = route.from.lng;

    // Only re-fetch if location changed significantly
    const dLat = Math.abs(fromLat - lastFetchRef.current.lat);
    const dLng = Math.abs(fromLng - lastFetchRef.current.lng);
    if (dLat < MIN_CHANGE && dLng < MIN_CHANGE && routeCoords.length > 0) return;

    lastFetchRef.current = { lat: fromLat, lng: fromLng };

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${route.to.lng},${route.to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          const coords: [number, number][] = r.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );
          setRouteCoords(coords);

          // Distance & duration
          const distKm = (r.distance / 1000).toFixed(1);
          setDistance(`${distKm} km`);
          const mins = Math.round(r.duration / 60);
          setDuration(`${mins} min`);

          // Fit bounds only on first render
          if (!initialFitDone.current && coords.length > 1) {
            const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
            map.fitBounds(bounds, { padding: [50, 50] });
            initialFitDone.current = true;
          }
        } else {
          setRouteCoords([
            [fromLat, fromLng],
            [route.to.lat, route.to.lng],
          ]);
        }
      } catch {
        setRouteCoords([
          [fromLat, fromLng],
          [route.to.lat, route.to.lng],
        ]);
      }
    };
    fetchRoute();
  }, [route.from.lat, route.from.lng, route.to.lat, route.to.lng, map]);

  // Reset initial fit when destination changes
  useEffect(() => {
    initialFitDone.current = false;
  }, [route.to.lat, route.to.lng]);

  if (routeCoords.length === 0) return null;

  return (
    <>
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, dashArray: '10, 6' }}
      />
      <Marker position={[route.from.lat, route.from.lng]} icon={startIcon}>
        <Popup>
          <div className="text-sm">
            <p className="font-medium">{route.from.label || 'Your Location'}</p>
            {distance && <p className="text-xs text-muted-foreground">{distance} • {duration}</p>}
          </div>
        </Popup>
      </Marker>
      <Marker position={[route.to.lat, route.to.lng]} icon={endIcon}>
        <Popup><span className="text-sm font-medium">{route.to.label || 'Destination'}</span></Popup>
      </Marker>
    </>
  );
}
