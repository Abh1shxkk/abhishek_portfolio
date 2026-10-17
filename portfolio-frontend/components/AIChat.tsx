import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, createChatSession } from '../services/gemini';
import { ChatMessage } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { Icon } from './ui';

/** A CB radio in the corner: ask the assistant anything about the driver. */
export const AIChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: profile } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || 'AI';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [offline, setOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.full_name && messages.length === 0) {
      setMessages([
        { role: 'model', text: `Hi! I'm ${firstName}'s road assistant. Ask me about the projects, the stack, or how to get in touch.` },
      ]);
    }
  }, [profile, firstName, messages.length]);

  useEffect(() => {
    if (isOpen && !chatSession && !offline) {
      createChatSession()
        .then((session) => (session ? setChatSession(session) : setOffline(true)))
        .catch(() => setOffline(true));
    }
  }, [isOpen, chatSession, offline]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    if (!chatSession) {
      setMessages((prev) => [...prev, { role: 'model', text: offline
        ? `The radio is off right now. Email ${profile?.email ?? 'me'} instead and I'll reply quickly.`
        : 'Tuning in… give it a second and try again.' }]);
      return;
    }
    const userText = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setIsLoading(true);
    try {
      const result = await chatSession.sendMessage({ message: userText });
      setMessages((prev) => [...prev, { role: 'model', text: result.text || "I'm speechless." }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'model', text: 'Lost the signal. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`radio-btn press fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-md transition-transform duration-300 md:bottom-8 md:right-8 ${isOpen ? 'rotate-45' : 'hover:scale-105 hover:-rotate-6'}`}
        aria-label="Toggle AI chat"
      >
        {isOpen ? <Icon.Close size={22} /> : <Icon.Chat size={24} />}
      </button>

      {isOpen && (
        <div className="card-paper pop-in fixed bottom-24 right-4 z-40 flex max-h-[540px] w-[calc(100vw-2rem)] flex-col sm:w-96 md:right-8">
          <span className="tape" />
          <header className="sign sign-green">
            <h2 className="sign-title">CB radio</h2>
            <span className="sign-meta inline-flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${offline ? 'bg-white/40' : 'pulse-dot bg-[rgb(var(--sign-yellow))]'}`} />
              {offline ? 'off air' : `ask about ${firstName}`}
            </span>
          </header>

          <div className="min-h-[300px] flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-5">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-md px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[rgb(var(--sign-blue))] text-white'
                    : 'border border-ink/15 bg-white/70 text-ink dark:bg-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-md border border-ink/15 bg-white/70 px-3 py-2 text-sm dark:bg-white/5">
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/50" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="flex gap-2 border-t border-dashed border-ink/20 p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Over to you…"
              className="flex-1 rounded-md border border-ink/20 bg-white/70 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink/45 focus:border-[rgb(var(--sign-green))] dark:bg-white/5"
            />
            <button type="submit" disabled={!input.trim() || isLoading} className="btn-sign press grid h-9 w-9 place-items-center rounded-md disabled:opacity-40" aria-label="Send">
              <Icon.Send size={15} />
            </button>
          </form>
          <span className="fold" />
        </div>
      )}
    </>
  );
};
