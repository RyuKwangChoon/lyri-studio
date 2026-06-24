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
  product_id?: number
  productId?: number
  url: string
  memo?: string | null
  is_active?: number
  product_name?: string | null
  productName?: string | null
  seller?: string | null
  price?: number | null
  prevPrice?: number | null
  todayPrice?: number | null
  currency?: string | null
  collected_at?: string | null
  prevCollectedAt?: string | null
  todayCollectedAt?: string | null
  base_date?: string
  base_time?: string
  timezone?: string
  status?: string
  error_message?: string | null
  changeMark?: 'O' | 'X' | '-'
  changed?: boolean
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

type SortKey = 'change' | 'market' | 'name'
type SortDir = 'asc' | 'desc'

const sortKey = ref<SortKey>('change')
const sortDir = ref<SortDir>('asc')
const selectedProductIds = ref<number[]>([])

function getChangeMark(item: SnapshotItem) {
  return String((item as any).changeMark || '-')
}

function getProductTitle(item: SnapshotItem) {
  return String(
    (item as any).productName ||
    (item as any).product_name ||
    item.memo ||
    ''
  )
}

function marketRank(item: SnapshotItem) {
  const name = marketName(item.url)

  if (name.includes('네이버')) return 1
  if (name.includes('무신사')) return 2
  if (name.includes('올리브영')) return 3
  if (name.includes('쿠팡')) return 4

  return 99
}

function changeRank(item: SnapshotItem) {
  const mark = getChangeMark(item)

  if (mark === 'O') return 1
  if (mark === '-') return 2
  if (mark === 'X') return 3

  return 99
}

const sortedSnapshots = computed(() => {
  const copied = [...snapshots.value]

  copied.sort((a, b) => {
    let result = 0

    if (sortKey.value === 'change') {
      result = changeRank(a) - changeRank(b)
    }

    if (sortKey.value === 'market') {
      result = marketRank(a) - marketRank(b)

      if (result === 0) {
        result = getProductTitle(a).localeCompare(getProductTitle(b), 'ko-KR')
      }
    }

    if (sortKey.value === 'name') {
      result = getProductTitle(a).localeCompare(getProductTitle(b), 'ko-KR')
    }

    return sortDir.value === 'asc' ? result : -result
  })

  return copied
})

function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    return
  }

  sortKey.value = key
  sortDir.value = 'asc'
}

function sortIcon(key: SortKey) {
  if (sortKey.value !== key) return '↕'
  return sortDir.value === 'asc' ? '↑' : '↓'
}

function snapshotProductId(item: SnapshotItem) {
  const rawId = item.productId ?? item.product_id ?? item.id
  const id = Number(rawId)
  return Number.isFinite(id) ? id : null
}

const visibleSnapshotProductIds = computed(() => {
  const ids: number[] = []

  for (const item of sortedSnapshots.value) {
    const id = snapshotProductId(item)
    if (id !== null && !ids.includes(id)) ids.push(id)
  }

  return ids
})

const selectedCount = computed(() => selectedProductIds.value.length)
const allVisibleSelected = computed(() => {
  const ids = visibleSnapshotProductIds.value
  return ids.length > 0 && ids.every(id => selectedProductIds.value.includes(id))
})

function isSnapshotSelected(item: SnapshotItem) {
  const id = snapshotProductId(item)
  return id !== null && selectedProductIds.value.includes(id)
}

function setSnapshotSelected(item: SnapshotItem, checked: boolean) {
  const id = snapshotProductId(item)
  if (id === null) return

  if (checked) {
    if (!selectedProductIds.value.includes(id)) {
      selectedProductIds.value = [...selectedProductIds.value, id]
    }
    return
  }

  selectedProductIds.value = selectedProductIds.value.filter(x => x !== id)
}

function onToggleSnapshot(item: SnapshotItem, event: Event) {
  const checked = event.target instanceof HTMLInputElement ? event.target.checked : false
  setSnapshotSelected(item, checked)
}

