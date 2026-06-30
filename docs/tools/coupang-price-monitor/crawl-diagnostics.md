---
title: Crawl Diagnostics
description: Product Price Monitor 크롤링 진단 화면 기획 및 구현 기준
---

<script setup>
import CrawlDiagnosticsPanel from '../../.vitepress/theme/components/CrawlDiagnosticsPanel.vue'
</script>

# Crawl Diagnostics

## 1. 문서 목적

`Crawl Diagnostics`는 Product Price Monitor의 관리자용 크롤링 진단 화면이다.

<CrawlDiagnosticsPanel />

기존 가격 비교 화면은 전일/당일 가격 변동을 확인하는 운영 화면이고, 이 화면은 상품 URL 수집 과정에서 어떤 단계가 정상이고 어떤 단계에서 오류가 발생했는지 확인하는 내부 점검 화면이다.

```txt
URL 등록
→ 쇼핑몰 감지
→ Worker fetch
→ 쇼핑몰별 parser 실행
→ crawl_snapshots 저장
→ 가격 비교 화면 표시
```

이 화면의 목표는 다음과 같다.

- 상품별 수집 성공/실패 여부 확인
- 실패 상품의 오류 메시지 확인
- 저장된 대표 가격 `price` 확인
- 상품 URL과 snapshot 저장값 비교
- 배포 후 운영 Worker가 실제로 새 parser를 반영했는지 확인
- 가격 비교 화면에서 이상한 가격이 보일 때 원인 추적

---

## 2. 메뉴 위치

`Coupang Price Monitor` 하위 메뉴에 `Crawl Diagnostics`를 추가한다.

```txt
Coupang Price Monitor
- Overview
- Planning
- UI Plan
- API
- Deployment
- Operation
- Crawl Diagnostics
```

### 파일 위치

```txt
docs/tools/coupang-price-monitor/crawl-diagnostics.md
```

### 사이드바 메뉴 추가 예시

```ts
{
  text: 'Crawl Diagnostics',
  link: '/tools/coupang-price-monitor/crawl-diagnostics'
}
```

---

## 3. 첨부 코드 기준 현재 구현 상태

첨부된 Worker 코드 기준으로 현재 DB/Repo 구조는 다음과 같다.

## 3.1 productsRepo.ts

현재 `productsRepo.ts`는 활성 상품 URL 목록을 조회하고, 상품 URL과 메모를 등록/수정/비활성화한다.

현재 Product 구조:

```ts
export interface Product {
  id: number
  url: string
  memo: string | null
  is_active: number
  created_at: string
  updated_at: string
}
```

진단 화면에서 바로 사용할 수 있는 값:

| 값 | 출처 | 사용 |
|---|---|---|
| productId | `products.id` | 행 식별자 |
| url | `products.url` | 원본 상품 URL |
| memo | `products.memo` | 사용자 메모/상품명 |
| isActive | `products.is_active` | 활성 상품 여부 |
| createdAt | `products.created_at` | 상품 등록일 |
| updatedAt | `products.updated_at` | 상품 수정일 |

## 3.2 snapshotsRepo.ts

현재 `insertSnapshot()`은 크롤링 결과를 `crawl_snapshots`에 저장한다.

저장 필드:

```txt
product_id
url
product_name
seller
price
currency
collected_at
base_date
base_time
timezone
status
error_message
raw_hash
created_at
```

진단 화면에서 바로 사용할 수 있는 값:

| 값 | 출처 | 사용 |
|---|---|---|
| snapshotId | `crawl_snapshots.id` | snapshot 식별자 |
| productName | `crawl_snapshots.product_name` | parser 추출 상품명 |
| seller | `crawl_snapshots.seller` | parser 추출 판매자/브랜드 |
| price | `crawl_snapshots.price` | 최종 저장 대표 가격 |
| status | `crawl_snapshots.status` | SUCCESS / FAILED |
| errorMessage | `crawl_snapshots.error_message` | 오류 메시지 |
| rawHash | `crawl_snapshots.raw_hash` | 원본 응답 해시 |
| collectedAt | `crawl_snapshots.collected_at` | 수집 시각 |
| createdAt | `crawl_snapshots.created_at` | 저장 시각 |

