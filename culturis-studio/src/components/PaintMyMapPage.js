import React, { useState, useCallback } from 'react';
import TasteSeedPicker from './TasteSeedPicker';
import Simple2DMapView from './Simple2DMapView';
import NavigationPanel from './NavigationPanel';
import ChatbotPanel from './ChatbotPanel';
import DemoGuide from './DemoGuide';
import './PaintMyMapPage.css';

/**
 * PaintMyMapPage - Clean 3-section layout with 2D map
 * Layout: Navigation (left) | Map (center, 70%) | Chatbot (right, 20%)
 */
const PaintMyMapPage = ({ onBack, userLocation, firstName }) => {
  const [selectedTastes, setSelectedTastes] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(userLocation || 'New York, NY');
  
  
  const getInitialCoordinates = (location) => {
    const locationMap = {
      'Los Angeles, CA': [34.0522, -118.2437],
      'San Francisco, CA': [37.7749, -122.4194],
      'Chicago, IL': [41.8781, -87.6298],
      'Miami, FL': [25.7617, -80.1918],
      'Seattle, WA': [47.6062, -122.3321],
      'Austin, TX': [30.2672, -97.7431],
      'Boston, MA': [42.3601, -71.0589],
      'New York, NY': [40.7589, -73.9851]
    };
    return locationMap[location] || [40.7589, -73.9851]; 
  };
  
  const [mapCenter, setMapCenter] = useState(getInitialCoordinates(userLocation || 'New York, NY'));
  const [additionalTastes, setAdditionalTastes] = useState([]); 
  const [showDemoGuide, setShowDemoGuide] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(null); 
  const [venues, setVenues] = useState([]); 

  const handleTasteSelection = (tastes) => {
    console.log('Tastes selected:', tastes);
    setSelectedTastes(tastes);
    setShowMap(true);
    
    setShowDemoGuide(true);
  };

  const handleBackToTastes = () => {
    setShowMap(false);
    setSelectedTastes([]);
    setAdditionalTastes([]);
  };

  const handleLocationChange = (location, coordinates) => {
    console.log('🌍 PaintMyMapPage - Location changed:', location, coordinates);
    setCurrentLocation(location);
    if (coordinates) {
      console.log('🌍 PaintMyMapPage - Setting mapCenter to:', coordinates);
      setMapCenter(coordinates);
    }
  };

  const handleChatbotTastes = (newTastes) => {
    console.log('Chatbot extracted tastes:', newTastes);
    setAdditionalTastes(prev => {
      
      const existingIds = new Set([...selectedTastes, ...prev].map(t => t.id));
      const uniqueNewTastes = newTastes.filter(taste => !existingIds.has(taste.id));
      return [...prev, ...uniqueNewTastes];
    });
  };

  const handleRouteUpdate = useCallback((route) => {
    console.log('🎯 PaintMyMapPage - Route updated:', route);
    setCurrentRoute(route);
  }, []);

  const handleVenuesUpdate = useCallback((newVenues) => {
    console.log('🏢 PaintMyMapPage - Venues updated:', newVenues.length, 'venues');
    setVenues(newVenues);
  }, []);

  
  const allTastes = [...selectedTastes, ...additionalTastes];

  if (showMap && selectedTastes.length >= 3) {
    return (
      <div className="paint-my-map-page map-layout">
        {}
        <div className="navigation-panel">
          <NavigationPanel
            onBackToTastes={handleBackToTastes}
            selectedTastes={selectedTastes}
            additionalTastes={additionalTastes}
            currentLocation={currentLocation}
            onLocationChange={handleLocationChange}
          />
        </div>

        {}
        <div className="map-section">
          <Simple2DMapView 
            selectedTastes={allTastes}
            userLocation={currentLocation}
            mapCenter={mapCenter} 
            currentRoute={currentRoute}
            onRouteUpdate={handleRouteUpdate}
            onVenuesUpdate={handleVenuesUpdate}
          />
        </div>

        {}
        <div className="chatbot-panel">
          <ChatbotPanel
            selectedTastes={selectedTastes}
            currentLocation={currentLocation}
            onTastesExtracted={handleChatbotTastes}
            currentRoute={currentRoute}
            venues={venues}
            onRouteUpdate={handleRouteUpdate}
          />
        </div>

        {}
        {showDemoGuide && (
          <DemoGuide onClose={() => setShowDemoGuide(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="paint-my-map-page taste-selection">
      <div className="taste-picker-header">
        <button 
          className="back-button"
          onClick={onBack}
          aria-label="Back to main menu"
        >
          ← Back
        </button>
        <h1>{firstName ? `${firstName}, choose your cultural tastes` : 'Choose Your Cultural Tastes'}</h1>
        <p>Select at least 3 preferences to paint your cultural map</p>
      </div>
      
      <TasteSeedPicker
        onSelectionComplete={handleTasteSelection}
        minSelections={3}
        userLocation={currentLocation}
      />
    </div>
  );
};

export default PaintMyMapPage;
