import React, { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiArrowRight, FiEdit3, FiCheck, FiX } from 'react-icons/fi';
import './RoutePlanner.css';

/**
 * RoutePlanner - Interactive route planning interface
 * Allows users to select number of venues and creates optimized cultural routes
 */
const RoutePlanner = ({ 
  venues = [], 
  userLocation = 'New York, NY',
  onClose = () => {},
  onUpdateRoute = () => {} 
}) => {
  const [step, setStep] = useState('select'); 
  const [venueCount, setVenueCount] = useState(3);
  const [plannedRoute, setPlannedRoute] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [routePreferences, setRoutePreferences] = useState({
    duration: 'half-day', 
    pace: 'relaxed', 
    focus: 'diverse' 
  });

  
  const generateRoute = async () => {
    setIsGenerating(true);
    
    try {
      
      let filteredVenues = [...venues];
      
      
      if (routePreferences.focus !== 'diverse') {
        filteredVenues = prioritizeVenuesByFocus(venues, routePreferences.focus);
      }
      
      
      let adjustedVenueCount = venueCount;
      if (routePreferences.duration === 'quick') {
        adjustedVenueCount = Math.min(venueCount, 3); 
      } else if (routePreferences.duration === 'full-day') {
        adjustedVenueCount = Math.min(venueCount + 2, Math.min(venues.length, 7)); 
      }
      
      
      const sortedVenues = filteredVenues
        .map(venue => ({
          ...venue,
          weightedAffinity: calculateWeightedAffinity(venue, routePreferences.focus)
        }))
        .sort((a, b) => b.weightedAffinity - a.weightedAffinity);
      
      const selectedVenues = sortedVenues.slice(0, adjustedVenueCount);
      
      
      const optimizedVenues = optimizeVenueOrder(selectedVenues, routePreferences);
      
      
      let currentTime = getCurrentTime(); 
      const routeWithDetails = optimizedVenues.map((venue, index) => {
        const previousVenue = index > 0 ? optimizedVenues[index - 1] : null;
        
        
        if (index > 0) {
          const travelTime = getEstimatedTravelTime(previousVenue, venue);
          currentTime = addMinutes(currentTime, travelTime);
        }
        
        const arrivalTime = currentTime;
        const venueTime = getEstimatedTime(venue.type, routePreferences.pace, venue, routePreferences.duration);
        
        
        currentTime = addMinutes(currentTime, venueTime);
        
        
        let adjustedAffinity = venue.affinity;
        if (venue.qloo_data && venue.qloo_data.popularity) {
          
          if (venue.qloo_data.popularity > 0.9999) {
            adjustedAffinity = Math.max(70, adjustedAffinity - Math.floor(Math.random() * 10));
          }
          
          else if (venue.qloo_data.popularity < 0.995) {
            adjustedAffinity = Math.min(95, adjustedAffinity + Math.floor(Math.random() * 8));
          }
        }
        
        return {
          ...venue,
          affinity: adjustedAffinity,
          order: index + 1,
          arrivalTime: arrivalTime,
          estimatedTime: venueTime,
          travelTime: index === 0 ? 0 : getEstimatedTravelTime(previousVenue, venue),
          notes: generateVenueNotes(venue, routePreferences.focus)
        };
      });
      
      
      const totalTime = routeWithDetails.reduce((total, venue) => 
        total + venue.estimatedTime + venue.travelTime, 0
      );
      
      setPlannedRoute({
        venues: routeWithDetails,
        totalDuration: totalTime,
        startTime: getCurrentTime(),
        endTime: addMinutes(getCurrentTime(), totalTime),
        preferences: routePreferences
      });
      
      setStep('plan');
    } catch (error) {
      console.error('Error generating route:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  
  const prioritizeVenuesByFocus = (venues, focus) => {
    const focusWeights = {
      'food': ['Restaurant', 'Cafe', 'Bar', 'Market'],
      'arts': ['Museum', 'Art Museum', 'Gallery', 'Theater', 'Art Gallery'],
      'culture': ['Historical Site', 'Cultural Center', 'Local Market', 'Traditional', 'Heritage']
    };
    
    const priorityTypes = focusWeights[focus] || [];
    
    return venues.map(venue => {
      let priorityBoost = 0;
      
      
      if (priorityTypes.some(type => venue.type.includes(type))) {
        priorityBoost = 20; 
      }
      
      
      if (venue.qloo_data?.keywords) {
        const keywords = venue.qloo_data.keywords.join(' ').toLowerCase();
        
        if (focus === 'food' && (keywords.includes('food') || keywords.includes('dining') || keywords.includes('cuisine'))) {
          priorityBoost += 10;
        } else if (focus === 'arts' && (keywords.includes('art') || keywords.includes('creative') || keywords.includes('culture'))) {
          priorityBoost += 10;
        } else if (focus === 'culture' && (keywords.includes('local') || keywords.includes('traditional') || keywords.includes('heritage'))) {
          priorityBoost += 10;
        }
      }
      
      return {
        ...venue,
        focusPriorityBoost: priorityBoost
      };
    });
  };

  const calculateWeightedAffinity = (venue, focus) => {
    let baseAffinity = venue.affinity || 0;
    let focusBoost = venue.focusPriorityBoost || 0;
    
    return baseAffinity + focusBoost;
  };

  const optimizeVenueOrder = (venues, preferences) => {
    
    
    
    if (venues.length <= 2) return venues;
    
    
    const orderedVenues = [venues[0]];
    const remaining = venues.slice(1);
    
    
    while (remaining.length > 0) {
      const lastVenue = orderedVenues[orderedVenues.length - 1];
      
      let nextVenue = remaining[0];
      let minDistance = calculateDistance(lastVenue, nextVenue);
      let nextIndex = 0;
      
      
      for (let i = 1; i < remaining.length; i++) {
        const distance = calculateDistance(lastVenue, remaining[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nextVenue = remaining[i];
          nextIndex = i;
        }
      }
      
      orderedVenues.push(nextVenue);
      remaining.splice(nextIndex, 1);
    }
    
    return orderedVenues;
  };

  const calculateDistance = (venue1, venue2) => {
    if (!venue1.coordinates || !venue2.coordinates) return Math.random(); 
    
    const [lat1, lng1] = venue1.coordinates;
    const [lat2, lng2] = venue2.coordinates;
    
    
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  };

  const getEstimatedTime = (venueType, pace, venue, duration) => {
    
    const baseTimes = {
      'Restaurant': 90,
      'Cafe': 45,
      'Bar': 60,
      'Art Museum': 120,
      'Museum': 90,
      'Market': 60,
      'Park': 45,
      'Event Venue': 120,
      'Gallery': 75,
      'Shop': 30,
      'Historical Site': 60
    };
    
    const paceMultipliers = {
      'quick': 0.7,
      'relaxed': 1.0,
      'thorough': 1.3
    };
    
    
    const durationMultipliers = {
      'quick': 0.8,        
      'half-day': 1.0,     
      'full-day': 1.2      
    };
    
    
    let baseTime = baseTimes[venueType] || 60;
    
    
    if (venue?.qloo_data) {
      
      if (venue.qloo_data.popularity > 0.999) {
        baseTime *= 1.2;
      }
      
      if (venue.qloo_data.keywords && venue.qloo_data.keywords.length > 3) {
        baseTime *= 1.1;
      }
    }
    
    
    const finalTime = baseTime * paceMultipliers[pace] * (durationMultipliers[duration] || 1.0);
    
    return Math.round(finalTime);
  };

  const getEstimatedTravelTime = (fromVenue, toVenue) => {
    if (!fromVenue || !toVenue) return Math.floor(Math.random() * 15) + 10;
    
    
    const [lat1, lng1] = fromVenue.coordinates || [40.7589, -73.9851];
    const [lat2, lng2] = toVenue.coordinates || [40.7589, -73.9851];
    
    
    const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    const travelTime = Math.max(5, Math.min(30, Math.round(distance * 1000) + 10));
    
    return travelTime;
  };

  const generateVenueNotes = (venue, focus) => {
    
    if (venue?.qloo_data?.keywords && venue.qloo_data.keywords.length > 0) {
      const keywords = venue.qloo_data.keywords.slice(0, 3);
      
      const keywordNotes = {
        'diverse': `Known for ${keywords.join(', ')} - a perfect cultural stop`,
        'food': venue.type.includes('Restaurant') || venue.type.includes('Cafe') ? 
          `Celebrated for ${keywords.join(', ')}` : `Great atmosphere featuring ${keywords[0]}`,
        'arts': venue.type.includes('Museum') || venue.type.includes('Art') ? 
          `Features ${keywords.join(', ')} - don't miss it!` : `Cultural spot known for ${keywords[0]}`,
        'culture': `Local favorite known for ${keywords.join(', ')}`
      };
      
      return keywordNotes[focus] || keywordNotes['diverse'];
    }
    
    
    const focusNotes = {
      'diverse': `Experience the unique atmosphere of this ${venue.type.toLowerCase()}`,
      'food': venue.type.includes('Restaurant') || venue.type.includes('Cafe') ? 
        'Perfect spot for culinary exploration' : 'Great for a quick break',
      'arts': venue.type.includes('Museum') || venue.type.includes('Art') ? 
        'Immerse yourself in the cultural offerings' : 'Appreciate the creative atmosphere',
      'culture': `Discover what makes this ${venue.type.toLowerCase()} special to locals`
    };
    
    return focusNotes[focus] || focusNotes['diverse'];
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const addMinutes = (time, minutes) => {
    const [timePart, period] = time.split(' ');
    const [hours, mins] = timePart.split(':').map(Number);
    
    const totalMinutes = (hours % 12) * 60 + mins + minutes + (period === 'PM' ? 12 * 60 : 0);
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    
    const displayHours = newHours === 0 ? 12 : newHours > 12 ? newHours - 12 : newHours;
    const newPeriod = newHours >= 12 ? 'PM' : 'AM';
    
    return `${displayHours}:${newMins.toString().padStart(2, '0')} ${newPeriod}`;
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="route-planner">
      <div className="route-planner-header">
        <h2>🗺️ Plan Your Cultural Route</h2>
        <button className="close-btn" onClick={onClose}>
          <FiX />
        </button>
      </div>

      {step === 'select' && (
        <div className="route-step select-venues">
          <h3>How many places would you like to explore?</h3>
          
          <div className="venue-count-selector">
            {[2, 3, 4, 5, 6].map(count => (
              <button
                key={count}
                className={`count-option ${venueCount === count ? 'selected' : ''}`}
                onClick={() => setVenueCount(count)}
              >
                <span className="count-number">{count}</span>
                <span className="count-label">venues</span>
              </button>
            ))}
          </div>

          <div className="route-preferences">
            <h4>Route Preferences</h4>
            
            <div className="preference-group">
              <label>Duration:</label>
              <select 
                value={routePreferences.duration}
                onChange={(e) => setRoutePreferences(prev => ({...prev, duration: e.target.value}))}
              >
                <option value="quick">Quick Tour (2-3 hours)</option>
                <option value="half-day">Half Day (4-5 hours)</option>
                <option value="full-day">Full Day (6+ hours)</option>
              </select>
            </div>

            <div className="preference-group">
              <label>Pace:</label>
              <select 
                value={routePreferences.pace}
                onChange={(e) => setRoutePreferences(prev => ({...prev, pace: e.target.value}))}
              >
                <option value="quick">Quick Visits</option>
                <option value="relaxed">Relaxed Pace</option>
                <option value="thorough">Thorough Exploration</option>
              </select>
            </div>

            <div className="preference-group">
              <label>Focus:</label>
              <select 
                value={routePreferences.focus}
                onChange={(e) => setRoutePreferences(prev => ({...prev, focus: e.target.value}))}
              >
                <option value="diverse">Diverse Experience</option>
                <option value="food">Food & Dining</option>
                <option value="arts">Arts & Culture</option>
                <option value="culture">Local Culture</option>
              </select>
            </div>
          </div>

          <button 
            className="generate-route-btn"
            onClick={generateRoute}
            disabled={isGenerating}
          >
            {isGenerating ? '🎭 Crafting Your Route...' : 
              `Generate ${routePreferences.duration === 'quick' ? 'Quick' : 
                       routePreferences.duration === 'half-day' ? 'Half-Day' : 'Full-Day'} 
               ${routePreferences.focus === 'diverse' ? 'Cultural' : 
                 routePreferences.focus === 'food' ? 'Food & Dining' : 
                 routePreferences.focus === 'arts' ? 'Arts & Culture' : 'Cultural'} Route`}
          </button>
        </div>
      )}

      {step === 'plan' && plannedRoute.venues && (
        <div className="route-step planned-route">
          <div className="route-summary">
            <h3>Your Cultural Journey</h3>
            <div className="route-stats">
              <span className="stat">
                <FiMapPin /> {plannedRoute.venues.length} venues
              </span>
              <span className="stat">
                <FiClock /> {formatDuration(plannedRoute.totalDuration)}
              </span>
              <span className="stat">
                📍 {userLocation}
              </span>
            </div>
            <div className="route-preferences-summary">
              <small>
                🎯 {routePreferences.focus === 'diverse' ? 'Diverse Experience' : 
                    routePreferences.focus === 'food' ? 'Food & Dining Focus' :
                    routePreferences.focus === 'arts' ? 'Arts & Culture Focus' : 'Local Culture Focus'} • 
                ⏱️ {routePreferences.pace === 'quick' ? 'Quick Visits' :
                    routePreferences.pace === 'relaxed' ? 'Relaxed Pace' : 'Thorough Exploration'} • 
                📅 {routePreferences.duration === 'quick' ? 'Quick Tour' :
                    routePreferences.duration === 'half-day' ? 'Half Day' : 'Full Day'}
              </small>
            </div>
          </div>

          <div className="route-timeline">
            {plannedRoute.venues.map((venue, index) => (
              <div key={venue.id} className="timeline-item">
                <div className="timeline-marker">
                  <span className="venue-number">{venue.order}</span>
                </div>
                
                <div className="timeline-content">
                  <div className="venue-card">
                    <div className="venue-header">
                      <h4>{venue.name}</h4>
                      <span className="venue-type">{venue.type}</span>
                    </div>
                    
                    <div className="venue-timing">
                      <span className="arrival-time">
                        📅 Arrive: {venue.arrivalTime}
                      </span>
                      <span className="time-slot">
                        <FiClock /> {formatDuration(venue.estimatedTime)}
                      </span>
                      {venue.travelTime > 0 && (
                        <span className="travel-time">
                          + {venue.travelTime}m travel
                        </span>
                      )}
                    </div>
                    
                    <div className="venue-match">
                      <span className="match-score">{venue.affinity}% match</span>
                      {venue.culturalMatch && (
                        <span className="cultural-match">{venue.culturalMatch}</span>
                      )}
                      {venue.rating && (
                        <span className="venue-rating">⭐ {venue.rating.toFixed(1)}</span>
                      )}
                    </div>
                    
                    <p className="venue-notes">{venue.notes}</p>
                    
                    {venue.qloo_data && venue.qloo_data.keywords && venue.qloo_data.keywords.length > 0 && (
                      <div className="venue-keywords">
                        {venue.qloo_data.keywords.slice(0, 3).map((keyword, i) => (
                          <span key={i} className="keyword-tag">{keyword}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {index < plannedRoute.venues.length - 1 && (
                  <div className="timeline-connector">
                    <FiArrowRight />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="route-actions">
            <button 
              className="secondary-btn"
              onClick={() => setStep('select')}
            >
              <FiEdit3 /> Modify Plan
            </button>
            <button 
              className="primary-btn"
              onClick={() => {
                onUpdateRoute(plannedRoute);
                setStep('refine');
              }}
            >
              <FiCheck /> Use This Route
            </button>
          </div>
        </div>
      )}

      {step === 'refine' && (
        <div className="route-step refine-route">
          <h3>🎯 Route Activated!</h3>
          <p>Your cultural route has been set. You can now use the chatbot to:</p>
          
          <div className="refine-suggestions">
            <div className="suggestion-item">
              <span className="suggestion-icon">💬</span>
              <span>Ask for more details about any venue</span>
            </div>
            <div className="suggestion-item">
              <span className="suggestion-icon">🔄</span>
              <span>Request alternative venues</span>
            </div>
            <div className="suggestion-item">
              <span className="suggestion-icon">⏰</span>
              <span>Adjust timing and duration</span>
            </div>
            <div className="suggestion-item">
              <span className="suggestion-icon">🗺️</span>
              <span>Get navigation directions</span>
            </div>
          </div>

          <p className="refine-note">
            Try saying: "Tell me more about the first venue" or "Can you suggest a different restaurant?"
          </p>

          <button 
            className="close-planner-btn"
            onClick={onClose}
          >
            Close Route Planner
          </button>
        </div>
      )}
    </div>
  );
};

export default RoutePlanner;
