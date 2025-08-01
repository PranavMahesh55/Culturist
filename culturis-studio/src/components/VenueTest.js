import React, { useState, useEffect } from 'react';

const VenueTest = () => {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVenues = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Fetching venues...');
      
      const response = await fetch('http://localhost:8000/api/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tastes: [
            {name: 'specialty coffee', type: 'food_beverage'},
            {name: 'contemporary art', type: 'visual_arts'}
          ],
          location: 'New York, NY',
          coordinates: [40.7589, -73.9851]
        })
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📦 Response data:', data);
      
      if (data.success && data.venues) {
        setVenues(data.venues);
        console.log('✅ Real venue names loaded:', data.venues.map(v => v.name));
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Venue API Test</h1>
      
      <button onClick={fetchVenues} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Real Venues'}
      </button>
      
      {error && (
        <div style={{ color: 'red', margin: '10px 0' }}>
          Error: {error}
        </div>
      )}
      
      {venues.length > 0 && (
        <div>
          <h2>Real Venue Names ({venues.length} found):</h2>
          <ul>
            {venues.map(venue => (
              <li key={venue.id}>
                <strong>{venue.name}</strong> ({venue.type}) - {venue.affinity}% match
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default VenueTest;
