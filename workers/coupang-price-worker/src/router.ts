import type { AppContext, Env } from './env';
import { health } from './routes/health';
import { deleteProduct, getProducts, importProducts, patchProduct, postProduct } from './routes/products';
import { getScheduleRoute, putScheduleRoute } from './routes/settings';
import { crawlLogsRoute, runCrawlRoute } from './routes/crawl';
import { snapshotsRoute,handleSnapshotsLatest } from './routes/snapshots';
import { compareChangedRoute, compareFailedRoute, compareRoute } from './routes/compare';
import { exportCompare, exportProducts } from './routes/export';
import { json } from './utils/response';

export async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, '') || '/';
  const method = request.method.toUpperCase();

  const ctx = (params: Record<string, string> = {}): AppContext => ({ request, env, params });

  if (method === 'GET' && path === '/health') return health(ctx());

  if (method === 'GET' && path === '/products') return getProducts(ctx());
  if (method === 'POST' && path === '/products') return postProduct(ctx());
  if (method === 'POST' && path === '/products/import') return importProducts(ctx());

  const productMatch = path.match(/^\/products\/(\d+)$/);
  if (productMatch && method === 'PATCH') return patchProduct(ctx({ id: productMatch[1] }));
  if (productMatch && method === 'DELETE') return deleteProduct(ctx({ id: productMatch[1] }));

  if (method === 'GET' && path === '/settings/schedule') return getScheduleRoute(ctx());
  if (method === 'PUT' && path === '/settings/schedule') return putScheduleRoute(ctx());

  if (method === 'POST' && path === '/crawl/run') return runCrawlRoute(ctx());
  if (method === 'GET' && path === '/crawl/logs') return crawlLogsRoute(ctx());

  if (method === 'GET' && path === '/snapshots/latest') {  return handleSnapshotsLatest(request, env);  }

  if (method === 'GET' && path === '/snapshots') return snapshotsRoute(ctx());

  if (method === 'GET' && path === '/compare') return compareRoute(ctx());
  if (method === 'GET' && path === '/compare/changed') return compareChangedRoute(ctx());
  if (method === 'GET' && path === '/compare/failed') return compareFailedRoute(ctx());

  if (method === 'GET' && path === '/export/products.csv') return exportProducts(ctx());
  if (method === 'GET' && path === '/export/compare.csv') return exportCompare(ctx());

  
   
  return json({ ok: false, error: 'NOT_FOUND', path }, { status: 404 }, env);
}
