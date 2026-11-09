import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am connected to your Django backend with tool capabilities.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setLoading(true);

    try {
      // Points directly to your Django backend running on port 8000
      const response = await axios.post('http://localhost:8000/api/chat/', {
        message: userMessage,
        history: newHistory.slice(0, -1)
      });

      setMessages([
        ...newHistory,
        { role: 'assistant', content: response.data.reply }
      ]);
    } catch (err) {
      setMessages([
        ...newHistory,
        { role: 'assistant', content: 'Error: Failed to fetch response from Django backend server.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#212121', color: '#f3f4f6', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '15px 20px', borderBottom: '1px solid #374151', fontSize: '14px', fontWeight: 'bold' }}>
        ChatGPT Clone
      </div>

      {/* Message Feed */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', width: '100%', margin: '0 auto' }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ 
              backgroundColor: msg.role === 'user' ? '#2f2f2f' : 'transparent', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              maxWidth: '70%', 
              lineHeight: '1.5',
              fontSize: '15px'
            }}>
              <b style={{ display: 'block', fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
                {msg.role === 'user' ? 'You' : 'AI Assistant'}
              </b>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ color: '#9ca3af', fontSize: '14px', paddingLeft: '10px' }}>
            Thinking and querying tools...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', backgroundColor: '#212121' }}>
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: '800px', display: 'flex', position: 'relative' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something (e.g., What is the weather in Tokyo?)..."
            style={{
              width: '100%',
              backgroundColor: '#2f2f2f',
              color: '#f3f4f6',
              border: '1px solid #4b5563',
              borderRadius: '12px',
              padding: '14px 50px 14px 16px',
              outline: 'none',
              fontSize: '15px'
            }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              backgroundColor: '#ffffff',
              color: '#000000',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              opacity: loading || !input.trim() ? 0.4 : 1
            }}
          >
            ↑
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;