import type { CrawlResult, PriceCandidate } from './crawlerTypes'
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

function findByDataQa(html: string, qaName: string): string | null {
  const re = new RegExp(
    `<([a-z0-9]+)[^>]+data-qa-name=["']${qaName}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
    'i'
  )

  const match = html.match(re)
  return match ? cleanText(match[2]) : null
}

function findMetaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  )

  const match = html.match(re)
  return match ? cleanText(match[1]) : null
}

function findJsonNumber(html: string, key: string): number | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"?([0-9]{1,10})"?`, 'i')
  const match = html.match(re)

  if (!match) return null

  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

function findProductId(html: string): string | null {
  const ogUrl = findMetaContent(html, 'og:url')
  if (!ogUrl) return null

  try {
    const u = new URL(ogUrl)
    return u.searchParams.get('goodsNo')
  } catch {
    return null
  }
}

export function parseOliveYoungPage(html: string): CrawlResult {
  const productName =
    findByDataQa(html, 'text-product-title') ||
    findByDataQa(html, 'text-product-name') ||
    findMetaContent(html, 'og:title') ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null

  const productId = findProductId(html)

  const discountPriceText = findByDataQa(html, 'text-product-discount-price')
  const originalPriceText = findByDataQa(html, 'text-product-original-price')

  const domDiscountPrice = normalizePrice(discountPriceText)
  const domOriginalPrice = normalizePrice(originalPriceText)

  const jsonSalePrice = findJsonNumber(html, 'salePrice')
  const jsonFinalPrice = findJsonNumber(html, 'finalPrice')
  const jsonMaxBenefitPrice = findJsonNumber(html, 'maxBenefitPrice')

  /**
   * 1차 안정형 기준:
   * DOM 할인 판매가가 있으면 화면 표시가로 우선 사용한다.
   * DOM 가격이 없을 때 Next data 가격을 fallback으로 사용한다.
   */
  const originPrice = jsonSalePrice || domOriginalPrice
  const displayPrice = domDiscountPrice || jsonFinalPrice || jsonMaxBenefitPrice || jsonSalePrice || domOriginalPrice
  const benefitPrice = jsonMaxBenefitPrice || jsonFinalPrice || null

  const price = displayPrice || null

  const priceCandidates: PriceCandidate[] = []

  if (originPrice) {
    priceCandidates.push({
      role: 'ORIGIN',
      value: originPrice,
      sourceType: jsonSalePrice ? 'JS_STATE' : 'DOM',
      path: jsonSalePrice ? 'salePrice' : 'data-qa-name="text-product-original-price"'
    })
  }

  if (displayPrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: displayPrice,
      sourceType: domDiscountPrice ? 'DOM' : 'JS_STATE',
      path: domDiscountPrice ? 'data-qa-name="text-product-discount-price"' : 'finalPrice / maxBenefitPrice / salePrice'
    })
  }

  if (benefitPrice) {
    priceCandidates.push({
      role: 'BENEFIT',
      value: benefitPrice,
      sourceType: 'JS_STATE',
      path: jsonMaxBenefitPrice ? 'maxBenefitPrice' : 'finalPrice'
    })
  }

  if (!price) {
    return {
      status: 'FAILED',
      market: 'OLIVEYOUNG',
      productId,
      productName: productName ? cleanText(productName) : null,
      seller: '올리브영',
      price: null,
      originPrice,
      displayPrice,
      benefitPrice,
      priceCandidates,
      errorMessage: 'OLIVEYOUNG_PARSE_PRICE_FAILED'
    }
  }

  return {
    status: 'SUCCESS',
    market: 'OLIVEYOUNG',
    productId,
    productName: productName ? cleanText(productName) : null,
    seller: '올리브영',
    price,
    originPrice,
    displayPrice,
    benefitPrice,
    priceCandidates,
    errorMessage: null
  }
}
