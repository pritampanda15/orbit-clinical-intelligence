// src/components/ChatPanel.tsx - Clinical AI Chat Interface
import React, { useState, useRef, useEffect } from 'react';

interface VitalsData {
  timestamp: string;
  MAP: number;
  HR: number;
  SpO2: number;
  RR: number;
  Temp: number;
  EtCO2: number;
  BIS?: number;
}

interface PatientEvent {
  timestamp: string;
  type: string;
  description: string;
  severity: string;
  source: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

interface ChatPanelProps {
  vitalsData: VitalsData[];
  events: PatientEvent[];
}

const QUICK_QUESTIONS = [
  "Why is MAP dropping?",
  "Should I be concerned about the current vitals?",
  "What interventions do you recommend?",
  "Explain the current hemodynamic status",
  "Any signs of complications?",
  "Review anesthetic depth"
];

const CLINICAL_CONTEXTS = [
  "General OR consultation",
  "Cardiovascular surgery",
  "Neurosurgery",
  "Pediatric anesthesia",
  "Trauma surgery",
  "Cardiac anesthesia"
];

export default function ChatPanel({ vitalsData, events }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm OR-BIT, your clinical AI assistant. I can help analyze patient vitals, explain physiological changes, and suggest evidence-based interventions. What would you like to know about the current case?",
      timestamp: new Date(),
      confidence: 1.0,
      sources: ['OR-BIT Clinical Knowledge Base']
    }
  ]);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedContext, setSelectedContext] = useState(CLINICAL_CONTEXTS[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatPatientContext = (): string => {
    const latest = vitalsData.length > 0 ? vitalsData[vitalsData.length - 1] : null;
    const recentEvents = events.slice(-5);
    
    if (!latest) return "No current patient data available.";

    return `
Current Patient Status:
- MAP: ${latest.MAP.toFixed(1)} mmHg
- Heart Rate: ${latest.HR.toFixed(0)} bpm
- SpO₂: ${latest.SpO2.toFixed(1)}%
- Respiratory Rate: ${latest.RR.toFixed(0)} /min
- Temperature: ${latest.Temp.toFixed(1)}°C
- End-tidal CO₂: ${latest.EtCO2.toFixed(1)} mmHg
${latest.BIS ? `- BIS: ${latest.BIS.toFixed(1)}` : ''}

Recent Events:
${recentEvents.length > 0 
  ? recentEvents.map(e => `- ${e.description} (${e.timestamp})`).join('\n')
  : '- No recent events'
}

Clinical Context: ${selectedContext}
`;
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: content.trim(),
          context: {
            patient_data: formatPatientContext(),
            clinical_specialty: selectedContext,
            chat_history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'I apologize, but I encountered an issue processing your request.',
        timestamp: new Date(),
        confidence: data.confidence || 0.8,
        sources: data.sources || ['Clinical AI Model']
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I\'m currently unable to process your request. Please check the connection and try again.',
        timestamp: new Date(),
        confidence: 0.0,
        sources: ['Error Handler']
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence?: number): string => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  const clearChat = () => {
    setMessages([messages[0]]); // Keep the initial message
  };

  const exportChat = () => {
    const chatText = messages.map(m => 
      `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orbit-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Clinical AI Assistant</h3>
            <p className="text-sm text-gray-500">Powered by GPT-4-turbo + Clinical Knowledge</p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={clearChat}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              title="Clear Chat"
            >
              🗑️
            </button>
            <button
              onClick={exportChat}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
              title="Export Chat"
            >
              📁
            </button>
          </div>
        </div>

        {/* Clinical Context Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Context:</label>
          <select
            value={selectedContext}
            onChange={(e) => setSelectedContext(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CLINICAL_CONTEXTS.map(context => (
              <option key={context} value={context}>{context}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-sm font-medium text-gray-700 mb-2">Quick Questions:</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((question, index) => (
            <button
              key={index}
              onClick={() => handleQuickQuestion(question)}
              disabled={isLoading}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {/* Message Content */}
              <div className="whitespace-pre-wrap">{message.content}</div>
              
              {/* Message Metadata */}
              <div className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                <div className="flex justify-between items-center">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.role === 'assistant' && message.confidence !== undefined && (
                    <span className={getConfidenceColor(message.confidence)}>
                      Confidence: {getConfidenceText(message.confidence)}
                    </span>
                  )}
                </div>
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-1">
                    <span className="font-medium">Sources: </span>
                    <span>{message.sources.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
                <span className="text-sm text-gray-600">OR-BIT is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about patient status, interventions, or clinical reasoning..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
        
        <div className="text-xs text-gray-500 mt-2">
          💡 Tip: Ask specific questions about vitals, trends, or interventions for best results
        </div>
      </div>
    </div>
  );
}