현재 `latestSnapshotMap(baseDate, baseTime)`이 있으므로 기준일/기준시간별 최신 snapshot을 상품별로 가져오는 방식은 이미 가능하다.

## 3.3 runsRepo.ts

현재 `runsRepo.ts`는 수집 실행 단위인 `crawl_runs`를 생성/종료/조회한다.

현재 사용 가능한 run 정보:

```txt
run_type
base_date
base_time
timezone
started_at
finished_at
total_count
success_count
fail_count
created_at
```

주의:

```txt
현재 crawl_snapshots에는 run_id가 저장되지 않는다.
```

따라서 v0.1에서는 상품별 snapshot과 특정 run을 직접 연결하지 않는다. 기준일/기준시간으로 조회하고, run 목록은 참고 정보로만 사용한다.

## 3.4 router.ts

현재 라우터에는 다음 API가 연결되어 있다.

```txt
GET  /health
GET  /products
POST /products
POST /products/import
PATCH /products/:id
DELETE /products/:id
GET  /settings/schedule
PUT  /settings/schedule
POST /crawl/run
GET  /crawl/logs
GET  /snapshots/latest
GET  /snapshots
GET  /compare
GET  /compare/changed
GET  /compare/failed
GET  /export/products.csv
GET  /export/compare.csv
```

신규 진단 API는 이 구조에 맞춰 추가한다.

```txt
GET /crawl-diagnostics
```

---

## 4. 버전 범위

## 4.1 v0.1: DB 변경 없는 진단 화면

v0.1은 DB schema를 변경하지 않는다. 현재 `products`와 `crawl_snapshots`에 저장된 값만 사용한다.

### 포함

- 기준일/기준시간별 수집 결과 조회
- 상품별 정상/실패/미수집 상태 표시
- 저장된 대표 가격 `price` 표시
- 오류 메시지 `errorMessage` 표시
- 상품 URL 표시
- 상품명/메모 검색
- 쇼핑몰 필터
- 상태 필터
- 상세 패널 표시

### 제외

- DB schema 변경
- `debug_json` 저장
- `originPrice`, `salePrice`, `displayPrice`, `benefitPrice` 저장
- `priceCandidates` 저장
- 원본 HTML 저장
- 상품별 재수집 버튼
- 실패 상품 일괄 재수집
- 오류 확인 처리 상태 저장

## 4.2 v0.2: debug_json 기반 parser 진단

v0.2에서는 parser가 찾은 가격 후보와 선택 이유를 보기 위해 `debug_json` 저장을 추가한다.

DB 추가 후보:

```sql
ALTER TABLE crawl_snapshots ADD COLUMN debug_json TEXT;
```

v0.2에서 표시할 수 있는 값:

```txt
originPrice
salePrice
couponPrice
displayPrice
benefitPrice
priceCandidates
selectedReason
```

## 4.3 v0.3: 운영 관리 기능

v0.3에서는 단순 조회를 넘어 운영 관리 기능을 추가한다.

- 상품별 즉시 재수집
- 실패 상품만 일괄 재수집
- 오류 확인 처리
- 최근 7일 실패율
- 쇼핑몰별 실패 통계
- parser별 실패 통계
- 마지막 배포 version ID 표시

---

## 5. v0.1 화면 구성

## 5.1 상단 안내 영역

### 제목

```txt
크롤링 진단
```

### 설명 문구

```txt
등록된 상품 URL의 수집 성공 여부와 저장된 가격 정보를 확인하는 관리자 진단 화면입니다.
가격 비교 화면에서 이상한 값이 보일 때, 이 화면에서 수집 상태와 오류 메시지를 먼저 확인합니다.
```

---

## 5.2 상태 요약 카드

기준일/기준시간 기준으로 수집 상태를 요약한다.

| 항목 | 설명 |
|---|---|
| 전체 | 활성 상품 전체 개수 |
| 정상 | SUCCESS이고 price가 존재하는 상품 수 |
| 실패 | FAILED이거나 price가 null인 상품 수 |
| 미수집 | 해당 기준일/기준시간에 snapshot이 없는 상품 수 |
| 확인 필요 | v0.1에서는 선택 표시. v0.2에서 고도화 |

예시:

```txt
전체 18개 / 정상 16개 / 실패 1개 / 미수집 1개
```

---

## 5.3 필터 영역

