• Current State

  - Marketing site, onboarding, and localization plumbing are in place in src/app/page.tsx:1 with polished UI, motion effects, and useI18n hooks.
  - Learner experience covers authentication, enrollments, and progress dashboards (src/app/dashboard/page.tsx:1) backed by Drizzle + Postgres schemas (src/db/postgres-
    schema.ts:1) and Better Auth (src/lib/auth.ts:1).
  - Admin surface spans course/catalog management, media pipelines, analytics, and payments (src/app/admin/**, src/app/api/admin/**); API routes already call S3/MediaConvert
    helpers (src/lib/aws-config.ts, src/lib/mediaconvert-utils.ts).
  - Payments hooks into Stripe (src/lib/stripe.ts / /api/stripe) and there’s groundwork for quizzes, lesson materials, and video asset tracking (videoAssets, videoOutputs
    tables).

  Gaps & Risks

  - Data fetching often issues N+1 calls (e.g., /api/courses loops across modules/lessons rather than joining) and lacks caching, which will inflate costs under load.
  - No automated tests, linting gates, or observability baselines; migration scripts mix SQLite and Postgres targets, increasing deployment risk.
  - AI capabilities are placeholders—no conversation tutoring, adaptive assessments, or content recommendation engines yet.
  - Video pipeline depends on MediaConvert but lacks orchestration, retry policies, or lifecycle cost controls (storage tiers, CDN invalidations).
  - Infrastructure IaC / CI pipelines are absent; environment secrets and multitenant isolation aren’t defined.

  Proposed Roadmap

  - Phase 0 (Foundation): finalize schema ownership (single Postgres path), add Drizzle migrations, seed data, and integration tests; harden auth flows and RBAC; clean up API
    performance hotspots and add rate limiting/caching (CloudFront, Redis/Upstash).
  - Phase 1 (MVP Launch): finish learner flows (course discovery, lesson player with HLS, progress sync, quizzes, certificates), smooth admin CMS workflows, integrate Stripe
    billing tiers, and polish marketing funnel/SEO.
  - Phase 2 (Intelligent Learning): build AI tutor chat (LLM + RAG on lesson transcripts), adaptive placement tests, spaced-repetition practice, pronunciation scoring, and
    personalized course recommendations.
  - Phase 3 (Scale & Differentiation): community features (live cohorts, discussion, peer review), analytics dashboards for learners/teachers, multilingual support, and
    marketplace for human tutors with scheduling/payment splits.

  AWS Deployment & Cost Strategy

  - Host Next.js via AWS App Runner or Lambda@Edge (Next.js Serverless build) fronted by CloudFront for global caching; use S3 + CloudFront for static/video assets with
    lifecycle policies (INTELLIGENT_TIERING → GLACIER).
  - Aurora Serverless v2 (Postgres) or RDS Proxy with autoscaling for the relational workload; add Planetscale-like read replicas later if needed.
  - Step Functions or EventBridge + Lambda to coordinate MediaConvert jobs, S3 ingestion, thumbnail extraction, and status updates; auto-expire intermediate files.
  - Use Cognito or continue Better Auth with secure secret storage (SSM Parameter Store) and WAF on API Gateway/CloudFront.
  - Centralized logging/metrics via CloudWatch, AWS X-Ray, and budget alarms; adopt Graviton instances/Lambdas where possible.
  - CI/CD through GitHub Actions → AWS CodeDeploy/App Runner with preview environments; IaC (Terraform/CDK) for reproducible infra and cost visibility.

  Enhanced UX & AI Feature Ideas

  - AI study coach: conversational practice in Lingala with real-time cultural/contextual feedback, powered by fine-tuned LLM + speech-to-text.
  - Adaptive pathways: dynamic lesson sequencing based on quiz outcomes, watch history, and goals; auto-generated micro-lessons for weak spots.
  - Interactive transcripts with bilingual toggles, vocabulary decks, and pronunciation playback.
  - Social learning: live group sessions, cohort challenges, leaderboards, and community Q&A with AI-assisted moderation.
  - Teacher co-pilot: assist instructors in generating lesson outlines, quizzes, and feedback summaries from uploaded videos.
  - Mobile-first progressive web app with offline lesson caching and push reminders.

  Next Inputs Needed

  1. What existing video/tutor content formats do we need to ingest (raw MP4, YouTube, Zoom recordings)?
  2. Do you have preferred AI providers or compliance constraints (e.g., must stay on AWS Bedrock vs OpenAI/Anthropic)?
  3. Target launch timeline and budget range for initial AWS spend?
  4. Should we support additional languages alongside Lingala from day one?
  5. Any partnerships/licensing requirements that influence user accounts, payments, or content rights?

  • Phase 0 Focus (Functional First)

  - Finalize Locale Support
      - Extend src/lib/i18n.tsx to load English/French namespaces per route.
      - Persist language toggle in cookie, sync with user profile setting on login.
      - Audit marketing, learner, and admin screens to remove hard-coded copy; move strings into locale files.
      - Tag course/module/lesson records with a sourceLanguage field so catalog and dashboards show the right content.
  - Data & API Stabilization
      - Commit to Postgres-only schema (clean up leftover SQLite definitions, verify Drizzle migrations).
      - Optimize key routes—/api/courses, /api/enrollments, /api/progress—by batching/joining queries to eliminate N+1 calls and add pagination/caching metadata.
      - Add zod validation for request/response payloads plus integration tests for bilingual course listings and enrollment flows.
  - Authentication & Organizations
      - Harden Better Auth configuration (refresh tokens, password rules, email verification flow).
      - Introduce organization entities (tables for organizations, members, seats, and subscriptions).
      - Implement organization-aware dashboards and admin access checks; update /api/admin/** to enforce RBAC consistently.
  - Media Pipeline MVP
      - Implement Lambda/worker stub that can be invoked to submit MediaConvert jobs and update status fields (full automation can evolve later).
      - Document manual steps for now (e.g., triggering MediaConvert) so videos can be delivered during Phase 0.
  - User Experience Polish
      - Ensure learner dashboard, progress tracking, quizzes, and course discovery work end-to-end in both languages.
      - Add placeholder/test content for Lingala lessons targeted at English vs French speakers to prove segregation.
      - Review admin tools (course builder, analytics) for critical gaps and make sure they respect language-specific content.
  - Observability & Safeguards
      - Add structured logging and error boundaries for major flows (auth, payments, media).
  Sequencing

  1. Localization expansion + content tagging.
  2. Schema consolidation and API performance fixes.
  3. Auth/organization model and UI updates.
  4. Media upload + processing scaffold.
  5. UX polish and bilingual content verification.
  6. Logging/monitoring hooks and budget alarm setup.

  We’ll revisit CI/CD (GitLab runner, Terraform pipeline, automated deploys) right after the app is fully functional and ready for staging. Let me know if you’d like a
  detailed checklist or ticket breakdown for these items, or if you want to adjust the sequencing.