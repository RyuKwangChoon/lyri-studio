import type { AppContext } from '../env';
import { compareByDate } from '../services/compareService';
import { getSchedule } from '../db/settingsRepo';
import { kstDateString } from '../utils/dateKst';
import { json } from '../utils/response';

export async function compareRoute(ctx: AppContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const date = url.searchParams.get('date') || kstDateString();
  const setting = await getSchedule(ctx.env.DB);
  return json({ ok: true, ...(await compareByDate(ctx.env.DB, date, setting.baseTime, setting.timezone)) }, {}, ctx.env);
}

export async function compareChangedRoute(ctx: AppContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const date = url.searchParams.get('date') || kstDateString();
  const setting = await getSchedule(ctx.env.DB);
  const data = await compareByDate(ctx.env.DB, date, setting.baseTime, setting.timezone);
  return json({ ok: true, ...data, items: data.items.filter((x: any) => x.changeMark === 'O') }, {}, ctx.env);
}

export async function compareFailedRoute(ctx: AppContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const date = url.searchParams.get('date') || kstDateString();
  const setting = await getSchedule(ctx.env.DB);
  const data = await compareByDate(ctx.env.DB, date, setting.baseTime, setting.timezone);
  return json({ ok: true, ...data, items: data.items.filter((x: any) => ['FAILED','NO_PREV','NO_TODAY'].includes(x.status)) }, {}, ctx.env);
}
