## Architecture

- Next.js 15 App Router + React 19, deployed on private server via Nginx + PM2 (**no Docker**)
- i18n via `next-intl` with route-based `/[lang]/` prefix (zh/en)
- shadcn/ui components are **copied into source**, not npm-installed — use `npx shadcn-ui add`
- SQLite + Drizzle ORM (`better-sqlite3`); run `PRAGMA foreign_keys = ON` at connection start
- Redis via Upstash (`@upstash/redis`) for rate limiting, session drafts, and export queues

## Database Conventions

- All tables use soft-delete: `is_active` boolean, never hard-delete rows with FK references
- `admin.is_initialized = false` means no admin exists yet — first visitor sees a registration form, not a login
- `topic.politeness_level` is an enum of 1, 2, 3 (L1/L2/L3) — never expose these labels to end users

## Key Business Logic

- **Random distribution engine**: Fisher-Yates shuffle with constraints — must return exactly 15 topics per round, with 1 topic per active `ai_model` and 3 topics per `politeness_level` (L1/L2/L3). If the pool is insufficient, return HTTP 503.
- **Session persistence**: drafts stored in `IndexedDB` client-side + Redis server-side. On refresh, restore from `localStorage` `round_id` to avoid re-shuffling.
- **Device fingerprinting**: canvas + WebGL + timezone + random salt → SHA-256 → `device_fingerprint`
- **Rate limiting**: Redis key `rate:{ip}:{date}`, max 5 rounds/day per IP; return 429 on exceed
- **Data export sanitization**: replace `session_id` with `ANON_{hash}`, strip IP and fingerprint fields before export

## Admin Routes

- `/admin` — auth gate; first-visit registration flow when admin table is empty
- `/admin/ai` — CRUD for AI model labels (hidden from end users)
- `/admin/topics` — Markdown editor (TipTap) with auto-save (500ms debounce), JSON batch import/export
- `/admin/dimensions` — drag-to-reorder (`@dnd-kit`), bilingual (zh/en), max 10 dimensions
- `/admin/stats` — accordion tree: AI → politeness level → dimension → star distribution bar chart (Recharts)

## Report Export

- PDF: `@react-pdf/renderer`, A4 portrait, NotoSansCJK font subset for Chinese glyphs
- Web: standalone HTML + inline CSS, zipped, browser-openable with interactive expand/collapse
- JSON: follows the schema defined in the design spec section 六.4

---

## 🚫 CRITICAL: AI Agent Rules

### 1. Todolist Restriction
When you are instructed to build this project, you **MUST ONLY** use the phases defined below. You are **FORBIDDEN** from creating your own todolist, inventing new phases, reordering phases, or merging/splitting phases. Copy the phase structure exactly as defined. Do not think independently about task decomposition — follow this plan.

### 2. Stop-and-Report Protocol
After completing **EVERY** phase (all steps within that phase), you **MUST**:
1. Stop all work immediately
2. Report to the human what was completed in that phase
3. Summarize any issues or decisions made
4. **Wait for explicit human approval** before starting the next phase
5. Do NOT proceed to the next phase until the human says "continue", "approved", "next phase", or similar explicit confirmation

### 3. No Docker
This project explicitly forbids Docker. Use Nginx + PM2 for deployment. Never generate Dockerfile, docker-compose.yml, or any containerization files.

---

# 📋 Implementation Phases

---

## Phase 0: Project Scaffolding & Environment Configuration

### Step 0.1 — Create Next.js 15 Project
- Run `npx create-next-app@latest politeai --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Ensure `next@15` and `react@19` in `package.json`
- Verify dev server starts with `npm run dev`

### Step 0.2 — Install Dependencies
- **Core**: `drizzle-orm better-sqlite3 zod react-hook-form @hookform/resolvers`
- **UI**: `tailwindcss@3.4+ tailwind-merge clsx class-variance-authority`
- **i18n**: `next-intl`
- **Editor**: `@tiptap/react @tiptap/starter-kit @tiptap/extension-markdown @tiptap/pm`
- **Redis**: `@upstash/redis`
- **Charts**: `recharts`
- **Drag**: `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities`
- **Animation**: `framer-motion`
- **Auth**: `bcryptjs` (for password hashing)
- **PDF**: `@react-pdf/renderer`
- **Other**: `uuid`, `archiver` (for ZIP), `js-sha256`
- **Dev**: `drizzle-kit @types/better-sqlite3 @types/uuid @types/bcryptjs`

### Step 0.3 — Create `.env.local` from Template
- Create `.env.local` with these keys (empty values for now):
  - `DATABASE_URL=./data/politeai.db`
  - `UPSTASH_REDIS_REST_URL=`
  - `UPSTASH_REDIS_REST_TOKEN=`
  - `AUTH_SECRET=` (random 64-char hex)
  - `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- Create `.env.local.example` with same keys but no values, for reference

### Step 0.4 — Initialize shadcn/ui
- Run `npx shadcn-ui@latest init` (select: TypeScript, Tailwind v4 "no", CSS variables "yes", `src/styles`, `@/lib/utils`, components in `@/components/ui`)
- Install these shadcn components: `button`, `input`, `label`, `checkbox`, `card`, `badge`, `dialog`, `toast` (sonner), `tooltip`, `dropdown-menu`, `select`, `table`, `toggle`, `separator`, `accordion`, `switch`, `progress`, `breadcrumb`, `avatar`, `alert-dialog`
- Verify `components.json` exists and `src/lib/utils.ts` has `cn` utility

### Step 0.5 — Create Directory Structure
Create the following empty directories:
```
src/
  app/
    [lang]/
      (routes)/    → all user-facing pages go here
      admin/       → admin pages (no [lang] prefix)
    api/
      export/
      auth/
  components/
    ui/            → shadcn components (already exists)
    user/          → user-facing components
    admin/         → admin components
    shared/        → shared between user & admin
  lib/
    db/
    redis/
    auth/
    i18n/
    utils/
  data/            → SQLite DB file location (gitignored)
  dictionaries/    → i18n JSON files
public/
  fonts/
```

