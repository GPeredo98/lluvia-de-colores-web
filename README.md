# Lluvia de Colores — Web

Plataforma de Lluvia de Colores (estimulación temprana y apoyo escolar):

- **Landing pública** (`/`): servicios filtrables por edad, precios mensual/por sesión, calendario de eventos, equipo, testimonios, preguntas frecuentes y contacto por WhatsApp. Se renderiza en el servidor (SSR) para SEO.
- **Login** (`/login`) con redirección por rol.
- **Panel admin** (`/admin`): resumen del día, reporte de asistencia (filtros, puntualidad, CSV, registro manual), horarios semanales con detección de choques, estudiantes con QR imprimible, estimuladoras (con foto), programas, pagos y cuotas, calendario, contenido de la landing y roles de usuario.
- **Portal de familias** (`/portal`): por ahora una página provisional (ver *Próximos pasos*).

La app móvil de las estimuladoras es un proyecto aparte. Usa el mismo backend: la función `register_attendance(qr_token)` marca la entrada y, con el segundo escaneo, la salida.

## Puesta en marcha

```bash
pnpm install
pnpm start            # http://localhost:4200
```

Sin configurar Supabase, la app corre en **modo demo**: datos de ejemplo en memoria que se guardan en el `localStorage` del navegador. Las cuentas de la demo usan la contraseña `demo1234`:

| Rol | Correo |
|---|---|
| Administrador | `admin@demo.com` |
| Padre | `padre@demo.com` |
| Estimuladora | `ana@lluviadecolores.com` |

Para reiniciar la demo, borra las claves `ldc-demo:*` del `localStorage`.

### Conectar Supabase

1. Crea un proyecto en Supabase y ejecuta [supabase/migrations/20261021000000_init.sql](supabase/migrations/20261021000000_init.sql) (en el SQL Editor o con `supabase db push`). Si quieres programas de ejemplo, ejecuta también [supabase/seed.sql](supabase/seed.sql).
2. Pon la URL y la anon key en [src/environments/environment.ts](src/environments/environment.ts).
3. Regístrate en Auth y conviértete en admin:
   `update public.profiles set role = 'admin' where email = 'tu-correo';`

Los roles se asignan al registrarse: si el correo coincide con el de una estimuladora, la cuenta queda como `teacher`; si no, como `parent`. Un padre o una madre ve a los estudiantes cuyo `guardian_email` coincide con el suyo. Todo esto lo hacen cumplir las políticas RLS de la base de datos.

## Arquitectura

Clean architecture sin casos de uso: la UI solo conoce **facades**, que exponen el estado con signals y hablan con **puertos**; los **adapters** implementan esos puertos.

```
src/app/
├─ core/
│  ├─ domain/            # Sin Angular ni Supabase
│  │  ├─ models/         # Entidades y tipos (Program, Staff, Student, Attendance, Charge, Payment…)
│  │  ├─ ports/          # Clases abstractas = contratos + tokens de DI
│  │  └─ time.ts         # Fechas en la zona del negocio (America/La_Paz)
│  ├─ application/       # Facades con signals (lo único que importa la UI)
│  │  ├─ base/crud.facade.ts
│  │  └─ facades/        # Landing, Auth, Catalog, Attendance, Billing, Dashboard, Content…
│  └─ infrastructure/
│     ├─ adapters/supabase/   # Implementación real
│     ├─ adapters/memory/     # Modo demo / tests
│     └─ provide-data-layer.ts # Único lugar que une puertos y adapters
└─ ui/
   ├─ landing/  auth/  portal/  admin/
   └─ shared/   # Íconos, modal, toasts, pipes, guards
```

Reglas:

- Los componentes inyectan facades (`inject(ProgramsFacade)`), leen signals (`programs.items()`) y llaman métodos (`programs.save(...)`). Nunca importan desde `infrastructure` ni inyectan puertos.
- Las facades no conocen Supabase: dependen de los puertos de `domain/ports`.
- Cambiar de backend significa escribir nuevos adapters y registrarlos en `provideDataLayer()`.
- Las fechas de calendario viajan como `yyyy-MM-dd` y las marcas de tiempo como ISO. Para mostrar fechas se usan los pipes `day` y `period`, no `DatePipe`, para evitar el corrimiento por zona horaria.

## Etapa 2: pago en línea (bases listas)

- Las tablas `charges` y `payments` ya tienen las columnas `method = 'pasarela'`, `provider`, `provider_reference` y `provider_payload`, con unicidad por proveedor y referencia.
- El trigger `payments_mark_charge_paid` cierra la cuota cuando un pago queda `aprobado`, sea manual o de la pasarela.
- El puerto [PaymentGateway](src/app/core/domain/ports/payment-gateway.port.ts) define `createCheckout(charge)` y `checkStatus(reference)`. Hoy está registrado `NotConfiguredPaymentGateway`.
- Para integrar la pasarela:
  1. Crear las Edge Functions `create-checkout` y `payment-webhook`. Las llaves privadas van ahí, nunca en el navegador.
  2. Implementar el adapter con `supabase.functions.invoke('create-checkout')`.
  3. Registrarlo en `provideDataLayer()`.

  `BillingFacade.onlinePaymentAvailable` activa el flujo en la UI.

## Próximos pasos de la etapa 1

- Portal de familias: asistencia de sus hijos y estado de cuotas. Las políticas RLS para padres ya están creadas.
- App móvil de estimuladoras: consumir `schedules` (filtrado por RLS) y `register_attendance`.

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm start` | Servidor de desarrollo con SSR |
| `pnpm build` | Build de producción (`dist/`) |
| `pnpm test` | Tests unitarios (Vitest) |
| `pnpm serve:ssr:lluvia-de-colores-web` | Sirve el build con Node/Express |
