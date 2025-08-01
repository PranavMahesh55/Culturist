import React from 'react';
import img1 from '../imgs/img1.png';
import img2 from '../imgs/img2.png';
import img3 from '../imgs/img3.png';
import img4 from '../imgs/img4.png';
import img6 from '../imgs/img6.png';
import img7 from '../imgs/img7.png';

const WelcomePage = ({ onNext }) => {
  const imageFeatures = [
    { src: img1, text: 'Brainstorm ideas', icon: '💡', position: { top: '15%', left: '10%' } },
    { src: img2, text: 'Plan a trip', icon: '🗺️', position: { top: '30%', right: '15%' } },
    { src: img3, text: 'Write a story', icon: '✍️', position: { top: '45%', left: '5%' } },
    { src: img4, text: 'Name your dog', icon: '🐕', position: { top: '10%', right: '25%' } },
    { src: img6, text: 'Custom podcast', icon: '🎧', position: { top: '55%', right: '20%' } },
    { src: img7, text: 'Code', icon: '💻', position: { top: '65%', left: '15%' } }
  ];

  return (
    <div className="welcome-page">
      {}
      <div className="floating-images">
        {imageFeatures.map((feature, index) => (
          <div 
            key={index} 
            className="floating-image-container"
            style={{
              position: 'absolute',
              top: feature.position.top,
              left: feature.position.left,
              right: feature.position.right,
              zIndex: 1
            }}
          >
            <img src={feature.src} alt={feature.text} className="floating-image" />
            <div className={`text-bubble bubble-${index}`}>
              <span className="bubble-icon">{feature.icon}</span>
              <span className="bubble-text">{feature.text}</span>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="welcome-content">
        <div className="welcome-header">
          <h1 className="welcome-title">Explore</h1>
          <h2 className="welcome-subtitle">with Culturis</h2>
        </div>
        
        <div className="welcome-actions">
          <button className="action-button primary" onClick={onNext}>
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
