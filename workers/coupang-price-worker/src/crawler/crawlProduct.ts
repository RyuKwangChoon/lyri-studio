import { parseMusinsaPage } from './parseMusinsaPage'
import { parseOliveYoungPage } from './parseOliveYoungPage'
import { parseNaverSmartStorePage } from './parseNaverSmartStorePage'
import { parseNaverBrandStorePage } from './parseNaverBrandStorePage'
import { detectMarket, isCrawlSupported } from './detectMarket'
import { extractProductId } from './extractProductId'
import type { CrawlResult } from './crawlerTypes'

export async function crawlProduct(url: string): Promise<CrawlResult> {
  const market = detectMarket(url)
  const productId = extractProductId(url, market)

  try {
    if (!isCrawlSupported(market)) {
      return {
        status: 'FAILED',
        market,
        productId,
        price: null,
        errorMessage: 'UNSUPPORTED_MARKET'
      }
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 LyriStudioPriceMonitor/0.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    })

    if (!res.ok) {
      return {
        status: 'FAILED',
        market,
        productId,
        price: null,
        errorMessage: `FETCH_FAILED_${res.status}`
      }
    }

    const html = await res.text()

    switch (market) {
      case 'NAVER_SMARTSTORE':
        return parseNaverSmartStorePage(html)

      case 'NAVER_BRANDSTORE':
        return parseNaverBrandStorePage(html)

      case 'MUSINSA':
        return parseMusinsaPage(html)

      case 'OLIVEYOUNG':
        return parseOliveYoungPage(html)

      default:
        return {
          status: 'FAILED',
          market,
          productId,
          price: null,
          errorMessage: 'UNSUPPORTED_MARKET'
        }
    }
  } catch (error) {
    return {
      status: 'FAILED',
      market,
      productId,
      price: null,
      errorMessage: error instanceof Error ? error.message : String(error)
    }
  }
}
