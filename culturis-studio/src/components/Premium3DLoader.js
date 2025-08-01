import React from 'react';
import './Premium3DLoader.css';

/**
 * Premium3DLoader - Beautiful 3D loading animation for map initialization
 */
const Premium3DLoader = ({ message = "Initializing 3D Map..." }) => {
  return (
    <div className="premium-3d-loader">
      <div className="loader-background">
        <div className="floating-spheres">
          <div className="sphere sphere-1"></div>
          <div className="sphere sphere-2"></div>
          <div className="sphere sphere-3"></div>
          <div className="sphere sphere-4"></div>
          <div className="sphere sphere-5"></div>
        </div>
        
        <div className="loader-content">
          <div className="logo-3d">
            <div className="logo-face front">🗺️</div>
            <div className="logo-face back">🎯</div>
            <div className="logo-face right">📍</div>
            <div className="logo-face left">🌟</div>
            <div className="logo-face top">✨</div>
            <div className="logo-face bottom">💫</div>
          </div>
          
          <h2 className="loader-title">CultureCanvas</h2>
          <p className="loader-message">{message}</p>
          
          <div className="progress-bar">
            <div className="progress-fill"></div>
            <div className="progress-glow"></div>
          </div>
          
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium3DLoader;
