import type { AppContext } from '../env';
import { json } from '../utils/response';

export async function health(ctx: AppContext): Promise<Response> {
  return json({ ok: true, service: 'coupang-price-worker', time: new Date().toISOString() }, {}, ctx.env);
}
