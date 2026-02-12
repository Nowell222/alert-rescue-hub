import { useEffect, useState } from 'react';
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

export default function RouteLine({ route }: { route: RouteInfo }) {
  const map = useMap();
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    // Fetch road route from OSRM (free, no API key)
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${route.from.lng},${route.from.lat};${route.to.lng},${route.to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes && data.routes.length > 0) {
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] // GeoJSON is [lng, lat], Leaflet wants [lat, lng]
          );
          setRouteCoords(coords);
          // Fit map to show entire route
          if (coords.length > 1) {
            const bounds = L.latLngBounds(coords.map(c => L.latLng(c[0], c[1])));
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        } else {
          // Fallback: straight line
          setRouteCoords([
            [route.from.lat, route.from.lng],
            [route.to.lat, route.to.lng],
          ]);
        }
      } catch {
        // Fallback: straight line
        setRouteCoords([
          [route.from.lat, route.from.lng],
          [route.to.lat, route.to.lng],
        ]);
      }
    };
    fetchRoute();
  }, [route.from.lat, route.from.lng, route.to.lat, route.to.lng, map]);

  if (routeCoords.length === 0) return null;

  return (
    <>
      <Polyline
        positions={routeCoords}
        pathOptions={{ color: '#3b82f6', weight: 5, opacity: 0.8, dashArray: '10, 6' }}
      />
      <Marker position={[route.from.lat, route.from.lng]} icon={startIcon}>
        <Popup><span className="text-sm font-medium">{route.from.label || 'Your Location'}</span></Popup>
      </Marker>
      <Marker position={[route.to.lat, route.to.lng]} icon={endIcon}>
        <Popup><span className="text-sm font-medium">{route.to.label || 'Destination'}</span></Popup>
      </Marker>
    </>
  );
}
