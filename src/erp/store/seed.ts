import type {
  ERPState,
  Student,
  Teacher,
  SchoolClass,
  Subject,
  ClassSubjectAssignment,
  FeeStructure,
  FeePayment,
  Expense,
  Homework,
  Exam,
  Mark,
  Notification,
  BusRoute,
  Attendance,
  TimetableSlot,
  CalendarEvent,
  User,
  Salary,
  ChatGroup,
} from "../types";

const id = (p: string, n: number | string) => `${p}_${n}`;
const today = new Date();
const iso = (d: Date) => d.toISOString().split("T")[0];
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysAhead = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return iso(d);
};

export function buildSeed(): ERPState {
  // Subjects (K-10 set)
  const subjects: Subject[] = [
    { id: "sub_eng", name: "English", code: "ENG" },
    { id: "sub_math", name: "Mathematics", code: "MATH" },
    { id: "sub_sci", name: "Science", code: "SCI" },
    { id: "sub_sst", name: "Social Studies", code: "SST" },
    { id: "sub_hin", name: "Hindi", code: "HIN" },
    { id: "sub_comp", name: "Computer", code: "COMP" },
    { id: "sub_art", name: "Art & Craft", code: "ART" },
    { id: "sub_pe", name: "Physical Edu.", code: "PE" },
  ];

  // Classes 1-10, single section A each (keep prototype lean)
  const classes: SchoolClass[] = Array.from({ length: 10 }, (_, i) => ({
    id: id("cls", i + 1),
    name: `Class ${i + 1}-A`,
    grade: i + 1,
    section: "A",
  }));

  // Teachers
  const teacherSeed = [
    ["Aarti Sharma", ["sub_eng", "sub_hin"], [1, 2, 3]],
    ["Rahul Verma", ["sub_math"], [4, 5, 6, 7]],
    ["Priya Nair", ["sub_sci"], [6, 7, 8]],
    ["Sandeep Joshi", ["sub_sst"], [5, 6, 7, 8]],
    ["Meera Iyer", ["sub_eng"], [4, 5, 6, 7, 8, 9, 10]],
    ["Vikram Singh", ["sub_math"], [8, 9, 10]],
    ["Neha Kapoor", ["sub_sci"], [9, 10]],
    ["Arjun Mehta", ["sub_comp"], [3, 4, 5, 6, 7, 8, 9, 10]],
    ["Kavita Rao", ["sub_art", "sub_pe"], [1, 2, 3, 4, 5]],
    ["Suresh Patel", ["sub_hin", "sub_sst"], [1, 2, 3, 4]],
  ] as const;

  const teachers: Teacher[] = teacherSeed.map(([name, subs, grades], i) => ({
    id: id("tch", i + 1),
    name: name as string,
    email: `${(name as string).toLowerCase().replace(/\s/g, ".")}@school.edu`,
    phone: `+91 98${(76543210 + i).toString()}`,
    subjects: [...(subs as readonly string[])],
    classes: (grades as readonly number[]).map((g) => id("cls", g)),
    joiningDate: daysAgo(365 * 2 + i * 30),
  }));

  // Assign class teachers
  classes.forEach((c, i) => {
    c.classTeacherId = teachers[i % teachers.length].id;
  });

  // ClassSubject assignments — for each class assign subjects to teachers
  const classSubjectAssignments: ClassSubjectAssignment[] = [];
  classes.forEach((c) => {
    subjects.forEach((s) => {
      const t = teachers.find(
        (tc) => tc.classes.includes(c.id) && tc.subjects.includes(s.id),
      );
      if (t) {
        classSubjectAssignments.push({
          id: `csa_${c.id}_${s.id}`,
          classId: c.id,
          subjectId: s.id,
          teacherId: t.id,
        });
      }
    });
  });

  // Fee structures
  const feeStructures: FeeStructure[] = classes.map((c) => ({
    id: `fs_${c.id}`,
    grade: c.grade,
    admissionFee: 5000 + c.grade * 500,
    quarterlyFee: 8000 + c.grade * 600,
  }));

  // Bus routes
  const busRoutes: BusRoute[] = [
    {
      id: "br_1",
      name: "Route A — North City",
      driverName: "Ramesh Kumar",
      driverPhone: "+91 9123456701",
      busNumber: "DL-1A-1234",
      baseFare: 800,
      pricePerKm: 25,
      stops: [
        { id: "bs_1", name: "Sector 12", pickupTime: "07:10", dropTime: "15:30", destination: "North Sector 12", distanceKm: 4 },
        { id: "bs_2", name: "Civic Center", pickupTime: "07:25", dropTime: "15:15", destination: "Civic Center", distanceKm: 7 },
        { id: "bs_3", name: "Market Square", pickupTime: "07:40", dropTime: "15:00", destination: "Market Square", distanceKm: 10 },
      ],
    },
    {
      id: "br_2",
      name: "Route B — South City",
      driverName: "Vinod Singh",
      driverPhone: "+91 9123456702",
      busNumber: "DL-2B-5678",
      baseFare: 800,
      pricePerKm: 30,
      stops: [
        { id: "bs_4", name: "Lake View", pickupTime: "07:00", dropTime: "15:35", destination: "Lake View", distanceKm: 5 },
        { id: "bs_5", name: "Rose Garden", pickupTime: "07:15", dropTime: "15:20", destination: "Rose Garden", distanceKm: 8 },
        { id: "bs_6", name: "Old Town", pickupTime: "07:30", dropTime: "15:05", destination: "Old Town", distanceKm: 12 },
      ],
    },
    {
      id: "br_3",
      name: "Route C — West Hills",
      driverName: "Suraj Yadav",
      driverPhone: "+91 9123456703",
      busNumber: "DL-3C-9012",
      baseFare: 1000,
      pricePerKm: 35,
      stops: [
        { id: "bs_7", name: "Hill Top", pickupTime: "07:05", dropTime: "15:40", destination: "Hill Top", distanceKm: 9 },
        { id: "bs_8", name: "Green Park", pickupTime: "07:20", dropTime: "15:25", destination: "Green Park", distanceKm: 6 },
      ],
    },
  ];

  // Students — 4 per class = 40 students
  const firstNames = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Sai", "Arjun", "Reyansh", "Krishna", "Ishaan", "Rohan", "Anaya", "Diya", "Saanvi", "Aadhya", "Myra", "Sara", "Riya", "Pari", "Anika", "Navya"];
  const lastNames = ["Sharma", "Verma", "Patel", "Gupta", "Reddy", "Khan", "Mehta", "Singh", "Nair", "Joshi"];

  const students: Student[] = [];
  let sIdx = 0;
  classes.forEach((c) => {
    for (let i = 0; i < 4; i++) {
      const fn = firstNames[(sIdx + i) % firstNames.length];
      const ln = lastNames[(sIdx + i * 3) % lastNames.length];
      const sid = id("std", sIdx + 1);
      students.push({
        id: sid,
        rollNo: `${c.grade}${(i + 1).toString().padStart(2, "0")}`,
        name: `${fn} ${ln}`,
        classId: c.id,
        parentName: `${["Mr.", "Mrs."][i % 2]} ${ln}`,
        parentPhone: `+91 90${(11110000 + sIdx).toString()}`,
        parentEmail: `parent.${fn.toLowerCase()}.${ln.toLowerCase()}@mail.com`,
        dob: iso(new Date(today.getFullYear() - (5 + c.grade), (sIdx % 12), ((sIdx % 27) + 1))),
        address: `${10 + sIdx} ${["Park St", "Lake Rd", "Hill Ln", "Garden Ave"][i % 4]}`,
        admissionDate: daysAgo(180 + sIdx),
        busRouteId: i < 2 ? busRoutes[i % busRoutes.length].id : undefined,
        documents: [
          { id: `doc_${sid}_1`, name: "Birth Certificate.pdf", type: "pdf", uploadedAt: daysAgo(180), url: "#" },
          { id: `doc_${sid}_2`, name: "Previous Marksheet.pdf", type: "pdf", uploadedAt: daysAgo(180), url: "#" },
        ],
      });
      sIdx++;
    }
  });

  // Fee payments — admission paid for all, quarters mixed
  const feePayments: FeePayment[] = [];
  const yr = `${today.getFullYear()}-${today.getFullYear() + 1}`;
  students.forEach((st, i) => {
    const fs = feeStructures.find((f) => f.grade === classes.find((c) => c.id === st.classId)!.grade)!;
    feePayments.push({
      id: `fp_${st.id}_adm`,
      studentId: st.id,
      type: "admission",
      amount: fs.admissionFee,
      status: "paid",
      paidOn: st.admissionDate,
      dueDate: st.admissionDate,
      receiptNo: `RC-${10000 + i}`,
      academicYear: yr,
    });
    (["Q1", "Q2", "Q3", "Q4"] as const).forEach((q, qi) => {
      const isPaid = qi < 2 || (qi === 2 && i % 3 !== 0);
      feePayments.push({
        id: `fp_${st.id}_${q}`,
        studentId: st.id,
        type: q,
        amount: fs.quarterlyFee,
        status: isPaid ? "paid" : "pending",
        paidOn: isPaid ? daysAgo(90 - qi * 30) : undefined,
        dueDate: qi < 3 ? daysAgo(60 - qi * 30) : daysAhead(30),
        receiptNo: isPaid ? `RC-${20000 + i * 4 + qi}` : undefined,
        academicYear: yr,
      });
    });
  });

  // Expenses (last 30 days)
  const expCats = ["Salaries", "Utilities", "Maintenance", "Supplies", "Transport", "Events"];
  const expenses: Expense[] = Array.from({ length: 35 }, (_, i) => ({
    id: `exp_${i + 1}`,
    date: daysAgo(i),
    category: expCats[i % expCats.length],
    description: `${expCats[i % expCats.length]} — ${["weekly", "monthly", "vendor"][i % 3]}`,
    amount: 1500 + ((i * 327) % 9000),
    addedBy: "Admin",
  }));

  // Homework — recent
  const homework: Homework[] = [];
  classSubjectAssignments.slice(0, 30).forEach((csa, i) => {
    homework.push({
      id: `hw_${i + 1}`,
      classId: csa.classId,
      subjectId: csa.subjectId,
      teacherId: csa.teacherId,
      title: `Chapter ${(i % 8) + 1} exercises`,
      description: `Complete questions 1-10 of chapter ${(i % 8) + 1}. Show working steps clearly.`,
      dueDate: daysAhead((i % 5) + 1),
      createdAt: daysAgo(i % 7),
    });
  });

  // Exams + Marks
  const exams: Exam[] = [
    { id: "ex_1", name: "Unit Test 1", term: "Term 1", academicYear: yr },
    { id: "ex_2", name: "Mid-Term", term: "Term 1", academicYear: yr },
    { id: "ex_3", name: "Unit Test 2", term: "Term 2", academicYear: yr },
  ];
  const marks: Mark[] = [];
  students.forEach((st) => {
    const csaForClass = classSubjectAssignments.filter((c) => c.classId === st.classId);
    exams.slice(0, 2).forEach((ex) => {
      csaForClass.forEach((csa) => {
        const m = 55 + Math.floor(Math.random() * 40);
        marks.push({
          id: `mk_${st.id}_${ex.id}_${csa.subjectId}`,
          studentId: st.id,
          examId: ex.id,
          subjectId: csa.subjectId,
          marks: m,
          maxMarks: 100,
          grade: m >= 90 ? "A+" : m >= 80 ? "A" : m >= 70 ? "B" : m >= 60 ? "C" : "D",
        });
      });
    });
  });

  // Calendar
  const calendar: CalendarEvent[] = [
    { id: "cal_1", title: "Independence Day", date: `${today.getFullYear()}-08-15`, type: "holiday" },
    { id: "cal_2", title: "Diwali Break", date: `${today.getFullYear()}-11-01`, endDate: `${today.getFullYear()}-11-05`, type: "holiday" },
    { id: "cal_3", title: "Annual Sports Day", date: daysAhead(20), type: "event", description: "All grades participate" },
    { id: "cal_4", title: "Mid-Term Exams", date: daysAhead(45), endDate: daysAhead(55), type: "exam" },
    { id: "cal_5", title: "Parent-Teacher Meeting", date: daysAhead(10), type: "event" },
  ];

  // Notifications
  const notifications: Notification[] = [
    {
      id: "nf_1",
      title: "Welcome to the new academic year",
      message: "Classes resume on Monday. Books and uniforms must be ready.",
      audience: "school",
      senderId: "u_admin",
      senderRole: "admin",
      createdAt: daysAgo(5),
      readBy: [],
    },
    {
      id: "nf_2",
      title: "Sports Day Preparation",
      message: "Practice begins next week after school hours.",
      audience: "school",
      senderId: "u_admin",
      senderRole: "admin",
      createdAt: daysAgo(2),
      readBy: [],
    },
  ];
  classes.slice(0, 5).forEach((c, i) => {
    notifications.push({
      id: `nf_c_${i}`,
      title: `${c.name}: Math test reminder`,
      message: "Bring your geometry box on Friday.",
      audience: "class",
      classId: c.id,
      senderId: teachers[1].id,
      senderRole: "teacher",
      createdAt: daysAgo(i),
      readBy: [],
    });
  });

  // Attendance — last 14 days
  const attendance: Attendance[] = [];
  for (let d = 0; d < 14; d++) {
    const day = new Date(today);
    day.setDate(day.getDate() - d);
    if (day.getDay() === 0) continue; // skip sundays
    students.forEach((st, idx) => {
      const r = (idx + d) % 10;
      attendance.push({
        id: `at_${st.id}_${d}`,
        studentId: st.id,
        classId: st.classId,
        date: iso(day),
        status: r === 0 ? "absent" : r === 1 ? "late" : "present",
        markedBy: "tch_1",
      });
    });
  }

  // Monthly attendance — last 3 months (new model)
  for (let m = 0; m < 3; m++) {
    const md = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const monthStr = `${md.getFullYear()}-${(md.getMonth() + 1).toString().padStart(2, "0")}`;
    const totalDays = 22;
    students.forEach((st, idx) => {
      const present = totalDays - ((idx + m) % 4);
      attendance.push({
        id: `mat_${st.id}_${monthStr}`,
        studentId: st.id,
        classId: st.classId,
        date: `${monthStr}-01`,
        month: monthStr,
        totalDays,
        presentDays: present,
        status: "present",
        markedBy: "tch_1",
      });
    });
  }

  // Timetable — for each class, 6 periods Mon-Fri
  const timetable: TimetableSlot[] = [];
  const days: TimetableSlot["day"][] = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const periodTimes = [
    ["08:00", "08:45"],
    ["08:50", "09:35"],
    ["09:40", "10:25"],
    ["10:45", "11:30"],
    ["11:35", "12:20"],
    ["12:25", "13:10"],
  ];
  classes.forEach((c) => {
    const csaList = classSubjectAssignments.filter((csa) => csa.classId === c.id);
    days.forEach((day) => {
      periodTimes.forEach(([s, e], p) => {
        const csa = csaList[p % csaList.length];
        if (!csa) return;
        timetable.push({
          id: `tt_${c.id}_${day}_${p}`,
          classId: c.id,
          day,
          period: p + 1,
          subjectId: csa.subjectId,
          teacherId: csa.teacherId,
          startTime: s,
          endTime: e,
        });
      });
    });
  });

  // Users — admin + one user per teacher + one parent per first student of each class for demo
  const users: User[] = [
    { id: "u_admin", email: "admin@school.edu", password: "admin", role: "admin", name: "Principal Sharma" },
    ...teachers.map((t, i) => ({
      id: `u_t_${t.id}`,
      email: i === 0 ? "teacher@school.edu" : t.email,
      password: "teacher",
      role: "teacher" as const,
      name: t.name,
      teacherId: t.id,
    })),
    ...students.map((s, i) => ({
      id: `u_p_${s.id}`,
      email: i === 0 ? "parent@school.edu" : s.parentEmail,
      password: "parent",
      role: "parent" as const,
      name: s.parentName,
      studentId: s.id,
    })),
  ];

  // Salaries — last 3 months for all teachers
  const salaries: Salary[] = [];
  for (let m = 0; m < 3; m++) {
    const md = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const monthStr = `${md.getFullYear()}-${(md.getMonth() + 1).toString().padStart(2, "0")}`;
    teachers.forEach((t, i) => {
      const basic = 35000 + i * 1500;
      const allowances = 5000;
      const deductions = 1000;
      const taxRate = 10;
      const gross = basic + allowances - deductions;
      const net = Math.round(gross * (1 - taxRate / 100));
      salaries.push({
        id: `sal_${t.id}_${monthStr}`,
        teacherId: t.id,
        month: monthStr,
        basic,
        allowances,
        deductions,
        taxRate,
        net,
        status: m === 0 ? "pending" : "paid",
        paidOn: m === 0 ? undefined : `${monthStr}-28`,
      });
    });
  }

  // Chat groups — one per class. Members: class teacher + subject teachers (user ids) + student parent accounts
  const chatGroups: ChatGroup[] = classes.map((c) => {
    const csaTeacherIds = Array.from(
      new Set(classSubjectAssignments.filter((a) => a.classId === c.id).map((a) => a.teacherId)),
    );
    if (c.classTeacherId && !csaTeacherIds.includes(c.classTeacherId)) csaTeacherIds.push(c.classTeacherId);
    const teacherUserIds = csaTeacherIds
      .map((tid) => users.find((u) => u.teacherId === tid)?.id)
      .filter((x): x is string => !!x);
    const studentUserIds = students
      .filter((s) => s.classId === c.id)
      .map((s) => users.find((u) => u.studentId === s.id)?.id)
      .filter((x): x is string => !!x);
    return {
      id: `grp_${c.id}`,
      name: `${c.name} — Class Group`,
      classId: c.id,
      teacherUserIds,
      studentUserIds,
      createdAt: daysAgo(60),
    };
  });

  return {
    users,
    students,
    teachers,
    classes,
    subjects,
    classSubjectAssignments,
    feeStructures,
    feePayments,
    expenses,
    homework,
    notes: [],
    exams,
    marks,
    notifications,
    busRoutes,
    attendance,
    timetable,
    calendar,
    activityLogs: [],
    messages: [],
    salaries,
    busFeeOverrides: [],
    chatGroups,
  };
}
