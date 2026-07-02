-- ============================================================
-- OVERSEASERP — Complete Multi-Tenant SaaS Schema
-- Supabase SQL Editor এ পুরো কপি-পেস্ট করুন
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ============================================================
-- CORE: Organizations, Profiles, Memberships, RBAC
-- ============================================================

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  branding_color text default '#2563eb',
  timezone text default 'UTC',
  currency text default 'BDT',
  language text default 'bn',
  plan text not null default 'trial',
  subscription_status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  storage_used bigint default 0,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create type role_enum as enum ('owner', 'admin', 'manager', 'recruiter', 'medical_officer', 'accounts', 'data_entry', 'support', 'viewer');

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role role_enum not null default 'viewer',
  status text not null default 'active' check (status in ('active','invited','suspended')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  role role_enum not null default 'recruiter',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

-- Helper functions
create or replace function public.user_org_ids()
returns setof uuid language sql security definer stable
as $$ select organization_id from public.memberships where user_id = auth.uid() and status = 'active' $$;

create or replace function public.has_role(p_org_id uuid, p_min_role role_enum)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid() and m.organization_id = p_org_id and m.status = 'active'
    and (
      case p_min_role
        when 'viewer' then m.role in ('owner','admin','manager','recruiter','medical_officer','accounts','data_entry','support','viewer')
        when 'support' then m.role in ('owner','admin','manager','recruiter','medical_officer','accounts','data_entry','support')
        when 'data_entry' then m.role in ('owner','admin','manager','recruiter','medical_officer','accounts','data_entry')
        when 'accounts' then m.role in ('owner','admin','manager','recruiter','medical_officer','accounts')
        when 'medical_officer' then m.role in ('owner','admin','manager','recruiter','medical_officer')
        when 'recruiter' then m.role in ('owner','admin','manager','recruiter')
        when 'manager' then m.role in ('owner','admin','manager')
        when 'admin' then m.role in ('owner','admin')
        when 'owner' then m.role = 'owner'
      end
    )
  )
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_org_id uuid;
  org_name text;
  org_slug text;
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);

  org_name := coalesce(new.raw_user_meta_data->>'org_name', split_part(new.email, '@', 1));
  org_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

  insert into public.organizations (name, slug) values (org_name, org_slug) returning id into new_org_id;
  insert into public.memberships (organization_id, user_id, role, status) values (new_org_id, new.id, 'owner', 'active');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ============================================================
-- RECRUITMENT: Agents, Countries, Trades, Candidates
-- ============================================================

create table public.countries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  code text,
  created_at timestamptz not null default now()
);

create table public.trades (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name text not null,
  code text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.candidates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  sl numeric,
  name text not null,
  passport_no character varying(50) not null,
  email text,
  phone text,
  received_date date,
  agent_id uuid references public.agents(id) on delete set null,
  country_id uuid references public.countries(id) on delete set null,
  trade_id uuid references public.trades(id) on delete set null,
  status text default 'new' check (status in ('new','processing','completed','rejected','onhold')),
  scan_copy text,
  photo_url text,
  notes text,
  is_deleted boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, passport_no)
);

-- ============================================================
-- PIPELINE MODULES: Medical, Visa, Mofa, Fingerprint, PC, etc.
-- ============================================================

create table public.medicals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  medical_date date,
  fit_date date,
  status text default 'N/A' check (status in ('N/A','NEW','FIT','UNFIT','USED','EXPIRED')),
  doctor_name text,
  clinic_name text,
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  country_id uuid references public.countries(id),
  contact_person text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.visas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  visa_type text,
  status text default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','EXPIRED','USED')),
  issue_date date,
  expiry_date date,
  flight_date date,
  iqamah_number text,
  agency_id uuid references public.agencies(id),
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mofas (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  application_number text,
  application_date date,
  status text default 'applied' check (status in ('applied','approved','rejected')),
  agency_id uuid references public.agencies(id),
  document_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.fingerprints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  appointment_date date,
  status text default 'pending',
  location text,
  document_url text,
  created_at timestamptz not null default now()
);

create table public.police_clearances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  application_date date,
  status text default 'pending',
  document_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ACCOUNTS: Invoices, Payments, Expenses
-- ============================================================

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_number text not null unique,
  candidate_id uuid references public.candidates(id),
  amount numeric(12,2) not null,
  currency text default 'BDT',
  status text default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  due_date date,
  paid_date date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, invoice_number)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  invoice_id uuid references public.invoices(id),
  amount numeric(12,2) not null,
  payment_method text,
  transaction_id text,
  paid_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  category text,
  amount numeric(12,2) not null,
  currency text default 'BDT',
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- DOCUMENTS & STORAGE
-- ============================================================

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  candidate_id uuid references public.candidates(id),
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  document_type text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ACTIVITY LOG & AUDIT
-- ============================================================

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  type text,
  title text,
  message text,
  read boolean default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SETTINGS
-- ============================================================

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  company_name text,
  company_address text,
  phone text,
  email text,
  website text,
  tax_id text,
  terms_and_conditions text,
  privacy_policy text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_candidates_org on public.candidates(organization_id);
