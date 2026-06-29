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

function decodeJsonString(value: string): string {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value
  }
}

function findJsonString(html: string, key: string): string | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i')
  const match = html.match(re)
  return match ? cleanText(decodeJsonString(match[1])) : null
}

function findJsonNumberInBlock(block: string, key: string): number | null {
  const re = new RegExp(`"${key}"\\s*:\\s*"?([0-9]{1,10})"?`, 'i')
  const match = block.match(re)

  if (!match) return null

  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

function findGoodsPriceBlock(html: string): string {
  const match = html.match(/"goodsPrice"\s*:\s*\{([\s\S]*?)\}/i)
  return match ? match[1] : html
}

function findMetaContent(html: string, key: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  )

  const match = html.match(re)
  return match ? cleanText(match[1]) : null
}

function findTitle(html: string): string | null {
  return (
    findJsonString(html, 'goodsNm') ||
    findMetaContent(html, 'og:title') ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    null
  )
}

function findBrandName(html: string): string | null {
  return (
    findJsonString(html, 'brandName') ||
    findMetaContent(html, 'product:brand') ||
    null
  )
}

function findProductId(html: string): string | null {
  const goodsNo = findJsonNumberInBlock(html, 'goodsNo')
  return goodsNo ? String(goodsNo) : null
}

function findMetaPrice(html: string): number | null {
  const metaPrice = findMetaContent(html, 'product:price:amount')
  return normalizePrice(metaPrice)
}

export function parseMusinsaPage(html: string): CrawlResult {
  const goodsPriceBlock = findGoodsPriceBlock(html)

  const productName = findTitle(html)
  const seller = findBrandName(html)
  const productId = findProductId(html)

  const originPrice = findJsonNumberInBlock(goodsPriceBlock, 'normalPrice')
  const displayPrice =
    findJsonNumberInBlock(goodsPriceBlock, 'salePrice') ||
    findMetaPrice(html) ||
    findJsonNumberInBlock(goodsPriceBlock, 'couponPrice')

  const benefitPrice = findJsonNumberInBlock(goodsPriceBlock, 'finalPrice')

  const price = displayPrice || benefitPrice || null

  const priceCandidates: PriceCandidate[] = []

  if (originPrice) {
    priceCandidates.push({
      role: 'ORIGIN',
      value: originPrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.normalPrice'
    })
  }

  if (displayPrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: displayPrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.salePrice'
    })
  }

  if (benefitPrice) {
    priceCandidates.push({
      role: 'BENEFIT',
      value: benefitPrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.finalPrice'
    })
  }

  if (!price) {
    return {
      status: 'FAILED',
      market: 'MUSINSA',
      productId,
      productName: productName ? cleanText(productName) : null,
      seller: seller ? cleanText(seller) : null,
      price: null,
      originPrice,
      displayPrice,
      benefitPrice,
      priceCandidates,
      errorMessage: 'MUSINSA_PARSE_PRICE_FAILED'
    }
  }

  return {
    status: 'SUCCESS',
    market: 'MUSINSA',
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
