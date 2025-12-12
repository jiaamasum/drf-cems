import { useEffect, useMemo, useState, useRef, useCallback } from "react"

import { DashboardShell } from "@/components/layout/DashboardShell"
import { DashboardTopbar } from "@/components/layout/DashboardTopbar"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { MetricCard } from "@/components/shared/MetricCard"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { formatApiError } from "@/lib/api-client"
import { fetchStudentDashboard, type StudentDashboardResponse } from "@/services/student"

type DashboardState = {
  loading: boolean
  error: string
  data: StudentDashboardResponse | null
}

type PaginationState = {
  upcomingPage: number
  marksPage: number
  historyPage: number
}

const DEFAULT_PAGE_SIZE = 10

export default function StudentDashboard() {
  const { tokens, updateTokens } = useAuth()
  const { showToast } = useToast()
  const [state, setState] = useState<DashboardState>({ loading: true, error: "", data: null })
  const [pages, setPages] = useState<PaginationState>({ upcomingPage: 1, marksPage: 1, historyPage: 1 })
  const pagesRef = useRef<PaginationState>({ upcomingPage: 1, marksPage: 1, historyPage: 1 })

  const loadDashboard = useCallback(
    (pageState?: PaginationState) => {
      if (!tokens) return
      const activePages = pageState ?? pagesRef.current
      setState((s) => ({ ...s, loading: true, error: "" }))
      fetchStudentDashboard(tokens, updateTokens, {
        upcoming_page: activePages.upcomingPage,
        upcoming_page_size: DEFAULT_PAGE_SIZE,
        marks_page: activePages.marksPage,
        marks_page_size: DEFAULT_PAGE_SIZE,
        history_page: activePages.historyPage,
        history_page_size: DEFAULT_PAGE_SIZE,
      })
        .then((data) => setState({ loading: false, error: "", data }))
        .catch((err) => {
          const message = formatApiError(err, "Unable to load student dashboard.")
          setState({ loading: false, error: message, data: null })
          showToast({ title: "Failed to load dashboard", description: message, variant: "error" })
        })
    },
    [tokens, updateTokens, showToast],
  )

  useEffect(() => {
    if (!tokens) return
    loadDashboard()
  }, [tokens, loadDashboard])

  const changeUpcomingPage = (page: number) => {
    if (page < 1) return
    const next = { ...pages, upcomingPage: page }
    setPages(next)
    pagesRef.current = next
    loadDashboard(next)
  }

  const changeMarksPage = (page: number) => {
    if (page < 1) return
    const next = { ...pages, marksPage: page }
    setPages(next)
    pagesRef.current = next
    loadDashboard(next)
  }

  const changeHistoryPage = (page: number) => {
    if (page < 1) return
    const next = { ...pages, historyPage: page }
    setPages(next)
    pagesRef.current = next
    loadDashboard(next)
  }

  const profile = state.data?.profile
  const enrollment = state.data?.enrollment
  const subjects = state.data?.subjects ?? []
  const upcomingPagination = state.data?.upcoming_exams
  const upcomingExams = upcomingPagination?.results ?? []
  const upcomingCount = upcomingPagination?.count ?? upcomingExams.length
  const marksPagination = state.data?.marks
  const marks = marksPagination?.results ?? []
  const marksCount = marksPagination?.count ?? marks.length
  const currentGrade = state.data?.current_grade
  const historyPagination = state.data?.history
  const historyEntries = historyPagination?.results ?? []
  const latestHistory = historyEntries.find((entry) => entry.academic_year === enrollment?.academic_year) ?? historyEntries[0] ?? {}
  const [selectedHistory, setSelectedHistory] = useState<typeof historyEntries[number] | null>(null)

  useEffect(() => {
    if (historyEntries.length === 0) {
      setSelectedHistory(null)
      return
    }
    const existsOnPage =
      selectedHistory &&
      historyEntries.some(
        (entry) =>
          entry.academic_year === selectedHistory.academic_year && entry.class_name === selectedHistory.class_name,
      )
    if (!selectedHistory || !existsOnPage) {
      const preferred = historyEntries.find((entry) => entry.academic_year === enrollment?.academic_year)
      setSelectedHistory(preferred ?? historyEntries[0])
    }
  }, [historyEntries, enrollment?.academic_year, selectedHistory])

  const metrics = useMemo(() => {
    const totalExams = latestHistory?.total_exams ?? marksCount
    const avgPercent =
      latestHistory?.overall_percent ??
      (marks.length
        ? (marks.reduce((acc, m) => acc + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length).toFixed(1)
        : null)

    return [
      {
        label: "Current class",
        value: enrollment?.class_offering.name ?? "N/A",
        helper: enrollment?.academic_year ?? "No enrollment",
        tag: "Active",
        tone: "accent" as const,
      },
      {
        label: "Upcoming exams",
        value: upcomingCount,
        helper: enrollment?.academic_year ?? "N/A",
        tag: "Calendar",
      },
      {
        label: "Published results",
        value: totalExams,
        helper: "Exam entries",
        tag: "Read-only",
      },
      {
        label: "Roll number",
        value: enrollment?.roll_number ?? "N/A",
        helper: "Per class-year",
        tag: "Roster",
      },
      {
        label: "Overall grade",
        value: currentGrade ?? "Awaiting",
        helper: avgPercent ? `${avgPercent}%` : "No marks",
        tag: "This year",
        tone: "success" as const,
      },
      {
        label: "Student ID",
        value: profile?.student_id ?? "N/A",
        helper: profile?.full_name ?? "",
        tag: "ID",
      },
    ]
  }, [enrollment, upcomingCount, marks, marksCount, currentGrade, latestHistory?.overall_percent, profile?.student_id, profile?.full_name])

  return (
    <DashboardShell
      gradient
      topbar={
        <DashboardTopbar
          role="Student"
          userLabel={profile ? `${profile.full_name || profile.username} - ${profile.student_id}` : "Student"}
          meta={enrollment ? `Current: ${enrollment.class_offering.name}` : undefined}
          showLogout
        />
      }
      sidebar={
        <SidebarNav
          title="Student"
          helper="Navigate sections"
          items={[
            { label: "Overview", href: "#overview", active: true },
            { label: "Subjects", href: "#subjects" },
            { label: "Upcoming exams", href: "#upcoming" },
            { label: "Marks", href: "#marks" },
            { label: "History", href: "#history" },
          ]}
          chips={["Read-only", "Attendance ready", "History"]}
        />
      }
    >
      {state.error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <section id="overview" className="space-y-6">
        <SectionHeader
          eyebrow="Student workspace"
          title="Current enrollment and history."
          description={
            enrollment
              ? `Student ID: ${profile?.student_id ?? "N/A"}. Class roll updates automatically per class-year.`
              : "No enrollment found for the current year."
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
              tag={metric.tag}
              tone={metric.tone}
            />
          ))}
        </div>
      </section>

      <section id="subjects" className="space-y-4">
        <SectionHeader
          eyebrow="Subjects"
          title="Subjects assigned to your current class."
          description="Derived from teacher assignments for this class-year."
          align="start"
        />
        <Card className="border-none bg-white/80 shadow-outline">
          <CardContent className="flex flex-wrap gap-2 p-5">
            {subjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects available.</p>
            ) : (
              subjects.map((subject) => (
                <Badge key={subject.id} variant="outline" className="bg-secondary">
                  {subject.name}
                  {subject.code ? ` (${subject.code})` : ""}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section id="upcoming" className="space-y-4">
        <SectionHeader
          eyebrow="Upcoming exams"
          title="All exams for your class-year."
          description="Shows only dates on or after today."
          align="start"
        />
        {upcomingExams.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-white/80 p-4 text-sm text-muted-foreground">
            No upcoming exams.
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Max marks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-semibold">{exam.title}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.date}</TableCell>
                  <TableCell>{exam.max_marks}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>
            Page {pages.upcomingPage} of {Math.max(1, Math.ceil((upcomingCount || 0) / DEFAULT_PAGE_SIZE))}
          </span>
          <div className="space-x-2">
            <button
              className="rounded border px-3 py-1 transition hover:border-primary hover:text-primary"
              disabled={state.loading || pages.upcomingPage <= 1}
              onClick={() => changeUpcomingPage(pages.upcomingPage - 1)}
            >
              Prev
            </button>
            <button
              className="rounded border px-3 py-1 transition hover:border-primary hover:text-primary"
              disabled={
                state.loading || (upcomingCount || 0) <= pages.upcomingPage * DEFAULT_PAGE_SIZE
              }
              onClick={() => changeUpcomingPage(pages.upcomingPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section id="marks" className="space-y-4">
        <SectionHeader
          eyebrow="Marks"
          title="Results for your current class-year."
          description="Teacher-administered marks across all subjects."
          align="start"
        />
        {marks.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-white/80 p-4 text-sm text-muted-foreground">
            No marks published yet.
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marks.map((mark) => (
                <TableRow key={mark.exam_id}>
                  <TableCell className="font-semibold">{mark.exam_title}</TableCell>
                  <TableCell>{mark.subject}</TableCell>
                  <TableCell>{mark.date}</TableCell>
                  <TableCell>
                    <Badge variant="muted" className="font-semibold">
                      {mark.marks_obtained} / {mark.max_marks}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>
            Page {pages.marksPage} of {Math.max(1, Math.ceil((marksCount || 0) / DEFAULT_PAGE_SIZE))}
          </span>
          <div className="space-x-2">
            <button
              className="rounded border px-3 py-1 transition hover:border-primary hover:text-primary"
              disabled={state.loading || pages.marksPage <= 1}
              onClick={() => changeMarksPage(pages.marksPage - 1)}
            >
              Prev
            </button>
            <button
              className="rounded border px-3 py-1 transition hover:border-primary hover:text-primary"
              disabled={state.loading || (marksCount || 0) <= pages.marksPage * DEFAULT_PAGE_SIZE}
              onClick={() => changeMarksPage(pages.marksPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section id="history" className="space-y-4">
        <SectionHeader
          eyebrow="History"
          title="Class-year performance"
          description="Pick a year to view overall grades and per-subject performance."
          align="start"
        />
        {historyEntries.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-white/80 p-4 text-sm text-muted-foreground">
            No prior class-year data available.
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
            <Card className="border-none bg-white/85 shadow-outline">
              <CardHeader className="space-y-2 text-sm">
                <p className="font-semibold">Class years</p>
                <div className="space-y-2">
                  {historyEntries.map((entry) => {
                    const isActive = selectedHistory?.academic_year === entry.academic_year || (!selectedHistory && entry.academic_year === latestHistory?.academic_year)
                    return (
                      <button
                        key={`${entry.academic_year}-${entry.class_name}`}
                        onClick={() => setSelectedHistory(entry)}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                          isActive ? "border-primary bg-primary/10 text-primary" : "border-border bg-white"
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{entry.class_name}</p>
                          <p className="text-xs text-muted-foreground">{entry.academic_year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Grade</p>
                          <p className="font-semibold">{entry.overall_grade ?? "N/A"}</p>
                        </div>
                      </button>
                    )
                  })}
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>
                      Page {pages.historyPage} of {Math.max(1, Math.ceil((historyPagination?.count || 0) / DEFAULT_PAGE_SIZE))}
                    </span>
                    <div className="space-x-2">
                      <button
                        className="rounded border px-3 py-1 transition hover:border-primary hover:text-primary"
                        disabled={state.loading || pages.historyPage <= 1}
                        onClick={() => changeHistoryPage(pages.historyPage - 1)}
                      >
                        Prev
                      </button>
                      <button
                        className="rounded border px-3 py-1 transition hover:border-primary hover:text-primary"
                        disabled={
                          state.loading ||
                          (historyPagination?.count || 0) <= pages.historyPage * DEFAULT_PAGE_SIZE
                        }
                        onClick={() => changeHistoryPage(pages.historyPage + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-none bg-white/85 shadow-outline">
              <CardHeader className="space-y-3 text-sm">
                {(() => {
                  const active = selectedHistory ?? latestHistory ?? null
                  if (!active) {
                    return <p className="text-muted-foreground">Select a class-year to view details.</p>
                  }
                  return (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">{active.class_name}</p>
                          <p className="text-xs text-muted-foreground">{active.academic_year}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Overall</p>
                          <p className="font-semibold">
                            {active.overall_grade ?? "N/A"} {active.overall_percent != null ? `(${active.overall_percent}%)` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                        Total exams: {active.total_exams ?? 0}
                      </div>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Subject</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Percent</TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {active.subjects.map((subj) => (
                            <TableRow key={subj.id}>
                              <TableCell className="font-semibold">{subj.name}</TableCell>
                              <TableCell>{subj.code}</TableCell>
                              <TableCell>{subj.percent != null ? `${subj.percent}%` : "N/A"}</TableCell>
                              <TableCell>{subj.grade ?? "N/A"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )
                })()}
              </CardHeader>
            </Card>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
