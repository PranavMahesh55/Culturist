import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for managing taste selection state
 * 
 * @param {number} minSelections - Minimum number of tastes required
 * @param {function} onSelectionChange - Callback when selection changes
 * @returns {object} Taste selection state and methods
 */
export const useTasteSelection = (minSelections = 3, onSelectionChange = null) => {
  const [selectedTastes, setSelectedTastes] = useState([]);

  
  const addTaste = useCallback((taste) => {
    setSelectedTastes(prev => {
      
      const exists = prev.find(t => t.id === taste.id);
      if (exists) return prev;
      
      const newSelection = [...prev, taste];
      return newSelection;
    });
  }, []);

  
  const removeTaste = useCallback((tasteId) => {
    setSelectedTastes(prev => prev.filter(t => t.id !== tasteId));
  }, []);

  
  const clearSelection = useCallback(() => {
    setSelectedTastes([]);
  }, []);

  
  const isTasteSelected = useCallback((tasteId) => {
    return selectedTastes.some(t => t.id === tasteId);
  }, [selectedTastes]);

  
  const hasMinimumSelections = selectedTastes.length >= minSelections;

  
  const getSelectionByType = useCallback((type) => {
    return selectedTastes.filter(t => t.type === type);
  }, [selectedTastes]);

  
  const getSelectionByCategory = useCallback((category) => {
    return selectedTastes.filter(t => t.category === category);
  }, [selectedTastes]);

  
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedTastes);
    }
  }, [selectedTastes, onSelectionChange]);

  return {
    selectedTastes,
    addTaste,
    removeTaste,
    clearSelection,
    isTasteSelected,
    hasMinimumSelections,
    getSelectionByType,
    getSelectionByCategory,
    selectionCount: selectedTastes.length,
    remainingSelections: Math.max(0, minSelections - selectedTastes.length)
  };
};
