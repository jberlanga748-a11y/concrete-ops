import { Buffer } from "node:buffer";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(candidate: string | null, fallback: string) {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return fallback;
  }

  return candidate;
}

function decodeCookieValue(value: string) {
  if (!value.startsWith("base64-")) {
    return value;
  }

  const encoded = value.slice("base64-".length);
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function isPasswordRecoveryCallback(request: NextRequest) {
  if (request.nextUrl.searchParams.get("type") === "recovery") {
    return true;
  }

  const codeVerifierCookies = request.cookies
    .getAll()
    .filter(({ name }) => name.endsWith("-code-verifier") || /-code-verifier\.\d+$/.test(name))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (codeVerifierCookies.length === 0) {
    return false;
  }

  return codeVerifierCookies.some(({ value }) => decodeCookieValue(value).includes("/PASSWORD_RECOVERY"));
}

export async function GET(request: NextRequest) {
  const isRecoveryFlow = isPasswordRecoveryCallback(request);
  const code = request.nextUrl.searchParams.get("code");
  const successFallback = isRecoveryFlow ? "/reset-password" : "/login";
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"), successFallback);

  if (!code) {
    const missingCodeUrl = request.nextUrl.clone();
    missingCodeUrl.pathname = isRecoveryFlow ? "/forgot-password" : "/login";
    missingCodeUrl.search = "";

    if (isRecoveryFlow) {
      missingCodeUrl.searchParams.set("error", "missing_code");
    }

    return NextResponse.redirect(missingCodeUrl);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = error ? (isRecoveryFlow ? "/forgot-password" : "/login") : nextPath;
  redirectUrl.search = "";

  if (error && isRecoveryFlow) {
    redirectUrl.searchParams.set("error", "exchange_failed");
  }

  return NextResponse.redirect(redirectUrl);
}
