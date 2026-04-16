import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

async function getDefaultCompany(adminClient: NonNullable<ReturnType<typeof createAdminClient>>) {
  const companyId = process.env.DEFAULT_COMPANY_ID?.trim();
  if (!companyId) {
    return { error: "Signup is not configured. Set DEFAULT_COMPANY_ID first." };
  }

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    return { error: companyError.message };
  }

  if (!company) {
    return { error: "Signup is not configured correctly. DEFAULT_COMPANY_ID does not match a company." };
  }

  return { data: company };
}

async function linkOrCreateEmployee(args: {
  adminClient: NonNullable<ReturnType<typeof createAdminClient>>;
  companyId: string;
  userId: string;
  fullName: string;
  email: string;
}) {
  const { adminClient, companyId, userId, fullName, email } = args;
  const { data: matchingEmployees, error: employeeLookupError } = await adminClient
    .from("employees")
    .select("id, user_id")
    .eq("company_id", companyId)
    .ilike("email", email);

  if (employeeLookupError) {
    return { error: employeeLookupError.message };
  }

  const availableEmployee = (matchingEmployees ?? []).find((employee) => !employee.user_id);
  if (availableEmployee) {
    const { error } = await adminClient
      .from("employees")
      .update({ user_id: userId })
      .eq("company_id", companyId)
      .eq("id", availableEmployee.id);

    if (error) {
      return { error: error.message };
    }

    return { data: { linked: true, created: false } };
  }

  if ((matchingEmployees ?? []).some((employee) => employee.user_id)) {
    return { data: { linked: false, created: false } };
  }

  const { error } = await adminClient.from("employees").insert({
    company_id: companyId,
    user_id: userId,
    full_name: fullName,
    email,
    is_active: true,
  });

  if (error) {
    return { error: error.message };
  }

  return { data: { linked: true, created: true } };
}

export async function POST(request: Request) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: "Signup is not configured. Set SUPABASE_SERVICE_ROLE_KEY first." },
      { status: 500 },
    );
  }

  const parsed = signupSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid signup details." }, { status: 400 });
  }

  const fullName = parsed.data.fullName.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;

  const companyResult = await getDefaultCompany(adminClient);
  if (companyResult.error || !companyResult.data) {
    return NextResponse.json({ error: companyResult.error || "Could not prepare company setup." }, { status: 500 });
  }

  const companyId = companyResult.data.id;
  const { data: existingAppUser, error: existingAppUserError } = await adminClient
    .from("users")
    .select("id")
    .eq("company_id", companyId)
    .ilike("email", email)
    .maybeSingle();

  if (existingAppUserError) {
    return NextResponse.json({ error: existingAppUserError.message }, { status: 400 });
  }

  if (existingAppUser) {
    return NextResponse.json({ error: "An app user already exists for this email. Try logging in instead." }, { status: 400 });
  }

  const { data: createdAuthUser, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (authError || !createdAuthUser.user) {
    return NextResponse.json({ error: authError?.message || "Could not create auth user." }, { status: 400 });
  }

  const authUserId = createdAuthUser.user.id;
  const { data: appUser, error: appUserError } = await adminClient
    .from("users")
    .insert({
      company_id: companyId,
      auth_user_id: authUserId,
      full_name: fullName,
      email,
      role: "employee",
      status: "active",
    })
    .select("id")
    .single();

  if (appUserError || !appUser) {
    await adminClient.auth.admin.deleteUser(authUserId);
    return NextResponse.json(
      { error: appUserError?.message || "Your account was created, but we could not finish app setup. Please contact support." },
      { status: 400 },
    );
  }

  const employeeResult = await linkOrCreateEmployee({
    adminClient,
    companyId,
    userId: appUser.id,
    fullName,
    email,
  });

  if (employeeResult.error) {
    return NextResponse.json(
      {
        ok: true,
        warning: `Signup succeeded, but employee linking was skipped: ${employeeResult.error}`,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    employeeCreated: employeeResult.data?.created ?? false,
    employeeLinked: employeeResult.data?.linked ?? false,
  });
}