### Step 0.6 — Configure TypeScript Path Aliases
- Verify `tsconfig.json` has `"@/*": ["./src/*"]` path alias
- Add `"@/data/*": ["./src/data/*"]` if not present

### Step 0.7 — Git Initialization & .gitignore
- Run `git init`
- Create `.gitignore` ensuring: `node_modules/`, `.next/`, `*.db`, `data/`, `.env.local`, `.env`
- Initial commit of scaffold

---

## Phase 1: Database Schema, Migration & Seed Data

### Step 1.1 — Configure Drizzle
- Create `src/lib/db/index.ts`:
  - Import `drizzle` from `drizzle-orm/better-sqlite3`
  - Import Database from `better-sqlite3`
  - Create connection with `PRAGMA foreign_keys = ON`
  - Export `db` instance

### Step 1.2 — Define All Drizzle Schemas
- Create `src/lib/db/schema/admin.ts`:
  - `id`: text (PK, uuid), `username`: text (UNIQUE, NOT NULL), `password_hash`: text (NOT NULL), `is_initialized`: integer (0/1, DEFAULT 0), `created_at`: text (ISO8601, DEFAULT current timestamp)

- Create `src/lib/db/schema/ai-model.ts`:
  - `id`: text (PK, uuid), `custom_name`: text (UNIQUE, NOT NULL), `is_active`: integer (0/1, DEFAULT 1), `created_at`: text

- Create `src/lib/db/schema/topic.ts`:
  - `id`: text (PK, uuid), `ai_model_id`: text (FK → ai_model.id, NOT NULL), `politeness_level`: integer (NOT NULL, CHECK 1-3), `content_md`: text (NOT NULL, DEFAULT ''), `is_active`: integer (0/1, DEFAULT 1), `created_at`: text

- Create `src/lib/db/schema/dimension.ts`:
  - `id`: text (PK, uuid), `title_cn`: text (NOT NULL), `title_en`: text (NOT NULL), `desc_cn`: text (NOT NULL, DEFAULT ''), `desc_en`: text (NOT NULL, DEFAULT ''), `max_score`: integer (DEFAULT 5), `sort_order`: integer (DEFAULT 0), `is_active`: integer (0/1, DEFAULT 1), `created_at`: text

- Create `src/lib/db/schema/session.ts`:
  - `id`: text (PK, uuid), `device_fingerprint`: text (NOT NULL), `ip_hash`: text (NOT NULL), `round_id`: text (NOT NULL), `status`: text (DEFAULT 'active'), `last_updated`: text

- Create `src/lib/db/schema/submission.ts`:
  - `id`: text (PK, uuid), `session_id`: text (FK → session.id, NOT NULL), `topic_id`: text (FK → topic.id, NOT NULL), `dimension_id`: text (FK → dimension.id, NOT NULL), `score`: integer (NOT NULL, CHECK 1-5), `note_md`: text (DEFAULT ''), `submitted_at`: text (ISO8601)
  - Add composite UNIQUE constraint on `(session_id, topic_id, dimension_id)`

- Create `src/lib/db/schema/index.ts`: re-export all schemas, export type aliases

### Step 1.3 — Create Drizzle Config
- Create `drizzle.config.ts` at project root:
  - `schema: "./src/lib/db/schema/*.ts"`
  - `out: "./drizzle"`
  - `dialect: "sqlite"`
  - `dbCredentials: { url: "./data/politeai.db" }`

### Step 1.4 — Run Migration & Test
- Create `data/` directory (empty, `.gitkeep` or handled by script)
- Run `npx drizzle-kit generate` (generates SQL migration files in `./drizzle/`)
- Run `npx drizzle-kit push` (applies schema to SQLite)
- Write a test script `src/lib/db/seed-test.ts` that:
  - Inserts one row into each table
  - Reads them back
  - Cleans up
  - Logs success/failure
- Run the test with `npx tsx src/lib/db/seed-test.ts`
- Delete the test script after success

### Step 1.5 — Seed Default Dimensions
- Create `src/lib/db/seed.ts`:
  - Seed 5 default dimensions (sort_order 0-4, is_active=1):
    1. 可读性 / Readability — 文本是否流畅易懂
    2. 准确性 / Accuracy — 信息是否准确无误
    3. 自然度 / Naturalness — 表达是否自然不机械
    4. 礼貌度 / Politeness — 语气是否尊重得体
    5. 完整性 / Completeness — 回答是否完整全面
- Run `npx tsx src/lib/db/seed.ts`
- Add `"db:seed": "tsx src/lib/db/seed.ts"` to `package.json` scripts

### Step 1.6 — Add DB Scripts to package.json
```json
"db:generate": "drizzle-kit generate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio",
"db:seed": "tsx src/lib/db/seed.ts",
"db:migrate": "drizzle-kit generate && drizzle-kit push"
```
- Test `npm run db:migrate` runs successfully

---

## Phase 2: Authentication System (Admin Registration + Login)