| 필터 | 타입 | 설명 |
|---|---|---|
| 기준일 | date | 조회 기준 날짜 |
| 기준시간 | time | 조회 기준 시간 |
| 쇼핑몰 | select | 전체 / 무신사 / 올리브영 / 네이버 스마트스토어 / 네이버 브랜드스토어 / 기타 |
| 상태 | select | 전체 / 정상 / 실패 / 미수집 |
| 검색어 | input | 상품명, 메모, URL 검색 |
| 오류 메시지 | input | 특정 오류 코드 검색 |

### 버튼

| 버튼 | 설명 |
|---|---|
| 조회 | 조건 기준으로 수집 결과 조회 |
| 실패만 보기 | 실패 항목만 필터 |
| 미수집만 보기 | snapshot 없는 상품만 필터 |
| 초기화 | 필터 초기화 |

---

## 5.4 메인 테이블

### 필수 컬럼

| 컬럼 | 설명 |
|---|---|
| 상태 | 정상 / 실패 / 미수집 |
| 쇼핑몰 | URL 기준으로 계산한 market |
| 상품명 | snapshot product_name 또는 memo |
| 메모 | products.memo |
| 대표가 | crawl_snapshots.price |
| 오류 메시지 | crawl_snapshots.error_message |
| 수집일시 | crawl_snapshots.collected_at |
| URL | products.url |
| 상세 | 상세 패널 열기 |

### 선택 컬럼

| 컬럼 | 설명 |
|---|---|
| snapshotId | snapshot 식별자 |
| seller | parser 추출 판매자/브랜드 |
| rawHash | 원본 응답 해시 |
| createdAt | snapshot 저장 시각 |

---

## 6. 상태 계산 기준

v0.1에서는 DB에 별도 `WARNING`을 저장하지 않는다. 화면에서 표시 상태를 계산한다.

| displayStatus | 조건 |
|---|---|
| NORMAL | snapshot 존재, `status = SUCCESS`, `price` 존재 |
| FAILED | snapshot 존재, `status = FAILED` 또는 `price`가 null |
| PENDING | 기준일/기준시간에 snapshot 없음 |

### 계산 예시

```ts
function getDisplayStatus(snapshot: any) {
  if (!snapshot) return 'PENDING'
  if (snapshot.status === 'FAILED') return 'FAILED'
  if (snapshot.price === null || snapshot.price === undefined) return 'FAILED'
  return 'NORMAL'
}
```

v0.2에서 `debug_json`이 추가되면 `WARNING`을 더 정확히 계산한다.

---

## 7. 상세 패널

테이블 행을 선택하면 우측 패널 또는 모달로 상세 정보를 표시한다.

## 7.1 v0.1 상세 정보

| 항목 | 설명 |
|---|---|
| productId | products.id |
| snapshotId | crawl_snapshots.id |
| 상품명 | snapshot product_name 또는 memo |
| 메모 | products.memo |
| 쇼핑몰 | URL 기준 계산 market |
| URL | products.url |
| 대표가 | crawl_snapshots.price |
| status | crawl_snapshots.status |
| errorMessage | crawl_snapshots.error_message |
| seller | crawl_snapshots.seller |
| rawHash | crawl_snapshots.raw_hash |
| collectedAt | crawl_snapshots.collected_at |
| createdAt | crawl_snapshots.created_at |

## 7.2 v0.2 상세 정보

`debug_json` 추가 이후 아래 정보를 표시한다.

| 항목 | 설명 |
|---|---|
| originPrice | 정상가 |
| salePrice | 판매가 |
| couponPrice | 쿠폰가 |
| displayPrice | 화면 표시가 |
| benefitPrice | 혜택가 |
| priceCandidates | parser가 찾은 가격 후보 |
| selectedReason | 최종 price 선택 이유 |

---

## 8. API 기획

## 8.1 API 경로

```txt
GET /crawl-diagnostics
```

관리자 토큰이 필요한 내부 API이다.

## 8.2 Query Parameters

