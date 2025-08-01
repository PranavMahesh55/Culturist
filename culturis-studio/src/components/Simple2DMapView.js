import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import VenueDrawer from './VenueDrawer';
import RoutePlanner from './RoutePlanner';
import RouteOverlay from './RouteOverlay';
import './Simple2DMapView.css';
import 'leaflet/dist/leaflet.css';


delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png'
});

/**
 * MapInteractionController - Ensures map interactions remain enabled
 */
const MapInteractionController = ({ currentRoute }) => {
  const map = useMap();

  useEffect(() => {
    
    if (map) {
      const enableDragging = () => {
        
        if (map.dragging) {
          map.dragging.enable();
          console.log('🖱️ Map dragging enabled');
        }
        
        
        if (map.touchZoom) map.touchZoom.enable();
        if (map.doubleClickZoom) map.doubleClickZoom.enable();
        if (map.boxZoom) map.boxZoom.enable();
        if (map.keyboard) map.keyboard.enable();
        
        console.log('🗺️ All map interactions enabled');
      };

      
      enableDragging();
      
      
      setTimeout(enableDragging, 100);
      setTimeout(enableDragging, 500);
      setTimeout(enableDragging, 1000);

      
      const dragInterval = setInterval(() => {
        if (map.dragging && !map.dragging.enabled()) {
          console.log('🔄 Re-enabling map dragging...');
          map.dragging.enable();
        }
      }, 2000);

      
      return () => {
        clearInterval(dragInterval);
      };
    }
  }, [map, currentRoute]);

  return null;
};

/**
 * Simple2DMapView - Real 2D map with culturally-matched venue markers
 * Uses OpenStreetMap via Leaflet (lightweight, no API key required)
 */
