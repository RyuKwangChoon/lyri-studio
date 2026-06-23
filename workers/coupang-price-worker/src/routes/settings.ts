import type { AppContext } from '../env';
import { requireAuth } from '../auth';
import { getSchedule, setSchedule } from '../db/settingsRepo';
import { json } from '../utils/response';

export async function getScheduleRoute(ctx: AppContext): Promise<Response> {
  return json({ ok: true, schedule: await getSchedule(ctx.env.DB) }, {}, ctx.env);
}

export async function putScheduleRoute(ctx: AppContext): Promise<Response> {
  if (!requireAuth(ctx.request, ctx.env)) return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }, ctx.env);
  const body = await ctx.request.json<any>();
  await setSchedule(ctx.env.DB, {
    timezone: body.timezone || 'Asia/Seoul',
    baseTime: body.baseTime || '09:00',
    enabled: Boolean(body.enabled)
  });
  return json({ ok: true }, {}, ctx.env);
}
