import type { Env } from './env';
import { handleOptions } from './cors';
import { route } from './router';
import { runScheduled } from './services/scheduleService';
import { json } from './utils/response';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return handleOptions(env);
    try {
      return await route(request, env);
    } catch (error) {
      return json({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 }, env);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    await runScheduled(env.DB);
  }
};
