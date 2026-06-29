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

function pickFirstNumber(...values: Array<number | null | undefined>): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return value
    }
  }

  return null
}

function findProductId(html: string): string | null {
  const productUrl =
    findJsonString(html, 'productUrl') ||
    findMetaContent(html, 'og:url') ||
    findMetaContent(html, 'twitter:url')

  if (productUrl) {
    const match = productUrl.match(/\/products\/(\d+)/)
    if (match) return match[1]
  }

  const id = findJsonNumber(html, 'id')
  return id ? String(id) : null
}

function findProductName(html: string): string | null {
  return (
    findMetaContent(html, 'kakao:commerce:product_name') ||
    findJsonString(html, 'name') ||
    findMetaContent(html, 'og:title') ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null
  )
}

function findSeller(html: string): string | null {
  return (
    findJsonString(html, 'channelName') ||
    findJsonString(html, 'representName') ||
    findMetaContent(html, 'kakao:commerce:brand_name') ||
    null
  )
}

function findUnavailableReason(html: string): string | null {
  const productStatusType = findJsonString(html, 'productStatusType')
  const statusType = findJsonString(html, 'statusType')
  const displayStatusType = findJsonString(html, 'channelProductDisplayStatusType')

  if (productStatusType && productStatusType !== 'SALE') {
    return `NAVER_SMARTSTORE_PRODUCT_STATUS_${productStatusType}`
  }

  if (statusType && statusType !== 'SALE') {
    return `NAVER_SMARTSTORE_STATUS_${statusType}`
  }

  if (displayStatusType && displayStatusType !== 'ON') {
    return `NAVER_SMARTSTORE_DISPLAY_STATUS_${displayStatusType}`
  }

  return null
}

export function parseNaverSmartStorePage(html: string): CrawlResult {
  const productId = findProductId(html)
  const productName = findProductName(html)
  const seller = findSeller(html)

  const metaRegularPrice = normalizePrice(findMetaContent(html, 'kakao:commerce:regular_price'))
  const metaPrice = normalizePrice(findMetaContent(html, 'kakao:commerce:price'))

  const salePrice = findJsonNumber(html, 'salePrice')
  const dispSalePrice = findJsonNumber(html, 'dispSalePrice')

  const discountedSalePrice = findJsonNumber(html, 'discountedSalePrice')
  const mobileDiscountedSalePrice = findJsonNumber(html, 'mobileDiscountedSalePrice')
  const dispDiscountedSalePrice = findJsonNumber(html, 'dispDiscountedSalePrice')

  const originPrice = pickFirstNumber(salePrice, metaRegularPrice, metaPrice)
  const displayPrice = pickFirstNumber(
    dispDiscountedSalePrice,
    discountedSalePrice,
    mobileDiscountedSalePrice,
    dispSalePrice,
    salePrice,
    metaPrice,
    metaRegularPrice
  )
  const benefitPrice = pickFirstNumber(discountedSalePrice, mobileDiscountedSalePrice, displayPrice)

  const price = displayPrice
  const unavailableReason = findUnavailableReason(html)

  const priceCandidates: PriceCandidate[] = []

  if (originPrice) {
    priceCandidates.push({
      role: 'ORIGIN',
      value: originPrice,
      sourceType: salePrice ? 'JS_STATE' : 'META',
      path: salePrice ? 'salePrice' : 'kakao:commerce:regular_price'
    })
  }

  if (displayPrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: displayPrice,
      sourceType: dispDiscountedSalePrice || discountedSalePrice ? 'JS_STATE' : 'META',
      path: dispDiscountedSalePrice
        ? 'benefitsView.dispDiscountedSalePrice'
        : discountedSalePrice
          ? 'benefitsView.discountedSalePrice'
          : 'kakao:commerce:price'
    })
  }

  if (benefitPrice) {
    priceCandidates.push({
      role: 'BENEFIT',
      value: benefitPrice,
      sourceType: discountedSalePrice || mobileDiscountedSalePrice ? 'JS_STATE' : 'META',
      path: discountedSalePrice
        ? 'benefitsView.discountedSalePrice'
        : mobileDiscountedSalePrice
          ? 'benefitsView.mobileDiscountedSalePrice'
          : 'displayPrice'
    })
  }

  if (unavailableReason) {
    return {
      status: 'FAILED',
      market: 'NAVER_SMARTSTORE',
      productId,
      productName: productName ? cleanText(productName) : null,
      seller: seller ? cleanText(seller) : null,
      price: null,
      originPrice,
      displayPrice,
      benefitPrice,
      priceCandidates,
      errorMessage: unavailableReason
    }
  }

  if (!price) {
    return {
      status: 'FAILED',
      market: 'NAVER_SMARTSTORE',
      productId,
      productName: productName ? cleanText(productName) : null,
      seller: seller ? cleanText(seller) : null,
      price: null,
      originPrice,
      displayPrice,
      benefitPrice,
      priceCandidates,
      errorMessage: 'NAVER_SMARTSTORE_PARSE_PRICE_FAILED'
    }
  }

  return {
    status: 'SUCCESS',
    market: 'NAVER_SMARTSTORE',
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
