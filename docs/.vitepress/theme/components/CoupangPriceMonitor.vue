<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

type ProductItem = {
  id: number
  url: string
  memo?: string | null
  is_active?: number
  created_at?: string
  updated_at?: string
}

type SnapshotItem = {
  id?: number
  product_id: number
  url: string
  memo?: string | null
  is_active?: number
  product_name?: string | null
  seller?: string | null
  price?: number | null
  currency?: string | null
  collected_at?: string | null
  base_date?: string
  base_time?: string
  timezone?: string
  status?: string
  error_message?: string | null
  created_at?: string
}


const apiBase = ref('https://coupang-price-worker.kkamyu15.workers.dev')
const apiToken = ref('CHANGE_ME_FOR_DEV_ONLY')

const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, '0')
const dd = String(today.getDate()).padStart(2, '0')

const baseDate = ref(`${yyyy}-${mm}-${dd}`)
const baseTime = ref('10:30')
const timezone = ref('Asia/Seoul')

const singleUrl = ref('')
const singleMemo = ref('')
const csvText = ref(`url,memo
https://www.musinsa.com/products/6175987,무지개맨션 오브제 리퀴드 틴트
https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000180297,페리페라 브이 쉐딩`)

const products = ref<ProductItem[]>([])
const snapshots = ref<SnapshotItem[]>([])

const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

const hasToken = computed(() => apiToken.value.trim().length > 0)

function saveSettings() {
  localStorage.setItem('ppm_api_base', apiBase.value)
  localStorage.setItem('ppm_api_token', apiToken.value)
  localStorage.setItem('ppm_base_time', baseTime.value)
  localStorage.setItem('ppm_timezone', timezone.value)
}

function loadSettings() {
  apiBase.value = localStorage.getItem('ppm_api_base') || apiBase.value
  apiToken.value = localStorage.getItem('ppm_api_token') || apiToken.value
  baseTime.value = localStorage.getItem('ppm_base_time') || baseTime.value
  timezone.value = localStorage.getItem('ppm_timezone') || timezone.value
}

function endpoint(path: string) {
  return `${apiBase.value.replace(/\/$/, '')}${path}`
}

function authHeaders() {
  return {
    Authorization: `Bearer ${apiToken.value}`,
    'Content-Type': 'application/json; charset=utf-8'
  }
}

function setMessage(text: string) {
  message.value = text
  errorMessage.value = ''
}

function setError(text: string) {
  errorMessage.value = text
  message.value = ''
}

async function requestJson(path: string, options: RequestInit = {}) {
  const res = await fetch(endpoint(path), options)
  const data = await res.json().catch(() => null)

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || `HTTP_${res.status}`)
  }

  return data
}

