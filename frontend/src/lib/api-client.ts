type ApiRequestInit = RequestInit & {
  authToken?: string | null
  refreshToken?: string | null
  onTokenRefreshed?: (tokens: AuthTokens) => void
  data?: Record<string, unknown>
}

export type AuthTokens = {
  access: string
  refresh: string
}

export type ApiError = {
  message: string
  status?: number
  details?: unknown
}

const envOrigin = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.trim()
const useSameOrigin = envOrigin === "same-origin" || !envOrigin
const fallbackOrigin =
  (typeof window !== "undefined" && window.location?.origin) || "http://127.0.0.1:8000"
const API_ORIGIN =
  envOrigin && !useSameOrigin
    ? envOrigin.replace(/\/$/, "")
    : fallbackOrigin.replace(/\/$/, "")
const API_PATH_PREFIX =
  (import.meta.env.VITE_API_PATH_PREFIX as string | undefined) ?? "/api"

function normalizePrefix(prefix: string) {
  if (!prefix.startsWith("/")) return `/${prefix.replace(/^\/*/, "")}`
  return prefix
}

const normalizedPrefix = normalizePrefix(API_PATH_PREFIX).replace(/\/$/, "")
export const API_BASE_URL = `${API_ORIGIN}${normalizedPrefix}`

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

function deriveErrorMessage(details: unknown, fallback = "Request failed") {
  if (!details) return fallback
  if (typeof details === "string") return details
  if (typeof details === "object") {
    const data = details as Record<string, unknown>
    if (typeof data.message === "string") return data.message
    if (typeof data.detail === "string") return data.detail
    if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(" ")
    const firstKey = Object.keys(data)[0]
    const firstValue = firstKey ? data[firstKey] : undefined
    if (Array.isArray(firstValue)) return (firstValue as string[]).join(" ")
    if (typeof firstValue === "string") return firstValue
  }
  return fallback
}

function toApiErrorFromException(error: unknown): ApiError {
  if (error instanceof TypeError) {
    return {
      message: `Network error. Unable to reach API at ${API_BASE_URL}. Check that the server is running and accessible from this origin.`,
      status: 0,
      details: error,
    }
  }
  const errMessage = (error as { message?: string })?.message ?? "Request failed unexpectedly"
  return { message: errMessage, status: 0, details: error }
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type")
  const isJson = contentType?.includes("application/json")
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null)
  if (!response.ok) {
    const error: ApiError = {
      status: response.status,
      message: deriveErrorMessage(payload, `Request failed with status ${response.status}`),
      details: payload,
    }
    throw error
  }
  return payload
}

export async function refreshAccessToken(refreshToken: string) {
  let response: Response
  try {
    response = await fetch(buildUrl("/auth/token/refresh/"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
  } catch (error) {
    throw toApiErrorFromException(error)
  }
  const data = await parseResponse(response)
  return {
    access: (data as Record<string, string>).access,
    refresh: ((data as Record<string, string>).refresh ?? refreshToken) as string,
  }
}

export async function request<T = unknown>(path: string, options: ApiRequestInit = {}): Promise<T> {
  const { authToken, refreshToken, onTokenRefreshed, data, ...fetchOptions } = options
  const headers = new Headers(fetchOptions.headers ?? {})
  headers.set("Accept", "application/json")
  const body = fetchOptions.body ?? (data ? JSON.stringify(data) : undefined)
  if (!(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`)
  }

  const makeRequest = () =>
    fetch(buildUrl(path), {
      ...fetchOptions,
      headers,
      body,
    })

  let response: Response

  try {
    response = await makeRequest()
  } catch (error) {
    throw toApiErrorFromException(error)
  }

  if (response.status === 401 && refreshToken) {
    try {
      const newTokens = await refreshAccessToken(refreshToken)
      onTokenRefreshed?.(newTokens)
      headers.set("Authorization", `Bearer ${newTokens.access}`)
      response = await makeRequest()
    } catch (error) {
      throw toApiErrorFromException(error)
    }
  }

  return parseResponse(response)
}

function humanizeKey(key: string) {
  if (!key) return ""
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatApiError(error: unknown, fallback = "Something went wrong. Please try again."): string {
  const apiError = error as Partial<ApiError>
  const messages: string[] = []

  const details = apiError?.details
  if (details) {
    if (typeof details === "string") {
      messages.push(details)
    } else if (Array.isArray(details)) {
      messages.push(details.join(" "))
    } else if (typeof details === "object") {
      const detailObj = details as Record<string, unknown>
      Object.entries(detailObj).forEach(([key, value]) => {
        if (value == null) return
        if (Array.isArray(value)) {
          const joined = (value as unknown[]).map(String).join(" ")
          messages.push(key === "non_field_errors" ? joined : `${humanizeKey(key)}: ${joined}`)
        } else if (typeof value === "string") {
          messages.push(key === "non_field_errors" ? value : `${humanizeKey(key)}: ${value}`)
        }
      })
    }
  }

  if (apiError?.message) {
    messages.unshift(apiError.message)
  }

  const uniqueMessages = Array.from(new Set(messages.filter(Boolean)))
  if (uniqueMessages.length === 0) return fallback
  return uniqueMessages.join(" | ")
}
