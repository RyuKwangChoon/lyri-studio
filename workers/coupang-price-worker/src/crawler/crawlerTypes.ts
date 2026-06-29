export type CrawlStatus = 'SUCCESS' | 'FAILED';

export type PriceCandidateRole =
  | 'ORIGIN'
  | 'DISPLAY'
  | 'BENEFIT'
  | 'FINAL'
  | 'OPTION_EXTRA';

export type PriceSourceType =
  | 'META'
  | 'JS_STATE'
  | 'DOM'
  | 'API_JSON'
  | 'TEXT_REGEX';

export interface PriceCandidate {
  role: PriceCandidateRole;
  value: number;
  sourceType: PriceSourceType;
  path: string;
  confidence?: number;
  rawText?: string | null;
}

export interface CrawlResult {
  status: CrawlStatus;

  productName?: string | null;
  seller?: string | null;

  /**
   * 기존 UI / DB 저장용 대표 가격.
   * 1차 개선에서는 최종 비교 기준 가격을 여기에 넣는다.
   */
  price?: number | null;

  /**
   * 확장용 선택 필드.
   * 1차에서는 DB에 저장하지 않고 parser 내부 판단 / 향후 확장용으로만 사용한다.
   */
  market?: string | null;
  productId?: string | null;

  originPrice?: number | null;
  displayPrice?: number | null;
  benefitPrice?: number | null;

  confidence?: number | null;
  priceCandidates?: PriceCandidate[];

  rawHash?: string | null;
  errorMessage?: string | null;
}
