# AI Feature Pattern

This app uses a consistent pattern for AI-assisted features so prompts, validation, grounding, and UI behavior stay predictable.

## Prompts

- Prompt text lives in `lib/ai/prompts.ts`.
- Prompts should keep outputs concise, office-ready, and grounded in user-provided or database-backed context.
- Prompts must explicitly forbid invented facts when the feature is rewrite-only or grounded Q&A.

## Route Structure

- AI routes live under `app/api/ai/*/route.ts`.
- Each route follows the same flow:
  1. Validate the request with Zod.
  2. Build a narrow input context for the model.
  3. Call the OpenAI Responses API.
  4. Extract text from the response.
  5. Safely parse JSON output.
  6. Validate parsed output with Zod.
  7. Return a typed JSON payload or a consistent error.
- Grounded routes, such as Admin Ops Copilot, must fail closed if required source queries fail or citations do not resolve against the grounded snapshot.

## Shared Helpers

- Server helpers live in `lib/ai/route-helpers.ts`.
- Client transport helpers live in `lib/ai/client.ts`.
- Keep helpers small:
  - server helpers for response extraction, upstream error extraction, and safe JSON parsing
  - client helpers for repeated request/response plumbing only
- Do not move route-specific schemas, prompts, or feature messaging into shared helpers unless multiple features truly need the same behavior.

## Client Integration Pattern

- Keep validation and UX copy inside the form or card component.
- Use the shared client helper to avoid duplicating `fetch` and `response.json().catch(...)`.
- Keep loading state local to the surface that triggered the assistant.
- Show success and failure feedback using the existing page pattern:
  - toast-driven surfaces for Daily Report, Proposal Scope, and Admin Ops Copilot
  - inline form notice for Change Order

## Testing Expectations

- Route tests should cover:
  - invalid request payloads
  - malformed or non-JSON model output
  - schema validation failures
  - grounded data failures for grounded assistants
  - unresolved citations for grounded assistants
- UI tests should cover key failure paths and user feedback for assistant actions.

## Verification

Run from `concrete-ops-ai-starter`:

```bash
npm run test
npm run typecheck
npm run build
```

## Next.js Proxy Note

- Next.js 16 deprecates the `middleware.ts` file convention in favor of `proxy.ts`.
- This repo now uses `proxy.ts` at the app root while keeping the existing `updateSession` logic in `utils/supabase/middleware.ts`.
- The utility filename can stay as-is for now because the deprecation warning is triggered by the root file convention, not by the helper module name.
