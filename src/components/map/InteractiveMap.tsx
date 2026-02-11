import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, LayerGroup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Locate, Layers } from 'lucide-react';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string, size: number = 24) => {
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const sosIcon = createCustomIcon('#ef4444', 32);
const rescuerIcon = createCustomIcon('#22c55e', 28);
const evacuationIcon = createCustomIcon('#3b82f6', 28);
const userIcon = createCustomIcon('#8b5cf6', 24);
const householdIcon = createCustomIcon('#f59e0b', 20);

interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'sos' | 'rescuer' | 'evacuation' | 'user' | 'household';
  title: string;
  description?: string;
  severity?: string;
  status?: string;
}

interface FloodZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  waterLevel?: number;
}

interface InteractiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  floodZones?: FloodZone[];
  userLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  showUserLocation?: boolean;
  height?: string;
  className?: string;
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function LocateControl({ userLocation }: { userLocation?: { lat: number; lng: number } | null }) {
  const map = useMap();
  
  const handleLocate = () => {
    if (userLocation) {
      map.flyTo([userLocation.lat, userLocation.lng], 16);
    } else {
      map.locate({ setView: true, maxZoom: 16 });
    }
  };
  
  return (
    <div className="absolute top-4 right-16 z-[1000]">
      <Button
        variant="secondary"
        size="icon"
        onClick={handleLocate}
        className="shadow-lg bg-white hover:bg-gray-100"
      >
        <Locate className="w-4 h-4 text-gray-700" />
      </Button>
    </div>
  );
}

type BaseLayer = 'street' | 'satellite' | 'terrain';

const tileUrls: Record<BaseLayer, { url: string; attribution: string }> = {
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
};

function getFloodZoneColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return '#ef4444';
    case 'high': return '#f97316';
    case 'moderate': return '#eab308';
    default: return '#22c55e';
  }
}

function getMarkerIcon(type: string): L.DivIcon {
  switch (type) {
    case 'sos': return sosIcon;
    case 'rescuer': return rescuerIcon;
    case 'evacuation': return evacuationIcon;
    case 'household': return householdIcon;
    default: return userIcon;
  }
}

// Layer switcher rendered as HTML overlay (not a react-leaflet component)
function LayerSwitcher({ activeLayer, onChange }: { activeLayer: BaseLayer; onChange: (l: BaseLayer) => void }) {
  const [open, setOpen] = useState(false);
  const layers: { key: BaseLayer; label: string }[] = [
    { key: 'street', label: 'Street' },
    { key: 'satellite', label: 'Satellite' },
    { key: 'terrain', label: 'Terrain' },
  ];

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <Button
        variant="secondary"
        size="icon"
        onClick={() => setOpen(!open)}
        className="shadow-lg bg-white hover:bg-gray-100"
      >
        <Layers className="w-4 h-4 text-gray-700" />
      </Button>
      {open && (
        <div className="mt-1 bg-white rounded-lg shadow-lg border p-1 min-w-[120px]">
          {layers.map((l) => (
            <button
              key={l.key}
              onClick={() => { onChange(l.key); setOpen(false); }}
              className={`block w-full text-left px-3 py-1.5 text-sm rounded ${
                activeLayer === l.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function InteractiveMap({
  center = [13.8263, 121.3960],
  zoom = 14,
  markers = [],
  floodZones = [],
  userLocation,
  onMapClick,
  showUserLocation = true,
  height = '400px',
  className = '',
}: InteractiveMapProps) {
  const [baseLayer, setBaseLayer] = useState<BaseLayer>('street');
  const tile = tileUrls[baseLayer];

  return (
    <div className={`relative rounded-lg overflow-hidden border border-border ${className}`} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer key={baseLayer} attribution={tile.attribution} url={tile.url} />

        {/* Flood Zones */}
        <LayerGroup>
          {floodZones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={zone.radius}
              pathOptions={{
                color: getFloodZoneColor(zone.riskLevel),
                fillColor: getFloodZoneColor(zone.riskLevel),
                fillOpacity: 0.3,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1">
                  <h4 className="font-semibold text-sm">{zone.name}</h4>
                  <p className="text-xs text-gray-600">Risk Level: {zone.riskLevel}</p>
                  {zone.waterLevel !== undefined && (
                    <p className="text-xs text-gray-600">Water Level: {zone.waterLevel}cm</p>
                  )}
                </div>
              </Popup>
            </Circle>
          ))}
        </LayerGroup>

        {/* Markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            icon={getMarkerIcon(marker.type)}
          >
            <Popup>
              <div className="p-1 min-w-[150px]">
                <h4 className="font-semibold text-sm">{marker.title}</h4>
                {marker.description && (
                  <p className="text-xs text-gray-600 mt-1">{marker.description}</p>
                )}
                {marker.severity && (
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    marker.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    marker.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {marker.severity}
                  </span>
                )}
                {marker.status && (
                  <p className="text-xs text-gray-500 mt-1">Status: {marker.status}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Location */}
        {showUserLocation && userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="p-1">
                <h4 className="font-semibold text-sm">Your Location</h4>
              </div>
            </Popup>
          </Marker>
        )}

        <MapClickHandler onClick={onMapClick} />
        <LocateControl userLocation={userLocation} />
      </MapContainer>
      <LayerSwitcher activeLayer={baseLayer} onChange={setBaseLayer} />
    </div>
  );
}
