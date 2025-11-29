## Supabase setup

1. Create a Supabase project and enable email/password auth (optional for dashboard access later).
2. Create the required tables by running the SQL below inside the Supabase SQL editor:

```sql
create table if not exists public.retreats (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  title text not null,
  subtitle text,
  speaker text not null,
  conductor text not null,
  description text not null,
  date_range text not null,
  time_range text not null,
  location text not null,
  availability_total integer not null default 0,
  availability_male integer not null default 0,
  availability_female integer not null default 0,
  status text not null default 'Registration Open',
  image_src text not null,
  category text not null,
  detail_href text not null,
  cta_href text not null,
  price numeric,
  is_paid boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.retreat_bookings (
  id uuid primary key default uuid_generate_v4(),
  retreat_id uuid not null references public.retreats(id) on delete cascade,
  retreat_title text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  whatsapp text,
  status text not null default 'pending',
  payment_status text not null default 'pending',
  attended boolean not null default false,
  family_members jsonb default '[]'::jsonb,
  form_payload jsonb not null,
  notes text,
  rescheduled_to_retreat_id uuid references public.retreats(id),
  rescheduled_to_retreat_title text,
  cancelled_at timestamp with time zone,
  rescheduled_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.content_items (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  title text not null,
  slug text not null,
  summary text,
  body text,
  category text,
  status text not null default 'draft',
  media_url text,
  publish_date timestamp with time zone,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists content_items_type_idx on public.content_items(type);
```

3. Add the following environment variables to `.env.local` and restart the dev server:
   - `DATABASE_URL`: Transaction pooler connection (port 6543) from Supabase (Settings → Database → Connection string → Prisma)
   - `DIRECT_URL`: Direct connection (port 5432) from Supabase (Settings → Database → Connection string → URI)

```
DATABASE_URL=postgresql://postgres.xxxxxx:your-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.xxxxxx:your-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important**: The `DIRECT_URL` uses port **5432** (direct connection) while `DATABASE_URL` uses port **6543** (pooler). This fixes the "prepared statement 's1' already exists" error when running Prisma migrations/push.

4. Run Prisma commands:
```bash
npx prisma generate
npm run db:push
```

5. (Optional) Enable Row-Level Security and create policies that allow the service role key to perform the required operations.

