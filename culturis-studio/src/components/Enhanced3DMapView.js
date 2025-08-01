import React, { useState, useEffect, useCallback, useRef } from 'react';
import Map, { Source, Layer, Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Enhanced3DMapView.css';


const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZS11c2VyIiwiYSI6ImNsczl4aHNhcjBmYTIybHF4ZWU2Z2txMXkifQ.LyQ9V8xClPKFX5LQLyqm4A';

/**
 * Enhanced3DMapView - True 3D map using Mapbox GL JS
 * Features: 3D buildings, terrain, dramatic camera angles, smooth animations
 */
const Enhanced3DMapView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [-73.9851, 40.7589], 
  enable3D = true,
  onMarkerClick
}) => {
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    longitude: mapCenter[0],
    latitude: mapCenter[1],
    zoom: 15,
    pitch: enable3D ? 60 : 0, 
    bearing: enable3D ? -17.6 : 0, 
    padding: { top: 0, bottom: 0, left: 0, right: 0 }
  });
  
  const [mapStyle, setMapStyle] = useState('mapbox:
  const [showBuildings, setShowBuildings] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [venues, setVenues] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  
  const mapStyles = {
    streets: 'mapbox:
    satellite: 'mapbox:
    dark: 'mapbox:
    light: 'mapbox:
    outdoors: 'mapbox:
    navigation: 'mapbox:
  };

  
  const generateVenues = useCallback(() => {
    const [centerLng, centerLat] = mapCenter;
    const newVenues = [];
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * 2 * Math.PI;
      const distance = 0.005 + Math.random() * 0.015; 
      
      const lng = centerLng + Math.cos(angle) * distance;
      const lat = centerLat + Math.sin(angle) * distance;
      
      newVenues.push({
        id: i + 1,
        number: i + 1,
        coordinates: [lng, lat],
        name: getVenueName(i),
        type: getVenueType(selectedTastes, i),
        affinity: Math.random() * 100,
        rating: 3.5 + Math.random() * 1.5,
        color: getVenueColor(Math.random() * 100)
      });
    }
    
    setVenues(newVenues.sort((a, b) => b.affinity - a.affinity));
  }, [mapCenter, selectedTastes]);

  const getVenueName = (index) => {
    const names = [
      'Blue Note Jazz Club', 'Artisan Coffee House', 'Gallery Modern',
      'The Hidden Speakeasy', 'Rooftop Garden Bar', 'Local Market Bistro',
      'Vintage Records Store', 'Contemporary Art Space', 'Craft Brewery',
      'Independent Bookshop', 'Cultural Center', 'Live Music Venue',
      'Food Hall Collective', 'Designer Boutique', 'Wine & Tapas Bar',
      'Theater District Café', 'Museum Shop', 'Night Market',
      'Experimental Kitchen', 'Concept Store'
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

  const getVenueColor = (affinity) => {
    if (affinity > 75) return '#e74c3c'; 
    if (affinity > 50) return '#f39c12'; 
    if (affinity > 25) return '#3498db'; 
    return '#95a5a6'; 
  };

  
  useEffect(() => {
    generateVenues();
  }, [generateVenues]);

  
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: mapCenter[0],
      latitude: mapCenter[1]
    }));
  }, [mapCenter]);

  
  const buildingLayer = {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#667eea',
        '#aaa'
      ],
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, 0,
        15.05, ['get', 'height']
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15, 0,
        15.05, ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.8
    }
  };

  
  const terrainSource = {
    type: 'raster-dem',
    url: 'mapbox:
    tileSize: 512,
    maxzoom: 14
  };

  
  const skyLayer = {
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 0.0],
      'sky-atmosphere-sun-intensity': 15
    }
  };

  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    setIsLoaded(true);

    
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    
    if (!map.getLayer('sky')) {
      map.addLayer(skyLayer);
    }

    
    if (enable3D) {
      map.easeTo({
        pitch: 60,
        bearing: -17.6,
        duration: 2000,
        essential: true
      });
    }
  }, [enable3D]);

  const handleMarkerClick = useCallback((venue) => {
    setSelectedVenue(venue);
    if (onMarkerClick) {
      onMarkerClick(venue);
    }

    
    const map = mapRef.current?.getMap();
    if (map) {
      map.flyTo({
        center: venue.coordinates,
        zoom: 18,
        pitch: 60,
        bearing: 0,
        duration: 1500,
        essential: true
      });
    }
  }, [onMarkerClick]);

  const toggle3D = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const newPitch = viewState.pitch > 30 ? 0 : 60;
    const newBearing = viewState.pitch > 30 ? 0 : -17.6;

    map.easeTo({
      pitch: newPitch,
      bearing: newBearing,
      duration: 1000,
      essential: true
    });

    setViewState(prev => ({
      ...prev,
      pitch: newPitch,
      bearing: newBearing
    }));
  }, [viewState.pitch]);

  const cycleMapStyle = useCallback(() => {
    const styleKeys = Object.keys(mapStyles);
    const currentIndex = styleKeys.findIndex(key => mapStyles[key] === mapStyle);
    const nextIndex = (currentIndex + 1) % styleKeys.length;
    setMapStyle(mapStyles[styleKeys[nextIndex]]);
  }, [mapStyle, mapStyles]);

  return (
    <div className="enhanced-3d-map-container">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onLoad={handleMapLoad}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        projection="globe"
        fog={{
          'range': [1, 8],
          'color': '#667eea',
          'horizon-blend': 0.1
        }}
      >
        {}
        <Source id="mapbox-dem" type="raster-dem" url="mapbox:

        {}
        {showBuildings && isLoaded && (
          <Layer {...buildingLayer} />
        )}

        {}
        {venues.map((venue) => (
          <Marker
            key={venue.id}
            longitude={venue.coordinates[0]}
            latitude={venue.coordinates[1]}
            anchor="center"
            onClick={() => handleMarkerClick(venue)}
          >
            <div 
              className="enhanced-venue-marker"
              style={{ 
                backgroundColor: venue.color,
                transform: `scale(${1 + venue.affinity / 200})`
              }}
            >
              <span className="marker-number">{venue.number}</span>
              <div className="marker-pulse" style={{ borderColor: venue.color }}></div>
            </div>
          </Marker>
        ))}

        {}
        {selectedVenue && (
          <Popup
            longitude={selectedVenue.coordinates[0]}
            latitude={selectedVenue.coordinates[1]}
            anchor="bottom"
            onClose={() => setSelectedVenue(null)}
            className="enhanced-venue-popup"
          >
            <div className="popup-content">
              <h3>#{selectedVenue.number} {selectedVenue.name}</h3>
              <p className="venue-type">{selectedVenue.type}</p>
              <div className="venue-stats">
                <div className="stat">
                  <span className="stat-label">Cultural Match</span>
                  <span className="stat-value">{Math.round(selectedVenue.affinity)}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">{selectedVenue.rating.toFixed(1)}⭐</span>
                </div>
              </div>
              <button className="visit-btn">Visit Venue</button>
            </div>
          </Popup>
        )}
      </Map>

      {}
      <div className="map-controls-overlay">
        <div className="control-group">
          <button 
            className={`control-btn ${viewState.pitch > 30 ? 'active' : ''}`}
            onClick={toggle3D}
            title="Toggle 3D View"
          >
            🏗️ 3D
          </button>
          <button 
            className="control-btn"
            onClick={cycleMapStyle}
            title="Change Map Style"
          >
            🎨 Style
          </button>
          <button 
            className={`control-btn ${showBuildings ? 'active' : ''}`}
            onClick={() => setShowBuildings(!showBuildings)}
            title="Toggle Buildings"
          >
            🏢 Buildings
          </button>
        </div>
      </div>

      {}
      {viewState.pitch > 30 && (
        <div className="mode-indicator-3d">
          <span className="mode-badge-3d">3D View Active</span>
        </div>
      )}
    </div>
  );
};

export default Enhanced3DMapView;
