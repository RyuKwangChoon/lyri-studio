import type { CrawlResult } from './crawlerTypes'
import { normalizePrice } from './normalizePrice'

function cleanText(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function findByDataQa(html: string, qaName: string): string | null {
  const re = new RegExp(
    `<[^>]+data-qa-name=["']${qaName}["'][^>]*>([\\s\\S]*?)<\\/[^>]+>`,
    'i'
  )

  const match = html.match(re)
  return match ? cleanText(match[1]) : null
}

export function parseOliveYoungPage(html: string): CrawlResult {
  const productName =
    findByDataQa(html, 'text-product-name') ||
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null

  // 올리브영 현재 판매가: discount-price 우선
  const discountPriceText = findByDataQa(html, 'text-product-discount-price')
  const originalPriceText = findByDataQa(html, 'text-product-original-price')

  const price =
    normalizePrice(discountPriceText) ||
    normalizePrice(originalPriceText)

  if (!price) {
    return {
      status: 'FAILED',
      productName: productName ? cleanText(productName) : null,
      seller: null,
      price: null,
      errorMessage: 'OLIVEYOUNG_PARSE_PRICE_FAILED'
    }
  }

  return {
    status: 'SUCCESS',
    productName: productName ? cleanText(productName) : null,
    seller: null,
    price,
    errorMessage: null
  }
}
