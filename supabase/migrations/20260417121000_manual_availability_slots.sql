create table if not exists public.manual_availability_slots (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default timezone('utc', now()),
  constraint manual_availability_slots_time_range_check check (ends_at > starts_at),
  constraint manual_availability_slots_unique_range unique (service_id, starts_at, ends_at)
);

create index if not exists manual_availability_slots_service_time_idx
on public.manual_availability_slots (service_id, starts_at);

alter table public.manual_availability_slots enable row level security;

create policy "Admins can manage manual availability slots"
on public.manual_availability_slots
for all
using (public.is_admin())
with check (public.is_admin());

create policy "Public can read future manual availability slots"
on public.manual_availability_slots
for select
using (ends_at >= timezone('utc', now()) or public.is_admin());
