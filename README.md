# CreatorIQ

CreatorIQ is an editorial creator intelligence studio. Dashboard preview figures remain clearly labeled sample data; the Analytics and Creator DNA screens use imported Post records only. No in-memory substitute is used for persistent storage.

## Requirements and setup

- Node.js 20.19+ or 22.12+ and npm.
- A MongoDB Atlas cluster or local MongoDB instance for persistence.
- Run `npm install`, then copy `.env.example` to `.env`.
- Set `MONGODB_URI` to the connection string from Atlas (Database > Connect > Drivers) or your local MongoDB URI. Replace the Atlas username, password, and cluster host placeholders, URL-encoding special characters in the password. In Atlas, add your current IP under Network Access and create a database user with read/write access to the target database.
- Set `PORT=4000`, `VITE_API_URL=http://localhost:4000/api`, and `CORS_ORIGINS=http://localhost:5173`. `VITE_API_URL` and `CORS_ORIGINS` are public configuration, never secrets. Keep MongoDB credentials only in backend `MONGODB_URI`.

Start backend and frontend separately with `npm run server` and `npm run dev`, or together with `npm start`. The frontend uses `/api` through the Vite proxy when `VITE_API_URL` is unset. Health is available at `GET /api/health`; `persistence: true` means MongoDB is connected. Without a valid MongoDB URI, persistent endpoints return a database-unavailable error and do not report data as saved.

## Accounts and ownership

Creators register with an email and a password of at least 12 characters. Passwords are stored as salted scrypt hashes. Authentication uses an opaque, HttpOnly, same-site cookie (Secure in production), with a server-side MongoDB session and a CSRF token required for writes. `GET /api/auth/session` restores a session; `POST /api/auth/register`, `/api/auth/login`, and `/api/auth/logout` handle account actions. All creator/profile/post/analytics/import/hook/planner/experiment endpoints require authentication. Profiles belong to an Account and other records are scoped through the owned profile. Current observed CreatorIQ collections were empty before adding ownership, so no legacy-record migration was required for this workspace. Do not point this version at a database containing unowned legacy data without planning an ownership migration.

`CORS_ORIGINS` is a comma-separated exact-origin allowlist, for example `http://localhost:5173` locally or `https://studio.example.com` in production. Production refuses to start without it. Use the exact deployed frontend origin; wildcard origins are not supported with credentialed cookies. Deploy frontend and API over HTTPS so production cookies can use `SameSite=None; Secure` for cross-origin hosting. The existing unique profile-key index is preserved: each new profile uses its owner account ID as the key, allowing multiple accounts without dropping or rewriting that index.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.
- Authenticated `GET /api/profile`, `POST /api/profile`, `PATCH /api/profile` (the existing `POST /api/onboarding` is retained).
- `GET /api/posts?from=&to=&platform=&format=&topic=`, `GET /api/posts/:id`.
- `GET /api/analytics?range=7d|30d|all&platform=&format=&topic=` returns imported-post aggregates, coverage, comparisons, breakdowns, and evidence-based Creator DNA.
- `POST /api/posts/import/preview` and `POST /api/posts/import` with JSON `{ "csvText": "...", "mapping": { "publishedAt": "Date" } }`.
- `GET/POST /api/experiments`, `GET/PATCH /api/experiments/:id`.
- `POST /api/hooks/generate` runs deterministic, input-sensitive suggestions without an AI key; it adds directional evidence when enough imported format views are available.
- `GET/POST /api/planned-content`, `GET/PATCH/DELETE /api/planned-content/:id` manage creator-scoped planned content. This data is stored in MongoDB; API failures never show a successful save.
- Experiments support `name`, `hypothesis`, `objective`, `variable`, `variants: [{ name, description }]`, `startsAt`, `endsAt`, `status` (`draft`, `planned`, `active`, `completed`, `archived`), `postAssignments: [{ post, variant }]`, observations, conclusions, limitations, and a next-experiment note. Assignment references must be imported posts owned by the creator. Responses include calculated, descriptive variant metrics; manually entered conclusions remain separate.

## Creator tools

Hook Studio combines the saved creator profile inputs with deterministic templates and variation. Imported performance evidence is only used when enough comparable data exists; otherwise suggestions are marked exploratory. Copy, regenerate, and save-to-planner actions are available. A hook that cannot be persisted because MongoDB is unavailable is held in browser storage and explicitly labeled local-only until it can be saved.

Content Planner supports month calendar and list views, platform/status/topic/date filters, editing, deletion, dates, status, and experiment association. A `published` planning status only records the creator's planning state; it does not publish to a social network or create metrics.

Creator Lab lets creators define variants and lifecycle, connect imported posts to a variant, and review counts, metric coverage, engagement rate, and differences. Engagement rate uses the same formula as Analytics. Comparisons with fewer than three complete posts per variant are preliminary; missing metrics are excluded. Descriptive differences do not establish causation. Observations, conclusions, limitations, and next steps are manually entered and labeled separately.

## Analytics definitions

Engagement rate is `(likes + comments + shares + saves) / impressions × 100`. It is calculated only for posts with all four action metrics present and positive impressions; views are never substituted as the denominator. Per-metric totals and averages use only records reporting that metric and include coverage counts. Recent-versus-previous comparison is offered for bounded ranges and requires at least three measured posts in each period. Creator DNA labels comparisons below three complete posts per group as tentative and does not infer causation, audience demographics, or posting-time effects.

