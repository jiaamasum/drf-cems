import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import type { AuthTokens } from "@/lib/api-client"
import { clearTokens, loadTokens, saveTokens } from "@/lib/token-storage"
import type {
  CurrentUserResponse,
  LoginResponse,
  StudentRegistrationResponse,
  UserRole,
} from "@/services/auth"
import {
  confirmPasswordReset,
  fetchCurrentUser,
  login as loginApi,
  registerStudent,
  requestPasswordReset,
} from "@/services/auth"
import { siteRoutes } from "@/data/mock-data"

type Role = UserRole

export type AuthUser = {
  id: number
  username: string
  email?: string
  role: Role
  roles: {
    student: boolean
    teacher: boolean
    admin: boolean
  }
  student_profile_id?: number | null
  teacher_profile_id?: number | null
}

type AuthContextValue = {
  user: AuthUser | null
  tokens: AuthTokens | null
  isLoading: boolean
  login: (payload: { username: string; password: string }) => Promise<AuthUser>
  signupStudent: (payload: {
    username: string
    full_name?: string
    email: string
    password1: string
    password2: string
  }) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => Promise<void>
  hasRole: (role: RoleKey) => boolean
  getDashboardPath: (forUser?: AuthUser | null) => string
  isExternalPath: (path: string) => boolean
  canAccessRoute: (path: string, candidateUser?: AuthUser | null) => boolean
  updateTokens: (tokens: AuthTokens) => void
  requestPasswordReset: (email: string) => Promise<void>
  confirmPasswordReset: (payload: { uid: string; token: string; new_password1: string; new_password2: string }) => Promise<void>
}

type RoleKey = keyof AuthUser["roles"]

