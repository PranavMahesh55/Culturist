import React, { useState } from 'react';
import TasteSeedPicker from './TasteSeedPicker';

/**
 * Demo page for testing the TasteSeedPicker component
 */
const TasteSeedPickerDemo = () => {
  const [selectedTastes, setSelectedTastes] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const handleSelectionComplete = (tastes) => {
    console.log('Selected tastes:', tastes);
    setSelectedTastes(tastes);
    setShowResults(true);
  };

  const handleReset = () => {
    setSelectedTastes([]);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Your Cultural Map</h1>
        <p>Based on your selected tastes:</p>
        
        <div style={{ 
          background: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          {selectedTastes.map((taste, index) => (
            <div key={taste.id} style={{ 
              marginBottom: '8px',
              padding: '8px 12px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <strong>{taste.name}</strong>
              <br />
              <small style={{ color: '#6c757d' }}>
                ID: {taste.id} | Type: {taste.type} | Category: {taste.category}
              </small>
            </div>
          ))}
        </div>

        <button 
          onClick={handleReset}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f5f5f5', 
      padding: '24px' 
    }}>
      <TasteSeedPicker 
        onSelectionComplete={handleSelectionComplete}
        userLocation="Brooklyn, NY"
        minSelections={3}
      />
    </div>
  );
};

export default TasteSeedPickerDemo;
