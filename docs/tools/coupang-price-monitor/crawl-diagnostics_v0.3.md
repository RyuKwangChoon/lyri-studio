# 관리자 크롤링 진단 화면 기획안 v0.3

> Product Price Monitor의 **관리자 전용 크롤링 진단 화면(Crawl Diagnostics)** 확장 기획안이다.  
> 이 문서는 기존 `crawl_snapshots` 기반 진단 화면에 **오류 코드 해설**, **현재 URL 테스트 수집**, **별도 테스트 결과 저장 테이블**을 추가하기 위한 설계 기준을 정리한다.

---

## 0. 핵심 요약

`Crawl Diagnostics`는 가격 비교 화면이 아니다.  
가격 변동을 판단하는 운영 화면이 아니라, **수집 실패와 가격 오류의 원인을 추적하는 관리자 도구**다.

이번 v0.3의 핵심은 다음 3가지다.

```txt
1. 상세 팝업에서 오류 코드의 의미와 조치 방법을 바로 확인한다.
2. 가격 비교와 분리된 관리자용 테스트 수집 기능을 만든다.
3. 테스트 수집 결과는 crawl_snapshots가 아니라 별도 테이블에 저장한다.
```

가장 중요한 원칙은 다음이다.

```txt
운영 수집
→ crawl_snapshots 저장
→ 가격 비교 화면에 반영

관리자 테스트 수집
→ crawl_test_results 저장
→ 가격 비교 화면에 반영하지 않음
```

---

## 1. 배경

현재 가격 모니터링 흐름은 다음 구조다.

```txt
URL 등록
→ 쇼핑몰 감지
→ Worker fetch
→ 쇼핑몰별 parser 실행
→ crawl_snapshots 저장
→ 가격 비교 화면 표시
```

최근 확인된 주요 실패 유형은 다음과 같다.

| 쇼핑몰 | 현재 오류 | 의미 |
|---|---|---|
| 네이버 스마트스토어 | `FETCH_FAILED_429` | 요청 제한 또는 봇 접근 제한 가능성 |
| 올리브영 | `FETCH_FAILED_403` | Worker 요청이 사이트에서 차단될 가능성 |
| 무신사 | 가격 기준 오류 이력 | 페이지는 받았지만 parser 선택 가격이 화면가와 달랐던 사례 |
| 네이버 브랜드스토어 | 정상 수집 확인 | 현재 가격 추출 성공권 |

따라서 단순히 `FAILED`만 보는 화면으로는 부족하다.  
관리자는 다음을 구분할 수 있어야 한다.

```txt
페이지를 못 받아온 것인지
페이지는 받았지만 가격을 못 뽑은 것인지
가격은 뽑았지만 저장이 실패한 것인지
현재 다시 테스트하면 성공하는지
```

---

## 2. 화면 역할 정의

## 2.1 가격 비교 화면

가격 비교 화면은 리셀러가 실제 판단에 사용하는 운영 화면이다.

확인 항목:

```txt
전일가
당일가
가격 변동
상승/하락 여부
```

이 화면은 **수집된 결과를 소비하는 화면**이다.

---

## 2.2 크롤링 진단 화면

`Crawl Diagnostics`는 관리자 진단 화면이다.

확인 항목:

```txt
상품 URL이 정상 등록됐는지
쇼핑몰이 정상 감지됐는지
Worker fetch가 성공했는지
parser가 상품명/가격을 뽑았는지
snapshot 저장이 됐는지
실패했다면 어느 단계에서 실패했는지
```

이 화면은 **수집 과정 자체를 점검하는 화면**이다.

---

## 3. 화면 구성

크롤링 진단 화면은 크게 2개 영역으로 나눈다.

```txt
1. 수집 결과 진단 영역
2. 관리자 테스트 수집 영역
```

---

## 3.1 수집 결과 진단 영역

기존 `crawl_snapshots` 기준 조회 영역이다.

목적:

```txt
등록 상품별 최근 수집 결과 확인
정상 / 실패 / 미수집 구분
저장된 대표가 확인
오류 메시지 확인
상세 팝업 진입
```

데이터 출처:

```txt
products
crawl_snapshots
```

가격 비교 화면과 같은 `crawl_snapshots`를 보지만, 목적은 가격 비교가 아니라 **수집 상태 확인**이다.

---

## 3.2 관리자 테스트 수집 영역

