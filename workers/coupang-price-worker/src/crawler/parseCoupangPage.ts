import { normalizePrice } from './normalizePrice';
import type { CrawlResult } from './crawlerTypes';

export async function hashText(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text.slice(0, 200000));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function parseCoupangPage(html: string): Promise<CrawlResult> {
  // PoC용 휴리스틱 파서.
  // 실제 쿠팡 HTML 구조에 맞춰 반드시 테스트 후 보정해야 한다.
  const rawHash = await hashText(html);

  const title = pickFirst([
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i
  ], html);

  const priceText = pickFirst([
    /totalPrice[^0-9]{0,40}([0-9,]{3,})/i,
    /salePrice[^0-9]{0,40}([0-9,]{3,})/i,
    /price-value[^>]*>\s*([0-9,]+)\s*</i,
    /([0-9]{1,3}(?:,[0-9]{3})+)\s*원/i
  ], html);

  const seller = pickFirst([
    /판매자[^<]{0,80}<[^>]*>\s*([^<]{1,80})\s*</i,
    /seller[^>]{0,80}>\s*([^<]{1,80})\s*</i
  ], html);

  const price = normalizePrice(priceText);
  if (!price) {
    return {
      status: 'FAILED',
      productName: clean(title),
      seller: clean(seller),
      price: null,
      rawHash,
      errorMessage: 'PRICE_NOT_FOUND_BY_POC_PARSER'
    };
  }

  return {
    status: 'SUCCESS',
    productName: clean(title),
    seller: clean(seller),
    price,
    rawHash
  };
}

function pickFirst(patterns: RegExp[], text: string): string | null {
  for (const p of patterns) {
    const m = p.exec(text);
    if (m?.[1]) return decodeHtml(m[1]);
  }
  return null;
}

function clean(s: string | null): string | null {
  if (!s) return null;
  return s.replace(/\s+/g, ' ').trim();
}

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
