# Fix: "Can't reach database server" (P1001)

Your `SUPABASE_URL` is for the **API** (HTTPS). Prisma needs a **PostgreSQL** connection string; that uses a different host and port.

## 1. Resume the project (do this first)

Free-tier Supabase projects **pause** after inactivity. When paused, the DB is unreachable.

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open project **gftgmvupgdyxqacicasn**
3. If you see **"Project paused"** or **"Restore project"**, click it and wait until the project is running
4. Run `npm run dev` again

## 2. Use the connection string from the dashboard

Do **not** guess the host. Get the exact string from Supabase:

1. In the dashboard: **Project Settings** (gear) → **Database**
2. Scroll to **Connection string**
3. Select **URI** and **Session mode** (port **5432**)
4. Copy the URI — it will look like:
   ```
   postgresql://postgres.gftgmvupgdyxqacicasn:[YOUR-PASSWORD]@aws-0-XX-XXXX-X.pooler.supabase.com:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your database password
6. Put that full string in **`.env`** and **`.env.local`** as `DATABASE_URL`

Session mode uses the **pooler** host (`aws-0-....pooler.supabase.com`), which is often more reliable than the direct host (`db....supabase.co`).

Then run:

```bash
npm run dev
```