create index idx_candidates_agent on public.candidates(agent_id);
create index idx_medicals_org on public.medicals(organization_id);
create index idx_medicals_candidate on public.medicals(candidate_id);
create index idx_visas_org on public.visas(organization_id);
create index idx_visas_candidate on public.visas(candidate_id);
create index idx_mofas_org on public.mofas(organization_id);
create index idx_mofas_candidate on public.mofas(candidate_id);
create index idx_invoices_org on public.invoices(organization_id);
create index idx_memberships_user on public.memberships(user_id);
create index idx_memberships_org on public.memberships(organization_id);
create index idx_activity_logs_org on public.activity_logs(organization_id);
create index idx_documents_candidate on public.documents(candidate_id);

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_candidates_updated_at before update on public.candidates for each row execute function public.set_updated_at();
create trigger trg_medicals_updated_at before update on public.medicals for each row execute function public.set_updated_at();
create trigger trg_visas_updated_at before update on public.visas for each row execute function public.set_updated_at();
create trigger trg_mofas_updated_at before update on public.mofas for each row execute function public.set_updated_at();
create trigger trg_invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
create trigger trg_settings_updated_at before update on public.settings for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Multi-Tenant Isolation
-- ============================================================

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;
alter table public.countries enable row level security;
alter table public.trades enable row level security;
alter table public.agents enable row level security;
alter table public.candidates enable row level security;
alter table public.medicals enable row level security;
alter table public.agencies enable row level security;
alter table public.visas enable row level security;
alter table public.mofas enable row level security;
alter table public.fingerprints enable row level security;
alter table public.police_clearances enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.documents enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.settings enable row level security;

-- Organizations
create policy "select own org" on public.organizations for select to authenticated using (id in (select public.user_org_ids()));
create policy "owner can update org" on public.organizations for update to authenticated using (public.has_role(id, 'owner'));

-- Profiles
create policy "select own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "update own profile" on public.profiles for update to authenticated using (id = auth.uid());

-- Memberships
create policy "select own membership" on public.memberships for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "admin manage members" on public.memberships for all to authenticated using (public.has_role(organization_id, 'admin'));

-- Settings
create policy "select org settings" on public.settings for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "admin update settings" on public.settings for update to authenticated using (public.has_role(organization_id, 'admin'));

-- Domain tables — Generic RLS pattern
create policy "select all" on public.countries for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.countries for insert to authenticated with check (public.has_role(organization_id, 'data_entry'));
create policy "update with role" on public.countries for update to authenticated using (public.has_role(organization_id, 'data_entry'));
create policy "delete with admin" on public.countries for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.trades for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.trades for insert to authenticated with check (public.has_role(organization_id, 'data_entry'));
create policy "update with role" on public.trades for update to authenticated using (public.has_role(organization_id, 'data_entry'));
create policy "delete with admin" on public.trades for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.agents for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.agents for insert to authenticated with check (public.has_role(organization_id, 'recruiter'));
create policy "update with role" on public.agents for update to authenticated using (public.has_role(organization_id, 'recruiter'));
create policy "delete with admin" on public.agents for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.candidates for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.candidates for insert to authenticated with check (public.has_role(organization_id, 'recruiter'));
create policy "update with role" on public.candidates for update to authenticated using (public.has_role(organization_id, 'recruiter'));
create policy "delete with admin" on public.candidates for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.medicals for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.medicals for insert to authenticated with check (public.has_role(organization_id, 'medical_officer'));
create policy "update with role" on public.medicals for update to authenticated using (public.has_role(organization_id, 'medical_officer'));
create policy "delete with admin" on public.medicals for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.visas for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.visas for insert to authenticated with check (public.has_role(organization_id, 'recruiter'));
create policy "update with role" on public.visas for update to authenticated using (public.has_role(organization_id, 'recruiter'));
create policy "delete with admin" on public.visas for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.mofas for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.mofas for insert to authenticated with check (public.has_role(organization_id, 'recruiter'));
create policy "update with role" on public.mofas for update to authenticated using (public.has_role(organization_id, 'recruiter'));
create policy "delete with admin" on public.mofas for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.agencies for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.agencies for insert to authenticated with check (public.has_role(organization_id, 'recruiter'));
create policy "update with role" on public.agencies for update to authenticated using (public.has_role(organization_id, 'recruiter'));
create policy "delete with admin" on public.agencies for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.invoices for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.invoices for insert to authenticated with check (public.has_role(organization_id, 'accounts'));
create policy "update with role" on public.invoices for update to authenticated using (public.has_role(organization_id, 'accounts'));
create policy "delete with admin" on public.invoices for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.documents for select to authenticated using (organization_id in (select public.user_org_ids()));
create policy "write with role" on public.documents for insert to authenticated with check (public.has_role(organization_id, 'data_entry'));
create policy "delete with admin" on public.documents for delete to authenticated using (public.has_role(organization_id, 'admin'));

create policy "select all" on public.activity_logs for select to authenticated using (organization_id in (select public.user_org_ids()) and (public.has_role(organization_id, 'admin')));

create policy "select own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "update own notifications" on public.notifications for update to authenticated using (user_id = auth.uid());
