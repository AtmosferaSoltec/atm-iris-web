<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

- **Start with `docs/plans/README.md`**: phased implementation plan, shared platform decisions and the API contract (`docs/api-contract.md`).

- Product spec lives in the iPad repo: `../atm-iris-ios/IRIS_SPEC.md`. UI text is Spanish; code is English.
- Data goes through the repository interfaces in `src/server/repositories/types.ts`; pages call `requireSession()` and Server Actions call `authorize()` from `src/server/dal.ts`. Never read `process.env` outside `src/server/env.ts`.
- Validate every Server Action input with zod (`src/features/<feature>/schemas.ts`).
- Use the design tokens in `src/app/globals.css` and the components in `src/components/ui`; no loose colors or sizes.
- Before finishing: `pnpm check && pnpm format:check && pnpm build`.
