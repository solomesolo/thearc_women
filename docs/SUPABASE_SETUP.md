# Using Supabase for PostgreSQL

The app uses PostgreSQL via Prisma. You can use **Supabase** (hosted Postgres) instead of running Postgres locally.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Pick an organization, name the project (e.g. `thearc`), set a **database password** (save it), choose a region, then **Create project**.

## 2. Get the connection string

1. In the project dashboard, go to **Project Settings** (gear) → **Database**.
2. Under **Connection string**, choose **URI**.
3. Copy the URI. It looks like:
   ```text
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
4. Replace `[YOUR-PASSWORD]` with the database password you set in step 1.
5. For Prisma migrations and seed, Supabase recommends the **direct** connection (port **5432**). In the same Database settings, open **Connection string** and switch to **Direct connection** (or use **Session** / **Transaction** pooler URI; see note below).

**Using the pooler (port 6543):**  
If you use the pooler URL, add `?pgbouncer=true` so Prisma uses the right mode:
```text
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Using the direct connection (port 5432):**  
No extra query params needed. Prefer this for running migrations and seed.

## 3. Set your env file

In the project root, create or edit **`.env`** and **`.env.local`** and set:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Use your actual URI and password. For local dev, both files can use the same value.

## 4. Run migrations and seed

```bash
npm run db:setup
```

Or step by step:

```bash
npx prisma migrate deploy
npx prisma db seed
```

## 5. (Optional) Image uploads

To use Supabase Storage for admin image uploads:

1. In Supabase: **Storage** → **New bucket** → name it `uploads` → set it to **Public**.
2. In **Project Settings** → **API**: copy **Project URL** and **service_role** key (keep it secret).
3. In `.env.local` add:

```env
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The admin “Upload” button in the article form will then store images in Supabase.
