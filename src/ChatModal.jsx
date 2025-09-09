import React, { useState } from 'react';
import axios from 'axios';
import './ChatModal.css';

// The ChatModal component receives props to handle its visibility and the workflow data
const ChatModal = ({ isOpen, onClose, nodes, edges }) => {
  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const newHistory = [...history, { role: 'user', text: query }];
    setHistory(newHistory);
    setQuery('');
    setIsLoading(true);

    try {
      // Package the workflow structure and the query into a payload
      const payload = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          data: node.data,
        })),
        edges,
        query,
      };

      // Send the payload to our new backend endpoint
      const response = await axios.post('http://localhost:8000/workflow/run', payload);
      
      // Add the bot's answer to the chat history
      setHistory([...newHistory, { role: 'bot', text: response.data.answer }]);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'An unexpected error occurred.';
      setHistory([...newHistory, { role: 'bot', text: `Error: ${errorMessage}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // If the modal isn't open, render nothing
  if (!isOpen) {
    return null;
  }

  return (
    <div className="chat-modal-overlay">
      <div className="chat-modal-content">
        <div className="chat-modal-header">
          <h2>Chat with Stack</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="chat-history">
          {history.map((msg, index) => (
            <div key={index} className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'}`}>
              {msg.text}
            </div>
          ))}
          {isLoading && <div className="message bot-message">Thinking...</div>}
        </div>
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>Send</button>
        </form>
      </div>
    </div>
  );
};

export default ChatModal;
