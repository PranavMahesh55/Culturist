import React, { useState } from 'react';
import './App.css';
import WelcomePage from './components/WelcomePage';
import AboutPage from './components/AboutPage';
import PaintMyMapPage from './components/PaintMyMapPage';
import TasteSeedPickerDemo from './components/TasteSeedPickerDemo';

function App() {
  
  const urlParams = new URLSearchParams(window.location.search);
  const isDemoMode = urlParams.get('demo') === 'taste-picker';
  const urlPage = urlParams.get('page');
  
  const [currentPage, setCurrentPage] = useState(urlPage || 'welcome');
  const [firstName, setFirstName] = useState('');

  if (isDemoMode) {
    return <TasteSeedPickerDemo />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'welcome':
        return <WelcomePage 
          onNext={() => setCurrentPage('about')} 
        />;
      case 'about':
        return (
          <AboutPage 
            onNext={() => setCurrentPage('paint-my-map')} 
            onBack={() => setCurrentPage('welcome')} 
            setFirstName={setFirstName} 
          />
        );
      case 'paint-my-map':
        return <PaintMyMapPage onBack={() => setCurrentPage('welcome')} firstName={firstName} />;
      default:
        return <WelcomePage 
          onNext={() => setCurrentPage('about')} 
        />;
    }
  };

  return (
    <div className="App">
      {renderPage()}
    </div>
  );
}

export default App;
