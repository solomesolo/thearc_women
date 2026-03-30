## The Arc Woman

Next.js app with Prisma + Supabase-backed APIs and dashboard flows.

## Getting Started

1) Install dependencies:

```bash
npm ci
```

2) Configure environment:

```bash
cp .env.example .env.local
```

3) One-time local bootstrap (migrations + seed + backfill):

```bash
npm run dev:bootstrap
```

4) Daily dev loop:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful Scripts

- `npm run dev` — start Next.js dev server only (fast restart loop).
- `npm run dev:bootstrap` — run DB migration/seed/backfill once.
- `npm run dev:full` — bootstrap then start dev server.
- `npm run dev:ui` — force local host binding for IDE/browser workflows.
- `npm run dev:only` — alias for plain Next dev on port 3000.
- `npm run dev:watchdog` — auto-restart dev server when health checks fail.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)

