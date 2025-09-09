import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NodeConfig.css';

const NodeConfig = ({ selectedNode, updateNodeData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  
  // State for the prompt to make the textarea responsive
  const [prompt, setPrompt] = useState(selectedNode?.data?.prompt || '');

  // When a new node is selected, update the local prompt state
  useEffect(() => {
    setPrompt(selectedNode?.data?.prompt || '');
  }, [selectedNode]);

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
    setMessage('');
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }
    setMessage('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('http://127.0.0.1:8000/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(response.data.message || 'Upload successful!');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'An unexpected error occurred.';
      setMessage(`Error: ${errorMsg}`);
    }
  };

  const onPromptChange = (event) => {
    // Update local state for a responsive UI
    setPrompt(event.target.value);
    // Update the actual node data in the main App component
    updateNodeData(selectedNode.id, { prompt: event.target.value });
  };

  const onWebSearchChange = (event) => {
    updateNodeData(selectedNode.id, { webSearch: event.target.checked });
  };

  if (!selectedNode) {
    return <p className="config-placeholder">Select a node to configure it.</p>;
  }

  const renderConfigContent = () => {
    switch (selectedNode.data.label) {
      case 'KnowledgeBase':
        return (
          <div className="config-item">
            <label htmlFor="file-upload">Upload PDF Document:</label>
            <input id="file-upload" type="file" accept=".pdf" onChange={onFileChange} />
            <button onClick={handleFileUpload}>Upload & Process</button>
            {message && <p className="upload-message">{message}</p>}
          </div>
        );
      case 'LLM Engine':
        return (
          <>
            <div className="config-item">
              <label htmlFor="prompt">Custom Prompt:</label>
              <textarea
                id="prompt"
                rows="6"
                value={prompt} // Use local state for value
                onChange={onPromptChange}
                placeholder="e.g., Summarize the context in 3 bullet points."
              ></textarea>
            </div>
            <div className="config-item-toggle">
              <label htmlFor="web-search">Enable Web Search:</label>
              <input
                id="web-search"
                type="checkbox"
                checked={selectedNode.data.webSearch || false}
                onChange={onWebSearchChange}
              />
            </div>
          </>
        );
      default:
        return <p>No configuration available for this node type.</p>;
    }
  };

  return (
    <div className="node-config-container">
      <h3>{selectedNode.data.label}</h3>
      <p className="node-id">ID: {selectedNode.id}</p>
      <hr />
      {renderConfigContent()}
    </div>
  );
};

export default NodeConfig;

