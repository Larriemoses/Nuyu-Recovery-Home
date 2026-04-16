create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(coalesce(new.email, 'nuyu-admin'), '@', 1)
    ),
    'staff'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user_profile();

insert into public.profiles (id, full_name, role)
select
  users.id,
  coalesce(
    users.raw_user_meta_data ->> 'full_name',
    split_part(coalesce(users.email, 'nuyu-admin'), '@', 1)
  ),
  coalesce(profiles.role, 'staff'::public.user_role)
from auth.users as users
left join public.profiles as profiles
  on profiles.id = users.id
on conflict (id) do update
set full_name = excluded.full_name;

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id or public.is_admin());