| 이름 | 타입 | 설명 |
|---|---|---|
| baseDate | string | 기준일 YYYY-MM-DD |
| baseTime | string | 기준시간 HH:mm |
| market | string | MUSINSA / OLIVEYOUNG / NAVER_SMARTSTORE / NAVER_BRANDSTORE / UNKNOWN |
| status | string | NORMAL / FAILED / PENDING |
| keyword | string | 상품명/메모/URL 검색 |
| errorMessage | string | 오류 코드 검색 |
| limit | number | 조회 개수. 기본 100 |
| offset | number | 페이지 offset. 기본 0 |

## 8.3 Response 예시

```json
{
  "ok": true,
  "items": [
    {
      "productId": 12,
      "snapshotId": 101,
      "market": "MUSINSA",
      "displayStatus": "NORMAL",
      "status": "SUCCESS",
      "productName": "스피디 스키니 브로우 마스카라",
      "memo": "피카페 브로우",
      "seller": "PICAFE",
      "url": "https://www.musinsa.com/products/6157987",
      "price": 14490,
      "errorMessage": null,
      "rawHash": "abc123",
      "collectedAt": "2026-06-30T08:30:12+09:00",
      "createdAt": "2026-06-30T08:30:12+09:00"
    }
  ],
  "summary": {
    "total": 18,
    "normal": 16,
    "failed": 1,
    "pending": 1
  }
}
```

---

## 9. DB 조회 설계

v0.1에서는 `products`를 기준으로 `crawl_snapshots`를 LEFT JOIN한다. 이렇게 해야 snapshot이 없는 상품도 `미수집`으로 표시할 수 있다.

## 9.1 기본 조회 SQL 예시

```sql
SELECT
  p.id AS productId,
  p.url AS url,
  p.memo AS memo,
  p.is_active AS isActive,
  s.id AS snapshotId,
  s.product_name AS productName,
  s.seller AS seller,
  s.price AS price,
  s.status AS status,
  s.error_message AS errorMessage,
  s.raw_hash AS rawHash,
  s.collected_at AS collectedAt,
  s.created_at AS createdAt,
  s.base_date AS baseDate,
  s.base_time AS baseTime
FROM products p
LEFT JOIN (
  SELECT s1.*
  FROM crawl_snapshots s1
  JOIN (
    SELECT product_id, MAX(id) AS max_id
    FROM crawl_snapshots
    WHERE base_date = ? AND base_time = ?
    GROUP BY product_id
  ) latest ON s1.id = latest.max_id
) s ON s.product_id = p.id
WHERE p.is_active = 1
ORDER BY p.id DESC
LIMIT ? OFFSET ?;
```

## 9.2 market 계산

현재 snapshot에는 `market` 컬럼이 없다. 따라서 v0.1에서는 URL로 계산한다.

```ts
const market = detectMarket(row.url)
```

## 9.3 상태 필터

DB에는 `NORMAL`, `PENDING` 상태가 없으므로 service에서 계산 후 필터링한다.

```txt
NORMAL  = snapshot 있음 + SUCCESS + price 있음
FAILED  = snapshot 있음 + FAILED 또는 price 없음
PENDING = snapshot 없음
```

---

## 10. 오류 코드 기준

## 10.1 공통 오류

| 코드 | 설명 |
|---|---|
| UNSUPPORTED_MARKET | 지원하지 않는 쇼핑몰 URL |
| FETCH_FAILED | 상품 페이지 요청 실패 |
| FETCH_FAILED_403 | 접근 차단 |
| FETCH_FAILED_404 | 상품 페이지 없음 |
| FETCH_FAILED_429 | 요청 제한 |
| FETCH_TIMEOUT | 요청 시간 초과 |
| SNAPSHOT_INSERT_FAILED | snapshot 저장 실패 |

## 10.2 쇼핑몰별 parser 오류

| 코드 | 설명 |
|---|---|
| MUSINSA_PARSE_PRICE_FAILED | 무신사 가격 추출 실패 |
| OLIVEYOUNG_PARSE_PRICE_FAILED | 올리브영 가격 추출 실패 |
| NAVER_SMARTSTORE_PARSE_PRICE_FAILED | 네이버 스마트스토어 가격 추출 실패 |
| NAVER_BRANDSTORE_PARSE_PRICE_FAILED | 네이버 브랜드스토어 가격 추출 실패 |

---

## 11. 첨부 코드 기준 구현 파일

## 11.1 신규 파일

