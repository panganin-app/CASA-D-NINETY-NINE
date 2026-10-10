# M0/M1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Native execution was chosen because the product owner explicitly instructed continuous, unsupervised M0/M1 execution (no per-task subagent review gate) in the governing prompt; this plan covers scaffolding/config work, not business logic, so task "tests" are build/lint/analyze/emulator checks rather than unit-test TDD cycles.

**Goal:** Lock requirement traceability artifacts (M0) and stand up a working, lint-clean, test-passing, CI-enforced monorepo skeleton for Flutter mobile, Next.js admin, Firebase Functions, shared contracts, design tokens, and the Firebase Emulator Suite (M1) — with zero business features yet.

**Architecture:** Monorepo per `docs/architecture/IMPLEMENTATION_STRUCTURE.md` §3. JS/TS side (`apps/admin`, `backend/functions`, `packages/contracts`) uses npm workspaces from repo root. Flutter (`apps/mobile`) is a separate toolchain, invoked via its own scripts. `packages/design_tokens/tokens.json` is the single source of truth, compiled into CSS variables (admin) and Dart constants (mobile) by a generator script — never hand-duplicated.

**Tech Stack:** Flutter/Dart (Riverpod, GoRouter) · Next.js/React/TypeScript (App Router) · Firebase (Auth, Firestore, Storage, Functions v2, FCM, App Check, Emulator Suite) · npm workspaces · ESLint/Prettier · Jest · `flutter_lints` · GitHub Actions.

**Spec:** `docs/product/CASA_DNINETY_NINE_PRD_v1.1.md`, `docs/architecture/IMPLEMENTATION_STRUCTURE.md` (§3, §6, §7 M0/M1, §8 CI/CD), `docs/product/CHANGE_REQUEST_CR-001_IPL_FEE.md`, `docs/product/CHANGE_REQUEST_CR-002_INTERNET_PAYMENT.md`, `packages/design_tokens/tokens.json`.

## Global Constraints

- No business logic, screens, or Firestore collections beyond what M0/M1 explicitly requires (deny-by-default rules skeleton only) — features start at M2.
- No secrets, service accounts, BCA account numbers, or DVR credentials committed anywhere (`.gitignore` must exclude env/credential files from the first commit).
- Development/staging/production must be structurally separable from M1 onward (`infra/environments/{development,staging,production}`), even though only `development` (emulator) is wired up now.
- Design tokens (`packages/design_tokens/tokens.json`) are the only source for color/spacing/radius/typography values; generated Dart/CSS artifacts are build outputs, not hand-edited.
- Roles are exactly `resident`, `committee`, `super_admin` (PRD §13.1) — any enum/contract created now must use these values verbatim.
- Firestore/Storage rules default-deny everything; no `allow read, write: if true;` anywhere, even temporarily.
- Every new app/package must have working format, lint, and test commands callable from CI non-interactively (no prompts).

## Review Focus

- A `firebase.json` or rules file that looks complete but was never run against the emulator — gate every rules change on an actual emulator test run, not a read-through.
- A design-token generator that silently drops a token category (e.g. `motion`, `elevation`) when consumers only check that *some* CSS variables appear — diff the generated output against every top-level key in `tokens.json`.
- A CI workflow that passes because a step is misconfigured to always exit 0 (e.g. `|| true` swallowing lint failures) — inspect exit codes, not just workflow YAML structure.
- A `.gitignore` written after the first `git add`, so a secret/credential/build artifact already entered history — order matters: `.gitignore` and `git init` before any `git add`.
- Root npm workspace install that "succeeds" only because one workspace's `package.json` has no real build/test script yet — verify each workspace's script actually exercises real tooling (tsc/eslint/jest), not a no-op placeholder.

---

### Task 1: Git repository, workspace root, and ignore rules

**Files:**
- Create: `.gitignore`
- Create: `package.json` (repo root, npm workspaces)
- Create: `.nvmrc` (or `.node-version`)
- Create: `docs/IMPLEMENTATION_PROGRESS.md`

**Interfaces:**
- Produces: npm workspaces list `["apps/admin", "backend/functions", "packages/contracts"]` that later tasks' `package.json` files join.

