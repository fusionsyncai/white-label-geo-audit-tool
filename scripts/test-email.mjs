// Standalone email send test. Uses the same Resend SDK + env vars as the app.
// Reads everything from process.env (no dotenv / hard-loading).
//
// Run (host): set -a; source .env; set +a; node scripts/test-email.mjs you@example.com
// Run (docker): docker compose exec web node scripts/test-email.mjs you@example.com
//
// Recipient: pass as argv[2], or set TEST_EMAIL_TO.
// NOTE: Without a verified Resend domain, Resend only delivers to your own
// account email — use that address while testing.

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from =
  process.env.EMAIL_FROM || "FusionSync AI <onboarding@resend.dev>";
const to = process.argv[2] || process.env.TEST_EMAIL_TO;

if (!apiKey) {
  console.error("✗ RESEND_API_KEY is not set in the environment.");
  process.exit(1);
}
if (!to) {
  console.error(
    "✗ No recipient. Usage: node scripts/test-email.mjs <to-email>  (or set TEST_EMAIL_TO)"
  );
  process.exit(1);
}

const resend = new Resend(apiKey);

console.log(`→ Sending test email`);
console.log(`  from: ${from}`);
console.log(`  to:   ${to}`);

const { data, error } = await resend.emails.send({
  from,
  to,
  subject: "GEO Report — test email",
  html: "<p>✅ This is a test email from the GEO Report Generator. If you can read this, Resend is working.</p>",
  text: "This is a test email from the GEO Report Generator. If you can read this, Resend is working.",
});

if (error) {
  console.error("✗ Send failed:");
  console.error(error);
  process.exit(1);
}

console.log("✓ Sent. Message id:", data?.id);
