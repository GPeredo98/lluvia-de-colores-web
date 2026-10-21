-- =============================================================================
-- Lluvia de Colores — esquema inicial (etapa 1 + bases para pagos en línea)
-- Ejecutar con `supabase db push` o pegar en el SQL Editor del proyecto.
-- =============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('admin', 'teacher', 'parent');
create type public.brand_color as enum ('sky', 'blue', 'red', 'yellow', 'pink', 'green', 'purple');
create type public.modality as enum ('domicilio', 'centro', 'virtual', 'mixto');
create type public.price_period as enum ('mensual', 'sesion', 'paquete');
create type public.event_kind as enum ('evento', 'taller', 'inscripcion', 'feriado', 'vacaciones');
create type public.attendance_source as enum ('qr', 'manual');
create type public.charge_status as enum ('pendiente', 'pagado', 'vencido', 'anulado');
create type public.payment_method as enum ('efectivo', 'transferencia', 'pasarela');
create type public.payment_status as enum ('pendiente', 'aprobado', 'rechazado');

-- ---------------------------------------------------------------------------
-- Perfiles (1:1 con auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  role public.user_role not null default 'parent',
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
create table public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  summary text not null default '',
  description text not null default '',
  age_min_months int not null default 0,
  age_max_months int not null default 144,
  modality public.modality not null default 'domicilio',
  price numeric(10, 2) not null default 0,
  currency char(3) not null default 'BOB',
  price_period public.price_period not null default 'mensual',
  sessions_per_week int not null default 1 check (sessions_per_week between 1 and 7),
  session_minutes int not null default 45 check (session_minutes > 0),
  color public.brand_color not null default 'sky',
  icon text not null default 'star',
  features text[] not null default '{}',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (age_max_months > age_min_months)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  full_name text not null,
  role_title text not null default 'Estimuladora',
  bio text not null default '',
  photo_url text,
  specialties text[] not null default '{}',
  email text not null unique,
  phone text not null default '',
  color public.brand_color not null default 'sky',
  is_active boolean not null default true,
  show_on_landing boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Vista pública del equipo: sin correo ni teléfono.
create view public.public_staff with (security_invoker = false) as
  select id, full_name, role_title, bio, photo_url, specialties, color, is_active, show_on_landing, sort_order
  from public.staff
  where is_active and show_on_landing;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  birth_date date not null,
  program_id uuid references public.programs (id) on delete set null,
  guardian_name text not null default '',
  guardian_email text not null default '',
  guardian_phone text not null default '',
  address text not null default '',
  notes text not null default '',
  qr_token uuid not null unique default gen_random_uuid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index students_guardian_email_idx on public.students (lower(guardian_email));

create table public.schedules (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  program_id uuid references public.programs (id) on delete set null,
  weekday smallint not null check (weekday between 1 and 7), -- ISO: 1 = lunes
  start_time time not null,
  end_time time not null,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);
create index schedules_staff_idx on public.schedules (staff_id, weekday);

-- ---------------------------------------------------------------------------
-- Asistencia
-- ---------------------------------------------------------------------------
create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete restrict,
  schedule_id uuid references public.schedules (id) on delete set null,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  check_in_lat double precision,
  check_in_lng double precision,
  check_out_lat double precision,
  check_out_lng double precision,
  source public.attendance_source not null default 'qr',
  notes text not null default '',
  created_at timestamptz not null default now(),
  check (check_out_at is null or check_out_at > check_in_at)
);
create index attendances_check_in_idx on public.attendances (check_in_at desc);
create index attendances_staff_idx on public.attendances (staff_id, check_in_at desc);
create index attendances_student_idx on public.attendances (student_id, check_in_at desc);