function normalizeAdminPath(path: string | undefined) {
  if (!path) return "/admin/"
  const trimmed = path.trim()
  if (!trimmed) return "/admin/"
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) {
    return trimmed.replace(/\/+$/, "/")
  }
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`
}

const ADMIN_PORTAL_PATH = normalizeAdminPath(import.meta.env.VITE_ADMIN_PATH as string | undefined)

const protectedRouteRoles: Record<string, RoleKey[]> = {
  [siteRoutes.studentDashboard]: ["student", "admin"],
  [siteRoutes.teacherDashboard]: ["teacher", "admin"],
  [siteRoutes.teacherExamCreate]: ["teacher", "admin"],
  [siteRoutes.teacherExamManage]: ["teacher", "admin"],
  [siteRoutes.adminDashboard]: ["admin"],
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function deriveRoleFromFlags(roles: AuthUser["roles"], fallback: Role = "user"): Role {
  if (roles.admin) return "admin"
  if (roles.teacher) return "teacher"
  if (roles.student) return "student"
  return fallback
}

function mapLoginUser(user: LoginResponse["user"]): AuthUser {
  const roles = {
    student: user.role === "student",
    teacher: user.role === "teacher",
    admin: user.role === "admin",
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    roles,
    student_profile_id: user.student_profile_id ?? null,
    teacher_profile_id: user.teacher_profile_id ?? null,
  }
}

function mapCurrentUser(payload: CurrentUserResponse): AuthUser {
  const roles = payload.roles
  return {
    id: payload.id,
    username: payload.username,
    email: payload.email,
    role: deriveRoleFromFlags(roles),
    roles,
    student_profile_id: payload.student_profile_id ?? null,
    teacher_profile_id: payload.teacher_profile_id ?? null,
  }
}

function mapRegistrationUser(payload: StudentRegistrationResponse): AuthUser {
  return {
    id: payload.user.id,
    username: payload.user.username,
    email: payload.user.email,
    role: "student",
    roles: { student: true, teacher: false, admin: false },
    student_profile_id: payload.student_profile?.id ?? null,
    teacher_profile_id: null,
  }
}

const initialTokens = loadTokens()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(initialTokens)
  const [isLoading, setIsLoading] = useState(Boolean(initialTokens))

  const persistTokens = useCallback((nextTokens: AuthTokens) => {
    setTokens(nextTokens)
    saveTokens(nextTokens)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTokens(null)
    setIsLoading(false)
    clearTokens()
  }, [])

  const loadUser = useCallback(
    async (activeTokens?: AuthTokens | null) => {
      setIsLoading(true)
      const currentTokens = activeTokens ?? tokens
      if (!currentTokens?.access) {
        setIsLoading(false)
        return
      }
      try {
        const profile = await fetchCurrentUser(currentTokens, persistTokens)
        setUser(mapCurrentUser(profile))
      } catch (error) {
        logout()
      } finally {
        setIsLoading(false)
      }
    },
    [tokens, persistTokens, logout],
  )

  useEffect(() => {
    if (initialTokens) {
      loadUser(initialTokens)
    } else {
      setIsLoading(false)
    }
  }, [loadUser])

  const login = useCallback(
    async (payload: { username: string; password: string }) => {
      const result = await loginApi(payload)
      const nextTokens = { access: result.access, refresh: result.refresh }
      persistTokens(nextTokens)
      const mappedUser = mapLoginUser(result.user)
      setUser(mappedUser)
      loadUser(nextTokens).catch(() => undefined)
      return mappedUser
    },
    [persistTokens, loadUser],
  )

  const signupStudent = useCallback(
    async (payload: { username: string; full_name?: string; email: string; password1: string; password2: string }) => {
      const result = await registerStudent(payload)
      const nextTokens = { access: result.access, refresh: result.refresh }
      persistTokens(nextTokens)
      const mappedUser = mapRegistrationUser(result)
      setUser(mappedUser)
      return mappedUser
    },
    [persistTokens],
  )

  const hasRole = useCallback(
    (role: RoleKey) => {
      if (!user) return false
      return Boolean(user.roles[role])
    },
    [user],
  )

  const getDashboardPath = useCallback(
    (forUser?: AuthUser | null) => {
      const subject = forUser ?? user
      if (!subject) return siteRoutes.home
      if (subject.roles.admin) return ADMIN_PORTAL_PATH
      if (subject.roles.teacher) return siteRoutes.teacherDashboard
      if (subject.roles.student) return siteRoutes.studentDashboard
      return siteRoutes.home
    },
    [user],
  )

  const isExternalPath = useCallback((path: string) => {
    if (!path) return false
    const normalized = path.toLowerCase()
    if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("//")) {
      return true
    }
    const adminPrefix = ADMIN_PORTAL_PATH.toLowerCase()
    if (adminPrefix && normalized.startsWith(adminPrefix)) return true
    return false
  }, [])

  const canAccessRoute = useCallback(
    (path: string, candidateUser?: AuthUser | null) => {
      const subject = candidateUser ?? user
      const allowedRoles = protectedRouteRoles[path]
      if (!allowedRoles) return true
      if (!subject) return false
      return allowedRoles.some((role) => subject.roles[role])
    },
    [user],
  )

  const refreshUser = useCallback(async () => loadUser(), [loadUser])

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      tokens,
      isLoading,
      login,
      signupStudent,
      logout,
      refreshUser,
      hasRole,
      getDashboardPath,
      isExternalPath,
      canAccessRoute,
      updateTokens: persistTokens,
      requestPasswordReset: async (email: string) => {
        await requestPasswordReset(email)
      },
      confirmPasswordReset: async (payload: {
        uid: string
        token: string
        new_password1: string
        new_password2: string
      }) => {
        await confirmPasswordReset(payload)
      },
    }),
    [
      user,
      tokens,
      isLoading,
      login,
      signupStudent,
      logout,
      refreshUser,
      hasRole,
      getDashboardPath,
      canAccessRoute,
      isExternalPath,
      persistTokens,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export { protectedRouteRoles }
