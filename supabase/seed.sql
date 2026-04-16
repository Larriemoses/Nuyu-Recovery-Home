insert into public.services (
  slug,
  name,
  summary,
  booking_kind,
  base_price_kobo,
  duration_minutes,
  min_stay_days,
  max_stay_days,
  sort_order
)
values
  (
    'lymphatic-drainage-massage',
    'Lymphatic Drainage Massage',
    'Post-op recovery massage session focused on swelling reduction and healing support.',
    'appointment',
    450000,
    60,
    null,
    null,
    1
  ),
  (
    'advanced-body-sculpting',
    'Advanced Body Sculpting',
    'A sculpting treatment available as single sessions or multi-session packages.',
    'package',
    850000,
    75,
    null,
    null,
    2
  ),
  (
    'laser-hair-removal',
    'Laser Hair Removal',
    'Precision laser treatment for long-term hair reduction.',
    'appointment',
    600000,
    45,
    null,
    null,
    3
  ),
  (
    'oxygen-healing-therapy',
    'Oxygen Healing Therapy',
    'Complementary healing support session focused on recovery and circulation.',
    'appointment',
    500000,
    45,
    null,
    null,
    4
  ),
  (
    'recovery-home-stay',
    'Recovery Home Stay',
    'Structured post-op accommodation with wellness-focused care for 5 to 21 days.',
    'stay',
    12500000,
    null,
    5,
    21,
    5
  )
on conflict (slug) do update
set
  name = excluded.name,
  summary = excluded.summary,
  booking_kind = excluded.booking_kind,
  base_price_kobo = excluded.base_price_kobo,
  duration_minutes = excluded.duration_minutes,
  min_stay_days = excluded.min_stay_days,
  max_stay_days = excluded.max_stay_days,
  sort_order = excluded.sort_order;

insert into public.service_packages (
  service_id,
  label,
  sessions_count,
  package_price_kobo
)
select
  s.id,
  package.label,
  package.sessions_count,
  package.package_price_kobo
from public.services s
join (
  values
    ('advanced-body-sculpting', '5 Sessions', 5, 3800000),
    ('advanced-body-sculpting', '10 Sessions', 10, 7200000),
    ('advanced-body-sculpting', '15 Sessions', 15, 10200000)
) as package(service_slug, label, sessions_count, package_price_kobo)
  on package.service_slug = s.slug
on conflict (service_id, label) do update
set
  sessions_count = excluded.sessions_count,
  package_price_kobo = excluded.package_price_kobo;

insert into public.availability_windows (
  service_id,
  weekday,
  start_time,
  end_time,
  slot_length_minutes,
  capacity
)
select
  s.id,
  weekday_matrix.weekday,
  time '09:00',
  time '18:00',
  coalesce(s.duration_minutes, 60),
  1
from public.services s
cross join (
  values (1), (2), (3), (4), (5), (6)
) as weekday_matrix(weekday)
where s.booking_kind <> 'stay'
and not exists (
  select 1
  from public.availability_windows aw
  where aw.service_id = s.id
    and aw.weekday = weekday_matrix.weekday
);

