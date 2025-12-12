import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { siteRoutes } from "@/data/mock-data"
import { TopNav } from "@/components/layout/TopNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionHeader } from "@/components/shared/SectionHeader"

const featureCards = [
  {
    title: "Super Admin",
    description:
      "Model academic years, classes, and permissions with guardrails for promotions and repeats.",
    tag: "Structure",
  },
  {
    title: "Teacher",
    description:
      "Own the classes you are assigned to, schedule exams, and publish marks with built-in limits.",
    tag: "Ownership",
  },
  {
    title: "Student",
    description:
      "Stay on top of upcoming exams, published marks, and historical roll numbers in one place.",
    tag: "Clarity",
  },
]

const dashboardCards = [
  {
    title: "Student dashboard",
    description:
      "Read-only view with enrollment context, upcoming exams, and class-year performance.",
    to: siteRoutes.studentDashboard,
    tone: "accent",
  },
  {
    title: "Teacher dashboard",
    description:
      "Assignments across academic years, exam creation, and per-student mark entry for your classes.",
    to: siteRoutes.teacherDashboard,
    tone: "primary",
  },
  {
    title: "Admin preview",
    description:
      "A light preview for administrators to see class-year readiness and data health at a glance.",
    to: (import.meta.env.VITE_ADMIN_PATH as string | undefined) ?? siteRoutes.adminDashboard,
    tone: "secondary",
  },
]

export default function HomePage() {
  return (
    <div className="page-shell">
      <TopNav transparent />
      <main className="content-shell">
        <section className="section-shell grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-semibold text-primary shadow-outline">
              <Sparkles className="h-4 w-4" />
              Fresh React build with shadcn/ui
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                A calmer Class & Exam workspace, rebuilt with React.
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Every template is now a reusable component. Auth flows, dashboards, and exam
                management ship together with modern theming.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link to={siteRoutes.signup} className="inline-flex items-center gap-2">
                  Create account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link to={siteRoutes.login}>Login</Link>
              </Button>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="accent">Role-aware redirects</Badge>
                <Badge variant="muted">Static dashboards</Badge>
                <Badge variant="success">Password reset flow</Badge>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-accent/20 blur-2xl" />
            <div className="absolute right-0 top-20 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
            <div className="space-y-4 rounded-3xl border border-border/80 bg-white/80 p-6 shadow-glass backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Live overview</p>
                  <p className="text-2xl font-semibold text-slate-900">CEMS React</p>
                </div>
                <Badge variant="success">Stable</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Card className="border-none bg-secondary/70">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-muted-foreground">Dashboards</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-2xl font-semibold">3</p>
                    <p className="text-xs text-muted-foreground">Admin, Teacher, Student</p>
                  </CardContent>
                </Card>
                <Card className="border-none bg-secondary/70">
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-xs text-muted-foreground">Reset flow</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <p className="text-2xl font-semibold">End-to-end</p>
                    <p className="text-xs text-muted-foreground">Email + confirm + complete</p>
                  </CardContent>
                </Card>
              </div>
              <div className="rounded-2xl border border-border/70 bg-slate-900 px-5 py-4 text-white shadow-glass">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold">Authentication shell only</p>
                    <p className="text-xs text-slate-200/70">
                      Safe defaults, password reset flow, static dashboards ready for data.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white/10 px-3 py-1">Role aware</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Re-usable components</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">Shadcn UI</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-shell">
          <SectionHeader
            eyebrow="Why this build"
            title="Built from the templates, now ready for React."
            description="Every legacy template was mapped to a modern route. We kept the information architecture, but refreshed the layout and styling."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {featureCards.map((feature) => (
              <Card
                key={feature.title}
                className="h-full border-none bg-white/90 shadow-glass transition hover:-translate-y-1"
              >
                <CardHeader>
                  <Badge variant="muted" className="w-fit">
                    {feature.tag}
                  </Badge>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <SectionHeader
            eyebrow="Dashboards"
            title="Three purpose-built spaces."
            description="Jump into any role and see how the flows look in the new React + Vite + shadcn UI build."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {dashboardCards.map((card) => (
              <Card
                key={card.title}
                className="flex h-full flex-col border border-border/80 bg-white/80 shadow-outline transition hover:-translate-y-1 hover:shadow-glass"
              >
                <CardHeader>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </CardHeader>
                <CardContent className="mt-auto flex items-center justify-between">
                  <Badge variant={card.tone === "accent" ? "accent" : "primary"} className="mr-3">
                    {card.tone === "secondary" ? "Preview" : "Open"}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={card.to} className="inline-flex items-center gap-2">
                      View
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="section-shell">
          <Card className="flex flex-col gap-4 border-none bg-gradient-to-r from-primary/10 via-accent/10 to-secondary p-8 shadow-glass md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="eyebrow">Get started</p>
              <h3 className="text-2xl font-semibold text-slate-900">
                Login or create an account to preview each role.
              </h3>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Authentication and password reset flows are wired in the UI; dashboards are static,
                ready for your data layer.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to={siteRoutes.signup}>Sign up</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to={siteRoutes.login}>Login</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </div>
  )
}
