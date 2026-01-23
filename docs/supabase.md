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
RESEND_API_KEY=your-resend-api-key
RESEND_FROM="DMRC <onboarding@resend.dev>"
NEXT_PUBLIC_APP_URL=https://www.your-live-site.com
```

**Important**: The `DIRECT_URL` uses port **5432** (direct connection) while `DATABASE_URL` uses port **6543** (pooler). This fixes the "prepared statement 's1' already exists" error when running Prisma migrations/push.

4. Run Prisma commands:
```bash
npx prisma generate
npm run db:push
```

5. (Optional) Enable Row-Level Security and create policies that allow the service role key to perform the required operations.

---

## Retreat images (Storage bucket)

Retreat records store their `image_src` as an **absolute URL** (typically the public URL returned by Supabase Storage uploads), matching how `content_items.media_url` is handled for news/events.

- If you have existing retreat rows with values like `/images/...`, those are **local Next.js public assets** and are **not** stored in Supabase Storage.
- To migrate: open the Admin → Retreats dashboard, **upload** a new image for the retreat, and save. The uploaded image is stored in the Supabase Storage bucket and the retreat `image_src` is updated to the returned public URL.

---

## Booking emails (Resend)

When a user **creates** a retreat booking or **reschedules** a booking, the system sends a confirmation email (including the ticket code + a link to view/download the ticket).

- **Website**: emails are sent server-side from the Next.js booking API routes.
- **Mobile app (`dmrc-mobile`)**: after a booking/reschedule is saved to Supabase, the app calls the Next.js endpoint to send the email. This requires `EXPO_PUBLIC_WEB_BASE_URL` to be set to your deployed Next.js site URL.
