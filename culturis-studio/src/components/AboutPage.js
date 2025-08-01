import React, { useState } from 'react';

const AboutPage = ({ onNext, onBack, setFirstName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    agreeToTerms: false,
    firstName: ''
  });

  const handleCheckboxChange = () => {
    setFormData(prev => ({ ...prev, agreeToTerms: !prev.agreeToTerms }));
  };

  const handleNameChange = (e) => {
    setFormData(prev => ({ ...prev, firstName: e.target.value }));
  };

  const canProceed = () => {
    if (currentStep === 0) return formData.agreeToTerms;
    if (currentStep === 1) return formData.firstName.trim() !== '';
    return false;
  };

  async function submitOnBoarding() {
    try {
        console.log('Submitting onboarding data:', formData);
        const resp = await fetch('http://localhost:8000/api/onboarding', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        const data = await resp.json();
        if (data.success) {
            setFirstName(formData.firstName);
            onNext();
        } else {
            console.error('Error submitting onboarding:', data.error);
        }
    } catch (err) {
        console.error('Error submitting onboarding:', err);
    }
  }

  const handleContinue = () => {
    if (currentStep < 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitOnBoarding();
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="conversation-header">
          <h1 className="greeting">Hello! I'm Culturis. 🤝</h1>
          <h2 className="intro-text">A couple of things first...</h2>
        </div>

        <div className="conversation-body">
          {currentStep === 0 && (
            <div className="step-content">
              <div className="info-points">
                <div className="info-point">
                  <span>• We take data privacy seriously, as described in our </span>
                  <button className="privacy-link" type="button">Privacy Policy</button>
                  <span>.</span>
                </div>
                <div className="info-point">
                  <span>• Our chats are not shared for ads or marketing. You can learn more about our service in our </span>
                  <button className="terms-link" type="button">Terms of Service</button>
                  <span>.</span>
                </div>
              </div>

              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={formData.agreeToTerms}
                    onChange={handleCheckboxChange}
                    className="checkbox-input"
                  />
                  <span className="checkmark"></span>
                  I agree to the Terms of Service and have read the Privacy Policy
                </label>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="step-content">
              <div className="name-section">
                <h3 className="name-title">Let's get started</h3>
                <p className="name-subtitle">What should we call you?</p>
                
                <div className="professional-input-container">
                  <label htmlFor="firstName" className="input-label">
                    First Name
                  </label>
                  <input 
                    id="firstName"
                    type="text" 
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={handleNameChange}
                    className="professional-input"
                    autoComplete="given-name"
                    maxLength="50"
                  />
                  {formData.firstName.trim() && (
                    <div className="input-feedback">
                      <span className="feedback-icon">✓</span>
                      <span className="feedback-text">Looks good!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="conversation-footer">
          {currentStep < 1 && (
            <button 
              className={`continue-button ${canProceed() ? 'enabled' : 'disabled'}`}
              onClick={handleContinue}
              disabled={!canProceed()}
            >
              Continue
            </button>
          )}
          
          {currentStep === 1 && (
            <button 
              className={`continue-button ${canProceed() ? 'enabled' : 'disabled'}`}
              onClick={handleContinue}
              disabled={!canProceed()}
            >
              Choose Your Tastes
            </button>
          )}
        </div>
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={onBack}>
          Back
        </button>
      </div>
    </div>
  );
};

export default AboutPage;
