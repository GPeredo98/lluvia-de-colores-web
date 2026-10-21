import { EnvironmentProviders, Provider, Type, makeEnvironmentProviders } from '@angular/core';
import {
  AttendanceRepository,
  AuthGateway,
  CalendarRepository,
  DEMO_MODE,
  ChargeRepository,
  LandingRepository,
  MediaStorage,
  PaymentGateway,
  PaymentRepository,
  ProfileRepository,
  ProgramRepository,
  ScheduleRepository,
  StaffRepository,
  StudentRepository,
} from '../domain/ports';
import * as memory from './adapters/memory/memory.adapters';
import { NotConfiguredPaymentGateway } from './adapters/payment-gateway.adapter';
import { SupabaseAuthAdapter } from './adapters/supabase/supabase-auth.adapter';
import * as catalog from './adapters/supabase/supabase-catalog.adapters';
import * as ops from './adapters/supabase/supabase-operations.adapters';
import { isSupabaseConfigured } from './supabase/supabase-client';

type Binding = [
  port: abstract new (...args: never[]) => unknown,
  supabase: Type<unknown>,
  memory: Type<unknown>,
];

const BINDINGS: Binding[] = [
  [AuthGateway, SupabaseAuthAdapter, memory.MemoryAuthAdapter],
  [ProgramRepository, catalog.SupabaseProgramAdapter, memory.MemoryProgramAdapter],
  [StaffRepository, catalog.SupabaseStaffAdapter, memory.MemoryStaffAdapter],
  [StudentRepository, catalog.SupabaseStudentAdapter, memory.MemoryStudentAdapter],
  [ScheduleRepository, catalog.SupabaseScheduleAdapter, memory.MemoryScheduleAdapter],
  [CalendarRepository, catalog.SupabaseCalendarAdapter, memory.MemoryCalendarAdapter],
  [ChargeRepository, catalog.SupabaseChargeAdapter, memory.MemoryChargeAdapter],
  [AttendanceRepository, ops.SupabaseAttendanceAdapter, memory.MemoryAttendanceAdapter],
  [LandingRepository, ops.SupabaseLandingAdapter, memory.MemoryLandingAdapter],
  [PaymentRepository, ops.SupabasePaymentAdapter, memory.MemoryPaymentAdapter],
  [ProfileRepository, ops.SupabaseProfileAdapter, memory.MemoryProfileAdapter],
  [MediaStorage, ops.SupabaseMediaStorage, memory.MemoryMediaStorage],
];

/**
 * Conecta cada puerto del dominio con su adapter. Es el único lugar que conoce
 * las implementaciones concretas: cambiar de backend = cambiar este archivo.
 */
export function provideDataLayer(): EnvironmentProviders {
  const useSupabase = isSupabaseConfigured();
  const providers: Provider[] = BINDINGS.map(([port, supabase, mem]) => ({
    provide: port,
    useClass: useSupabase ? supabase : mem,
  }));
  providers.push({ provide: DEMO_MODE, useValue: !useSupabase });
  // ETAPA 2: reemplazar por el adapter de la pasarela elegida.
  providers.push({ provide: PaymentGateway, useClass: NotConfiguredPaymentGateway });
  return makeEnvironmentProviders(providers);
}
