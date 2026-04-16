import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const DEMO_MARKER = "[DEMO_SETUP]";
const DEMO_CUSTOMER_NAME = "DEMO – Field Ops Customer";
const DEMO_TOOLBOX_TALK_TOPIC = "DEMO – Morning Safety Huddle";
const DEMO_PHASE_NAMES = ["Demo", "Formwork", "Placement", "Finish"] as const;
const DEMO_JOB_DEFINITIONS = [
  {
    jobNumber: "DEMO-1001",
    name: "DEMO – Office Slab Pour",
    status: "in_progress",
    address: "100 Demo Way, Austin, TX",
    description: `${DEMO_MARKER} Demo slab work for field workflow testing.`,
  },
  {
    jobNumber: "DEMO-1002",
    name: "DEMO – Warehouse Apron",
    status: "scheduled",
    address: "200 Demo Way, Austin, TX",
    description: `${DEMO_MARKER} Demo apron work for field workflow testing.`,
  },
] as const;
const DEMO_EMPLOYEE_DEFINITIONS = [
  {
    fullName: "DEMO – Frank Foreman",
    email: "demo.foreman@example.com",
    crewName: "DEMO Crew",
    jobTitle: "Foreman",
  },
  {
    fullName: "DEMO – Chris Crew",
    email: "demo.crew1@example.com",
    crewName: "DEMO Crew",
    jobTitle: "Crew",
  },
  {
    fullName: "DEMO – Taylor Crew",
    email: "demo.crew2@example.com",
    crewName: "DEMO Crew",
    jobTitle: "Crew",
  },
  {
    fullName: "DEMO – Jordan Crew",
    email: "demo.crew3@example.com",
    crewName: "DEMO Crew",
    jobTitle: "Crew",
  },
  {
    fullName: "DEMO – Casey Crew",
    email: "demo.crew4@example.com",
    crewName: "DEMO Crew",
    jobTitle: "Crew",
  },
  {
    fullName: "DEMO – Riley Crew",
    email: "demo.crew5@example.com",
    crewName: "DEMO Crew",
    jobTitle: "Crew",
  },
] as const;
const DEMO_DOCUMENT_NOTE = `${DEMO_MARKER} Demo document placeholder.`;

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
type ConfiguredAdminClient =
  | { adminClient: AdminClient; companyId: string }
  | { error: string };

export type DemoSetupCounts = {
  customers: number;
  jobs: number;
  employees: number;
  jobAssignments: number;
  jobPhases: number;
  dailyReports: number;
  crewEntries: number;
  toolboxTalks: number;
  toolboxAttendees: number;
  incidents: number;
  documents: number;
};

type DemoResourceIds = {
  customerIds: string[];
  jobIds: string[];
  employeeIds: string[];
  dailyReportIds: string[];
  toolboxTalkIds: string[];
  incidentIds: string[];
  documentIds: string[];
};

export type DemoSetupStatus = {
  configured: boolean;
  exists: boolean;
  counts: DemoSetupCounts;
  error?: string;
};

export type DemoSetupResult = {
  ok: boolean;
  alreadyExists?: boolean;
  counts: DemoSetupCounts;
  error?: string;
  warning?: string;
};

function emptyCounts(): DemoSetupCounts {
  return {
    customers: 0,
    jobs: 0,
    employees: 0,
    jobAssignments: 0,
    jobPhases: 0,
    dailyReports: 0,
    crewEntries: 0,
    toolboxTalks: 0,
    toolboxAttendees: 0,
    incidents: 0,
    documents: 0,
  };
}

function getDefaultCompanyId() {
  return process.env.DEFAULT_COMPANY_ID?.trim() || null;
}

async function getConfiguredAdminClient(): Promise<ConfiguredAdminClient> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return { error: "Demo setup is not configured. Set SUPABASE_SERVICE_ROLE_KEY first." };
  }

  const companyId = getDefaultCompanyId();
  if (!companyId) {
    return { error: "Demo setup is not configured. Set DEFAULT_COMPANY_ID first." };
  }

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    return { error: companyError.message };
  }

  if (!company) {
    return { error: "DEFAULT_COMPANY_ID does not match a company in Supabase." };
  }

  return { adminClient: adminClient as AdminClient, companyId };
}

