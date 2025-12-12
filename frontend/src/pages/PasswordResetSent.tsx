import { Link } from "react-router-dom"

import { siteRoutes } from "@/data/mock-data"
import { AuthShell } from "@/components/layout/AuthShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PasswordResetSent() {
  return (
    <AuthShell
      eyebrow="Password reset"
      title="Reset link sent"
      description="If the address exists, we emailed a password reset link. Follow it to set a new password."
      pill="Email sent"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="accent">Reset link</Badge>
            <span className="text-xs text-muted-foreground">Next: Confirm</span>
          </div>
          <CardTitle className="text-xl">Check your email</CardTitle>
          <CardDescription>
            We never confirm whether an email exists. If it does, the link will be active for a
            short window.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The link will take you to the confirm page in this build. Use the controls there to
            preview valid vs. expired behavior.
          </p>
          <Button asChild className="w-full">
            <Link to={siteRoutes.login}>Return to login</Link>
          </Button>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
