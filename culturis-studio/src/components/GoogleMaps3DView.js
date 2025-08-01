import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import VenueDrawer from './VenueDrawer';
import MapControls from './MapControls';
import Premium3DLoader from './Premium3DLoader';
import { useMapData } from '../hooks/useMapData';
import './GoogleMaps3DView.css';


const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg';


const MAPS_LOAD_TIMEOUT = 5000;


let googleMapsPromise = null;

/**
 * GoogleMaps3DView - True 3D map using Google Maps API
 * Features: Real 3D buildings, satellite imagery, terrain, street view integration
 */
const GoogleMaps3DView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [-73.9851, 40.7589], 
  enable3D = true 
}) => {
  console.log('🗺️ GoogleMaps3DView rendering with props:', { selectedTastes, userLocation, mapCenter, enable3D });
  
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  
  
  const [viewState, setViewState] = useState({
    longitude: mapCenter[0],
    latitude: mapCenter[1],
    zoom: 16,
    tilt: 67.5, 
    heading: 320, 
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
  const [venues, setVenues] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [mapType, setMapType] = useState('satellite'); 
  const [loadingProgress, setLoadingProgress] = useState(0);

  
  useEffect(() => {
    const nycVenues = [
      { id: 1, number: 1, name: 'Blue Note Jazz Club', type: 'Jazz Club', affinity: 85, rating: 4.2, 
        coordinates: [-73.9881, 40.7614], address: 'Greenwich Village' },
      { id: 2, number: 2, name: 'MoMA', type: 'Art Museum', affinity: 92, rating: 4.7, 
        coordinates: [-73.9776, 40.7614], address: 'Midtown Manhattan' },
      { id: 3, number: 3, name: 'High Line', type: 'Park', affinity: 67, rating: 3.8, 
        coordinates: [-74.0048, 40.7480], address: 'Chelsea' },
      { id: 4, number: 4, name: 'Brooklyn Bridge', type: 'Landmark', affinity: 78, rating: 4.1, 
        coordinates: [-73.9969, 40.7061], address: 'Downtown Brooklyn' },
      { id: 5, number: 5, name: 'Central Park', type: 'Park', affinity: 89, rating: 4.5, 
        coordinates: [-73.9654, 40.7829], address: 'Upper Manhattan' },
      { id: 6, number: 6, name: 'Chelsea Market', type: 'Food Hall', affinity: 45, rating: 3.6, 
        coordinates: [-74.0063, 40.7420], address: 'Chelsea' },
      { id: 7, number: 7, name: 'Times Square', type: 'Entertainment', affinity: 73, rating: 4.0, 
        coordinates: [-73.9857, 40.7580], address: 'Midtown' },
      { id: 8, number: 8, name: 'Brooklyn Museum', type: 'Art Museum', affinity: 56, rating: 3.9, 
        coordinates: [-73.9636, 40.6712], address: 'Brooklyn' },
      { id: 9, number: 9, name: 'One World Trade', type: 'Landmark', affinity: 91, rating: 4.6, 
        coordinates: [-74.0134, 40.7127], address: 'Financial District' },
      { id: 10, number: 10, name: 'Williamsburg', type: 'Neighborhood', affinity: 38, rating: 3.5, 
        coordinates: [-73.9442, 40.7081], address: 'Brooklyn' },
      { id: 11, number: 11, name: 'Little Italy', type: 'Neighborhood', affinity: 82, rating: 4.3, 
        coordinates: [-73.9973, 40.7193], address: 'Manhattan' },
      { id: 12, number: 12, name: 'Statue of Liberty', type: 'Landmark', affinity: 64, rating: 3.7, 
        coordinates: [-74.0445, 40.6892], address: 'Liberty Island' },
      { id: 13, number: 13, name: 'Empire State Building', type: 'Landmark', affinity: 76, rating: 4.1, 
        coordinates: [-73.9857, 40.7484], address: 'Midtown' },
      { id: 14, number: 14, name: 'SoHo', type: 'Neighborhood', affinity: 87, rating: 4.4, 
        coordinates: [-74.0020, 40.7233], address: 'Manhattan' },
      { id: 15, number: 15, name: 'Coney Island', type: 'Entertainment', affinity: 42, rating: 3.8, 
        coordinates: [-73.9442, 40.5755], address: 'Brooklyn' },
      { id: 16, number: 16, name: 'The Met', type: 'Art Museum', affinity: 69, rating: 4.0, 
        coordinates: [-73.9632, 40.7794], address: 'Upper East Side' },
      { id: 17, number: 17, name: 'Flatiron Building', type: 'Landmark', affinity: 94, rating: 4.8, 
        coordinates: [-73.9897, 40.7411], address: 'Flatiron District' },
      { id: 18, number: 18, name: 'Wall Street', type: 'Financial', affinity: 51, rating: 3.7, 
        coordinates: [-74.0113, 40.7074], address: 'Financial District' }
    ];
    
    setVenues(nycVenues.sort((a, b) => b.affinity - a.affinity));
  }, []);

  
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoadingProgress(10);
        console.log('🗺️ Starting Google Maps initialization...');
        console.log('🔑 API Key:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'MISSING');

        
        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
          throw new Error('Google Maps API key is missing or not configured. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file.');
        }

        
        const timeoutId = setTimeout(() => {
          setMapError('Google Maps is taking too long to load. Switching to fallback...');
          console.error('❌ Google Maps load timeout');
        }, MAPS_LOAD_TIMEOUT);

        setLoadingProgress(30);

        
        if (!googleMapsPromise) {
          console.log('🔄 Creating new Google Maps Loader...');
          const loader = new Loader({
            apiKey: GOOGLE_MAPS_API_KEY,
            version: 'weekly',
            libraries: [] 
          });
          googleMapsPromise = loader.load();
        }

        setLoadingProgress(50);
        console.log('📦 Loading Google Maps API...');

        const google = await googleMapsPromise;
        clearTimeout(timeoutId); 
        
        setLoadingProgress(70);
        console.log('✅ Google Maps API loaded successfully');
        
        if (mapRef.current) {
          setLoadingProgress(75);
          console.log('🗺️ Creating map instance...');

          try {
            const map = new google.maps.Map(mapRef.current, {
              center: { lat: viewState.latitude, lng: viewState.longitude },
              zoom: viewState.zoom,
              mapTypeId: 'satellite', 
              disableDefaultUI: true, 
              zoomControl: true, 
              gestureHandling: 'cooperative'
            });

            googleMapRef.current = map;
            setLoadingProgress(85);
            console.log('🗺️ Map instance created, adding markers...');

            
            setTimeout(() => {
              setLoadingProgress(90);
              console.log('🗺️ Adding markers...');
              
              
              addVenueMarkers(google, map);
              
              setLoadingProgress(100);
              setMapLoaded(true);
              console.log('✅ Google Maps 3D loaded successfully');
            }, 100); 
            
          } catch (mapError) {
            console.error('❌ Failed to create map instance:', mapError);
            setMapError('Failed to create map. Please try refreshing the page.');
          }
        }
      } catch (error) {
        console.error('❌ Failed to load Google Maps:', error);
        setMapError(`Failed to load Google Maps: ${error.message}. Please check your API key and internet connection.`);
      }
    };

    
    initializeMap();
  }, [viewState.latitude, viewState.longitude, mapType]);

  
  const addVenueMarkers = useCallback((google, map) => {
    
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    
    venues.forEach((venue, index) => {
      const color = venue.affinity > 70 ? '#e74c3c' : venue.affinity > 40 ? '#f39c12' : '#3498db';
      
      
      const marker = new google.maps.Marker({
        position: { lat: venue.coordinates[1], lng: venue.coordinates[0] },
        map: map,
        title: venue.name,
        label: {
          text: venue.number.toString(),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '14px'
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 3,
          scale: 18
        }
      });

      
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 15px; min-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 16px;">#${venue.number} ${venue.name}</h3>
            <p style="margin: 5px 0; color: #555; font-size: 14px;"><strong>Type:</strong> ${venue.type}</p>
            <p style="margin: 5px 0; color: #555; font-size: 14px;"><strong>Location:</strong> ${venue.address}</p>
            <p style="margin: 5px 0; color: #555; font-size: 14px;"><strong>Cultural Match:</strong> ${Math.round(venue.affinity)}%</p>
            <p style="margin: 5px 0; color: #555; font-size: 14px;"><strong>Rating:</strong> ${venue.rating.toFixed(1)}⭐</p>
            <button onclick="window.selectVenue(${venue.id})" style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white; border: none; padding: 8px 16px; border-radius: 15px;
              font-weight: 600; cursor: pointer; margin-top: 10px;
            ">View Details</button>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        handleMarkerClick(venue);
      });

      markersRef.current.push(marker);
    });

    
    window.selectVenue = (venueId) => {
      const venue = venues.find(v => v.id === venueId);
      if (venue) {
        setSelectedVenue(venue);
        setDrawerState('expanded');
      }
    };
  }, [venues]);

  
  const handleMarkerClick = useCallback((venue) => {
    console.log('Venue selected:', venue);
    setSelectedVenue(venue);
    setDrawerState('peek');
  }, []);

  
  const updateMapView = useCallback((newViewState) => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ 
        lat: newViewState.latitude, 
        lng: newViewState.longitude 
      });
      googleMapRef.current.setZoom(newViewState.zoom);
      googleMapRef.current.setTilt(newViewState.tilt);
      googleMapRef.current.setHeading(newViewState.heading);
    }
    setViewState(newViewState);
  }, []);

  
  const handleFilterToggle = useCallback(async (newFilters) => {
    setActiveFilters(newFilters);
    console.log('Filters updated:', newFilters);
  }, []);

  
  const handleRoutePress = useCallback(() => {
    setRouteMode(!routeMode);
  }, [routeMode]);

  
  const handleStyleChange = useCallback((newStyle) => {
    const styleMap = {
      'streets': 'roadmap',
      'satellite': 'satellite',
      'hybrid': 'hybrid',
      'terrain': 'terrain'
    };
    setMapType(styleMap[newStyle] || 'satellite');
  }, []);

  
  const getLoadingMessage = (progress) => {
    if (progress < 30) return 'Connecting to Google Maps...';
    if (progress < 50) return 'Loading API libraries...';
    if (progress < 70) return 'Initializing 3D engine...';
    if (progress < 85) return 'Creating map instance...';
    if (progress < 95) return 'Loading satellite imagery...';
    if (progress < 100) return 'Adding venue markers...';
    return 'Almost ready!';
  };

  
  useMapData(selectedTastes);

  
  if (!mapLoaded && !mapError) {
    return (
      <div className="google-maps-loading">
        <Premium3DLoader message={`${getLoadingMessage(loadingProgress)} ${loadingProgress}%`} />
        <div className="loading-progress-bar">
          <div 
            className="loading-progress-fill"
            style={{ width: `${loadingProgress}%` }}
          />
        </div>
        <div className="loading-tips">
          <p>💡 This may take a moment on first load</p>
          <p>🔑 Ensure you have a valid Google Maps API key</p>
          <button 
            className="skip-google-maps"
            onClick={() => {
              
              window.dispatchEvent(new CustomEvent('switchToSimpleMap'));
            }}
          >
            Use Alternative Map Instead
          </button>
        </div>
      </div>
    );
  }

  
  if (mapError) {
    return (
      <div className="map-error">
        <h3>Unable to load Google Maps 3D</h3>
        <p>{mapError}</p>
        <p>Please ensure you have:</p>
        <ul>
          <li>Valid Google Maps API key</li>
          <li>Maps JavaScript API enabled</li>
          <li>Internet connection</li>
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
    <div className="google-maps-3d-view">
      {}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        background: 'rgba(0,128,0,0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        🌍 GOOGLE MAPS LOADED 🌍
      </div>
      
      {}
      <div ref={mapRef} className="google-map-container" />

      {}
      <MapControls
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        showLegend={showLegend}
        onLegendToggle={() => setShowLegend(!showLegend)}
        routeMode={routeMode}
        onRoutePress={handleRoutePress}
        canRoute={selectedVenue !== null}
        mapStyle={mapType}
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
      <div className="google-3d-controls">
        <button
          className="control-btn tilt-btn"
          onClick={() => updateMapView({
            ...viewState,
            tilt: Math.min(viewState.tilt + 10, 67.5)
          })}
        >
          🏔️ Tilt Up
        </button>
        <button
          className="control-btn tilt-btn"
          onClick={() => updateMapView({
            ...viewState,
            tilt: Math.max(viewState.tilt - 10, 0)
          })}
        >
          🗺️ Tilt Down
        </button>
        <button
          className="control-btn rotate-btn"
          onClick={() => updateMapView({
            ...viewState,
            heading: viewState.heading - 15
          })}
        >
          ↶ Rotate Left
        </button>
        <button
          className="control-btn rotate-btn"
          onClick={() => updateMapView({
            ...viewState,
            heading: viewState.heading + 15
          })}
        >
          ↷ Rotate Right
        </button>
        <button
          className="control-btn zoom-btn"
          onClick={() => updateMapView({
            ...viewState,
            zoom: Math.min(viewState.zoom + 1, 21)
          })}
        >
          🔍 Zoom In
        </button>
        <button
          className="control-btn zoom-btn"
          onClick={() => updateMapView({
            ...viewState,
            zoom: Math.max(viewState.zoom - 1, 10)
          })}
        >
          🔍 Zoom Out
        </button>
      </div>

      {}
      <div className="google-maps-indicator">
        <span className="google-maps-badge">
          🌍 GOOGLE MAPS 3D • Real Buildings & Terrain • Tilt: {viewState.tilt}° • Heading: {Math.round(viewState.heading)}°
        </span>
        <div className="mode-subtitle">
          Click markers for venue details • Use controls for 3D perspective • Zoom in for building details
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

export default GoogleMaps3DView;
