import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import NumberedMarkers from './NumberedMarkers';
import VenueDrawer from './VenueDrawer';
import MapControls from './MapControls';
import RouteOverlay from './RouteOverlay';
import LoadingSpinner from './LoadingSpinner';
import Premium3DLoader from './Premium3DLoader';
import { useMapData } from '../hooks/useMapData';
import './MapView.css';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * MapView - Enhanced 3D map component for the "Paint My Map" screen
 * Displays cultural venues with 3D effects and interactive controls
 */
const MapView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [40.7589, -73.9851],
  enable3D = true 
}) => {
  
  const [currentMapCenter, setCurrentMapCenter] = useState(mapCenter);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [drawerState, setDrawerState] = useState('hidden');
  const [routeMode, setRouteMode] = useState(false);
  const [is3DMode, setIs3DMode] = useState(enable3D);
  const [activeFilters, setActiveFilters] = useState({
    budget: null,
    openNow: false,
    indoorOutdoor: null
  });
  const [showLegend, setShowLegend] = useState(false);
  const [mapStyle, setMapStyle] = useState('streets');

  
  const getMapTileUrl = (style) => {
    switch (style) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png';
      case 'light':
        return 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png';
      case 'terrain':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
      default:
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
  };

  const getMapAttribution = (style) => {
    switch (style) {
      case 'satellite':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      case 'dark':
      case 'light':
        return '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';
      case 'terrain':
        return '&copy; <a href="https://www.esri.com/">Esri</a>';
      default:
        return '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors';
    }
  };

  
  useEffect(() => {
    if (mapCenter && (mapCenter[0] !== currentMapCenter[0] || mapCenter[1] !== currentMapCenter[1])) {
      setCurrentMapCenter(mapCenter);
      if (mapZoom !== 12) {
        setMapZoom(12);
      }
    }
  }, [mapCenter, currentMapCenter, mapZoom]);

  
  const { 
    heatData, 
    loading: heatLoading, 
    error: heatError,
    generateHeatData
  } = useMapData(selectedTastes);

  
  const isGeneratingRef = useRef(false);

  
  useEffect(() => {
    if (selectedTastes.length >= 3 && !isGeneratingRef.current) {
      isGeneratingRef.current = true;
      generateHeatData(mapCenter, mapZoom).finally(() => {
        isGeneratingRef.current = false;
      });
    }
  }, [selectedTastes, generateHeatData]);

  
  const handleMarkerClick = useCallback((venue) => {
    console.log('Venue selected:', venue);
    setSelectedVenue(venue);
    setDrawerState('peek');
  }, []);

  
  const handleDrawerDrag = useCallback((newState) => {
    setDrawerState(newState);
  }, []);

  
  const handleFilterToggle = useCallback(async (newFilters) => {
    setActiveFilters(newFilters);
    console.log('Filters updated:', newFilters);
  }, []);

  
  const handleRoutePress = useCallback(() => {
    setRouteMode(!routeMode);
    if (!routeMode) {
      console.log('Entering route mode');
    }
  }, [routeMode]);

  
  const MapEventHandler = () => {
    useMapEvents({
      moveend: (e) => {
        const map = e.target;
        const center = map.getCenter();
        const zoom = map.getZoom();
        
        setCurrentMapCenter([center.lat, center.lng]);
        setMapZoom(zoom);
        
        
        if (selectedTastes.length >= 3 && !isGeneratingRef.current) {
          setTimeout(() => {
            if (!isGeneratingRef.current) {
              isGeneratingRef.current = true;
              generateHeatData([center.lat, center.lng], zoom).finally(() => {
                isGeneratingRef.current = false;
              });
            }
          }, 500);
        }
      },
      click: () => {
        
        if (selectedVenue && drawerState === 'peek') {
          setSelectedVenue(null);
          setDrawerState('hidden');
        }
      }
    });
    return null;
  };

  
  if (heatLoading && !heatData.length) {
    return is3DMode ? (
      <Premium3DLoader message="Painting your 3D cultural map..." />
    ) : (
      <LoadingSpinner 
        colors={selectedTastes.map(taste => taste.color || '#667eea')}
        message="Painting your cultural map..."
      />
    );
  }

  
  if (heatError) {
    return (
      <div className="map-error">
        <h3>Unable to load map data</h3>
        <p>{heatError}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="map-view">
      {}
      <MapContainer
        center={currentMapCenter}
        zoom={mapZoom}
        className={`map-container ${drawerState === 'expanded' ? 'dimmed' : ''} ${is3DMode ? 'map-3d' : 'map-2d'}`}
        zoomControl={false}
      >
        {}
        <TileLayer
          url={getMapTileUrl(mapStyle)}
          attribution={getMapAttribution(mapStyle)}
        />
        
        {}
        <MapEventHandler />
        
        {}
        <NumberedMarkers
          mapCenter={currentMapCenter}
          selectedTastes={selectedTastes}
          onMarkerClick={handleMarkerClick}
        />
        
        {}
        {routeMode && selectedVenue && (
          <RouteOverlay
            venues={[selectedVenue]}
            onRouteCalculated={(route) => console.log('Route calculated:', route)}
          />
        )}
      </MapContainer>

      {}
      <MapControls
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        showLegend={showLegend}
        onLegendToggle={() => setShowLegend(!showLegend)}
        routeMode={routeMode}
        onRoutePress={handleRoutePress}
        canRoute={selectedVenue !== null}
        is3DMode={is3DMode}
        onToggle3D={() => setIs3DMode(!is3DMode)}
        mapStyle={mapStyle}
        onStyleChange={setMapStyle}
        userLocation={userLocation}
      />

      {}
      <VenueDrawer
        state={drawerState}
        venues={selectedVenue ? [selectedVenue] : []}
        loading={false}
        error={null}
        focusedVenue={selectedVenue}
        onStateChange={handleDrawerDrag}
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
          <div className="legend-info">
            <small>📍 {userLocation}</small>
            <small>🎯 {selectedTastes.length} taste{selectedTastes.length !== 1 ? 's' : ''}</small>
            <small>📌 Numbered markers show cultural hotspots</small>
          </div>
        </div>
      )}

      {}
      {is3DMode && (
        <div className="mode-indicator">
          <span className="mode-badge">3D Mode</span>
        </div>
      )}

      {}
      {heatLoading && heatData.length > 0 && (
        <div className="map-loading-overlay">
          <div className="map-loading-content">
            <h3>Updating Map</h3>
            <p>Finding new cultural venues...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
