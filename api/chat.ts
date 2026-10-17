// Vercel serverless function: the only place the Gemini API key is used.
// The browser sends the conversation here; the key never leaves the server.
import { buildSystemInstruction } from '../portfolio-frontend/services/chatPrompt';

const MODEL = 'gemini-2.5-flash';
const MAX_TURNS = 20;
const MAX_CHARS = 1000;
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_MS = 10 * 60 * 1000; // per 10 minutes per IP

type Turn = { role: 'user' | 'model'; text: string };

// Best effort: each warm function instance keeps its own counts
const hits = new Map<string, number[]>();

const rateLimited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
};

// Only this site (and local dev) may call the endpoint from a browser
const allowedOrigin = (origin: string | null) => {
  if (!origin) return true; // same-origin requests may omit it
  try {
    const { hostname } = new URL(origin);
    const extra = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      extra.includes(hostname)
    );
  } catch {
    return false;
  }
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

const validTurns = (value: unknown): value is Turn[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.length <= MAX_TURNS &&
  value.every(
    (t) =>
      t &&
      (t.role === 'user' || t.role === 'model') &&
      typeof t.text === 'string' &&
      t.text.length > 0 &&
      t.text.length <= MAX_CHARS
  ) &&
  value[value.length - 1].role === 'user';

/** GET tells the chat widget whether the assistant is switched on. */
export async function GET() {
  return json({ configured: Boolean(process.env.GEMINI_API_KEY) });
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: 'Chat is not configured' }, 503);
  if (!allowedOrigin(request.headers.get('origin'))) return json({ error: 'Forbidden' }, 403);

  const ip = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return json({ error: 'Too many messages, try again in a few minutes' }, 429);

  let body: { messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!validTurns(body.messages)) return json({ error: 'Invalid messages' }, 400);

  const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: buildSystemInstruction() }] },
      contents: body.messages.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig: { maxOutputTokens: 400, temperature: 0.7 },
    }),
  });

  if (!upstream.ok) {
    console.error('Gemini error', upstream.status, await upstream.text());
    return json({ error: 'The assistant is unavailable right now' }, 502);
  }

  const data = await upstream.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  return json({ text });
}
