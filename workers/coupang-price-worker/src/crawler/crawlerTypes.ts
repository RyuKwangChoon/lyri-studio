export type CrawlStatus = 'SUCCESS' | 'FAILED';

export interface CrawlResult {
  status: CrawlStatus;
  productName?: string | null;
  seller?: string | null;
  price?: number | null;
  rawHash?: string | null;
  errorMessage?: string | null;
}