## CSV format

UTF-8 CSV with a header row. Required columns: `publishedAt`, `platform` (`Instagram` or `X`), `caption` (or `title`), and `format`. Optional columns: `topic`, `views`, `impressions`, `likes`, `comments`, `shares`, `saves`. Dates should be ISO 8601 (`2026-10-27` or `2026-10-27T14:30:00Z`); metric fields are non-negative whole numbers. Missing optional metrics remain absent. The import screen previews headers and row validation, allows column mapping, and reports imported and rejected rows. Identical normalized posts are deduplicated by a creator-scoped content fingerprint.

Run `npm test` for parser and model validation, analytics and experiment calculations, hook variation, planner CRUD/filtering, API responses, and unavailable-database behavior. Run `npm run build` for the frontend production build.

## Release readiness and deployment

### Verified local commands

- `npm start` is a local development convenience: it runs the Express API and the Vite development server together. It is not a production server command.
- `npm run server` starts the Express backend and reads the root `.env` via `dotenv/config`.
- `npm run dev` starts Vite for local development.
- `npm test` runs the Node test suite; `npm run build` creates the frontend production assets in `dist/`.

### Deployment configuration

This project has no provider-specific deployment file and has not been publicly deployed. The backend and frontend are separate at runtime: the backend command is `npm run server`; deploy the Vite `dist/` output as a static site with SPA fallback to `index.html`.

Configure these variables in the deployment environment; do not commit `.env`:

- Backend runtime: `MONGODB_URI` (private secret, scoped to the `creatorIQ` database), `PORT` (the port assigned by the host), `CORS_ORIGINS` (comma-separated exact deployed frontend origins), and `NODE_ENV=production`.
- Frontend build time: `VITE_API_URL=https://<your-api-host>/api`. This value is public and is compiled into the frontend during `npm run build`; it must point to the deployed HTTPS API, not localhost.

Build the frontend after setting `VITE_API_URL`, then publish `dist/`. Configure `CORS_ORIGINS` to the exact frontend origin and verify `GET /api/health` reports persistence. The health endpoint is public and does not prove account authorization. A local build is not a public deployment.

### Source control handoff

This workspace currently has no `.git` directory or GitHub remote. The root `.gitignore` excludes `.env*` and keeps `.env.example`; `node_modules/` and `dist/` are also ignored. To create a fresh, honest repository after reviewing the workspace contents:

```powershell
git init
git status --short
git add .
git status --short
git diff --cached --stat
git commit -m "Build CreatorIQ creator intelligence studio"
git branch -M main
git remote add origin <your-new-GitHub-repository-url>
git push -u origin main
```

Create the GitHub repository first. Confirm `.env` is absent from staged files before committing (`git check-ignore -v .env`). This creates a truthful first commit; do not recreate or claim earlier history. If Git metadata appears before then, stop and inspect that repository rather than initializing over it.

### QA record

Latest local QA: `npm test` passed 51/51; `npm run build` succeeded with the existing >500 kB bundle advisory; full `npm audit` found 0 vulnerabilities. Against the configured MongoDB API, a disposable account was registered, invalid login rejected, valid login and session restoration passed, a temporary profile was created/read/updated with Settings fields, logout succeeded, protected access after logout returned 401, and the exact temporary account/profile/session records were cleaned up. Earlier real MongoDB checks also verified CSV import, Planner and experiment persistence with cleanup. Tests cover anonymous denial, CSRF, CORS allowlist acceptance/rejection, password hashing and invalid credentials, and owner-scoped resource lookup. The browser accessibility view confirmed the sign-in form is rendered at the existing frontend route; deeper interactive UI checks and physical mobile viewport emulation still require a manual browser pass. No public URL or hosting provider is configured.

## Demo video outline (about 4 minutes)

1. **0:00–0:30 — Studio overview:** introduce CreatorIQ and point out which dashboard values are labeled sample data.
2. **0:30–1:00 — Onboarding:** choose X or Instagram, enter a niche and audience, set followers and objective; show validation briefly.
3. **1:00–1:40 — Import and Analytics:** use a sanitized CSV, show the column preview and imported row count, then open Analytics. Explain that missing metrics remain missing.
4. **1:40–2:10 — Creator DNA:** show the evidence and sample-size caveats; distinguish measured facts from tentative patterns.
5. **2:10–2:50 — Hook Studio:** enter a topic/audience, generate and regenerate a set, and explain exploratory versus performance-informed suggestions.
6. **2:50–3:20 — Content Planner:** save a selected hook, set a date/status, then switch between list and calendar.
7. **3:20–3:50 — Creator Lab:** create a named hypothesis with variants, associate imported posts, and point out preliminary/missing-data warnings and manually entered conclusions.
8. **3:50–4:05 — Honest close:** show the local API health state and state whether a public deployment exists. Do not show credentials, identifiable creator data, or claim social publishing is connected.

Before recording, replace any real creator details with consented or sanitized data. The public deployment, GitHub repository, demo recording, and official submission form remain external handoff tasks.
