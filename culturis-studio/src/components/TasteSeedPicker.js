import React, { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';
import './TasteSeedPicker.css';

/**
 * TasteSeedPicker - Advanced taste selection component for CultureCanvas
 * 
 * Features:
 * - Local catalog search with Fuse.js fuzzy matching
 * - Remote Qloo API fallback search
 * - Trending tastes from Qloo insights
 * - Categorized browsing interface
 * - Accessible keyboard navigation
 * - Visual chip selection states
 */
const TasteSeedPicker = ({ 
  onSelectionComplete = () => {}, 
  userLocation = "New York, NY",
  minSelections = 3 
}) => {
  
  const [selectedTastes, setSelectedTastes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [catalog, setCatalog] = useState({});
  const [trendingTastes, setTrendingTastes] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  
  const searchInputRef = useRef(null);
  const announcementRef = useRef(null);

  
  const fuseRef = useRef(null);

  
  const API_BASE = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-api.com'
    : 'http://localhost:8000';

  /**
   * Load catalog data and initialize Fuse.js
   */
  useEffect(() => {
    const loadCatalog = async () => {
      try {
        const response = await fetch('/catalog_tags.json');
        const catalogData = await response.json();
        setCatalog(catalogData);

        
        const allItems = Object.entries(catalogData).flatMap(([category, items]) =>
          items.map(item => ({ ...item, category }))
        );

        
        fuseRef.current = new Fuse(allItems, {
          keys: ['name', 'category'],
          threshold: 0.3, 
          includeScore: true,
          includeMatches: true
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setError('Failed to load taste catalog');
        setIsLoading(false);
      }
    };

    loadCatalog();
  }, []);

  /**
   * Fetch trending tastes from Qloo insights
   */
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const params = new URLSearchParams({
          'filter.type': 'urn:entity:place',
          'filter.location.query': userLocation,
          'filter.location.radius': '10000',
          'limit': '0'
        });

        const response = await fetch(`${API_BASE}/api/qloo-insights?${params}`);
        
        if (response.ok) {
          const data = await response.json();
          const clusters = data.results?.clusters || [];
          
          
          const trending = clusters
            .slice(0, 3)
            .map((cluster, index) => ({
              id: `trending_${cluster.cluster_name.toLowerCase().replace(/\s+/g, '_')}_${index}`,
              name: cluster.cluster_name,
              type: 'trending'
            }));
          
          setTrendingTastes(trending);
        }
      } catch (err) {
        console.warn('Failed to fetch trending tastes:', err);
        
        setTrendingTastes([
          { id: 'trending_artisan_coffee', name: 'Artisan Coffee', type: 'trending', emoji: '☕' },
          { id: 'trending_indie_music', name: 'Indie Music', type: 'trending', emoji: '🎵' },
          { id: 'trending_street_art', name: 'Street Art', type: 'trending', emoji: '🎨' },
          { id: 'trending_craft_cocktails', name: 'Craft Cocktails', type: 'trending', emoji: '🍸' },
          { id: 'trending_local_markets', name: 'Local Markets', type: 'trending', emoji: '🏪' },
          { id: 'trending_rooftop_dining', name: 'Rooftop Dining', type: 'trending', emoji: '🌆' },
          { id: 'trending_underground_music', name: 'Underground Music', type: 'trending', emoji: '🎧' },
          { id: 'trending_sustainable_fashion', name: 'Sustainable Fashion', type: 'trending', emoji: '♻️' },
          { id: 'trending_immersive_art', name: 'Immersive Art', type: 'trending', emoji: '🖼️' },
          { id: 'trending_plant_based', name: 'Plant-Based Dining', type: 'trending', emoji: '🌱' },
          { id: 'trending_vinyl_records', name: 'Vinyl Records', type: 'trending', emoji: '💿' },
          { id: 'trending_speakeasy_bars', name: 'Speakeasy Bars', type: 'trending', emoji: '🗝️' }
        ]);
      }
    };

    if (userLocation) {
      fetchTrending();
    }
  }, [userLocation, API_BASE]);

  /**
   * Search local catalog with Fuse.js
   */
  const searchLocalCatalog = useCallback((query) => {
    if (!fuseRef.current || !query.trim()) {
      return [];
    }

    const results = fuseRef.current.search(query);
    return results.map(result => ({
      ...result.item,
      type: 'local',
      score: result.score
    }));
  }, []);

  /**
   * Search remote Qloo API
   */
  const searchRemoteQloo = useCallback(async (query) => {
    try {
      const response = await fetch(`${API_BASE}/api/qloo-search?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.results?.entities || [];
        
        return results.slice(0, 5).map(entity => ({
          id: entity.id || `remote_${entity.name.toLowerCase().replace(/\s+/g, '_')}`,
          name: entity.name,
          type: 'remote',
          category: entity.type || 'general'
        }));
      }
      return [];
    } catch (err) {
      console.error('Remote search failed:', err);
      setError('Search temporarily unavailable');
      return [];
    }
  }, [API_BASE]);

  /**
   * Handle search input with debouncing
   */
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    
    const localResults = searchLocalCatalog(query);
    
    
    if (localResults.length >= 3) {
      setSearchResults(localResults.slice(0, 8));
      setIsSearching(false);
      return;
    }

    
    try {
      const remoteResults = await searchRemoteQloo(query);
      const combinedResults = [...localResults, ...remoteResults];
      
      setSearchResults(combinedResults.slice(0, 8));
      
    } catch (err) {
      setSearchResults(localResults);
    } finally {
      setIsSearching(false);
    }
  }, [searchLocalCatalog, searchRemoteQloo]);

  /**
   * Debounced search effect
   */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, handleSearch]);

  /**
   * Handle taste selection
   */
  const handleTasteSelect = useCallback((taste) => {
    setSelectedTastes(prev => {
      
      const exists = prev.find(t => t.id === taste.id);
      if (exists) return prev;
      
      const newSelection = [...prev, taste];
      
      
      if (announcementRef.current) {
        announcementRef.current.textContent = 
          `Added ${taste.name}. ${newSelection.length} taste${newSelection.length !== 1 ? 's' : ''} selected.`;
      }
      
      return newSelection;
    });
  }, []);

  /**
   * Handle taste removal
   */
  const handleTasteRemove = useCallback((tasteId) => {
    setSelectedTastes(prev => {
      const filtered = prev.filter(t => t.id !== tasteId);
      const removedTaste = prev.find(t => t.id === tasteId);
      
      
      if (announcementRef.current && removedTaste) {
        announcementRef.current.textContent = 
          `Removed ${removedTaste.name}. ${filtered.length} taste${filtered.length !== 1 ? 's' : ''} selected.`;
      }
      
      return filtered;
    });
  }, []);

  /**
   * Handle CTA click
   */
  const handleCTA = () => {
    if (selectedTastes.length >= minSelections) {
      if (typeof onSelectionComplete === 'function') {
        onSelectionComplete(selectedTastes);
      } else {
        console.error('onSelectionComplete is not a function:', onSelectionComplete);
      }
    }
  };

  /**
   * Keyboard navigation for chips
   */
  const handleChipKeyDown = (event, action, data) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action(data);
    }
  };

  if (isLoading) {
    return (
      <div className="taste-picker-loading">
        <div className="loading-spinner"></div>
        <p>Loading taste catalog...</p>
      </div>
    );
  }

  return (
    <div className="taste-seed-picker">
      {}
      <div 
        ref={announcementRef}
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />

      {}
      <div className="picker-header">
        <h2>Choose Your Cultural Tastes</h2>
        <p>Select at least {minSelections} tastes to paint your cultural map</p>
      </div>

      {}
      {selectedTastes.length > 0 && (
        <div className="selected-tastes">
          <h3>Selected Tastes ({selectedTastes.length})</h3>
          <div className="selected-chips">
            {selectedTastes.map(taste => (
              <div 
                key={taste.id}
                className={`taste-chip selected ${taste.type}`}
                role="button"
                tabIndex={0}
                aria-label={`Remove ${taste.name}`}
                onClick={() => handleTasteRemove(taste.id)}
                onKeyDown={(e) => handleChipKeyDown(e, handleTasteRemove, taste.id)}
              >
                <span>{taste.name}</span>
                <button className="remove-btn" aria-hidden="true">×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {error && (
        <div className="error-toast" role="alert">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
          aria-pressed={activeTab === 'search'}
        >
          Search
        </button>
        <button 
          className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
          onClick={() => setActiveTab('browse')}
          aria-pressed={activeTab === 'browse'}
        >
          Browse Categories
        </button>
      </div>

      {}
      {activeTab === 'search' && (
        <div className="search-section">
          {}
          <div className="search-container">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tastes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search for cultural tastes"
            />
            {isSearching && <div className="search-spinner"></div>}
          </div>

          {}
          {!searchQuery && trendingTastes.length > 0 && (
            <div className="trending-section">
              <h3>🔥 Trending Now</h3>
              <p className="trending-subtitle">Popular cultural experiences in {userLocation}</p>
              <div className="trending-chips">
                {trendingTastes.slice(0, 8).map(taste => (
                  <div
                    key={taste.id}
                    className={`taste-chip trending ${selectedTastes.find(t => t.id === taste.id) ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Add ${taste.name} to selection`}
                    onClick={() => handleTasteSelect(taste)}
                    onKeyDown={(e) => handleChipKeyDown(e, handleTasteSelect, taste)}
                  >
                    <span className="taste-emoji">{taste.emoji || '✨'}</span>
                    <span className="taste-name">{taste.name}</span>
                    <span className="trending-indicator">🔥</span>
                  </div>
                ))}
              </div>
              {trendingTastes.length > 8 && (
                <button 
                  className="show-more-trending"
                  onClick={() => {
                    
                    console.log('Show more trending tastes');
                  }}
                >
                  Show {trendingTastes.length - 8} more trending tastes →
                </button>
              )}
            </div>
          )}

          {}
          {searchQuery && (
            <div className="search-results">
              <h3>Search Results</h3>
              {searchResults.length > 0 ? (
                <div className="result-chips">
                  {searchResults.map(taste => (
                    <div
                      key={taste.id}
                      className={`taste-chip ${taste.type} ${selectedTastes.find(t => t.id === taste.id) ? 'selected' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Add ${taste.name} to selection`}
                      onClick={() => handleTasteSelect(taste)}
                      onKeyDown={(e) => handleChipKeyDown(e, handleTasteSelect, taste)}
                    >
                      {taste.name}
                      {taste.type === 'remote' && <span className="remote-badge">New</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-results">No results found for "{searchQuery}"</p>
              )}
            </div>
          )}
        </div>
      )}

      {}
      {activeTab === 'browse' && (
        <div className="browse-section">
          {Object.entries(catalog).map(([category, items]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </h3>
              <div className="category-chips">
                {items.map(taste => (
                  <div
                    key={taste.id}
                    className={`taste-chip local ${selectedTastes.find(t => t.id === taste.id) ? 'selected' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Add ${taste.name} to selection`}
                    onClick={() => handleTasteSelect({ ...taste, type: 'local', category })}
                    onKeyDown={(e) => handleChipKeyDown(e, handleTasteSelect, { ...taste, type: 'local', category })}
                  >
                    {taste.name}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <div className="cta-section">
        <button
          className={`cta-button ${selectedTastes.length >= minSelections ? 'active' : 'inactive'}`}
          onClick={handleCTA}
          disabled={selectedTastes.length < minSelections}
          aria-label={`Paint my map (${selectedTastes.length}/${minSelections} tastes selected)`}
        >
          Paint My Map
          {selectedTastes.length >= minSelections && (
            <span className="cta-glow"></span>
          )}
        </button>
        {selectedTastes.length < minSelections && (
          <p className="cta-hint">
            Select {minSelections - selectedTastes.length} more taste{minSelections - selectedTastes.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
};

export default TasteSeedPicker;
