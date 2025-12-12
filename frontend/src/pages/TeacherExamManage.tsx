import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { DashboardShell } from "@/components/layout/DashboardShell"
import { DashboardTopbar } from "@/components/layout/DashboardTopbar"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { Input } from "@/components/ui/input"
import { siteRoutes } from "@/data/mock-data"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { formatApiError } from "@/lib/api-client"
import {
  fetchTeacherExamDetail,
  saveExamMarks,
  type ExamDetail,
} from "@/services/teacher"

type RosterRow = ExamDetail["roster"][number] & { pending_mark?: number }

export default function TeacherExamManage() {
  const { tokens, updateTokens } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const examId = searchParams.get("examId")

  const [state, setState] = useState<{
    loading: boolean
    error: string
    detail: ExamDetail | null
    roster: RosterRow[]
    saving: boolean
  }>({ loading: true, error: "", detail: null, roster: [], saving: false })

  useEffect(() => {
    if (!tokens || !examId) {
      setState((s) => ({ ...s, loading: false, error: examId ? "" : "No exam selected." }))
      return
    }
    setState((s) => ({ ...s, loading: true, error: "" }))
    fetchTeacherExamDetail(tokens, Number(examId), updateTokens)
      .then((detail) => {
        setState({
          loading: false,
          error: "",
          detail,
          roster: detail.roster.map((row) => ({ ...row, pending_mark: row.existing_mark ?? undefined })),
          saving: false,
        })
      })
      .catch((err) => {
        const message = formatApiError(err, "Unable to load exam.")
        setState({ loading: false, error: message, detail: null, roster: [], saving: false })
        showToast({ title: "Failed to load exam", description: message, variant: "error" })
      })
  }, [tokens, examId, updateTokens, showToast])

  const detail = state.detail
  const roster = state.roster

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail || !tokens) return
    if (!detail.allow_edit) return

    const marks = roster
      .map((row) => ({
        student_enrollment_id: row.student_enrollment_id,
        marks_obtained: row.pending_mark ?? row.existing_mark,
      }))
      .filter((row) => row.marks_obtained !== null && row.marks_obtained !== undefined) as Array<{
      student_enrollment_id: number
      marks_obtained: number
    }>

    setState((s) => ({ ...s, saving: true }))
    saveExamMarks(tokens, detail.exam.id, marks, updateTokens)
      .then((res) => {
        showToast({
          title: "Marks saved",
          description: `${res.saved} marks saved.`,
          variant: "success",
        })
        navigate(siteRoutes.teacherDashboard, { replace: true })
      })
      .catch((err) => {
        const message = formatApiError(err, "Could not save marks.")
        setState((s) => ({ ...s, saving: false }))
        showToast({ title: "Save failed", description: message, variant: "error" })
      })
  }

  const headerTitle = detail
    ? `${detail.exam.title} (${detail.exam.assignment.class_offering} · ${detail.exam.assignment.subject})`
    : "Manage exam"

  const meta = detail
    ? `${detail.exam.assignment.class_offering} (${detail.exam.date})`
    : undefined

  const canEdit = detail?.allow_edit ?? false

  return (
    <DashboardShell
      gradient
      topbar={
        <DashboardTopbar
          role="Teacher"
          userLabel={headerTitle}
          meta={meta}
          showLogout
        />
      }
      sidebar={
        <SidebarNav
          title="Teacher"
          helper="Exam actions"
          items={[
            { label: "Back to dashboard", href: siteRoutes.teacherDashboard },
            { label: "Create exam", href: siteRoutes.teacherExamCreate },
          ]}
          chips={[
            canEdit ? "Enter marks once per student" : "Read-only",
            detail ? `Max ${detail.exam.max_marks}` : "",
          ]}
        />
      }
    >
      <section className="space-y-6">
        <SectionHeader
          eyebrow="Manage exam"
          title={headerTitle}
          description={
            detail
              ? detail.allow_edit
                ? "Enter marks once per student. Existing marks are locked."
                : "Read-only; marks cannot be edited for this exam."
              : "Load an exam to manage marks."
          }
          align="between"
          actions={
            detail ? (
              <Badge variant={detail.allow_edit ? "accent" : "muted"}>
                {detail.allow_edit ? "Editing enabled" : "Read-only"}
              </Badge>
            ) : null
          }
        />

        {state.error && (
          <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {state.error}
          </p>
        )}

        {state.loading && !detail ? (
          <Card className="border-none bg-white/90 shadow-glass">
            <CardContent className="p-6 text-sm text-muted-foreground">Loading exam...</CardContent>
          </Card>
        ) : detail ? (
          <Card className="border-none bg-white/90 shadow-glass">
            <CardHeader>
              <CardTitle>Per-student marks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-4" onSubmit={onSubmit}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Roll</TableHead>
                      <TableHead>Marks (0 - {detail.exam.max_marks})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roster.map((row) => (
                      <TableRow key={row.student_enrollment_id}>
                        <TableCell className="font-semibold">{row.student_name}</TableCell>
                        <TableCell>{row.student_id}</TableCell>
                        <TableCell>{row.roll ?? "—"}</TableCell>
                        <TableCell>
                          {row.existing_mark !== null && row.existing_mark !== undefined ? (
                            <Badge variant="muted">
                              {row.existing_mark} / {detail.exam.max_marks}
                            </Badge>
                          ) : canEdit ? (
                            <Input
                              type="number"
                              name={`mark_${row.student_enrollment_id}`}
                              min={0}
                              max={detail.exam.max_marks}
                              step={0.01}
                              placeholder="Enter marks"
                              value={row.pending_mark ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                setState((s) => ({
                                  ...s,
                                  roster: s.roster.map((r) =>
                                    r.student_enrollment_id === row.student_enrollment_id
                                      ? { ...r, pending_mark: value === "" ? undefined : Number(value) }
                                      : r,
                                  ),
                                }))
                              }}
                            />
                          ) : (
                            <Badge variant="muted">Not graded</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {canEdit && (
                  <div className="flex items-center gap-3">
                    <Button type="submit" disabled={state.saving}>
                      {state.saving ? "Saving..." : "Save marks"}
                    </Button>
                    <Button variant="ghost" asChild>
                      <Link to={siteRoutes.teacherDashboard}>Cancel</Link>
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none bg-white/90 shadow-glass">
            <CardContent className="p-6 text-sm text-muted-foreground">
              No exam selected. Open from the teacher dashboard.
            </CardContent>
          </Card>
        )}
      </section>
    </DashboardShell>
  )
}
