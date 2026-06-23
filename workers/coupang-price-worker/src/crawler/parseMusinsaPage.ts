import type { CrawlResult } from './crawlerTypes'
import { normalizePrice } from './normalizePrice'

function cleanText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function pickPrice(value: string | null | undefined): number | null {
  if (!value) return null
  return normalizePrice(value)
}

function findTitle(html: string): string | null {
  const ogTitle =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<meta[^>]+name=["']title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null

  return ogTitle ? cleanText(ogTitle) : null
}

function findMusinsaJsonPrice(html: string): number | null {
  // 무신사 Worker fetch HTML 기준:
  // 브라우저 DOM의 Price__CalculatedPrice는 원본 HTML에 없고,
  // JSON 데이터의 finalPrice가 실제 화면 판매가에 해당함.
  const finalPriceMatch = html.match(/"finalPrice"\s*:\s*"?([0-9]{4,7})"?/i)

  if (finalPriceMatch) {
    const price = pickPrice(finalPriceMatch[1])
    console.log('[MUSINSA] picked finalPrice:', price)
    if (price) return price
  }

  // fallback. salePrice는 정가/쿠폰 전 가격일 수 있으므로 최후 보조값.
  const salePriceMatch = html.match(/"salePrice"\s*:\s*"?([0-9]{4,7})"?/i)

  if (salePriceMatch) {
    const price = pickPrice(salePriceMatch[1])
    console.log('[MUSINSA] fallback salePrice:', price)
    if (price) return price
  }

  return null
}

function logMusinsaPriceCandidates(html: string) {
  console.log('[MUSINSA] html length:', html.length)
  console.log('[MUSINSA] has 11,880:', html.includes('11,880'))
  console.log('[MUSINSA] has 11880:', html.includes('11880'))
  console.log('[MUSINSA] has 15,840:', html.includes('15,840'))
  console.log('[MUSINSA] has 15840:', html.includes('15840'))

  const numericKeys =
    html.match(/"(salePrice|finalPrice)"\s*:\s*"?[0-9]{4,7}"?/gi) || []

  console.log('[MUSINSA] price candidates:', numericKeys.slice(0, 20))
}

export function parseMusinsaPage(html: string): CrawlResult {
  console.log('[MUSINSA] parseMusinsaPage start')

  logMusinsaPriceCandidates(html)

  const productName = findTitle(html)
  console.log('[MUSINSA] productName:', productName)

  const price = findMusinsaJsonPrice(html)
  console.log('[MUSINSA] final price:', price)

  if (!price) {
    console.log('[MUSINSA] parse failed: MUSINSA_PARSE_PRICE_FAILED')

    return {
      status: 'FAILED',
      productName,
      seller: null,
      price: null,
      errorMessage: 'MUSINSA_PARSE_PRICE_FAILED'
    }
  }

  console.log('[MUSINSA] parse success:', price)

  return {
    status: 'SUCCESS',
    productName,
    seller: null,
    price,
    errorMessage: null
  }
}
