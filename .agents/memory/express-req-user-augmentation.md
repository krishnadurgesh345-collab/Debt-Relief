---
name: Express req.user type augmentation
description: How to correctly add custom properties to Express Request in this project
---

The correct way to extend `req.user` (or any custom property) on Express Request in this pnpm monorepo:

```typescript
// src/types/express.d.ts
export {}; // Makes this a module — required for augmentation (not replacement)

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string; name: string };
    }
  }
}
```

**Why:** `express-serve-static-core.Request<P,...>` is a generic interface; augmenting `express-serve-static-core` directly only patches the non-generic base. Augmenting the global `Express.Request` namespace propagates to ALL generic instantiations. Without `export {}`, TypeScript treats the file as an ambient script and `declare module` *replaces* the module instead of augmenting it — causing all route handlers to lose their Express types entirely.

**How to apply:** Place file at `src/types/express.d.ts` inside the api-server package. The tsconfig `include: ["src"]` picks it up automatically. No additional tsconfig changes needed.
