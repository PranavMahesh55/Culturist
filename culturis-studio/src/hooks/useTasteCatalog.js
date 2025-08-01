import { useState, useEffect, useCallback, useRef } from 'react';
import Fuse from 'fuse.js';

/**
 * Custom hook for managing taste catalog and search functionality
 * 
 * @param {string} userLocation - User's location for trending tastes
 * @returns {object} Catalog data, search methods, and loading states
 */
export const useTasteCatalog = (userLocation = "New York, NY") => {
  const [catalog, setCatalog] = useState({});
  const [trendingTastes, setTrendingTastes] = useState([]);
  const [remoteTastes, setRemoteTastes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  
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
        setIsLoading(true);
        const response = await fetch('/catalog_tags.json');
        
        if (!response.ok) {
          throw new Error('Failed to load catalog');
        }
        
        const catalogData = await response.json();
        setCatalog(catalogData);

        
        const allItems = Object.entries(catalogData).flatMap(([category, items]) =>
          items.map(item => ({ ...item, category }))
        );

        
        fuseRef.current = new Fuse(allItems, {
          keys: ['name', 'category'],
          threshold: 0.3, 
          includeScore: true,
          includeMatches: true,
          minMatchCharLength: 2
        });

        setError(null);
      } catch (err) {
        console.error('Failed to load catalog:', err);
        setError('Failed to load taste catalog');
      } finally {
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
          'filter_type': 'urn:entity:place',
          'filter_location_query': userLocation,
          'filter_location_radius': '10000',
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
              type: 'trending',
              category: 'trending'
            }));
          
          setTrendingTastes(trending);
        }
      } catch (err) {
        console.warn('Failed to fetch trending tastes:', err);
        
        setTrendingTastes([
          { id: 'trending_artisan_coffee', name: 'Artisan Coffee', type: 'trending', category: 'trending' },
          { id: 'trending_indie_music', name: 'Indie Music', type: 'trending', category: 'trending' },
          { id: 'trending_street_art', name: 'Street Art', type: 'trending', category: 'trending' }
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
          id: entity.id || `remote_${entity.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
          name: entity.name,
          type: 'remote',
          category: entity.type || 'general'
        }));
      }
      return [];
    } catch (err) {
      console.error('Remote search failed:', err);
      throw new Error('Search temporarily unavailable');
    }
  }, [API_BASE]);

  /**
   * Combined search (local + remote)
   */
  const searchTastes = useCallback(async (query) => {
    if (!query.trim()) {
      return [];
    }

    
    const localResults = searchLocalCatalog(query);
    
    
    if (localResults.length >= 3) {
      return localResults.slice(0, 8);
    }

    
    try {
      const remoteResults = await searchRemoteQloo(query);
      const combinedResults = [...localResults, ...remoteResults];
      
      
      remoteResults.forEach(taste => {
        setRemoteTastes(prev => {
          const exists = prev.find(t => t.id === taste.id);
          return exists ? prev : [...prev, taste];
        });
      });
      
      return combinedResults.slice(0, 8);
    } catch (err) {
      throw err;
    }
  }, [searchLocalCatalog, searchRemoteQloo]);

  /**
   * Get all categories
   */
  const getCategories = useCallback(() => {
    return Object.keys(catalog);
  }, [catalog]);

  /**
   * Get tastes by category
   */
  const getTastesByCategory = useCallback((category) => {
    return catalog[category] || [];
  }, [catalog]);

  /**
   * Get all tastes (flattened)
   */
  const getAllTastes = useCallback(() => {
    return Object.entries(catalog).flatMap(([category, items]) =>
      items.map(item => ({ ...item, category, type: 'local' }))
    );
  }, [catalog]);

  return {
    
    catalog,
    trendingTastes,
    remoteTastes,
    
    
    isLoading,
    error,
    setError,
    
    
    searchLocalCatalog,
    searchRemoteQloo,
    searchTastes,
    
    
    getCategories,
    getTastesByCategory,
    getAllTastes,
    
    
    hasCatalog: Object.keys(catalog).length > 0,
    hasTrending: trendingTastes.length > 0
  };
};
