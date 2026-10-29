-- Paisa's initial Supabase schema.
-- Run in the Supabase SQL Editor. All user data is protected by RLS and
-- authenticated table grants are explicitly limited to the operations used.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
revoke all on schema public from anon;
grant usage on schema public to authenticated, service_role;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  currency_code text not null default 'INR' check (currency_code ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Kolkata' check (char_length(timezone) <= 64),
  onboarding_completed boolean not null default false,
  onboarding_answers jsonb not null default '{}'::jsonb
    check (jsonb_typeof(onboarding_answers) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe to re-run when the base profiles table already exists.
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;
alter table public.profiles add column if not exists onboarding_answers jsonb not null default '{}'::jsonb;
alter table public.profiles drop constraint if exists profiles_onboarding_answers_object;
alter table public.profiles add constraint profiles_onboarding_answers_object
  check (jsonb_typeof(onboarding_answers) = 'object');

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  created_at timestamptz not null default now(),
  unique (id, owner_user_id)
);

create table if not exists public.household_members (
  household_id uuid not null references public.households (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create index if not exists household_members_user_id_idx
  on public.household_members (user_id, household_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete restrict,
  share_with_household boolean not null default false,
  title text not null check (char_length(trim(title)) between 1 and 80),
  merchant text check (merchant is null or char_length(merchant) <= 120),
  category text not null check (char_length(trim(category)) between 1 and 40),
  amount numeric(12, 2) not null check (amount > 0),
  transaction_type text not null check (transaction_type in ('Income', 'Expense')),
  payment_method text not null check (payment_method in ('UPI', 'Cash', 'Card', 'Bank', 'Other')),
  transaction_date date not null,
  note text check (note is null or char_length(note) <= 500),
  import_source text not null default 'manual'
    check (import_source in ('manual', 'csv_import', 'sms_import', 'bank_import')),
  review_status text not null default 'complete'
    check (review_status in ('complete', 'needs_details')),
  receipt_object_path text check (receipt_object_path is null or char_length(receipt_object_path) <= 512),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  check (not share_with_household or household_id is not null)
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc, created_at desc);
create index if not exists transactions_household_date_idx
  on public.transactions (household_id, transaction_date desc)
  where share_with_household;
create index if not exists transactions_user_category_date_idx
  on public.transactions (user_id, category, transaction_date desc);
create index if not exists transactions_user_method_date_idx
  on public.transactions (user_id, payment_method, transaction_date desc);

create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null check (char_length(trim(item_name)) between 1 and 120),
  category text check (category is null or char_length(category) <= 40),
  quantity numeric(10, 3) not null default 1 check (quantity > 0),
  unit text check (unit is null or char_length(unit) <= 24),
  line_amount numeric(12, 2) not null check (line_amount >= 0),
  created_at timestamptz not null default now(),
  foreign key (transaction_id, user_id)
    references public.transactions (id, user_id) on delete cascade
);

create index if not exists transaction_items_transaction_idx
  on public.transaction_items (transaction_id, user_id);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  household_id uuid references public.households (id) on delete restrict,
  share_with_household boolean not null default false,
  category text not null check (char_length(trim(category)) between 1 and 40),
  month date not null check (extract(day from month) = 1),
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category, month),
  check (not share_with_household or household_id is not null)
);

