import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';


const API_URL = process.env.REACT_APP_API_URL 
  ? process.env.REACT_APP_API_URL + '/api/chat' 
  : 'http:

const ChatbotPage = ({ onBack, firstName }) => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      isMarkdown: true,
      content: `👋 Hello ${firstName || 'there'}! I'm Culturis, your AI cultural & business assistant.\n\nTell me your idea or what you're looking for, and I'll: \n1. Parse it into a Qloo API call \n2. Pull cultural intelligence \n3. Present an actionable plan for you.\n\nWhat can I help you with today?`
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null);

  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Server responded ${resp.status}: ${errorText}`);
      }

      const responseData = await resp.json();
      
      
      let botResponse;
      if (responseData.response) {
        
        botResponse = responseData.response;
      } else if (responseData.pretty) {
        
        const { pretty } = responseData;
        botResponse = pretty;
      } else {
        
        botResponse = JSON.stringify(responseData, null, 2);
      }

      setMessages(prev => [
        ...prev,
        {
          type: 'bot',
          isMarkdown: true,
          content: botResponse
        }
      ]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setMessages(prev => [
        ...prev,
        { 
          type: 'bot', 
          content: `😓 Sorry, something went wrong: ${error.message}. Please try again in a moment.` 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container chatbot-page">
      <div className="page-header">
        <h1 className="page-title">Culturis AI Assistant</h1>
        <p className="page-subtitle">Get your personalized cultural/business plan in seconds</p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.type}`}>
              <div className="message-content">
                {message.isMarkdown ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  message.content
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="message bot">
              <div className="message-content loading">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                Analyzing your query with Qloo's cultural intelligence...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tell me your idea or what you want to discover..."
            className="chat-input"
            disabled={isLoading}
          />
          <button type="submit" className="send-button" disabled={isLoading || !inputValue.trim()}>
            Send
          </button>
        </form>
      </div>

      <div className="navigation-buttons">
        <button className="nav-button" onClick={onBack}>
          Back to How It Works
        </button>
      </div>
    </div>
  );
};

export default ChatbotPage;