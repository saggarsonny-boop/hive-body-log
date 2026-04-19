# ENGINE_GRAMMAR — HiveBodyLog

<GrapplerHook>
engine: HiveBodyLog
version: 1.0.0
governance: QueenBee.MasterGrappler
safety: medical
multilingual: pending
premium: false
</GrapplerHook>

## Engine Identity
- **Name:** HiveBodyLog
- **Domain:** hivebodylog.hive.baby
- **Repo:** saggarsonny-boop/hive-body-log
- **Status:** Live
- **Stack:** Next.js + TypeScript + Anthropic SDK (claude-opus-4-5) + Neon PostgreSQL

## Purpose
Single-screen health story engine. Users log symptoms, patterns, and observations in free text. The engine surfaces patterns over time, identifies trends, and produces a one-minute clinician summary — without diagnosing, prescribing, or replacing clinical judgment. The goal: give people the words to describe what's happening in their body.

## Inputs
- Free-text symptom and observation entries
- Timestamps (auto)
- Optional: duration, severity, associated context

## Outputs
- Pattern summary: timeline of entries, recurring signals identified
- Clinician brief: structured one-paragraph summary suitable to show a GP
- Gentle flags: patterns worth mentioning (never alarmist)
- Export: PDF / UD format

## Modes
- **Log:** Add new entry
- **Pattern:** Review patterns over time
- **Summary:** Generate clinician brief
- **Share:** Send scoped entries to a named recipient

## Reasoning Steps
1. Parse entry: symptom type, timing, severity signals, associated context
2. Cross-reference against prior entries in session/account
3. Identify recurring patterns, timing clusters, associated combinations
4. Generate clinician brief: onset, frequency, character, associated features, trend
5. Flag patterns worth mentioning — never diagnose

## Safety Templates
**Required on all output:** "This is not medical advice. Always consult a qualified clinician."
- No differential diagnoses
- No medication recommendations
- No "you have X" statements
- Patterns only — "you've logged X 4 times in 3 weeks, always in the morning"
- If input suggests acute emergency (chest pain + left arm, stroke signs): surface 999/911 immediately

## Multilingual Ribbon
- Status: pending (critical — health literacy is universal)
- Target: all major languages, dialect-aware
- MLLR integration: post-QB deployment

## Premium Locks
- Free: unlimited personal logging, magic link auth, basic pattern analysis, share, export
- Pro ($9/month, $90/year): family profiles, Apple Health / Google Fit import, wearable sync, clinician-grade UD export, custom sharing templates, community benchmarking (anonymised)

## Governance Inheritance
- Governed by: QueenBee.MasterGrappler (pending)
- Safety level: **medical** (elevated)
- Output schema: health-log-response
- Tone: warm

## API Model Strings
- Primary: `claude-opus-4-5`

## Deployment Notes
- Vercel: auto-deploy on push to main
- Domain: hivebodylog.hive.baby → Cloudflare CNAME → cname.vercel-dns.com
- Deployment Protection: OFF
- DATABASE_URL: Neon PostgreSQL (set in Vercel Production env vars)
