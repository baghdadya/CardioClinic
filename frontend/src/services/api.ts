import axios, { type AxiosRequestConfig } from 'axios'
import { enqueueRequest } from './sync'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// ---------------------------------------------------------------------------
// Auth interceptor — attach access token
// ---------------------------------------------------------------------------

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Offline interceptor — queue writes when the network is down
// ---------------------------------------------------------------------------

/** HTTP methods that mutate data and should be queued offline. */
const WRITE_METHODS = new Set(['post', 'put', 'patch', 'delete'])

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'get').toLowerCase()

  // Only intercept write operations
  if (!WRITE_METHODS.has(method)) return config

  // If we are online, let the request through normally
  if (navigator.onLine) {
    // Attach a client timestamp header so the server can detect stale writes
    if (config.data?.updated_at) {
      config.headers['X-Client-Updated-At'] = config.data.updated_at
    }
    return config
  }

  // --- Offline path ---
  // Build a description for the conflict modal
  const description = buildDescription(config)

  await enqueueRequest(
    {
      method: config.method,
      url: buildFullUrl(config),
      data: config.data,
      headers: {
        Authorization: config.headers.Authorization as string | undefined,
        'Content-Type': 'application/json',
        ...(config.data?.updated_at
          ? { 'X-Client-Updated-At': config.data.updated_at }
          : {}),
      },
    },
    description,
  )

  // Return a mock success response so the UI continues working.
  // The adapter must resolve rather than reject for the caller to
  // treat this as a successful request.
  const mockResponse = {
    data: { ...config.data, _offline: true },
    status: 202,
    statusText: 'Accepted (offline — queued for sync)',
    headers: {},
    config,
  }

  // Abort the real network request by returning a resolved adapter promise
  config.adapter = () => Promise.resolve(mockResponse)

  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — token refresh + offline error recovery
// ---------------------------------------------------------------------------

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    // ---- Network error while supposedly online → queue it ----
    if (!error.response && WRITE_METHODS.has((original.method ?? '').toLowerCase())) {
      // This covers cases where navigator.onLine is true but the request
      // still fails (e.g. DNS failure, server unreachable).
      const description = buildDescription(original)
      await enqueueRequest(
        {
          method: original.method,
          url: buildFullUrl(original),
          data: original.data,
          headers: {
            Authorization:
              (original.headers as Record<string, string>)?.Authorization,
            'Content-Type': 'application/json',
          },
        },
        description,
      )
      // Return a mock so callers don't crash
      return {
        data: { ...original.data, _offline: true },
        status: 202,
        statusText: 'Accepted (queued after network error)',
        headers: {},
        config: original,
      }
    }

    // ---- 401 → try refreshing the access token ----
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          ;(original.headers as Record<string, string>).Authorization =
            `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a full URL from the axios config (baseURL + url). */
function buildFullUrl(config: AxiosRequestConfig): string {
  const base = config.baseURL ?? '/api'
  const path = config.url ?? ''
  if (path.startsWith('http')) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Build a human-readable description of a queued request. */
function buildDescription(config: AxiosRequestConfig): string {
  const method = (config.method ?? 'POST').toUpperCase()
  const url = config.url ?? ''

  // Try to extract a meaningful name from the payload
  const data = config.data as Record<string, unknown> | undefined
  const name =
    data?.full_name ?? data?.name ?? data?.complaint ?? data?.diagnosis ?? ''
  const nameStr = name ? ` — ${name}` : ''

  // Extract entity type from URL (e.g. /api/patients/123 → Patient)
  const segments = url.split('/').filter(Boolean)
  const entity = segments.find((s) => !s.match(/^[0-9a-f-]+$/i)) ?? 'record'
  const entityLabel = entity.charAt(0).toUpperCase() + entity.slice(1).replace(/-/g, ' ')

  return `${method} ${entityLabel}${nameStr}`
}

export default api
