import type { AuthTokens } from "@/lib/api-client"

const STORAGE_KEY = "cems.auth"

export function loadTokens(): AuthTokens | null {
  if (typeof localStorage === "undefined") return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<AuthTokens>
    if (parsed.access && parsed.refresh) {
      return { access: parsed.access, refresh: parsed.refresh }
    }
  } catch (error) {
    console.warn("Failed to parse stored tokens", error)
  }
  return null
}

export function saveTokens(tokens: AuthTokens) {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function clearTokens() {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