- [ ] **Step 1:** `git init` at repo root; confirm `git status` shows the existing docs/assets tree as untracked (nothing destructive — this is a brand-new repo).
- [ ] **Step 2:** Write `.gitignore` covering: `node_modules/`, `.dart_tool/`, `build/`, `.flutter-plugins*`, `*.iml`, `.firebase/`, `firebase-debug.log`, `firestore-debug.log`, `ui-debug.log`, `*.env`, `*.env.*`, `!*.env.example`, `*-service-account*.json`, `.DS_Store`, `.next/`, `coverage/`, `dist/`.
- [ ] **Step 3:** Write root `package.json` with `"private": true`, `"workspaces": ["apps/admin", "backend/functions", "packages/contracts"]`, and convenience scripts `lint`, `format`, `test`, `build` that fan out with `npm run <script> --workspaces --if-present`.
- [ ] **Step 4:** Create `docs/IMPLEMENTATION_PROGRESS.md` with a dated log header and an entry for this milestone (filled in at Task 9 after verification).
- [ ] **Step 5:** `git add -A -- .gitignore package.json .nvmrc docs/IMPLEMENTATION_PROGRESS.md` then verify `git status` shows no unexpected files staged.
- [ ] **Step 6:** Commit: `git commit -m "chore: initialize git repo and npm workspace root"`.

### Task 2: M0 traceability artifacts — ambiguity and change-request registers

**Files:**
- Create: `docs/product/AMBIGUITY_REGISTER.md`
- Create: `docs/product/CHANGE_REQUEST_REGISTER.md`
- Modify: `docs/product/REQUIREMENT_TRACEABILITY_MATRIX.md` (append implementation-status appendix, do not alter existing rows)

**Interfaces:**
- Produces: a documented list of open ambiguities later milestones must resolve via Change Request or Product Owner answer before touching the affected area (e.g. bundle ID, BCA account routing for internet vs IPL, due-date policy, expiring-soon threshold — all already flagged as "still required" in `INTERNET_PAYMENT_BLUEPRINT.md` §10).

- [ ] **Step 1:** Write `AMBIGUITY_REGISTER.md` listing each open item found while reading docs (mobile bundle ID/application ID placeholder, BCA account shared-vs-separate for internet, due-date policy, expiring-soon threshold, CCTV gateway endpoint/credentials, Firebase project IDs for staging/production) with status `OPEN` and the milestone that must close it.
- [ ] **Step 2:** Write `CHANGE_REQUEST_REGISTER.md` indexing CR-001 and CR-002 (id, date, summary, status `APPROVED`) and the CR template from PRD §38 for future entries.
- [ ] **Step 3:** Append a `## Implementation status (M0/M1)` section to `REQUIREMENT_TRACEABILITY_MATRIX.md` stating every requirement row is `NOT STARTED — pending M2+`, so no row is ever misread as done.
- [ ] **Step 4:** Commit: `git commit -m "docs: add ambiguity and change request registers, mark traceability status"`.