function toggleAllVisible(checked: boolean) {
  const ids = visibleSnapshotProductIds.value

  if (checked) {
    selectedProductIds.value = Array.from(new Set([...selectedProductIds.value, ...ids]))
    return
  }

  selectedProductIds.value = selectedProductIds.value.filter(id => !ids.includes(id))
}

function onToggleAllVisible(event: Event) {
  const checked = event.target instanceof HTMLInputElement ? event.target.checked : false
  toggleAllVisible(checked)
}

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
    Authorization: `Bearer ${apiToken.value.trim()}`,
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
    const detail = data?.error || data?.message || res.statusText || `HTTP_${res.status}`
    throw new Error(detail)
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

function stripCsvCell(value: string) {
  return value
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim()
}

function isCsvHeader(line: string) {
  const normalized = line.toLowerCase().replace(/\s+/g, '')
  return (
    normalized === 'url,memo' ||
    normalized === 'url_memo' ||
    normalized === 'url\tmemo' ||
    normalized.startsWith('url,memo') ||
    normalized.startsWith('url\tmemo')
  )
}

function parseCsvLines(text: string) {
  const items: Array<{ url: string; memo: string }> = []

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()

    if (!line || isCsvHeader(line)) continue

    const match = line.match(/^(https?:\/\/[^\s,]+)[\t ,]*(.*)$/i)

    if (!match) continue

    const url = stripCsvCell(match[1])
    const memo = stripCsvCell(match[2] || '')

    if (!url.startsWith('http')) continue

    try {
      new URL(url)
      items.push({ url, memo })
    } catch {
      // 잘못된 URL은 제외
    }
  }

  return items
}

