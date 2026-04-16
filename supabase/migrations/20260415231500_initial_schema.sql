create extension if not exists pgcrypto;

create type public.booking_kind as enum ('appointment', 'package', 'stay');
create type public.booking_status as enum ('pending', 'held', 'confirmed', 'cancelled', 'completed');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.user_role as enum ('admin', 'staff');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'staff',
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null,
  booking_kind public.booking_kind not null,
  base_price_kobo integer not null check (base_price_kobo >= 0),
  duration_minutes integer,
  min_stay_days integer,
  max_stay_days integer,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint services_stay_range_check check (
    booking_kind <> 'stay'
    or (
      min_stay_days is not null
      and max_stay_days is not null
      and max_stay_days >= min_stay_days
    )
  )
);

create table if not exists public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  label text not null,
  sessions_count integer not null check (sessions_count > 0),
  package_price_kobo integer not null check (package_price_kobo >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  unique (service_id, label)
);

create table if not exists public.availability_windows (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_length_minutes integer not null check (slot_length_minutes > 0),
  capacity integer not null default 1 check (capacity > 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint availability_time_range_check check (end_time > start_time)
);

create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint blocked_slots_time_range_check check (ends_at > starts_at)
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id),
  client_id uuid not null references public.clients(id),
  booking_kind public.booking_kind not null,
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'pending',
  slot_starts_at timestamptz,
  slot_ends_at timestamptz,
  check_in_date date,
  check_out_date date,
  quantity integer not null default 1 check (quantity > 0),
  total_amount_kobo integer not null default 0 check (total_amount_kobo >= 0),
  paystack_reference text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint bookings_schedule_check check (
    (
      booking_kind in ('appointment', 'package')
      and slot_starts_at is not null
      and slot_ends_at is not null
      and check_in_date is null
      and check_out_date is null
    )
    or (
      booking_kind = 'stay'
      and slot_starts_at is null
      and slot_ends_at is null
      and check_in_date is not null
      and check_out_date is not null
      and check_out_date > check_in_date
    )
  )
);

create table if not exists public.slot_holds (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  booking_id uuid unique references public.bookings(id) on delete cascade,
  client_email text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'released', 'converted', 'expired')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint slot_holds_time_check check (ends_at > starts_at)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'paystack',
  provider_reference text not null unique,
  amount_kobo integer not null check (amount_kobo >= 0),
  status public.payment_status not null default 'pending',
  verified_at timestamptz,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists services_kind_idx on public.services (booking_kind, is_active);
create index if not exists availability_service_weekday_idx on public.availability_windows (service_id, weekday);
create index if not exists blocked_slots_service_time_idx on public.blocked_slots (service_id, starts_at);
create index if not exists bookings_service_status_idx on public.bookings (service_id, status);
create index if not exists bookings_paystack_reference_idx on public.bookings (paystack_reference);
create index if not exists slot_holds_service_status_idx on public.slot_holds (service_id, status, expires_at);
create index if not exists payments_booking_idx on public.payments (booking_id, status);

create trigger services_set_updated_at
before update on public.services
for each row
execute procedure public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute procedure public.set_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_packages enable row level security;
alter table public.availability_windows enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.clients enable row level security;
alter table public.bookings enable row level security;
alter table public.slot_holds enable row level security;
alter table public.payments enable row level security;

create policy "Admins can read profiles"
on public.profiles
for select
using (public.is_admin());

create policy "Admins can manage services"
on public.services
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read active services"
on public.services
for select
using (is_active = true or public.is_admin());

create policy "Admins can manage packages"
on public.service_packages
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read service packages"
on public.service_packages
for select
using (true);

create policy "Admins can manage availability"
on public.availability_windows
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read availability"
on public.availability_windows
for select
using (true);

create policy "Admins can manage blocked slots"
on public.blocked_slots
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read blocked slots"
on public.blocked_slots
for select
using (starts_at >= timezone('utc', now()) or public.is_admin());

create policy "Admins can manage clients"
on public.clients
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage bookings"
on public.bookings
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage slot holds"
on public.slot_holds
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage payments"
on public.payments
for all
using (public.is_admin())
with check (public.is_admin());