async function loadDemoResources(adminClient: AdminClient, companyId: string) {
  const [customersResult, jobsResult, employeesResult, phasesResult, reportsResult, toolboxResult, incidentsResult, documentsResult] =
    await Promise.all([
      adminClient.from("customers").select("id").eq("company_id", companyId).eq("name", DEMO_CUSTOMER_NAME),
      adminClient.from("jobs").select("id, job_number").eq("company_id", companyId).in("job_number", DEMO_JOB_DEFINITIONS.map((job) => job.jobNumber)),
      adminClient.from("employees").select("id, email").eq("company_id", companyId).in("email", DEMO_EMPLOYEE_DEFINITIONS.map((employee) => employee.email)),
      adminClient.from("job_phases").select("id, name").eq("company_id", companyId).in("name", [...DEMO_PHASE_NAMES]),
      adminClient.from("daily_reports").select("id").eq("company_id", companyId).ilike("work_completed", `${DEMO_MARKER}%`),
      adminClient.from("toolbox_talks").select("id").eq("company_id", companyId).eq("topic", DEMO_TOOLBOX_TALK_TOPIC),
      adminClient.from("incidents").select("id").eq("company_id", companyId).ilike("description", `${DEMO_MARKER}%`),
      adminClient.from("documents").select("id").eq("company_id", companyId).eq("note", DEMO_DOCUMENT_NOTE),
    ]);

  const firstError =
    customersResult.error ||
    jobsResult.error ||
    employeesResult.error ||
    phasesResult.error ||
    reportsResult.error ||
    toolboxResult.error ||
    incidentsResult.error ||
    documentsResult.error;

  if (firstError) {
    return { error: firstError.message };
  }

  const customerIds = (customersResult.data ?? []).map((row) => row.id);
  const jobIds = (jobsResult.data ?? []).map((row) => row.id);
  const employeeIds = (employeesResult.data ?? []).map((row) => row.id);
  const dailyReportIds = (reportsResult.data ?? []).map((row) => row.id);
  const toolboxTalkIds = (toolboxResult.data ?? []).map((row) => row.id);
  const incidentIds = (incidentsResult.data ?? []).map((row) => row.id);
  const documentIds = (documentsResult.data ?? []).map((row) => row.id);

  const [assignmentsResult, crewEntriesResult, attendeesResult] = await Promise.all([
    jobIds.length
      ? adminClient.from("job_assignments").select("id").eq("company_id", companyId).in("job_id", jobIds)
      : Promise.resolve({ data: [], error: null }),
    dailyReportIds.length
      ? adminClient.from("daily_report_crew_entries").select("id").eq("company_id", companyId).in("daily_report_id", dailyReportIds)
      : Promise.resolve({ data: [], error: null }),
    toolboxTalkIds.length
      ? adminClient.from("toolbox_talk_attendees").select("id").eq("company_id", companyId).in("toolbox_talk_id", toolboxTalkIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const secondaryError = assignmentsResult.error || crewEntriesResult.error || attendeesResult.error;
  if (secondaryError) {
    return { error: secondaryError.message };
  }

  return {
    data: {
      counts: {
        customers: customerIds.length,
        jobs: jobIds.length,
        employees: employeeIds.length,
        jobAssignments: (assignmentsResult.data ?? []).length,
        jobPhases: (phasesResult.data ?? []).length,
        dailyReports: dailyReportIds.length,
        crewEntries: (crewEntriesResult.data ?? []).length,
        toolboxTalks: toolboxTalkIds.length,
        toolboxAttendees: (attendeesResult.data ?? []).length,
        incidents: incidentIds.length,
        documents: documentIds.length,
      } satisfies DemoSetupCounts,
      ids: {
        customerIds,
        jobIds,
        employeeIds,
        dailyReportIds,
        toolboxTalkIds,
        incidentIds,
        documentIds,
      } satisfies DemoResourceIds,
      exists:
        customerIds.length > 0 ||
        jobIds.length > 0 ||
        employeeIds.length > 0 ||
        dailyReportIds.length > 0 ||
        toolboxTalkIds.length > 0 ||
        incidentIds.length > 0 ||
        documentIds.length > 0,
    },
  };
}

export async function getDemoSetupStatus(): Promise<DemoSetupStatus> {
  const configured = await getConfiguredAdminClient();
  if (!("adminClient" in configured)) {
    return {
      configured: false,
      exists: false,
      counts: emptyCounts(),
      error: configured.error,
    };
  }

  const resources = await loadDemoResources(configured.adminClient, configured.companyId);
  if (resources.error || !resources.data) {
    return {
      configured: true,
      exists: false,
      counts: emptyCounts(),
      error: resources.error || "Could not read demo setup state.",
    };
  }

  return {
    configured: true,
    exists: resources.data.exists,
    counts: resources.data.counts,
  };
}

export async function createDemoRecords(actorUserId: string): Promise<DemoSetupResult> {
  const configured = await getConfiguredAdminClient();
  if (!("adminClient" in configured)) {
    return { ok: false, counts: emptyCounts(), error: configured.error };
  }

  const { adminClient, companyId } = configured;
  const existingResources = await loadDemoResources(adminClient, companyId);
  if (existingResources.error || !existingResources.data) {
    return { ok: false, counts: emptyCounts(), error: existingResources.error || "Could not inspect demo state." };
  }

  if (existingResources.data.exists) {
    return {
      ok: true,
      alreadyExists: true,
      counts: existingResources.data.counts,
      warning: "Demo already exists for this company.",
    };
  }

  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  };
  const nowIso = today.toISOString();

  const { data: existingPhases, error: phaseLookupError } = await adminClient
    .from("job_phases")
    .select("id, name")
    .eq("company_id", companyId)
    .in("name", [...DEMO_PHASE_NAMES]);

  if (phaseLookupError) {
    return { ok: false, counts: emptyCounts(), error: phaseLookupError.message };
  }

  const existingPhaseNames = new Set((existingPhases ?? []).map((phase) => phase.name));
  const phasesToInsert = DEMO_PHASE_NAMES.filter((name) => !existingPhaseNames.has(name)).map((name, index) => ({
    company_id: companyId,
    name,
    sort_order: index + 1,
    is_active: true,
  }));

  if (phasesToInsert.length > 0) {
    const { error: phaseInsertError } = await adminClient.from("job_phases").insert(phasesToInsert);
    if (phaseInsertError) {
      return { ok: false, counts: emptyCounts(), error: phaseInsertError.message };
    }
  }

  const { data: customer, error: customerError } = await adminClient
    .from("customers")
    .insert({
      company_id: companyId,
      name: DEMO_CUSTOMER_NAME,
      contact_name: "Avery Demo",
      email: "demo.customer@example.com",
      phone: "555-0100",
      billing_address: "100 Demo Way, Austin, TX",
      notes: `${DEMO_MARKER} Demo customer created by the setup wizard.`,
      status: "active",
    })
    .select("id")
    .single();

  if (customerError || !customer) {
    return { ok: false, counts: emptyCounts(), error: customerError?.message || "Could not create the demo customer." };
  }

  const { data: employees, error: employeeError } = await adminClient
    .from("employees")
    .insert(
      DEMO_EMPLOYEE_DEFINITIONS.map((employee, index) => ({
        company_id: companyId,
        full_name: employee.fullName,
        email: employee.email,
        crew_name: employee.crewName,
        job_title: employee.jobTitle,
        is_active: true,
        hire_date: formatDate(-14 - index),
      })),
    )
    .select("id, full_name, email");

  if (employeeError || !employees) {
    return { ok: false, counts: emptyCounts(), error: employeeError?.message || "Could not create demo employees." };
  }

  const employeeByEmail = new Map((employees ?? []).map((employee) => [employee.email, employee]));
  const foreman = employeeByEmail.get("demo.foreman@example.com");
  if (!foreman) {
    return { ok: false, counts: emptyCounts(), error: "Could not locate the demo foreman record after creation." };
  }

  const { data: jobs, error: jobError } = await adminClient
    .from("jobs")
    .insert(
      DEMO_JOB_DEFINITIONS.map((jobDefinition, index) => ({
        company_id: companyId,
        customer_id: customer.id,
        job_number: jobDefinition.jobNumber,
        name: jobDefinition.name,
        address: jobDefinition.address,
        status: jobDefinition.status,
        foreman_employee_id: foreman.id,
        start_date: formatDate(-index),
        target_finish_date: formatDate(7 + index),
        description: jobDefinition.description,
      })),
    )
    .select("id, job_number");

  if (jobError || !jobs) {
    return { ok: false, counts: emptyCounts(), error: jobError?.message || "Could not create demo jobs." };
  }

  const jobByNumber = new Map((jobs ?? []).map((job) => [job.job_number, job]));
  const jobOne = jobByNumber.get("DEMO-1001");
  const jobTwo = jobByNumber.get("DEMO-1002");
  if (!jobOne || !jobTwo) {
    return { ok: false, counts: emptyCounts(), error: "Could not resolve demo jobs after creation." };
  }

  const assignments = [
    { jobId: jobOne.id, employeeEmail: "demo.foreman@example.com", role: "foreman" },
    { jobId: jobOne.id, employeeEmail: "demo.crew1@example.com", role: "crew" },
    { jobId: jobOne.id, employeeEmail: "demo.crew2@example.com", role: "crew" },
    { jobId: jobOne.id, employeeEmail: "demo.crew3@example.com", role: "crew" },
    { jobId: jobTwo.id, employeeEmail: "demo.foreman@example.com", role: "foreman" },
    { jobId: jobTwo.id, employeeEmail: "demo.crew4@example.com", role: "crew" },
    { jobId: jobTwo.id, employeeEmail: "demo.crew5@example.com", role: "crew" },
  ] as const;

  const { error: assignmentError } = await adminClient.from("job_assignments").insert(
    assignments.map((assignment) => ({
      company_id: companyId,
      job_id: assignment.jobId,
      employee_id: employeeByEmail.get(assignment.employeeEmail)?.id,
      assignment_role: assignment.role,
      start_date: formatDate(-2),
      is_active: true,
    })),
  );

  if (assignmentError) {
    return { ok: false, counts: emptyCounts(), error: assignmentError.message };
  }

  const { data: dailyReports, error: dailyReportError } = await adminClient
    .from("daily_reports")
    .insert([
      {
        company_id: companyId,
        job_id: jobOne.id,
        report_date: formatDate(-1),
        submitted_by_user_id: actorUserId,
        work_completed: `${DEMO_MARKER} Formed and placed the office slab edge.`,
        delays_issues: "No demo delays.",
        materials_deliveries: "Concrete and rebar delivered on time.",
        safety_notes: "Reviewed PPE and access paths.",
      },
      {
        company_id: companyId,
        job_id: jobTwo.id,
        report_date: formatDate(0),
        submitted_by_user_id: actorUserId,
        work_completed: `${DEMO_MARKER} Laid out apron pours and completed prep.`,
        delays_issues: "Minor demo weather watch.",
        materials_deliveries: "Forms and stakes staged on site.",
        safety_notes: "Reviewed traffic control plan.",
      },
    ])
    .select("id, job_id");

  if (dailyReportError || !dailyReports) {
    return { ok: false, counts: emptyCounts(), error: dailyReportError?.message || "Could not create demo daily reports." };
  }

  const reportByJobId = new Map((dailyReports ?? []).map((report) => [report.job_id, report]));
  const dailyReportOne = reportByJobId.get(jobOne.id);
  const dailyReportTwo = reportByJobId.get(jobTwo.id);
  if (!dailyReportOne || !dailyReportTwo) {
    return { ok: false, counts: emptyCounts(), error: "Could not resolve demo daily reports after creation." };
  }

  const { error: crewEntryError } = await adminClient.from("daily_report_crew_entries").insert([
    {
      company_id: companyId,
      daily_report_id: dailyReportOne.id,
      employee_id: foreman.id,
      hours: 8,
      notes: "Led the slab pour demo plan and crew briefing.",
    },
    {
      company_id: companyId,
      daily_report_id: dailyReportOne.id,
      employee_id: employeeByEmail.get("demo.crew1@example.com")?.id,
      hours: 8,
      notes: "Placed edge forms and checked lines.",
    },
    {
      company_id: companyId,
      daily_report_id: dailyReportOne.id,
      employee_id: employeeByEmail.get("demo.crew2@example.com")?.id,
      hours: 7.5,
      notes: "Installed rebar mats for the demo slab.",
    },
    {
      company_id: companyId,
      daily_report_id: dailyReportTwo.id,
      employee_id: foreman.id,
      hours: 8,
      notes: "Coordinated apron prep and walkthrough.",
    },
    {
      company_id: companyId,
      daily_report_id: dailyReportTwo.id,
      employee_id: employeeByEmail.get("demo.crew4@example.com")?.id,
      hours: 8,
      notes: "Set stakes and apron form lines.",
    },
    {
      company_id: companyId,
      daily_report_id: dailyReportTwo.id,
      employee_id: employeeByEmail.get("demo.crew5@example.com")?.id,
      hours: 7,
      notes: "Assisted with demo site prep and cleanup.",
    },
  ]);

  if (crewEntryError) {
    return { ok: false, counts: emptyCounts(), error: crewEntryError.message };
  }

  const { data: toolboxTalk, error: toolboxTalkError } = await adminClient
    .from("toolbox_talks")
    .insert({
      company_id: companyId,
      topic: DEMO_TOOLBOX_TALK_TOPIC,
      talk_date: formatDate(0),
      foreman_employee_id: foreman.id,
      notes: `${DEMO_MARKER} Demo toolbox talk for field safety testing.`,
    })
    .select("id")
    .single();

  if (toolboxTalkError || !toolboxTalk) {
    return { ok: false, counts: emptyCounts(), error: toolboxTalkError?.message || "Could not create the demo toolbox talk." };
  }

  const { error: attendeeError } = await adminClient.from("toolbox_talk_attendees").insert(
    DEMO_EMPLOYEE_DEFINITIONS.map((employee) => ({
      company_id: companyId,
      toolbox_talk_id: toolboxTalk.id,
      employee_id: employeeByEmail.get(employee.email)?.id,
      signed_at: nowIso,
    })),
  );

  if (attendeeError) {
    return { ok: false, counts: emptyCounts(), error: attendeeError.message };
  }

  const { error: incidentError } = await adminClient.from("incidents").insert({
    company_id: companyId,
    job_id: jobOne.id,
    employee_id: employeeByEmail.get("demo.crew1@example.com")?.id,
    reported_by_user_id: actorUserId,
    reported_by_employee_id: foreman.id,
    incident_type: "near_miss",
    incident_date: formatDate(0),
    description: `${DEMO_MARKER} Demo near miss logged for walkthrough testing.`,
    corrective_action: "Reviewed barricade placement and reset demo access path.",
    status: "open",
  });

  if (incidentError) {
    return { ok: false, counts: emptyCounts(), error: incidentError.message };
  }

  const finalResources = await loadDemoResources(adminClient, companyId);
  if (finalResources.error || !finalResources.data) {
    return { ok: false, counts: emptyCounts(), error: finalResources.error || "Demo data was created, but the final summary could not be loaded." };
  }

  return {
    ok: true,
    counts: finalResources.data.counts,
  };
}

export async function deleteDemoRecords(): Promise<DemoSetupResult> {
  const configured = await getConfiguredAdminClient();
  if (!("adminClient" in configured)) {
    return { ok: false, counts: emptyCounts(), error: configured.error };
  }

  const { adminClient, companyId } = configured;
  const resources = await loadDemoResources(adminClient, companyId);
  if (resources.error || !resources.data) {
    return { ok: false, counts: emptyCounts(), error: resources.error || "Could not inspect demo state." };
  }

  if (!resources.data.exists) {
    return {
      ok: true,
      alreadyExists: true,
      counts: resources.data.counts,
      warning: "No demo data was found to delete.",
    };
  }

  const {
    customerIds,
    jobIds,
    employeeIds,
    dailyReportIds,
    toolboxTalkIds,
    incidentIds,
    documentIds,
  } = resources.data.ids;

  if (documentIds.length > 0) {
    const { error: documentLinkDeleteError } = await adminClient
      .from("document_links")
      .delete()
      .eq("company_id", companyId)
      .in("document_id", documentIds);

    if (documentLinkDeleteError) {
      return { ok: false, counts: resources.data.counts, error: documentLinkDeleteError.message };
    }

    const { error: documentDeleteError } = await adminClient
      .from("documents")
      .delete()
      .eq("company_id", companyId)
      .in("id", documentIds);

    if (documentDeleteError) {
      return { ok: false, counts: resources.data.counts, error: documentDeleteError.message };
    }
  }

  if (toolboxTalkIds.length > 0) {
    const { error: attendeeDeleteError } = await adminClient
      .from("toolbox_talk_attendees")
      .delete()
      .eq("company_id", companyId)
      .in("toolbox_talk_id", toolboxTalkIds);

    if (attendeeDeleteError) {
      return { ok: false, counts: resources.data.counts, error: attendeeDeleteError.message };
    }

    const { error: toolboxDeleteError } = await adminClient
      .from("toolbox_talks")
      .delete()
      .eq("company_id", companyId)
      .in("id", toolboxTalkIds);

    if (toolboxDeleteError) {
      return { ok: false, counts: resources.data.counts, error: toolboxDeleteError.message };
    }
  }

  if (dailyReportIds.length > 0) {
    const { error: crewDeleteError } = await adminClient
      .from("daily_report_crew_entries")
      .delete()
      .eq("company_id", companyId)
      .in("daily_report_id", dailyReportIds);

    if (crewDeleteError) {
      return { ok: false, counts: resources.data.counts, error: crewDeleteError.message };
    }

    const { error: reportDeleteError } = await adminClient
      .from("daily_reports")
      .delete()
      .eq("company_id", companyId)
      .in("id", dailyReportIds);

    if (reportDeleteError) {
      return { ok: false, counts: resources.data.counts, error: reportDeleteError.message };
    }
  }

  if (incidentIds.length > 0) {
    const { error: incidentDeleteError } = await adminClient
      .from("incidents")
      .delete()
      .eq("company_id", companyId)
      .in("id", incidentIds);

    if (incidentDeleteError) {
      return { ok: false, counts: resources.data.counts, error: incidentDeleteError.message };
    }
  }

  if (jobIds.length > 0) {
    const { error: assignmentDeleteError } = await adminClient
      .from("job_assignments")
      .delete()
      .eq("company_id", companyId)
      .in("job_id", jobIds);

    if (assignmentDeleteError) {
      return { ok: false, counts: resources.data.counts, error: assignmentDeleteError.message };
    }

    const { error: jobDeleteError } = await adminClient
      .from("jobs")
      .delete()
      .eq("company_id", companyId)
      .in("id", jobIds);

    if (jobDeleteError) {
      return { ok: false, counts: resources.data.counts, error: jobDeleteError.message };
    }
  }

  if (customerIds.length > 0) {
    const { error: customerDeleteError } = await adminClient
      .from("customers")
      .delete()
      .eq("company_id", companyId)
      .in("id", customerIds);

    if (customerDeleteError) {
      return { ok: false, counts: resources.data.counts, error: customerDeleteError.message };
    }
  }

  if (employeeIds.length > 0) {
    const { error: employeeDeleteError } = await adminClient
      .from("employees")
      .delete()
      .eq("company_id", companyId)
      .in("id", employeeIds);

    if (employeeDeleteError) {
      return { ok: false, counts: resources.data.counts, error: employeeDeleteError.message };
    }
  }

  const finalResources = await loadDemoResources(adminClient, companyId);
  if (finalResources.error || !finalResources.data) {
    return { ok: false, counts: emptyCounts(), error: finalResources.error || "Demo data was deleted, but the final summary could not be loaded." };
  }

  return {
    ok: true,
    counts: finalResources.data.counts,
  };
}
