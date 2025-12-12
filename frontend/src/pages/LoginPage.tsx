import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { siteRoutes } from "@/data/mock-data"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { formatApiError } from "@/lib/api-client"
import { AuthShell } from "@/components/layout/AuthShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, getDashboardPath, canAccessRoute, isExternalPath } = useAuth()
  const { showToast } = useToast()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = (formData.get("username") as string) ?? ""
    const password = (formData.get("password") as string) ?? ""
    if (!username || !password) {
      setError("Enter both fields to continue.")
      return
    }
    setIsSubmitting(true)
    setError("")
    login({ username, password })
      .then((authUser) => {
        const state = location.state as { from?: string } | null
        const requestedPath = state?.from
        const destination =
          requestedPath && canAccessRoute(requestedPath, authUser)
            ? requestedPath
            : getDashboardPath(authUser)
        showToast({
          title: "Login successful",
          description: `Welcome back, ${authUser.username}.`,
          variant: "success",
        })
        if (isExternalPath(destination)) {
          window.location.href = destination
          return
        }
        navigate(destination, { replace: true })
      })
      .catch((err: unknown) => {
        const message = formatApiError(err, "Unable to login. Please check your credentials or try again.")
        setError(message)
        showToast({
          title: "Login failed",
          description: message,
          variant: "error",
        })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <AuthShell
      eyebrow="Authentication"
      title="Login to CEMS"
      description="Secure, role-aware authentication. Redirect users to their dashboards once you connect the backend."
      pill="Login + reset"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary">Secure</Badge>
            <span className="text-xs text-muted-foreground">
              Super Admin, Teacher, Student
            </span>
          </div>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Use your email or username to access the workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="username">Email or username</Label>
              <Input id="username" name="username" placeholder="you@school.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" />
            </div>
            <div className="flex items-center justify-between text-sm">
              <Link to={siteRoutes.passwordReset} className="font-semibold text-primary">
                Forgot password?
              </Link>
            </div>
            <Button className="w-full" type="submit">
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            New here?{" "}
            <Link to={siteRoutes.signup} className="font-semibold text-primary">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
