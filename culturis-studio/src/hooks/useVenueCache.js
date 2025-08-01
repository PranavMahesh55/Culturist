import { useState, useCallback, useRef } from 'react';

/**
 * useVenueCache - Hook for managing venue data and caching
 * Handles fetching detailed venue information for hex locations
 */
export const useVenueCache = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  
  const createVenueCacheKey = useCallback((coords, tasteIds, filters) => {
    const coordsKey = `${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
    const tastesKey = tasteIds.sort().join('|');
    const filtersKey = Object.entries(filters)
      .filter(([, value]) => value != null && value !== false)
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join('|');
    
    return `venues_${coordsKey}|${tastesKey}|${filtersKey}`;
  }, []);

  
  const filtersToApiParams = useCallback((filters) => {
    const params = {};
    
    
    if (filters.budget) {
      switch (filters.budget) {
        case 'low':
          params['filter.tags'] = 'urn:tag:price:inexpensive';
          break;
        case 'medium':
          params['filter.tags'] = 'urn:tag:price:moderate';
          break;
        case 'high':
          params['filter.tags'] = 'urn:tag:price:expensive';
          break;
        default:
          
          break;
      }
    }
    
    
    if (filters.indoorOutdoor) {
      const existing = params['filter.tags'] || '';
      const separator = existing ? ',' : '';
      
      if (filters.indoorOutdoor === 'outdoor') {
        params['filter.tags'] = `${existing}${separator}urn:tag:atmosphere:outdoor`;
      } else if (filters.indoorOutdoor === 'indoor') {
        params['filter.tags'] = `${existing}${separator}urn:tag:atmosphere:indoor`;
      }
    }
    
    
    if (filters.openNow) {
      
      
    }
    
    return params;
  }, []);

  
  const generateMockVenues = useCallback((coords, tastes) => {
    const mockVenues = [
      { name: 'Local Art Gallery', category: 'gallery', affinity: 85 },
      { name: 'Indie Coffee House', category: 'cafe', affinity: 78 },
      { name: 'Vintage Record Store', category: 'shop', affinity: 82 },
      { name: 'Cultural Center', category: 'venue', affinity: 76 },
      { name: 'Artisan Bakery', category: 'restaurant', affinity: 71 },
      { name: 'Underground Bar', category: 'bar', affinity: 68 },
      { name: 'Design Studio', category: 'studio', affinity: 73 },
      { name: 'Live Music Venue', category: 'music', affinity: 80 }
    ];

    return mockVenues.map((venue, index) => ({
      id: `mock_${venue.name.replace(/\s+/g, '_')}_${index}`,
      name: venue.name,
      coords: [
        coords.lat + (Math.random() - 0.5) * 0.008,
        coords.lng + (Math.random() - 0.5) * 0.008
      ],
      affinity: venue.affinity,
      category: venue.category,
      keywords: tastes.slice(0, 2).map(taste => taste.name),
      clusterName: 'Local Culture',
      distance: Math.random() * 350,
      popularity: Math.random(),
      lift: venue.affinity
    }));
  }, []);

  
  const fetchVenues = useCallback(async (coords, tastes, filters = {}) => {
    try {
      const tasteIds = tastes.map(taste => taste.id);
      const filterParams = filtersToApiParams(filters);
      
      const params = new URLSearchParams({
        'filter.type': 'urn:entity:place',
        'filter.location.query': `${coords.lat},${coords.lng}`,
        'filter.location.radius': '400',
        'signal.interests.tags': tasteIds.join(','),
        'limit': '25',
        ...filterParams
      });

      
      const fetchOptions = {};
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        fetchOptions.signal = abortControllerRef.current.signal;
      }

      const response = await fetch(`http:

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      
      const clusters = data.qlooData?.qloo_json?.clusters || [];
      const venueList = [];
      
      clusters.forEach((cluster, clusterIndex) => {
        cluster.example_entities?.forEach((entity, entityIndex) => {
          
          const entityCoords = [
            coords.lat + (Math.random() - 0.5) * 0.01,
            coords.lng + (Math.random() - 0.5) * 0.01
          ];
          
          venueList.push({
            id: entity.name ? `${entity.name.replace(/\s+/g, '_')}_${clusterIndex}_${entityIndex}` : `venue_${clusterIndex}_${entityIndex}`,
            name: entity.name || 'Unknown Venue',
            coords: entityCoords,
            affinity: entity.affinity || 0,
            category: entity.type?.split(':').pop() || 'venue',
            keywords: entity.keywords || [],
            clusterName: cluster.cluster_name,
            distance: Math.random() * 400, 
            popularity: Math.random(), 
            lift: cluster.lift_score || 0
          });
        });
      });

      
      return venueList
        .sort((a, b) => b.affinity - a.affinity)
        .slice(0, 20);
        
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      
      console.warn('Failed to fetch venues:', error);
      
      
      return generateMockVenues(coords, tastes);
    }
  }, [filtersToApiParams, generateMockVenues]);

  
  const loadVenues = useCallback(async (coords, tastes, filters = {}) => {
    if (tastes.length === 0) {
      setVenues([]);
      return;
    }

    setLoading(true);
    setError(null);

    
    if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
      abortControllerRef.current.abort();
    }
    
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const tasteIds = tastes.map(taste => taste.id);
      const cacheKey = createVenueCacheKey(coords, tasteIds, filters);
      
      
      if (cacheRef.current.has(cacheKey)) {
        const cachedVenues = cacheRef.current.get(cacheKey);
        if (!controller.signal.aborted) {
          setVenues(cachedVenues);
          setLoading(false);
        }
        return cachedVenues;
      }

      
      const venueData = await fetchVenues(coords, tastes, filters);
      
      
      if (!controller.signal.aborted) {
        
        cacheRef.current.set(cacheKey, venueData);
        
        setVenues(venueData);
      }
      return venueData;
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading venues:', error);
        if (!controller.signal.aborted) {
          setError('Failed to load venues');
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [createVenueCacheKey, fetchVenues]);

  
  const clearVenues = useCallback(() => {
    setVenues([]);
    setError(null);
  }, []);

  
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  
  const getCachedVenues = useCallback((coords, tasteIds, filters) => {
    const cacheKey = createVenueCacheKey(coords, tasteIds, filters);
    return cacheRef.current.get(cacheKey);
  }, [createVenueCacheKey]);

  return {
    venues,
    loading,
    error,
    loadVenues,
    clearVenues,
    clearCache,
    getCachedVenues
  };
};
