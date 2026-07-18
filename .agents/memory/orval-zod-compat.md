---
name: Orval Zod v4 compatibility
description: Orval v8 generates Zod v4 syntax; workaround for Zod v3 workspace
---

Orval v8.21+ generates `z.email()` for OpenAPI fields with `format: email`. This is Zod v4 syntax and fails in a Zod v3 workspace with `Property 'email' does not exist on type 'typeof zod'`.

**Fix:** Remove `format: email` from all OpenAPI spec fields. Orval will generate `z.string()` instead, which works in Zod v3.

**Why:** The workspace uses `zod@^3.x` (catalog). The Zod v4 shim (`zod/v4`) doesn't expose `z.email()` at the top level either.

**How to apply:** Any time you add email fields to the OpenAPI spec in `lib/api-spec/openapi.yaml`, use `type: string` without `format: email`.
