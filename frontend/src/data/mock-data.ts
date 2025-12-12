export const siteRoutes = {
  home: "/",
  login: "/login",
  signup: "/signup",
  passwordReset: "/password-reset",
  passwordResetDone: "/password-reset/done",
  passwordResetConfirm: "/password-reset/confirm",
  passwordResetComplete: "/password-reset/complete",
  passwordResetEmail: "/password-reset/email-preview",
  studentDashboard: "/dashboard/student",
  teacherDashboard: "/dashboard/teacher",
  teacherExamCreate: "/dashboard/teacher/exams/new",
  teacherExamManage: "/dashboard/teacher/exams/manage",
  adminDashboard: "/dashboard/admin",
}

export const studentProfile = {
  name: "Amira Khan",
  username: "amira.k",
  studentId: "ST-2048",
  academicYear: "2025/26",
  className: "Grade 10 - Atlas",
  rollNumber: "10A-07",
  overallGrade: "A-",
  overallPercent: 88.6,
}

export const studentSubjects = [
  "Mathematics",
  "Physics",
  "English Literature",
  "World History",
  "Studio Art",
  "Computer Science",
]

export const studentUpcomingExams = [
  { title: "Geometry Sprint", subject: "Mathematics", date: "2026-01-12", maxMarks: 60 },
  { title: "Modern World Essay", subject: "World History", date: "2026-01-19", maxMarks: 40 },
  { title: "Circuit Lab", subject: "Physics", date: "2026-01-25", maxMarks: 50 },
]

export const studentMarks = [
  { exam: "Quarterly Algebra", subject: "Mathematics", date: "2025-10-12", score: 54, maxMarks: 60 },
  { exam: "Narrative Essay", subject: "English Literature", date: "2025-10-20", score: 36, maxMarks: 40 },
  { exam: "Midyear Lab", subject: "Physics", date: "2025-11-02", score: 44, maxMarks: 50 },
  { exam: "Studio Portfolio", subject: "Studio Art", date: "2025-11-18", score: 48, maxMarks: 50 },
]

export const studentHistory = [
  {
    year: "2024/25",
    className: "Grade 9 - Nova",
    rollNumber: "09B-11",
    overallGrade: "A",
    overallPercent: 91.2,
    subjects: [
      { name: "Mathematics", percent: 93 },
      { name: "Science", percent: 89 },
      { name: "Literature", percent: 90 },
    ],
  },
  {
    year: "2023/24",
    className: "Grade 8 - Horizon",
    rollNumber: "08A-14",
    overallGrade: "A-",
    overallPercent: 88.4,
    subjects: [
      { name: "Mathematics", percent: 87 },
      { name: "Science", percent: 85 },
      { name: "Literature", percent: 90 },
    ],
  },
]

export const teacherProfile = {
  name: "Idris Mateo",
  username: "idris.m",
  employeeCode: "T-9042",
}

export const teacherAssignments = [
  { id: 1, year: "2025/26", className: "Grade 10 - Atlas", subject: "Mathematics", studentCount: 32 },
  { id: 2, year: "2025/26", className: "Grade 9 - Nova", subject: "Physics", studentCount: 30 },
  { id: 3, year: "2024/25", className: "Grade 8 - Horizon", subject: "Algebra Foundations", studentCount: 27 },
]

export const teacherExamsCurrent = [
  { id: 11, title: "Geometry Sprint", className: "Grade 10", year: "2025/26", subject: "Mathematics", date: "2026-01-12", maxMarks: 60, status: "Draft" },
  { id: 12, title: "Physics Lab II", className: "Grade 9", year: "2025/26", subject: "Physics", date: "2026-01-25", maxMarks: 50, status: "Scheduled" },
]

export const teacherExamsPast = [
  { id: 21, title: "Midyear Algebra", className: "Grade 10", year: "2024/25", subject: "Mathematics", date: "2025-04-18", maxMarks: 80 },
  { id: 22, title: "Foundations Final", className: "Grade 8", year: "2023/24", subject: "Algebra Foundations", date: "2024-03-09", maxMarks: 70 },
]

export const examManageDetail = {
  id: 11,
  title: "Geometry Sprint",
  subject: "Mathematics",
  className: "Grade 10 - Atlas",
  academicYear: "2025/26",
  date: "2026-01-12",
  maxMarks: 60,
  allowEdit: true,
}

export const examEnrollments = [
  { id: 101, name: "Amira Khan", studentId: "ST-2048", roll: "10A-07", marks: 55 },
  { id: 102, name: "Lukas Meyer", studentId: "ST-2050", roll: "10A-05", marks: null },
  { id: 103, name: "Fatou Diallo", studentId: "ST-2055", roll: "10A-12", marks: 52 },
  { id: 104, name: "Rei Sato", studentId: "ST-2061", roll: "10A-02", marks: null },
  { id: 105, name: "Mateo Cruz", studentId: "ST-2072", roll: "10A-14", marks: 49 },
]

export const passwordResetEmail = {
  siteName: "CEMS React",
  domain: "cems.example.com",
  protocol: "https",
  token: "reset-token-123",
  uid: "user-2048",
  userName: "amira.k",
}