새로 추가할 영역이다.

목적:

```txt
임의 URL 또는 기존 등록 URL을 현재 시점 기준으로 즉시 테스트 수집한다.
수집 성공/실패 원인을 확인한다.
가격 비교 데이터에는 영향을 주지 않는다.
```

데이터 출처/저장 위치:

```txt
입력: 임의 URL 또는 products.url
실행: Worker fetch + parser
저장: crawl_test_results
비교 반영: 없음
```

테스트 수집은 과거 날짜 보정용이 아니다.

```txt
어제 날짜로 저장해서 전일가 보정 → 금지
현재 URL이 지금 크롤링 가능한지 확인 → 허용
```

---

## 4. 상세 팝업 개선

현재 상세 팝업은 `errorMessage`를 보여주는 수준이다.  
v0.3에서는 오류 코드 해석 정보를 함께 표시한다.

## 4.1 상세 팝업 탭 구성

추천 구조:

```txt
기본 정보
오류 진단
테스트 수집
debug_json
```

---

## 4.2 기본 정보 탭

| 항목 | 설명 |
|---|---|
| 상품 ID | `products.id` |
| snapshot ID | `crawl_snapshots.id` |
| 쇼핑몰 | URL 기반 market |
| 메모 | 등록 메모 |
| 상품명 | parser 추출 상품명 |
| 판매자 | parser 추출 판매자 |
| URL | 상품 URL |
| 대표가 | 저장된 `price` |
| 상태 | `SUCCESS` / `FAILED` |
| 표시 상태 | 정상 / 실패 / 미수집 / 확인 필요 |
| 수집 시각 | `collected_at` |
| 저장 시각 | `created_at` |
| rawHash | 원본 응답 해시 |

---

## 4.3 오류 진단 탭

추가 표시 항목:

| 항목 | 설명 |
|---|---|
| 오류 코드 | 예: `FETCH_FAILED_429` |
| 오류 단계 | `MARKET`, `FETCH`, `PARSER`, `DB`, `UNKNOWN` |
| 오류 분류 | `RATE_LIMIT`, `BLOCKED`, `PARSE_FAILED` 등 |
| 의미 | 사람이 읽을 수 있는 설명 |
| 예상 원인 | 가능한 원인 |
| 확인할 항목 | 관리자 점검 포인트 |
| 권장 조치 | 다음 작업 방향 |
| 재테스트 가능 여부 | 테스트 수집 버튼 사용 가능 여부 |

---

## 4.4 오류 코드 가이드

초기에는 DB 저장 없이 프론트 또는 service 상수 맵으로 구현한다.

| 오류 코드 | 단계 | 분류 | 의미 | 확인할 항목 | 권장 조치 |
|---|---|---|---|---|---|
| `FETCH_FAILED_403` | FETCH | BLOCKED | 사이트가 Worker 요청을 거부함 | User-Agent, Referer, 접근 차단 여부 | 헤더 보강, 우회 가능성 검토, 해당 몰 수집 정책 분리 |
| `FETCH_FAILED_429` | FETCH | RATE_LIMIT | 요청 제한 또는 자동화 요청으로 판단됨 | 동일 몰 연속 수집 여부, 요청 간격, 재시도 횟수 | 수집 간격 분산, 재시도 지연, 배치 분리 |
| `FETCH_TIMEOUT` | FETCH | TIMEOUT | 응답 제한 시간 초과 | 대상 사이트 응답 속도, timeout 설정 | timeout 조정, 실패 재시도 |
| `UNSUPPORTED_MARKET` | MARKET | UNSUPPORTED | 지원하지 않는 쇼핑몰 URL | `detectMarket` 지원 여부 | 지원몰 추가 또는 등록 제외 |
| `MUSINSA_PARSE_PRICE_FAILED` | PARSER | PARSE_FAILED | 무신사 페이지에서 가격 추출 실패 | JS state 구조, 가격 필드 변경 | parser 수정 |
| `OLIVEYOUNG_PARSE_PRICE_FAILED` | PARSER | PARSE_FAILED | 올리브영 페이지에서 가격 추출 실패 | selector, JSON 구조, 접근 HTML 확인 | parser 수정 또는 fetch 정책 점검 |
| `NAVER_SMARTSTORE_PARSE_PRICE_FAILED` | PARSER | PARSE_FAILED | 스마트스토어 HTML은 받았지만 가격 추출 실패 | 페이지 구조, JSON state | parser 수정 |
| `NAVER_BRANDSTORE_PARSE_PRICE_FAILED` | PARSER | PARSE_FAILED | 브랜드스토어 HTML은 받았지만 가격 추출 실패 | JSON state, 가격 후보 | parser 수정 |
| `PRICE_NOT_FOUND` | PARSER | MISSING_PRICE | 상품명은 있으나 가격 후보가 없음 | 품절/판매중지/옵션상품 여부 | 상태 분기 추가 |
| `SNAPSHOT_INSERT_FAILED` | DB | INSERT_FAILED | 운영 수집 결과 저장 실패 | schema, nullable, bind 값 | DB insert 로직 확인 |
| `TEST_RESULT_INSERT_FAILED` | DB | INSERT_FAILED | 테스트 결과 저장 실패 | `crawl_test_results` schema | repo/migration 확인 |
| `CRAWL_RUN_FAILED` | RUNTIME | UNKNOWN | 수집 실행 전체 예외 | route/service 로그 | 예외 메시지 확인 |

