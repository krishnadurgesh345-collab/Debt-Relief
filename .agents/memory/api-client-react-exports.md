---
name: api-client-react package exports
description: What is and isn't exported from the generated API client package
---

`@workspace/api-client-react` exports from its main entry (`src/index.ts`):
- All generated React Query hooks (useGetDashboard, useCreateLoan, etc.)
- All query key helpers (getGetDashboardQueryKey, etc.)
- `setAuthTokenGetter` and `setBaseUrl` from `./custom-fetch`
- `AuthTokenGetter` type

**Never import from subpaths** like `@workspace/api-client-react/src/custom-fetch` — the package.json only exports `"."`. Vite will throw `Missing specifier` at build time.

**How to apply:** Always import everything from `"@workspace/api-client-react"` directly.
