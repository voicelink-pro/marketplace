<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

- Source of truth for product scope: `MARKETPLACE_BRIEF_I_PROMPTY.md`. Progress: `docs/IMPLEMENTATION_STATUS.md`. Decisions (owner / proposal / technical): `docs/DECISIONS.md`.
- Work stage by stage. Do only the stage that was asked for.

## Commands

- `pnpm dev` / `pnpm build` / `pnpm lint` / `pnpm typecheck`
- `pnpm test` — unit tests and migration + RLS tests on PGlite (no Docker needed).
- `pnpm test:integration` — needs `pnpm db:start`; runs through the real Supabase Data API.
- `pnpm db:reset`, `pnpm db:advisors`, `pnpm db:types` — need the local Supabase stack.
- New migration: `pnpm exec supabase migration new <name>`.

## Rules that are easy to break

- Next 16 with `cacheComponents`: anything reading cookies or the session must render inside `<Suspense>`. Panel gates live in `src/components/layout/gates.tsx`.
- Session checks use `supabase.auth.getClaims()`, never `getSession()`, on the server. The proxy is `src/proxy.ts`.
- New tables are not exposed to the Data API automatically: enable RLS, write policies with `(select auth.uid())`, and grant only the needed columns to `authenticated`.
- Business writes that must be atomic or limited (organizations, memberships, apps) go through `security definer` functions with `set search_path = ''`. Helpers live in the `private` schema.
- Admin rights come only from `public.platform_admins`, granted with `pnpm admin:grant`. Never read roles from `user_metadata`.
- Money will be stored as `bigint` minor units and rates as basis points. No floats.
- Only `NEXT_PUBLIC_*` values may reach the browser. `SUPABASE_SECRET_KEY` is for scripts and tests.
- Log errors through `src/lib/log.ts` (code and message only, no payloads).
- UI: shadcn components from `src/components/ui`; forms use `FieldGroup`/`Field` and `useActionState` with `FormState` from `src/lib/forms.ts`. Empty modules show honest empty states, never sample numbers.
