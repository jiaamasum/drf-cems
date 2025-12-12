import { LogOut, Radio } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { siteRoutes } from "@/data/mock-data"

type DashboardTopbarProps = {
  role: string
  userLabel: string
  meta?: string
  showLogout?: boolean
}

export function DashboardTopbar({
  role,
  userLabel,
  meta,
  showLogout,
}: DashboardTopbarProps) {
  const { user, logout, getDashboardPath, isExternalPath } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const dashboardHref = getDashboardPath(user ?? undefined)
  const dashboardIsExternal = isExternalPath(dashboardHref)

  const onLogout = () => {
    logout()
    showToast({
      title: "Signed out",
      description: "You have been logged out.",
      variant: "info",
    })
    navigate(siteRoutes.home, { replace: true })
  }

  const label = user?.username ?? userLabel
  const metaLabel = meta ?? (user?.email ? `Logged in as ${user.email}` : undefined)

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/25">
          <Radio className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">CEMS React</p>
          <p className="text-xs text-muted-foreground">Live workspace</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="accent" className="hidden sm:inline-flex">
          {role}
        </Badge>
        <div className="text-sm">
          <p className="font-semibold text-foreground">{label}</p>
          {metaLabel && <p className="text-muted-foreground">{metaLabel}</p>}
        </div>
        {showLogout && (
          <div className="flex items-center gap-2">
            {dashboardIsExternal ? (
              <Button asChild variant="ghost" size="sm" className="inline-flex items-center gap-1">
                <a href={dashboardHref}>My dashboard</a>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(getDashboardPath())}
                className="inline-flex items-center gap-1"
              >
                My dashboard
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onLogout} className="inline-flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