---

## 5. 관리자 테스트 수집 정책

## 5.1 운영 수집과 테스트 수집 분리

| 구분 | 운영 수집 | 관리자 테스트 수집 |
|---|---|---|
| API | `POST /crawl/run` | `POST /crawl-diagnostics/test` |
| 저장 테이블 | `crawl_snapshots` | `crawl_test_results` |
| 가격 비교 반영 | 반영 | 미반영 |
| 기준일/기준시간 | 사용 | 사용하지 않음 |
| 목적 | 가격 이력 저장 | 원인 진단 |
| 대상 | 등록 상품 전체/일부 | 임의 URL 또는 선택 URL |
| 결과 보관 | 가격 이력 | 테스트 이력 |

---

## 5.2 테스트 수집 입력 방식

상세 팝업에서 제공할 버튼:

```txt
[현재 URL 테스트 수집]
[임의 URL 입력 후 테스트]
```

입력 후보:

| 입력 | 설명 |
|---|---|
| `productId` | 기존 등록 상품 기준 테스트 |
| `url` | 임의 URL 테스트 |
| `memo` | 테스트 메모, 선택값 |
| `saveResult` | 기본 true, 테스트 결과 저장 여부 |

`productId`와 `url`이 모두 있으면 `url`을 우선한다.

---

## 5.3 테스트 결과 표시

테스트 완료 후 팝업에 표시할 항목:

```txt
테스트 상태
감지된 쇼핑몰
현재가
상품명
판매자
HTTP status
오류 코드
오류 설명
소요 시간
rawHash
debug_json
```

테스트 결과는 가격 비교 테이블의 전일가/당일가에 영향을 주면 안 된다.

---

## 6. DB 설계

## 6.1 신규 테이블

테이블명:

```txt
crawl_test_results
```

역할:

```txt
관리자 테스트 수집 결과 저장
운영 가격 비교 데이터와 분리
fetch/parser/debug 정보를 자유롭게 저장
```

---

## 6.2 Migration 초안

```sql
CREATE TABLE IF NOT EXISTS crawl_test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  product_id INTEGER,
  url TEXT NOT NULL,
  market TEXT,

  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  error_stage TEXT,
  error_category TEXT,
  http_status INTEGER,

  product_name TEXT,
  seller TEXT,
  price INTEGER,
  currency TEXT DEFAULT 'KRW',

  raw_hash TEXT,
  debug_json TEXT,

  requested_at TEXT NOT NULL,
  finished_at TEXT,
  elapsed_ms INTEGER,

  created_at TEXT NOT NULL,

  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_crawl_test_results_product_created
ON crawl_test_results(product_id, created_at);

CREATE INDEX IF NOT EXISTS idx_crawl_test_results_url_created
ON crawl_test_results(url, created_at);

CREATE INDEX IF NOT EXISTS idx_crawl_test_results_market_status
ON crawl_test_results(market, status);
```

---

## 6.3 컬럼 설명

