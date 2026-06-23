export interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  API_TOKEN?: string;
}

export interface AppContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}