### Step 2.1 — Redis Client Setup
- Create `src/lib/redis/index.ts`:
  - Import `Redis` from `@upstash/redis`
  - Create singleton client reading from `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
  - Export `redis` instance

### Step 2.2 — Password Hashing Utility
- Create `src/lib/auth/password.ts`:
  - `hashPassword(plain: string): Promise<string>` — uses `bcryptjs` with salt rounds 12
  - `verifyPassword(plain: string, hash: string): Promise<boolean>` — uses `bcryptjs.compare`

### Step 2.3 — Session Token Utility
- Create `src/lib/auth/session.ts`:
  - `createSessionToken(): string` — generates 64-char hex random string
  - `setSessionCookie(token: string): string` — returns HttpOnly cookie header string (Secure in prod, SameSite=Lax, path=/, maxAge=86400)
  - `clearSessionCookie(): string` — returns expired cookie header

### Step 2.4 — Admin Registration API
- Create `src/app/api/auth/register/route.ts`:
  - POST handler
  - Check DB: if `admin` table has any row with `is_initialized = 1`, return 403 `{ error: "Already initialized" }`
  - Validate `username` (min 3 chars) and `password` (min 8 chars) with zod
  - Hash password, insert row with `is_initialized = 1`
  - Create session: store token in Redis `auth:{token}` with `{ username, createdAt }`, EX 86400
  - Return 200 with Set-Cookie header

### Step 2.5 — Admin Login API
- Create `src/app/api/auth/login/route.ts`:
  - POST handler
  - Check Redis `login:block:{ip}` — if exists and value >= 5, return 429 `{ error: "Too many attempts", retryAfter: seconds }`
  - Find admin by username, verify password with bcryptjs
  - On failure: increment Redis `login:block:{ip}` counter, EX 900 (15 min); return 401
  - On success: delete Redis block key, create session token, set cookie, return 200

### Step 2.6 — Auth Verification Middleware (API)
- Create `src/lib/auth/guard.ts`:
  - `verifyAuth(request: NextRequest): Promise<{ authenticated: boolean; username?: string }>`
  - Read `auth_token` cookie from request
  - Look up `auth:{token}` in Redis
  - If found, extend TTL and return authenticated; else return false

### Step 2.7 — Admin Layout
- Create `src/app/admin/layout.tsx`:
  - Server component that checks auth cookie
  - If not authenticated, redirect to `/admin/login`
  - Render sidebar (`w-64`, fixed left) with navigation links:
    - `/admin/ai` — AI模型管理
    - `/admin/topics` — 题目管理
    - `/admin/dimensions` — 维度管理
    - `/admin/stats` — 数据统计
  - Right content area (`flex-1 ml-64`)
  - Top breadcrumb + user menu dropdown (退出登录)
  - Use `@/components/admin/Sidebar` and `@/components/admin/TopBar`

### Step 2.8 — Admin Login Page
- Create `src/app/admin/login/page.tsx`:
  - Check DB: if no admin with `is_initialized = 1` exists, redirect to `/admin/register`
  - Render login form (username + password) using react-hook-form + zod
  - POST to `/api/auth/login`
  - On success, redirect to `/admin/ai`
  - On error, show toast with message
  - On 429, show countdown timer with remaining seconds

### Step 2.9 — Admin Registration Page
- Create `src/app/admin/register/page.tsx`:
  - Check DB: if admin with `is_initialized = 1` exists, redirect to `/admin/login`
  - Render registration form (username + password + confirm password)
  - POST to `/api/auth/register`
  - On success, redirect to `/admin/ai`
  - On error, show toast

### Step 2.10 — Logout API
- Create `src/app/api/auth/logout/route.ts`:
  - DELETE `auth:{token}` from Redis
  - Set expired cookie
  - Redirect to `/admin/login`

---

## Phase 3: Internationalization (i18n) & Shared UI Layout

### Step 3.1 — Create Dictionary Files
- Create `src/dictionaries/zh.json`:
  ```json
  {
    "common": {
      "language": "中文",
      "switchLang": "Switch to English"
    },
    "home": {
      "title": "AI礼貌性评估实验",
      "subtitle": "您的每一次评分都在帮助AI变得更礼貌",
      "privacy": "本实验完全匿名，不会收集任何个人身份信息",
      "startButton": "开始实验"
    },
    "rules": {
      "title": "评分规则说明",
      "step1": "阅读AI输出",
      "step2": "逐维度评分",
      "step3": "提交反馈",
      "agreeCheckbox": "我已阅读并理解评分规则",
      "nextButton": "开始评分",
      "warning": "请先确认已阅读规则",
      "dimensionLabels": {
        "readability": "可读性",
        "accuracy": "准确性",
        "naturalness": "自然度",
        "politeness": "礼貌度",
        "completeness": "完整性"
      }
    },
    "rate": {
      "progress": "第 {current} / {total} 题",
      "draftSaved": "草稿已自动保存",
      "draftOffline": "当前离线，恢复连接后将自动同步",
      "submitButton": "提交评分",
      "emptyWarning": "请完成所有维度的评分后再提交",
      "ratingLabels": ["极差", "较差", "一般", "良好", "优秀"],
      "previous": "上一题",
      "next": "下一题"
    },
    "submit": {
      "thankYou": "您的反馈已记录，感谢参与！",
      "contributionBadge": "本轮评分已贡献",
      "editToggle": "编辑修改笔记",
      "editWarning": "确定要修改吗？修改后将重新提交。",
      "newRound": "再参与一轮",
      "viewReport": "结束并查看报告",
      "wordLimit": "已超过500字限制",
      "confirmTitle": "确认修改",
      "confirmDesc": "确定要修改已提交的内容吗？"
    },
    "errors": {
      "rateLimit": "已达到今日评分上限（5轮），请明天再来",
      "insufficientTopics": "题库不足，请联系管理员补充题目",
      "generic": "发生错误，请刷新页面重试"
    }
  }
  ```

- Create `src/dictionaries/en.json` with equivalent English translations

### Step 3.2 — Configure next-intl
- Create `src/i18n/request.ts`:
  - `getRequestConfig` from `next-intl/server`
  - Import dictionaries dynamically based on `requestLocale`
  - Default locale: `zh`

- Create `src/i18n/routing.ts`:
  - Define `routing` with `locales: ['zh', 'en']`, `defaultLocale: 'zh'`
  - Export `getPathname`, `Link`, `redirect`, `usePathname`, `useRouter` from `next-intl/routing`

- Create `src/middleware.ts`:
  - `createMiddleware` from `next-intl/middleware`
  - Apply to all routes except `/admin`, `/api`, `/static`, `/_next`
  - Detect `Accept-Language` header for auto-language selection on first visit

### Step 3.3 — Root Layout with i18n
- Create `src/app/[lang]/layout.tsx`:
  - `NextIntlClientProvider` wrapping children
  - Import and pass messages for current locale
  - Set `html` lang attribute

- Update `src/app/layout.tsx` to handle the `[lang]` routing correctly

### Step 3.4 — LanguageSwitcher Component
- Create `src/components/shared/LanguageSwitcher.tsx`:
  - Client component
  - Globe icon + dropdown with zh/EN options
  - Uses `useRouter` and `usePathname` from next-intl to switch without full reload
  - Preserves current route parameters

### Step 3.5 — Shared UI Components
- Create `src/components/shared/LoadingSpinner.tsx` — centered spinner with Tailwind animate-spin
- Create `src/components/shared/ErrorDisplay.tsx` — error message card with retry button
- Create `src/components/shared/EmptyState.tsx` — empty state with icon + message

### Step 3.6 — Navigation Configuration
- Update `next.config.ts` to handle i18n route rewrites if needed
- Verify `/[lang]/` routing works with `npm run dev`
  - Visit `http://localhost:3000/zh` and `http://localhost:3000/en`
  - Both should render successfully

