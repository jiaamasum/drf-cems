import { request, type AuthTokens } from "@/lib/api-client"

export type PaginatedResponse<T> = {
  count?: number
  next?: string | null
  previous?: string | null
  results: T[]
  message?: string
}

function buildQuery(params?: Record<string, string | number | undefined>) {
  if (!params) return ""
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    query.append(key, String(value))
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ""
}

export type TeacherDashboardResponse = {
  teacher_profile: {
    id: number
    user_id: number
    full_name: string | null
    employee_code: string | null
    username: string
  }
  assignments: Array<{
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
    student_count: number
  }>
  current_exams: Array<{
    id: number
    title: string
    date: string
    status: string
  }>
  past_exams: Array<{
    id: number
    title: string
    date: string
  }>
  subject_count: number
  current_year: { id: number; year: string } | null
  message?: string
}

export async function fetchTeacherDashboard(
  tokens: AuthTokens,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
) {
  return request<TeacherDashboardResponse>("/teacher/dashboard/", {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}

export type TeacherExam = {
  id: number
  title: string
  date: string
  max_marks: number
  status: string
  class?: string
  subject?: string
  academic_year?: string
}

export type TeacherClassRef = {
  class_offering_id: number
  class_name: string
  academic_year: string
  exam_count: number
}

export async function fetchTeacherClasses(
  tokens: AuthTokens,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
  params?: { page?: number; page_size?: number },
) {
  const query = buildQuery(params)
  return request<PaginatedResponse<TeacherClassRef>>(`/teacher/classes/${query}`, {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}

export async function fetchTeacherClassExams(
  tokens: AuthTokens,
  classOfferingId: number,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
  params?: { page?: number; page_size?: number },
) {
  const query = buildQuery(params)
  return request<PaginatedResponse<TeacherExam>>(
    `/teacher/classes/${classOfferingId}/exams/${query}`,
    {
      method: "GET",
      authToken: tokens.access,
      refreshToken: tokens.refresh,
      onTokenRefreshed,
    },
  )
}

export async function fetchTeacherExams(
  tokens: AuthTokens,
  params?: { year?: string; page?: number; page_size?: number },
  onTokenRefreshed?: (tokens: AuthTokens) => void,
) {
  const search = buildQuery(params)
  return request<PaginatedResponse<TeacherExam>>(`/teacher/exams/${search}`, {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}

export async function createTeacherExam(
  tokens: AuthTokens,
  payload: { assignment_id: number; title: string; date: string; max_marks: number; status?: string },
  onTokenRefreshed?: (tokens: AuthTokens) => void,
) {
  return request<{
    id: number
    assignment_id: number
    title: string
    date: string
    max_marks: number
    status: string
    created_by: number
    academic_year: string
  }>("/teacher/exams/", {
    method: "POST",
    data: payload,
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}

export type ExamDetail = {
  exam: {
    id: number
    title: string
    date: string
    max_marks: number
    status: string
    assignment: {
      id: number
      class_offering: string
      subject: string
    }
  }
  allow_edit: boolean
  read_only: boolean
  roster: Array<{
    student_enrollment_id: number
    student_name: string
    student_id: string
    roll: string | number | null
    existing_mark: number | null
  }>
}

export async function fetchTeacherExamDetail(
  tokens: AuthTokens,
  examId: number,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
) {
  return request<ExamDetail>(`/teacher/exams/${examId}/`, {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}

export async function saveExamMarks(
  tokens: AuthTokens,
  examId: number,
  marks: Array<{ student_enrollment_id: number; marks_obtained: number }>,
  onTokenRefreshed?: (tokens: AuthTokens) => void,
) {
  return request<{ saved: number; message?: string }>(`/teacher/exams/${examId}/marks/`, {
    method: "POST",
    data: { marks },
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}
