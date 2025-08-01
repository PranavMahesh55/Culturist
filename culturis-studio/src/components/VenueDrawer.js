import React, { useState, useRef } from 'react';
import './VenueDrawer.css';

/**
 * VenueDrawer - Collapsible drawer showing venues for selected hex
 * Supports drag gestures and displays venue details with cultural blurbs
 */
const VenueDrawer = ({
  state = 'hidden', 
  venues = [],
  loading = false,
  error = null,
  focusedHex = null,
  onStateChange = () => {},
  onVenueSelect = () => {}
}) => {
  const [dragStart, setDragStart] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const drawerRef = useRef(null);
  const contentRef = useRef(null);

  
  const getDrawerTransform = () => {
    const baseOffset = dragOffset;
    
    switch (state) {
      case 'hidden':
        return `translateY(calc(100% - 0px + ${baseOffset}px))`;
      case 'peek':
        return `translateY(calc(100% - 120px + ${baseOffset}px))`;
      case 'expanded':
        return `translateY(calc(100% - 80vh + ${baseOffset}px))`;
      default:
        return `translateY(calc(100% - 0px + ${baseOffset}px))`;
    }
  };

  
  const handleDragStart = (clientY) => {
    setDragStart(clientY);
    setDragOffset(0);
  };

  
  const handleDragMove = (clientY) => {
    if (dragStart === null) return;
    
    const offset = clientY - dragStart;
    setDragOffset(offset);
  };

  
  const handleDragEnd = () => {
    if (dragStart === null) return;
    
    const threshold = 50; 
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        
        if (state === 'expanded') {
          onStateChange('peek');
        } else if (state === 'peek') {
          onStateChange('hidden');
        }
      } else {
        
        if (state === 'hidden') {
          onStateChange('peek');
        } else if (state === 'peek') {
          onStateChange('expanded');
        }
      }
    }
    
    setDragStart(null);
    setDragOffset(0);
  };

  
  const handleMouseDown = (e) => {
    handleDragStart(e.clientY);
    
    const handleMouseMove = (e) => handleDragMove(e.clientY);
    const handleMouseUp = () => {
      handleDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  
  const handleTouchStart = (e) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  
  const generateBlurb = (venueName, clusterName) => {
    
    const blurbs = [
      `A hidden gem that perfectly captures the essence of ${clusterName.toLowerCase()}.`,
      `This ${venueName} offers an authentic experience that resonates with ${clusterName.toLowerCase()}.`,
      `Discover why locals love this spot - it's the heart of the ${clusterName.toLowerCase()} scene.`,
      `An iconic destination that embodies the spirit of ${clusterName.toLowerCase()}.`
    ];
    
    return blurbs[Math.floor(Math.random() * blurbs.length)];
  };

  
  const getCategoryIcon = (venueType) => {
    const icons = {
      'Restaurant': '🍽️',
      'Deli': '🥪',
      'Cafe': '☕',
      'Bar': '�',
      'Art Museum': '🎨',
      'Modern Art Museum': '🖼️',
      'Museum': '�️',
      'Market': '🛒',
      'Shopping Mall': '🏬',
      'Event Venue': '🎪',
      'Arena': '🏟️',
      'Stadium': '⚽',
      'Tourist Attraction': '📍',
      'Historical Landmark': '🏛️',
      'Park': '🌳',
      'Garden': '🌸',
      'Cultural Venue': '🎭'
    };
    
    return icons[venueType] || '📍';
  };

  if (state === 'hidden') {
    return null;
  }

  return (
    <div 
      ref={drawerRef}
      className={`venue-drawer ${state}`}
      style={{ 
        transform: getDrawerTransform(),
        transition: dragStart !== null ? 'none' : 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }}
    >
      {}
      <div 
        className="drawer-handle"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        aria-label="Drag to resize venue list"
        tabIndex={0}
      >
        <div className="handle-bar"></div>
      </div>

      {}
      <div className="drawer-header">
        {focusedHex && (
          <div className="hex-info">
            <h3>Cultural Hotspot</h3>
            <p>Affinity: {focusedHex.lift?.toFixed(1)}%</p>
          </div>
        )}
        
        {venues.length > 0 && (
          <div className="venue-count">
            <span className="count">{venues.length}</span>
            <span className="label">venues found</span>
          </div>
        )}
      </div>

      {}
      <div ref={contentRef} className="drawer-content">
        {loading && (
          <div className="drawer-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
            <p>Finding the best venues for you...</p>
          </div>
        )}

        {error && (
          <div className="drawer-error">
            <p>Unable to load venues</p>
            <small>{error}</small>
          </div>
        )}

        {!loading && !error && venues.length === 0 && focusedHex && (
          <div className="empty-state">
            <p>No venues found in this area</p>
            <small>Try a different location or adjust your filters</small>
          </div>
        )}

        {!loading && venues.length > 0 && (
          <div className="venue-list">
            {venues.map((venue, index) => (
              <div 
                key={venue.id || index}
                className="venue-item"
                onClick={() => onVenueSelect(venue)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onVenueSelect(venue);
                  }
                }}
              >
                <div className="venue-header">
                  <div className="venue-icon">
                    {getCategoryIcon(venue.type)}
                  </div>
                  <div className="venue-title">
                    <h4>{venue.name}</h4>
                    <div className="venue-meta">
                      <span className="venue-type">{venue.type}</span>
                      <span className="affinity">
                        {venue.affinity ? `${venue.affinity}% match` : 'New discovery'}
                      </span>
                      {venue.rating && (
                        <span className="rating">
                          {venue.rating} ⭐
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="venue-rating">
                    {venue.qloo_data?.popularity && (
                      <div className="popularity-bar">
                        <div 
                          className="popularity-fill"
                          style={{ width: `${venue.qloo_data.popularity * 100}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="venue-blurb">
                  <p>{venue.culturalMatch ? `Matches your taste for ${venue.culturalMatch}` : generateBlurb(venue.name, venue.type)}</p>
                </div>

                {venue.qloo_data?.keywords && venue.qloo_data.keywords.length > 0 && (
                  <div className="venue-keywords">
                    {venue.qloo_data.keywords.slice(0, 3).map((keyword, idx) => (
                      <span key={idx} className="keyword-chip">
                        {keyword}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {}
      {venues.length > 0 && (
        <div className="drawer-footer">
          <button 
            className="action-button secondary"
            onClick={() => onStateChange(state === 'expanded' ? 'peek' : 'expanded')}
          >
            {state === 'expanded' ? 'Collapse' : 'View All'}
          </button>
          <button 
            className="action-button primary"
            onClick={() => {
              
              console.log('Plan route with venues:', venues);
            }}
          >
            Plan Route
          </button>
        </div>
      )}
    </div>
  );
};

export default VenueDrawer;
