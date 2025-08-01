import React, { useState, useEffect } from 'react';
import './InstantMapView.css';

/**
 * InstantMapView - Ultra-fast loading map view with CSS-only graphics
 * Shows immediately while other maps are loading
 */
const InstantMapView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [-73.9851, 40.7589], 
  onVenueSelect
}) => {
  console.log('🚀 InstantMapView rendering with props:', { selectedTastes, userLocation, mapCenter });
  
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [countdown, setCountdown] = useState(1);

  
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90; 
        }
        return prev + 15; 
      });
    }, 150);

    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  
  useEffect(() => {
    const nycVenues = [
      { id: 1, number: 1, name: 'Blue Note Jazz Club', type: 'Jazz Club', affinity: 85, rating: 4.2, 
        coordinates: [-73.9881, 40.7614], address: 'Greenwich Village', x: 45, y: 35 },
      { id: 2, number: 2, name: 'MoMA', type: 'Art Museum', affinity: 92, rating: 4.7, 
        coordinates: [-73.9776, 40.7614], address: 'Midtown Manhattan', x: 52, y: 35 },
      { id: 3, number: 3, name: 'High Line', type: 'Park', affinity: 67, rating: 3.8, 
        coordinates: [-74.0048, 40.7480], address: 'Chelsea', x: 35, y: 45 },
      { id: 4, number: 4, name: 'Brooklyn Bridge', type: 'Landmark', affinity: 78, rating: 4.1, 
        coordinates: [-73.9969, 40.7061], address: 'Downtown Brooklyn', x: 58, y: 65 },
      { id: 5, number: 5, name: 'Central Park', type: 'Park', affinity: 89, rating: 4.5, 
        coordinates: [-73.9654, 40.7829], address: 'Upper Manhattan', x: 65, y: 15 },
      { id: 6, number: 6, name: 'Chelsea Market', type: 'Food Hall', affinity: 45, rating: 3.6, 
        coordinates: [-74.0063, 40.7420], address: 'Chelsea', x: 32, y: 48 },
      { id: 7, number: 7, name: 'Times Square', type: 'Entertainment', affinity: 73, rating: 4.0, 
        coordinates: [-73.9857, 40.7580], address: 'Midtown', x: 50, y: 40 },
      { id: 8, number: 8, name: 'Brooklyn Museum', type: 'Art Museum', affinity: 56, rating: 3.9, 
        coordinates: [-73.9636, 40.6712], address: 'Brooklyn', x: 75, y: 75 },
      { id: 9, number: 9, name: 'One World Trade', type: 'Landmark', affinity: 91, rating: 4.6, 
        coordinates: [-74.0134, 40.7127], address: 'Financial District', x: 48, y: 60 },
      { id: 10, number: 10, name: 'Williamsburg', type: 'Neighborhood', affinity: 38, rating: 3.5, 
        coordinates: [-73.9442, 40.7081], address: 'Brooklyn', x: 85, y: 55 }
    ];
    
    setVenues(nycVenues.sort((a, b) => b.affinity - a.affinity));
  }, []);

  const handleVenueClick = (venue) => {
    setSelectedVenue(venue);
    if (onVenueSelect) onVenueSelect(venue);
  };

  return (
    <div className="instant-map-container">
      {}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(255,0,0,0.8)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        ⚡ INSTANT MAP LOADED ⚡
      </div>
      
      {}
      <div className="instant-map-bg">
        <div className="map-grid"></div>
        <div className="map-streets">
          <div className="street horizontal" style={{ top: '20%' }}></div>
          <div className="street horizontal" style={{ top: '40%' }}></div>
          <div className="street horizontal" style={{ top: '60%' }}></div>
          <div className="street horizontal" style={{ top: '80%' }}></div>
          <div className="street vertical" style={{ left: '20%' }}></div>
          <div className="street vertical" style={{ left: '40%' }}></div>
          <div className="street vertical" style={{ left: '60%' }}></div>
          <div className="street vertical" style={{ left: '80%' }}></div>
        </div>
        
        {}
        <div className="park central-park"></div>
        
        {}
        <div className="water hudson-river"></div>
        <div className="water east-river"></div>
      </div>

      {}
      <div className="venues-overlay">
        {venues.map((venue) => {
          const isSelected = selectedVenue?.id === venue.id;
          const color = venue.affinity > 70 ? 'high' : venue.affinity > 40 ? 'medium' : 'low';
          
          return (
            <div
              key={venue.id}
              className={`venue-marker ${color} ${isSelected ? 'selected' : ''}`}
              style={{
                left: `${venue.x}%`,
                top: `${venue.y}%`
              }}
              onClick={() => handleVenueClick(venue)}
              title={venue.name}
            >
              <span className="venue-number">{venue.number}</span>
              
              {isSelected && (
                <div className="venue-popup">
                  <h4>{venue.name}</h4>
                  <p>{venue.type} • {venue.address}</p>
                  <div className="venue-stats">
                    <span>Match: {venue.affinity}%</span>
                    <span>Rating: {venue.rating}⭐</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {}
      <div className="instant-map-status">
        <div className="status-badge">
          ⚡ Instant Preview • Loading Google 3D in {countdown.toFixed(1)}s
          <div className="loading-progress">
            <div 
              className="progress-bar" 
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <span className="progress-text">{loadingProgress}%</span>
        </div>
      </div>
    </div>
  );
};

export default InstantMapView;
