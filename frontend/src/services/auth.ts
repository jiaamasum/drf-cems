import { request, type AuthTokens } from "@/lib/api-client"

export type UserRole = "student" | "teacher" | "admin" | "user"

export type LoginResponse = {
  access: string
  refresh: string
  message?: string
  user: {
    id: number
    username: string
    role: UserRole
    student_profile_id?: number | null
    teacher_profile_id?: number | null
  }
}

export type CurrentUserResponse = {
  id: number
  username: string
  email?: string
  roles: {
    student: boolean
    teacher: boolean
    admin: boolean
  }
  student_profile_id?: number | null
  teacher_profile_id?: number | null
  current_academic_year?: {
    id: number
    year: string
    is_current: boolean
  } | null
}

export type StudentRegistrationResponse = {
  access: string
  refresh: string
  message?: string
  user: {
    id: number
    username: string
    email?: string
  }
  student_profile?: {
    id: number
    user_id: number
    full_name?: string
  }
}

export async function login(payload: { username: string; password: string }) {
  return request<LoginResponse>("/auth/login/", {
    method: "POST",
    data: payload,
  })
}

export async function registerStudent(payload: {
  username: string
  email: string
  password1: string
  password2: string
  full_name?: string
}) {
  return request<StudentRegistrationResponse>("/auth/register/student/", {
    method: "POST",
    data: payload,
  })
}

export async function fetchCurrentUser(tokens: AuthTokens, onTokenRefreshed?: (tokens: AuthTokens) => void) {
  return request<CurrentUserResponse>("/auth/me/", {
    method: "GET",
    authToken: tokens.access,
    refreshToken: tokens.refresh,
    onTokenRefreshed,
  })
}

export async function requestPasswordReset(email: string) {
  return request<{ message?: string }>("/auth/password-reset/", {
    method: "POST",
    data: { email },
  })
}

export async function confirmPasswordReset(payload: {
  uid: string
  token: string
  new_password1: string
  new_password2: string
}) {
  return request<{ message?: string }>("/auth/password-reset/confirm/", {
    method: "POST",
    data: payload,
  })
}