| 컬럼 | 설명 |
|---|---|
| `id` | 테스트 결과 ID |
| `product_id` | 등록 상품에서 테스트한 경우 연결, 임의 URL이면 null |
| `url` | 테스트 대상 URL |
| `market` | 감지된 쇼핑몰 |
| `status` | `SUCCESS` / `FAILED` |
| `error_code` | 대표 오류 코드 |
| `error_message` | 상세 오류 메시지 |
| `error_stage` | `MARKET`, `FETCH`, `PARSER`, `DB`, `UNKNOWN` |
| `error_category` | `BLOCKED`, `RATE_LIMIT`, `PARSE_FAILED`, `UNSUPPORTED`, `TIMEOUT`, `INSERT_FAILED` |
| `http_status` | fetch 응답 코드 |
| `product_name` | parser 추출 상품명 |
| `seller` | parser 추출 판매자 |
| `price` | 현재 테스트 기준 대표가 |
| `currency` | 기본 `KRW` |
| `raw_hash` | 응답 원문 해시 |
| `debug_json` | fetch/parser/가격 후보/선택 이유 |
| `requested_at` | 테스트 요청 시각 |
| `finished_at` | 테스트 완료 시각 |
| `elapsed_ms` | 테스트 소요 시간 |
| `created_at` | DB 저장 시각 |

---

## 7. API 설계

## 7.1 기존 진단 조회 API

```txt
GET /crawl-diagnostics
```

역할:

```txt
products + crawl_snapshots 기준으로 등록 상품별 수집 결과 조회
```

이 API는 기존 구조를 유지한다.

---

## 7.2 테스트 수집 실행 API

```txt
POST /crawl-diagnostics/test
```

요청 예시:

```json
{
  "productId": 12,
  "url": "https://smartstore.naver.com/example/products/123456",
  "memo": "스마트스토어 429 확인 테스트"
}
```

응답 예시:

```json
{
  "ok": true,
  "result": {
    "testId": 33,
    "productId": 12,
    "url": "https://smartstore.naver.com/example/products/123456",
    "market": "NAVER_SMARTSTORE",
    "status": "FAILED",
    "errorCode": "FETCH_FAILED_429",
    "errorStage": "FETCH",
    "errorCategory": "RATE_LIMIT",
    "httpStatus": 429,
    "price": null,
    "productName": null,
    "seller": null,
    "elapsedMs": 1240,
    "reason": "요청 제한 또는 봇 접근 제한 가능성"
  }
}
```

실패 응답 예시:

```json
{
  "ok": false,
  "error": "URL_REQUIRED",
  "message": "테스트할 URL이 필요합니다."
}
```

---

## 7.3 테스트 결과 조회 API

```txt
GET /crawl-diagnostics/test-results
```

Query parameters:

| 이름 | 설명 |
|---|---|
| `productId` | 특정 등록 상품의 테스트 이력 |
| `url` | 특정 URL 테스트 이력 |
| `market` | 쇼핑몰 필터 |
| `status` | `SUCCESS` / `FAILED` |
| `limit` | 기본 20 |
| `offset` | 기본 0 |

예시:

```txt
GET /crawl-diagnostics/test-results?productId=12&limit=20
```

응답 예시:

```json
{
  "ok": true,
  "items": [
    {
      "id": 33,
      "productId": 12,
      "url": "https://smartstore.naver.com/example/products/123456",
      "market": "NAVER_SMARTSTORE",
      "status": "FAILED",
      "errorCode": "FETCH_FAILED_429",
      "errorStage": "FETCH",
      "errorCategory": "RATE_LIMIT",
      "httpStatus": 429,
      "price": null,
      "productName": null,
      "seller": null,
      "elapsedMs": 1240,
      "createdAt": "2026-07-01T21:30:00+09:00"
    }
  ]
}
```

---

## 8. debug_json 설계

`debug_json`은 운영 snapshot보다 테스트 결과에 먼저 적용한다.  
이유는 다음과 같다.

```txt
운영 가격 비교 데이터 schema를 먼저 흔들지 않는다.
테스트 수집에서는 더 많은 진단 정보를 저장해도 가격 비교에 영향이 없다.
fetch 실패와 parser 실패를 화면에서 명확히 구분할 수 있다.
```

---

## 8.1 debug_json 예시

