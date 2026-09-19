# Edge Functions — not implemented yet

Empty on purpose. Per the phased roadmap:

- **Phase 2** — `daily-reminder`, `missed-day-nudge`, `weekly-digest`
  (scheduled via `pg_cron`, push through `expo-notifications` + email via
  Resend/Supabase SMTP).
- **Phase 4** — `ai-coach`: routes to either the Gemini Enterprise Agent
  Platform agent (default) or a user's own API key/endpoint
  (`ai_settings` table), decrypting credentials from Supabase Vault only
  inside the function.

See the project plan for the full design.
