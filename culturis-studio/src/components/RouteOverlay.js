import React, { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * RouteOverlay - Displays optimized route between venues
 * Calculates and renders route polyline with animations
 */
const RouteOverlay = ({ 
  venues = [], 
  onRouteCalculated = () => {} 
}) => {
  const map = useMap();
  const [route, setRoute] = useState(null);
  const [routeDistance, setRouteDistance] = useState(0);
  const [routeTime, setRouteTime] = useState(0);
  const routeLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  
  const calculateOptimalRoute = (venueList) => {
    if (venueList.length < 2) return venueList;

    
    const sortedVenues = [...venueList].sort((a, b) => {
      
      if (Math.abs(a.affinity - b.affinity) > 5) {
        return b.affinity - a.affinity;
      }
      
      
      const centerLat = venueList.reduce((sum, v) => sum + v.coords[0], 0) / venueList.length;
      const centerLng = venueList.reduce((sum, v) => sum + v.coords[1], 0) / venueList.length;
      
      const distA = Math.sqrt(
        Math.pow(a.coords[0] - centerLat, 2) + Math.pow(a.coords[1] - centerLng, 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.coords[0] - centerLat, 2) + Math.pow(b.coords[1] - centerLng, 2)
      );
      
      return distA - distB;
    });

    
    return sortedVenues.slice(0, Math.min(6, sortedVenues.length));
  };

  
  const calculateDistance = (coord1, coord2) => {
    const R = 6371e3; 
    const φ1 = coord1[0] * Math.PI / 180;
    const φ2 = coord2[0] * Math.PI / 180;
    const Δφ = (coord2[0] - coord1[0]) * Math.PI / 180;
    const Δλ = (coord2[1] - coord1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; 
  };

  
  const calculateRouteMetrics = (routeVenues) => {
    if (routeVenues.length < 2) return { distance: 0, time: 0 };

    let totalDistance = 0;
    for (let i = 0; i < routeVenues.length - 1; i++) {
      totalDistance += calculateDistance(
        routeVenues[i].coords,
        routeVenues[i + 1].coords
      );
    }

    
    const walkingTime = (totalDistance / 1000) / 5 * 60; 
    const venueTime = routeVenues.length * 15; 
    const totalTime = walkingTime + venueTime;

    return {
      distance: totalDistance,
      time: totalTime
    };
  };

  
  const createRoutePolyline = (routeVenues) => {
    if (routeVenues.length < 2) return null;

    const coordinates = routeVenues.map(venue => venue.coords);
    
    
    const polyline = L.polyline(coordinates, {
      color: '#667eea',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 10',
      interactive: false, 
      className: 'route-polyline'
    });

    
    let dashOffset = 0;
    const animatePolyline = () => {
      dashOffset += 1;
      if (polyline._path) {
        polyline._path.style.strokeDashoffset = dashOffset;
        polyline._path.style.pointerEvents = 'none'; 
      }
      requestAnimationFrame(animatePolyline);
    };
    animatePolyline();

    return polyline;
  };

  
  const createVenueMarkers = (routeVenues) => {
    return routeVenues.map((venue, index) => {
      const isStart = index === 0;
      const isEnd = index === routeVenues.length - 1;
      
      
      const iconHtml = `
        <div class="route-marker ${isStart ? 'start' : isEnd ? 'end' : 'waypoint'}">
          <div class="marker-number">${index + 1}</div>
          <div class="marker-pulse"></div>
        </div>
      `;
      
      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-route-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker(venue.coords, { icon: customIcon });
      
      
      marker.bindPopup(`
        <div class="route-popup">
          <h4>${venue.name}</h4>
          <p class="venue-position">${isStart ? 'Start' : isEnd ? 'End' : `Stop ${index}`}</p>
          <p class="venue-affinity">${venue.affinity?.toFixed(1)}% cultural match</p>
          ${venue.keywords ? `<p class="venue-keywords">${venue.keywords.slice(0, 2).join(', ')}</p>` : ''}
        </div>
      `, {
        className: 'route-venue-popup'
      });

      return marker;
    });
  };

  
  useEffect(() => {
    if (!map || venues.length < 2) {
      
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      if (markersLayerRef.current) {
        map.removeLayer(markersLayerRef.current);
        markersLayerRef.current = null;
      }
      setRoute(null);
      return;
    }

    
    const optimizedVenues = calculateOptimalRoute(venues);
    const metrics = calculateRouteMetrics(optimizedVenues);
    
    setRoute(optimizedVenues);
    setRouteDistance(metrics.distance);
    setRouteTime(metrics.time);

    
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
    }
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
    }

    
    const polyline = createRoutePolyline(optimizedVenues);
    if (polyline) {
      routeLayerRef.current = polyline;
      map.addLayer(polyline);
    }

    
    const markers = createVenueMarkers(optimizedVenues);
    const markerGroup = L.layerGroup(markers);
    markersLayerRef.current = markerGroup;
    map.addLayer(markerGroup);

    
    if (optimizedVenues.length > 0) {
      const bounds = L.latLngBounds(optimizedVenues.map(v => v.coords));
      map.fitBounds(bounds, { padding: [20, 20] });
    }

    
    onRouteCalculated({
      venues: optimizedVenues,
      distance: metrics.distance,
      time: metrics.time
    });

    
    const style = document.createElement('style');
    style.textContent = `
      .route-polyline {
        animation: dash 2s linear infinite;
      }
      
      @keyframes dash {
        to {
          stroke-dashoffset: -20;
        }
      }
      
      .route-marker {
        position: relative;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        width: 30px;
        height: 30px;
      }
      
      .route-marker.start {
        background: #27ae60;
      }
      
      .route-marker.end {
        background: #e74c3c;
      }
      
      .route-marker.waypoint {
        background: #667eea;
      }
      
      .marker-number {
        font-size: 12px;
        z-index: 2;
      }
      
      .marker-pulse {
        position: absolute;
        top: -5px;
        left: -5px;
        right: -5px;
        bottom: -5px;
        border-radius: 50%;
        border: 2px solid currentColor;
        opacity: 0.6;
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 0.6;
        }
        100% {
          transform: scale(1.5);
          opacity: 0;
        }
      }
      
      .route-popup {
        text-align: center;
        min-width: 150px;
      }
      
      .venue-position {
        font-weight: bold;
        color: #667eea;
        margin: 4px 0;
      }
      
      .venue-affinity {
        color: #7f8c8d;
        font-size: 12px;
        margin: 4px 0;
      }
      
      .venue-keywords {
        font-size: 11px;
        color: #95a5a6;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };

  }, [map, venues, onRouteCalculated, calculateOptimalRoute, calculateRouteMetrics, createRoutePolyline, createVenueMarkers]);

  
  useEffect(() => {
    return () => {
      if (routeLayerRef.current && map) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }
      if (markersLayerRef.current && map) {
        map.removeLayer(markersLayerRef.current);
        markersLayerRef.current = null;
      }
      
      
      if (map) {
        setTimeout(() => {
          map.scrollWheelZoom.enable();
          map.doubleClickZoom.enable();
          map.touchZoom.enable();
          map.dragging.enable();
          map.boxZoom.enable();
          map.keyboard.enable();
          console.log('🗺️ RouteOverlay cleanup: Map interactions restored');
        }, 100);
      }
    };
  }, [map]);

  
  if (route && route.length > 0) {
    return (
      <div className="route-info">
        <div className="route-summary">
          <h4>Cultural Route</h4>
          <div className="route-metrics">
            <span className="metric">
              <strong>{route.length}</strong> venues
            </span>
            <span className="metric">
              <strong>{(routeDistance / 1000).toFixed(1)}km</strong> distance
            </span>
            <span className="metric">
              <strong>{Math.round(routeTime)}min</strong> estimated time
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default RouteOverlay;
