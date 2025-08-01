import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import VenueDrawer from './VenueDrawer';
import MapControls from './MapControls';
import Premium3DLoader from './Premium3DLoader';
import { useMapData } from '../hooks/useMapData';
import './True3DMapView.css';


const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

/**
 * True3DMapView - Real 3D map using Mapbox GL JS
 * Provides genuine 3D terrain, building extrusions, and angled views
 */
const True3DMapView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [-73.9851, 40.7589], 
  enable3D = true 
}) => {
  
  const [viewState, setViewState] = useState({
    longitude: mapCenter[0],
    latitude: mapCenter[1],
    zoom: 13,
    pitch: 65, 
    bearing: -30, 
    padding: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [drawerState, setDrawerState] = useState('hidden');
  const [routeMode, setRouteMode] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    budget: null,
    openNow: false,
    indoorOutdoor: null
  });
  const [showLegend, setShowLegend] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox:
  const [venues, setVenues] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [useMapboxFallback, setUseMapboxFallback] = useState(false);
  
  const mapRef = useRef(null);

  
  const getMapboxStyle = (style) => {
    switch (style) {
      case 'satellite':
        return 'mapbox:
      case 'dark':
        return 'mapbox:
      case 'light':
        return 'mapbox:
      case 'terrain':
        return 'mapbox:
      default:
        return 'mapbox:
    }
  };

  
  useEffect(() => {
    if (mapCenter && (mapCenter[0] !== viewState.longitude || mapCenter[1] !== viewState.latitude)) {
      setViewState(prev => ({
        ...prev,
        longitude: mapCenter[0],
        latitude: mapCenter[1],
        zoom: 12
      }));
    }
  }, [mapCenter, viewState.longitude, viewState.latitude]);

  
  useEffect(() => {
    const generateVenues = () => {
      const newVenues = [];
      const [centerLng, centerLat] = [mapCenter[0], mapCenter[1]];
      
      
      const fixedPositions = [
        { angle: 0, distance: 0.015 },
        { angle: 0.35, distance: 0.020 },
        { angle: 0.70, distance: 0.012 },
        { angle: 1.05, distance: 0.025 },
        { angle: 1.40, distance: 0.018 },
        { angle: 1.75, distance: 0.014 },
        { angle: 2.10, distance: 0.022 },
        { angle: 2.45, distance: 0.016 },
        { angle: 2.80, distance: 0.019 },
        { angle: 3.15, distance: 0.013 },
        { angle: 3.50, distance: 0.021 },
        { angle: 3.85, distance: 0.017 },
        { angle: 4.20, distance: 0.024 },
        { angle: 4.55, distance: 0.011 },
        { angle: 4.90, distance: 0.020 },
        { angle: 5.25, distance: 0.015 },
        { angle: 5.60, distance: 0.023 },
        { angle: 5.95, distance: 0.018 }
      ];
      
      const fixedAffinities = [85, 92, 67, 78, 89, 45, 73, 56, 91, 38, 82, 64, 76, 87, 42, 69, 94, 51];
      const fixedRatings = [4.2, 4.7, 3.8, 4.1, 4.5, 3.6, 4.0, 3.9, 4.6, 3.5, 4.3, 3.7, 4.1, 4.4, 3.8, 4.0, 4.8, 3.7];
      
      for (let i = 0; i < 18; i++) {
        const { angle, distance } = fixedPositions[i];
        
        const lng = centerLng + Math.cos(angle) * distance;
        const lat = centerLat + Math.sin(angle) * distance;
        
        newVenues.push({
          id: i + 1,
          number: i + 1,
          coordinates: [lng, lat],
          name: getVenueName(i),
          type: getVenueType(selectedTastes, i),
          affinity: fixedAffinities[i],
          rating: fixedRatings[i]
        });
      }
      
      setVenues(newVenues.sort((a, b) => b.affinity - a.affinity));
    };

    
    if (venues.length === 0) {
      generateVenues();
    }
  }, [mapCenter, selectedTastes, venues.length]);

  const getVenueName = (index) => {
    const names = [
      'Blue Note Jazz Club', 'Artisan Coffee House', 'Gallery Modern',
      'The Hidden Speakeasy', 'Rooftop Garden Bar', 'Local Market Bistro',
      'Vintage Records Store', 'Contemporary Art Space', 'Craft Brewery',
      'Independent Bookshop', 'Cultural Center', 'Live Music Venue',
      'Food Hall Collective', 'Designer Boutique', 'Wine & Tapas Bar',
      'Theater District Café', 'Museum Shop', 'Night Market'
    ];
    return names[index] || `Cultural Venue ${index + 1}`;
  };

  const getVenueType = (tastes, index) => {
    const types = [
      'Jazz Club', 'Coffee House', 'Art Gallery', 'Cocktail Bar', 
      'Rooftop Venue', 'Restaurant', 'Vintage Shop', 'Art Space',
      'Brewery', 'Bookstore', 'Cultural Center', 'Music Venue',
      'Food Hall', 'Boutique', 'Wine Bar', 'Café', 'Museum', 'Market'
    ];
    return types[index % types.length];
  };

  
  const { 
    loading: heatLoading, 
    error: heatError,
  } = useMapData(selectedTastes);

  
  const handleMarkerClick = useCallback((venue) => {
    console.log('Venue selected:', venue);
    setSelectedVenue(venue);
    setDrawerState('peek');
    
    
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: venue.coordinates,
        zoom: 15,
        pitch: 70,
        bearing: -30,
        duration: 2000
      });
    }
  }, []);

  
  const handleFilterToggle = useCallback(async (newFilters) => {
    setActiveFilters(newFilters);
    console.log('Filters updated:', newFilters);
  }, []);

  
  const handleRoutePress = useCallback(() => {
    setRouteMode(!routeMode);
  }, [routeMode]);

  
  const handleStyleChange = useCallback((newStyle) => {
    setMapStyle(getMapboxStyle(newStyle));
  }, []);

  
  const onMapLoad = useCallback(() => {
    console.log('🏔️ Loading 3D map with terrain and buildings...');
    const map = mapRef.current?.getMap();
    if (!map) {
      setMapError('Failed to get map instance');
      return;
    }

    try {
      setMapLoaded(true);
      
      
      try {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox:
          tileSize: 512,
          maxzoom: 14
        });

        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        console.log('✅ 3D terrain loaded successfully');
      } catch (terrainError) {
        console.warn('⚠️ 3D terrain not available, continuing without terrain:', terrainError);
      }

      
      try {
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout['text-field']
        )?.id;

        if (labelLayerId) {
          map.addLayer(
            {
              id: 'add-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0, '#74b9ff',
                  50, '#0984e3', 
                  100, '#6c5ce7',
                  150, '#fd79a8',
                  200, '#e84393'
                ],
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14, 0,
                  14.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  14, 0,
                  14.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.9
              }
            },
            labelLayerId
          );
          console.log('✅ 3D buildings loaded successfully');
        }
      } catch (buildingError) {
        console.warn('⚠️ 3D buildings not available:', buildingError);
      }

      
      try {
        map.setFog({
          color: 'rgb(186, 210, 235)',
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.6
        });
      } catch (fogError) {
        console.warn('⚠️ Fog effects not available:', fogError);
      }

    } catch (error) {
      console.error('❌ Failed to load 3D features:', error);
      setMapError(error.message);
    }
  }, []);

  
  const FallbackMap = () => {
    return (
      <div className="fallback-3d-map">
        <iframe
          src={`https:
          style={{
            width: '100%',
            height: '100vh',
            border: 'none',
            transform: `perspective(1000px) rotateX(${viewState.pitch}deg) rotateZ(${viewState.bearing}deg)`,
            transformOrigin: 'center center',
            transition: 'transform 0.3s ease'
          }}
          title="3D Map View"
        />
        
        {}
        <div className="fallback-markers-overlay">
          {venues.map((venue) => {
            const color = venue.affinity > 70 ? '#e74c3c' : venue.affinity > 40 ? '#f39c12' : '#3498db';
            return (
              <div
                key={venue.id}
                className="fallback-marker"
                style={{
                  position: 'absolute',
                  left: `${50 + (venue.coordinates[0] - mapCenter[0]) * 2000}px`,
                  top: `${50 + (venue.coordinates[1] - mapCenter[1]) * 2000}px`,
                  background: color,
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  zIndex: 1000
                }}
                onClick={() => handleMarkerClick(venue)}
              >
                {venue.number}
              </div>
            );
          })}
        </div>
        
        {}
        <div className="fallback-indicator">
          <span className="fallback-badge">
            🗺️ FALLBACK 3D MODE • CSS Transforms • Pitch: {viewState.pitch}°
          </span>
          <div className="mode-subtitle">
            OpenStreetMap with CSS 3D transforms • Click markers for details
          </div>
        </div>
      </div>
    );
  };

  
  if (useMapboxFallback) {
    return (
      <div className="true-3d-map-view">
        <FallbackMap />
        
        {}
        <MapControls
          activeFilters={activeFilters}
          onFilterToggle={handleFilterToggle}
          showLegend={showLegend}
          onLegendToggle={() => setShowLegend(!showLegend)}
          routeMode={routeMode}
          onRoutePress={handleRoutePress}
          canRoute={selectedVenue !== null}
          mapStyle="fallback"
          onStyleChange={handleStyleChange}
          userLocation={userLocation}
        />

        {}
        <div className="map-3d-controls">
          <button
            className="control-btn pitch-btn"
            onClick={() => setViewState(prev => ({ 
              ...prev, 
              pitch: Math.min(prev.pitch + 10, 60) 
            }))}
          >
            ⬆️ Pitch Up
          </button>
          <button
            className="control-btn pitch-btn"
            onClick={() => setViewState(prev => ({ 
              ...prev, 
              pitch: Math.max(prev.pitch - 10, 0) 
            }))}
          >
            ⬇️ Pitch Down
          </button>
          <button
            className="control-btn rotate-btn"
            onClick={() => setViewState(prev => ({ 
              ...prev, 
              bearing: prev.bearing - 15 
            }))}
          >
            ↶ Rotate Left
          </button>
          <button
            className="control-btn rotate-btn"
            onClick={() => setViewState(prev => ({ 
              ...prev, 
              bearing: prev.bearing + 15 
            }))}
          >
            ↷ Rotate Right
          </button>
        </div>

        {}
        <VenueDrawer
          state={drawerState}
          venues={selectedVenue ? [selectedVenue] : []}
          loading={false}
          error={null}
          focusedVenue={selectedVenue}
          onStateChange={setDrawerState}
          onVenueSelect={(venue) => console.log('Venue selected:', venue)}
        />

        {}
        {showLegend && (
          <div className="heat-legend">
            <h4>Cultural Venues</h4>
            <div className="legend-scale">
              <div className="scale-item high">
                <span className="color-box high"></span>
                <span>High Match (70%+)</span>
              </div>
              <div className="scale-item medium">
                <span className="color-box medium"></span>
                <span>Medium Match (40-69%)</span>
              </div>
              <div className="scale-item low">
                <span className="color-box low"></span>
                <span>Low Match (&lt;40%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  if (heatLoading && !venues.length) {
    return <Premium3DLoader message="Initializing 3D terrain map..." />;
  }

  
  if (heatError || mapError) {
    return (
      <div className="map-error">
        <h3>Unable to load 3D map</h3>
        <p>{mapError || heatError}</p>
        <p>This might be due to:</p>
        <ul>
          <li>Network connectivity issues</li>
          <li>Invalid Mapbox token</li>
          <li>Browser compatibility</li>
        </ul>
        <button onClick={() => {
          setMapError(null);
          window.location.reload();
        }}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="true-3d-map-view">
      {!mapLoaded && (
        <div className="map-loading-overlay">
          <Premium3DLoader message="Loading 3D map..." />
        </div>
      )}
      
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100vh' }}
        mapStyle={mapStyle}
        onLoad={onMapLoad}
        onError={(error) => {
          console.error('Map error:', error);
          setMapError('Failed to load Mapbox. Switching to fallback map...');
          setTimeout(() => {
            setUseMapboxFallback(true);
            setMapError(null);
          }, 2000);
        }}
      >
        {}
        {venues.map((venue) => {
          const color = venue.affinity > 70 ? '#e74c3c' : venue.affinity > 40 ? '#f39c12' : '#3498db';
          const size = venue.affinity > 70 ? 40 : venue.affinity > 40 ? 35 : 30;
          
          return (
            <Marker
              key={venue.id}
              longitude={venue.coordinates[0]}
              latitude={venue.coordinates[1]}
              anchor="center"
              onClick={() => handleMarkerClick(venue)}
            >
              <div
                className="mapbox-3d-marker"
                style={{
                  background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%)`,
                  width: size,
                  height: size,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: size > 35 ? '16px' : '14px',
                  border: '3px solid rgba(255, 255, 255, 0.9)',
                  boxShadow: `
                    0 8px 25px rgba(0,0,0,0.4),
                    0 4px 12px rgba(0,0,0,0.2),
                    inset 0 2px 4px rgba(255,255,255,0.3)
                  `,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: 'translateZ(0)',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.2) translateZ(10px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1) translateZ(0)';
                }}
              >
                {venue.number}
              </div>
            </Marker>
          );
        })}

        {}
        {selectedVenue && (
          <Popup
            longitude={selectedVenue.coordinates[0]}
            latitude={selectedVenue.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedVenue(null)}
            closeButton={false}
            className="mapbox-venue-popup"
          >
            <div className="venue-popup-content">
              <h3>#{selectedVenue.number} {selectedVenue.name}</h3>
              <p><strong>Type:</strong> {selectedVenue.type}</p>
              <p><strong>Cultural Match:</strong> {Math.round(selectedVenue.affinity)}%</p>
              <p><strong>Rating:</strong> {selectedVenue.rating.toFixed(1)}⭐</p>
              <button 
                className="view-details-btn"
                onClick={() => console.log('View details for:', selectedVenue)}
              >
                View Details
              </button>
            </div>
          </Popup>
        )}
      </Map>

      {}
      <MapControls
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        showLegend={showLegend}
        onLegendToggle={() => setShowLegend(!showLegend)}
        routeMode={routeMode}
        onRoutePress={handleRoutePress}
        canRoute={selectedVenue !== null}
        mapStyle={mapStyle.split('/').pop().split('-')[0]} 
        onStyleChange={handleStyleChange}
        userLocation={userLocation}
      />

      {}
      <VenueDrawer
        state={drawerState}
        venues={selectedVenue ? [selectedVenue] : []}
        loading={false}
        error={null}
        focusedVenue={selectedVenue}
        onStateChange={setDrawerState}
        onVenueSelect={(venue) => console.log('Venue selected:', venue)}
      />

      {}
      <div className="map-3d-controls">
        <button
          className="control-btn pitch-btn"
          onClick={() => setViewState(prev => ({ 
            ...prev, 
            pitch: Math.min(prev.pitch + 10, 60) 
          }))}
        >
          ⬆️ Pitch Up
        </button>
        <button
          className="control-btn pitch-btn"
          onClick={() => setViewState(prev => ({ 
            ...prev, 
            pitch: Math.max(prev.pitch - 10, 0) 
          }))}
        >
          ⬇️ Pitch Down
        </button>
        <button
          className="control-btn rotate-btn"
          onClick={() => setViewState(prev => ({ 
            ...prev, 
            bearing: prev.bearing - 15 
          }))}
        >
          ↶ Rotate Left
        </button>
        <button
          className="control-btn rotate-btn"
          onClick={() => setViewState(prev => ({ 
            ...prev, 
            bearing: prev.bearing + 15 
          }))}
        >
          ↷ Rotate Right
        </button>
      </div>

      {}
      <div className="mode-indicator-3d">
        <span className="mode-badge-3d">
          🏔️ TRUE 3D MODE • Terrain + Buildings • Pitch: {viewState.pitch}° • Bearing: {Math.round(viewState.bearing)}°
        </span>
        <div className="mode-subtitle">
          Zoom in to level 14+ to see 3D buildings • Use controls to adjust perspective
        </div>
      </div>

      {}
      {showLegend && (
        <div className="heat-legend">
          <h4>Cultural Venues</h4>
          <div className="legend-scale">
            <div className="scale-item high">
              <span className="color-box high"></span>
              <span>High Match (70%+)</span>
            </div>
            <div className="scale-item medium">
              <span className="color-box medium"></span>
              <span>Medium Match (40-69%)</span>
            </div>
            <div className="scale-item low">
              <span className="color-box low"></span>
              <span>Low Match (&lt;40%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


const adjustBrightness = (color, percent) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const newR = Math.max(0, Math.min(255, r + (r * percent / 100)));
  const newG = Math.max(0, Math.min(255, g + (g * percent / 100)));
  const newB = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  return `rgb(${Math.round(newR)}, ${Math.round(newG)}, ${Math.round(newB)})`;
};

export default True3DMapView;
