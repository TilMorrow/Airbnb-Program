'use client';

import React, { useState, useRef, useEffect } from 'react';

// message structure definition
interface Message {
  role: 'user' | 'model'; // who sent the message
  content: string;         // the message text
}

interface ChatbotProps {
  onClose: () => void;
}

const CHAT_API_ENDPOINT = '/api/chat'; 

const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const userName = localStorage.getItem('tenant_name') || 'there';

  // auto-scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // INITIAL WELCOME MESSAGE
    setMessages([{ 
        role: 'model', 
        content: `Hello ${userName}! I'm your AI assistant, powered by Gemini. I can help guide you with purchases, reviews, policies, or general concerns related to your listings. How can I assist you today?` 
    }]);
  }, []); // run only once on mount

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    
    // update state with user's message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      // api call
      const response = await fetch(CHAT_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // send the entire message history for context, plus the user's latest message
        body: JSON.stringify({ 
            messages: [...messages, userMessage], 
            userId: localStorage.getItem('tenant_id'), 
        }), 
      });

      if (!response.ok) {
        throw new Error('Failed to fetch response from AI endpoint.');
      }

      // get ai response
      const data = await response.json();
      const modelResponse: Message = { 
          role: 'model', 
          content: data.response || "Sorry, I couldn't generate a response. Please try again."
      };
      
      // update state with model response
      setMessages(prev => [...prev, modelResponse]);

    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "There was an error connecting to the AI service. Please check the network or API key." }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    // fixed position for the chat window
    <div className="fixed bottom-24 left-4 w-80 h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-300 z-50 flex flex-col">
        {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-blue-600 rounded-t-xl">
        <h3 className="text-lg font-semibold text-white">FareInn Assistant (Gemini)</h3>
        <button 
          onClick={onClose} 
          className="text-white hover:text-gray-200 text-2xl font-bold p-1 leading-none"
          aria-label="Close Chat"
        >
          &times;
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-2 rounded-xl text-sm leading-snug shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {/* Loading indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-2 rounded-xl text-sm leading-snug bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none">
              ... typing
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex space-x-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isSending ? "Waiting for response..." : "Ask the assistant..."}
          disabled={isSending}
          className="flex-grow p-2 border border-gray-300 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" 
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition"
        >
            Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;