import React, { useEffect, useRef, useState } from 'react';
import { ChatSession, createChatSession } from '../services/gemini';
import { ChatMessage } from '../types';
import { useProfile } from '../hooks/usePortfolio';
import { Icon } from './ui';

/*
 * The assistant arrives by spaceship. Press the launch pad and a little rocket drops in from the
 * top of the screen on a column of fire and smoke, lands, and the chat box pops open underneath it
 * with the pilot leaning out to point at the input. Closing it lifts off again.
 */

type Phase = 'closed' | 'landing' | 'open' | 'leaving';
const LAND_MS = 1500;
const LEAVE_MS = 900;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Ship: React.FC = () => (
  <svg className="ship-svg" viewBox="0 0 120 150" aria-hidden="true">
    <path d="M30 84 L10 120 L38 108 Z" fill="#1e5aa8" />
    <path d="M90 84 L110 120 L82 108 Z" fill="#1e5aa8" />
    <path d="M30 84 L10 120 L24 116 Z" fill="#163f78" />
    <path d="M60 6 C84 24 90 60 88 100 L32 100 C30 60 36 24 60 6 Z" fill="#d7263d" />
    <path d="M60 6 C72 20 78 44 78 100 L60 100 Z" fill="#b01a2f" opacity=".55" />
    <path d="M60 6 C52 16 46 30 44 50 C46 42 52 30 60 24 Z" fill="#ff8090" opacity=".7" />
    <rect x="32" y="76" width="56" height="9" fill="#fbf6ea" />
    <circle cx="60" cy="48" r="16" fill="#fbf6ea" />
    <circle cx="60" cy="48" r="12" fill="#9fd0ea" />
    {/* the pilot, waving from the window */}
    <circle cx="60" cy="50" r="7" fill="#f1c27d" />
    <path d="M52 46 C54 38 66 38 68 46 Z" fill="#1f7a3f" />
    <circle cx="57.5" cy="50" r="1.2" fill="#1c1612" />
    <circle cx="62.5" cy="50" r="1.2" fill="#1c1612" />
    <path d="M57 54 Q60 56.5 63 54" stroke="#1c1612" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    <circle cx="53" cy="41" r="3" fill="#fff" opacity=".85" />
    <path d="M40 100 L80 100 L74 114 L46 114 Z" fill="#5a5a62" />
    <path d="M46 114 L74 114 L71 119 L49 119 Z" fill="#3b3b42" />
    <path d="M38 102 L22 130" stroke="#5a5a62" strokeWidth="5" strokeLinecap="round" />
    <path d="M82 102 L98 130" stroke="#5a5a62" strokeWidth="5" strokeLinecap="round" />
    <path d="M14 131 L30 131" stroke="#3b3b42" strokeWidth="5" strokeLinecap="round" />
    <path d="M90 131 L106 131" stroke="#3b3b42" strokeWidth="5" strokeLinecap="round" />
    <g className="ship-flame">
      <path d="M48 118 C50 146 70 146 72 118 Z" fill="#f4a300" />
      <path d="M53 118 C55 136 65 136 67 118 Z" fill="#fff35c" />
      <path d="M57 118 C58 128 62 128 63 118 Z" fill="#fff" opacity=".8" />
    </g>
  </svg>
);

const Pilot: React.FC = () => (
  <svg className="pilot-svg" viewBox="0 0 132 120" aria-hidden="true">
    <path d="M28 124 C28 92 44 84 60 84 C76 84 92 92 92 124 Z" fill="#1e5aa8" />
    <path d="M52 86 L60 102 L68 86 Z" fill="#fbf6ea" />
    <circle cx="60" cy="56" r="24" fill="#f1c27d" />
    <path d="M36 52 C40 30 80 30 84 52 L84 58 C78 46 42 46 36 58 Z" fill="#2b1a12" />
    <path d="M35 50 C40 28 80 28 85 50 Z" fill="#1f7a3f" />
    <rect x="30" y="47" width="60" height="7" rx="3.5" fill="#1a6a36" />
    <circle cx="51" cy="61" r="3" fill="#1c1612" />
    <circle cx="69" cy="61" r="3" fill="#1c1612" />
    <circle cx="52.5" cy="59.5" r="1" fill="#fff" />
    <circle cx="70.5" cy="59.5" r="1" fill="#fff" />
    <path d="M50 70 Q60 79 70 70" stroke="#1c1612" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="44" cy="68" r="4" fill="#ff8c8c" opacity=".45" />
    <circle cx="76" cy="68" r="4" fill="#ff8c8c" opacity=".45" />
    <g className="pilot-arm">
      <path d="M86 98 L112 72" stroke="#1e5aa8" strokeWidth="13" strokeLinecap="round" />
      <circle cx="114" cy="70" r="8.5" fill="#f1c27d" />
      <path d="M118 64 L127 50" stroke="#f1c27d" strokeWidth="7" strokeLinecap="round" />
    </g>
  </svg>
);

