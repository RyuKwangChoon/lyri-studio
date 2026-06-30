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
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
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

function findJsonBooleanInBlock(block: string, key: string): boolean | null {
  const re = new RegExp(`"${key}"\\s*:\\s*(true|false)`, 'i')
  const match = block.match(re)

  if (!match) return null

  return match[1].toLowerCase() === 'true'
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
    cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '') ||
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

function selectMusinsaDisplayPrice(params: {
  salePrice: number | null
  couponPrice: number | null
  finalPrice: number | null
  metaPrice: number | null
  extraDiscountAmount: number
  finalDiscount: number
  couponDiscount: boolean
}): { value: number | null; path: string | null; reason: string } {
  const { salePrice, couponPrice, finalPrice, metaPrice } = params

  if (finalPrice) {
    return {
      value: finalPrice,
      path: 'window.__MSS_FE__.product.state.goodsPrice.finalPrice',
      reason: 'finalPrice selected as Musinsa display price'
    }
  }

  if (salePrice) {
    return {
      value: salePrice,
      path: 'window.__MSS_FE__.product.state.goodsPrice.salePrice',
      reason: 'salePrice selected as fallback display price'
    }
  }

  if (couponPrice) {
    return {
      value: couponPrice,
      path: 'window.__MSS_FE__.product.state.goodsPrice.couponPrice',
      reason: 'couponPrice selected as fallback display price'
    }
  }

  if (metaPrice) {
    return {
      value: metaPrice,
      path: 'meta[property="product:price:amount"]',
      reason: 'meta price selected as fallback display price'
    }
  }

  return {
    value: null,
    path: null,
    reason: 'no valid Musinsa price found'
  }
}

export function parseMusinsaPage(html: string): CrawlResult {
  const goodsPriceBlock = findGoodsPriceBlock(html)

  const productName = findTitle(html)
  const seller = findBrandName(html)
  const productId = findProductId(html)

  const originPrice = findJsonNumberInBlock(goodsPriceBlock, 'normalPrice')
  const salePrice = findJsonNumberInBlock(goodsPriceBlock, 'salePrice')
  const couponPrice = findJsonNumberInBlock(goodsPriceBlock, 'couponPrice')
  const benefitPrice = findJsonNumberInBlock(goodsPriceBlock, 'finalPrice')
  const metaPrice = findMetaPrice(html)

  const extraDiscountAmount =
    findJsonNumberInBlock(goodsPriceBlock, 'extraDiscountAmount') || 0

  const finalDiscount =
    findJsonNumberInBlock(goodsPriceBlock, 'finalDiscount') || 0

  const couponDiscount =
    findJsonBooleanInBlock(goodsPriceBlock, 'couponDiscount') === true

  const selectedDisplayPrice = selectMusinsaDisplayPrice({
    salePrice,
    couponPrice,
    finalPrice: benefitPrice,
    metaPrice,
    extraDiscountAmount,
    finalDiscount,
    couponDiscount
  })

  const displayPrice = selectedDisplayPrice.value
  const price = displayPrice

  console.log(
    '[MUSINSA_PRICE_DEBUG]',
    JSON.stringify({
      productId,
      productName: productName ? cleanText(productName) : null,
      seller: seller ? cleanText(seller) : null,
      originPrice,
      salePrice,
      couponPrice,
      finalPrice: benefitPrice,
      metaPrice,
      extraDiscountAmount,
      finalDiscount,
      couponDiscount,
      selectedValue: selectedDisplayPrice.value,
      selectedPath: selectedDisplayPrice.path,
      selectedReason: selectedDisplayPrice.reason
    })
  )

  const priceCandidates: PriceCandidate[] = []

  if (originPrice) {
    priceCandidates.push({
      role: 'ORIGIN',
      value: originPrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.normalPrice'
    })
  }

  if (salePrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: salePrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.salePrice',
      rawText: 'salePrice candidate'
    })
  }

  if (metaPrice && metaPrice !== salePrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: metaPrice,
      sourceType: 'META',
      path: 'meta[property="product:price:amount"]',
      rawText: 'meta price fallback candidate'
    })
  }

  if (couponPrice && couponPrice !== salePrice) {
    priceCandidates.push({
      role: 'DISPLAY',
      value: couponPrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.couponPrice',
      rawText: 'couponPrice candidate'
    })
  }

  if (benefitPrice) {
    priceCandidates.push({
      role: 'BENEFIT',
      value: benefitPrice,
      sourceType: 'JS_STATE',
      path: 'window.__MSS_FE__.product.state.goodsPrice.finalPrice',
      rawText: 'finalPrice candidate'
    })
  }

  if (displayPrice && selectedDisplayPrice.path) {
    priceCandidates.push({
      role: 'FINAL',
      value: displayPrice,
      sourceType: selectedDisplayPrice.path.startsWith('meta[') ? 'META' : 'JS_STATE',
      path: selectedDisplayPrice.path,
      rawText: selectedDisplayPrice.reason
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
