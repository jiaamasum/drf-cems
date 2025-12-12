import { useEffect, useMemo, useState, useCallback } from "react"
import { Link } from "react-router-dom"

import { DashboardShell } from "@/components/layout/DashboardShell"
import { DashboardTopbar } from "@/components/layout/DashboardTopbar"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MetricCard } from "@/components/shared/MetricCard"
import { SectionHeader } from "@/components/shared/SectionHeader"
import { siteRoutes } from "@/data/mock-data"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/contexts/ToastContext"
import { formatApiError } from "@/lib/api-client"
import {
  fetchTeacherClassExams,
  fetchTeacherClasses,
  fetchTeacherDashboard,
  type TeacherDashboardResponse,
  type TeacherClassRef,
  type TeacherExam,
  type PaginatedResponse,
} from "@/services/teacher"

type DashboardState = {
  loading: boolean
  error: string
  data: TeacherDashboardResponse | null
}

type ClassLayerState = {
  loading: boolean
  error: string
  classes: TeacherClassRef[]
  exams: TeacherExam[]
  selectedClassId: number | null
  classPagination: PaginationState
  examPagination: PaginationState
}

type PaginationState = {
  page: number
  pageSize: number
  count: number
  next: string | null
  previous: string | null
}

const DEFAULT_PAGE_SIZE = 10

