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

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value
  }
}

function findMetaContent(html: string, key: string): string | null {
  const escapedKey = escapeRegExp(key)

  const re = new RegExp(
    `<meta\\b(?=[^>]*(?:property|name)=["']${escapedKey}["'])(?=[^>]*content=["']([^"']*)["'])[^>]*>`,
    'i'
  )

  const match = html.match(re)
  return match ? cleanText(match[1]) : null
}

function findJsonString(html: string, key: string): string | null {
  const escapedKey = escapeRegExp(key)
  const re = new RegExp(`"${escapedKey}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i')
  const match = html.match(re)

  return match ? cleanText(decodeJsonString(match[1])) : null
}

function findJsonNumber(html: string, key: string): number | null {
  const escapedKey = escapeRegExp(key)
  const re = new RegExp(`"${escapedKey}"\\s*:\\s*"?([0-9]{1,12})"?`, 'i')
  const match = html.match(re)

  if (!match) return null

  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

function findJsonNumberAfterAnchor(
  html: string,
  anchor: string,
  key: string,
  windowSize = 60000
): number | null {
  const idx = html.indexOf(`"${anchor}"`)

  if (idx < 0) return null

  const sliced = html.slice(idx, idx + windowSize)
  return findJsonNumber(sliced, key)
}

function pickFirstNumber(...values: Array<number | null | undefined>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value
    }
  }

  return null
}

function findProductId(html: string): string | null {
  const ogUrl =
    findMetaContent(html, 'og:url') ||
    findMetaContent(html, 'twitter:url') ||
    findJsonString(html, 'productUrl')

  if (ogUrl) {
    const match = ogUrl.match(/\/products\/(\d+)/)
    if (match) return match[1]
  }

  const channelProductNo = findJsonNumber(html, 'channelProductNo')
  return channelProductNo ? String(channelProductNo) : null
}

function findProductName(html: string): string | null {
  return (
    findMetaContent(html, 'kakao:commerce:product_name') ||
    findJsonString(html, 'productName') ||
    findJsonString(html, 'name') ||
    findMetaContent(html, 'og:title') ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null
  )
}

function findSeller(html: string): string | null {
  return (
    findMetaContent(html, 'kakao:commerce:brand_name') ||
    findJsonString(html, 'brandName') ||
    null
  )
}

export function parseNaverBrandStorePage(html: string): CrawlResult {
  const productId = findProductId(html)
  const productName = findProductName(html)
  const seller = findSeller(html)

  const metaRegularPrice = normalizePrice(findMetaContent(html, 'kakao:commerce:regular_price'))
  const metaPrice = normalizePrice(findMetaContent(html, 'kakao:commerce:price'))

  const originPrice = pickFirstNumber(
    findJsonNumberAfterAnchor(html, 'optimalDiscount', 'salePrice'),
    metaRegularPrice,
    metaPrice
  )

  const displayPrice = pickFirstNumber(
    findJsonNumberAfterAnchor(html, 'productBenefit', 'dispDiscountedSalePrice'),
    findJsonNumberAfterAnchor(html, 'productBenefit', 'discountedSalePrice'),
    findJsonNumberAfterAnchor(html, 'productBenefit', 'mobileDiscountedSalePrice'),
    metaPrice,
    originPrice,
    metaRegularPrice
  )

  const benefitPrice = pickFirstNumber(
    findJsonNumberAfterAnchor(html, 'totalDiscountResult', 'totalPayAmount'),
    findJsonNumberAfterAnchor(html, 'optimalDiscount', 'totalPayAmount'),
    displayPrice
  )

  const price = displayPrice

  const priceCandidates: PriceCandidate[] = []

  if (originPrice) {
    priceCandidates.push({
      role: 'ORIGIN',
      value: originPrice,
      sourceType: 'JS_STATE',
      path: 'optimalDiscount.productInfo.salePrice'
    })
  }

  if (displayPrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: displayPrice,
      sourceType: 'JS_STATE',
      path: 'productBenefit.benefitsView.dispDiscountedSalePrice'
    })
  }

  if (benefitPrice) {
    priceCandidates.push({
      role: 'BENEFIT',
      value: benefitPrice,
      sourceType: 'JS_STATE',
      path: 'optimalDiscount.totalDiscountResult.summary.totalPayAmount'
    })
  }

  if (!price) {
    return {
      status: 'FAILED',
      market: 'NAVER_BRANDSTORE',
      productId,
      productName: productName ? cleanText(productName) : null,
      seller: seller ? cleanText(seller) : null,
      price: null,
      originPrice,
      displayPrice,
      benefitPrice,
      priceCandidates,
      errorMessage: 'NAVER_BRANDSTORE_PARSE_PRICE_FAILED'
    }
  }

  return {
    status: 'SUCCESS',
    market: 'NAVER_BRANDSTORE',
    productId,
    productName: productName ? cleanText(productName) : null,
    seller: seller ? cleanText(seller) : null,
    price,
    originPrice,
    displayPrice,
    benefitPrice,
    priceCandidates,
    errorMessage: null
  }
}
