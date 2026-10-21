import { Injectable, computed, inject, signal } from '@angular/core';
import { Charge, ChargeStatus, Draft, Payment, PaymentMethod } from '../../domain/models';
import { ChargeRepository, PaymentGateway, PaymentRepository } from '../../domain/ports';
import { localDateTimeIso, today } from '../../domain/time';
import { CrudFacade } from '../base/crud.facade';
import { ProgramsFacade, StudentsFacade } from './catalog.facades';
import { errorMessage } from './notification.facade';

export interface ChargeRow {
  charge: Charge;
  studentName: string;
  guardianName: string;
  /** Estado efectivo: una cuota pendiente con fecha pasada se muestra como vencida. */
  status: ChargeStatus;
  payment: Payment | null;
}

export interface ManualPaymentInput {
  method: Exclude<PaymentMethod, 'pasarela'>;
  date: string;
  reference: string;
  notes: string;
}

@Injectable({ providedIn: 'root' })
export class BillingFacade extends CrudFacade<Charge> {
  protected readonly repo = inject(ChargeRepository);
  protected readonly label = 'Cuota';
  protected override readonly feminine = true;
  private readonly paymentsRepo = inject(PaymentRepository);
  private readonly gateway = inject(PaymentGateway);
  private readonly students = inject(StudentsFacade);
  private readonly programs = inject(ProgramsFacade);

  private readonly _payments = signal<Payment[]>([]);
  private readonly _period = signal<string>(today().slice(0, 7));
  private readonly _status = signal<ChargeStatus | 'todos'>('todos');

  /** ETAPA 2: cuando exista pasarela, la UI mostrará "Pagar en línea". */
  readonly onlinePaymentAvailable = this.gateway.isAvailable;
  readonly period = this._period.asReadonly();
  readonly statusFilter = this._status.asReadonly();

  readonly rows = computed<ChargeRow[]>(() => {
    const students = this.students.byId();
    const payments = new Map(
      this._payments()
        .filter((p) => p.status === 'aprobado')
        .map((p) => [p.chargeId, p]),
    );
    const now = today();
    return this.items().map((c) => {
      const s = students.get(c.studentId);
      return {
        charge: c,
        studentName: s?.fullName ?? 'Estudiante eliminado',
        guardianName: s?.guardianName ?? '',
        status: c.status === 'pendiente' && c.dueDate < now ? 'vencido' : c.status,
        payment: payments.get(c.id) ?? null,
      };
    });
  });

  readonly filteredRows = computed(() => {
    const period = this._period();
    const status = this._status();
    return this.rows().filter(
      (r) => (!period || r.charge.period === period) && (status === 'todos' || r.status === status),
    );
  });

  readonly summary = computed(() => {
    const rows = this.rows().filter((r) => !this._period() || r.charge.period === this._period());
    const sum = (list: ChargeRow[]) => list.reduce((acc, r) => acc + r.charge.amount, 0);
    const paid = rows.filter((r) => r.status === 'pagado');
    const pending = rows.filter((r) => r.status === 'pendiente');
    const overdue = rows.filter((r) => r.status === 'vencido');
    const billable = rows.filter((r) => r.status !== 'anulado');
    return {
      billed: sum(billable),
      collected: sum(paid),
      pending: sum(pending),
      overdue: sum(overdue),
      overdueCount: overdue.length,
      collectionRate: billable.length ? Math.round((sum(paid) / sum(billable)) * 100) : 0,
    };
  });

  /** Períodos disponibles (yyyy-MM), del más reciente al más antiguo. */
  readonly periods = computed(() => {
    const set = new Set(this.items().map((c) => c.period));
    set.add(today().slice(0, 7));
    return [...set].sort().reverse();
  });

  async init() {
    await Promise.all([
      this.load(),
      this.students.load(),
      this.programs.load(),
      this.loadPayments(),
    ]);
  }

  setPeriod(period: string) {
    this._period.set(period);
  }

  setStatus(status: ChargeStatus | 'todos') {
    this._status.set(status);
  }

  async registerPayment(row: ChargeRow, input: ManualPaymentInput): Promise<boolean> {
    const draft: Draft<Payment> = {
      chargeId: row.charge.id,
      amount: row.charge.amount,
      method: input.method,
      status: 'aprobado',
      provider: null,
      providerReference: input.reference || null,
      paidAt: localDateTimeIso(input.date, '12:00'),
      notes: input.notes,
    };
    const result = await this.mutate(async () => {
      const payment = await this.paymentsRepo.create(draft);
      this._payments.update((list) => [payment, ...list]);
      this.replace({ ...row.charge, status: 'pagado', paidAt: payment.paidAt });
      this.notify.success(`Pago de ${row.studentName} registrado`);
      return true;
    });
    return result ?? false;
  }

  async cancel(row: ChargeRow) {
    const ok = await this.notify.confirm({
      title: 'Anular cuota',
      message: `¿Anular "${row.charge.concept}" de ${row.studentName}?`,
      confirmLabel: 'Anular',
      danger: true,
    });
    if (ok) await this.update(row.charge.id, { status: 'anulado' });
  }

  /** Crea la mensualidad del período para cada estudiante activo que aún no la tenga. */
  async generateMonthly(period: string): Promise<number> {
    const programs = this.programs.byId();
    const existing = new Set(
      this.items()
        .filter((c) => c.period === period && c.status !== 'anulado')
        .map((c) => c.studentId),
    );
    const drafts: Draft<Charge>[] = this.students
      .active()
      .filter((s) => s.programId && !existing.has(s.id))
      .flatMap((s) => {
        const p = programs.get(s.programId!);
        if (!p) return [];
        const amount = p.pricePeriod === 'sesion' ? p.price * p.sessionsPerWeek * 4 : p.price;
        return [
          {
            studentId: s.id,
            concept: `Mensualidad ${p.name}`,
            period,
            amount,
            currency: p.currency,
            dueDate: `${period}-10`,
            status: 'pendiente' as const,
            paidAt: null,
          },
        ];
      });
    if (!drafts.length) {
      this.notify.info('Todos los estudiantes activos ya tienen su cuota de este período');
      return 0;
    }
    const ok = await this.notify.confirm({
      title: 'Generar mensualidades',
      message: `Se crearán ${drafts.length} cuotas para ${period}. ¿Continuar?`,
      confirmLabel: 'Generar',
    });
    if (!ok) return 0;
    const created = await this.mutate(async () => {
      const result: Charge[] = [];
      for (const d of drafts) result.push(await this.repo.create(d));
      this.patch({ items: [...result, ...this.items()] });
      this.notify.success(`${result.length} cuotas generadas`);
      return result.length;
    });
    return created ?? 0;
  }

  private async loadPayments() {
    try {
      this._payments.set(await this.paymentsRepo.list());
    } catch (e) {
      this.notify.error(errorMessage(e));
    }
  }
}
