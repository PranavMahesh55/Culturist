import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapsTest = () => {
  const mapRef = useRef(null);
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState(null);

  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        console.log('🧪 Testing Google Maps API...');
        console.log('🔑 API Key:', GOOGLE_MAPS_API_KEY ? `${GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'MISSING');

        if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
          throw new Error('API key is missing or not configured');
        }

        setStatus('Loading Google Maps API...');

        const loader = new Loader({
          apiKey: GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: []
        });

        console.log('📦 Loading API...');
        const google = await loader.load();
        console.log('✅ API loaded successfully');

        setStatus('Creating map...');

        if (mapRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 40.7589, lng: -73.9851 },
            zoom: 15,
            mapTypeId: 'roadmap'
          });

          console.log('✅ Map created successfully');
          setStatus('✅ Google Maps working correctly!');
        }
      } catch (err) {
        console.error('❌ Google Maps test failed:', err);
        setError(err.message);
        setStatus('❌ Failed to load Google Maps');
      }
    };

    testGoogleMaps();
  }, [GOOGLE_MAPS_API_KEY]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Google Maps API Test</h2>
      <p><strong>Status:</strong> {status}</p>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '400px', 
          border: '1px solid #ccc',
          marginTop: '20px'
        }} 
      />
    </div>
  );
};

export default GoogleMapsTest;
