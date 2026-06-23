import type { AppContext } from '../env';
import { listProducts } from '../db/productsRepo';
import { getSchedule } from '../db/settingsRepo';
import { compareByDate } from '../services/compareService';
import { kstDateString } from '../utils/dateKst';
import { toCsv } from '../utils/csv';
import { text } from '../utils/response';

export async function exportProducts(ctx: AppContext): Promise<Response> {
  const rows = await listProducts(ctx.env.DB);
  return text(toCsv(rows as any), { headers: { 'Content-Disposition': 'attachment; filename="products.csv"' } }, ctx.env);
}

export async function exportCompare(ctx: AppContext): Promise<Response> {
  const url = new URL(ctx.request.url);
  const date = url.searchParams.get('date') || kstDateString();
  const setting = await getSchedule(ctx.env.DB);
  const data = await compareByDate(ctx.env.DB, date, setting.baseTime, setting.timezone);
  return text(toCsv(data.items as any), { headers: { 'Content-Disposition': `attachment; filename="compare_${date}.csv"` } }, ctx.env);
}
