export type Role = "admin" | "teacher" | "parent";

export interface User {
  id: string;
  email: string;
  password: string; // mock only
  role: Role;
  name: string;
  /** for parent role: linked student id */
  studentId?: string;
  /** for teacher role: linked teacher id */
  teacherId?: string;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  classId: string; // class id
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  dob: string;
  address: string;
  admissionDate: string;
  busRouteId?: string;
  documents?: Document[];
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subjects: string[]; // subject ids
  classes: string[]; // class ids assigned as class teacher / teaching
  joiningDate: string;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "Class 5 - A"
  grade: number; // 1-10
  section: string;
  classTeacherId?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

/** maps subject -> teacher per class */
export interface ClassSubjectAssignment {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
}

export interface FeeStructure {
  id: string;
  grade: number;
  admissionFee: number;
  quarterlyFee: number;
}

export type FeeType = "admission" | "Q1" | "Q2" | "Q3" | "Q4";

export interface FeePayment {
  id: string;
  studentId: string;
  type: FeeType;
  amount: number;
  status: "paid" | "pending";
  paidOn?: string;
  dueDate: string;
  receiptNo?: string;
  academicYear: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  addedBy: string;
}

export interface Homework {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  description: string;
  dueDate: string;
  createdAt: string;
  attachments?: { name: string; url: string }[];
}

export interface Note {
  id: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  name: string; // "Term 1", "Mid-term", etc.
  term: string;
  academicYear: string;
}

export interface Mark {
  id: string;
  studentId: string;
  examId: string;
  subjectId: string;
  marks: number;
  maxMarks: number;
  grade?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  audience: "school" | "class" | "student";
  classId?: string;
  studentId?: string;
  senderId: string;
  senderRole: Role;
  createdAt: string;
  readBy: string[]; // user ids
}

export interface BusRoute {
  id: string;
  name: string;
  driverName: string;
  driverPhone: string;
  busNumber: string;
  stops: BusStop[];
}

export interface BusStop {
  id: string;
  name: string;
  pickupTime: string;
  dropTime: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: "present" | "absent" | "late";
  markedBy: string;
}

export interface TimetableSlot {
  id: string;
  classId: string;
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat";
  period: number; // 1..8
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  type: "holiday" | "exam" | "event";
  description?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  url: string; // mocked
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  role: Role;
  action: string;
  entity: string;
  timestamp: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ERPState {
  users: User[];
  students: Student[];
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  classSubjectAssignments: ClassSubjectAssignment[];
  feeStructures: FeeStructure[];
  feePayments: FeePayment[];
  expenses: Expense[];
  homework: Homework[];
  notes: Note[];
  exams: Exam[];
  marks: Mark[];
  notifications: Notification[];
  busRoutes: BusRoute[];
  attendance: Attendance[];
  timetable: TimetableSlot[];
  calendar: CalendarEvent[];
  activityLogs: ActivityLog[];
  messages: Message[];
}
