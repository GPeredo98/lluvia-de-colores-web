-- Evita que la política admin de profiles se evalúe recursivamente
-- cuando is_admin() comprueba el rol del usuario autenticado.
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
set row_security = off
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
end;
$$;

-- La política admin de profiles llamaba a is_admin(), que a su vez consulta
-- profiles. El perfil propio ya está cubierto por own_profile_read.
drop policy if exists "admin_all" on public.profiles;
