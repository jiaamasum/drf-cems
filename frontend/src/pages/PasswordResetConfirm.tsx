import { useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"

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

export default function PasswordResetConfirm() {
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const params = useParams()
  const [searchParams] = useSearchParams()
  const { confirmPasswordReset } = useAuth()
  const { showToast } = useToast()

  const uid = useMemo(
    () => params.uid || searchParams.get("uid") || "",
    [params.uid, searchParams],
  )
  const token = useMemo(
    () => params.token || searchParams.get("token") || "",
    [params.token, searchParams],
  )
  const validLink = Boolean(uid && token)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validLink) {
      setMessage("This reset link is invalid or expired. Request a new one to continue.")
      return
    }
    const formData = new FormData(event.currentTarget)
    const newPass = (formData.get("new_password1") as string) ?? ""
    const confirm = (formData.get("new_password2") as string) ?? ""
    if (newPass.length < 8) {
      setMessage("Password must be at least 8 characters.")
      return
    }
    if (newPass && confirm && newPass !== confirm) {
      setMessage("Passwords must match.")
      return
    }
    setIsSubmitting(true)
    setMessage("")
    confirmPasswordReset({
      uid,
      token,
      new_password1: newPass,
      new_password2: confirm,
    })
      .then(() => {
        showToast({
          title: "Password updated",
          description: "Your password has been reset successfully.",
          variant: "success",
        })
        navigate(siteRoutes.login, { replace: true })
      })
      .catch((err: unknown) => {
        const errorMessage = formatApiError(
          err,
          "This reset link is invalid or has expired. Request a new one.",
        )
        setMessage(errorMessage)
        showToast({
          title: "Reset failed",
          description: errorMessage,
          variant: "error",
        })
      })
      .finally(() => setIsSubmitting(false))
  }

  return (
    <AuthShell
      eyebrow="Password reset"
      title="Choose a new password"
      description="In the Django templates this page toggled on validlink. Here we mirror both valid and expired states."
      pill="Confirm"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant={validLink ? "primary" : "muted"}>
              {validLink ? "Valid link" : "Expired"}
            </Badge>
          </div>
          <CardTitle className="text-xl">Set a new password</CardTitle>
          <CardDescription>
            Paste in the link you received. If it is invalid or expired, request a new reset link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <p className="rounded-md bg-secondary px-3 py-2 text-sm text-muted-foreground">
              {message}
            </p>
          )}
          {validLink ? (
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="new_password1">New password</Label>
                <Input id="new_password1" name="new_password1" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password2">Confirm password</Label>
                <Input id="new_password2" name="new_password2" type="password" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save new password"}
                </Button>
                <Link to={siteRoutes.login} className="text-sm font-semibold text-primary">
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                This reset link is invalid or has expired. Request a new link to continue.
              </p>
              <Button variant="outline" asChild className="w-full">
                <Link to={siteRoutes.passwordReset}>Request new reset link</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthShell>
  )
}
