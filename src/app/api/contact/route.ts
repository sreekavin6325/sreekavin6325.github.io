// Saves a contact-form message to Google Sheets.
//
// The form posts here; this route validates the message again on the server, then
// forwards it (with a shared secret) to a Google Apps Script web app bound to the
// sheet - see google-apps-script/contact-to-sheet.gs. The script appends the row and
// enforces the per-email limit, so the limit holds whatever browser someone uses.
//
// Needs, in .env.local (or the host's environment settings):
//   CONTACT_SHEET_URL     the Apps Script web-app URL (…/exec)
//   CONTACT_SHEET_SECRET  the same secret as SECRET in the script

import { NextResponse } from "next/server";
import { type ContactValues, TOPICS, validateContact } from "@/lib/contact";

type Result = { ok: true } | { ok: false; error: string; fields?: Record<string, string> };

const reply = (body: Result, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  const url = process.env.CONTACT_SHEET_URL;
  const secret = process.env.CONTACT_SHEET_SECRET;
  if (!url || !secret) return reply({ ok: false, error: "not_configured" }, 503);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return reply({ ok: false, error: "bad_request" }, 400);

  // Honeypot: a hidden field real visitors never fill in. Bots that do get a quiet "ok".
  if (typeof body.website === "string" && body.website.trim()) return reply({ ok: true });

  const values: ContactValues = {
    name: String(body.name ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    message: String(body.message ?? ""),
  };
  const errors = validateContact(values);
  if (Object.keys(errors).length) {
    return reply({ ok: false, error: "invalid", fields: errors as Record<string, string> }, 400);
  }
  const topic = TOPICS.includes(body.topic as (typeof TOPICS)[number]) ? String(body.topic) : TOPICS[0];

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Apps Script answers with a redirect to the result; fetch follows it.
      redirect: "follow",
      body: JSON.stringify({
        secret,
        topic,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        message: values.message.trim(),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;

    if (result?.ok) return reply({ ok: true });
    if (result?.error === "rate_limited") return reply({ ok: false, error: "rate_limited" }, 429);
    console.error("Contact sheet rejected the message:", response.status, result);
    return reply({ ok: false, error: "save_failed" }, 502);
  } catch (error) {
    console.error("Contact sheet unreachable:", error);
    return reply({ ok: false, error: "save_failed" }, 502);
  }
}