---

## Phase 4: User-Facing Pages (Welcome + Rules)

### Step 4.1 — Welcome Page
- Create `src/app/[lang]/(routes)/page.tsx`:
  - Full-screen centered layout (`min-h-screen flex flex-col items-center justify-center`)
  - LanguageSwitcher in top-right corner (absolute positioned)
  - Hero section: `<h1>` with `home.title`, `<p>` with `home.subtitle` and `home.privacy`
  - StartButton: large rounded button with `hover:translate-y-[-2px]` and `hover:shadow-lg` transitions
  - On click: navigate to `/[lang]/rules`
  - Loading state: button disabled + spinner while navigating
  - Auto-detect `navigator.language` on first visit using a client component wrapper

### Step 4.2 — Rules Page — StepFlow Component
- Create `src/components/user/StepFlow.tsx`:
  - Horizontal 3-step flow: Read → Rate → Submit
  - Each step: circle icon + short label + connecting line
  - `framer-motion` `AnimatePresence` for auto-cycling highlight animation (3s interval)
  - Current step: filled circle with primary color, previous steps: checkmark
  - Responsive: stack vertically on mobile

### Step 4.3 — Rules Page — CriteriaCards Component
- Create `src/components/user/CriteriaCards.tsx`:
  - Grid of 5 cards (one per dimension from seed data)
  - Each card: dimension title + brief description
  - On hover: Tooltip component showing full dimension description
  - Cards use `bg-white border rounded-lg p-4 shadow-sm hover:shadow-md`

### Step 4.4 — Rules Page Assembly
- Create `src/app/[lang]/(routes)/rules/page.tsx`:
  - Left column (desktop): StepFlow
  - Right column (desktop): CriteriaCards
  - Bottom fixed bar: CheckboxAgree + NextButton
  - Mobile: stack all vertically
  - CheckboxAgree: `<label>` with checkbox input, stores state in `localStorage`
  - NextButton: disabled (`opacity-50 cursor-not-allowed`) when unchecked
  - On unchecked click: show toast with `rules.warning` message
  - On checked click: navigate to `/[lang]/rate`
  - On mount: restore checkbox state from `localStorage`

### Step 4.5 — Toast Configuration
- Configure Sonner toast in root layout
- Position: bottom-right
- Duration: 3000ms
- Ensure toasts work with i18n messages

---

## Phase 5: Rating Engine Core (Random Distribution + Redis Drafts + Device Fingerprinting)

### Step 5.1 — Device Fingerprinting Utility
- Create `src/lib/utils/fingerprint.ts` (client-side utility):
  - `generateDeviceFingerprint(): Promise<string>`:
    1. Render hidden canvas with random text → extract pixel data hash
    2. Read WebGL renderer string (if available)
    3. Read `Intl.DateTimeFormat().resolvedOptions().timeZone`
    4. Generate random salt (store in `localStorage` key `__fp_salt`, reuse on subsequent calls)
    5. Concatenate all components → SHA-256 using `js-sha256`
    6. Return hex string
  - Export as client-only module (use `"use client"` directive or document it)

### Step 5.2 — Random Distribution Engine
- Create `src/lib/engine/distribution.ts`:
  - `async function generateRound(aiModelIds: string[], topicsPerLevel: number = 3): Promise<{ topics: Topic[], roundId: string, error?: string }>`
  - Algorithm:
    1. Query all active topics from DB
    2. Group by `ai_model_id`
    3. Validate: need at least N AI models (where N = number of active AI models)
    4. Per AI model: select 1 random topic (Fisher-Yates shuffle to randomize)
    5. Ensure politeness_level distribution: exactly 3 of L1, 3 of L2, 3 of L3 across the selections
    6. If constraints can't be met → return error with status 503
    7. Generate `roundId = uuid()`
    8. Return `{ topics: selectedTopics[], roundId }`
  - Handle edge case: fewer active AI models than needed (minimum 15 active AI models with balanced levels needed)

### Step 5.3 — Redis Draft Storage
- Create `src/lib/redis/drafts.ts`:
  - `saveDraft(roundId: string, data: { currentIndex: number, ratings: Record<string, number> }): Promise<void>`
    - Store as JSON in key `draft:{roundId}`, EX 3600
  - `getDraft(roundId: string): Promise<DraftData | null>`
    - Read and parse JSON, extend TTL on read
  - `deleteDraft(roundId: string): Promise<void>`
    - Delete key when round is submitted
  - `saveRound(roundId: string, topics: Topic[]): Promise<void>`
    - Store topic sequence as JSON in key `round:{roundId}`, EX 3600
  - `getRound(roundId: string): Promise<Topic[] | null>`
    - Read topic sequence, extend TTL

