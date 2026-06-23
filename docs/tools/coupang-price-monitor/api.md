# API 명세

Base URL 예시:

```text
https://api.lyrisudabang.com
```

관리성 API는 `Authorization: Bearer <API_TOKEN>` 헤더를 사용한다.

## 1. Health

### `GET /health`

```json
{
  "ok": true,
  "service": "coupang-price-worker",
  "time": "2026-06-23T09:00:00+09:00"
}
```

## 2. Products

| Method | API | 목적 |
|---|---|---|
| GET | `/products` | 등록 제품 URL 목록 조회 |
| POST | `/products` | 제품 URL 1개 등록 |
| POST | `/products/import` | 제품 URL CSV 업로드 |
| PATCH | `/products/:id` | 메모/활성 여부 수정 |
| DELETE | `/products/:id` | 제품 비활성화 |

CSV 형식:

```text
url,memo
https://www.coupang.com/vp/products/123456789,헤라 옴므 기준상품
```

## 3. Settings

### `GET /settings/schedule`

### `PUT /settings/schedule`

```json
{
  "timezone": "Asia/Seoul",
  "baseTime": "09:00",
  "enabled": true
}
```

## 4. Crawl

| Method | API | 목적 |
|---|---|---|
| POST | `/crawl/run` | 수동 즉시 수집 실행 |
| GET | `/crawl/logs` | 수집 로그 조회 |

수동 수집 요청:

```json
{
  "baseDate": "2026-06-23",
  "baseTime": "09:00",
  "timezone": "Asia/Seoul",
  "mode": "MANUAL"
}
```

## 5. Snapshots

### `GET /snapshots?date=YYYY-MM-DD`

## 6. Compare

| Method | API | 목적 |
|---|---|---|
| GET | `/compare?date=YYYY-MM-DD` | 전일/당일 비교 |
| GET | `/compare/changed?date=YYYY-MM-DD` | 변동 상품만 조회 |
| GET | `/compare/failed?date=YYYY-MM-DD` | 수집 실패 상품 조회 |

비교 결과 예시:

```json
{
  "compareDate": "2026-06-23",
  "timezone": "Asia/Seoul",
  "baseTime": "09:00",
  "items": [
    {
      "productId": 1,
      "url": "https://www.coupang.com/vp/products/123456789",
      "productName": "헤라 옴므 세트",
      "seller": "리셀러A",
      "prevCollectedAt": "2026-06-22T09:00:11+09:00",
      "todayCollectedAt": "2026-06-23T09:00:08+09:00",
      "prevPrice": 45000,
      "todayPrice": 42900,
      "changed": true,
      "changeMark": "O",
      "diff": -2100,
      "diffRate": -4.67,
      "status": "DOWN"
    }
  ]
}
```

## 7. Export

| Method | API | 목적 |
|---|---|---|
| GET | `/export/products.csv` | 제품 목록 CSV 다운로드 |
| GET | `/export/compare.csv?date=YYYY-MM-DD` | 비교 결과 CSV 다운로드 |