const Simple2DMapView = ({ 
  selectedTastes = [], 
  userLocation = 'New York, NY',
  mapCenter = [40.7589, -73.9851], 
  currentRoute = null,
  onRouteUpdate = () => {},
  onVenuesUpdate = () => {}
}) => {
  console.log('🗺️ Simple2DMapView rendering with props:', { selectedTastes, userLocation, mapCenter });
  console.log('🌍 LOCATION DEBUG - userLocation:', userLocation, 'mapCenter:', mapCenter);
  
  const mapRef = useRef(null);
  const isFetchingRef = useRef(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [drawerState, setDrawerState] = useState('hidden');
  const [venues, setVenues] = useState([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [showRoutePlanner, setShowRoutePlanner] = useState(false);

  
  const memoizedTastes = useMemo(() => 
    JSON.stringify(selectedTastes?.map(t => ({ name: t.name, urn: t.urn })) || []), 
    [selectedTastes]
  );

  
  const createVenueIcon = (venue) => {
    const color = venue.affinity > 70 ? '#e74c3c' : venue.affinity > 40 ? '#f39c12' : '#3498db';
    const size = venue.affinity > 70 ? 35 : 30;
    
    
    const getVenueEmoji = (type) => {
      const typeMap = {
        'Restaurant': '🍽️',
        'Deli': '🥪',
        'Cafe': '☕',
        'Bar': '🍸',
        'Art Museum': '🎨',
        'Modern Art Museum': '🖼️',
        'Museum': '🏛️',
        'Market': '🛒',
        'Shopping Mall': '🏬',
        'Event Venue': '🎪',
        'Arena': '🏟️',
        'Stadium': '⚽',
        'Tourist Attraction': '📍',
        'Historical Landmark': '🏛️',
        'Park': '🌳',
        'Garden': '🌸',
        'Cultural Venue': '🎭', 
      };
      return typeMap[type] || '📍';
    };
    
    const emoji = getVenueEmoji(venue.type);
    
    return L.divIcon({
      className: 'custom-venue-marker',
      html: `
        <div style="
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: all;
          cursor: pointer;
        ">
          <div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 10px;
            color: white;
            position: relative;
            pointer-events: all;
          ">
            <span style="
              position: absolute;
              top: -8px;
              right: -8px;
              background: white;
              border-radius: 50%;
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              pointer-events: none;
            ">${emoji}</span>
          </div>
        </div>
      `,
      iconSize: [50, 50], 
      iconAnchor: [25, 25], 
      popupAnchor: [0, -25] 
    });
  };

  
  useEffect(() => {
    console.log('🔄 useEffect triggered with:', { 
      selectedTastes: selectedTastes?.length, 
      userLocation,
      isFetching: isFetchingRef.current
    });
    
    
    if (!selectedTastes || selectedTastes.length === 0) {
      console.log('⏳ No tastes selected yet, skipping API call');
      setVenues([]);
      setIsLoadingVenues(false);
      return;
    }

    
    if (isFetchingRef.current) {
      console.log('⏳ Already fetching venues, skipping duplicate call');
      return;
    }

    
    console.log('🌐 Starting venue fetch...');
    setIsLoadingVenues(true);
    isFetchingRef.current = true;

    const fetchVenuesFromBackend = async () => {
      console.log('🎯 Fetching real venues for tastes:', selectedTastes.map(t => t.name));
      
      try {
        console.log('🌐 Making API call to fetch venues...');
        console.log('🌍 LOCATION CHECK - Sending to API:', {location: userLocation, coordinates: mapCenter});
        console.log('Request data:', { tastes: selectedTastes, location: userLocation, coordinates: mapCenter });
        
        const response = await fetch('http://localhost:8000/api/venues', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tastes: selectedTastes,
            location: userLocation,
            coordinates: mapCenter
          }),
          signal: AbortSignal.timeout(10000) 
        });

        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ HTTP Error Response:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('📦 Raw API response:', data);
        
        if (data.success && data.venues && data.venues.length > 0) {
          console.log('✅ Using REAL venues from Qloo API:', data.venues.map(v => v.name));
          setVenues(data.venues);
          onVenuesUpdate(data.venues); 
          console.log('✅ Received', data.venues.length, 'real venues from Qloo API');
          console.log('🏢 REAL VENUE NAMES LOADED:', data.venues.slice(0, 5).map(v => `${v.number}. ${v.name} (${v.type})`));
          console.log('🎯 SUCCESS: About to set isLoadingVenues to false');
        } else {
          console.warn('⚠️ API response invalid or empty:', data);
          console.warn('⚠️ Will use fallback venues instead');
          throw new Error('Invalid response format or no venues returned');
        }
        
      } catch (error) {
        console.error('❌ Failed to fetch venues from backend:', error);
        
        
        console.error('❌ DETAILED ERROR:', error.message);
        console.error('❌ STACK TRACE:', error.stack);
        
        
        console.log('🔄 Falling back to algorithmic venue generation...');
        console.log('💡 Backend failed, will generate generic venue names - THIS IS WHY YOU SEE "Cultural Hub"');
        generateFallbackVenues();
      } finally {
        console.log('🔄 FINALLY: Setting isLoadingVenues to false and resetting fetch flag');
        setIsLoadingVenues(false);
        isFetchingRef.current = false;
      }
    };

    const generateFallbackVenues = () => {
      console.log('🎯 Generating venues for tastes:', selectedTastes.map(t => t.name));
      
      
      const venueTypes = {
        
        'art': ['Art Gallery', 'Museum', 'Art Studio', 'Creative Space'],
        'music': ['Live Music Venue', 'Record Store', 'Concert Hall', 'Jazz Club'],
        'theater': ['Theater', 'Performance Space', 'Comedy Club', 'Improv Studio'],
        'photography': ['Photo Gallery', 'Camera Store', 'Art Studio', 'Exhibition Space'],
        'design': ['Design Studio', 'Architecture Firm', 'Creative Co-working', 'Maker Space'],
        
        
        'coffee': ['Coffee Shop', 'Specialty Cafe', 'Roastery', 'Third Wave Coffee'],
        'wine': ['Wine Bar', 'Tasting Room', 'Wine Shop', 'Vineyard'],
        'craft beer': ['Craft Brewery', 'Beer Garden', 'Taproom', 'Beer Store'],
        'cocktails': ['Cocktail Bar', 'Speakeasy', 'Mixology Lounge', 'Rooftop Bar'],
        'fine dining': ['Fine Restaurant', 'Michelin Star', 'Chef\'s Table', 'Tasting Menu'],
        'street food': ['Food Truck', 'Market Stall', 'Food Hall', 'Street Vendor'],
        
        
        'fashion': ['Boutique', 'Designer Store', 'Vintage Shop', 'Fashion Studio'],
        'books': ['Bookstore', 'Literary Cafe', 'Book Club', 'Reading Room'],
        'vintage': ['Vintage Store', 'Antique Shop', 'Thrift Store', 'Consignment'],
        'wellness': ['Yoga Studio', 'Meditation Center', 'Spa', 'Wellness Center'],
        
        
        'nightlife': ['Nightclub', 'Dance Club', 'Rooftop Lounge', 'Late Night Bar'],
        'social': ['Community Center', 'Co-working Space', 'Social Club', 'Meetup Space'],
        'sports': ['Sports Bar', 'Recreation Center', 'Fitness Studio', 'Athletic Club'],
        
        
        'history': ['Historical Site', 'Museum', 'Cultural Center', 'Heritage Site'],
        'science': ['Science Museum', 'Observatory', 'Tech Hub', 'Innovation Center'],
        'nature': ['Botanical Garden', 'Park', 'Nature Center', 'Outdoor Space']
      };

      
      const relevantVenueTypes = new Set();
      selectedTastes.forEach(taste => {
        const tasteName = taste.name.toLowerCase();
        
        
        Object.keys(venueTypes).forEach(category => {
          if (tasteName.includes(category) || category.includes(tasteName.split(' ')[0])) {
            venueTypes[category].forEach(type => relevantVenueTypes.add(type));
          }
        });
        
        
        if (tasteName.includes('museum')) relevantVenueTypes.add('Museum');
        if (tasteName.includes('gallery')) relevantVenueTypes.add('Art Gallery');
        if (tasteName.includes('restaurant')) relevantVenueTypes.add('Restaurant');
        if (tasteName.includes('bar')) relevantVenueTypes.add('Bar');
        if (tasteName.includes('cafe')) relevantVenueTypes.add('Cafe');
        if (tasteName.includes('market')) relevantVenueTypes.add('Market');
        if (tasteName.includes('park')) relevantVenueTypes.add('Park');
      });

      
      if (relevantVenueTypes.size === 0) {
        ['Art Gallery', 'Coffee Shop', 'Restaurant', 'Park', 'Museum', 'Bar'].forEach(type => 
          relevantVenueTypes.add(type)
        );
      }

      const venueTypeArray = Array.from(relevantVenueTypes);
      
      
      const generatedVenues = [];
      const [baseLat, baseLng] = mapCenter;
      
      for (let i = 0; i < Math.min(15, venueTypeArray.length * 3); i++) {
        
        const radiusKm = 1.5 + Math.random() * 1.5; 
        const angle = Math.random() * 2 * Math.PI;
        
        const lat = baseLat + (radiusKm / 111) * Math.cos(angle); 
        const lng = baseLng + (radiusKm / (111 * Math.cos(baseLat * Math.PI / 180))) * Math.sin(angle);
        
        const venueType = venueTypeArray[i % venueTypeArray.length];
        
        
        const affinity = 60 + Math.random() * 35; 
        
        
        const venueNames = {
          'Art Gallery': ['Modern Canvas', 'Gallery District', 'Artisan Space', 'Creative Collective'],
          'Coffee Shop': ['Roasted Beans', 'Morning Ritual', 'The Daily Grind', 'Cafe Culture'],
          'Restaurant': ['Local Table', 'Harvest Kitchen', 'Seasonal Plates', 'Neighborhood Bistro'],
          'Museum': ['Cultural Heritage', 'Local History', 'Arts & Sciences', 'Discovery Center'],
          'Bar': ['Craft & Co', 'The Local Tap', 'Sunset Lounge', 'Social House'],
          'Live Music Venue': ['Sound Stage', 'The Music Hall', 'Rhythm & Blues', 'Concert Corner'],
          'Bookstore': ['Chapter & Verse', 'Literary Corner', 'Book Haven', 'Reading Room'],
          'Park': ['Central Gardens', 'Community Green', 'Riverside Park', 'Urban Oasis']
        };
        
        const nameOptions = venueNames[venueType] || ['Local Spot', 'Cultural Hub', 'Community Space'];
        const venueName = nameOptions[Math.floor(Math.random() * nameOptions.length)];
        
        console.log(`🏢 FALLBACK venue ${i+1}: "${venueName}" (${venueType}) - THIS IS GENERIC!`);
        
        generatedVenues.push({
          id: i + 1,
          number: i + 1,
          name: venueName,
          type: venueType,
          affinity: Math.round(affinity),
          rating: 3.5 + Math.random() * 1.3, 
          coordinates: [lat, lng],
          address: `${userLocation} Area`,
          culturalMatch: selectedTastes.slice(0, 2).map(t => t.name).join(', ')
        });
      }
      
      
      const sortedVenues = generatedVenues.sort((a, b) => b.affinity - a.affinity);
      setVenues(sortedVenues);
      onVenuesUpdate(sortedVenues); 
      console.log('✅ Generated', sortedVenues.length, 'fallback venues for', userLocation);
    };

    
    fetchVenuesFromBackend();
  }, [memoizedTastes, userLocation]); 

  
  const handleVenueClick = (venue) => {
    setSelectedVenue(venue);
    setDrawerState('expanded');
  };

  
  const handleDrawerClose = () => {
    setDrawerState('hidden');
    setSelectedVenue(null);
  };

  return (
    <div className="simple-2d-map-view">
      {}
      <div className="map-container">
        {isLoadingVenues ? (
          <div className="loading-overlay">
            <div className="loading-spinner">�</div>
            <p>Curating cultural experiences for {userLocation}...</p>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
            key={`map-${currentRoute ? 'with-route' : 'no-route'}`}
            zoomControl={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
            touchZoom={true}
            dragging={true}
            zoomAnimation={true}
            attributionControl={true}
            boxZoom={true}
            keyboard={true}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {}
            <MapInteractionController currentRoute={currentRoute} />
            
            {}
            {venues.map((venue) => (
              <Marker
                key={venue.id}
                position={venue.coordinates}
                icon={createVenueIcon(venue)}
                eventHandlers={{
                  click: () => handleVenueClick(venue)
                }}
              >
                {}
                <Tooltip 
                  direction="top" 
                  offset={[0, -10]}
                  opacity={0.9}
                  className="venue-hover-tooltip"
                >
                  <div className="tooltip-content">
                    <div className="tooltip-header">
                      <strong>{venue.name}</strong>
                      <span className="tooltip-type">{venue.type}</span>
                    </div>
                    <div className="tooltip-stats">
                      <span className="tooltip-match">{venue.affinity}% match</span>
                      <span className="tooltip-rating">⭐ {venue.rating.toFixed(1)}</span>
                    </div>
                    {venue.qloo_data && venue.qloo_data.keywords && venue.qloo_data.keywords.length > 0 && (
                      <div className="tooltip-keywords">
                        Known for: {venue.qloo_data.keywords.slice(0, 2).join(', ')}
                      </div>
                    )}
                    <div className="tooltip-hint">Click for details</div>
                  </div>
                </Tooltip>

                {}
                <Popup maxWidth={300} className="enhanced-venue-popup">
                  <div className="venue-popup-enhanced">
                    <div className="popup-header">
                      <h4>{venue.name}</h4>
                      <span className="venue-type-badge">{venue.type}</span>
                    </div>
                    
                    <div className="popup-stats">
                      <div className="stat-item">
                        <span className="stat-label">Match:</span>
                        <span className={`stat-value match-${venue.affinity > 80 ? 'high' : venue.affinity > 60 ? 'medium' : 'low'}`}>
                          {venue.affinity}%
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Rating:</span>
                        <span className="stat-value rating">
                          {venue.rating.toFixed(1)} ⭐
                        </span>
                      </div>
                      {venue.qloo_data && venue.qloo_data.popularity && (
                        <div className="stat-item">
                          <span className="stat-label">Popularity:</span>
                          <span className="stat-value">
                            {(venue.qloo_data.popularity * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {venue.culturalMatch && (
                      <div className="cultural-match-section">
                        <span className="cultural-match-label">Cultural Match:</span>
                        <span className="cultural-match-value">{venue.culturalMatch}</span>
                      </div>
                    )}

                    {venue.qloo_data && venue.qloo_data.keywords && venue.qloo_data.keywords.length > 0 && (
                      <div className="keywords-section">
                        <span className="keywords-label">Known for:</span>
                        <div className="keywords-list">
                          {venue.qloo_data.keywords.slice(0, 4).map((keyword, index) => (
                            <span key={index} className="keyword-chip">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentRoute && currentRoute.venues.find(rv => rv.id === venue.id) && (
                      <div className="route-info">
                        <div className="route-position">
                          📍 Stop #{currentRoute.venues.find(rv => rv.id === venue.id).order} on your route
                        </div>
                        {currentRoute.venues.find(rv => rv.id === venue.id).arrivalTime && (
                          <div className="arrival-time">
                            🕐 Arrival: {currentRoute.venues.find(rv => rv.id === venue.id).arrivalTime}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

            {}
            {currentRoute && currentRoute.venues && (
              <RouteOverlay 
                venues={currentRoute.venues.map(v => ({
                  ...v,
                  coords: v.coordinates
                }))}
                onRouteCalculated={(routeData) => {
                  console.log('Route calculated:', routeData);
                }}
              />
            )}
          </MapContainer>
        )}
      </div>

      {}
      <div className="map-indicator">
        <span className="map-badge">
          🗺️ INTERACTIVE MAP • {isLoadingVenues ? '🔍' : venues.length} Cultural Venues
        </span>
        <div className="mode-subtitle">
          {isLoadingVenues ? 
            `Searching ${userLocation} for your tastes...` : 
            `Matched to your cultural preferences in ${userLocation}`
          }
        </div>
        {!isLoadingVenues && venues.length > 0 && (
          <button 
            className="plan-route-btn"
            onClick={() => setShowRoutePlanner(true)}
          >
            🗺️ Plan Route
          </button>
        )}
        {currentRoute && (
          <div className="active-route-indicator">
            <span className="route-badge">
              🎯 Active Route: {currentRoute.venues.length} venues • {Math.round(currentRoute.totalDuration / 60)}h {currentRoute.totalDuration % 60}m
            </span>
          </div>
        )}
      </div>

      {}
      <div className="venue-legend">
        <h4>Cultural Match</h4>
        <div className="legend-scale">
          <div className="scale-item high">
            <span className="color-box" style={{ backgroundColor: '#e74c3c' }}></span>
            <span>High Match (70%+)</span>
          </div>
          <div className="scale-item medium">
            <span className="color-box" style={{ backgroundColor: '#f39c12' }}></span>
            <span>Medium Match (40-69%)</span>
          </div>
          <div className="scale-item low">
            <span className="color-box" style={{ backgroundColor: '#3498db' }}></span>
            <span>Low Match (&lt;40%)</span>
          </div>
        </div>
      </div>

      {}
      <VenueDrawer
        venue={selectedVenue}
        isOpen={drawerState === 'expanded'}
        onClose={handleDrawerClose}
        onGetDirections={(venue) => {
          console.log('Getting directions to:', venue.name);
        }}
      />

      {}
      {showRoutePlanner && (
        <RoutePlanner
          venues={venues}
          userLocation={userLocation}
          onClose={() => setShowRoutePlanner(false)}
          onUpdateRoute={(route) => {
            console.log('Route updated:', route);
            onRouteUpdate(route); 
          }}
        />
      )}
    </div>
  );
};

export default Simple2DMapView;
