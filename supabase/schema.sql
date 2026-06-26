-- ============================================================
-- SIDI · Sistema Integral de Discipulado Inteligente
-- Schema v1 — PostgreSQL / Supabase
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLAS
-- ============================================================

-- 1. Organizaciones (multi-tenant)
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text unique not null,
  created_at timestamptz default now()
);

-- 2. Tipos de nodo (jerarquía configurable por organización)
create table public.org_unit_types (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  role_label  text not null,
  child_label text,
  rank        integer not null,
  tier        text not null check (tier in ('gobierno','supervision','liderazgo')),
  unique(org_id, rank)
);

-- 3. Nodos reales del árbol (distritos, iglesias, células...)
create table public.org_units (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  type_id     uuid not null references public.org_unit_types(id),
  parent_id   uuid references public.org_units(id),
  name        text not null,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- 4. Closure table (permite consultas de subárbol en 1 query sin recursión)
create table public.org_unit_closure (
  ancestor_id   uuid not null references public.org_units(id) on delete cascade,
  descendant_id uuid not null references public.org_units(id) on delete cascade,
  depth         integer not null default 0,
  primary key (ancestor_id, descendant_id)
);

-- 5. Perfiles de usuario (extiende auth.users de Supabase)
create table public.user_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  org_id       uuid not null references public.organizations(id),
  org_unit_id  uuid not null references public.org_units(id),
  full_name    text not null,
  whatsapp     text,
  rank         integer not null,
  created_by   uuid references auth.users(id),
  created_at   timestamptz default now()
);

-- 6. Miembros (asistentes de célula, sin cuenta necesariamente)
create table public.members (
  id             uuid primary key default gen_random_uuid(),
  org_unit_id    uuid not null references public.org_units(id) on delete cascade,
  full_name      text not null,
  phone          text,
  is_active      boolean default true,
  linked_user_id uuid references auth.users(id),
  joined_at      date default current_date,
  created_at     timestamptz default now()
);

-- 7. Reportes semanales
create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  org_unit_id   uuid not null references public.org_units(id) on delete cascade,
  reported_by   uuid not null references auth.users(id),
  week_start    date not null,
  attendance    integer not null default 0,
  visits        integer not null default 0,
  decisions     integer not null default 0,
  offerings     numeric(10,2),
  notes         text,
  created_at    timestamptz default now(),
  unique(org_unit_id, week_start)
);

-- 8. Recursos educativos
create table public.resources (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id),
  title       text not null,
  type        text not null check (type in ('curso','taller','manual','escuela','libro')),
  category    text not null,
  description text,
  file_url    text,
  file_name   text,
  min_rank    integer not null default 0,
  max_rank    integer not null default 11,
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- ============================================================
-- TRIGGER: mantener closure table automáticamente
-- ============================================================
create or replace function public.fn_maintain_closure()
returns trigger language plpgsql as $$
begin
  -- Auto-ref
  insert into public.org_unit_closure(ancestor_id, descendant_id, depth)
    values (NEW.id, NEW.id, 0)
    on conflict do nothing;
  -- Ancestors del padre
  if NEW.parent_id is not null then
    insert into public.org_unit_closure(ancestor_id, descendant_id, depth)
      select c.ancestor_id, NEW.id, c.depth + 1
      from public.org_unit_closure c
      where c.descendant_id = NEW.parent_id
      on conflict do nothing;
  end if;
  return NEW;
end;
$$;

create trigger trg_maintain_closure
  after insert on public.org_units
  for each row execute function public.fn_maintain_closure();

-- ============================================================
-- FUNCIÓN AUXILIAR: obtener org_unit_id del usuario actual
-- ============================================================
create or replace function public.my_org_unit_id()
returns uuid language sql stable security definer as $$
  select org_unit_id from public.user_profiles where id = auth.uid()
$$;

create or replace function public.my_rank()
returns integer language sql stable security definer as $$
  select rank from public.user_profiles where id = auth.uid()
