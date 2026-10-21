import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BillingFacade,
  ChargeRow,
  ManualPaymentInput,
  StudentsFacade,
} from '../../../core/application';
import {
  CHARGE_STATUS_LABELS,
  Charge,
  ChargeStatus,
  Draft,
  PAYMENT_METHOD_LABELS,
} from '../../../core/domain/models';
import { today } from '../../../core/domain/time';
import { Editor } from '../../shared/editor';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { DayPipe, PeriodPipe } from '../../shared/pipes';

const STATUS_COLORS: Record<ChargeStatus, string> = {
  pendiente: 'yellow',
  pagado: 'green',
  vencido: 'red',
  anulado: 'blue',
};

@Component({
  selector: 'app-billing-page',
  imports: [FormsModule, Icon, Modal, CurrencyPipe, DayPipe, PeriodPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = billing.summary();
    <header class="page-head">
      <div>
        <h1>Pagos y cuotas</h1>
        <p>Registra los pagos recibidos por transferencia o efectivo.</p>
      </div>
      <div class="toolbar">
        <button
          class="btn"
          (click)="billing.generateMonthly(billing.period() || currentPeriod)"
          [disabled]="billing.saving()"
        >
          <app-icon name="refresh" [size]="18" /> Generar mensualidades
        </button>
        <button class="btn btn-primary" (click)="openNew()">
          <app-icon name="plus" [size]="18" /> Nueva cuota
        </button>
      </div>
    </header>

    @if (!billing.onlinePaymentAvailable) {
      <div class="notice" data-color="purple">
        <app-icon name="sparkles" [size]="20" />
        <div>
          <strong>Pago en línea — etapa 2</strong>
          <p>
            Las cuotas ya quedan listas para que los padres paguen desde su cuenta cuando se conecte
            la pasarela. Hasta entonces, registra aquí los pagos y evita que se paguen al QR
            personal de la profesora.
          </p>
        </div>
      </div>
    }

    <section class="stat-grid">
      <article class="card stat">
        <span class="stat-label">Facturado</span
        ><span class="stat-value">{{ s.billed | currency: 'BOB' : 'symbol' : '1.0-0' }}</span
        ><span class="stat-hint">{{ billing.period() | period }}</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Cobrado</span
        ><span class="stat-value">{{ s.collected | currency: 'BOB' : 'symbol' : '1.0-0' }}</span
        ><span class="stat-hint">{{ s.collectionRate }}% del total</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Pendiente</span
        ><span class="stat-value">{{ s.pending | currency: 'BOB' : 'symbol' : '1.0-0' }}</span
        ><span class="stat-hint">dentro del plazo</span>
      </article>
      <article class="card stat">
        <span class="stat-label">Vencido</span
        ><span class="stat-value overdue">{{
          s.overdue | currency: 'BOB' : 'symbol' : '1.0-0'
        }}</span
        ><span class="stat-hint">{{ s.overdueCount }} cuotas</span>
      </article>
    </section>

    <div class="toolbar" style="margin-bottom: 1rem">
      <select
        class="input auto"
        [value]="billing.period()"
        (change)="billing.setPeriod($any($event.target).value)"
      >
        <option value="">Todos los períodos</option>
        @for (p of billing.periods(); track p) {
          <option [value]="p" [selected]="p === billing.period()">{{ p | period }}</option>
        }
      </select>
      <div class="segmented" role="group" aria-label="Estado">
        @for (st of statusFilters; track st.value) {
          <button
            [attr.aria-pressed]="billing.statusFilter() === st.value"
            (click)="billing.setStatus(st.value)"
          >
            {{ st.label }}
          </button>
        }
      </div>
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Concepto</th>
            <th>Vence</th>
            <th class="num">Monto</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (r of billing.filteredRows(); track r.charge.id) {
            <tr>
              <td>
                <div class="cell-main">{{ r.studentName }}</div>
                <div class="cell-sub">{{ r.guardianName }}</div>
              </td>
              <td>
                <div>{{ r.charge.concept }}</div>
                <div class="cell-sub">{{ r.charge.period | period }}</div>
              </td>
              <td>{{ r.charge.dueDate | day: 'short' }}</td>
              <td class="num">
                <strong>{{
                  r.charge.amount | currency: r.charge.currency : 'symbol' : '1.0-0'
                }}</strong>
              </td>
              <td>
                <span class="badge" [attr.data-color]="statusColors[r.status]">{{
                  statusLabels[r.status]
                }}</span>
                @if (r.payment) {
                  <div class="cell-sub">
                    {{ methods[r.payment.method] }} · {{ r.payment.paidAt | day: 'short' }}
                  </div>
                }
              </td>
              <td class="actions">
                @if (r.status === 'pendiente' || r.status === 'vencido') {
                  <button class="btn btn-sm btn-primary" (click)="openPayment(r)">
                    Registrar pago
                  </button>
                  <button
                    class="icon-btn danger"
                    (click)="billing.cancel(r)"
                    aria-label="Anular"
                    title="Anular"
                  >
                    <app-icon name="x" [size]="17" />
                  </button>
                }
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <div class="empty">
                  @if (billing.loading()) {
                    Cargando…
                  } @else {
                    <app-icon name="card" [size]="40" /><strong
                      >No hay cuotas con estos filtros</strong
                    ><span>Usa “Generar mensualidades” para crear las del mes.</span>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (paying(); as p) {
      <app-modal
        [open]="true"
        title="Registrar pago"
        [subtitle]="p.row.studentName + ' · ' + p.row.charge.concept"
        size="sm"
        (closed)="paying.set(null)"
      >
        <form id="pay-form" #pf="ngForm" class="form-grid" (ngSubmit)="savePayment()">
          <div class="amount span-2">
            {{ p.row.charge.amount | currency: p.row.charge.currency : 'symbol' : '1.0-0' }}
          </div>
          <label class="field">
            <span>Método</span>
            <select class="input" name="method" [(ngModel)]="p.input.method">
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </label>
          <label class="field"
            ><span>Fecha</span
            ><input
              class="input"
              type="date"
              name="date"
              [(ngModel)]="p.input.date"
              [max]="todayStr"
              required
          /></label>
          <label class="field span-2"
            ><span>N.º de comprobante</span
            ><input
              class="input"
              name="ref"
              [(ngModel)]="p.input.reference"
              [required]="p.input.method === 'transferencia'"
          /></label>
          <label class="field span-2"
            ><span>Notas</span><input class="input" name="notes" [(ngModel)]="p.input.notes"
          /></label>
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="paying.set(null)">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="pay-form"
            [disabled]="pf.invalid || billing.saving()"
          >
            Confirmar pago
          </button>
        </div>
      </app-modal>
    }

    @if (editor.current(); as e) {
      <app-modal [open]="true" title="Nueva cuota" size="sm" (closed)="editor.close()">
        <form id="charge-form" #cf="ngForm" class="form-grid" (ngSubmit)="saveCharge()">
          <label class="field span-2">
            <span>Estudiante</span>
            <select class="input" name="student" [(ngModel)]="e.draft.studentId" required>
              @for (st of students.active(); track st.id) {
                <option [value]="st.id">{{ st.fullName }}</option>
              }
            </select>
          </label>
          <label class="field span-2"
            ><span>Concepto</span
            ><input
              class="input"
              name="concept"
              [(ngModel)]="e.draft.concept"
              required
              placeholder="Ej. Material didáctico"
          /></label>
          <label class="field"
            ><span>Monto (Bs)</span
            ><input
              class="input"
              type="number"
              min="1"
              name="amount"
              [(ngModel)]="e.draft.amount"
              required
          /></label>
          <label class="field"
            ><span>Vence</span
            ><input class="input" type="date" name="due" [(ngModel)]="e.draft.dueDate" required
          /></label>
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editor.close()">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="charge-form"
            [disabled]="cf.invalid || billing.saving()"
          >
            Crear cuota
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .notice {
      display: flex;
      gap: 0.85rem;
      align-items: flex-start;
      padding: 1rem 1.2rem;
      margin-bottom: 1.25rem;
      border-radius: var(--radius);
      background: var(--accent-soft);
      app-icon {
        color: var(--accent);
        margin-top: 2px;
      }
      strong {
        color: var(--ink);
      }
      p {
        font-size: 0.9rem;
      }
    }
    .auto {
      width: auto;
    }
    .overdue {
      color: var(--c-red) !important;
    }
    .amount {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--ink);
      text-align: center;
    }
  `,
})
export class BillingPage {
  protected readonly billing = inject(BillingFacade);
  protected readonly students = inject(StudentsFacade);
  protected readonly editor = new Editor<Draft<Charge>>();
  protected readonly paying = signal<{ row: ChargeRow; input: ManualPaymentInput } | null>(null);
  protected readonly statusLabels = CHARGE_STATUS_LABELS;
  protected readonly statusColors = STATUS_COLORS;
  protected readonly methods = PAYMENT_METHOD_LABELS;
  protected readonly todayStr = today();
  protected readonly currentPeriod = today().slice(0, 7);
  protected readonly statusFilters: { value: ChargeStatus | 'todos'; label: string }[] = [
    { value: 'todos', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'vencido', label: 'Vencidas' },
    { value: 'pagado', label: 'Pagadas' },
  ];

  constructor() {
    void this.billing.init();
  }

  protected openPayment(row: ChargeRow) {
    this.paying.set({
      row,
      input: { method: 'transferencia', date: today(), reference: '', notes: '' },
    });
  }

  protected async savePayment() {
    const p = this.paying();
    if (p && (await this.billing.registerPayment(p.row, p.input))) this.paying.set(null);
  }

  protected openNew() {
    this.editor.create({
      studentId: this.students.active()[0]?.id ?? '',
      concept: '',
      period: this.billing.period() || this.currentPeriod,
      amount: 0,
      currency: 'BOB',
      dueDate: today(),
      status: 'pendiente',
      paidAt: null,
    });
  }

  protected async saveCharge() {
    const e = this.editor.current();
    if (!e) return;
    const draft = {
      ...e.draft,
      amount: Number(e.draft.amount),
      period: e.draft.dueDate.slice(0, 7),
    };
    if (await this.billing.create(draft)) this.editor.close();
  }
}
