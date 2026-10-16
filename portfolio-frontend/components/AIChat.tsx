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

  return (
    <>
      {/* Floating Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`press fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex items-center justify-center w-14 h-14 rounded-lg bg-ink text-paper shadow-lift transition-transform duration-300 ${isOpen ? 'rotate-45' : 'hover:scale-105 hover:-rotate-6'}`}
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
        <div className="pop-in fixed bottom-24 right-4 md:right-8 z-40 w-[calc(100vw-2rem)] sm:w-96 overflow-hidden rounded-lg bg-surface/95 backdrop-blur-xl border border-line shadow-lift flex flex-col max-h-[520px]">
          <div className="px-5 py-4 border-b border-line flex justify-between items-center">
            <span className="text-sm font-semibold tracking-tight text-ink">
              Ask about {firstName}
            </span>
            <div className="flex space-x-1">
               <div className="pulse-dot w-2 h-2 bg-saffron rounded-full"></div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-ink text-paper rounded-lg rounded-br-sm' 
                    : 'bg-paper text-ink border border-line rounded-lg rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-paper border border-line rounded-lg rounded-bl-sm p-3 text-sm">
                  <span className="inline-flex space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-line">
            <form onSubmit={handleSend} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-md bg-paper border border-line focus:border-ink/30 outline-none px-4 py-2 text-sm transition-colors text-ink placeholder:text-muted"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="press rounded-md px-4 py-2 bg-ink text-paper text-sm font-medium disabled:opacity-40"
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