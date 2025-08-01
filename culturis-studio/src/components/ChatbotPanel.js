import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  FiMessageSquare, 
  FiSend, 
  FiUser, 
  FiLoader,
  FiTarget,
  FiTrendingUp
} from 'react-icons/fi';
import { HiSparkles, HiLightBulb } from 'react-icons/hi';
import { RiRobotLine } from 'react-icons/ri';
import './ChatbotPanel.css';

/**
 * ChatbotPanel - Right sidebar chatbot for discovering additional tastes
 * Uses LLM to extract preferences and suggests new Qloo tags
 */
const ChatbotPanel = ({
  selectedTastes = [],
  currentLocation,
  onTastesExtracted,
  currentRoute = null,
  venues = [],
  onRouteUpdate = () => {}
}) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: `Hi! I'm your cultural discovery assistant. Tell me what you love to explore, and I'll help you discover venues in ${currentLocation}. Once you plan a route, I can help you refine it too!`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  
  const extractTastesFromMessage = useCallback(async (userMessage) => {
    try {
      
      
      const response = await fetch('http://localhost:8000/api/extract-tastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          existing_tastes: selectedTastes.map(t => t.name),
          location: currentLocation
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.extracted_tastes || [];
      } else {
        
        return mockExtractTastes(userMessage);
      }
    } catch (error) {
      console.warn('LLM extraction failed, using fallback:', error);
      return mockExtractTastes(userMessage);
    }
  }, [selectedTastes, currentLocation]);

  
  const handleRouteQuery = async (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();
    
    
    if (lowerMessage.includes('replace') || lowerMessage.includes('swap') || 
        lowerMessage.includes('different') || lowerMessage.includes('tell me about') ||
        lowerMessage.includes('details') || lowerMessage.includes('first') ||
        lowerMessage.includes('second') || lowerMessage.includes('restaurant')) {
      
      try {
        const response = await fetch('http://localhost:8000/api/refine-route', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_route: currentRoute,
            user_request: userMessage,
            available_venues: venues
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.updated_route) {
            
            onRouteUpdate(data.updated_route);
            
            return {
              type: 'route_update',
              content: data.message,
              route_updated: true
            };
          } else {
            return {
              type: 'route_help',
              content: data.message,
              suggestions: data.suggestions
            };
          }
        }
      } catch (error) {
        console.error('Route refinement API error:', error);
      }
    }
    
    
    if (lowerMessage.includes('replace') || lowerMessage.includes('swap') || lowerMessage.includes('different')) {
      return handleVenueReplacement(userMessage);
    }
    
    if (lowerMessage.includes('tell me about') || lowerMessage.includes('more info') || lowerMessage.includes('details')) {
      return handleVenueDetails(userMessage);
    }
    
    if (lowerMessage.includes('timing') || lowerMessage.includes('schedule') || lowerMessage.includes('time')) {
      return handleTimingAdjustment(userMessage);
    }
    
    if (lowerMessage.includes('directions') || lowerMessage.includes('how to get') || lowerMessage.includes('navigate')) {
      return handleNavigationRequest(userMessage);
    }
    
    return null;
  };

  
  const handleVenueReplacement = (message) => {
    const routeVenues = currentRoute?.venues || [];
    if (routeVenues.length === 0) return null;

    
    const lowerMessage = message.toLowerCase();
    let targetVenue = null;
    let replacementType = null;

    if (lowerMessage.includes('first') || lowerMessage.includes('1st')) {
      targetVenue = routeVenues[0];
    } else if (lowerMessage.includes('second') || lowerMessage.includes('2nd')) {
      targetVenue = routeVenues[1];
    } else if (lowerMessage.includes('last')) {
      targetVenue = routeVenues[routeVenues.length - 1];
    } else if (lowerMessage.includes('restaurant')) {
      targetVenue = routeVenues.find(v => v.type.toLowerCase().includes('restaurant'));
      replacementType = 'Restaurant';
    } else if (lowerMessage.includes('bar')) {
      targetVenue = routeVenues.find(v => v.type.toLowerCase().includes('bar'));
      replacementType = 'Bar';
    }

    if (targetVenue) {
      
      const alternatives = venues.filter(v => 
        v.id !== targetVenue.id && 
        (!replacementType || v.type === replacementType) &&
        !routeVenues.some(rv => rv.id === v.id)
      ).slice(0, 3);

      if (alternatives.length > 0) {
        
        const updatedVenues = routeVenues.map(v => 
          v.id === targetVenue.id ? alternatives[0] : v
        );
        
        const updatedRoute = {
          ...currentRoute,
          venues: updatedVenues
        };
        
        onRouteUpdate(updatedRoute);

        return {
          type: 'route_update',
          content: `I've replaced "${targetVenue.name}" with "${alternatives[0].name}" in your route. This ${alternatives[0].type.toLowerCase()} has a ${alternatives[0].affinity}% cultural match with your preferences.`,
          alternatives: alternatives.slice(1)
        };
      }
    }

    return {
      type: 'route_help',
      content: `I'd be happy to help you modify your route! Could you be more specific about which venue you'd like to replace? For example, "replace the first venue" or "find a different restaurant".`
    };
  };

  
  const handleVenueDetails = (message) => {
    const routeVenues = currentRoute?.venues || [];
    if (routeVenues.length === 0) return null;

    const lowerMessage = message.toLowerCase();
    let targetVenue = null;

    if (lowerMessage.includes('first') || lowerMessage.includes('1st')) {
      targetVenue = routeVenues[0];
    } else if (lowerMessage.includes('second') || lowerMessage.includes('2nd')) {
      targetVenue = routeVenues[1];
    } else if (lowerMessage.includes('third') || lowerMessage.includes('3rd')) {
      targetVenue = routeVenues[2];
    } else if (lowerMessage.includes('last')) {
      targetVenue = routeVenues[routeVenues.length - 1];
    }

    if (targetVenue) {
      return {
        type: 'venue_details',
        content: `Here's more about "${targetVenue.name}": This ${targetVenue.type.toLowerCase()} has a ${targetVenue.affinity}% match with your cultural preferences. It's rated ${targetVenue.rating?.toFixed(1)} stars and you're scheduled to spend ${Math.floor(targetVenue.estimatedTime / 60)}h ${targetVenue.estimatedTime % 60}m there. ${targetVenue.notes || 'Perfect for exploring your cultural interests!'}`
      };
    }

    return {
      type: 'route_help',
      content: `I can provide details about any venue in your route. Try asking "tell me about the first venue" or mention a specific venue by name.`
    };
  };

  
  const handleTimingAdjustment = (message) => {
    if (!currentRoute) return null;

    return {
      type: 'timing_help',
      content: `Your current route takes ${Math.floor(currentRoute.totalDuration / 60)}h ${currentRoute.totalDuration % 60}m total. I can help you adjust timing - try asking "spend more time at the museum" or "make this a quicker visit".`
    };
  };

  
  const handleNavigationRequest = (message) => {
    if (!currentRoute || !currentRoute.venues) return null;

    return {
      type: 'navigation_help',
      content: `Your route starts at "${currentRoute.venues[0]?.name}". I recommend starting around ${currentRoute.startTime}. Would you like specific directions to the first venue, or shall I help you plan the route timing?`
    };
  };

  
  const mockExtractTastes = (message) => {
    const lowerMessage = message.toLowerCase();
    const extractedTastes = [];

    
    const tasteKeywords = {
      'lofi': { id: 'lofi_venues', name: 'Lofi & Chill Venues', color: '#A3C1AD' },
      'jazz': { id: 'jazz_music', name: 'Jazz Music', color: '#8e44ad' },
      'coffee': { id: 'specialty_coffee', name: 'Specialty Coffee', color: '#795548' },
      'art': { id: 'contemporary_art', name: 'Contemporary Art', color: '#e91e63' },
      'gallery': { id: 'art_galleries', name: 'Art Galleries', color: '#e91e63' },
      'food': { id: 'gourmet_food', name: 'Gourmet Food', color: '#ff5722' },
      'restaurant': { id: 'fine_dining', name: 'Fine Dining', color: '#ff5722' },
      'music': { id: 'live_music', name: 'Live Music', color: '#9c27b0' },
      'vintage': { id: 'vintage_shops', name: 'Vintage Shopping', color: '#607d8b' },
      'books': { id: 'bookstores', name: 'Independent Bookstores', color: '#3f51b5' },
      'craft': { id: 'craft_beer', name: 'Craft Beer', color: '#ff9800' },
      'outdoor': { id: 'outdoor_activities', name: 'Outdoor Activities', color: '#4caf50' },
      'theater': { id: 'theater', name: 'Theater & Performance', color: '#673ab7' },
      'local': { id: 'local_culture', name: 'Local Culture', color: '#009688' },
      'hidden': { id: 'hidden_gems', name: 'Hidden Gems', color: '#795548' },
      'rooftop': { id: 'rooftop_venues', name: 'Rooftop Venues', color: '#00bcd4' },
      'cocktail': { id: 'craft_cocktails', name: 'Craft Cocktails', color: '#e91e63' },
      'museum': { id: 'museums', name: 'Museums', color: '#673ab7' },
      'market': { id: 'local_markets', name: 'Local Markets', color: '#ff9800' },
      'nightlife': { id: 'nightlife', name: 'Nightlife', color: '#9c27b0' },
      'chill': { id: 'chill_spots', name: 'Chill Spots', color: '#A3C1AD' },
      'theme': { id: 'themed_venues', name: 'Themed Venues', color: '#9b59b6' },
      'aesthetic': { id: 'aesthetic_spaces', name: 'Aesthetic Spaces', color: '#e74c3c' },
      'vibe': { id: 'good_vibes', name: 'Good Vibes', color: '#1abc9c' },
      'atmosphere': { id: 'atmospheric_venues', name: 'Atmospheric Venues', color: '#f39c12' }
    };

    Object.entries(tasteKeywords).forEach(([keyword, taste]) => {
      if (lowerMessage.includes(keyword)) {
        extractedTastes.push(taste);
      }
    });

    return extractedTastes;
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    
    setMessages(prev => [...prev, {
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    try {
      
      if (currentRoute && currentRoute.venues && currentRoute.venues.length > 0) {
        const routeResponse = await handleRouteQuery(userMessage);
        if (routeResponse) {
          setMessages(prev => [...prev, {
            type: 'bot',
            content: routeResponse.content,
            timestamp: new Date(),
            responseType: routeResponse.type,
            alternatives: routeResponse.alternatives,
            suggestions: routeResponse.suggestions
          }]);
          setIsLoading(false);
          return;
        }
      }
      
      
      const extractedTastes = await extractTastesFromMessage(userMessage);
      
      
      let botResponse = `I understand you're interested in ${userMessage.toLowerCase()}. `;
      
      if (extractedTastes.length > 0) {
        botResponse += `Based on what you've shared, I've discovered ${extractedTastes.length} new cultural interest${extractedTastes.length > 1 ? 's' : ''} for you: ${extractedTastes.map(t => t.name).join(', ')}. `;
        
        
        onTastesExtracted(extractedTastes);
        
        botResponse += `I'm updating your map to show venues that match these preferences in ${currentLocation}. `;
        
        if (currentRoute) {
          botResponse += `Once the new venues load, I can help you update your current route to include these interests!`;
        }
      } else {
        if (currentRoute) {
          botResponse += `I can help you refine your current route, get details about venues, or discover new preferences. What would you like to know?`;
        } else {
          botResponse += `Tell me more about what else you'd like to explore, or click "Plan Route" on the map to create a cultural journey!`;
        }
      }

      
      setMessages(prev => [...prev, {
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        extractedTastes
      }]);

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        type: 'bot',
        content: "I'm having trouble understanding that right now. Could you try rephrasing what you're looking for?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  
  const quickSuggestions = currentRoute && currentRoute.venues ? [
    "Tell me about the first venue",
    "Find a different restaurant",
    "Adjust the timing",
    "Replace the last venue",
    "Get directions to start"
  ] : [
    "I love jazz clubs and live music",
    "Show me hidden local gems",
    "I'm into art galleries and museums",
    "Find craft coffee and bookstores",
    "I want rooftop bars with views"
  ];

  return (
    <div className="chatbot-panel-container">
      {}
      <div className="chatbot-header">
        <h3><FiMessageSquare className="header-icon" /> Cultural AI Assistant</h3>
        <p>Tell me what you love to discover</p>
        {currentRoute && currentRoute.venues && (
          <div className="route-status">
            <span className="status-badge">
              🎯 Active Route: {currentRoute.venues.length} venues
            </span>
          </div>
        )}
      </div>

      {}
      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-avatar">
                {message.type === 'bot' ? <RiRobotLine /> : <FiUser />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {message.content}
                  {message.extractedTastes && message.extractedTastes.length > 0 && (
                    <div className="extracted-tastes">
                      <h5><HiSparkles className="sparkle-icon" /> Discovered interests:</h5>
                      <div className="extracted-taste-chips">
                        {message.extractedTastes.map((taste, idx) => (
                          <span 
                            key={idx}
                            className="extracted-taste-chip"
                            style={{ backgroundColor: taste.color }}
                          >
                            {taste.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.alternatives && message.alternatives.length > 0 && (
                    <div className="route-alternatives">
                      <h5>Other options I found:</h5>
                      <div className="alternative-venues">
                        {message.alternatives.map((venue, idx) => (
                          <div key={idx} className="alternative-venue">
                            <span className="venue-name">{venue.name}</span>
                            <span className="venue-match">{venue.affinity}% match</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="route-suggestions">
                      <h5>You can also try:</h5>
                      <div className="suggestion-buttons">
                        {message.suggestions.map((suggestion, idx) => (
                          <button 
                            key={idx}
                            className="suggestion-btn"
                            onClick={() => setInputValue(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="message-timestamp">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="message bot loading">
              <div className="message-avatar"><RiRobotLine /></div>
              <div className="message-content">
                <div className="message-bubble">
                  <span>Exploring cultural possibilities...</span>
                  <div className="typing-indicator">
                    <FiLoader className="spinning-loader" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {}
      {messages.length <= 2 && (
        <div className="quick-actions">
          <h4><HiLightBulb className="lightbulb-icon" /> Try asking:</h4>
          <div className="quick-action-buttons">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="quick-action-btn"
                onClick={() => setInputValue(suggestion)}
              >
                <FiTarget className="suggestion-icon" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {}
      <div className="chatbot-input-section">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me what you love to explore..."
            className="message-input"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!inputValue.trim() || isLoading}
          >
            {isLoading ? <FiLoader className="spinning" /> : <FiSend />}
          </button>
        </form>
      </div>

      {}
      <div className="chatbot-stats">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{selectedTastes.length}</div>
            <div className="stat-label">
              <FiUser className="stat-icon" />
              Original Tastes
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{messages.filter(m => m.extractedTastes?.length > 0).reduce((acc, m) => acc + m.extractedTastes.length, 0)}</div>
            <div className="stat-label">
              <FiTrendingUp className="stat-icon" />
              AI Discovered
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPanel;
