import { Link } from "react-router-dom"

import { siteRoutes } from "@/data/mock-data"
import { AuthShell } from "@/components/layout/AuthShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PasswordResetComplete() {
  return (
    <AuthShell
      eyebrow="Password reset"
      title="Password updated"
      description="We landed where the template ends: a gentle confirmation with a single call to action back to login."
      pill="Done"
    >
      <Card className="border border-border/80 bg-white/90 shadow-glass">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="success">Complete</Badge>
            <span className="text-xs text-muted-foreground">You can now sign in</span>
          </div>
          <CardTitle className="text-xl">Password updated</CardTitle>
          <CardDescription>
            Your password was changed successfully. Jump back to the login page to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button asChild className="w-full">
            <Link to={siteRoutes.login}>Go to login</Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Need to start over? You can always request another reset link from the password reset
            page.
          </p>
        </CardContent>
      </Card>
    </AuthShell>
  )
}