async function loadProducts() {
  loading.value = true

  try {
    const data = await requestJson('/products')
    products.value = data.items || []
    setMessage(`등록 URL ${products.value.length}개 조회 완료`)
  } catch (err) {
    setError(`URL 목록 조회 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

async function addSingleProduct() {
  if (!singleUrl.value.trim()) {
    setError('URL을 입력해야 합니다.')
    return
  }

  loading.value = true
  saveSettings()

  try {
    await requestJson('/products', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        url: singleUrl.value.trim(),
        memo: singleMemo.value.trim()
      })
    })

    singleUrl.value = ''
    singleMemo.value = ''

    await loadProducts()
    setMessage('URL 1개 등록 완료')
  } catch (err) {
    setError(`URL 등록 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

function parseCsvLines(text: string) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !line.toLowerCase().startsWith('url,'))
    .map(line => {
      const firstComma = line.indexOf(',')

      if (firstComma < 0) {
        return {
          url: line.trim(),
          memo: ''
        }
      }

      return {
        url: line.slice(0, firstComma).trim(),
        memo: line.slice(firstComma + 1).trim()
      }
    })
    .filter(item => item.url.startsWith('http'))
}

async function importCsvProducts() {
  const items = parseCsvLines(csvText.value)

  if (items.length === 0) {
    setError('등록할 URL이 없습니다. CSV 형식을 확인하세요.')
    return
  }

  loading.value = true
  saveSettings()

  let success = 0
  let failed = 0

  try {
    for (const item of items) {
      try {
        await requestJson('/products', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(item)
        })
        success += 1
      } catch {
        failed += 1
      }
    }

    await loadProducts()
    setMessage(`URL 등록 완료: 성공 ${success}개 / 실패 ${failed}개`)
  } catch (err) {
    setError(`CSV 등록 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

async function runCrawl() {
  loading.value = true
  saveSettings()

  try {
    const data = await requestJson('/crawl/run', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        baseDate: baseDate.value,
        baseTime: baseTime.value,
        timezone: timezone.value,
        mode: 'MANUAL'
      })
    })

    setMessage(`수집 완료: 전체 ${data.total}개 / 성공 ${data.success}개 / 실패 ${data.failed}개`)
    await loadLatestSnapshots()
  } catch (err) {
    setError(`수집 실행 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

async function loadLatestSnapshots() {
  if (!baseDate.value) {
    setError('기준일을 입력하세요.')
    return
  }

  loading.value = true

  try {
    const data = await requestJson(`/snapshots/latest?date=${encodeURIComponent(baseDate.value)}`)
    snapshots.value = data.items || []
    setMessage(`최신 결과 ${snapshots.value.length}개 조회 완료`)
  } catch (err) {
    setError(`최신 결과 조회 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

function statusLabel(item: SnapshotItem) {
  if (item.status === 'SUCCESS') return '성공'
  if (item.error_message === 'NAVER_FETCH_BLOCKED_429') return '수집 제한'
  if (item.status === 'FAILED') return '실패'
  return item.status || '-'
}

function statusClass(item: SnapshotItem) {
  if (item.status === 'SUCCESS') return 'ok'
  if (item.error_message === 'NAVER_FETCH_BLOCKED_429') return 'blocked'
  if (item.status === 'FAILED') return 'fail'
  return 'neutral'
}

function marketName(url: string) {
  const lower = url.toLowerCase()

  if (lower.includes('smartstore.naver.com')) return '네이버 스마트스토어'
  if (lower.includes('brand.naver.com')) return '네이버 브랜드스토어'
  if (lower.includes('musinsa.com')) return '무신사'
  if (lower.includes('oliveyoung.co.kr')) return '올리브영'
  if (lower.includes('coupang.com')) return '쿠팡'

  return '기타'
}

function formatPrice(price?: number | null) {
  if (!price) return '-'
  return `${price.toLocaleString('ko-KR')}원`
}

function shortUrl(url: string) {
  try {
    const u = new URL(url)
    return `${u.hostname}${u.pathname}`
  } catch {
    return url
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

onMounted(async () => {
  loadSettings()
  await loadProducts()
  await loadLatestSnapshots()
})
</script>

<template>
  <section class="ppm">
    <header class="ppm-hero">
      <div>
        <p class="eyebrow">Lyri Studio Tools</p>
        <h1>Product Price Monitor</h1>
        <p class="desc">
          상품 URL을 등록하고, 수동 수집을 실행한 뒤 최신 가격 결과를 확인합니다.
        </p>
      </div>

      <div class="hero-status">
        <span class="dot"></span>
        Worker API
      </div>
    </header>

    <div v-if="message" class="notice success">
      {{ message }}
    </div>

    <div v-if="errorMessage" class="notice error">
      {{ errorMessage }}
    </div>

    <section class="panel">
      <div class="panel-head">
        <h2>1. API 설정</h2>
        <p>로컬 테스트는 기본값 그대로 사용합니다.</p>
      </div>

      <div class="grid two">
        <label>
          <span>API 주소</span>
          <input v-model="apiBase" placeholder="http://localhost:8787" @change="saveSettings" />
        </label>

        <label>
          <span>관리 토큰</span>
          <input v-model="apiToken" type="password" placeholder="Bearer Token" @change="saveSettings" />
        </label>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>2. 기준 날짜/시간</h2>
        <p>전일/당일 비교와 스냅샷 조회 기준입니다.</p>
      </div>

      <div class="grid three">
        <label>
          <span>기준일</span>
          <input v-model="baseDate" type="date" />
        </label>

        <label>
          <span>기준시간</span>
          <input v-model="baseTime" type="time" />
        </label>

        <label>
          <span>타임존</span>
          <input v-model="timezone" placeholder="Asia/Seoul" />
        </label>
      </div>

      <div class="actions">
        <button :disabled="loading || !hasToken" @click="runCrawl">
          {{ loading ? '실행 중...' : '수동 수집 실행' }}
        </button>

        <button class="secondary" :disabled="loading" @click="loadLatestSnapshots">
          최신 결과 조회
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>3. URL 등록</h2>
        <p>단일 등록 또는 CSV 붙여넣기를 사용할 수 있습니다.</p>
      </div>

      <div class="single-add">
        <input v-model="singleUrl" placeholder="상품 URL" />
        <input v-model="singleMemo" placeholder="메모 / 상품명" />
        <button :disabled="loading || !hasToken" @click="addSingleProduct">
          1개 등록
        </button>
      </div>

      <label class="textarea-label">
        <span>CSV 붙여넣기</span>
        <textarea v-model="csvText" rows="6" />
      </label>

      <div class="actions">
        <button :disabled="loading || !hasToken" @click="importCsvProducts">
          CSV URL 등록
        </button>

        <button class="secondary" :disabled="loading" @click="loadProducts">
          등록 목록 새로고침
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head inline">
        <div>
          <h2>4. 최신 수집 결과</h2>
          <p>상품별 최신 스냅샷만 표시합니다.</p>
        </div>

        <span class="count">{{ snapshots.length }}개</span>
      </div>

      <div class="desktop-table">
        <table>
          <thead>
            <tr>
              <th>상태</th>
              <th>몰</th>
              <th>상품명 / 메모</th>
              <th>가격</th>
              <th>오류</th>
              <th>수집시각</th>
              <th>URL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in snapshots" :key="`${item.product_id}-${item.id}`">
              <td>
                <span class="badge" :class="statusClass(item)">
                  {{ statusLabel(item) }}
                </span>
              </td>
              <td>{{ marketName(item.url) }}</td>
              <td>
                <strong>{{ item.product_name || item.memo || '-' }}</strong>
                <small v-if="item.memo && item.product_name">{{ item.memo }}</small>
              </td>
              <td class="price">{{ formatPrice(item.price) }}</td>
              <td class="error-cell">{{ item.error_message || '-' }}</td>
              <td>{{ item.collected_at || '-' }}</td>
              <td>
                <button class="link-btn" @click="openUrl(item.url)">
                  열기
                </button>
              </td>
            </tr>

            <tr v-if="snapshots.length === 0">
              <td colspan="7" class="empty">
                아직 조회된 결과가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-cards">
        <article v-for="item in snapshots" :key="`m-${item.product_id}-${item.id}`" class="result-card">
          <div class="card-top">
            <span class="badge" :class="statusClass(item)">
              {{ statusLabel(item) }}
            </span>
            <strong class="card-price">{{ formatPrice(item.price) }}</strong>
          </div>

          <h3>{{ item.product_name || item.memo || '-' }}</h3>

          <p class="market">{{ marketName(item.url) }}</p>

          <p v-if="item.error_message" class="mobile-error">
            {{ item.error_message }}
          </p>

          <p class="time">
            {{ item.collected_at || '-' }}
          </p>

          <button class="secondary full" @click="openUrl(item.url)">
            상품 페이지 열기
          </button>
        </article>

        <div v-if="snapshots.length === 0" class="empty-card">
          아직 조회된 결과가 없습니다.
        </div>
      </div>
    </section>

    <section class="panel compact">
      <div class="panel-head inline">
        <div>
          <h2>5. 등록 URL 목록</h2>
          <p>현재 Worker DB에 등록된 URL입니다.</p>
        </div>

        <span class="count">{{ products.length }}개</span>
      </div>

      <div class="product-list">
        <div v-for="item in products" :key="item.id" class="product-row">
          <div>
            <strong>{{ item.memo || '메모 없음' }}</strong>
            <p>{{ shortUrl(item.url) }}</p>
          </div>

          <button class="link-btn" @click="openUrl(item.url)">
            열기
          </button>
        </div>

        <div v-if="products.length === 0" class="empty-card">
          등록된 URL이 없습니다.
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.ppm {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ppm-hero {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background:
    radial-gradient(circle at top left, rgba(66, 184, 131, 0.16), transparent 38%),
    var(--vp-c-bg-soft);
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--vp-c-brand-1);
  font-weight: 700;
}

.ppm h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.15;
}

.desc {
  margin: 12px 0 0;
  color: var(--vp-c-text-2);
}

.hero-status {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-size: 13px;
  white-space: nowrap;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--vp-c-brand-1);
}

.notice {
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 14px;
}

.notice.success {
  background: rgba(66, 184, 131, 0.12);
  border: 1px solid rgba(66, 184, 131, 0.35);
  color: var(--vp-c-brand-1);
}

.notice.error {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.35);
  color: #d93025;
}

.panel {
  padding: 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg);
}

.panel.compact {
  padding-bottom: 12px;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-head.inline {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.panel h2 {
  margin: 0;
  font-size: 20px;
}

.panel p {
  margin: 6px 0 0;
  color: var(--vp-c-text-2);
  font-size: 14px;
}

.count {
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  font-size: 13px;
  white-space: nowrap;
}

.grid {
  display: grid;
  gap: 12px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

label,
.textarea-label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

input,
textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
}

textarea {
  resize: vertical;
  min-height: 130px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.single-add {
  display: grid;
  grid-template-columns: 1.4fr 1fr auto;
  gap: 10px;
  margin-bottom: 14px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

button {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

button.full {
  width: 100%;
}

.link-btn {
  background: transparent;
  color: var(--vp-c-brand-1);
  padding: 6px 8px;
  border: 1px solid var(--vp-c-divider);
}

.desktop-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--vp-c-text-2);
  font-size: 12px;
  white-space: nowrap;
}

td strong {
  display: block;
  line-height: 1.45;
}

td small {
  display: block;
  margin-top: 4px;
  color: var(--vp-c-text-3);
}

.price {
  white-space: nowrap;
  font-weight: 800;
}

.error-cell {
  max-width: 220px;
  color: var(--vp-c-text-2);
  word-break: break-word;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 58px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.badge.ok {
  background: rgba(66, 184, 131, 0.14);
  color: var(--vp-c-brand-1);
}

.badge.blocked {
  background: rgba(255, 176, 32, 0.16);
  color: #a15c00;
}

.badge.fail {
  background: rgba(255, 77, 79, 0.12);
  color: #d93025;
}

.badge.neutral {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
}

.empty {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 28px;
}

.mobile-cards {
  display: none;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}

.product-row strong {
  display: block;
}

.product-row p {
  word-break: break-all;
}

.empty-card {
  padding: 18px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-2);
  text-align: center;
}

@media (max-width: 768px) {
  .ppm {
    gap: 14px;
  }

  .ppm-hero {
    flex-direction: column;
    padding: 20px;
    border-radius: 16px;
  }

  .ppm h1 {
    font-size: 27px;
  }

  .panel {
    padding: 16px;
    border-radius: 15px;
  }

  .grid.two,
  .grid.three,
  .single-add {
    grid-template-columns: 1fr;
  }

  .actions {
    flex-direction: column;
  }

  .actions button {
    width: 100%;
  }

  .desktop-table {
    display: none;
  }

  .mobile-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .result-card {
    padding: 15px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 14px;
    background: var(--vp-c-bg-soft);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
  }

  .card-price {
    font-size: 18px;
  }

  .result-card h3 {
    margin: 0;
    font-size: 16px;
    line-height: 1.45;
  }

  .market,
  .time,
  .mobile-error {
    font-size: 13px;
    word-break: break-word;
  }

  .mobile-error {
    color: #a15c00;
  }

  .product-row {
    flex-direction: column;
  }

  .product-row .link-btn {
    width: 100%;
  }
}
</style>
