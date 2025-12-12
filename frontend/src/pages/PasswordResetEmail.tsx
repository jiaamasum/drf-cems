import { passwordResetEmail, siteRoutes } from "@/data/mock-data"
import { AuthShell } from "@/components/layout/AuthShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PasswordResetEmail() {
  const resetUrl = `${passwordResetEmail.protocol}://${passwordResetEmail.domain}${siteRoutes.passwordResetConfirm}?uid=${passwordResetEmail.uid}&token=${passwordResetEmail.token}`

  return (
    <AuthShell
      eyebrow="Email template"
      title="Password reset email preview"
      description="The original template lived in registration/password_reset_email.html. Here it is rendered as a readable preview."
      pill="Email"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Badge variant="muted">Plain text</Badge>
            <CardTitle className="mt-3 text-xl">Outbound email</CardTitle>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(resetUrl)}>
            Copy link
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-secondary/70 p-4 text-sm text-muted-foreground">
            <p>
              You're receiving this email because you requested a password reset for your account at{" "}
              {passwordResetEmail.siteName}.
            </p>
            <p className="mt-3 font-semibold text-foreground">Please go to the following page:</p>
            <p className="mt-1 break-all text-primary">{resetUrl}</p>
            <p className="mt-3">
              In case you've forgotten, your username is{" "}
              <span className="font-semibold text-foreground">
                {passwordResetEmail.userName}
              </span>
              .
            </p>
            <p className="mt-3">Thanks for using our site!</p>
          </div>
          <div className="rounded-lg border border-dashed border-border/80 bg-secondary/60 p-3 text-xs text-muted-foreground">
            This mirrors the Django template output. Swap in your own email delivery service and
            variables when wiring the backend.
          </div>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