export const AIChat: React.FC = () => {
  const { data: profile } = useProfile();
  const firstName = profile?.full_name?.split(' ')[0] || 'AI';
  const [phase, setPhase] = useState<Phase>('closed');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [offline, setOffline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const isOpen = phase === 'open' || phase === 'landing';

  const toggle = () => {
    window.clearTimeout(timer.current);
    if (phase === 'closed' || phase === 'leaving') {
      if (reducedMotion()) return setPhase('open');
      setPhase('landing');
      timer.current = window.setTimeout(() => setPhase('open'), LAND_MS);
    } else {
      if (reducedMotion()) return setPhase('closed');
      setPhase('leaving');
      timer.current = window.setTimeout(() => setPhase('closed'), LEAVE_MS);
    }
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggle();
    window.addEventListener('keydown', onKey);
    const focus = window.setTimeout(() => inputRef.current?.focus(), 900);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.clearTimeout(focus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (profile?.full_name && messages.length === 0) {
      setMessages([
        { role: 'model', text: `Touchdown! I'm ${firstName}'s co-pilot. Ask me about the projects, the stack, or how to get in touch.` },
      ]);
    }
  }, [profile, firstName, messages.length]);

  // Start the session while the ship is still landing, so it's ready by the time the box opens
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
        onClick={toggle}
        className={`launch-btn press fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8 ${phase !== 'closed' ? 'is-open' : ''}`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
      >
        {phase === 'closed' || phase === 'leaving' ? (
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" className="launch-icon">
            <path d="M12 2c3.5 2.5 5 6.5 5 11l-2 2H9l-2-2c0-4.5 1.5-8.5 5-11z" fill="#d7263d" />
            <circle cx="12" cy="9.5" r="2.2" fill="#9fd0ea" />
            <path d="M7 11l-3 4 3-.5zM17 11l3 4-3-.5z" fill="#1e5aa8" />
            <path d="M10 15.5h4l-2 5z" fill="#f4a300" />
          </svg>
        ) : (
          <Icon.Close size={22} />
        )}
        <span className="launch-ring" aria-hidden="true" />
      </button>

      {phase !== 'closed' && (
        <div className={`chat-stage phase-${phase} fixed bottom-24 right-4 z-40 w-[calc(100vw-2rem)] sm:w-96 md:right-8`}>
          <div className="ship-pad" aria-hidden="true">
            <div className="ship">
              <Ship />
            </div>
            <div className="smoke">
              {Array.from({ length: 9 }, (_, i) => (
                <span key={i} style={{ '--d': `${i * 0.11}s`, '--x': `${(i % 3 - 1) * 26 + (i % 2 ? 8 : -8)}px`, '--s': `${0.8 + (i % 4) * 0.25}` } as React.CSSProperties} />
              ))}
            </div>
            <div className="dust" />
          </div>

          {(phase === 'open' || phase === 'leaving') && (
            <div className="chat-box card-paper flex max-h-[560px] flex-col">
              <header className="sign sign-green">
                <h2 className="sign-title">Co-pilot</h2>
                <span className="sign-meta inline-flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${offline ? 'bg-white/40' : 'pulse-dot bg-[rgb(var(--sign-yellow))]'}`} />
                  {offline ? 'off air' : 'on comms'}
                </span>
              </header>

              {/* The pilot leans out and points at the input */}
              <div className="pilot-strip">
                <div className="pilot-window">
                  <Pilot />
                </div>
                <div className="bubble">
                  <p className="marker text-[17px] leading-tight text-[#1c1612]">Ask me anything about {firstName}!</p>
                  <p className="mt-0.5 text-[11.5px] text-[#1c1612]/60">Projects, stack, availability, how to reach him.</p>
                </div>
              </div>

              <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto px-4 pb-3 pt-3">
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
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your question…"
                  className="flex-1 rounded-md border border-ink/20 bg-white/70 px-3 py-2 text-sm text-ink outline-none transition-colors placeholder:text-ink/45 focus:border-[rgb(var(--sign-green))] dark:bg-white/5"
                />
                <button type="submit" disabled={!input.trim() || isLoading} className="btn-sign press grid h-9 w-9 place-items-center rounded-md disabled:opacity-40" aria-label="Send">
                  <Icon.Send size={15} />
                </button>
              </form>
              <span className="fold" />
            </div>
          )}
        </div>
      )}
    </>
  );
};
