// components/MapView.jsx
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Search, 
  Crosshair, 
  Layers, 
  Activity, 
  Camera, 
  TrafficCone, 
  RefreshCw, 
  MapPin,
  AlertTriangle,
  Siren
} from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';

// Fix for default icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Helper component to handle smooth map panning and zoom
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2) {
      map.flyTo(center, zoom, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Preset popular cities
const PRESET_CITIES = [
  { name: 'London', coords: [51.5074, -0.1278], country: 'UK' },
  { name: 'New York', coords: [40.7128, -74.0060], country: 'USA' },
  { name: 'Mumbai', coords: [19.0760, 72.8777], country: 'India' },
  { name: 'Delhi', coords: [28.6139, 77.2090], country: 'India' },
  { name: 'Bengaluru', coords: [12.9716, 77.5946], country: 'India' },
  { name: 'Tokyo', coords: [35.6762, 139.6503], country: 'Japan' },
  { name: 'Singapore', coords: [1.3521, 103.8198], country: 'Singapore' },
  { name: 'Dubai', coords: [25.2048, 55.2708], country: 'UAE' }
];

// Generate localized traffic points based on center coordinates
const generateCityTrafficData = (lat, lng, cityName) => {
  return [
    {
      position: [lat + 0.008, lng + 0.005],
      name: `${cityName} North Highway`,
      status: 'heavy',
      description: 'Severe bottleneck - Peak rush hour load',
      speed: '14 km/h',
      vehicles: Math.floor(Math.random() * 40) + 75,
      color: '#ef4444',
      radius: 400
    },
    {
      position: [lat - 0.006, lng + 0.009],
      name: `${cityName} Commercial Corridor`,
      status: 'moderate',
      description: 'Moderate congestion - Steady flow',
      speed: '32 km/h',
      vehicles: Math.floor(Math.random() * 30) + 40,
      color: '#f59e0b',
      radius: 350
    },
    {
      position: [lat + 0.004, lng - 0.010],
      name: `${cityName} Ring Road Outer`,
      status: 'light',
      description: 'Clear conditions - High speed transit',
      speed: '58 km/h',
      vehicles: Math.floor(Math.random() * 20) + 15,
      color: '#10b981',
      radius: 300
    },
    {
      position: [lat - 0.011, lng - 0.006],
      name: `${cityName} Central Express Interchange`,
      status: 'heavy',
      description: 'Incident detected - Stalled vehicle on lane 2',
      speed: '8 km/h',
      vehicles: Math.floor(Math.random() * 35) + 85,
      color: '#ef4444',
      radius: 450
    },
    {
      position: [lat + 0.012, lng - 0.002],
      name: `${cityName} Financial District Entry`,
      status: 'moderate',
      description: 'Traffic light adaptive delay in progress',
      speed: '28 km/h',
      vehicles: Math.floor(Math.random() * 25) + 38,
      color: '#f59e0b',
      radius: 320
    }
  ];
};

const generateCityCameras = (lat, lng, cityName) => [
  { position: [lat + 0.007, lng - 0.004], id: 'CAM-01', location: `${cityName} North Crossing`, status: 'active', fps: 30 },
  { position: [lat - 0.005, lng + 0.007], id: 'CAM-02', location: `${cityName} Metro Plaza`, status: 'active', fps: 30 },
  { position: [lat + 0.002, lng + 0.011], id: 'CAM-03', location: `${cityName} Outer Bypass`, status: 'maintenance', fps: 0 },
  { position: [lat - 0.009, lng - 0.008], id: 'CAM-04', location: `${cityName} South Interchange`, status: 'active', fps: 30 }
];

const generateCitySignals = (lat, lng, cityName) => [
  { position: [lat + 0.005, lng + 0.002], id: 'SIG-101', name: `${cityName} Main Junction`, timer: 45, status: 'active', phase: 'Green' },
  { position: [lat - 0.003, lng - 0.005], id: 'SIG-102', name: `${cityName} West Boulevard`, timer: 60, status: 'active', phase: 'Red' },
  { position: [lat + 0.009, lng - 0.008], id: 'SIG-103', name: `${cityName} Tech Corridor`, timer: 30, status: 'active', phase: 'Yellow' }
];

function MapView() {
  const [currentCity, setCurrentCity] = useState('London');
  const [center, setCenter] = useState([51.505, -0.09]);
  const [zoom, setZoom] = useState(13);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Layer toggles
  const [mapLayer, setMapLayer] = useState('osm'); // 'osm' | 'satellite'
  const [showTrafficZones, setShowTrafficZones] = useState(true);
  const [showCameras, setShowCameras] = useState(true);
  const [showSignals, setShowSignals] = useState(true);

  // Dynamic traffic dataset
  const [trafficPoints, setTrafficPoints] = useState(() => generateCityTrafficData(51.505, -0.09, 'London'));
  const [cameras, setCameras] = useState(() => generateCityCameras(51.505, -0.09, 'London'));
  const [signals, setSignals] = useState(() => generateCitySignals(51.505, -0.09, 'London'));
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const [dbSignals, setDbSignals] = useState([]);

  // Fetch real database signals and listen to real-time socket updates
  useEffect(() => {
    let isMounted = true;
    const loadDbSignals = async () => {
      try {
        const data = await api.getLiveSignals();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDbSignals(data);
        }
      } catch (e) {
        console.warn('Could not load DB signals for map:', e);
      }
    };
    loadDbSignals();

    const handleSignalsUpdate = (updated) => {
      if (isMounted && Array.isArray(updated) && updated.length > 0) {
        setDbSignals(updated);
      }
    };
    socket.on('signalsUpdate', handleSignalsUpdate);
    return () => {
      isMounted = false;
      socket.off('signalsUpdate', handleSignalsUpdate);
    };
  }, []);

  // Periodically fluctuate traffic counts for live simulation feel
  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficPoints(prev => prev.map(pt => ({
        ...pt,
        vehicles: Math.max(10, pt.vehicles + Math.floor(Math.random() * 7) - 3)
      })));
      setLastRefreshed(new Date().toLocaleTimeString());
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectCity = (cityName, coords) => {
    setCurrentCity(cityName);
    setCenter(coords);
    setZoom(13);
    setTrafficPoints(generateCityTrafficData(coords[0], coords[1], cityName));
    setCameras(generateCityCameras(coords[0], coords[1], cityName));
    setSignals(generateCitySignals(coords[0], coords[1], cityName));
    setSearchError('');
  };

  // Geocode search any city via OpenStreetMap Nominatim
  const handleSearchCity = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        const displayName = data[0].display_name.split(',')[0];
        
        handleSelectCity(displayName, [lat, lon]);
        setSearchQuery('');
      } else {
        setSearchError('City not found. Please try another name.');
      }
    } catch (err) {
      setSearchError('Failed to search location.');
    } finally {
      setIsSearching(false);
    }
  };

  // Geolocation for user's current city
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setSearchError('Geolocation is not supported by your browser');
      return;
    }

    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        handleSelectCity('My Location', [latitude, longitude]);
        setIsSearching(false);
      },
      (err) => {
        setSearchError('Could not get your location: ' + err.message);
        setIsSearching(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden flex flex-col">
      {/* Top Map Toolbar: City Search & Controls */}
      <div className="p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* City Search Bar */}
          <form onSubmit={handleSearchCity} className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search any city (e.g. Mumbai, New York, Paris)..."
              className="w-full pl-9 pr-24 py-2 bg-gray-800 border border-gray-700 rounded-xl text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSearching ? 'Finding...' : 'Go'}
            </button>
          </form>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleLocateMe}
              title="Locate my city"
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-medium border border-gray-700 transition-colors"
            >
              <Crosshair className="h-3.5 w-3.5 text-blue-400" />
              <span>Locate Me</span>
            </button>

            {/* Map Style Toggle */}
            <div className="flex bg-gray-800 rounded-xl p-1 border border-gray-700">
              <button
                onClick={() => setMapLayer('osm')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  mapLayer === 'osm' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Streets
              </button>
              <button
                onClick={() => setMapLayer('satellite')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                  mapLayer === 'satellite' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live Feed: {lastRefreshed}</span>
            </div>
          </div>
        </div>

        {/* Preset Popular Cities Quick Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-gray-400 flex items-center gap-1 flex-shrink-0">
            <MapPin className="h-3.5 w-3.5 text-gray-500" /> Quick Cities:
          </span>
          {PRESET_CITIES.map((c) => (
            <button
              key={c.name}
              onClick={() => handleSelectCity(c.name, c.coords)}
              className={`px-2.5 py-1 rounded-lg font-medium flex-shrink-0 transition-all ${
                currentCity === c.name
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-gray-800/80 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {searchError && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> {searchError}
          </p>
        )}
      </div>

      {/* Main Map Container */}
      <div className="h-[520px] relative w-full">
        {/* Layer Filters Overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-gray-900/90 backdrop-blur-md rounded-xl p-3 border border-gray-800 shadow-xl space-y-2">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-blue-400" /> Layer Overlays
          </p>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showTrafficZones}
              onChange={(e) => setShowTrafficZones(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Traffic Congestion
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showCameras}
              onChange={(e) => setShowCameras(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3 text-blue-400" /> CCTV Cameras
            </span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showSignals}
              onChange={(e) => setShowSignals(e.target.checked)}
              className="rounded bg-gray-800 border-gray-700 text-blue-600 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <TrafficCone className="h-3 w-3 text-emerald-400" /> Smart Signals
            </span>
          </label>
        </div>

        {/* Map */}
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          className="rounded-b-2xl"
        >
          <MapUpdater center={center} zoom={zoom} />

          {/* OpenStreetMap Tile Layer */}
          {mapLayer === 'osm' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          ) : (
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, iPC, USGS, METI, TomTom'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          )}

          {/* Traffic Congestion Circles */}
          {showTrafficZones && trafficPoints.map((point, index) => (
            <Circle
              key={`traffic-${index}`}
              center={point.position}
              radius={point.radius}
              pathOptions={{
                fillColor: point.color,
                color: point.color,
                fillOpacity: 0.28,
                opacity: 0.8,
                weight: 2
              }}
            >
              <Popup>
                <div className="p-2 min-w-[180px]">
                  <div className="flex items-center justify-between border-b pb-1 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">{point.name}</h4>
                    <span 
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        point.status === 'heavy' ? 'bg-red-100 text-red-700' :
                        point.status === 'moderate' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {point.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{point.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-1.5 rounded">
                    <div>
                      <span className="text-gray-400 block text-[10px]">AVG SPEED</span>
                      <span className="font-bold text-gray-800">{point.speed}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">LOAD COUNT</span>
                      <span className="font-bold text-gray-800">{point.vehicles} veh/min</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}

          {/* Traffic Surveillance Cameras */}
          {showCameras && cameras.map((cam, index) => (
            <Marker
              key={`cam-${index}`}
              position={cam.position}
              icon={L.divIcon({
                html: `<div style="background-color: #3b82f6; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.4);">
                  <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
                </div>`,
                iconSize: [26, 26],
                className: 'cam-marker'
              })}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-semibold text-gray-900 text-sm">📹 Surveillance {cam.id}</h4>
                  <p className="text-xs text-gray-600 mt-1">{cam.location}</p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-medium">● Streaming Active</span>
                    <span className="text-gray-400">{cam.fps} FPS</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Smart Traffic Signals */}
          {showSignals && (
            (dbSignals.filter(s => s.latitude && s.longitude).length > 0
              ? dbSignals.filter(s => s.latitude && s.longitude)
              : signals
            ).map((sig, index) => {
              const isDb = !!sig.location;
              const pos = isDb ? [sig.latitude, sig.longitude] : sig.position;
              const name = isDb ? sig.location : sig.name;
              const phase = isDb
                ? sig.currentPhase
                  ? sig.currentPhase.charAt(0).toUpperCase() + sig.currentPhase.slice(1)
                  : 'Green'
                : sig.phase;
              const timer = sig.timer || 45;
              const isEVP = isDb && sig.emergencyOverride;

              const phaseColor = isEVP
                ? '#a855f7'
                : phase.toLowerCase() === 'green'
                ? '#10b981'
                : phase.toLowerCase() === 'red'
                ? '#ef4444'
                : '#f59e0b';

              return (
                <Marker
                  key={`sig-${index}-${sig._id || sig.id}`}
                  position={pos}
                  icon={L.divIcon({
                    html: `<div style="background: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid ${phaseColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); ${isEVP ? 'animation: pulse 1s infinite;' : ''}">
                      <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${phaseColor};"></div>
                    </div>`,
                    iconSize: [30, 30],
                    className: 'sig-marker'
                  })}
                >
                  <Popup>
                    <div className="p-2 min-w-[210px]">
                      <div className="flex items-center justify-between border-b pb-1 mb-1.5">
                        <h4 className="font-bold text-gray-900 text-sm">🚦 {name}</h4>
                        {isEVP && (
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            EVP ON
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs bg-gray-50 p-2 rounded mb-2">
                        <div>
                          <span className="text-gray-400 block text-[10px]">CURRENT PHASE</span>
                          <strong style={{ color: phaseColor }}>{phase}</strong>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[10px]">TIMER</span>
                          <strong className="text-gray-800">{timer}s</strong>
                        </div>
                        {isDb && (
                          <>
                            <div>
                              <span className="text-gray-400 block text-[10px]">VEHICLES</span>
                              <strong className="text-gray-800">{sig.vehicleCount || 25}</strong>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px]">CONGESTION</span>
                              <strong className="text-gray-800 uppercase text-[11px]">{sig.congestionLevel || 'low'}</strong>
                            </div>
                          </>
                        )}
                      </div>
                      {isDb && (
                        <button
                          onClick={async () => {
                            await api.toggleEmergency(sig._id);
                          }}
                          className={`w-full py-1 px-2 rounded text-xs font-semibold text-white transition-all ${
                            isEVP ? 'bg-gray-700 hover:bg-gray-800' : 'bg-purple-600 hover:bg-purple-700'
                          }`}
                        >
                          {isEVP ? 'Deactivate Priority Wave' : '⚡ Trigger Emergency Wave (EVP)'}
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })
          )}

          {/* Legend Overlay */}
          <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur-md rounded-xl p-3 border border-gray-800 z-[1000] text-xs shadow-xl pointer-events-auto">
            <h5 className="font-semibold text-gray-200 mb-2">City Traffic Legend</h5>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-gray-300">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span>Light Traffic</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span>Heavy Jam</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span>CCTV Camera</span>
              </div>
            </div>
          </div>
        </MapContainer>
      </div>
    </div>
  );
}

export default MapView;