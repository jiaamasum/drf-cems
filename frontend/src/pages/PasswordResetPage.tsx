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

export default function PasswordResetPage() {
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { requestPasswordReset } = useAuth()
  const { showToast } = useToast()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = (formData.get("email") as string) ?? ""
    if (!email) {
      setError("Please add the email tied to the account.")
      return
    }
    setIsSubmitting(true)
    setError("")
    requestPasswordReset(email)
      .then(() => {
        showToast({
          title: "Reset link sent",
          description: "If the email exists, a reset link is on its way.",
          variant: "success",
        })
        navigate(siteRoutes.passwordResetDone)
      })
      .catch((err: unknown) => {
        const message = formatApiError(
          err,
          "Could not start password reset. Check your email and try again.",
        )
        setError(message)
        showToast({
          title: "Reset failed",
          description: message,
          variant: "error",
        })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Request a reset link"
      description="Enter your account email. If it matches, we will send a reset link. This UI mirrors the template while staying reusable."
      pill="Reset"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="primary">Secure</Badge>
            <span className="text-xs text-muted-foreground">Email verification only</span>
          </div>
          <CardTitle className="text-xl">Reset password</CardTitle>
          <CardDescription>
            We will send a link if the email exists. That link opens the confirm page below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="you@school.edu" />
            </div>
            <p className="text-sm text-muted-foreground">
              We only confirm that an email exists after processing. No hints are leaked on this UI.
            </p>
            <div className="flex items-center justify-between gap-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send reset link"}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              <Link to={siteRoutes.login} className="font-semibold text-primary">
                Return to login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
