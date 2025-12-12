import { LogOut, Sparkles } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { siteRoutes } from "@/data/mock-data"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TopNavProps = {
  transparent?: boolean
}

export function TopNav({ transparent }: TopNavProps) {
  const navigate = useNavigate()
  const { user, logout, getDashboardPath, isExternalPath } = useAuth()
  const { showToast } = useToast()

  const dashboardHref = user ? getDashboardPath(user) : siteRoutes.home
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

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/70 backdrop-blur-md",
        transparent
          ? "bg-white/30"
          : "bg-white/85 shadow-lg shadow-slate-900/5",
      )}
    >
      <div className="content-shell flex h-16 items-center justify-between gap-6">
        <Link to={siteRoutes.home} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-sm">CEMS React</p>
            <p className="text-xs text-muted-foreground">Class & Exam Hub</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button
                asChild={!dashboardIsExternal}
                variant="ghost"
                className="inline-flex"
              >
                {dashboardIsExternal ? (
                  <a href={dashboardHref} className="font-semibold">
                    Dashboard
                  </a>
                ) : (
                  <Link to={getDashboardPath()} className="font-semibold">
                    Dashboard
                  </Link>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout} className="inline-flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to={siteRoutes.login}>Login</Link>
              </Button>
              <Button asChild className="inline-flex">
                <Link to={siteRoutes.signup}>Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
