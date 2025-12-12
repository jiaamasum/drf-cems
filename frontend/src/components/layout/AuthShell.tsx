import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

import { TopNav } from "@/components/layout/TopNav"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AuthShellProps = {
  eyebrow?: string
  title: string
  description?: string
  children: ReactNode
  pill?: string
  accent?: "primary" | "accent"
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  pill,
  accent = "primary",
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <TopNav />
      <main className="content-shell grid gap-10 pb-14 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-white/70 p-8 shadow-glass">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute right-4 top-10 h-24 w-24 rounded-full bg-accent/15 blur-2xl" />
          <div className="relative space-y-4">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{title}</h1>
            {description && (
              <p className="max-w-xl text-base text-muted-foreground">{description}</p>
            )}
            <div className="flex flex-wrap gap-3 pt-2 text-sm text-muted-foreground">
              <Badge variant="accent">Role aware</Badge>
              <Badge variant="muted">Secure defaults</Badge>
              <Badge variant="primary">Shadcn UI</Badge>
            </div>
            <Card className="mt-4 border-none bg-slate-900 text-white shadow-glass">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-white shadow-glass",
                    accent === "primary" ? "bg-primary" : "bg-accent",
                  )}
                >
                  <ArrowUpRight className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">UI preview</p>
                  <p className="text-xs text-slate-200/70">No backend wiring yet</p>
                </div>
              </div>
              <div className="space-y-2 px-5 py-4 text-sm text-slate-200/90">
                <p>All auth states are represented: login, signup, reset, confirm, and done.</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-3 py-1">Static previews</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Form validation copy</span>
                  {pill && <span className="rounded-full bg-white/10 px-3 py-1">{pill}</span>}
                </div>
              </div>
            </Card>
          </div>
        </div>

        <div className="relative z-10 flex items-start justify-center">
          <div className="w-full max-w-lg">{children}</div>
        </div>
      </main>
    </div>
  )
}
