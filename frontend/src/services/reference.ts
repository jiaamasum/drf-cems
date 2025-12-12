import { request, type AuthTokens } from "@/lib/api-client"

export type AssignmentRef = {
  id: number
  academic_year: string
  class_offering: {
    id: number
    name: string
    level: string | null
  }
  subject: {
    id: number
    name: string
    code: string | null
  }
}

export async function fetchCurrentAssignments(
  tokens: AuthTokens,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
) {
  return request<{ results: AssignmentRef[] }>("/reference/assignments/current/", {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}
