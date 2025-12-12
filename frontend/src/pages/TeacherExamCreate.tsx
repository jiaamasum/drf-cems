import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate } from "react-router-dom"

import { DashboardShell } from "@/components/layout/DashboardShell"
import { DashboardTopbar } from "@/components/layout/DashboardTopbar"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { siteRoutes } from "@/data/mock-data"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { formatApiError } from "@/lib/api-client"
import { createTeacherExam, fetchTeacherExams } from "@/services/teacher"
import { fetchCurrentAssignments, type AssignmentRef } from "@/services/reference"

type FormState = {
  assignment_id: string
  title: string
  date: string
  max_marks: number
}

export default function TeacherExamCreate() {
  const { tokens, updateTokens } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState<AssignmentRef[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const [form, setForm] = useState<FormState>({
    assignment_id: "",
    title: "",
    date: today,
    max_marks: 100,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!tokens) return
    setLoading(true)
    fetchCurrentAssignments(tokens, updateTokens)
      .then((res) => {
        setAssignments(res.results ?? [])
        setError("")
      })
      .catch((err) => {
        const message = formatApiError(err, "Unable to load assignments.")
        setError(message)
        showToast({ title: "Failed to load assignments", description: message, variant: "error" })
      })
      .finally(() => setLoading(false))
  }, [tokens, updateTokens, showToast])

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!tokens) {
      setError("You are not authenticated.")
      return
    }
    if (!form.assignment_id) {
      setError("Select an assignment.")
      return
    }
    if (!form.title || !form.date) {
      setError("Title and date are required.")
      return
    }
    if (form.date !== today) {
      setError("Exam date must be today (no future or past dates).")
      return
    }
    if (form.max_marks !== 100) {
      setError("Max marks is fixed at 100 per exam.")
      return
    }
    setSubmitting(true)
    setError("")
    createTeacherExam(
      tokens,
      {
        assignment_id: Number(form.assignment_id),
        title: form.title,
        date: form.date,
        max_marks: form.max_marks,
      },
      updateTokens,
    )
      .then(async (exam) => {
        showToast({
          title: "Exam created",
          description: `"${exam.title}" has been created.`,
          variant: "success",
        })
        // Refresh teacher exams in background
        try {
          await fetchTeacherExams(tokens, undefined, updateTokens)
        } catch (err) {
          // ignore background refresh errors
        }
        navigate(`${siteRoutes.teacherExamManage}?examId=${exam.id}`, { replace: true })
      })
      .catch((err) => {
        const message = formatApiError(err, "Could not create exam.")
        setError(message)
        showToast({ title: "Creation failed", description: message, variant: "error" })
      })
      .finally(() => setSubmitting(false))
  }

  const assignmentOptions = useMemo(
    () =>
      assignments.map((assignment) => ({
        value: assignment.id,
        label: `${assignment.academic_year} - ${assignment.class_offering.name} (${assignment.class_offering.level ?? "Level N/A"}) | ${assignment.subject.name}${assignment.subject.code ? ` (${assignment.subject.code})` : ""}`,
      })),
    [assignments],
  )

  return (
    <DashboardShell
      gradient
      topbar={
        <DashboardTopbar
          role="Teacher"
          userLabel="Create exam"
          meta="Create exam for assigned class/subject"
          showLogout
        />
      }
      sidebar={
        <SidebarNav
          title="Teacher"
          helper="Quick links"
          items={[
            { label: "Back to dashboard", href: siteRoutes.teacherDashboard },
            { label: "Manage exams", href: siteRoutes.teacherExamManage },
          ]}
          chips={["Create only for owned assignments", "100 max marks cap"]}
        />
      }
    >
      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">Create exam</p>
            <h2 className="text-3xl font-semibold text-slate-900">
              Only for your assigned class and subject.
            </h2>
            <p className="text-sm text-muted-foreground">
              Date must be today and each exam is fixed at 100 marks.
            </p>
          </div>
          <Badge variant="primary">Teacher scope</Badge>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Card className="border-none bg-white/90 shadow-glass">
          <CardHeader>
            <CardTitle>Exam details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <Label htmlFor="assignment_id">Assignment</Label>
                <select
                  id="assignment_id"
                  name="assignment_id"
                  className="h-11 w-full rounded-md border border-input bg-white/90 px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={form.assignment_id}
                  onChange={(e) => setForm((f) => ({ ...f, assignment_id: e.target.value }))}
                  disabled={loading || submitting}
                  required
                >
                  <option value="" disabled>
                    Select class & subject
                  </option>
                  {assignmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Mid Term"
                  value={form.title}
                  disabled={submitting}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={form.date}
                    min={today}
                    max={today}
                    disabled={submitting}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_marks">Max marks</Label>
                  <Input
                    id="max_marks"
                    name="max_marks"
                    type="number"
                    min={1}
                    max={100}
                    value={form.max_marks}
                    disabled
                    readOnly
                    onChange={(e) => setForm((f) => ({ ...f, max_marks: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={submitting || loading}>
                  {submitting ? "Creating..." : "Create exam"}
                </Button>
                <Button variant="ghost" asChild>
                  <Link to={siteRoutes.teacherDashboard}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </DashboardShell>
  )
}
