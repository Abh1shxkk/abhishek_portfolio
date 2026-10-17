// Cloudflare Pages Function for /api/chat. Secrets arrive on context.env
// (set with `npx wrangler pages secret put GEMINI_API_KEY`).
import { chatStatus, handleChat, type ChatEnv } from '../../server/chatHandler';

type Context = { request: Request; env: ChatEnv };

export const onRequestGet = ({ env }: Context) => chatStatus(env);
export const onRequestPost = ({ request, env }: Context) => handleChat(request, env);
