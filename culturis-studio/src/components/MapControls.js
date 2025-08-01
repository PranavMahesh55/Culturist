import React, { useState } from 'react';
import './MapControls.css';

/**
 * MapControls - Interactive controls for map filtering and actions
 * Includes filter chips, legend toggle, and route planning FAB
 */
const MapControls = ({
  activeFilters = {},
  onFilterToggle = () => {},
  showLegend = false,
  onLegendToggle = () => {},
  routeMode = false,
  onRoutePress = () => {},
  canRoute = false,
  mapStyle = 'streets',
  onStyleChange = () => {},
  userLocation = ''
}) => {
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showStyleMenu, setShowStyleMenu] = useState(false);

  
  const filterOptions = {
    budget: [
      { value: 'low', label: 'Budget-friendly', icon: '💰' },
      { value: 'medium', label: 'Mid-range', icon: '💰💰' },
      { value: 'high', label: 'Premium', icon: '💰💰💰' }
    ],
    indoorOutdoor: [
      { value: 'indoor', label: 'Indoor', icon: '🏠' },
      { value: 'outdoor', label: 'Outdoor', icon: '🌳' }
    ]
  };

  
  const styleOptions = [
    { value: 'streets', label: 'Streets', icon: '🗺️' },
    { value: 'satellite', label: 'Satellite', icon: '🛰️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'terrain', label: 'Terrain', icon: '🏔️' }
  ];

  
  const handleFilterSelect = (filterType, value) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: activeFilters[filterType] === value ? null : value
    };
    onFilterToggle(newFilters);
  };

  
  const handleOpenNowToggle = () => {
    const newFilters = {
      ...activeFilters,
      openNow: !activeFilters.openNow
    };
    onFilterToggle(newFilters);
  };

  
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(Boolean).length;
  };

  return (
    <div className="map-controls">
      {}
      <div className="control-group filter-controls">
        <button 
          className={`filter-toggle ${showFilterMenu ? 'active' : ''}`}
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          aria-label="Toggle filters"
        >
          <span className="filter-icon">🔍</span>
          <span className="filter-text">Filters</span>
          {getActiveFilterCount() > 0 && (
            <span className="filter-badge">{getActiveFilterCount()}</span>
          )}
        </button>

        {showFilterMenu && (
          <div className="filter-menu">
            {}
            <div className="filter-section">
              <h4>Budget</h4>
              <div className="filter-chips">
                {filterOptions.budget.map((option) => (
                  <button
                    key={option.value}
                    className={`filter-chip ${activeFilters.budget === option.value ? 'active' : ''}`}
                    onClick={() => handleFilterSelect('budget', option.value)}
                  >
                    <span className="chip-icon">{option.icon}</span>
                    <span className="chip-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="filter-section">
              <h4>Environment</h4>
              <div className="filter-chips">
                {filterOptions.indoorOutdoor.map((option) => (
                  <button
                    key={option.value}
                    className={`filter-chip ${activeFilters.indoorOutdoor === option.value ? 'active' : ''}`}
                    onClick={() => handleFilterSelect('indoorOutdoor', option.value)}
                  >
                    <span className="chip-icon">{option.icon}</span>
                    <span className="chip-label">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="filter-section">
              <div className="filter-toggle-row">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={activeFilters.openNow}
                    onChange={handleOpenNowToggle}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-text">Open now</span>
                </label>
              </div>
            </div>

            {}
            {getActiveFilterCount() > 0 && (
              <div className="filter-section">
                <button
                  className="clear-filters"
                  onClick={() => onFilterToggle({})}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {}
      <div className="control-group legend-controls">
        <button
          className={`legend-toggle ${showLegend ? 'active' : ''}`}
          onClick={onLegendToggle}
          aria-label="Toggle heat map legend"
        >
          <span className="legend-icon">📊</span>
          <span className="legend-text">Legend</span>
        </button>
      </div>

      {}
      <div className="control-group style-controls">
        <button 
          className={`style-toggle ${showStyleMenu ? 'active' : ''}`}
          onClick={() => setShowStyleMenu(!showStyleMenu)}
          aria-label="Change map style"
        >
          <span className="style-icon">🎨</span>
          <span className="style-text">Style</span>
        </button>

        {showStyleMenu && (
          <div className="style-menu">
            <div className="style-options">
              {styleOptions.map((option) => (
                <button
                  key={option.value}
                  className={`style-option ${mapStyle === option.value ? 'active' : ''}`}
                  onClick={() => {
                    onStyleChange(option.value);
                    setShowStyleMenu(false);
                  }}
                >
                  <span className="option-icon">{option.icon}</span>
                  <span className="option-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {}
      {canRoute && (
        <div className="control-group route-controls">
          <button
            className={`route-fab ${routeMode ? 'active' : ''}`}
            onClick={onRoutePress}
            aria-label={routeMode ? 'Exit route mode' : 'Plan route'}
          >
            <span className="route-icon">
              {routeMode ? '✕' : '🗺️'}
            </span>
            <span className="route-text">
              {routeMode ? 'Exit Route' : 'Plan Route'}
            </span>
          </button>
        </div>
      )}

      {}
      {getActiveFilterCount() > 0 && (
        <div className="active-filters">
          {activeFilters.budget && (
            <span className="active-filter-chip">
              {filterOptions.budget.find(f => f.value === activeFilters.budget)?.label}
              <button 
                onClick={() => handleFilterSelect('budget', activeFilters.budget)}
                aria-label="Remove budget filter"
              >
                ×
              </button>
            </span>
          )}
          
          {activeFilters.indoorOutdoor && (
            <span className="active-filter-chip">
              {filterOptions.indoorOutdoor.find(f => f.value === activeFilters.indoorOutdoor)?.label}
              <button 
                onClick={() => handleFilterSelect('indoorOutdoor', activeFilters.indoorOutdoor)}
                aria-label="Remove environment filter"
              >
                ×
              </button>
            </span>
          )}
          
          {activeFilters.openNow && (
            <span className="active-filter-chip">
              Open now
              <button 
                onClick={handleOpenNowToggle}
                aria-label="Remove open now filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MapControls;
