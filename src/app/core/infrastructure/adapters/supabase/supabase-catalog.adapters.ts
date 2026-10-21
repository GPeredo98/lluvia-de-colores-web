import { Injectable } from '@angular/core';
import { CalendarEvent, Charge, Program, Schedule, Staff, Student } from '../../../domain/models';
import {
  CalendarRepository,
  ChargeRepository,
  ProgramRepository,
  ScheduleRepository,
  StaffRepository,
  StudentRepository,
} from '../../../domain/ports';
import { caseMapper, trimSeconds } from '../../supabase/row-mapper';
import { unwrap, unwrapList } from '../../supabase/supabase-client';
import { SupabaseCrudAdapter } from './supabase-crud.adapter';

const numeric = <T>(keys: (keyof T)[]) =>
  caseMapper<T>({
    toDomain: (e) => {
      for (const k of keys) (e as Record<string, unknown>)[k as string] = Number(e[k]);
      return e;
    },
  });

@Injectable()
export class SupabaseProgramAdapter
  extends SupabaseCrudAdapter<Program>
  implements ProgramRepository
{
  constructor() {
    super({
      table: 'programs',
      orderBy: [{ column: 'sort_order' }, { column: 'name' }],
      mapper: numeric<Program>(['price']),
    });
  }

  async listPublic(): Promise<Program[]> {
    const rows = unwrapList(await this.query().eq('is_active', true));
    return rows.map((r) => this.mapper.toDomain(r));
  }
}

@Injectable()
export class SupabaseStaffAdapter extends SupabaseCrudAdapter<Staff> implements StaffRepository {
  constructor() {
    super({ table: 'staff', orderBy: [{ column: 'sort_order' }, { column: 'full_name' }] });
  }

  async listPublic(): Promise<Staff[]> {
    // Vista pública sin email ni teléfono del personal.
    const rows = unwrapList(
      await this.supabase.from('public_staff').select('*').order('sort_order').order('full_name'),
    );
    return rows.map((r) => this.mapper.toDomain({ email: '', phone: '', ...r }));
  }
}

@Injectable()
export class SupabaseStudentAdapter
  extends SupabaseCrudAdapter<Student>
  implements StudentRepository
{
  constructor() {
    super({ table: 'students', orderBy: [{ column: 'full_name' }] });
  }

  async regenerateQr(id: string): Promise<Student> {
    const row = unwrap(
      await this.supabase.rpc('regenerate_student_qr', { p_student_id: id }).single(),
    );
    return this.mapper.toDomain(row);
  }
}

@Injectable()
export class SupabaseScheduleAdapter
  extends SupabaseCrudAdapter<Schedule>
  implements ScheduleRepository
{
  constructor() {
    super({
      table: 'schedules',
      orderBy: [{ column: 'weekday' }, { column: 'start_time' }],
      mapper: caseMapper<Schedule>({
        toDomain: (e) => ({
          ...e,
          startTime: trimSeconds(e.startTime),
          endTime: trimSeconds(e.endTime),
        }),
      }),
    });
  }
}

@Injectable()
export class SupabaseCalendarAdapter
  extends SupabaseCrudAdapter<CalendarEvent>
  implements CalendarRepository
{
  constructor() {
    super({ table: 'calendar_events', orderBy: [{ column: 'start_date' }] });
  }

  async listPublic(from: string, to: string): Promise<CalendarEvent[]> {
    // Eventos que se solapan con el rango [from, to].
    const rows = unwrapList(
      await this.query()
        .eq('is_public', true)
        .lte('start_date', to)
        .or(`end_date.gte.${from},and(end_date.is.null,start_date.gte.${from})`),
    );
    return rows.map((r) => this.mapper.toDomain(r));
  }
}

@Injectable()
export class SupabaseChargeAdapter extends SupabaseCrudAdapter<Charge> implements ChargeRepository {
  constructor() {
    super({
      table: 'charges',
      orderBy: [{ column: 'due_date', ascending: false }],
      mapper: numeric<Charge>(['amount']),
    });
  }
}
