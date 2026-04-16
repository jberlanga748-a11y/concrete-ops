export type DatabaseSeed = ReturnType<typeof buildDbSeed>;

export function buildDbSeed() {
  return {
    auth: {
      user: { id: "auth-user-1" }
    },
    appUser: {
      id: "app-user-1",
      company_id: "company-1"
    },
    employee: {
      id: "employee-1",
      full_name: "Alex Worker",
      company_id: "company-1",
      user_id: "app-user-1"
    },
    job: {
      id: "job-1",
      job_number: "J-1001",
      name: "Demo Sidewalk Pour",
      status: "in_progress"
    },
    jobPhase: {
      id: "phase-1",
      name: "Pour"
    },
    timeEntry: {
      id: "time-entry-1",
      employee_id: "employee-1",
      job_id: "job-1",
      job_phase_id: "phase-1",
      clock_in_at: "2026-04-16T15:30:00.000Z",
      clock_out_at: null,
      total_hours: null,
      break_minutes: 30,
      status: "clocked_in",
      employees: { full_name: "Alex Worker" },
      job_phases: { name: "Pour" },
      jobs: { job_number: "J-1001", name: "Demo Sidewalk Pour" }
    },
    dailyReport: {
      id: "daily-report-1",
      job_id: "job-1",
      report_date: "2026-04-15",
      submitted_by_user_id: "app-user-1",
      work_completed: "Poured section A",
      created_at: "2026-04-15T20:00:00.000Z",
      delays_issues: "None",
      materials_deliveries: "Concrete arrived on time",
      safety_notes: "All clear",
      jobs: { job_number: "J-1001", name: "Demo Sidewalk Pour" },
      users: { full_name: "Demo Owner" }
    },
    jobFile: {
      id: "job-file-1",
      job_id: "job-1",
      daily_report_id: "daily-report-1",
      file_name: "Progress Photo.JPG",
      file_type: "image/jpeg",
      storage_path: "company-1/job-1/progress-photo.jpg",
      tag: "progress",
      note: "Fresh pour photo",
      created_at: "2026-04-15T20:30:00.000Z",
      jobs: { job_number: "J-1001", name: "Demo Sidewalk Pour" },
      daily_reports: { report_date: "2026-04-15" },
      users: { full_name: "Demo Owner" },
      employees: { full_name: "Alex Worker" }
    },
    changeOrder: {
      id: "change-order-1",
      job_id: "job-1",
      daily_report_id: "daily-report-1",
      title: "Extra edge prep",
      description: "Additional edge prep required",
      status: "submitted",
      direct_cost_total: 250,
      markup_percent: 15,
      total_amount: 287.5,
      created_at: "2026-04-15T21:00:00.000Z",
      jobs: { job_number: "J-1001", name: "Demo Sidewalk Pour" },
      daily_reports: { id: "daily-report-1", report_date: "2026-04-15" },
      users: { full_name: "Demo Owner" }
    },
    changeOrderLineItem: {
      id: "line-item-1",
      company_id: "company-1",
      change_order_id: "change-order-1",
      description: "Extra labor",
      quantity: 2,
      unit_cost: 125,
      line_total: 250,
      created_at: "2026-04-15T21:05:00.000Z",
      updated_at: "2026-04-15T21:05:00.000Z"
    },
    changeOrderFile: {
      id: "change-order-file-1",
      company_id: "company-1",
      change_order_id: "change-order-1",
      job_file_id: "job-file-1",
      created_at: "2026-04-15T21:06:00.000Z",
      job_files: {
        id: "job-file-1",
        file_name: "Progress Photo.JPG",
        tag: "progress",
        note: "Fresh pour photo",
        storage_path: "company-1/job-1/progress-photo.jpg",
        created_at: "2026-04-15T20:30:00.000Z"
      }
    }
  };
}
