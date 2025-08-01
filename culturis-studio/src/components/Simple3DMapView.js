import React, { useState, useEffect, useCallback } from 'react';
import VenueDrawer from './VenueDrawer';
import MapControls from './MapControls';
import { useMapData } from '../hooks/useMapData';
import './Simple3DMapView.css';

/**
 * Simple3DMapView - 3D map using CSS transforms and grid layout
 * No external API dependencies, pure CSS 3D
 */
const Simple3DMapView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [-73.9851, 40.7589],
  enable3D = true 
}) => {
  
  const [viewState, setViewState] = useState({
    longitude: mapCenter[0],
    latitude: mapCenter[1],
    zoom: 12,
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
  const [venues, setVenues] = useState([]);

  
  useEffect(() => {
    const fixedVenues = [
      { id: 1, number: 1, name: 'Blue Note Jazz Club', type: 'Jazz Club', affinity: 85, rating: 4.2, position: { x: 20, y: 15 } },
      { id: 2, number: 2, name: 'Artisan Coffee House', type: 'Coffee House', affinity: 92, rating: 4.7, position: { x: 35, y: 25 } },
      { id: 3, number: 3, name: 'Gallery Modern', type: 'Art Gallery', affinity: 67, rating: 3.8, position: { x: 50, y: 30 } },
      { id: 4, number: 4, name: 'The Hidden Speakeasy', type: 'Cocktail Bar', affinity: 78, rating: 4.1, position: { x: 65, y: 20 } },
      { id: 5, number: 5, name: 'Rooftop Garden Bar', type: 'Rooftop Venue', affinity: 89, rating: 4.5, position: { x: 80, y: 35 } },
      { id: 6, number: 6, name: 'Local Market Bistro', type: 'Restaurant', affinity: 45, rating: 3.6, position: { x: 25, y: 45 } },
      { id: 7, number: 7, name: 'Vintage Records Store', type: 'Vintage Shop', affinity: 73, rating: 4.0, position: { x: 40, y: 55 } },
      { id: 8, number: 8, name: 'Contemporary Art Space', type: 'Art Space', affinity: 56, rating: 3.9, position: { x: 55, y: 60 } },
      { id: 9, number: 9, name: 'Craft Brewery', type: 'Brewery', affinity: 91, rating: 4.6, position: { x: 70, y: 50 } },
      { id: 10, number: 10, name: 'Independent Bookshop', type: 'Bookstore', affinity: 38, rating: 3.5, position: { x: 30, y: 70 } },
      { id: 11, number: 11, name: 'Cultural Center', type: 'Cultural Center', affinity: 82, rating: 4.3, position: { x: 45, y: 75 } },
      { id: 12, number: 12, name: 'Live Music Venue', type: 'Music Venue', affinity: 64, rating: 3.7, position: { x: 60, y: 80 } },
      { id: 13, number: 13, name: 'Food Hall Collective', type: 'Food Hall', affinity: 76, rating: 4.1, position: { x: 75, y: 70 } },
      { id: 14, number: 14, name: 'Designer Boutique', type: 'Boutique', affinity: 87, rating: 4.4, position: { x: 15, y: 60 } },
      { id: 15, number: 15, name: 'Wine & Tapas Bar', type: 'Wine Bar', affinity: 42, rating: 3.8, position: { x: 85, y: 55 } },
      { id: 16, number: 16, name: 'Theater District Café', type: 'Café', affinity: 69, rating: 4.0, position: { x: 10, y: 40 } },
      { id: 17, number: 17, name: 'Museum Shop', type: 'Museum', affinity: 94, rating: 4.8, position: { x: 90, y: 25 } },
      { id: 18, number: 18, name: 'Night Market', type: 'Market', affinity: 51, rating: 3.7, position: { x: 75, y: 15 } }
    ];
    
    setVenues(fixedVenues.sort((a, b) => b.affinity - a.affinity));
  }, []);

  
  const handleMarkerClick = useCallback((venue) => {
    console.log('Venue selected:', venue);
    setSelectedVenue(venue);
    setDrawerState('peek');
  }, []);

  
  const handleFilterToggle = useCallback(async (newFilters) => {
    setActiveFilters(newFilters);
    console.log('Filters updated:', newFilters);
  }, []);

  
  const handleRoutePress = useCallback(() => {
    setRouteMode(!routeMode);
  }, [routeMode]);

  
  const handleStyleChange = useCallback((newStyle) => {
    console.log('Style changed to:', newStyle);
  }, []);

  
  const { 
    heatData, 
    loading: heatLoading, 
    error: heatError,
    generateHeatData
  } = useMapData(selectedTastes);

  return (
    <div className="simple-3d-map-view">
      {}
      <div 
        className="map-3d-container"
        style={{
          transform: `perspective(1200px) rotateX(${viewState.pitch}deg) rotateY(${viewState.bearing}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        {}
        <div className="map-grid">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={`row-${i}`} className="grid-row">
              {Array.from({ length: 20 }, (_, j) => (
                <div 
                  key={`cell-${i}-${j}`} 
                  className="grid-cell"
                  style={{
                    backgroundColor: `hsl(${200 + (i + j) * 2}, 50%, ${85 + Math.sin(i * j * 0.1) * 10}%)`,
                    height: `${20 + Math.sin(i * 0.5) * Math.cos(j * 0.3) * 15}px`
                  }}
                />
              ))}
            </div>
          ))}
        </div>

        {}
        <div className="buildings-layer">
          {venues.slice(0, 12).map((venue, index) => (
            <div
              key={`building-${venue.id}`}
              className="building-3d"
              style={{
                left: `${venue.position.x}%`,
                top: `${venue.position.y}%`,
                height: `${30 + venue.affinity * 2}px`,
                backgroundColor: venue.affinity > 70 ? '#e74c3c' : venue.affinity > 40 ? '#f39c12' : '#3498db',
                transform: `translateZ(${venue.affinity}px)`
              }}
            />
          ))}
        </div>

        {}
        <div className="markers-layer">
          {venues.map((venue) => {
            const color = venue.affinity > 70 ? '#e74c3c' : venue.affinity > 40 ? '#f39c12' : '#3498db';
            const size = venue.affinity > 70 ? 40 : venue.affinity > 40 ? 35 : 30;
            
            return (
              <div
                key={venue.id}
                className="simple-3d-marker"
                style={{
                  left: `${venue.position.x}%`,
                  top: `${venue.position.y}%`,
                  background: `linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%)`,
                  width: size,
                  height: size,
                  transform: `translateZ(${venue.affinity + 50}px)`,
                  fontSize: size > 35 ? '16px' : '14px'
                }}
                onClick={() => handleMarkerClick(venue)}
              >
                {venue.number}
              </div>
            );
          })}
        </div>
      </div>

      {}
      <MapControls
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        showLegend={showLegend}
        onLegendToggle={() => setShowLegend(!showLegend)}
        routeMode={routeMode}
        onRoutePress={handleRoutePress}
        canRoute={selectedVenue !== null}
        mapStyle="simple3d"
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
            pitch: Math.min(prev.pitch + 10, 80) 
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
          🏗️ PURE CSS 3D • No APIs Required • Pitch: {viewState.pitch}° • Bearing: {Math.round(viewState.bearing)}°
        </span>
        <div className="mode-subtitle">
          Click markers for venue details • Use controls to adjust 3D perspective
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

      {}
      {selectedVenue && (
        <div className="simple-popup" style={{
          position: 'absolute',
          left: `${selectedVenue.position.x}%`,
          top: `${selectedVenue.position.y - 10}%`,
          transform: 'translateZ(200px)',
          zIndex: 2000
        }}>
          <div className="venue-popup-content">
            <button 
              className="popup-close"
              onClick={() => setSelectedVenue(null)}
            >
              ✕
            </button>
            <h3>#{selectedVenue.number} {selectedVenue.name}</h3>
            <p><strong>Type:</strong> {selectedVenue.type}</p>
            <p><strong>Cultural Match:</strong> {Math.round(selectedVenue.affinity)}%</p>
            <p><strong>Rating:</strong> {selectedVenue.rating.toFixed(1)}⭐</p>
            <button 
              className="view-details-btn"
              onClick={() => {
                console.log('View details for:', selectedVenue);
                setDrawerState('expanded');
              }}
            >
              View Details
            </button>
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

export default Simple3DMapView;
