# Referral Market (working name)

Marketplace where companies list subscription apps and creators earn recurring commission for customers they refer. Scope: `MARKETPLACE_BRIEF_I_PROMPTY.md`. Progress: `docs/IMPLEMENTATION_STATUS.md`.

Stack: Next.js 16 (App Router), React 19, TypeScript strict, Tailwind 4 + shadcn/ui, Supabase (Postgres, Auth, RLS), Zod, Vitest.

## Local setup

Requirements: Node 24+, pnpm 10, Docker (for the local Supabase stack).

```bash
pnpm install
pnpm db:start                 # local Supabase; applies migrations
cp .env.example .env.local    # fill in from: pnpm exec supabase status -o env
pnpm dev                      # http://localhost:3000
```

Confirmation and password-reset emails are caught by the local mail viewer (Mailpit) at http://127.0.0.1:54324.

Make someone an admin (there is no other way to get the role):

```bash
pnpm admin:grant --email person@example.com --by "your name" --note "reason"
```

## Checks

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
pnpm db:reset && pnpm db:advisors && pnpm test:integration   # needs pnpm db:start
```

`pnpm test` runs the migrations on in-process Postgres (PGlite) and checks RLS, grants and limits without Docker. The integration suite checks the same rules through the real Data API, plus concurrency.