-- ---------------------------------------------------------------------------
-- Contenido de la landing
-- ---------------------------------------------------------------------------
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  kind public.event_kind not null default 'evento',
  start_date date not null,
  end_date date,
  color public.brand_color not null default 'yellow',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table public.landing_sections (
  key text primary key check (key in ('hero', 'about', 'testimonials', 'faq', 'contact')),
  content jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Cobros y pagos (etapa 1: registro manual · etapa 2: pasarela)
-- ---------------------------------------------------------------------------
create table public.charges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  concept text not null,
  period char(7) not null, -- yyyy-MM
  amount numeric(10, 2) not null check (amount > 0),
  currency char(3) not null default 'BOB',
  due_date date not null,
  status public.charge_status not null default 'pendiente',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index charges_period_idx on public.charges (period);
create index charges_student_idx on public.charges (student_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  charge_id uuid not null references public.charges (id) on delete restrict,
  amount numeric(10, 2) not null check (amount > 0),
  method public.payment_method not null,
  status public.payment_status not null default 'pendiente',
  provider text,                -- etapa 2: 'libelula', 'stripe', ...
  provider_reference text,      -- id de transacción / comprobante
  provider_payload jsonb,       -- respuesta cruda de la pasarela (webhook)
  paid_at timestamptz not null default now(),
  notes text not null default '',
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

-- Un pago aprobado cierra su cuota (aplica igual al manual y al de la pasarela).
create or replace function public.payments_mark_charge_paid()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'aprobado' then
    update charges set status = 'pagado', paid_at = new.paid_at where id = new.charge_id;
  end if;
  return new;
end $$;

create trigger payments_mark_charge_paid
after insert or update of status on public.payments
for each row execute function public.payments_mark_charge_paid();

-- ---------------------------------------------------------------------------
-- Alta de usuarios y vínculo con el personal
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_staff boolean := exists (select 1 from staff where lower(email) = lower(new.email));
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when is_staff then 'teacher'::user_role else 'parent'::user_role end
  );
  update staff set profile_id = new.id where lower(email) = lower(new.email) and profile_id is null;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Si el admin registra a la estimuladora después de que ella creó su cuenta.
create or replace function public.staff_link_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(new.email);
  if new.profile_id is null then
    select id into new.profile_id from profiles where email = new.email;
    if new.profile_id is not null then
      update profiles set role = 'teacher' where id = new.profile_id and role = 'parent';
    end if;
  end if;
  return new;
end $$;

create trigger staff_link_profile
before insert or update of email on public.staff
for each row execute function public.staff_link_profile();

-- ---------------------------------------------------------------------------
-- RPC para la app móvil: escanear QR = marcar entrada o salida
-- ---------------------------------------------------------------------------
create or replace function public.register_attendance(
  p_qr_token uuid,
  p_lat double precision default null,
  p_lng double precision default null
)
returns public.attendances
language plpgsql security definer set search_path = public as $$
declare
  v_staff staff;
  v_student students;
  v_open attendances;
  v_schedule_id uuid;
  v_local timestamp := now() at time zone 'America/La_Paz';
  v_result attendances;
begin
  select * into v_staff from staff where profile_id = auth.uid() and is_active;
  if not found then
    raise exception 'Tu cuenta no está habilitada como estimuladora' using errcode = 'P0001';
  end if;

  select * into v_student from students where qr_token = p_qr_token and is_active;
  if not found then
    raise exception 'Código QR inválido o estudiante inactivo' using errcode = 'P0002';
  end if;

  -- ¿Hay una visita abierta hoy con este estudiante? Entonces es la salida.
  select * into v_open from attendances
  where staff_id = v_staff.id
    and student_id = v_student.id
    and check_out_at is null
    and (check_in_at at time zone 'America/La_Paz')::date = v_local::date
  order by check_in_at desc
  limit 1;

  if found then
    update attendances
      set check_out_at = now(), check_out_lat = p_lat, check_out_lng = p_lng
      where id = v_open.id
      returning * into v_result;
    return v_result;
  end if;

  -- Entrada: se asocia al horario de hoy más cercano a la hora actual.
  select id into v_schedule_id from schedules
  where staff_id = v_staff.id
    and student_id = v_student.id
    and weekday = extract(isodow from v_local)
    and is_active
  order by abs(extract(epoch from (start_time - v_local::time)))
  limit 1;

  insert into attendances (staff_id, student_id, schedule_id, check_in_lat, check_in_lng, source)
  values (v_staff.id, v_student.id, v_schedule_id, p_lat, p_lng, 'qr')
  returning * into v_result;
  return v_result;
end $$;

create or replace function public.regenerate_student_qr(p_student_id uuid)
returns public.students
language plpgsql security definer set search_path = public as $$
declare v_result students;
begin
  if not is_admin() then
    raise exception 'Solo un administrador puede regenerar el QR' using errcode = '42501';
  end if;
  update students set qr_token = gen_random_uuid() where id = p_student_id returning * into v_result;
  return v_result;
end $$;

revoke execute on function public.register_attendance(uuid, double precision, double precision) from anon;
revoke execute on function public.regenerate_student_qr(uuid) from anon;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.staff enable row level security;
alter table public.students enable row level security;
alter table public.schedules enable row level security;
alter table public.attendances enable row level security;
alter table public.calendar_events enable row level security;
alter table public.landing_sections enable row level security;
alter table public.charges enable row level security;
alter table public.payments enable row level security;

-- Admin: acceso total a todo.
do $$
declare t text;
begin
  foreach t in array array['profiles','programs','staff','students','schedules','attendances',
                           'calendar_events','landing_sections','charges','payments']
  loop
    execute format('create policy "admin_all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- Perfil propio (el rol no se puede auto-modificar: solo admin actualiza).
create policy "own_profile_read" on public.profiles for select to authenticated using (id = auth.uid());

-- Lecturas públicas para la landing.
create policy "public_programs" on public.programs for select to anon, authenticated using (is_active);
create policy "public_events" on public.calendar_events for select to anon, authenticated using (is_public);
create policy "public_sections" on public.landing_sections for select to anon, authenticated using (true);
grant select on public.public_staff to anon, authenticated;

-- Estimuladora: su ficha, sus horarios, sus visitas y los estudiantes que atiende.
create policy "teacher_own_staff" on public.staff for select to authenticated using (profile_id = auth.uid());
create policy "teacher_schedules" on public.schedules for select to authenticated
  using (staff_id in (select id from public.staff where profile_id = auth.uid()));
create policy "teacher_attendances" on public.attendances for select to authenticated
  using (staff_id in (select id from public.staff where profile_id = auth.uid()));
create policy "teacher_students" on public.students for select to authenticated
  using (id in (select s.student_id from public.schedules s join public.staff st on st.id = s.staff_id
                where st.profile_id = auth.uid() and s.is_active));

-- Padre / madre: sus hijos (por correo), su asistencia y sus cuotas.
create policy "parent_students" on public.students for select to authenticated
  using (lower(guardian_email) = lower(auth.jwt() ->> 'email'));
create policy "parent_attendances" on public.attendances for select to authenticated
  using (student_id in (select id from public.students where lower(guardian_email) = lower(auth.jwt() ->> 'email')));
create policy "parent_schedules" on public.schedules for select to authenticated
  using (student_id in (select id from public.students where lower(guardian_email) = lower(auth.jwt() ->> 'email')));
create policy "parent_charges" on public.charges for select to authenticated
  using (student_id in (select id from public.students where lower(guardian_email) = lower(auth.jwt() ->> 'email')));
create policy "parent_payments" on public.payments for select to authenticated
  using (charge_id in (select c.id from public.charges c join public.students s on s.id = c.student_id
                       where lower(s.guardian_email) = lower(auth.jwt() ->> 'email')));

-- ---------------------------------------------------------------------------
-- Storage: fotos del personal (lectura pública, escritura solo admin)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media_public_read" on storage.objects for select using (bucket_id = 'media');
create policy "media_admin_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "media_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