export default function TeacherDashboard() {
  const { tokens, updateTokens } = useAuth()
  const { showToast } = useToast()
  const [state, setState] = useState<DashboardState>({ loading: true, error: "", data: null })
  const [classState, setClassState] = useState<ClassLayerState>({
    loading: false,
    error: "",
    classes: [],
    exams: [],
    selectedClassId: null,
    classPagination: { page: 1, pageSize: DEFAULT_PAGE_SIZE, count: 0, next: null, previous: null },
    examPagination: { page: 1, pageSize: DEFAULT_PAGE_SIZE, count: 0, next: null, previous: null },
  })

  const applyPagination = useCallback(
    <T,>(data: PaginatedResponse<T>, page: number, pageSize: number): PaginationState => ({
      page,
      pageSize,
      count: data.count ?? data.results.length,
      next: data.next ?? null,
      previous: data.previous ?? null,
    }),
    [],
  )

  const loadClassExams = useCallback(
    (classId: number, page = 1) => {
      if (!tokens) return
      setClassState((s) => ({ ...s, loading: true, selectedClassId: classId }))
      fetchTeacherClassExams(tokens, classId, updateTokens, { page, page_size: DEFAULT_PAGE_SIZE })
        .then((res) =>
          setClassState((s) => ({
            ...s,
            loading: false,
            exams: res.results ?? [],
            examPagination: applyPagination(res, page, DEFAULT_PAGE_SIZE),
          })),
        )
        .catch((err) => {
          const message = formatApiError(err, "Unable to load exams for class.")
          setClassState((s) => ({ ...s, loading: false, error: message, exams: [] }))
          showToast({ title: "Failed to load class exams", description: message, variant: "error" })
        })
    },
    [tokens, updateTokens, showToast, applyPagination],
  )

  useEffect(() => {
    if (!tokens) return
    setState((s) => ({ ...s, loading: true, error: "" }))
    fetchTeacherDashboard(tokens, updateTokens)
      .then((data) => setState({ loading: false, error: "", data }))
      .catch((err) => {
        const message = formatApiError(err, "Unable to load teacher dashboard.")
        setState({ loading: false, error: message, data: null })
        showToast({ title: "Failed to load dashboard", description: message, variant: "error" })
      })
  }, [tokens, updateTokens, showToast])

  const loadClasses = useCallback(
    (page = 1) => {
      if (!tokens) return
      setClassState((s) => ({ ...s, loading: true, error: "" }))
      fetchTeacherClasses(tokens, updateTokens, { page, page_size: DEFAULT_PAGE_SIZE })
        .then((res) => {
          const classes = res.results ?? []
          setClassState((s) => {
            const baseState = {
              ...s,
              loading: false,
              error: "",
              classes,
              classPagination: applyPagination(res, page, DEFAULT_PAGE_SIZE),
            }
            if (classes.length === 0) {
              return {
                ...baseState,
                exams: [],
                selectedClassId: null,
                examPagination: {
                  page: 1,
                  pageSize: DEFAULT_PAGE_SIZE,
                  count: 0,
                  next: null,
                  previous: null,
                },
              }
            }
            return baseState
          })
          if (classes.length > 0) {
            loadClassExams(classes[0].class_offering_id, 1)
          }
        })
        .catch((err) => {
          const message = formatApiError(err, "Unable to load classes.")
          setClassState((s) => ({ ...s, loading: false, error: message }))
        })
    },
    [applyPagination, loadClassExams, tokens, updateTokens],
  )

  useEffect(() => {
    if (!tokens) return
    loadClasses(1)
  }, [tokens, loadClasses])

  const teacherProfile = state.data?.teacher_profile
  const assignments = state.data?.assignments ?? []
  const currentExams = state.data?.current_exams ?? []
  const pastExams = state.data?.past_exams ?? []

  const metrics = useMemo(
    () => [
      { label: "Classes", value: assignments.length, helper: "Across academic years" },
      {
        label: "Subjects",
        value: state.data?.subject_count ?? 0,
        helper: "Per assignment",
      },
      { label: "Exams", value: currentExams.length, helper: "Created by you" },
    ],
    [assignments.length, currentExams.length, state.data?.subject_count],
  )

  const userLabel = teacherProfile
    ? `${teacherProfile.full_name || teacherProfile.username} - ${teacherProfile.employee_code ?? "N/A"}`
    : "Teacher"
  const metaLabel = teacherProfile ? `Logged in as ${teacherProfile.username}` : ""

  const isLoading = state.loading

  return (
    <DashboardShell
      gradient
      topbar={
        <DashboardTopbar
          role="Teacher"
          userLabel={userLabel}
          meta={metaLabel}
          showLogout
        />
      }
      sidebar={
        <SidebarNav
          title="Teacher"
          helper="Quick sections"
          items={[
            { label: "Overview", href: "#overview", active: true },
            { label: "Assignments", href: "#assignments" },
            { label: "Exams", href: "#exams" },
            { label: "Past exams", href: "#past-exams" },
            { label: "Classes", href: "#classes" },
          ]}
          chips={["Assigned classes only", "No student creation", "Own exams only"]}
        />
      }
    >
      {state.error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <section id="overview" className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="eyebrow">
              {teacherProfile ? `Welcome back, ${teacherProfile.full_name || teacherProfile.username}` : "Teacher workspace"}
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">
              Teaching assignments (all years).
            </h1>
            <p className="text-sm text-muted-foreground">
              Employee ID: {teacherProfile?.employee_code ?? "N/A"}
            </p>
          </div>
          <Button asChild disabled={isLoading}>
            <Link to={siteRoutes.teacherExamCreate}>Create exam</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={metric.value}
              helper={metric.helper}
            />
          ))}
        </div>
      </section>

      <section id="assignments" className="space-y-4">
        <SectionHeader
          eyebrow="Assignments"
          title="Classes and subjects you own (by year)."
          description="Current and previous years included."
          align="start"
        />
        {assignments.length === 0 ? (
          <Card className="border-none bg-white/85 shadow-outline">
            <CardHeader className="text-sm text-muted-foreground">No assignments yet.</CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="border-none bg-white/85 shadow-outline">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {assignment.academic_year} - {assignment.class_offering.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Level: {assignment.class_offering.level ?? "N/A"} | Students: {assignment.student_count}
                    </p>
                  </div>
                  <Badge variant="accent">
                    {assignment.subject.name}
                    {assignment.subject.code ? ` (${assignment.subject.code})` : ""}
                  </Badge>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section id="exams" className="space-y-4">
        <SectionHeader
          eyebrow="Exams"
          title="Current year exams you have created."
          description="Dates cannot be in the past; scoped to your assignments."
          actions={
            <Button asChild size="sm" variant="primary" disabled={isLoading}>
              <Link to={siteRoutes.teacherExamCreate}>Create exam</Link>
            </Button>
          }
          align="between"
        />
        {currentExams.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-white/80 p-4 text-sm text-muted-foreground">
            No upcoming exams.
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-semibold">{exam.title}</TableCell>
                  <TableCell>{exam.date}</TableCell>
                  <TableCell>
                    <Badge variant="muted">{exam.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`${siteRoutes.teacherExamManage}?examId=${exam.id}`}>Manage</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section id="past-exams" className="space-y-4">
        <SectionHeader
          eyebrow="Past exams"
          title="Previous years' classes and subjects (read-only)."
          description="Marks cannot be edited for past years; open to view per student."
          align="start"
        />
        {pastExams.length === 0 ? (
          <Card className="border border-dashed border-border/70 bg-white/80 p-4 text-sm text-muted-foreground">
            No past exams.
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pastExams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-semibold">{exam.title}</TableCell>
                  <TableCell>{exam.date}</TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="ghost">
                      <Link to={`${siteRoutes.teacherExamManage}?examId=${exam.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section id="classes" className="space-y-4">
        <SectionHeader
          eyebrow="Classes"
          title="Browse classes then drill into exams"
          description="Pick a class to view only its exams and results."
          align="start"
        />
        {classState.error && (
          <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {classState.error}
          </div>
        )}
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Card className="border-none bg-white/85 shadow-outline">
            <CardHeader className="text-sm space-y-3">
              <p className="font-semibold">Classes</p>
              {classState.classes.length === 0 ? (
                <p className="text-muted-foreground">No classes found.</p>
              ) : (
                <div className="space-y-2">
                  {classState.classes.map((cls) => {
                    const isActive = classState.selectedClassId === cls.class_offering_id
                    return (
                      <button
                        key={`${cls.class_offering_id}-${cls.academic_year}`}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                          isActive ? "border-primary bg-primary/10 text-primary" : "border-border bg-white"
                        }`}
                        onClick={() => loadClassExams(cls.class_offering_id, 1)}
                        disabled={classState.loading}
                      >
                        <div>
                          <p className="font-semibold">{cls.class_name}</p>
                          <p className="text-xs text-muted-foreground">{cls.academic_year}</p>
                        </div>
                        <Badge variant="outline">{cls.exam_count} exams</Badge>
                      </button>
                    )
                  })}
                  <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                    <span>
                      Page {classState.classPagination.page} of{" "}
                      {Math.max(
                        1,
                        Math.ceil(classState.classPagination.count / classState.classPagination.pageSize),
                      )}
                    </span>
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={classState.loading || classState.classPagination.page <= 1}
                        onClick={() => loadClasses(classState.classPagination.page - 1)}
                      >
                        Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={
                          classState.loading ||
                          classState.classPagination.count <=
                            classState.classPagination.page * classState.classPagination.pageSize
                        }
                        onClick={() => loadClasses(classState.classPagination.page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>

          <Card className="border-none bg-white/85 shadow-outline">
            <CardHeader className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-semibold">Exams for class</p>
                {classState.loading && <Badge variant="muted">Loading...</Badge>}
              </div>
              {classState.exams.length === 0 ? (
                <p className="text-muted-foreground">Select a class to view exams.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classState.exams.map((exam) => (
                      <TableRow key={exam.id}>
                        <TableCell className="font-semibold">{exam.title}</TableCell>
                        <TableCell>{exam.date}</TableCell>
                        <TableCell>{exam.subject}</TableCell>
                        <TableCell>
                          <Badge variant="muted">{exam.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`${siteRoutes.teacherExamManage}?examId=${exam.id}`}>View</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {classState.selectedClassId && (
                <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
                  <span>
                    Page {classState.examPagination.page} of{" "}
                    {Math.max(1, Math.ceil(classState.examPagination.count / classState.examPagination.pageSize))}
                  </span>
                  <div className="space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={classState.loading || classState.examPagination.page <= 1}
                      onClick={() =>
                        loadClassExams(classState.selectedClassId ?? 0, classState.examPagination.page - 1)
                      }
                    >
                      Prev
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={
                        classState.loading ||
                        classState.examPagination.count <=
                          classState.examPagination.page * classState.examPagination.pageSize
                      }
                      onClick={() =>
                        loadClassExams(classState.selectedClassId ?? 0, classState.examPagination.page + 1)
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardHeader>
          </Card>
        </div>
      </section>
    </DashboardShell>
  )
}
