<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

- **Start with `docs/plans/README.md`**: phased implementation plan, shared platform decisions and the API contract (`docs/api-contract.md`).

- Product spec lives in the iPad repo: `../atm-iris-ios/IRIS_SPEC.md`. UI text is Spanish; code is English.
- Data goes through the repository interfaces in `src/server/repositories/types.ts`, with both implementations kept in step: `api/` (the contract) and `mock/` (same rules). Never read `process.env` outside `src/server/env.ts`.
- Pages call `requireSession()` (or `requirePermission(permission)`, which 404s for other roles); Server Actions call `authorize(permission)` from `src/server/dal.ts`, catch with `toFormState` / `errorMessage` (`src/server/repositories/api/errors.ts`) and show API messages as they come.
- Show or hide actions by permission, never by role name: `can(session, …)` and `<PermissionGate>` (`src/lib/permissions.ts`, `src/components/ui/permission-gate.tsx`).
- Validate every Server Action input with zod (`src/features/<feature>/schemas.ts`).
- Search, filters and pagination live in the URL with nuqs; parsers in `src/lib/search-params.ts`.
- Dates and "today" use the church's time zone (`session.church.timezone`, `src/lib/zoned-time.ts`, `src/lib/format.ts`).
- Use the design tokens in `src/app/globals.css` and the components in `src/components/ui` (Radix primitives with Iris styles; toasts with `toast` from `ui/toaster`); no loose colors or sizes. Small text uses `ink-2`, not `ink-3` (contrast).
- `docs/api-contract.md` and `docs/plans/00-fundamentos/plataforma.md` are shared with the other repos: don't edit or reformat them.
- Before finishing: `pnpm check && pnpm format:check && pnpm build`; UI tests with `pnpm test:e2e`.
