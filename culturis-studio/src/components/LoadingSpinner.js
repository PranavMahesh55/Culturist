import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner - Animated loading screen for map initialization
 * Uses user's selected taste colors for personalized loading experience
 */
const LoadingSpinner = ({ 
  colors = ['#667eea', '#764ba2'], 
  message = 'Loading...' 
}) => {
  
  const gradientColors = colors.length > 1 
    ? colors.slice(0, 3) 
    : ['#667eea', '#764ba2', '#f093fb'];

  const gradientStyle = {
    background: `linear-gradient(45deg, ${gradientColors.join(', ')})`
  };

  return (
    <div className="loading-spinner-overlay">
      <div className="loading-content">
        {}
        <div className="loading-swirl">
          <div className="swirl-ring ring-1" style={gradientStyle}></div>
          <div className="swirl-ring ring-2" style={gradientStyle}></div>
          <div className="swirl-ring ring-3" style={gradientStyle}></div>
          <div className="swirl-center" style={gradientStyle}>
            <span className="swirl-icon">🎨</span>
          </div>
        </div>

        {}
        <div className="loading-message">
          <h2>{message}</h2>
          <div className="loading-dots">
            <span className="dot" style={{ backgroundColor: gradientColors[0] }}></span>
            <span className="dot" style={{ backgroundColor: gradientColors[1] }}></span>
            <span className="dot" style={{ backgroundColor: gradientColors[2] || gradientColors[0] }}></span>
          </div>
        </div>

        {}
        {colors.length > 0 && (
          <div className="taste-preview">
            <p>Analyzing your cultural tastes</p>
            <div className="taste-colors">
              {colors.slice(0, 5).map((color, index) => (
                <div 
                  key={index}
                  className="taste-color"
                  style={{ backgroundColor: color }}
                ></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
