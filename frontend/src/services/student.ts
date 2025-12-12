import { request, type AuthTokens } from "@/lib/api-client"

export type Paginated<T> = {
  count?: number
  next?: string | null
  previous?: string | null
  results: T[]
  message?: string
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return ""
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    search.append(key, String(value))
  })
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

export type StudentDashboardResponse = {
  profile: {
    id: number
    user_id: number
    username: string
    full_name: string
    student_id: string
  }
  enrollment: {
    id: number
    academic_year: string
    class_offering: {
      id: number
      name: string
      level: string | null
    }
    roll_number: number | null
    student_id: string
    grade?: string | null
  } | null
  subjects: Array<{ id: number; name: string; code: string | null }>
  upcoming_exams: Paginated<{
    id: number
    title: string
    subject: string
    date: string
    max_marks: number
  }>
  marks: Paginated<{
    exam_id: number
    exam_title: string
    subject: string
    date: string
    marks_obtained: number
    max_marks: number
    highest_mark?: number | null
    lowest_mark?: number | null
  }>
  current_grade: string | null
  history: Paginated<{
    academic_year: string
    class_name: string
    roll_number: number | null
    total_exams: number | null
    overall_percent: number | null
    overall_grade: string | null
    subjects: Array<{
      id: number
      name: string
      code: string | null
      percent: number | null
      grade: string | null
    }>
  }>
  message?: string
}

export async function fetchStudentDashboard(
  tokens: AuthTokens,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
  params?: {
    year?: string
    upcoming_page?: number
    upcoming_page_size?: number
    marks_page?: number
    marks_page_size?: number
    history_page?: number
    history_page_size?: number
  },
) {
  const search = buildQuery(params)
  return request<StudentDashboardResponse>(`/student/dashboard/${search}`, {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}