$$;

-- ============================================================
-- RLS (Row Level Security)
-- Regla: cada usuario ve su nodo y todo el subárbol debajo.
-- ============================================================
alter table public.organizations    enable row level security;
alter table public.org_unit_types   enable row level security;
alter table public.org_units        enable row level security;
alter table public.org_unit_closure enable row level security;
alter table public.user_profiles    enable row level security;
alter table public.members          enable row level security;
alter table public.reports          enable row level security;
alter table public.resources        enable row level security;

-- Organizations: solo ver la propia
create policy "org_select" on public.organizations for select
  using (id in (select org_id from public.user_profiles where id = auth.uid()));

-- Org unit types: ver los de su organización
create policy "types_select" on public.org_unit_types for select
  using (org_id in (select org_id from public.user_profiles where id = auth.uid()));

-- Org units: ver subárbol propio
create policy "units_select" on public.org_units for select
  using (
    id in (
      select descendant_id from public.org_unit_closure
      where ancestor_id = public.my_org_unit_id()
    )
  );

-- Closure: ver solo descendientes propios
create policy "closure_select" on public.org_unit_closure for select
  using (ancestor_id = public.my_org_unit_id());

-- User profiles: ver solo los de su subárbol
create policy "profiles_select" on public.user_profiles for select
  using (
    org_unit_id in (
      select descendant_id from public.org_unit_closure
      where ancestor_id = public.my_org_unit_id()
    )
  );

-- Profiles: insertar (crear usuarios) solo en subárbol y rango menor
create policy "profiles_insert" on public.user_profiles for insert
  with check (
    org_unit_id in (
      select descendant_id from public.org_unit_closure
      where ancestor_id = public.my_org_unit_id()
    )
    and rank > public.my_rank()
  );

-- Members
create policy "members_select" on public.members for select
  using (
    org_unit_id in (
      select descendant_id from public.org_unit_closure
      where ancestor_id = public.my_org_unit_id()
    )
  );
create policy "members_insert" on public.members for insert
  with check (
    org_unit_id in (
      select descendant_id from public.org_unit_closure
      where ancestor_id = public.my_org_unit_id()
    )
  );

-- Reports: ver subárbol; insertar solo en propio nodo
create policy "reports_select" on public.reports for select
  using (
    org_unit_id in (
      select descendant_id from public.org_unit_closure
      where ancestor_id = public.my_org_unit_id()
    )
  );
create policy "reports_insert" on public.reports for insert
  with check (org_unit_id = public.my_org_unit_id());
create policy "reports_update" on public.reports for update
  using (org_unit_id = public.my_org_unit_id() and reported_by = auth.uid());

-- Resources: ver por rango
create policy "resources_select" on public.resources for select
  using (
    org_id in (select org_id from public.user_profiles where id = auth.uid())
    and min_rank <= public.my_rank()
    and max_rank >= public.my_rank()
  );
create policy "resources_insert" on public.resources for insert
  with check (
    org_id in (select org_id from public.user_profiles where id = auth.uid())
    and public.my_rank() <= 3
  );

-- ============================================================
-- VISTA: reporte semanal enriquecido (para dashboards)
-- ============================================================
create or replace view public.v_weekly_summary as
select
  ou.id              as unit_id,
  ou.name            as unit_name,
  out2.name          as unit_type,
  ou.parent_id,
  r.week_start,
  coalesce(r.attendance, 0)  as attendance,
  coalesce(r.visits, 0)      as visits,
  coalesce(r.decisions, 0)   as decisions,
  case when r.id is null then true else false end as missing_report,
  case when r.week_start < (current_date - interval '14 days') then true else false end as late
from public.org_units ou
join public.org_unit_types out2 on out2.id = ou.type_id
left join public.reports r on r.org_unit_id = ou.id
  and r.week_start = date_trunc('week', current_date)::date
where out2.tier = 'liderazgo' and out2.rank = 10;
