#!/usr/bin/env node
// Grants or revokes the platform admin role. This script is the only way to become an admin:
// the role cannot be set through sign-up, profile edits or any API call made with a user session.
//
// Usage:
//   pnpm admin:grant --email person@example.com --by "your name" [--note "why"]
//   pnpm admin:grant --email person@example.com --revoke
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (read from .env.local if present).

import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values } = parseArgs({
  options: {
    email: { type: "string" },
    by: { type: "string" },
    note: { type: "string" },
    revoke: { type: "boolean", default: false },
  },
});

function fail(message) {
  console.error(`grant-admin: ${message}`);
  process.exit(1);
}

const email = values.email?.trim().toLowerCase();
if (!email) fail("--email is required.");
if (!values.revoke && !values.by?.trim()) fail("--by is required when granting (who approved it).");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) fail("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserId(address) {
  const perPage = 200;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) fail(`Could not list users (${error.code ?? error.status ?? "unknown"}).`);
    const match = data.users.find((user) => user.email?.toLowerCase() === address);
    if (match) return match.id;
    if (data.users.length < perPage) return null;
  }
}

const userId = await findUserId(email);
if (!userId) fail(`No account with email ${email}.`);

if (values.revoke) {
  const { error } = await supabase.from("platform_admins").delete().eq("user_id", userId);
  if (error) fail(`Could not revoke (${error.code}).`);
  console.log(`Admin role revoked for ${email}.`);
} else {
  const { error } = await supabase.from("platform_admins").insert({
    user_id: userId,
    granted_by: values.by.trim(),
    note: values.note?.trim() || null,
  });
  if (error?.code === "23505") {
    console.log(`${email} is already an admin.`);
  } else if (error) {
    fail(`Could not grant (${error.code}).`);
  } else {
    console.log(`Admin role granted to ${email}.`);
  }
}
