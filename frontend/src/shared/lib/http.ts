// Gọi API của Spring Boot. Response dạng { success, data, message, errors } (khớp ApiResponse ở BE).
const TOKEN_KEY = 'SWP_TOKEN'
export const setToken = (t: string | null) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY) } catch { /* bỏ qua khi bị chặn lưu trữ */ } }
const getToken = () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } }

interface Envelope<T> { success: boolean; data: T; message?: string; errors?: string[] }
export class ApiError extends Error {
  status: number
  errors: string[]
  constructor(message: string, status: number, errors: string[] = []) { super(message); this.status = status; this.errors = errors }
}
type Params = Record<string, string | number | boolean | undefined>

async function request<T>(method: string, url: string, body?: unknown, params?: Params): Promise<T> {
  const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) : ''
  const token = getToken()
  const res = await fetch(`/api${url}${qs}`, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!res.ok || !json?.success) throw new ApiError(json?.message ?? `Lỗi ${res.status}`, res.status, json?.errors)
  return json.data
}

export const http = {
  get: <T>(url: string, params?: Params) => request<T>('GET', url, undefined, params),
  // 404 → undefined (dùng cho các hàm get trả "không có")
  getOptional: async <T>(url: string, params?: Params): Promise<T | undefined> => {
    try { return await request<T>('GET', url, undefined, params) } catch (e) { if (e instanceof ApiError && e.status === 404) return undefined; throw e }
  },
  post: <T>(url: string, body?: unknown, params?: Params) => request<T>('POST', url, body ?? {}, params),
  patch: <T>(url: string, body?: unknown, params?: Params) => request<T>('PATCH', url, body ?? {}, params),
  del: <T>(url: string, params?: Params) => request<T>('DELETE', url, undefined, params),
}
