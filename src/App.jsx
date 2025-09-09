import React, { useState, useRef, useCallback, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import NodeConfig from './NodeConfig';
import ChatModal from './ChatModal';

// --- Icon SVGs for the sidebar ---
const UserQueryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
);
const KnowledgeBaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v15H6.5A2.5 2.5 0 0 1 4 14.5v-10A2.5 2.5 0 0 1 6.5 2z"></path></svg>
);
const LLMEngineIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"></path><rect x="4" y="12" width="8" height="8"></rect><path d="M12 12v8H8"></path><path d="m13 3 2.3 2.3a1 1 0 0 0 1.4 0L19 3"></path><path d="m13 21 2.3-2.3a1 1 0 0 1 1.4 0L19 21"></path></svg>
);
const OutputIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-6"></path><path d="M12 8V2"></path><path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path><path d="M12 3a6 6 0 0 0-6 6v6a6 6 0 0 0 6 6h0a6 6 0 0 0 6-6V9a6 6 0 0 0-6-6z"></path></svg>
);
// --- End of Icons ---


const initialNodes = [
  { id: '1', type: 'input', data: { label: 'User Query' }, position: { x: 250, y: 5 } },
];

let id = 2;
const getId = () => `${id++}`;

const componentTypes = [
  { type: 'input', label: 'User Query', description: 'Entry point for questions.', icon: <UserQueryIcon /> },
  { type: 'default', label: 'KnowledgeBase', description: 'Upload and process docs.', icon: <KnowledgeBaseIcon /> },
  { type: 'default', label: 'LLM Engine', description: 'Connects to language models.', icon: <LLMEngineIcon /> },
  { type: 'output', label: 'Output', description: 'Displays the final response.', icon: <OutputIcon /> },
];

const validateWorkflow = (nodes, edges) => {
  const hasLLMEngine = nodes.some(node => node.data.label === 'LLM Engine');
  const hasOutput = nodes.some(node => node.data.label === 'Output');
  
  if (!hasLLMEngine || !hasOutput) {
    return { isValid: false, message: "Workflow must contain an LLM Engine and an Output node." };
  }

  const llmNode = nodes.find(node => node.data.label === 'LLM Engine');
  const isLlmConnectedToOutput = edges.some(edge => edge.source === llmNode.id && nodes.find(n => n.id === edge.target)?.data.label === 'Output');

  if (!isLlmConnectedToOutput) {
    return { isValid: false, message: "LLM Engine must be connected to an Output node." };
  }
  
  return { isValid: true, message: "Workflow is valid." };
};


const DnDFlow = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const workflowStatus = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;
      const label = event.dataTransfer.getData('label');
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = { id: getId(), type, position, data: { label } };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = (nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
     if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => ({ ...prev, data: { ...prev.data, ...newData } }));
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Intelligent Workflow Builder</h1>
      </header>
      <div className="main-content">
        <aside className="sidebar">
          <h2>Components</h2>
          <div className="component-list">
            {componentTypes.map((comp) => (
              <div
                className="dnd-node"
                onDragStart={(event) => onDragStart(event, comp.type, comp.label)}
                draggable
                key={comp.label}
              >
                <div className="icon">{comp.icon}</div>
                <div className="label-desc">
                  <strong>{comp.label}</strong>
                  <p>{comp.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="execution-controls">
            <button onClick={() => setIsChatOpen(true)} disabled={!workflowStatus.isValid}>
              Chat with Stack
            </button>
            {!workflowStatus.isValid && <p className="validation-error">{workflowStatus.message}</p>}
          </div>
        </aside>
        <main className="workspace" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
          >
            <Controls />
            <MiniMap />
          </ReactFlow>
        </main>
        <aside className="config-panel">
          <h2>Configuration</h2>
          <NodeConfig selectedNode={selectedNode} updateNodeData={updateNodeData} />
        </aside>
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          nodes={nodes} 
          edges={edges} 
        />
      </div>
    </div>
  );
};

function App() {
  return (
    <ReactFlowProvider>
      <DnDFlow />
    </ReactFlowProvider>
  );
}

export default App;

