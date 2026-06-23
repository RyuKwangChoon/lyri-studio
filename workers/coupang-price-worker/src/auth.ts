import type { Env } from './env';

export function requireAuth(request: Request, env: Env): boolean {
  if (!env.API_TOKEN) return true;
  const header = request.headers.get('Authorization') || '';
  return header === `Bearer ${env.API_TOKEN}`;
}
