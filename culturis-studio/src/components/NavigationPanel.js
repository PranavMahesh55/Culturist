import React, { useState, useCallback } from 'react';
import { FiMapPin, FiSearch, FiRefreshCw, FiTarget } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import './NavigationPanel.css';

/**
 * NavigationPanel - Left sidebar for navigation and location selection
 * Handles location input and displays taste selections
 */
const NavigationPanel = ({
  onBackToTastes,
  selectedTastes = [],
  additionalTastes = [],
  currentLocation,
  onLocationChange
}) => {
  const [locationInput, setLocationInput] = useState(currentLocation);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  
  const popularCities = [
    'New York, NY',
    'Los Angeles, CA', 
    'San Francisco, CA',
    'Chicago, IL',
    'Miami, FL',
    'Seattle, WA',
    'Austin, TX',
    'Boston, MA',
    'Denver, CO',
    'Portland, OR',
    'Nashville, TN',
    'Atlanta, GA',
    'Las Vegas, NV',
    'Philadelphia, PA',
    'San Diego, CA',
    'Washington, DC',
    'Brooklyn, NY',
    'Manhattan, NY',
    'Hollywood, CA',
    'Santa Monica, CA',
    'London, UK',
    'Paris, France',
    'Tokyo, Japan',
    'Sydney, Australia',
    'Barcelona, Spain',
    'Amsterdam, Netherlands',
    'Berlin, Germany',
    'Rome, Italy'
  ];

  
  const handleLocationInputChange = (e) => {
    const value = e.target.value;
    setLocationInput(value);
    
    if (value.trim().length > 0) {
      const filtered = popularCities.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); 
      
      console.log('Filtered suggestions:', filtered);
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  };

  
  const handleSuggestionSelect = (city) => {
    console.log('Suggestion selected:', city);
    setLocationInput(city);
    setShowSuggestions(false);
    setFilteredSuggestions([]);
    
    setTimeout(() => {
      handleLocationSearch();
    }, 100);
  };

  
  const handleInputFocus = () => {
    if (locationInput.trim().length === 0) {
      console.log('Input focused, showing popular cities');
      setFilteredSuggestions(popularCities.slice(0, 8));
      setShowSuggestions(true);
    }
  };

  
  const handleInputBlur = () => {
    
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  
  const handleLocationSearch = useCallback(async () => {
    if (!locationInput.trim()) return;

    setIsLocationLoading(true);
    
    try {
      
      const mockCoordinates = {
        
        'new york': [40.7589, -73.9851],
        'new york, ny': [40.7589, -73.9851],
        'nyc': [40.7589, -73.9851],
        'manhattan': [40.7831, -73.9712],
        'brooklyn': [40.6782, -73.9442],
        
        'los angeles': [34.0522, -118.2437],
        'los angeles, ca': [34.0522, -118.2437],
        'la': [34.0522, -118.2437],
        'hollywood': [34.0928, -118.3287],
        'santa monica': [34.0195, -118.4912],
        
        'chicago': [41.8781, -87.6298],
        'chicago, il': [41.8781, -87.6298],
        
        'san francisco': [37.7749, -122.4194],
        'san francisco, ca': [37.7749, -122.4194],
        'sf': [37.7749, -122.4194],
        
        'miami': [25.7617, -80.1918],
        'miami, fl': [25.7617, -80.1918],
        'south beach': [25.7907, -80.1300],
        
        'las vegas': [36.1699, -115.1398],
        'vegas': [36.1699, -115.1398],
        'las vegas, nv': [36.1699, -115.1398],
        
        'seattle': [47.6062, -122.3321],
        'seattle, wa': [47.6062, -122.3321],
        
        'boston': [42.3601, -71.0589],
        'boston, ma': [42.3601, -71.0589],
        
        'austin': [30.2672, -97.7431],
        'austin, tx': [30.2672, -97.7431],
        
        'denver': [39.7392, -104.9903],
        'denver, co': [39.7392, -104.9903],
        
        'portland': [45.5152, -122.6784],
        'portland, or': [45.5152, -122.6784],
        
        
        'london': [51.5074, -0.1278],
        'london, uk': [51.5074, -0.1278],
        'paris': [48.8566, 2.3522],
        'paris, france': [48.8566, 2.3522],
        'tokyo': [35.6762, 139.6503],
        'tokyo, japan': [35.6762, 139.6503],
        'sydney': [-33.8688, 151.2093],
        'sydney, australia': [-33.8688, 151.2093],
        'barcelona': [41.3851, 2.1734],
        'barcelona, spain': [41.3851, 2.1734],
        'amsterdam': [52.3676, 4.9041],
        'amsterdam, netherlands': [52.3676, 4.9041],
        'berlin': [52.5200, 13.4050],
        'berlin, germany': [52.5200, 13.4050],
        'rome': [41.9028, 12.4964],
        'rome, italy': [41.9028, 12.4964]
      };

      const normalizedLocation = locationInput.toLowerCase().trim();
      const coordinates = mockCoordinates[normalizedLocation];

      if (coordinates) {
        console.log('Found coordinates for', locationInput, ':', coordinates);
        onLocationChange(locationInput, coordinates);
      } else {
        
        const partialMatch = Object.keys(mockCoordinates).find(key => 
          key.includes(normalizedLocation) || normalizedLocation.includes(key)
        );
        
        if (partialMatch) {
          const coords = mockCoordinates[partialMatch];
          console.log('Partial match found for', locationInput, ':', coords);
          onLocationChange(locationInput, coords);
        } else {
          
          console.log('No match found, defaulting to NYC');
          onLocationChange(locationInput, [40.7589, -73.9851]);
        }
      }
      
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsLocationLoading(false);
    }
  }, [locationInput, onLocationChange]);

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    handleLocationSearch();
  };

  return (
    <div className="navigation-panel-container">
      {}
      <div className="nav-header">
        <h2><FiMapPin className="header-icon" /> Culturis</h2>
        <p>Discover your cultural destinations</p>
      </div>

      {}
      <div className="nav-actions">
        <button 
          className="nav-button secondary"
          onClick={onBackToTastes}
          aria-label="Change taste selection"
        >
          <FiRefreshCw /> Change Tastes
        </button>
      </div>

      {}
      <div className="location-section">
        <h3><FiTarget className="section-icon" /> Where to?</h3>
        <form onSubmit={handleLocationSubmit} className="location-form">
          <div className="location-input-group">
            <div className="location-input-container">
              <input
                type="text"
                value={locationInput}
                onChange={handleLocationInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Enter city or location..."
                className="location-input"
                disabled={isLocationLoading}
                autoComplete="off"
              />
              
              {}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="location-suggestions">
                  {filteredSuggestions.map((city, index) => (
                    <div
                      key={index}
                      className="suggestion-item"
                      onClick={() => handleSuggestionSelect(city)}
                      onMouseDown={(e) => e.preventDefault()} 
                    >
                      <FiMapPin className="suggestion-icon" />
                      <span className="suggestion-text">{city}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              className="location-search-btn"
              disabled={isLocationLoading || !locationInput.trim()}
            >
              {isLocationLoading ? <FiRefreshCw className="spinning" /> : <FiSearch />}
            </button>
          </div>
        </form>
        <div className="current-location">
          <small>Current: {currentLocation}</small>
        </div>
      </div>

      {}
      <div className="taste-summary">
        <h3><HiSparkles className="section-icon" /> Your Cultural DNA</h3>
        
        {}
        <div className="taste-group">
          <h4>Selected Tastes ({selectedTastes.length})</h4>
          <div className="taste-chips">
            {selectedTastes.map((taste, index) => (
              <span 
                key={taste.id || index}
                className="taste-chip original"
                style={{ backgroundColor: taste.color || '#667eea' }}
                title={taste.name}
              >
                {taste.name}
              </span>
            ))}
          </div>
        </div>

        {}
        {additionalTastes.length > 0 && (
          <div className="taste-group">
            <h4>AI Discovered ({additionalTastes.length})</h4>
            <div className="taste-chips">
              {additionalTastes.map((taste, index) => (
                <span 
                  key={taste.id || index}
                  className="taste-chip ai-derived"
                  style={{ backgroundColor: taste.color || '#f39c12' }}
                  title={`AI discovered: ${taste.name}`}
                >
                  <HiSparkles className="sparkle-icon" /> {taste.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="taste-stats">
          <div className="stat">
            <span className="stat-number">{selectedTastes.length + additionalTastes.length}</span>
            <span className="stat-label">Total Tastes</span>
          </div>
        </div>
      </div>

      {}
      <div className="quick-suggestions">
        <h3>Popular Destinations</h3>
        <div className="suggestion-chips">
          {[
            'New York, NY',
            'Los Angeles, CA',
            'Chicago, IL',
            'San Francisco, CA',
            'London, UK',
            'Paris, France'
          ].map((location) => (
            <button
              key={location}
              className="suggestion-chip"
              onClick={() => {
                console.log('Popular destination clicked:', location);
                setLocationInput(location);
                
                const normalizedLocation = location.toLowerCase().trim();
                const mockCoordinates = {
                  'new york, ny': [40.7589, -73.9851],
                  'los angeles, ca': [34.0522, -118.2437],
                  'chicago, il': [41.8781, -87.6298],
                  'san francisco, ca': [37.7749, -122.4194],
                  'london, uk': [51.5074, -0.1278],
                  'paris, france': [48.8566, 2.3522]
                };
                const coordinates = mockCoordinates[normalizedLocation] || [40.7589, -73.9851];
                onLocationChange(location, coordinates);
              }}
            >
              {location}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavigationPanel;