```json
{
  "market": "MUSINSA",
  "productId": "6157987",
  "fetch": {
    "ok": true,
    "httpStatus": 200,
    "elapsedMs": 842,
    "contentType": "text/html",
    "bodyLength": 284512
  },
  "parser": {
    "name": "parseMusinsaPage",
    "ok": true,
    "selectedPrice": 14490,
    "selectedReason": "finalPrice selected as display price",
    "productName": "스피디 스키니 브로우 마스카라",
    "seller": "PICAFE"
  },
  "prices": {
    "originPrice": 16000,
    "displayPrice": 14490,
    "benefitPrice": 14490,
    "finalPrice": 14490
  },
  "priceCandidates": [
    {
      "role": "ORIGIN",
      "value": 16000,
      "sourceType": "JS_STATE",
      "path": "goodsPrice.normalPrice"
    },
    {
      "role": "DISPLAY",
      "value": 14490,
      "sourceType": "JS_STATE",
      "path": "goodsPrice.finalPrice"
    }
  ]
}
```

---

## 8.2 fetch 실패 시 debug_json 예시

```json
{
  "market": "NAVER_SMARTSTORE",
  "fetch": {
    "ok": false,
    "httpStatus": 429,
    "elapsedMs": 531,
    "errorCode": "FETCH_FAILED_429"
  },
  "parser": {
    "ok": false,
    "skipped": true,
    "reason": "fetch failed"
  }
}
```

---

## 9. 구현 파일 설계

## 9.1 Worker 신규 파일

```txt
workers/coupang-price-worker/src/db/crawlTestResultsRepo.ts
workers/coupang-price-worker/src/services/crawlTestService.ts
workers/coupang-price-worker/src/routes/crawlDiagnosticsTest.ts
```

## 9.2 Worker 수정 파일

```txt
workers/coupang-price-worker/src/router.ts
```

## 9.3 Migration 파일

```txt
workers/coupang-price-worker/migrations/XXXX_create_crawl_test_results.sql
```

## 9.4 Frontend 수정 파일

```txt
docs/.vitepress/theme/components/CrawlDiagnosticsPanel.vue
```

## 9.5 문서 수정 파일

```txt
docs/tools/coupang-price-monitor/crawl-diagnostics.md
```

---

## 10. 구현 단계

## 10.1 1단계 — 문서 정리

목적:

```txt
구현 범위와 분리 원칙을 먼저 고정한다.
```

작업:

```txt
docs/tools/coupang-price-monitor/crawl-diagnostics.md 수정
오류 코드 가이드 추가
테스트 수집/별도 테이블 정책 추가
```

완료 기준:

```txt
문서에서 운영 수집과 테스트 수집의 차이가 명확하다.
테스트 수집이 가격 비교에 반영되지 않는다는 정책이 명확하다.
```

---

## 10.2 2단계 — 상세 팝업 오류 코드 가이드

목적:

```txt
DB 변경 없이 즉시 UI 개선
```

수정 대상:

```txt
docs/.vitepress/theme/components/CrawlDiagnosticsPanel.vue
```

작업:

```txt
errorCodeGuide 상수 추가
상세 팝업 오류 진단 섹션 추가
FETCH_FAILED_403 / FETCH_FAILED_429 우선 대응
```

완료 기준:

```txt
상세 팝업에서 오류 코드 의미/원인/조치가 보인다.
docs build가 통과한다.
```

---

## 10.3 3단계 — 테스트 결과 테이블 추가

목적:

```txt
관리자 테스트 수집 결과를 운영 snapshot과 분리 저장한다.
```

작업:

```txt
crawl_test_results migration 작성
local/remote migration 적용
```

완료 기준:

```txt
D1에 crawl_test_results 테이블이 생성된다.
운영 crawl_snapshots 구조는 변경하지 않는다.
```

---

## 10.4 4단계 — 테스트 수집 API 구현

목적:

```txt
임의 URL 또는 등록 URL을 현재 시점 기준으로 테스트 수집한다.
```

작업:

```txt
crawlTestResultsRepo.ts 생성
crawlTestService.ts 생성
crawlDiagnosticsTest.ts 생성
router.ts 연결
npx tsc --noEmit
```

완료 기준:

```txt
POST /crawl-diagnostics/test 호출 가능
테스트 성공/실패 결과가 crawl_test_results에 저장됨
GET /crawl-diagnostics/test-results 조회 가능
```

---

## 10.5 5단계 — 프론트 연결

목적:

```txt
관리자가 팝업에서 바로 테스트 수집을 실행하고 결과를 확인한다.
```

작업:

```txt
상세 팝업에 테스트 수집 탭 추가
현재 URL 테스트 버튼 추가
임의 URL 테스트 입력 추가
최근 테스트 이력 표시
debug_json 접기/펼치기
```

