import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type DashboardShellProps = {
  topbar: ReactNode
  sidebar?: ReactNode
  children: ReactNode
  gradient?: boolean
}

export function DashboardShell({
  topbar,
  sidebar,
  children,
  gradient,
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100",
        gradient &&
          "bg-[radial-gradient(circle_at_10%_20%,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_82%_8%,rgba(16,185,129,0.16),transparent_26%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_35%,#f5fdfb_65%,#f8fafc_100%)]",
      )}
    >
      <header className="sticky top-0 z-40 border-b border-border/70 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-900/5">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-10">
          {topbar}
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-6 px-6 pb-16 pt-10 md:px-10">
        {sidebar && (
          <aside className="hidden w-64 shrink-0 lg:sticky lg:top-24 lg:block lg:self-start">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 space-y-10">{children}</main>
      </div>
    </div>
  )
}
