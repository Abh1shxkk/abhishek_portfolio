import React, { useState, useRef, useEffect } from 'react';
import { createChatSession } from '../services/gemini';
import { ChatMessage } from '../types';
import { Chat } from "@google/genai";
import { useProfile } from '../hooks/usePortfolio';

export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: profile } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || 'AI';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial message when profile loads
  useEffect(() => {
    if (profile?.full_name && messages.length === 0) {
      setMessages([
        { role: 'model', text: `Hi there! I'm ${profile.full_name}'s AI assistant. How can I help you learn more about ${firstName} today?` }
      ]);
    }
  }, [profile, firstName]);

  useEffect(() => {
    if (isOpen && !chatSession) {
      createChatSession().then(session => {
        if (session) {
          setChatSession(session);
        } else {
          console.error('Failed to create chat session');
        }
      }).catch(error => {
        console.error('Error creating chat session:', error);
      });
    }
  }, [isOpen, chatSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    if (!chatSession) {
      console.error('Chat session not initialized');
      setMessages(prev => [...prev, { role: 'model', text: "Chat is still initializing. Please wait a moment and try again." }]);
      return;
    }

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);

    try {
      const result = await chatSession.sendMessage({ message: userText });
      setMessages(prev => [...prev, { role: 'model', text: result.text || "I'm speechless." }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection lost. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat is always available (API key has hardcoded fallback in gemini.ts)

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-50 flex items-center justify-center w-14 h-14 bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white transition-transform duration-300 ${isOpen ? 'rotate-45' : 'hover:scale-105'}`}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? (
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-8 z-40 w-80 sm:w-96 bg-white dark:bg-geo-dark-card border border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] animate-in slide-in-from-bottom-4 fade-in duration-200 flex flex-col max-h-[500px]">
          <div className="p-4 border-b border-black dark:border-white bg-neutral-50 dark:bg-black flex justify-between items-center">
            <span className="font-display font-bold text-lg tracking-tight text-black dark:text-white">
              ASK {profile?.full_name?.split(' ')[0]?.toUpperCase() || 'AI'}_AI
            </span>
            <div className="flex space-x-1">
               <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-black text-white dark:bg-white dark:text-black' 
                    : 'bg-neutral-100 dark:bg-neutral-900 text-black dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-900 text-black border border-neutral-200 dark:border-neutral-800 p-3 text-sm">
                  <span className="inline-flex space-x-1">
                    <span className="w-1 h-1 bg-black dark:bg-white animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-1 bg-black dark:bg-white animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-1 bg-black dark:bg-white animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-black dark:border-white bg-white dark:bg-geo-dark-card">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-transparent border-b border-neutral-300 dark:border-neutral-700 focus:border-black dark:focus:border-white outline-none px-2 py-2 text-sm font-mono transition-colors text-black dark:text-white placeholder-neutral-400"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};