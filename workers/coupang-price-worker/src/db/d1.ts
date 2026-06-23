import type { Env } from '../env';

export function db(env: Env): D1Database {
  return env.DB;
}
