import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * NumberedMarkers - Simple numbered markers instead of complex hexagons
 * Shows cultural hotspots with numbered markers for clarity
 */
const NumberedMarkers = ({ 
  mapCenter, 
  selectedTastes = [], 
  onMarkerClick 
}) => {
  
  const generateVenues = () => {
    const venues = [];
    const [centerLat, centerLng] = mapCenter;
    
    
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * 2 * Math.PI;
      const distance = 0.01 + Math.random() * 0.02; 
      
      const lat = centerLat + Math.cos(angle) * distance;
      const lng = centerLng + Math.sin(angle) * distance;
      
      venues.push({
        id: i + 1,
        number: i + 1,
        coordinates: [lat, lng],
        name: getVenueName(i),
        type: getVenueType(selectedTastes, i),
        affinity: Math.random() * 100,
        rating: 3.5 + Math.random() * 1.5
      });
    }
    
    return venues.sort((a, b) => b.affinity - a.affinity);
  };

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

  
  const createNumberedIcon = (number, affinity) => {
    const color = affinity > 70 ? '#e74c3c' : affinity > 40 ? '#f39c12' : '#3498db';
    const size = affinity > 70 ? 40 : affinity > 40 ? 35 : 30;
    const shadowIntensity = affinity > 70 ? 0.4 : affinity > 40 ? 0.3 : 0.2;
    
    return L.divIcon({
      html: `
        <div class="marker-3d-container" style="
          width: ${size}px;
          height: ${size}px;
          perspective: 200px;
          transform-style: preserve-3d;
        ">
          <div class="marker-3d-face" style="
            background: linear-gradient(135deg, ${color} 0%, ${adjustBrightness(color, -20)} 100%);
            color: white;
            border-radius: 50%;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${size > 35 ? '16px' : size > 30 ? '14px' : '12px'};
            border: 3px solid rgba(255, 255, 255, 0.9);
            box-shadow: 
              0 8px 25px rgba(0,0,0,${shadowIntensity}),
              0 4px 12px rgba(0,0,0,0.2),
              inset 0 2px 4px rgba(255,255,255,0.3),
              inset 0 -2px 4px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            transform: translateZ(10px) rotateX(10deg);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: 2px;
              left: 2px;
              right: 2px;
              height: 40%;
              background: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%);
              border-radius: 50% 50% 0 0;
              pointer-events: none;
            "></div>
            <span style="position: relative; z-index: 2;">${number}</span>
          </div>
        </div>
      `,
      className: 'numbered-marker-3d',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
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

  const venues = generateVenues();

  return (
    <>
      {venues.map((venue) => (
        <Marker
          key={venue.id}
          position={venue.coordinates}
          icon={createNumberedIcon(venue.number, venue.affinity)}
          eventHandlers={{
            click: () => {
              if (onMarkerClick) {
                onMarkerClick(venue);
              }
            }
          }}
        >
          <Popup>
            <div className="venue-popup">
              <h3>#{venue.number} {venue.name}</h3>
              <p><strong>Type:</strong> {venue.type}</p>
              <p><strong>Cultural Match:</strong> {Math.round(venue.affinity)}%</p>
              <p><strong>Rating:</strong> {venue.rating.toFixed(1)}⭐</p>
              <button 
                className="view-details-btn"
                onClick={() => console.log('View details for:', venue)}
              >
                View Details
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
};

export default NumberedMarkers;