### Step 5.4 — Rate Limiting Middleware
- Create `src/lib/redis/rate-limit.ts`:
  - `async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number; resetAtMs: number }>`
  - Key pattern: `rate:{ip}:{YYYY-MM-DD}`
  - Increment counter, get current value
  - If first increment, set EX to seconds until end of day
  - Max 5 rounds/day
  - Return remaining count and reset timestamp

### Step 5.5 — Session Management
- Create `src/lib/db/session-manager.ts`:
  - `async function createSession(fingerprint: string, ipHash: string, roundId: string): Promise<string>`
    - Insert into `session` table, return session ID
  - `async function getSession(sessionId: string): Promise<Session | null>`
    - Query by ID
  - `async function updateSessionStatus(sessionId: string, status: 'active' | 'completed'): Promise<void>`

### Step 5.6 — Write Unit Tests for Engine
- Create `src/lib/engine/__tests__/distribution.test.ts`:
  - Test: balanced pool (exactly 15 topics, 3 L1/3 L2/3 L3 across 15 AI models) returns all 15
  - Test: unbalanced pool returns error
  - Test: empty pool returns error
  - Test: Round ID is unique per call
  - Test: Shuffle is deterministic-ish (topics are shuffled, not returned in DB order)

- Run tests with `npx vitest run` (install vitest if needed)

---

## Phase 6: Rating Workbench UI + Rate Limiting Integration

### Step 6.1 — Rating API Route
- Create `src/app/api/rate/start/route.ts`:
  - POST handler
  - Extract IP from `x-forwarded-for` or `request.headers`
  - Check rate limit via Redis: if exceeded, return 429 with `errors.rateLimit` message
  - Generate device fingerprint on client (send via request body)
  - Call `generateRound()` from distribution engine
  - If error (503), return `{ error: "insufficient_topics", message: errors.insufficientTopics }`
  - Save `round:{roundId}` to Redis with topic sequence
  - Create session in DB
  - Return `{ roundId, topics: [{ id, content_md, ai_model_id, politeness_level }] }`

### Step 6.2 — ProgressBar Component
- Create `src/components/user/ProgressBar.tsx`:
  - Props: `current: number, total: number`
  - Display: `{current} / {total}` text label
  - Gradient progress bar (`bg-gradient-to-r from-primary to-primary-foreground`)
  - Animated width transition using Tailwind `transition-all duration-300`
  - Sticky position at top of page (`sticky top-0 z-10`)

### Step 6.3 — AIOutputCard Component
- Create `src/components/user/AIOutputCard.tsx`:
  - Props: `content: string` (Markdown), `isExpanded: boolean`
  - Light gray background (`bg-gray-50 dark:bg-gray-800`)
  - Monospace font (`font-mono`)
  - Render Markdown using a simple markdown-to-HTML renderer (or TipTap static render)
  - Toggle expand/collapse button for long content (> 300 chars)
  - Maximum height when collapsed (with gradient fade at bottom)
  - Scrollable when expanded

### Step 6.4 — RatingGrid Component
- Create `src/components/user/RatingGrid.tsx`:
  - Props: `dimensions: Dimension[], ratings: Record<string, number>, onRate: (dimId: string, score: number) => void`
  - 5 rows (one per active dimension from DB)
  - Each row:
    - Left: dimension title (current language) + subtitle/description
    - Right: 5 clickable squares (1-5)
    - Current selection: filled with primary color
    - Hover: tooltip showing rating label (极差/较差/一般/良好/优秀)
    - Click: highlight selected square, un-highlight others in row
  - Use `react-hook-form` with zod for validation (all 5 must be selected)
  - Keyboard accessible (Tab + Enter to select)

### Step 6.5 — DraftIndicator Component
- Create `src/components/user/DraftIndicator.tsx`:
  - Semi-transparent watermark in bottom-right corner (`fixed bottom-4 right-4 opacity-50`)
  - Text: `rate.draftSaved` message
  - Pulse animation when saving
  - When offline: show `rate.draftOffline` in red

