// Vercel serverless function for /api/chat. Kept so the site can still deploy on Vercel;
// the primary host is Cloudflare Pages (portfolio-frontend/functions/api/chat.ts).
import { chatStatus, handleChat, type ChatEnv } from '../portfolio-frontend/server/chatHandler';

const env = (): ChatEnv => ({
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
});

export function GET() {
  return chatStatus(env());
}

export function POST(request: Request) {
  return handleChat(request, env());
}