async function importCsvProducts() {
  const items = parseCsvLines(csvText.value)

  if (items.length === 0) {
    setError('등록할 URL이 없습니다. CSV 형식을 확인하세요. 예: url,memo')
    return
  }

  loading.value = true
  saveSettings()
  setMessage(`CSV URL ${items.length}개 등록 중...`)

  let success = 0
  let failed = 0
  const failedUrls: string[] = []

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
        failedUrls.push(item.url)
      }
    }

    const data = await requestJson('/products')
    products.value = data.items || []

    const failText = failed > 0 ? ` / 실패 URL ${failedUrls.slice(0, 3).join(', ')}` : ''
    setMessage(`URL 등록 완료: 성공 ${success}개 / 실패 ${failed}개 / 현재 등록 ${products.value.length}개${failText}`)
  } catch (err) {
    setError(`CSV 등록 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

async function refreshProductsAndCompare() {
  const productData = await requestJson('/products')
  products.value = productData.items || []

  if (baseDate.value) {
    const compareData = await requestJson(`/compare?date=${encodeURIComponent(baseDate.value)}`)
    snapshots.value = compareData.items || []
  }

  const validIds = new Set(products.value.map(item => item.id))
  selectedProductIds.value = selectedProductIds.value.filter(id => validIds.has(id))
}

async function deleteProductById(id: number, label: string, messageText: string) {
  const ok = window.confirm(messageText)
  if (!ok) return

  loading.value = true
  saveSettings()

  try {
    await requestJson(`/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    })

    await refreshProductsAndCompare()
    setMessage(`URL 삭제 완료: ${label}`)
  } catch (err) {
    setError(`URL 삭제 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

async function deleteProductItem(item: ProductItem) {
  const label = item.memo || shortUrl(item.url)
  await deleteProductById(item.id, label, `등록 URL을 삭제할까요?\n\n${label}`)
}

async function deleteSnapshotItem(item: SnapshotItem) {
  const id = snapshotProductId(item)
  if (id === null) {
    setError('삭제할 상품 ID를 찾을 수 없습니다.')
    return
  }

  const label = productTitle(item)
  await deleteProductById(id, label, `이 상품을 삭제할까요?\n\n${label}`)
}

async function deleteSelectedSnapshotItems() {
  const ids = [...selectedProductIds.value]

  if (ids.length === 0) {
    setError('삭제할 상품을 선택하세요.')
    return
  }

  const ok = window.confirm(`선택한 ${ids.length}개 상품을 삭제할까요?`)
  if (!ok) return

  loading.value = true
  saveSettings()

  let success = 0
  let failed = 0

  try {
    for (const id of ids) {
      try {
        await requestJson(`/products/${id}`, {
          method: 'DELETE',
          headers: authHeaders()
        })
        success += 1
      } catch {
        failed += 1
      }
    }

    selectedProductIds.value = []
    await refreshProductsAndCompare()
    setMessage(`선택 삭제 완료: 성공 ${success}개 / 실패 ${failed}개`)
  } catch (err) {
    setError(`선택 삭제 실패: ${err instanceof Error ? err.message : String(err)}`)
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
    const data = await requestJson(`/compare?date=${encodeURIComponent(baseDate.value)}`)
    snapshots.value = data.items || []
    setMessage(`전일/당일 비교 결과 ${snapshots.value.length}개 조회 완료`)
  } catch (err) {
    setError(`비교 결과 조회 실패: ${err instanceof Error ? err.message : String(err)}`)
  } finally {
    loading.value = false
  }
}

function itemKey(item: SnapshotItem) {
  return item.productId ?? item.product_id ?? item.id ?? item.url
}

function productTitle(item: SnapshotItem) {
  return item.productName || item.product_name || item.memo || '-'
}

function changeLabel(item: SnapshotItem) {
  if (item.changeMark === 'O' || item.changeMark === 'X') return item.changeMark
  return '-'
}

function changeClass(item: SnapshotItem) {
  if (item.changeMark === 'O') return 'fail'
  if (item.changeMark === 'X') return 'ok'
  return 'neutral'
}

function compareNote(item: SnapshotItem) {
  if (item.status === 'NO_PREV') return '전일 데이터 없음'
  if (item.status === 'NO_TODAY') return '당일 데이터 없음'
  if (item.status === 'FAILED') return item.error_message || '수집 실패'
  if (item.changeMark === 'O') return '가격 변동 있음'
  if (item.changeMark === 'X') return '가격 변동 없음'
  return item.status || '-'
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

function marketLines(url: string) {
  const name = marketName(url)

  if (name === '네이버 스마트스토어') return ['네이버', '스마트스토어']
  if (name === '네이버 브랜드스토어') return ['네이버', '브랜드스토어']

  return [name]
}

function formatPrice(price?: number | null) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return '-'
  return `${Number(price).toLocaleString('ko-KR')}원`
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
        <button class="primary" type="button" :disabled="loading || !hasToken" @click="runCrawl">
          {{ loading ? '실행 중...' : '수동 수집 실행' }}
        </button>

        <button class="secondary" type="button" :disabled="loading" @click="loadLatestSnapshots">
          비교 결과 조회
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
        <button class="primary" type="button" :disabled="loading || !hasToken" @click="addSingleProduct">
          1개 등록
        </button>
      </div>

      <label class="textarea-label">
        <span>CSV 붙여넣기</span>
        <textarea v-model="csvText" rows="6" placeholder="url,memo 형식 또는 URL 상품명 형식으로 붙여넣기" />
      </label>

      <div class="actions">
        <button class="primary" type="button" :disabled="loading || !hasToken" @click="importCsvProducts">
          CSV URL 등록
        </button>

        <button class="secondary" type="button" :disabled="loading" @click="loadProducts">
          등록 목록 새로고침
        </button>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head inline">
        <div>
          <h2>4. 전일/당일 가격 비교 결과</h2>
          <p>등록 상품 전체를 표시하고, 전일 대비 가격 변동 여부를 O/X로 확인합니다.</p>
        </div>

        <span class="count">{{ snapshots.length }}개</span>
      </div>

      <div class="compare-toolbar">
        <button
          class="danger-btn"
          type="button"
          :disabled="loading || !hasToken || selectedCount === 0"
          @click="deleteSelectedSnapshotItems"
        >
          선택 삭제 {{ selectedCount > 0 ? `${selectedCount}개` : '' }}
        </button>

        <button class="secondary" type="button" :disabled="loading" @click="loadLatestSnapshots">
          비교 결과 조회
        </button>
      </div>

      <div class="desktop-table compare-table-wrap">
        <table>
          <thead>
            <tr>
              <th class="select-col">
                <label class="select-all">
                  <input
                    type="checkbox"
                    :checked="allVisibleSelected"
                    :disabled="loading || sortedSnapshots.length === 0"
                    @change="onToggleAllVisible"
                  />
                  <span>선택</span>
                </label>
              </th>

              <th>
                <button class="sort-th" type="button" @click="sortBy('change')">
                  변동 {{ sortIcon('change') }}
                </button>
              </th>

              <th>
                <button class="sort-th" type="button" @click="sortBy('market')">
                  몰 {{ sortIcon('market') }}
                </button>
              </th>

              <th>
                <button class="sort-th" type="button" @click="sortBy('name')">
                  상품명 / 메모 {{ sortIcon('name') }}
                </button>
              </th>
              <th>전일가</th>
              <th>당일가</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in sortedSnapshots"
              :key="`${item.product_id || item.productId}-${item.id || item.url}`"
              :class="{ 'changed-row': item.changeMark === 'O', 'muted-row': item.changeMark === '-' }"
            >
              <td class="selection-cell">
                <input
                  class="row-check"
                  type="checkbox"
                  :checked="isSnapshotSelected(item)"
                  :disabled="loading || !hasToken"
                  @change="onToggleSnapshot(item, $event)"
                />
                <button
                  class="mini-delete-btn"
                  type="button"
                  :disabled="loading || !hasToken"
                  @click="deleteSnapshotItem(item)"
                >
                  삭제
                </button>
              </td>

              <td>
                <span class="badge" :class="changeClass(item)">
                  {{ changeLabel(item) }}
                </span>
              </td>

              <td>
                <span class="market-lines">
                  <span v-for="line in marketLines(item.url)" :key="line">{{ line }}</span>
                </span>
              </td>

              <td>
                <a class="product-title-link" :href="item.url" target="_blank" rel="noopener noreferrer">
                  {{ productTitle(item) }}
                </a>
                <small v-if="item.memo && productTitle(item) !== item.memo">{{ item.memo }}</small>
              </td>

              <td class="price">{{ formatPrice(item.prevPrice) }}</td>
              <td class="price" :class="{ 'changed-price': item.changeMark === 'O' }">
                {{ formatPrice(item.todayPrice) }}
              </td>
            </tr>

            <tr v-if="snapshots.length === 0">
              <td colspan="6" class="empty">
                아직 조회된 비교 결과가 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mobile-cards">
        <article
          v-for="item in sortedSnapshots"
          :key="`m-${itemKey(item)}`"
          class="result-card"
          :class="{ 'changed-card': item.changeMark === 'O' }"
        >
          <div class="card-top">
            <span class="badge" :class="changeClass(item)">
              {{ changeLabel(item) }}
            </span>
            <strong class="card-price" :class="{ 'changed-price': item.changeMark === 'O' }">
              {{ formatPrice(item.todayPrice) }}
            </strong>
          </div>

          <h3>
            <a class="product-title-link" :href="item.url" target="_blank" rel="noopener noreferrer">
              {{ productTitle(item) }}
            </a>
          </h3>

          <p class="market">
            <span v-for="line in marketLines(item.url)" :key="line">{{ line }} </span>
          </p>

          <div class="mobile-price-pair">
            <span>전일가 {{ formatPrice(item.prevPrice) }}</span>
            <span>당일가 {{ formatPrice(item.todayPrice) }}</span>
          </div>

          <p class="time">
            {{ compareNote(item) }}
          </p>

          <div class="mobile-row-actions">
            <label class="mobile-check">
              <input
                type="checkbox"
                :checked="isSnapshotSelected(item)"
                :disabled="loading || !hasToken"
                @change="onToggleSnapshot(item, $event)"
              />
              선택
            </label>

            <button class="danger-btn full" type="button" :disabled="loading || !hasToken" @click="deleteSnapshotItem(item)">
              삭제
            </button>
          </div>
        </article>

        <div v-if="snapshots.length === 0" class="empty-card">
          아직 조회된 비교 결과가 없습니다.
        </div>
      </div>

    </section>

    <details class="panel compact product-manager">
      <summary>
        <span>5. 등록 URL 관리</span>
        <span class="count">{{ products.length }}개</span>
      </summary>

      <div class="product-manager-body">
        <p class="manager-desc">현재 Worker DB에 등록된 URL입니다. 필요할 때만 펼쳐서 관리합니다.</p>

        <div class="product-list">
          <div v-for="item in products" :key="item.id" class="product-row">
            <div class="product-info">
              <strong>{{ item.memo || '메모 없음' }}</strong>
              <p>{{ shortUrl(item.url) }}</p>
            </div>

            <div class="product-actions">
              <button class="link-btn" type="button" @click="openUrl(item.url)">
                열기
              </button>

              <button class="danger-btn" type="button" :disabled="loading || !hasToken" @click="deleteProductItem(item)">
                삭제
              </button>
            </div>
          </div>

          <div v-if="products.length === 0" class="empty-card">
            등록된 URL이 없습니다.
          </div>
        </div>
      </div>
    </details>

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
  appearance: none;
  border: 1px solid #2f9e5b;
  border-radius: 10px;
  padding: 10px 14px;
  min-height: 42px;
  background: #2f9e5b;
  color: #ffffff;
  font: inherit;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
}

button.primary {
  background: #2f9e5b;
  border-color: #2f9e5b;
  color: #ffffff;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  background: #94a3b8;
  border-color: #94a3b8;
  color: #ffffff;
  opacity: 0.75;
  cursor: not-allowed;
}

button.secondary {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
}

button.secondary:disabled {
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-3);
  border-color: var(--vp-c-divider);
}

button.full {
  width: 100%;
}

.link-btn {
  min-height: 34px;
  background: transparent;
  color: var(--vp-c-brand-1);
  padding: 6px 8px;
  border: 1px solid var(--vp-c-divider);
}

.desktop-table {
  width: 100%;
  overflow-x: auto;
}

.desktop-table table {
  width: 100%;
  min-width: 920px;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 14px;
}

.desktop-table th,
.desktop-table td {
  word-break: keep-all;
  overflow-wrap: normal;
}

/* 변동 */
.desktop-table th:nth-child(1),
.desktop-table td:nth-child(1) {
  width: 70px;
  text-align: center;
}

/* 몰 */
.desktop-table th:nth-child(2),
.desktop-table td:nth-child(2) {
  width: 90px;
  white-space: nowrap;
}

/* 상품명 */
.desktop-table th:nth-child(3),
.desktop-table td:nth-child(3) {
  width: 230px;
}

/* 전일가 / 당일가 */
.desktop-table th:nth-child(4),
.desktop-table td:nth-child(4),
.desktop-table th:nth-child(5),
.desktop-table td:nth-child(5) {
  width: 90px;
  white-space: nowrap;
}

/* 상태 */
.desktop-table th:nth-child(6),
.desktop-table td:nth-child(6) {
  width: 90px;
  text-align: center;
}

/* 수집시각 */
.desktop-table th:nth-child(7),
.desktop-table td:nth-child(7) {
  width: 150px;
}

/* URL */
.desktop-table th:nth-child(8),
.desktop-table td:nth-child(8) {
  width: 70px;
  text-align: center;
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

.product-info {
  min-width: 0;
}

.product-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.danger-btn {
  min-height: 34px;
  padding: 6px 10px;
  background: #dc2626;
  border-color: #dc2626;
  color: #ffffff;
}

.danger-btn:disabled {
  background: #94a3b8;
  border-color: #94a3b8;
}

.empty-card {
  padding: 18px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-2);
  text-align: center;
}


.compare-toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 0 0 14px;
}

.compare-table-wrap {
  width: 100%;
  max-height: 680px;
  overflow-y: auto;
  overflow-x: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.compare-table-wrap table {
  width: 100%;
  min-width: 0;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 14px;
}

.compare-table-wrap thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--vp-c-bg-soft);
}

.compare-table-wrap th:nth-child(1),
.compare-table-wrap td:nth-child(1) {
  width: 68px;
  text-align: center;
}

.compare-table-wrap th:nth-child(2),
.compare-table-wrap td:nth-child(2) {
  width: 64px;
  text-align: center;
}

.compare-table-wrap th:nth-child(3),
.compare-table-wrap td:nth-child(3) {
  width: 86px;
  text-align: center;
}

.compare-table-wrap th:nth-child(4),
.compare-table-wrap td:nth-child(4) {
  width: auto;
}

.compare-table-wrap th:nth-child(5),
.compare-table-wrap td:nth-child(5),
.compare-table-wrap th:nth-child(6),
.compare-table-wrap td:nth-child(6) {
  width: 92px;
  white-space: nowrap;
}

.select-all,
.selection-cell {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.select-all {
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 800;
}

.row-check,
.select-all input,
.mobile-check input {
  width: 16px;
  height: 16px;
  padding: 0;
  accent-color: #2f9e5b;
}

.mini-delete-btn {
  min-height: 26px;
  padding: 4px 7px;
  border-color: #dc2626;
  border-radius: 8px;
  background: #dc2626;
  color: #ffffff;
  font-size: 12px;
}

.market-lines {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.35;
  word-break: keep-all;
}

.product-title-link {
  color: var(--vp-c-brand-1);
  font-weight: 800;
  line-height: 1.45;
  text-decoration: none;
}

.product-title-link:hover {
  text-decoration: underline;
}

.changed-row {
  background: rgba(255, 77, 79, 0.12);
}

.changed-row td:first-child {
  box-shadow: inset 4px 0 0 #dc2626;
}

.muted-row {
  color: var(--vp-c-text-2);
}

.changed-price {
  color: #dc2626;
  font-weight: 900;
}

.changed-card {
  background: rgba(255, 77, 79, 0.12) !important;
  border-color: rgba(220, 38, 38, 0.45) !important;
}

.mobile-row-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.mobile-check {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-weight: 800;
}

.product-manager {
  padding: 0;
  overflow: hidden;
}

.product-manager summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 22px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 800;
  list-style: none;
}

.product-manager summary::-webkit-details-marker {
  display: none;
}

.product-manager summary::before {
  content: '▶';
  color: var(--vp-c-text-2);
  font-size: 13px;
}

.product-manager[open] summary::before {
  content: '▼';
}

.product-manager[open] summary {
  border-bottom: 1px solid var(--vp-c-divider);
}

.product-manager-body {
  padding: 16px 22px 22px;
}

.manager-desc {
  margin: 0 0 14px;
  color: var(--vp-c-text-2);
  font-size: 14px;
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

  .compare-toolbar {
    flex-direction: column;
  }

  .compare-toolbar button {
    width: 100%;
  }

  .product-manager summary {
    padding: 16px;
    font-size: 18px;
  }

  .product-manager-body {
    padding: 14px 16px 16px;
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

  .mobile-price-pair {
    display: grid;
    grid-template-columns: 1fr;
    gap: 4px;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 700;
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

  .product-actions {
    width: 100%;
  }

  .product-row .link-btn,
  .product-row .danger-btn {
    width: 100%;
  }
}

.desktop-table .sort-th {
  appearance: none;
  min-height: auto;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--vp-c-text-2);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
}

.desktop-table .sort-th:hover {
  opacity: 0.7;
}
</style>
