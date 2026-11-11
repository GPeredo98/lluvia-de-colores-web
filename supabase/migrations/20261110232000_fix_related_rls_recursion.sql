-- Evita ciclos entre las políticas de estudiantes, horarios, asistencia y cobros.
create or replace function public.teacher_staff_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select id from public.staff where profile_id = auth.uid() and is_active;
$$;

create or replace function public.teacher_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select distinct student_id
  from public.schedules
  where staff_id in (select public.teacher_staff_ids())
    and is_active;
$$;

create or replace function public.parent_student_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
  select id
  from public.students
  where lower(guardian_email) = lower(auth.jwt() ->> 'email');
$$;

drop policy if exists "teacher_schedules" on public.schedules;
drop policy if exists "teacher_attendances" on public.attendances;
drop policy if exists "teacher_students" on public.students;
drop policy if exists "parent_students" on public.students;
drop policy if exists "parent_attendances" on public.attendances;
drop policy if exists "parent_schedules" on public.schedules;
drop policy if exists "parent_charges" on public.charges;
drop policy if exists "parent_payments" on public.payments;

create policy "teacher_schedules" on public.schedules
for select to authenticated
using (staff_id in (select public.teacher_staff_ids()));

create policy "teacher_attendances" on public.attendances
for select to authenticated
using (staff_id in (select public.teacher_staff_ids()));

create policy "teacher_students" on public.students
for select to authenticated
using (id in (select public.teacher_student_ids()));

create policy "parent_students" on public.students
for select to authenticated
using (id in (select public.parent_student_ids()));

create policy "parent_attendances" on public.attendances
for select to authenticated
using (student_id in (select public.parent_student_ids()));

create policy "parent_schedules" on public.schedules
for select to authenticated
using (student_id in (select public.parent_student_ids()));

create policy "parent_charges" on public.charges
for select to authenticated
using (student_id in (select public.parent_student_ids()));

create policy "parent_payments" on public.payments
for select to authenticated
using (
  charge_id in (
    select id
    from public.charges
    where student_id in (select public.parent_student_ids())
  )
);