### Task 3: Shared contracts package (`packages/contracts`)

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/roles.ts`
- Create: `packages/contracts/src/ipl.ts`
- Create: `packages/contracts/src/internet.ts`
- Create: `packages/contracts/src/index.ts`
- Test: `packages/contracts/src/__tests__/contracts.test.ts`

**Interfaces:**
- Produces: `UserRole = 'resident' | 'committee' | 'super_admin'`; `IplBillStatus`, `IplPaymentStatus`; `InternetPackageId = 'INTERNET_25' | 'INTERNET_50' | 'INTERNET_100'`; `INTERNET_PACKAGE_CATALOG: Record<InternetPackageId, {speedLabel: string; price: number; durationValue: number; durationUnit: 'MONTH'}>` with the exact values from `INTERNET_PACKAGE_CATALOG.md`; `IPL_MONTHLY_AMOUNT = 100000`. Consumed by Task 4 (functions) and Task 5 (admin) via npm workspace `@casa/contracts`.

- [ ] **Step 1: Write the failing test** in `contracts.test.ts` asserting: `IPL_MONTHLY_AMOUNT === 100000`; `INTERNET_PACKAGE_CATALOG.INTERNET_25.price === 125000`, `.INTERNET_50.price === 180000`, `.INTERNET_100.price === 250000`; `Object.keys(INTERNET_PACKAGE_CATALOG)` has exactly those 3 keys; `UserRole` type-level values compile as `['resident','committee','super_admin']` via a `const roles: UserRole[] = [...]` sanity array.
- [ ] **Step 2:** `npm init -w packages/contracts` style `package.json` (`name: "@casa/contracts"`, `version: "0.1.0"`, `main`/`types` pointing at `dist`, `scripts.build: tsc`, `scripts.test: jest`), add `typescript`, `jest`, `ts-jest`, `@types/jest` as devDependencies.
- [ ] **Step 3:** Run the test to verify it fails (module not found).
- [ ] **Step 4: Implement** `roles.ts`, `ipl.ts`, `internet.ts` with the literal values from CR-001/CR-002/`INTERNET_PACKAGE_CATALOG.md` (no invented fields), and `index.ts` re-exporting all three.
- [ ] **Step 5:** Run the test to verify it passes.
- [ ] **Step 6:** Commit: `git commit -m "feat(contracts): add roles, IPL, and internet package catalog contracts"`.

### Task 4: Firebase Functions scaffold + Firestore/Storage rules skeleton + Emulator Suite

**Files:**
- Create: `backend/functions/package.json`, `backend/functions/tsconfig.json`, `backend/functions/.eslintrc.cjs`
- Create: `backend/functions/src/index.ts` (health-check callable only — no business functions yet)
- Test: `backend/functions/src/__tests__/index.test.ts`
- Create: `firebase/firebase.json`, `firebase/.firebaserc.example`
- Create: `firebase/firestore/firestore.rules`, `firebase/firestore/firestore.indexes.json`
- Create: `firebase/storage/storage.rules`
- Test: `firebase/firestore/tests/rules.test.ts`, `firebase/storage/tests/rules.test.ts`
- Create: `scripts/start-emulators.sh`

**Interfaces:**
- Consumes: `@casa/contracts` roles for rule comments/intent documentation only (rules themselves are declarative, not TS).
- Produces: emulator ports (Auth 9099, Firestore 8080, Storage 9199, Functions 5001, UI 4000) that Task 7 (CI) and Task 6 (admin/mobile local config) read.

- [ ] **Step 1:** Write `firestore.rules` and `storage.rules` as deny-by-default: `match /{document=**} { allow read, write: if false; }` — the explicit starting state the audit doc (`SECURITY_AUDIT.md` §16) requires before any collection-specific rule is added in M2+.
- [ ] **Step 2: Write the failing test** `rules.test.ts` (Firestore) using `@firebase/rules-unit-testing`: unauthenticated client attempts `get()` on an arbitrary doc path → expect `assertFails`; same for `storage` rules test on an arbitrary path → expect `assertFails`.
- [ ] **Step 3:** Write `firebase/firebase.json` with `firestore.rules`/`storage.rules` paths relative to `firebase/`, `functions.source: "../backend/functions"`, and `emulators` block (ports above, `singleProjectMode: true`); write `.firebaserc.example` with placeholder aliases `development`/`staging`/`production`.
- [ ] **Step 4:** Write `scripts/start-emulators.sh`: detect `JAVA_HOME` (fall back to `/Applications/Android Studio.app/Contents/jbr/Contents/Home` if `java` isn't on PATH) and exec `firebase emulators:start --config firebase/firebase.json --project demo-casa-dninetynine`.
- [ ] **Step 5:** Start emulators via the script in the background; run the two rules tests against the running Firestore/Storage emulators; verify both `assertFails` pass; stop emulators.
- [ ] **Step 6:** Scaffold `backend/functions/package.json` (`firebase-functions`, `firebase-admin`, `@casa/contracts` as a workspace dependency, `typescript`, `eslint`, `jest`), `tsconfig.json`, and `src/index.ts` exporting one trivial `onCall` health-check function (e.g. `ping` returning `{ ok: true }`) — a deliberately minimal placeholder so M1's "build succeeds" gate is real without inventing business functions.
- [ ] **Step 7:** Write and pass `index.test.ts` (unit test calling the wrapped handler directly, no emulator needed) asserting `ping` returns `{ ok: true }`.
- [ ] **Step 8:** Run `npm run build` and `npm run lint` in `backend/functions`; fix any errors.
- [ ] **Step 9:** Commit: `git commit -m "feat(backend): scaffold Cloud Functions, deny-by-default rules, and emulator suite"`.

### Task 5: Next.js Admin Web scaffold

**Files:**
- Create: `apps/admin/*` (generated by `create-next-app`, TypeScript + App Router + ESLint + Tailwind)
- Modify: `apps/admin/package.json` (add `@casa/contracts` workspace dep, test scripts)
- Create: `apps/admin/jest.config.ts`, `apps/admin/src/app/__tests__/page.test.tsx`
- Create: `apps/admin/README.md` (preserve existing content, extend with run instructions)

**Interfaces:**
- Consumes: `@casa/contracts` (Task 3) via `import { IPL_MONTHLY_AMOUNT } from '@casa/contracts'` — only used in a smoke test, not real UI yet.
- Produces: `apps/admin` dev server on `:3000`, consumed informally by later milestones' admin screens.

- [ ] **Step 1:** Move existing `apps/admin/README.md` aside, run `npx create-next-app@latest apps/admin --ts --app --eslint --tailwind --src-dir --import-alias "@/*" --use-npm --no-git`, then restore/merge the original README content plus new run instructions.
- [ ] **Step 2:** Add `"@casa/contracts": "*"` to `apps/admin/package.json` dependencies (resolved via workspace); add `jest`, `jest-environment-jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `ts-node` as devDependencies; add `"test": "jest"` script.
- [ ] **Step 2b: Write the failing test** `page.test.tsx`: render the default home page, assert it renders without throwing, and assert `IPL_MONTHLY_AMOUNT` imported from `@casa/contracts` equals `100000` (proves the workspace link works end-to-end).
- [ ] **Step 3:** Run the test to verify it fails (no jest config yet) or passes trivially; add `jest.config.ts` (next/jest preset) until the import + render assertion both genuinely execute.
- [ ] **Step 4:** Run `npm run lint`, `npm run build`, `npm test` inside `apps/admin`; fix errors.
- [ ] **Step 5:** Commit: `git commit -m "feat(admin): scaffold Next.js app wired to shared contracts"`.

### Task 6: Flutter Resident Mobile scaffold + design token generator

**Files:**
- Create: `apps/mobile/*` (generated by `flutter create`)
- Create: `apps/mobile/analysis_options.yaml`
- Create: `apps/mobile/lib/core/theme/casa_tokens.dart` (generated, not hand-edited — regenerate via script)
- Create: `apps/mobile/test/core/theme/casa_tokens_test.dart`
- Create: `scripts/generate-design-tokens.js`
- Create: `apps/admin/src/styles/tokens.css` (generated CSS variables, consumed by Tailwind theme)

**Interfaces:**
- Consumes: `packages/design_tokens/tokens.json` (read-only input).
- Produces: `CasaTokens` Dart class (e.g. `CasaTokens.colorBrandNavy`, `CasaTokens.spacing4`) used by later mobile UI milestones; CSS custom properties (`--color-brand-navy`, etc.) used by admin Tailwind theme.

- [ ] **Step 1:** Run `flutter create --org com.casadninetynine --project-name casa_resident apps/mobile` (document in `AMBIGUITY_REGISTER.md` from Task 2 that `com.casadninetynine` is a placeholder org pending final bundle ID decision before Phase 10 store submission); restore/merge the original `apps/mobile/README.md`.
- [ ] **Step 2:** Replace default `analysis_options.yaml` to include `package:flutter_lints/flutter.yaml` plus `prefer_single_quotes`, `always_declare_return_types`.
- [ ] **Step 3:** Write `scripts/generate-design-tokens.js`: reads `packages/design_tokens/tokens.json`, walks every leaf with a `$value`, and emits (a) `apps/mobile/lib/core/theme/casa_tokens.dart` with one static const per flattened token path, and (b) `apps/admin/src/styles/tokens.css` with one `--kebab-case` CSS variable per flattened token path. Fail loudly (non-zero exit) if any top-level key from `tokens.json` (`color`, `font`, `spacing`, `radius`, `elevation`, `motion`, `layout`) produces zero output entries — this is the "silently drops a category" failure mode from Review Focus.
- [ ] **Step 4: Write the failing test** `casa_tokens_test.dart`: assert `CasaTokens.colorBrandNavy == '#0B3568'` and `CasaTokens.spacing4 == 16.0` (parsed from `"16px"`).
- [ ] **Step 5:** Run `node scripts/generate-design-tokens.js`; run `flutter test apps/mobile/test/core/theme/casa_tokens_test.dart` to verify it passes; manually diff generated `tokens.css` against `tokens.json` top-level keys to confirm no category was dropped.
- [ ] **Step 6:** Run `flutter analyze` and `flutter test` for the whole `apps/mobile` project; fix errors.
- [ ] **Step 7:** Commit: `git commit -m "feat(mobile): scaffold Flutter app and generate design tokens for mobile and admin"`.

### Task 7: CI pipeline

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: every workspace's `lint`/`build`/`test` scripts (Tasks 3–6), `scripts/generate-design-tokens.js` (Task 6), `scripts/start-emulators.sh` (Task 4).

- [ ] **Step 1:** Write `ci.yml` triggered on `pull_request` and `push` to any branch, with jobs: (a) `js` — `actions/setup-node`, root `npm install`, `npm run generate:tokens`, `npm run format -- --check`, `npm run lint --workspaces --if-present`, `npm run build --workspaces --if-present`, `npm test --workspaces --if-present`; (b) `rules` — boot Firebase emulators (Firestore+Storage) in CI via `firebase-tools` + Java setup action, run the two rules tests from Task 4; (c) `mobile` — `subosito/flutter-action`, `flutter pub get`, `flutter analyze`, `flutter test`; (d) `secret-scan` — `gitleaks` action over the full history.
- [ ] **Step 2:** Add a root `"generate:tokens": "node scripts/generate-design-tokens.js"` script so CI and local dev call the same command.
- [ ] **Step 3:** Push nothing (no remote configured yet) — instead simulate each job's commands locally in the same order the workflow runs them, and confirm every one exits 0.
- [ ] **Step 4:** Commit: `git commit -m "ci: add format/lint/test/build/rules/secret-scan pipeline"`.

### Task 8: Environment separation scaffolding

**Files:**
- Create: `infra/environments/development/config.example.json`
- Create: `infra/environments/staging/config.example.json`
- Create: `infra/environments/production/config.example.json`
- Modify: `infra/environments/README.md` (document that real values live in a secret manager, never in these example files)

**Interfaces:**
- Produces: a documented, non-secret shape (`firebaseProjectId`, `appCheckMode: 'debug'|'enforced'`, `bcaConfigSource: 'secret-manager'`) that M3's actual BCA/App Check wiring will consume later — no real project IDs or account numbers exist yet.

- [ ] **Step 1:** Write the three `config.example.json` files with identical keys and environment-appropriate placeholder values (`development` → `appCheckMode: "debug"`, `staging`/`production` → `"enforced"`; `firebaseProjectId: "REPLACE_ME"` in all three).
- [ ] **Step 2:** Extend `infra/environments/README.md` with one paragraph per environment explaining what still needs to be filled in before that environment is usable (ties back to `AMBIGUITY_REGISTER.md` entries from Task 2).
- [ ] **Step 3:** Commit: `git commit -m "docs: scaffold non-secret environment configuration templates"`.

### Task 9: Full-monorepo verification and progress report

**Files:**
- Modify: `docs/IMPLEMENTATION_PROGRESS.md` (fill in the M0/M1 entry from Task 1 with actual results)

- [ ] **Step 1:** From repo root, run: `npm install` (installs all workspaces), `npm run generate:tokens`, `npm run format -- --check`, `npm run lint --workspaces --if-present`, `npm run build --workspaces --if-present`, `npm test --workspaces --if-present`.
- [ ] **Step 2:** Run `flutter pub get`, `flutter analyze`, `flutter test` inside `apps/mobile`.
- [ ] **Step 3:** Run `scripts/start-emulators.sh` in the background, run both rules tests, then stop the emulators.
- [ ] **Step 4:** Record every command and its actual pass/fail result (not assumed) in `docs/IMPLEMENTATION_PROGRESS.md` under the M0/M1 entry, plus files created/changed, requirements satisfied, security controls applied (deny-by-default rules, no secrets committed), open risks (bundle ID placeholder, no staging/production Firebase project yet, Java not on default PATH), and the next milestone (M2 — Identity, resident, household).
- [ ] **Step 5:** Commit: `git commit -m "docs: record M0/M1 verification evidence"`.

---

## Self-Review Notes

- **Spec coverage:** M0 gate (ambiguity/CR register, traceability status) → Task 2. M1 gate (Flutter/Next/Functions init, lint/format/CI, emulator suite, design tokens, shared contracts, env separation) → Tasks 1,3–8. Verification gate ("clean install, build, lint, test lulus di CI") → Task 9.
- **Type consistency:** `@casa/contracts` exports (`roles.ts`, `ipl.ts`, `internet.ts`) are the only place role/status/package literals are defined; Tasks 4 and 5 import rather than redeclare them.
- **Review Focus coverage:** each of the five risks above has an owning task and explicit check step (Task 4 Steps 1–5 for rules; Task 6 Step 3/5 for token-drop; Task 7 Step 3 for fake-green CI; Task 1 Steps 1–2 for gitignore ordering; Task 9 Step 1 for real workspace scripts).
- **Proportion:** this plan intentionally stays at the scaffolding/config level — no business logic, no Firestore collections beyond deny-all, no screens. M2 onward gets its own plan once this foundation is green.
