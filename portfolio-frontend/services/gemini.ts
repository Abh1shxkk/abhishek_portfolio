// Browser side of the chat. It talks to our own /api/chat function, which holds the
// Gemini API key on the server. Never import an API key into frontend code.

type Turn = { role: 'user' | 'model'; text: string };

// Must match the limits enforced in /api/chat
const MAX_TURNS = 20;
const MAX_CHARS = 1000;

export interface ChatSession {
  sendMessage: (args: { message: string }) => Promise<{ text: string }>;
}

/** Returns a session if the assistant is switched on, or null when it isn't configured. */
export const createChatSession = async (): Promise<ChatSession | null> => {
  const status = await fetch('/api/chat').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  if (!status?.configured) return null;

  const history: Turn[] = [];

  return {
    async sendMessage({ message }) {
      history.push({ role: 'user', text: message.slice(0, MAX_CHARS) });
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        // An odd-length window ending on the user's turn also starts on a user turn
        body: JSON.stringify({ messages: history.slice(-(MAX_TURNS - 1)) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        history.pop();
        throw new Error(data.error ?? `Chat failed (${res.status})`);
      }
      const text = String(data.text ?? '');
      history.push({ role: 'model', text: text.slice(0, MAX_CHARS) || '…' });
      return { text };
    },
  };
};
