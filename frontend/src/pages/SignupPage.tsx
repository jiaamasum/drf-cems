import { useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

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

export default function SignupPage() {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { signupStudent, getDashboardPath, isExternalPath } = useAuth()
  const { showToast } = useToast()

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const fullName = (formData.get("full_name") as string) ?? ""
    const username = (formData.get("username") as string) ?? ""
    const email = (formData.get("email") as string) ?? ""
    const password = (formData.get("password") as string) ?? ""
    const confirm = (formData.get("confirm_password") as string) ?? ""
    if (!username || !email || !password || !confirm) {
      setMessage("Please complete all fields.")
      return
    }
    if (!isValidEmail(email)) {
      setMessage("Enter a valid email address (e.g., user@example.com).")
      return
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.")
      return
    }
    if (password && confirm && password !== confirm) {
      setMessage("Passwords do not match.")
      return
    }
    setIsSubmitting(true)
    setMessage("")
    signupStudent({
      username,
      full_name: fullName,
      email,
      password1: password,
      password2: confirm,
    })
      .then((authUser) => {
        const destination = getDashboardPath(authUser)
        showToast({
          title: "Registration successful",
          description: fullName ? `${fullName}, your student account is ready.` : "Your student account is ready.",
          variant: "success",
        })
        if (isExternalPath(destination)) {
          window.location.href = destination
          return
        }
        navigate(destination, { replace: true })
      })
      .catch((err: unknown) => {
        const errorMessage = formatApiError(
          err,
          "We could not create your account right now. Please try again or contact support.",
        )
        setMessage(errorMessage)
        showToast({
          title: "Registration failed",
          description: errorMessage,
          variant: "error",
        })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <AuthShell
      eyebrow="Onboarding"
      title="Create your CEMS account"
      description="Student-first onboarding with lightweight validation. Extend this component for teachers or admins."
      pill="Signup"
      accent="accent"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent">New user</Badge>
            <span className="text-xs text-muted-foreground">Student-focused preview</span>
          </div>
          <CardTitle className="text-xl">Sign up</CardTitle>
          <CardDescription>
            Capture the basics now. Add additional profile fields as you wire your backend.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          )}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" name="full_name" placeholder="Aisha Rahman" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" placeholder="amira.k" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@school.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="••••••••"
              />
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </form>
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to={siteRoutes.login} className="font-semibold text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
