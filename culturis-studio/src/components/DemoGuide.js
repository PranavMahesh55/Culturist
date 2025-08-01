import React, { useState } from 'react';
import './DemoGuide.css';

/**
 * DemoGuide - Interactive guide for the 3-section Paint My Map interface
 */
const DemoGuide = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Culturis 🎨",
      content: "Discover cultural venues with AI-powered recommendations and intelligent route planning!",
      highlight: "intro"
    },
    {
      title: "Navigation Panel 🗺️",
      content: "Search for any city or location. Try typing 'San Francisco' or 'Tokyo' and hit search to explore cultural hotspots!",
      highlight: "navigation"
    },
    {
      title: "Interactive Map View 🌍",
      content: "Numbered markers show cultural venues based on your tastes. Click any marker to see venue details and add to your route!",
      highlight: "map"
    },
    {
      title: "AI Cultural Assistant 🤖",
      content: "Tell the AI what you love - 'I enjoy jazz clubs and art galleries' - and watch new personalized venues appear instantly!",
      highlight: "chatbot"
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="demo-guide-overlay">
      <div className="demo-guide-modal">
        <div className="demo-guide-header">
          <h2>{steps[currentStep].title}</h2>
          <button className="close-guide" onClick={onClose}>×</button>
        </div>
        
        <div className="demo-guide-content">
          <p>{steps[currentStep].content}</p>
        </div>
        
        <div className="demo-guide-progress">
          <div className="progress-dots">
            {steps.map((_, index) => (
              <div 
                key={index} 
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>
        
        <div className="demo-guide-actions">
          <button 
            className="guide-btn secondary" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </button>
          <button 
            className="guide-btn primary" 
            onClick={nextStep}
          >
            {currentStep === steps.length - 1 ? 'Start Exploring!' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoGuide;