create index if not exists budgets_household_month_idx
  on public.budgets (household_id, month)
  where share_with_household;

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  target_amount numeric(12, 2) not null check (target_amount > 0),
  current_amount numeric(12, 2) not null default 0
    check (current_amount >= 0 and current_amount <= target_amount),
  target_date date,
  status text not null default 'active' check (status in ('active', 'completed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists financial_goals_user_status_idx
  on public.financial_goals (user_id, status, target_date);

create or replace function private.user_household_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select hm.household_id
  from public.household_members as hm
  where hm.user_id = (select auth.uid())
$$;

revoke all on function private.user_household_ids() from public, anon;
grant execute on function private.user_household_ids() to authenticated;

create or replace function public.create_household(p_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_household_id uuid;
  caller_id uuid := (select auth.uid());
  clean_name text := trim(coalesce(p_name, ''));
begin
  if caller_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if char_length(clean_name) not between 1 and 80 then
    raise exception 'Household name must be between 1 and 80 characters' using errcode = '22023';
  end if;

  insert into public.households (owner_user_id, name)
  values (caller_id, clean_name)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, caller_id, 'owner');

  return new_household_id;
end;
$$;

revoke all on function public.create_household(text) from public, anon;
grant execute on function public.create_household(text) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
for each row execute function private.set_updated_at();
create trigger budgets_set_updated_at before update on public.budgets
for each row execute function private.set_updated_at();
create trigger financial_goals_set_updated_at before update on public.financial_goals
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.transactions enable row level security;
alter table public.transaction_items enable row level security;
alter table public.budgets enable row level security;
alter table public.financial_goals enable row level security;

revoke all on table public.profiles, public.households, public.household_members,
  public.transactions, public.transaction_items, public.budgets, public.financial_goals
  from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select, update, delete on table public.households to authenticated;
grant select on table public.household_members to authenticated;
grant select, insert, update, delete on table public.transactions,
  public.transaction_items, public.budgets, public.financial_goals to authenticated;
grant select, insert, update, delete on table public.profiles, public.households,
  public.household_members, public.transactions, public.transaction_items,
  public.budgets, public.financial_goals to service_role;
create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));
create policy profiles_insert_own on public.profiles for insert to authenticated
with check ((select auth.uid()) is not null and id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));
create policy households_select_member on public.households for select to authenticated
using (id in (select private.user_household_ids()));
create policy households_insert_owner on public.households for insert to authenticated
with check ((select auth.uid()) is not null and owner_user_id = (select auth.uid()));
create policy households_update_owner on public.households for update to authenticated
using (owner_user_id = (select auth.uid()))
with check (owner_user_id = (select auth.uid()));
create policy households_delete_owner on public.households for delete to authenticated
using (owner_user_id = (select auth.uid()));
create policy household_members_select_family on public.household_members for select to authenticated
using (household_id in (select private.user_household_ids()));
create policy transactions_select_owner_or_shared_family on public.transactions for select to authenticated
using (
  user_id = (select auth.uid())
  or (share_with_household and household_id in (select private.user_household_ids()))
);
create policy transactions_insert_owner on public.transactions for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (household_id is null or household_id in (select private.user_household_ids()))
);
create policy transactions_update_owner on public.transactions for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (household_id is null or household_id in (select private.user_household_ids()))
);
create policy transactions_delete_owner on public.transactions for delete to authenticated
using (user_id = (select auth.uid()));
create policy transaction_items_select_visible_transaction on public.transaction_items for select to authenticated
using (
  exists (
    select 1 from public.transactions as t
    where t.id = transaction_id and t.user_id = transaction_items.user_id
  )
);
create policy transaction_items_insert_owner on public.transaction_items for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.transactions as t
    where t.id = transaction_id and t.user_id = (select auth.uid())
  )
);
create policy transaction_items_update_owner on public.transaction_items for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.transactions as t
    where t.id = transaction_id and t.user_id = (select auth.uid())
  )
);
create policy transaction_items_delete_owner on public.transaction_items for delete to authenticated
using (user_id = (select auth.uid()));
create policy budgets_select_owner_or_shared_family on public.budgets for select to authenticated
using (
  user_id = (select auth.uid())
  or (share_with_household and household_id in (select private.user_household_ids()))
);
create policy budgets_insert_owner on public.budgets for insert to authenticated
with check (
  user_id = (select auth.uid())
  and (household_id is null or household_id in (select private.user_household_ids()))
);
create policy budgets_update_owner on public.budgets for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and (household_id is null or household_id in (select private.user_household_ids()))
);
create policy budgets_delete_owner on public.budgets for delete to authenticated
using (user_id = (select auth.uid()));
create policy financial_goals_select_own on public.financial_goals for select to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy financial_goals_insert_own on public.financial_goals for insert to authenticated
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy financial_goals_update_own on public.financial_goals for update to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()))
with check ((select auth.uid()) is not null and user_id = (select auth.uid()));
create policy financial_goals_delete_own on public.financial_goals for delete to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts',
  'receipts',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
create policy receipt_objects_select_own on storage.objects for select to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipt_objects_insert_own on storage.objects for insert to authenticated
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipt_objects_update_own on storage.objects for update to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy receipt_objects_delete_own on storage.objects for delete to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);
