import type { Env } from '../env';

export function json(data: unknown, init: ResponseInit = {}, env?: Env): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');
  if (env) {
    headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || '*');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function text(data: string, init: ResponseInit = {}, env?: Env): Response {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  if (env) {
    headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGIN || '*');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  }
  return new Response(data, { ...init, headers });
}