```txt
workers/coupang-price-worker/src/db/crawlDiagnosticsRepo.ts
workers/coupang-price-worker/src/services/crawlDiagnosticsService.ts
workers/coupang-price-worker/src/routes/crawlDiagnostics.ts
```

## 11.2 수정 파일

```txt
workers/coupang-price-worker/src/router.ts
```

## 11.3 문서/프론트 파일

```txt
docs/tools/coupang-price-monitor/crawl-diagnostics.md
```

필요하면 v0.1 이후 Vue 컴포넌트 분리:

```txt
docs/.vitepress/theme/components/CrawlDiagnosticsPanel.vue
```

---

## 12. router.ts 연결안

`router.ts`에 route import를 추가한다.

```ts
import { crawlDiagnosticsRoute } from './routes/crawlDiagnostics'
```

기존 `/compare` 계열 근처에 신규 route를 추가한다.

```ts
if (method === 'GET' && path === '/crawl-diagnostics') {
  return crawlDiagnosticsRoute(ctx())
}
```

추천 위치:

```ts
if (method === 'GET' && path === '/snapshots') return snapshotsRoute(ctx())

if (method === 'GET' && path === '/compare') return compareRoute(ctx())
if (method === 'GET' && path === '/compare/changed') return compareChangedRoute(ctx())
if (method === 'GET' && path === '/compare/failed') return compareFailedRoute(ctx())

if (method === 'GET' && path === '/crawl-diagnostics') return crawlDiagnosticsRoute(ctx())
```

또는 진단 API를 `/crawl` 계열로 보고 아래 위치에 둘 수도 있다.

```ts
if (method === 'POST' && path === '/crawl/run') return runCrawlRoute(ctx())
if (method === 'GET' && path === '/crawl/logs') return crawlLogsRoute(ctx())
if (method === 'GET' && path === '/crawl-diagnostics') return crawlDiagnosticsRoute(ctx())
```

---

## 13. 구현 순서

## 13.1 백엔드 v0.1

```txt
1. crawlDiagnosticsRepo.ts 추가
2. products + latest snapshot LEFT JOIN 조회 작성
3. crawlDiagnosticsService.ts 추가
4. market 계산, displayStatus 계산, summary 계산
5. crawlDiagnosticsRoute.ts 추가
6. router.ts에 GET /crawl-diagnostics 연결
7. npx tsc --noEmit
8. npm run deploy
```

## 13.2 프론트/문서 v0.1

```txt
1. docs/tools/coupang-price-monitor/crawl-diagnostics.md 생성
2. VitePress 사이드바에 Crawl Diagnostics 메뉴 추가
3. API 주소 / 토큰 입력 영역은 기존 Product Price Monitor 설정 재사용
4. 기준일/시간 필터 추가
5. 목록 테이블 표시
6. 상세 패널 표시
7. 실패/미수집 필터 추가
```

---

## 14. v0.1 완료 기준

다음이 가능하면 v0.1 완료로 본다.

```txt
1. Coupang Price Monitor 메뉴에서 Crawl Diagnostics 진입 가능
2. 기준일/기준시간 기준 수집 결과 조회 가능
3. 정상/실패/미수집 상태 확인 가능
4. 오류 메시지 확인 가능
5. 저장된 price 확인 가능
6. 상품 URL 확인 가능
7. 상세 패널에서 snapshot 정보 확인 가능
8. 기존 가격 비교 화면과 역할이 분리됨
```

---

## 15. 무신사 가격 오류 확인 기준

이번 무신사 parser 수정 이후 아래 케이스가 정상 반영되는지 확인한다.

### 기존 오류 케이스

```txt
salePrice = 16000
finalPrice = 14490
price = 16000
```

### 수정 후 기대값

```txt
price = 14490
```

v0.1에서는 `crawl_snapshots.price`가 14,490원으로 저장됐는지 확인한다.

v0.2에서는 `debug_json`에서 아래 항목까지 확인한다.

```txt
displayPrice = 14490
benefitPrice = 14490
selectedReason = finalPrice selected because it is lower than salePrice and discount flags exist
```

---

## 16. 한 줄 요약

`Crawl Diagnostics`는 가격 비교 화면이 아니라, 상품 URL 수집 과정에서 크롤링·parser·snapshot 저장 단계 중 어디서 문제가 발생했는지 확인하는 관리자용 내부 진단 화면이다.