### Step 6.6 — IndexedDB Client-Side Draft Storage
- Create `src/lib/client/drafts.ts` (use client):
  - `openDB(): Promise<IDBDatabase>` — open/create IndexedDB
  - `saveLocalDraft(roundId: string, data: DraftData): Promise<void>`
  - `getLocalDraft(roundId: string): Promise<DraftData | null>`
  - `deleteLocalDraft(roundId: string): Promise<void>`
  - `hasLocalDraft(roundId: string): Promise<boolean>`
  - Handle errors gracefully (return null on failure, don't throw)

### Step 6.7 — Offline Detection
- Create `src/components/shared/OfflineBanner.tsx`:
  - Uses `window.addEventListener('online'/'offline')`
  - Shows yellow banner at top when offline
  - Auto-dismisses when back online
  - Triggers IndexedDB → Redis sync on reconnection

### Step 6.8 — Rating Page Assembly
- Create `src/app/[lang]/(routes)/rate/page.tsx`:
  - Server component that fetches active dimensions from DB
  - Client component wrapper for interactive rating
  - **On mount (client)**:
    1. Check `localStorage` for existing `roundId`
    2. If found: fetch round from Redis via API, restore current index and ratings
    3. If not found: call `/api/rate/start` to get new round
    4. Generate device fingerprint
    5. Save `roundId` to `localStorage`
  - **State**: `currentIndex`, `ratings` (Record<topicId, Record<dimId, number>>), `topics[]`, `submittedTopics[]`
  - **Render**: ProgressBar, AIOutputCard (current topic), RatingGrid (for current topic), DraftIndicator
  - **Navigation**: Previous/Next buttons at bottom
  - **Auto-save**: Save to both IndexedDB (every change) and Redis (debounced 2s)
  - **SubmitBtn**: enabled only when ALL topics have ALL dimensions rated
  - **On submit**: POST to `/api/rate/submit` with all ratings, redirect to `/[lang]/submit`
  - **Edge case**: Browser back button → restore state from IndexedDB
  - **Edge case**: 429 error → show toast and disable interaction
  - **Edge case**: 503 error → show error message with admin contact info

---

## Phase 7: Submission Flow & Notes Editor

### Step 7.1 — Submit API Route
- Create `src/app/api/rate/submit/route.ts`:
  - POST handler
  - Receive `{ sessionId, roundId, submissions: [{ topicId, dimensionId, score }] }`
  - Validate all required fields with zod
  - Use Drizzle transaction: insert all submissions
  - Delete Redis `draft:{roundId}` and `round:{roundId}`
  - Update session status to 'completed'
  - Clear rate limit key (reset for this round's consumption logic if needed)
  - Return 200 with `{ success: true, sessionId }`

### Step 7.2 — Notes Update API Route
- Create `src/app/api/rate/notes/route.ts`:
  - PATCH handler
  - Receive `{ sessionId, topicId, dimensionId, note_md }`
  - Update submission row (find by composite key)
  - Return 200

### Step 7.3 — TipTap Editor Component
- Create `src/components/shared/MarkdownEditor.tsx`:
  - Client component wrapping TipTap
  - Toolbar: Bold, Italic, Bullet List, Ordered List, Blockquote, Horizontal Rule, Undo, Redo
  - Word count display (bottom-right of editor area)
  - Red text warning when > 500 characters
  - `onUpdate` callback with debounced save (500ms)
  - Styling: match Tailwind prose classes, border, rounded

### Step 7.4 — Submit Page — ThankYouBlock Component
- Create `src/components/user/ThankYouBlock.tsx`:
  - Centered check icon (green circle)
  - Thank you message (i18n)
  - Contribution badge showing round number

### Step 7.5 — Submit Page — ToggleEditor Component
- Create `src/components/user/ToggleEditor.tsx`:
  - Switch component to toggle editor visibility
  - When on: expand TipTap editor below with smooth animation
  - When off: collapse with animation

### Step 7.6 — Submit Page Assembly
- Create `src/app/[lang]/(routes)/submit/page.tsx`:
  - Top: ThankYouBlock
  - Middle: ToggleEditor wrapping MarkdownEditor
  - Bottom: two buttons side by side
    - "再参与一轮" (primary): clears local drafts, generates new roundId, navigates to `/rate`
    - "结束并查看报告" (secondary): navigates to a thank-you/goodbye or clear data page
  - **ConfirmDialog**: when user tries to modify notes, show AlertDialog "确定要修改吗？修改后将重新提交。"
  - On notes save: call `/api/rate/notes` PATCH
  - Clear IndexedDB drafts + localStorage `roundId` after successful submit

---

## Phase 8: Admin — AI Model Management

### Step 8.1 — AI Model List Page
- Create `src/app/admin/ai/page.tsx`:
  - Server component fetching all `ai_model` rows from DB
  - Top: "新建AI" button
  - Table with columns: 名称 (custom_name), 创建时间 (created_at), 状态 (is_active badge: 启用/归档), 操作 (编辑/删除)
  - Active models: green badge, archived: gray badge
  - Wrap in admin layout (sidebar + top bar from Phase 2)

### Step 8.2 — Create AI Modal
- Create `src/components/admin/AICreateDialog.tsx`:
  - Dialog with form: name input + save button
  - Zod validation: name required, 1-50 chars, no duplicates (check DB)
  - POST to `/api/admin/ai` on submit
  - On success: close dialog, refresh list via `router.refresh()`
  - On duplicate: show toast error

### Step 8.3 — Edit AI Modal
- Create `src/components/admin/AIEditDialog.tsx`:
  - Same as create but pre-filled with existing name
  - PATCH to `/api/admin/ai/[id]`
  - Inline edit: click edit button on row → dialog opens

### Step 8.4 — Delete AI (Soft-Delete)
- Create `src/components/admin/AIDeleteDialog.tsx`:
  - AlertDialog with input field: user must type "确认" to enable delete button
  - Soft-delete: sets `is_active = 0`
  - DELETE `/api/admin/ai/[id]` (actually PATCH to soft-delete)
  - Show warning: "归档后该AI的题目将不会出现在用户评分池中"

### Step 8.5 — AI CRUD API Routes
- Create `src/app/api/admin/ai/route.ts`:
  - GET: list all AI models (with `is_active` filter support)
  - POST: create new AI model (validate uniqueness)

- Create `src/app/api/admin/ai/[id]/route.ts`:
  - PATCH: update name or soft-delete (`is_active`)
  - DELETE: not implemented (use PATCH for soft-delete)

- All routes protected by auth guard from Phase 2

---

## Phase 9: Admin — Topics Management

### Step 9.1 — Topics List Page
- Create `src/app/admin/topics/page.tsx`:
  - Server component fetching topics with joined `ai_model.custom_name`
  - Filter controls: by AI model, by politeness level (L1/L2/L3), by active/archived
  - Card grid layout (3 columns desktop, 1 column mobile)
  - Each card: politeness badge, AI model label, Markdown preview (truncated 150 chars), is_active toggle
  - Top bar: "新建题目" button, "导入JSON" button, "导出JSON" button

### Step 9.2 — Topic Create/Edit Dialog
- Create `src/components/admin/TopicEditorDialog.tsx`:
  - Dialog with TipTap editor (from Phase 7, reuse MarkdownEditor)
  - AI model selector (dropdown, data source: active AI models)
  - Politeness level selector: three radio buttons L1 / L2 / L3
  - Preview toggle: switch between editing and rendered Markdown view
  - Auto-save: 500ms debounce, saves to DB via API
  - Word count display

### Step 9.3 — Topic CRUD API Routes
- Create `src/app/api/admin/topics/route.ts`:
  - GET: list topics with filters (ai_model_id, politeness_level, is_active)
  - POST: create topic (validates FK to ai_model)

- Create `src/app/api/admin/topics/[id]/route.ts`:
  - PATCH: update content, politeness_level, or soft-delete
  - DELETE: not implemented (soft-delete via PATCH)

- Create `src/app/api/admin/topics/export/route.ts`:
  - GET: export all active topics as JSON (id, ai_model_id, politeness_level, content_md)
  - Response: `{ exported_at, version, topics: [...] }`

- Create `src/app/api/admin/topics/import/route.ts`:
  - POST: accept JSON array, validate schema, bulk insert
  - Show detailed error on validation failure (which row failed, why)

### Step 9.4 — Batch Import/Export UI
- Create `src/components/admin/TopicExportButton.tsx`:
  - Downloads JSON file via `/api/admin/topics/export`
  - File name: `topics-export-{YYYY-MM-DD}.json`

- Create `src/components/admin/TopicImportButton.tsx`:
  - File picker dialog (`.json` only)
  - Parse and validate before sending to API
  - Show progress bar during import
  - Show summary: `{ created: 10, failed: 2, errors: [...] }`

---

## Phase 10: Admin — Dimensions Management

### Step 10.1 — Dimensions List Page
- Create `src/app/admin/dimensions/page.tsx`:
  - Server component fetching dimensions ordered by `sort_order`
  - "添加维度" button at top (disabled if count >= 10, with tooltip "最多支持10个维度")
  - Vertical list using `@dnd-kit/sortable` for drag-to-reorder
  - **Each row (horizontal)**:
    - Drag handle (grip icon, leftmost)
    - CN title input (`<input>`) + EN title input (`<input>`)
    - CN description textarea + EN description textarea
    - Preview area: 5-star squares (1-5), updates in real-time based on `max_score`
    - Active toggle switch
    - Delete button (unless it's the last remaining dimension)
  - Maximum 10 dimensions enforced (UI + server-side validation)

### Step 10.2 — Drag-to-Reorder Implementation
- Use `@dnd-kit/core` with `DndContext` and `SortableContext`
- On drag end: update `sort_order` for affected items
- Save new order to DB via API
- Optimistic UI update (move visual position immediately, rollback on error)

### Step 10.3 — Dimensions API Routes
- Create `src/app/api/admin/dimensions/route.ts`:
  - GET: list dimensions ordered by `sort_order`
  - POST: create dimension (validate max 10 limit)

- Create `src/app/api/admin/dimensions/[id]/route.ts`:
  - PATCH: update individual fields or soft-delete

- Create `src/app/api/admin/dimensions/reorder/route.ts`:
  - PATCH: receive `[{ id, sort_order }]`, batch update sort_order in transaction
  - Validate all IDs exist, no gaps in sort_order

### Step 10.4 — Real-Time Preview
- Create `src/components/admin/DimensionPreview.tsx`:
  - 5 clickable squares (dynamically 1 to `max_score` configurable)
  - Current highlight reflects `max_score` setting
  - Purely visual, no interaction needed in admin context
  - Updates reactively as `max_score` input changes

---

## Phase 11: Admin — Statistics Dashboard

### Step 11.1 — Stats API Routes
- Create `src/app/api/admin/stats/summary/route.ts`:
  - GET: return `{ totalSessions, totalSubmissions, totalRounds, latestActivity }`
  - Query aggregations from DB

- Create `src/app/api/admin/stats/tree/route.ts`:
  - GET: return accordion tree data (first level: AI names)
  - Query: group submissions by ai_model, politeness_level, dimension
  - Include average scores per dimension per level per AI

- Create `src/app/api/admin/stats/distribution/[dimId]/route.ts`:
  - GET: for a specific dimension, return star distribution `{ 1: count, 2: count, 3: count, 4: count, 5: count }`
  - Filterable by ai_model_id and politeness_level

### Step 11.2 — SummaryCards Component
- Create `src/components/admin/SummaryCards.tsx`:
  - 3 cards in a row (grid): 总用户数, 总提交轮次, 最新活跃时间
  - Each card: icon + label + large number
  - Fetch from `/api/admin/stats/summary`
  - Loading skeleton while fetching

### Step 11.3 — AccordionTree Component
- Create `src/components/admin/AccordionTree.tsx`:
  - **Level 1 (always visible)**: AI model name cards, click to expand
  - **Level 2 (on expand)**: L1 / L2 / L3 cards arranged horizontally, click to expand
  - **Level 3 (on expand)**: Dimension list showing name + average score (e.g., "可读性 3.8/5")
  - **Level 4 (on expand)**: Recharts bar chart showing 1-5 star distribution
  - Only one Level 1 item expanded at a time
  - Lazy load: fetch Level 2 data only when Level 1 is expanded
  - Framer-motion for expand/collapse animation

### Step 11.4 — StarDistributionChart Component
- Create `src/components/admin/StarDistributionChart.tsx`:
  - Recharts `<BarChart>` with:
    - X-axis: 1-5 stars
    - Y-axis: count
    - Bars: gradient colored (1=red, 2=orange, 3=yellow, 4=light-green, 5=green)
  - Tooltip showing exact count and percentage
  - Responsive container (`<ResponsiveContainer width="100%" height={200}>`)
  - Fetch data from `/api/admin/stats/distribution/[dimId]`

### Step 11.5 — Stats Page Assembly
- Create `src/app/admin/stats/page.tsx`:
  - Server component skeleton
  - Client component for interactive tree
  - Top: SummaryCards
  - Middle: AccordionTree
  - Right sidebar or top-right toolbar: Export buttons (placeholders, Phase 12 implements)
  - Loading states for each section
  - Empty state when no submissions exist: "暂无数据，请先进行用户评分收集"

---

## Phase 12: Report Export Module (PDF / Web / JSON)

### Step 12.1 — Shared ReportView Component
- Create `src/components/shared/ReportView.tsx`:
  - Props: `statsTree: StatsTreeData, summary: SummaryData`
  - Render order: Cover page → Experiment description (static) → Summary metrics → AI → Level → Dimension → Star distribution
  - Each section separated by `page-break-after` for PDF
  - Use Tailwind `@media print` classes:
    - Hide scrollbars
    - Force page breaks at section boundaries
    - Remove interactive hover effects in print
  - Client component (needed for interactivity in web export)

### Step 12.2 — Data Sanitization Utility
- Create `src/lib/export/sanitize.ts`:
  - `sanitizeSessionId(sessionId: string): string`
    - SHA-256 hash of sessionId, prefix with `ANON_`, take first 20 chars
    - Result: `ANON_{hash_truncated}`
  - `sanitizeExportData(rawData): SanitizedData`
    - Remove all `ip_hash` fields
    - Remove all `device_fingerprint` fields
    - Replace all `session_id` values with `sanitizeSessionId()`

### Step 12.3 — JSON Export
- Create `src/app/api/export/json/route.ts`:
  - GET handler (admin auth required)
  - Fetch all stats data (summary + tree + distributions)
  - Apply sanitization
  - Return JSON with schema:
    ```json
    {
      "meta": { "exported_at": "ISO8601", "format_version": "2.0" },
      "summary": { "total_users": number, "total_submissions": number },
      "tree": [{ "ai_name": string, "levels": [...] }],
      "dimension_distribution": [{ "dim_id": string, "title_en": string, "counts": { "1": n, "2": n, "3": n, "4": n, "5": n } }]
    }
    ```
  - Set headers: `Content-Type: application/json`, `Content-Disposition: attachment`

### Step 12.4 — PDF Export
- Create `src/app/api/export/pdf/route.ts`:
  - GET handler (admin auth required)
  - Use `@react-pdf/renderer` to render `<ReportView>` to PDF buffer
  - A4 portrait, page margins 20mm
  - Header: logo placeholder + export timestamp
  - Footer: page number / total pages
  - Embed NotoSansCJK font subset for Chinese characters:
    - Download or include `NotoSansSC-Regular.ttf` from `public/fonts/`
    - Register with `Font.register()`
  - Charts: convert Recharts SVG to embedded SVG in PDF
  - Return PDF blob with `Content-Type: application/pdf`

### Step 12.5 — Web Export (Standalone HTML)
- Create `src/app/api/export/web/route.ts`:
  - GET handler (admin auth required)
  - Render `<ReportView>` server-side to HTML string
  - Inline all CSS (extract Tailwind classes, compute styles)
  - Include minimal JS for expand/collapse interactivity (vanilla JS, no framework)
  - Package as standalone HTML file
  - Zip the HTML file using `archiver`
  - Return ZIP with `Content-Type: application/zip`

### Step 12.6 — Export Button Integration
- Update `src/app/admin/stats/page.tsx`:
  - Add ExportBar component with three buttons:
    - "导出 PDF" → calls `/api/export/pdf`, triggers download
    - "导出网页" → calls `/api/export/web`, triggers download
    - "导出 JSON" → calls `/api/export/json`, triggers download
  - Show loading spinner during export generation (PDF may take time)
  - Show toast on success/error

---

## Phase 13: Error Handling, Polish & Deployment

### Step 13.1 — Global Error Pages
- Create `src/app/[lang]/error.tsx`:
  - User-facing error boundary
  - Friendly message + retry button
  - Logs error to console (no Sentry/third-party)

- Create `src/app/admin/error.tsx`:
  - Admin-facing error boundary
  - "返回管理首页" button

- Create `src/app/not-found.tsx`:
  - 404 page with redirect to `/[defaultLocale]`

### Step 13.2 — API Error Handling
- Create `src/lib/api/errors.ts`:
  - `ApiError` class: `{ status: number, code: string, message: string }`
  - `handleApiError(error: unknown): NextResponse`
    - Catch Drizzle errors → 500
    - Catch Redis errors → 503
    - Catch validation errors → 400
    - Catch auth errors → 401

- Wrap all API routes with try/catch using this handler

### Step 13.3 — Loading States & Skeletons
- Review all pages and add:
  - Loading skeletons for server components (use React `<Suspense>`)
  - Skeleton components matching card/table shapes:
    - `src/components/shared/SkeletonCard.tsx`
    - `src/components/shared/SkeletonTable.tsx`
  - Toast loading for server actions (especially on `/rate` submit)

### Step 13.4 — SEO & Metadata
- Add metadata to all pages:
  - `src/app/[lang]/layout.tsx`: set default title template, description
  - Each page: override `title` for route-specific titles
  - `robots.ts`: disallow `/admin`, allow everything else
  - `sitemap.ts`: include all public routes with `[lang]` variants
  - OpenGraph basic tags

### Step 13.5 — Nginx Configuration
- Create `nginx/site.conf` (not applied by code, just documented):
  - Reverse proxy to `localhost:3000`
  - Gzip compression enabled
  - Static asset caching (`.next/static` with long expiry)
  - Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`
  - Rate limit zone for `/api/rate` (nginx-level, complementary to Redis)

### Step 13.6 — PM2 Configuration
- Create `ecosystem.config.js`:
  ```js
  module.exports = {
    apps: [{
      name: 'politeai',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' }
    }]
  };
  ```

### Step 13.7 — Build & Production Test
- Run `npm run build` — ensure zero build errors
- Run `npm run start` (production mode) — test all routes:
  - `http://localhost:3000/zh`
  - `http://localhost:3000/en`
  - `http://localhost:3000/zh/rules`
  - `http://localhost:3000/zh/rate`
  - `http://localhost:3000/admin`
- Verify DB writes work in production mode
- Verify Redis connection in production mode
- Run `npm run lint` — ensure zero lint errors
- Run `npx tsc --noEmit` — ensure zero type errors

### Step 13.8 — Final Checklist
- All `.env.local` values configured
- `npx drizzle-kit push` runs successfully
- `npm run db:seed` runs without errors
- All CRUD operations tested end-to-end
- Rate limiting verified (send >5 requests, expect 429)
- Device fingerprinting is deterministic for same device
- Session persistence works across page refreshes
- Data export produces valid JSON/PDF/HTML files
- Data sanitization removes IP and fingerprint from exports
- No Docker files exist in the project