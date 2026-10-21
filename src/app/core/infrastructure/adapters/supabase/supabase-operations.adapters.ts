import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment';
import {
  Attendance,
  AttendanceFilter,
  DEFAULT_LANDING_CONTENT,
  Draft,
  LandingContent,
  LandingSectionKey,
  Payment,
  UserProfile,
  UserRole,
} from '../../../domain/models';
import {
  AttendanceRepository,
  LandingRepository,
  MediaStorage,
  PaymentRepository,
  ProfileRepository,
} from '../../../domain/ports';
import { caseMapper } from '../../supabase/row-mapper';
import { SupabaseClientProvider, unwrap, unwrapList } from '../../supabase/supabase-client';
import { endOfDayIso, startOfDayIso } from '../../../domain/time';

@Injectable()
export class SupabaseAttendanceAdapter implements AttendanceRepository {
  private readonly supabase = inject(SupabaseClientProvider).client;
  private readonly mapper = caseMapper<Attendance>();

  async list(filter: AttendanceFilter): Promise<Attendance[]> {
    let q = this.supabase
      .from('attendances')
      .select('*')
      .gte('check_in_at', startOfDayIso(filter.from))
      .lte('check_in_at', endOfDayIso(filter.to))
      .order('check_in_at', { ascending: false });
    if (filter.staffId) q = q.eq('staff_id', filter.staffId);
    if (filter.studentId) q = q.eq('student_id', filter.studentId);
    return unwrapList(await q).map((r) => this.mapper.toDomain(r));
  }

  async create(draft: Draft<Attendance>): Promise<Attendance> {
    const row = unwrap(
      await this.supabase.from('attendances').insert(this.mapper.toRow(draft)).select().single(),
    );
    return this.mapper.toDomain(row);
  }

  async update(id: string, patch: Partial<Draft<Attendance>>): Promise<Attendance> {
    const row = unwrap(
      await this.supabase
        .from('attendances')
        .update(this.mapper.toRow(patch))
        .eq('id', id)
        .select()
        .single(),
    );
    return this.mapper.toDomain(row);
  }

  async remove(id: string): Promise<void> {
    unwrap(await this.supabase.from('attendances').delete().eq('id', id));
  }
}

@Injectable()
export class SupabaseLandingAdapter implements LandingRepository {
  private readonly supabase = inject(SupabaseClientProvider).client;

  async get(): Promise<LandingContent> {
    const rows = unwrapList(await this.supabase.from('landing_sections').select('key, content'));
    const content: LandingContent = structuredClone(DEFAULT_LANDING_CONTENT);
    for (const { key, content: value } of rows as { key: LandingSectionKey; content: never }[]) {
      if (key in content) content[key] = value;
    }
    return content;
  }

  async save<K extends LandingSectionKey>(key: K, value: LandingContent[K]): Promise<void> {
    unwrap(
      await this.supabase
        .from('landing_sections')
        .upsert({ key, content: value, updated_at: new Date().toISOString() }),
    );
  }
}

@Injectable()
export class SupabasePaymentAdapter implements PaymentRepository {
  private readonly supabase = inject(SupabaseClientProvider).client;
  private readonly mapper = caseMapper<Payment>({
    toDomain: (e) => ({ ...e, amount: Number(e.amount) }),
  });

  async list(): Promise<Payment[]> {
    const rows = unwrapList(
      await this.supabase.from('payments').select('*').order('paid_at', { ascending: false }),
    );
    return rows.map((r) => this.mapper.toDomain(r));
  }

  async create(draft: Draft<Payment>): Promise<Payment> {
    // El trigger `payments_mark_charge_paid` marca la cuota como pagada.
    const row = unwrap(
      await this.supabase.from('payments').insert(this.mapper.toRow(draft)).select().single(),
    );
    return this.mapper.toDomain(row);
  }
}

@Injectable()
export class SupabaseProfileAdapter implements ProfileRepository {
  private readonly supabase = inject(SupabaseClientProvider).client;
  private readonly mapper = caseMapper<UserProfile>();

  async list(): Promise<UserProfile[]> {
    const rows = unwrapList(await this.supabase.from('profiles').select('*').order('full_name'));
    return rows.map((r) => this.mapper.toDomain(r));
  }

  async updateRole(id: string, role: UserRole): Promise<UserProfile> {
    const row = unwrap(
      await this.supabase.from('profiles').update({ role }).eq('id', id).select().single(),
    );
    return this.mapper.toDomain(row);
  }
}

@Injectable()
export class SupabaseMediaStorage implements MediaStorage {
  private readonly supabase = inject(SupabaseClientProvider).client;

  async upload(folder: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const bucket = this.supabase.storage.from(environment.supabase.mediaBucket);
    const { error } = await bucket.upload(path, file, { cacheControl: '31536000', upsert: false });
    if (error) throw new Error(error.message);
    return bucket.getPublicUrl(path).data.publicUrl;
  }
}
