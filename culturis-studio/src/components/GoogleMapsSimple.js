import React, { useEffect, useRef, useState, useCallback } from 'react';
import VenueDrawer from './VenueDrawer';
import MapControls from './MapControls';
import { useMapData } from '../hooks/useMapData';
import './GoogleMapsSimple.css';

/**
 * GoogleMapsSimple - Lightweight Google Maps without 3D for faster loading
 */
const GoogleMapsSimple = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [-73.9851, 40.7589], 
  enable3D = false 
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [drawerState, setDrawerState] = useState('hidden');
  const [venues, setVenues] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  
  useEffect(() => {
    const simpleVenues = [
      { id: 1, number: 1, name: 'Blue Note Jazz Club', type: 'Jazz Club', affinity: 85, rating: 4.2, 
        coordinates: [-73.9881, 40.7614] },
      { id: 2, number: 2, name: 'MoMA', type: 'Art Museum', affinity: 92, rating: 4.7, 
        coordinates: [-73.9776, 40.7614] },
      { id: 3, number: 3, name: 'Central Park', type: 'Park', affinity: 89, rating: 4.5, 
        coordinates: [-73.9654, 40.7829] },
      { id: 4, number: 4, name: 'Times Square', type: 'Entertainment', affinity: 73, rating: 4.0, 
        coordinates: [-73.9857, 40.7580] },
      { id: 5, number: 5, name: 'Brooklyn Bridge', type: 'Landmark', affinity: 78, rating: 4.1, 
        coordinates: [-73.9969, 40.7061] }
    ];
    setVenues(simpleVenues);
  }, []);

  
  useEffect(() => {
    const initMap = () => {
      if (window.google && window.google.maps) {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 40.7589, lng: -73.9851 },
          zoom: 14,
          mapTypeId: 'roadmap',
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative'
        });

        googleMapRef.current = map;
        
        
        venues.forEach((venue) => {
          const marker = new window.google.maps.Marker({
            position: { lat: venue.coordinates[1], lng: venue.coordinates[0] },
            map: map,
            title: venue.name,
            label: venue.number.toString()
          });
          markersRef.current.push(marker);
        });

        setMapLoaded(true);
      }
    };

    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https:
      script.async = true;
      script.defer = true;
      window.initMap = initMap;
      document.head.appendChild(script);
      
      script.onerror = () => {
        setMapError('Failed to load Google Maps');
      };
    } else {
      initMap();
    }
  }, [venues]);

  if (mapError) {
    return (
      <div className="simple-map-error">
        <h3>Map loading failed</h3>
        <p>Please check your internet connection</p>
      </div>
    );
  }

  return (
    <div className="google-maps-simple-view">
      <div ref={mapRef} className="simple-map-container" />
      {!mapLoaded && (
        <div className="simple-loading">
          <div className="simple-spinner"></div>
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsSimple;
