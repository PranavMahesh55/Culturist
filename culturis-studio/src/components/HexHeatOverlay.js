import { useEffect, useRef, useCallback } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * HexHeatOverlay - Renders hexagonal heat overlay on the map
 * Shows cultural affinity data as colored hexagons
 */
const HexHeatOverlay = ({ 
  heatData = [], 
  focusedHex = null, 
  onHexTap = () => {}, 
  tasteHash = '' 
}) => {
  const map = useMap();
  const layerGroupRef = useRef(null);
  const hexagonsRef = useRef(new Map());

  
  const generateHexPath = useCallback((center, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 - 30) * Math.PI / 180; 
      const x = center.lng + (radius * Math.cos(angle)) / 111320; 
      const y = center.lat + (radius * Math.sin(angle)) / 110540;
      points.push([y, x]);
    }
    return points;
  }, []);

  
  const getHexColor = useCallback((lift, isFocused = false) => {
    if (isFocused) {
      return '#2c3e50'; 
    }
    
    if (lift >= 40) {
      return '#e74c3c'; 
    } else if (lift >= 20) {
      return '#f39c12'; 
    } else {
      return '#bdc3c7'; 
    }
  }, []);

  
  const getHexOpacity = useCallback((lift, isFocused = false, isFaded = false) => {
    if (isFaded) return 0.2;
    if (isFocused) return 0.9;
    
    
    const baseOpacity = Math.max(0.3, lift / 100);
    return Math.min(0.8, baseOpacity);
  }, []);

  
  const createHexagon = useCallback((hexData) => {
    const { id, coords, lift } = hexData;
    const isFocused = focusedHex && focusedHex.id === id;
    const isFaded = focusedHex && focusedHex.id !== id;
    
    const hexPath = generateHexPath(coords, 200); 
    const color = getHexColor(lift, isFocused);
    const opacity = getHexOpacity(lift, isFocused, isFaded);
    
    const polygon = L.polygon(hexPath, {
      fillColor: color,
      fillOpacity: opacity,
      color: color,
      weight: isFocused ? 3 : 1,
      opacity: opacity + 0.2,
      interactive: true,
      className: `hex-polygon ${isFocused ? 'focused' : ''}`
    });

    
    polygon.on('click', (e) => {
      L.DomEvent.stopPropagation(e);
      onHexTap(coords, hexData);
    });

    
    polygon.on('mouseover', () => {
      if (!isFocused) {
        polygon.setStyle({
          weight: 2,
          opacity: opacity + 0.3
        });
      }
    });

    polygon.on('mouseout', () => {
      if (!isFocused) {
        polygon.setStyle({
          weight: 1,
          opacity: opacity + 0.2
        });
      }
    });

    
    polygon.bindTooltip(`
      <div class="hex-tooltip">
        <strong>Cultural Affinity: ${lift.toFixed(1)}%</strong>
        <br>
        <small>Click to explore venues</small>
      </div>
    `, {
      direction: 'top',
      className: 'custom-tooltip'
    });

    return polygon;
  }, [focusedHex, generateHexPath, getHexColor, getHexOpacity, onHexTap]);

  
  useEffect(() => {
    if (!map || !layerGroupRef.current) return;

    
    layerGroupRef.current.clearLayers();
    hexagonsRef.current.clear();

    
    heatData.forEach((hexData) => {
      const hexagon = createHexagon(hexData);
      hexagonsRef.current.set(hexData.id, hexagon);
      layerGroupRef.current.addLayer(hexagon);
    });

    
    setTimeout(() => {
      const hexElements = document.querySelectorAll('.hex-polygon');
      hexElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 50}ms`;
        element.classList.add('hex-fade-in');
      });
    }, 100);

  }, [map, heatData, createHexagon, tasteHash]);

  
  useEffect(() => {
    if (!map) return;

    
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    
    const style = document.createElement('style');
    style.textContent = `
      .hex-polygon {
        transition: all 0.3s ease;
        opacity: 0;
      }
      
      .hex-polygon.hex-fade-in {
        animation: hexFadeIn 0.6s ease forwards;
      }
      
      .hex-polygon.focused {
        filter: drop-shadow(0 0 8px rgba(44, 62, 80, 0.6));
        z-index: 1000;
      }
      
      @keyframes hexFadeIn {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      
      .custom-tooltip {
        background: rgba(44, 62, 80, 0.95);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
      
      .custom-tooltip::before {
        border-top-color: rgba(44, 62, 80, 0.95) !important;
      }
      
      .hex-tooltip {
        text-align: center;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (layerGroupRef.current) {
        map.removeLayer(layerGroupRef.current);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [map]);

  return null; 
};

export default HexHeatOverlay;
