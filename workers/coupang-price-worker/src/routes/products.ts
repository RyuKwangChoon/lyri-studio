import type { AppContext } from '../env';
import { requireAuth } from '../auth';
import { parseProductCsv } from '../utils/csv';
import { json } from '../utils/response';
import { deactivateProduct, listProducts, updateProduct, upsertProduct } from '../db/productsRepo';

export async function getProducts(ctx: AppContext): Promise<Response> {
  return json({ ok: true, items: await listProducts(ctx.env.DB) }, {}, ctx.env);
}

export async function postProduct(ctx: AppContext): Promise<Response> {
  if (!requireAuth(ctx.request, ctx.env)) return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }, ctx.env);
  const body = await ctx.request.json<any>();
  await upsertProduct(ctx.env.DB, body.url, body.memo);
  return json({ ok: true }, {}, ctx.env);
}

export async function importProducts(ctx: AppContext): Promise<Response> {
  if (!requireAuth(ctx.request, ctx.env)) return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }, ctx.env);
  const csv = await ctx.request.text();
  const rows = parseProductCsv(csv);
  let inserted = 0;
  for (const r of rows) {
    await upsertProduct(ctx.env.DB, r.url, r.memo);
    inserted++;
  }
  return json({ ok: true, total: rows.length, inserted, skipped: 0 }, {}, ctx.env);
}

export async function patchProduct(ctx: AppContext): Promise<Response> {
  if (!requireAuth(ctx.request, ctx.env)) return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }, ctx.env);
  const id = Number(ctx.params.id);
  const body = await ctx.request.json<any>();
  await updateProduct(ctx.env.DB, id, body.memo ?? null, body.isActive ? 1 : 0);
  return json({ ok: true }, {}, ctx.env);
}

export async function deleteProduct(ctx: AppContext): Promise<Response> {
  if (!requireAuth(ctx.request, ctx.env)) return json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 }, ctx.env);
  await deactivateProduct(ctx.env.DB, Number(ctx.params.id));
  return json({ ok: true }, {}, ctx.env);
}
