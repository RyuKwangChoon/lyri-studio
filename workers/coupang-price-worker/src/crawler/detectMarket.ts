export type Market =
  | 'COUPANG'
  | 'NAVER_SMARTSTORE'
  | 'NAVER_BRANDSTORE'
  | 'MUSINSA'
  | 'OLIVEYOUNG'
  | 'UNKNOWN'

export function detectMarket(url: string): Market {
  const host = new URL(url).hostname.toLowerCase()

  if (host.includes('smartstore.naver.com')) return 'NAVER_SMARTSTORE'
  if (host.includes('brand.naver.com')) return 'NAVER_BRANDSTORE'
  if (host.includes('musinsa.com')) return 'MUSINSA'
  if (host.includes('oliveyoung.co.kr')) return 'OLIVEYOUNG'
  if (host.includes('coupang.com')) return 'COUPANG'

  return 'UNKNOWN'
}

export function isCrawlSupported(market: Market): boolean {
  return market === 'MUSINSA' || market === 'OLIVEYOUNG'
}
