import { useState, useCallback, useRef } from 'react';

/**
 * useMapData - Hook for managing heat map data and caching
 * Handles fetching Qloo insights for hex grid and caching results
 */
export const useMapData = (selectedTastes = []) => {
  const [heatData, setHeatData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  
  const cacheRef = useRef(new Map());
  const abortControllerRef = useRef(null);

  
  const generateHexGrid = useCallback((center, zoom, radius = 400) => {
    const hexes = [];
    const gridSize = Math.max(3, Math.min(8, 12 - zoom)); 
    
    
    const lat = center[0];
    const lng = center[1];
    const latRange = 0.01 * (2 ** (12 - zoom)); 
    const lngRange = 0.01 * (2 ** (12 - zoom));
    
    
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        
        const rowOffset = (i % 2) * 0.5;
        const hexLat = lat + (i * latRange * 0.866); 
        const hexLng = lng + ((j + rowOffset) * lngRange);
        
        const hexId = `${hexLat.toFixed(4)}_${hexLng.toFixed(4)}`;
        
        hexes.push({
          id: hexId,
          coords: { lat: hexLat, lng: hexLng },
          lift: 0 
        });
      }
    }
    
    return hexes;
  }, []);

  
  const createCacheKey = useCallback((coords, tasteIds) => {
    const coordsKey = `${coords.lat.toFixed(4)}_${coords.lng.toFixed(4)}`;
    const tastesKey = tasteIds.sort().join('|');
    return `${coordsKey}|${tastesKey}`;
  }, []);

  
  const fetchHexInsights = useCallback(async (coords, tasteIds) => {
    const cacheKey = createCacheKey(coords, tasteIds);
    
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        'filter.type': 'urn:entity:place',
        'filter.location.query': `${coords.lat},${coords.lng}`,
        'filter.location.radius': '400',
        'signal.interests.tags': tasteIds.join(','),
        'limit': '0' 
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
      const avgLift = clusters.length > 0 
        ? clusters.reduce((sum, cluster) => sum + cluster.lift_score, 0) / clusters.length
        : Math.random() * 60 + 10; 

      const result = { lift: avgLift, clusters };
      
      
      cacheRef.current.set(cacheKey, result);
      
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      
      console.warn('Failed to fetch hex insights:', error);
      
      
      const fallbackLift = Math.random() * 60 + 10;
      const result = { lift: fallbackLift, clusters: [] };
      
      cacheRef.current.set(cacheKey, result);
      return result;
    }
  }, [createCacheKey]);

  
  const generateHeatData = useCallback(async (center, zoom) => {
    if (selectedTastes.length < 3) {
      setHeatData([]);
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
      const hexGrid = generateHexGrid(center, zoom);
      const tasteIds = selectedTastes.map(taste => taste.id);
      
      
      const hexPromises = hexGrid.map(async (hex) => {
        try {
          const insights = await fetchHexInsights(hex.coords, tasteIds);
          return {
            ...hex,
            lift: insights.lift,
            clusters: insights.clusters
          };
        } catch (error) {
          if (error.name === 'AbortError') {
            throw error;
          }
          
          
          return {
            ...hex,
            lift: Math.random() * 60 + 10,
            clusters: []
          };
        }
      });

      
      const batchSize = 10;
      const results = [];
      
      for (let i = 0; i < hexPromises.length; i += batchSize) {
        
        if (controller.signal.aborted) {
          return;
        }
        
        const batch = hexPromises.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch);
        results.push(...batchResults);
        
        
        if (!controller.signal.aborted) {
          setHeatData([...results]);
        }
        
        
        if (i + batchSize < hexPromises.length && !controller.signal.aborted) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (!controller.signal.aborted) {
        setHeatData(results);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error generating heat data:', error);
        setError('Failed to load cultural heat map');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [selectedTastes, generateHexGrid, fetchHexInsights]);

  
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  
  const getCachedInsight = useCallback((coords, tasteIds) => {
    const cacheKey = createCacheKey(coords, tasteIds);
    return cacheRef.current.get(cacheKey);
  }, [createCacheKey]);

  return {
    heatData,
    loading,
    error,
    generateHeatData,
    clearCache,
    getCachedInsight
  };
};
