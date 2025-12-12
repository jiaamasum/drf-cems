import { useEffect, type ReactNode } from "react"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"

import { siteRoutes } from "@/data/mock-data"
import type { AuthUser } from "@/contexts/AuthContext"
import { useAuth } from "@/contexts/AuthContext"
import AdminDashboard from "@/pages/AdminDashboard"
import HomePage from "@/pages/HomePage"
import LoginPage from "@/pages/LoginPage"
import PasswordResetComplete from "@/pages/PasswordResetComplete"
import PasswordResetConfirm from "@/pages/PasswordResetConfirm"
import PasswordResetEmail from "@/pages/PasswordResetEmail"
import PasswordResetPage from "@/pages/PasswordResetPage"
import PasswordResetSent from "@/pages/PasswordResetSent"
import SignupPage from "@/pages/SignupPage"
import StudentDashboard from "@/pages/StudentDashboard"
import TeacherDashboard from "@/pages/TeacherDashboard"
import TeacherExamCreate from "@/pages/TeacherExamCreate"
import TeacherExamManage from "@/pages/TeacherExamManage"

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-muted-foreground">
      Checking authentication...
    </div>
  )
}

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.href = to
  }, [to])
  return <LoadingScreen />
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode
  allowedRoles?: Array<keyof AuthUser["roles"]>
}) {
  const { user, isLoading, getDashboardPath, isExternalPath } = useAuth()
  const location = useLocation()

  if (user) {
    if (allowedRoles?.length && !allowedRoles.some((role) => user.roles[role])) {
      const destination = getDashboardPath(user)
      if (isExternalPath(destination)) {
        return <ExternalRedirect to={destination} />
      }
      return <Navigate to={destination} replace />
    }
    return <>{children}</>
  }

  if (isLoading) return <LoadingScreen />
  return <Navigate to={siteRoutes.home} replace state={{ from: location.pathname }} />
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { user, getDashboardPath, isExternalPath } = useAuth()
  const location = useLocation()
  if (user) {
    const destination = getDashboardPath(user)
    if (isExternalPath(destination)) {
      return <ExternalRedirect to={destination} />
    }
    return <Navigate to={destination} replace state={{ from: location.pathname }} />
  }
  // While auth check is in flight, still render public content to avoid slow "checking authentication" screens.
  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path={siteRoutes.home} element={<HomePage />} />
      <Route
        path={siteRoutes.login}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={siteRoutes.signup}
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />

      <Route path={siteRoutes.passwordReset} element={<PasswordResetPage />} />
      <Route path={siteRoutes.passwordResetDone} element={<PasswordResetSent />} />
      <Route path={siteRoutes.passwordResetConfirm} element={<PasswordResetConfirm />} />
      <Route path="/password-reset/confirm/:uid/:token" element={<PasswordResetConfirm />} />
      <Route path={siteRoutes.passwordResetComplete} element={<PasswordResetComplete />} />
      <Route path={siteRoutes.passwordResetEmail} element={<PasswordResetEmail />} />

      <Route
        path={siteRoutes.studentDashboard}
        element={
          <ProtectedRoute allowedRoles={["student", "admin"]}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={siteRoutes.teacherDashboard}
        element={
          <ProtectedRoute allowedRoles={["teacher", "admin"]}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path={siteRoutes.teacherExamCreate}
        element={
          <ProtectedRoute allowedRoles={["teacher", "admin"]}>
            <TeacherExamCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path={siteRoutes.teacherExamManage}
        element={
          <ProtectedRoute allowedRoles={["teacher", "admin"]}>
            <TeacherExamManage />
          </ProtectedRoute>
        }
      />
      <Route
        path={siteRoutes.adminDashboard}
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={siteRoutes.home} replace />} />
    </Routes>
  )
}

export default App
