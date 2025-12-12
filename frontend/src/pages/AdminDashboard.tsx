import { Gauge, ShieldCheck, Users } from "lucide-react"

import {
  studentProfile,
  teacherAssignments,
  teacherExamsCurrent,
  teacherExamsPast,
} from "@/data/mock-data"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { DashboardTopbar } from "@/components/layout/DashboardTopbar"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/shared/MetricCard"
import { SectionHeader } from "@/components/shared/SectionHeader"

export default function AdminDashboard() {
  const metrics = [
    { label: "Active roles", value: 3, helper: "Admin · Teacher · Student", tone: "accent" },
    { label: "Assignments", value: teacherAssignments.length, helper: "Teacher owned" },
    {
      label: "Exams in system",
      value: teacherExamsCurrent.length + teacherExamsPast.length,
      helper: "Current + past",
      tone: "success",
    },
  ]

  return (
    <DashboardShell
      gradient
      topbar={
        <DashboardTopbar
          role="Super Admin"
          userLabel="Preview Admin · ADM-001"
          meta="System snapshot only"
          showLogout
        />
      }
      sidebar={
        <SidebarNav
          title="Admin"
          helper="Preview only"
          items={[
            { label: "Overview", href: "#admin-overview", active: true },
            { label: "Data health", href: "#data-health" },
            { label: "Shortcuts", href: "#" },
          ]}
          chips={["Static preview", "Wire to Django later"]}
        />
      }
    >
      <section id="admin-overview" className="space-y-6">
        <SectionHeader
          eyebrow="Super Admin"
          title="Admin dashboard preview."
          description="This role was linked in the base template but not implemented. We added a minimal snapshot to avoid dead links."
          align="start"
        />
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              tone={metric.tone as any}
            />
          ))}
        </div>
      </section>

      <section id="data-health" className="space-y-4">
        <SectionHeader
          eyebrow="Status"
          title="Data health indicators."
          description="Replace these cards with live system checks when you wire the backend."
          align="start"
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-none bg-white/85 shadow-outline">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Auth shell</CardTitle>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Login, signup, and password reset represented as components.</p>
              <Badge variant="success">Ready</Badge>
            </CardContent>
          </Card>
          <Card className="border-none bg-white/85 shadow-outline">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Sample student ({studentProfile.name}) and teacher data stubbed in the UI.</p>
              <Badge variant="muted">Static</Badge>
            </CardContent>
          </Card>
          <Card className="border-none bg-white/85 shadow-outline">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Exam flow</CardTitle>
              <Gauge className="h-5 w-5 text-accent-foreground" />
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Teacher create/manage pages rebuilt with shadcn inputs and tables.</p>
              <Badge variant="accent">New</Badge>
            </CardContent>
          </Card>
        </div>
      </section>
    </DashboardShell>
  )
}
