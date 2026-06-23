import type { AppContext } from '../env';
import { requireAuth } from '../auth';
import { listRuns } from '../db/runsRepo';
import { getSchedule } from '../db/settingsRepo';
import { runCrawl } from '../services/crawlService';
import { json } from '../utils/response';

export async function runCrawlRoute(ctx: AppContext): Promise<Response> {
  if (!requireAuth(ctx.request, ctx.env)) return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }, ctx.env);
  const body = await ctx.request.json<any>().catch(() => ({}));
  const setting = await getSchedule(ctx.env.DB);
  const result = await runCrawl(ctx.env.DB, {
    runType: 'MANUAL',
    baseDate: body.baseDate,
    baseTime: body.baseTime || setting.baseTime,
    timezone: body.timezone || setting.timezone
  });
  return json({ ok: true, ...result }, {}, ctx.env);
}

export async function crawlLogsRoute(ctx: AppContext): Promise<Response> {
  return json({ ok: true, items: await listRuns(ctx.env.DB) }, {}, ctx.env);
}
