<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type DisplayStatus = 'NORMAL' | 'FAILED' | 'PENDING' | 'MISSING_PRICE'

interface CrawlDiagnosticsItem {
  productId: number
  snapshotId: number | null
  url: string
  memo: string | null
  market: string
  productName: string | null
  seller: string | null
  price: number | null
  status: string | null
  displayStatus: DisplayStatus
  errorMessage: string | null
  rawHash: string | null
  baseDate: string
  baseTime: string
  collectedAt: string | null
  createdAt: string | null
}

interface CrawlDiagnosticsSummary {
  total: number
  normal: number
  failed: number
  pending: number
  missingPrice: number
}

interface CrawlDiagnosticsResponse {
  ok: boolean
  baseDate: string
  baseTime: string
  summary: CrawlDiagnosticsSummary
  items: CrawlDiagnosticsItem[]
  error?: string
}

const defaultApiUrl = 'https://coupang-price-worker.kkamyu15.workers.dev'

const today = new Date()
const yyyy = today.getFullYear()
const mm = String(today.getMonth() + 1).padStart(2, '0')
const dd = String(today.getDate()).padStart(2, '0')

const isPanelOpen = ref(false)
const apiUrl = ref(defaultApiUrl)
const apiToken = ref('')
const baseDate = ref(`${yyyy}-${mm}-${dd}`)
const baseTime = ref('09:00')
const market = ref('ALL')
const status = ref('ALL')
const keyword = ref('')
const errorMessage = ref('')

const loading = ref(false)
const error = ref('')
const result = ref<CrawlDiagnosticsResponse | null>(null)
const selectedItem = ref<CrawlDiagnosticsItem | null>(null)

let previousBodyOverflow = ''
let previousBodyPaddingRight = ''

const items = computed(() => result.value?.items ?? [])

const summary = computed<CrawlDiagnosticsSummary>(() => {
  return (
    result.value?.summary ?? {
      total: 0,
      normal: 0,
      failed: 0,
      pending: 0,
      missingPrice: 0
    }
  )
})

function lockBodyScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return

  previousBodyOverflow = document.body.style.overflow
  previousBodyPaddingRight = document.body.style.paddingRight

  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  document.body.style.overflow = 'hidden'

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`
  }
}

function unlockBodyScroll() {
  if (typeof document === 'undefined') return

  document.body.style.overflow = previousBodyOverflow
  document.body.style.paddingRight = previousBodyPaddingRight
}

function openPanel() {
  isPanelOpen.value = true
  selectedItem.value = null
  lockBodyScroll()
}

function closePanel() {
  isPanelOpen.value = false
  selectedItem.value = null
  unlockBodyScroll()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return

  if (selectedItem.value) {
    selectedItem.value = null
    return
  }

  if (isPanelOpen.value) {
    closePanel()
  }
}

function saveSettings() {
  if (typeof window === 'undefined') return

  window.localStorage.setItem('priceMonitor.apiUrl', apiUrl.value)
  window.localStorage.setItem('priceMonitor.apiToken', apiToken.value)
  window.localStorage.setItem('priceMonitor.baseTime', baseTime.value)
}

function loadSettings() {
  if (typeof window === 'undefined') return

  apiUrl.value = window.localStorage.getItem('priceMonitor.apiUrl') || defaultApiUrl
  apiToken.value = window.localStorage.getItem('priceMonitor.apiToken') || ''
  baseTime.value = window.localStorage.getItem('priceMonitor.baseTime') || '09:00'
}

function formatPrice(value: number | null): string {
  if (value == null) return '-'
  return `${value.toLocaleString('ko-KR')}원`
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'

  return value
    .replace('T', ' ')
    .replace(/\.\d+Z$/, '')
    .replace(/\+09:00$/, '')
}

function statusLabel(value: DisplayStatus): string {
  if (value === 'NORMAL') return '정상'
  if (value === 'FAILED') return '실패'
  if (value === 'PENDING') return '미수집'
  if (value === 'MISSING_PRICE') return '가격 없음'

  return value
}

function statusClass(value: DisplayStatus): string {
  if (value === 'NORMAL') return 'is-normal'
  if (value === 'FAILED') return 'is-failed'
  if (value === 'PENDING') return 'is-pending'
  if (value === 'MISSING_PRICE') return 'is-warning'

  return ''
}

function buildUrl(): string {
  const base = apiUrl.value.replace(/\/$/, '')
  const params = new URLSearchParams()

  params.set('baseDate', baseDate.value)
  params.set('baseTime', baseTime.value)

  if (market.value !== 'ALL') params.set('market', market.value)
  if (status.value !== 'ALL') params.set('status', status.value)
  if (keyword.value.trim()) params.set('keyword', keyword.value.trim())
  if (errorMessage.value.trim()) params.set('errorMessage', errorMessage.value.trim())

  return `${base}/crawl-diagnostics?${params.toString()}`
}

async function fetchDiagnostics() {
  loading.value = true
  error.value = ''
  selectedItem.value = null

  try {
    saveSettings()

    const headers: Record<string, string> = {}

    if (apiToken.value.trim()) {
      headers.Authorization = `Bearer ${apiToken.value.trim()}`
    }

    const res = await fetch(buildUrl(), {
      method: 'GET',
      headers
    })

    const data = (await res.json()) as CrawlDiagnosticsResponse

    if (!res.ok || !data.ok) {
      throw new Error(data.error || `HTTP ${res.status}`)
    }

    result.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
    result.value = null
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  market.value = 'ALL'
  status.value = 'ALL'
  keyword.value = ''
  errorMessage.value = ''
}

function openDetail(item: CrawlDiagnosticsItem) {
  selectedItem.value = item
}

function closeDetail() {
  selectedItem.value = null
}

onMounted(() => {
  loadSettings()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  unlockBodyScroll()
})
</script>

<template>
  <section class="crawl-diagnostics-launcher">
    <div class="launcher-card">
      <div class="launcher-copy">
        <p class="eyebrow">Product Price Monitor</p>
        <h2>크롤링 진단</h2>
        <p class="description">
          상품 URL의 수집 성공 여부, 저장된 가격, 오류 메시지를 큰 화면에서 확인합니다.
        </p>
      </div>

      <button class="launcher-button" type="button" @click="openPanel">
        크롤링 진단 화면 크게 보기
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="isPanelOpen"
        class="diagnostics-modal"
        role="dialog"
        aria-modal="true"
        aria-label="크롤링 진단"
        @click.self="closePanel"
      >
        <div class="diagnostics-window">
          <div class="diagnostics-window-header">
            <div>
              <p class="eyebrow">Lyri Studio Admin</p>
              <h2>크롤링 진단</h2>
              <p class="header-description">
                등록된 상품 URL의 수집 결과를 조회하고, 실패/미수집 항목을 확인합니다.
              </p>
            </div>

            <button type="button" class="icon-button" aria-label="닫기" @click="closePanel">
              ×
            </button>
          </div>

          <div class="diagnostics-window-body">
            <section class="crawl-diagnostics">
              <div class="form-card">
                <div class="card-title-row">
                  <h3>1. API 설정</h3>
                  <span>브라우저 localStorage에 저장됩니다.</span>
                </div>

                <div class="grid two">
                  <label>
                    <span>API 주소</span>
                    <input v-model="apiUrl" type="text" placeholder="https://..." />
                  </label>

                  <label>
                    <span>관리 토큰</span>
                    <input v-model="apiToken" type="password" placeholder="필요 시 입력" />
                  </label>
                </div>
              </div>

              <div class="form-card">
                <div class="card-title-row">
                  <h3>2. 조회 조건</h3>
                  <button
                    class="ghost-button"
                    type="button"
                    @click="fetchDiagnostics"
                    :disabled="loading"
                  >
                    {{ loading ? '조회 중...' : '조회' }}
                  </button>
                </div>

                <div class="grid four">
                  <label>
                    <span>기준일</span>
                    <input v-model="baseDate" type="date" />
                  </label>

                  <label>
                    <span>기준시간</span>
                    <input v-model="baseTime" type="time" />
                  </label>

                  <label>
                    <span>쇼핑몰</span>
                    <select v-model="market">
                      <option value="ALL">전체</option>
                      <option value="MUSINSA">무신사</option>
                      <option value="OLIVEYOUNG">올리브영</option>
                      <option value="NAVER_SMARTSTORE">네이버 스마트스토어</option>
                      <option value="NAVER_BRANDSTORE">네이버 브랜드스토어</option>
                      <option value="UNKNOWN">미분류</option>
                    </select>
                  </label>

                  <label>
                    <span>상태</span>
                    <select v-model="status">
                      <option value="ALL">전체</option>
                      <option value="NORMAL">정상</option>
                      <option value="FAILED">실패</option>
                      <option value="PENDING">미수집</option>
                      <option value="MISSING_PRICE">가격 없음</option>
                    </select>
                  </label>
                </div>

                <div class="grid two">
                  <label>
                    <span>검색어</span>
                    <input
                      v-model="keyword"
                      type="text"
                      placeholder="상품명, 메모, URL, 판매자 검색"
                      @keyup.enter="fetchDiagnostics"
                    />
                  </label>

                  <label>
                    <span>오류 메시지</span>
                    <input
                      v-model="errorMessage"
                      type="text"
                      placeholder="예: MUSINSA_PARSE_PRICE_FAILED"
                      @keyup.enter="fetchDiagnostics"
                    />
                  </label>
                </div>

                <div class="button-row">
                  <button
                    type="button"
                    class="primary-button"
                    @click="fetchDiagnostics"
                    :disabled="loading"
                  >
                    {{ loading ? '조회 중...' : '크롤링 진단 조회' }}
                  </button>

                  <button type="button" class="secondary-button" @click="resetFilters">
                    필터 초기화
                  </button>
                </div>
              </div>

              <p v-if="error" class="error-box">
                {{ error }}
              </p>

              <div class="summary-grid">
                <div class="summary-card">
                  <strong>{{ summary.total }}</strong>
                  <span>전체</span>
                </div>

                <div class="summary-card normal">
                  <strong>{{ summary.normal }}</strong>
                  <span>정상</span>
                </div>

                <div class="summary-card failed">
                  <strong>{{ summary.failed }}</strong>
                  <span>실패</span>
                </div>

                <div class="summary-card pending">
                  <strong>{{ summary.pending }}</strong>
                  <span>미수집</span>
                </div>

                <div class="summary-card warning">
                  <strong>{{ summary.missingPrice }}</strong>
                  <span>가격 없음</span>
                </div>
              </div>

              <div class="table-card">
                <div class="table-header">
                  <h3>3. 수집 결과</h3>
                  <span>{{ items.length }}개 표시</span>
                </div>

                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>상태</th>
                        <th>쇼핑몰</th>
                        <th>상품명 / 메모</th>
                        <th>대표가</th>
                        <th>오류 메시지</th>
                        <th>수집일시</th>
                        <th>상세</th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr v-if="items.length === 0">
                        <td colspan="7" class="empty">
                          조회 결과가 없습니다.
                        </td>
                      </tr>

                      <tr v-for="item in items" :key="item.productId">
                        <td>
                          <span class="status-badge" :class="statusClass(item.displayStatus)">
                            {{ statusLabel(item.displayStatus) }}
                          </span>
                        </td>

                        <td>{{ item.market }}</td>

                        <td class="product-cell">
                          <strong>{{ item.productName || item.memo || '상품명 없음' }}</strong>
                          <small>{{ item.memo || '-' }}</small>
                          <a :href="item.url" target="_blank" rel="noreferrer">
                            {{ item.url }}
                          </a>
                        </td>

                        <td>{{ formatPrice(item.price) }}</td>

                        <td class="error-message">{{ item.errorMessage || '-' }}</td>

                        <td>{{ formatDateTime(item.collectedAt) }}</td>

                        <td>
                          <button type="button" class="small-button" @click="openDetail(item)">
                            보기
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside v-if="selectedItem" class="detail-drawer" @click.stop>
          <div class="detail-header">
            <div>
              <p class="eyebrow">Crawl Detail</p>
              <h3>{{ selectedItem.productName || selectedItem.memo || '상품 상세' }}</h3>
            </div>

            <button type="button" class="icon-button" aria-label="상세 닫기" @click="closeDetail">
              ×
            </button>
          </div>

          <dl>
            <div>
              <dt>상품 ID</dt>
              <dd>{{ selectedItem.productId }}</dd>
            </div>

            <div>
              <dt>Snapshot ID</dt>
              <dd>{{ selectedItem.snapshotId ?? '-' }}</dd>
            </div>

            <div>
              <dt>쇼핑몰</dt>
              <dd>{{ selectedItem.market }}</dd>
            </div>

            <div>
              <dt>상태</dt>
              <dd>{{ statusLabel(selectedItem.displayStatus) }}</dd>
            </div>

            <div>
              <dt>대표가</dt>
              <dd>{{ formatPrice(selectedItem.price) }}</dd>
            </div>

            <div>
              <dt>판매자</dt>
              <dd>{{ selectedItem.seller || '-' }}</dd>
            </div>

            <div>
              <dt>오류 메시지</dt>
              <dd>{{ selectedItem.errorMessage || '-' }}</dd>
            </div>

            <div>
              <dt>Raw Hash</dt>
              <dd>{{ selectedItem.rawHash || '-' }}</dd>
            </div>

            <div>
              <dt>기준일/시간</dt>
              <dd>{{ selectedItem.baseDate }} {{ selectedItem.baseTime }}</dd>
            </div>

            <div>
              <dt>수집일시</dt>
              <dd>{{ formatDateTime(selectedItem.collectedAt) }}</dd>
            </div>

            <div>
              <dt>생성시각</dt>
              <dd>{{ formatDateTime(selectedItem.createdAt) }}</dd>
            </div>

            <div class="wide">
              <dt>URL</dt>
              <dd>
                <a :href="selectedItem.url" target="_blank" rel="noreferrer">
                  {{ selectedItem.url }}
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.crawl-diagnostics-launcher {
  margin-top: 24px;
}

.launcher-card,
.form-card,
.table-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg-soft);
}

.launcher-card {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: center;
  padding: 28px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.08), transparent 46%),
    var(--vp-c-bg-soft);
}

.launcher-copy {
  min-width: 0;
}

.launcher-card h2 {
  margin: 0;
}

.description {
  margin: 8px 0 0;
  color: var(--vp-c-text-2);
}

.launcher-button {
  flex: 0 0 auto;
  min-width: 230px;
  border: 1px solid #2563eb;
  border-radius: 14px;
  background: #2563eb;
  color: #ffffff;
  padding: 14px 18px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.24);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

.launcher-button:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 14px 32px rgba(37, 99, 235, 0.34);
}

.launcher-button:active {
  transform: translateY(0);
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.24);
}

.launcher-button:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.35);
  outline-offset: 3px;
}

.crawl-diagnostics {
  display: grid;
  gap: 20px;
}

/* Desktop modal size */
.diagnostics-modal {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.48);
  overflow: hidden;
}

.diagnostics-window {
  width: min(1720px, calc(100vw - 24px));
  height: min(960px, calc(100vh - 24px));
  max-height: calc(100vh - 24px);
  display: flex;
  flex-direction: column;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--vp-c-bg);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.38);
  overflow: hidden;
}

.diagnostics-window-header {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 18px 22px;
  background: var(--vp-c-bg-soft);
}

.diagnostics-window-header h2 {
  margin: 0;
}

.header-description {
  margin: 4px 0 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.diagnostics-window-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 22px;
}

.diagnostics-window-body .crawl-diagnostics {
  margin-top: 0;
}

.form-card,
.table-card {
  padding: 20px;
}

.card-title-row,
.table-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.card-title-row h3,
.table-header h3 {
  margin: 0;
}

.card-title-row span,
.table-header span {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.eyebrow {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--vp-c-brand-1);
}

.grid {
  display: grid;
  gap: 12px;
  margin-top: 14px;
}

.grid.two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid.four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--vp-c-text-2);
}

input,
select {
  width: 100%;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 9px 10px;
  font-size: 14px;
}

input:focus,
select:focus {
  border-color: #2563eb;
  outline: 3px solid rgba(37, 99, 235, 0.16);
}

.button-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

button {
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 700;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.primary-button,
.ghost-button {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  padding: 9px 14px;
}

.primary-button:hover,
.ghost-button:hover {
  background: #1d4ed8;
  border-color: #1d4ed8;
}

.secondary-button,
.small-button,
.icon-button {
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 9px 14px;
}

.secondary-button:hover,
.small-button:hover,
.icon-button:hover {
  border-color: var(--vp-c-brand-1);
}

.small-button {
  padding: 6px 10px;
  white-space: nowrap;
}

.icon-button {
  width: 36px;
  height: 36px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
}

.error-box {
  border: 1px solid rgba(220, 38, 38, 0.35);
  border-radius: 12px;
  background: rgba(220, 38, 38, 0.08);
  color: #dc2626;
  padding: 12px 14px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.summary-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  padding: 14px;
}

.summary-card strong {
  display: block;
  font-size: 24px;
}

.summary-card span {
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.summary-card.normal strong {
  color: #16a34a;
}

.summary-card.failed strong {
  color: #dc2626;
}

.summary-card.pending strong {
  color: #6b7280;
}

.summary-card.warning strong {
  color: #ca8a04;
}

.table-wrap {
  overflow-x: auto;
  overflow-y: hidden;
  margin-top: 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
  font-size: 14px;
}

th,
td {
  border-bottom: 1px solid var(--vp-c-divider);
  padding: 10px;
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--vp-c-text-2);
  font-size: 12px;
  white-space: nowrap;
}

.product-cell {
  max-width: 420px;
}

.product-cell strong,
.product-cell small,
.product-cell a {
  display: block;
}

.product-cell small {
  margin-top: 2px;
  color: var(--vp-c-text-2);
}

.product-cell a {
  margin-top: 4px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  word-break: break-all;
}

.error-message {
  max-width: 260px;
  word-break: break-word;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.status-badge.is-normal {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.status-badge.is-failed {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.status-badge.is-pending {
  background: rgba(107, 114, 128, 0.14);
  color: #6b7280;
}

.status-badge.is-warning {
  background: rgba(202, 138, 4, 0.14);
  color: #ca8a04;
}

.empty {
  text-align: center;
  color: var(--vp-c-text-2);
  padding: 30px;
}

.detail-drawer {
  position: fixed;
  top: 28px;
  right: 28px;
  bottom: 28px;
  z-index: 120;
  width: min(560px, calc(100vw - 56px));
  overflow-y: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg);
  padding: 22px;
  box-shadow: -12px 0 36px rgba(0, 0, 0, 0.28);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 18px;
}

.detail-header h3 {
  margin: 0;
}

dl {
  display: grid;
  gap: 10px;
}

dl div {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 12px;
  background: var(--vp-c-bg-soft);
}

dt {
  font-size: 12px;
  font-weight: 800;
  color: var(--vp-c-text-2);
}

dd {
  margin: 4px 0 0;
  word-break: break-all;
}

:global(.dark) .launcher-button,
:global(.dark) .primary-button,
:global(.dark) .ghost-button {
  background: #3b82f6;
  border-color: #60a5fa;
  color: #ffffff;
  box-shadow: 0 10px 24px rgba(96, 165, 250, 0.22);
}

:global(.dark) .launcher-button:hover,
:global(.dark) .primary-button:hover,
:global(.dark) .ghost-button:hover {
  background: #2563eb;
  border-color: #93c5fd;
}

@media (max-width: 900px) {
  .launcher-card,
  .card-title-row,
  .table-header {
    display: grid;
  }

  .launcher-button {
    width: 100%;
  }

  .grid.two,
  .grid.four,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  /* Mobile modal override */
  .diagnostics-modal {
    padding: 6px;
  }

  .diagnostics-window {
    width: calc(100vw - 12px);
    height: calc(100vh - 12px);
    max-height: calc(100vh - 12px);
    border-radius: 14px;
  }

  .diagnostics-window-body {
    padding: 14px;
  }

  .detail-drawer {
    top: 8px;
    right: 8px;
    bottom: 8px;
    width: calc(100vw - 16px);
    border-radius: 14px;
  }
}
</style>