완료 기준:

```txt
관리자 화면에서 테스트 수집 실행 가능
테스트 결과가 팝업에 표시됨
가격 비교 화면에는 영향 없음
```

---

## 11. 검증 시나리오

## 11.1 스마트스토어 429 확인

```txt
대상: NAVER_SMARTSTORE URL
실행: 테스트 수집
기대:
- status = FAILED
- errorCode = FETCH_FAILED_429
- errorStage = FETCH
- errorCategory = RATE_LIMIT
- parser skipped
```

## 11.2 올리브영 403 확인

```txt
대상: OLIVEYOUNG URL
실행: 테스트 수집
기대:
- status = FAILED
- errorCode = FETCH_FAILED_403
- errorStage = FETCH
- errorCategory = BLOCKED
- parser skipped
```

## 11.3 무신사 가격 확인

```txt
대상: MUSINSA URL
실행: 테스트 수집
기대:
- status = SUCCESS
- price = 화면 대표가
- debug_json.prices.displayPrice 확인
- debug_json.parser.selectedReason 확인
```

## 11.4 가격 비교 영향 없음 확인

```txt
실행:
1. 테스트 수집 여러 번 실행
2. 가격 비교 화면 조회

기대:
- 전일가/당일가 변경 없음
- crawl_snapshots row 증가 없음
- crawl_test_results row만 증가
```

---

## 12. 배포 및 확인 순서

## 12.1 문서/프론트만 수정한 경우

```powershell
# 실행 위치: C:\lyri-studio
git status --short
npm run docs:build
git add docs/tools/coupang-price-monitor/crawl-diagnostics.md docs/.vitepress/theme/components/CrawlDiagnosticsPanel.vue
git commit -m "Update crawl diagnostics plan and error guide"
git push
```

---

## 12.2 Worker API 또는 DB migration 수정한 경우

```powershell
# 실행 위치: C:\lyri-studio\workers\coupang-price-worker
npx tsc --noEmit

# migration이 있으면 먼저 적용
npx wrangler d1 migrations apply lyri_price_monitor --remote

# Worker 배포
npx wrangler deploy

# 배포 이력 확인
npx wrangler deployments list
```

Git 반영은 루트에서 별도로 진행한다.

```powershell
# 실행 위치: C:\lyri-studio
git status --short
git add <수정 파일>
git commit -m "Add crawl diagnostics test collection"
git push
```

---

## 13. 완료 기준

```txt
1. 기존 Crawl Diagnostics 조회 기능 유지
2. 상세 팝업에서 오류 코드 의미/원인/조치 확인 가능
3. 등록 URL 기준 테스트 수집 가능
4. 임의 URL 테스트 수집 가능
5. 테스트 결과가 가격 비교에 반영되지 않음
6. 테스트 결과가 crawl_test_results에 저장됨
7. FETCH_FAILED_403 / FETCH_FAILED_429 원인 구분 가능
8. parser 실패와 fetch 실패를 화면에서 구분 가능
9. debug_json으로 가격 후보와 선택 기준 확인 가능
10. docs build 통과
11. worker tsc 통과
12. migration 적용 및 Worker 배포 확인
```

---

## 14. 작업 안전 원칙

```txt
1. 현재 위치 확인
2. 수정 대상 파일 확인
3. 변경 범위 확인
4. git add . 금지
5. 필요한 파일만 stage
6. DB migration과 Worker deploy는 별도 확인 후 진행
7. 문서/프론트 수정과 Worker 배포를 섞지 않음
8. 사고 발생 시 멈춤 → 위치 확인 → 변경 범위 확인 → 원복 우선
```

---

## 15. 최종 정리

```txt
Crawl Diagnostics v0.1
= 기존 snapshot 결과 조회 화면

Crawl Diagnostics v0.2
= debug_json 기반 parser 상세 진단

Crawl Diagnostics v0.3
= 관리자 전용 실시간 테스트 수집
+ 오류 코드 해설
+ 별도 테스트 결과 저장
+ 가격 비교 미반영 정책
```

최종 목표:

> **가격 비교 화면은 건드리지 않고, 관리자 진단 화면에서 현재 URL이 실제로 크롤링 가능한지 즉시 테스트하고, 실패 원인을 fetch / parser / DB 단계로 구분해 확인한다.**
