import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgramsFacade, SchedulesFacade, StudentsFacade } from '../../../core/application';
import { Draft, Student } from '../../../core/domain/models';
import { ageLabel } from '../../../core/domain/time';
import { Editor, withoutId } from '../../shared/editor';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';
import { QrCard } from '../components/qr-card';

@Component({
  selector: 'app-students-page',
  imports: [FormsModule, Icon, Modal, QrCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Estudiantes</h1>
        <p>Cada estudiante tiene un QR único que la estimuladora escanea al llegar y al salir.</p>
      </div>
      <button class="btn btn-primary" (click)="openNew()">
        <app-icon name="plus" [size]="18" /> Nuevo estudiante
      </button>
    </header>

    <div class="toolbar" style="margin-bottom: 1rem">
      <div class="search">
        <app-icon name="search" [size]="18" />
        <input
          class="input"
          placeholder="Buscar por nombre, tutor o correo"
          [value]="query()"
          (input)="query.set($any($event.target).value)"
        />
      </div>
      <select
        class="input auto"
        [value]="programFilter()"
        (change)="programFilter.set($any($event.target).value)"
      >
        <option value="">Todos los programas</option>
        @for (p of programs.items(); track p.id) {
          <option [value]="p.id">{{ p.name }}</option>
        }
      </select>
      <label class="check"
        ><input
          type="checkbox"
          [checked]="showInactive()"
          (change)="showInactive.set(!showInactive())"
        />
        Ver inactivos</label
      >
    </div>

    <div class="card table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Estudiante</th>
            <th>Programa</th>
            <th>Padre / madre</th>
            <th>Dirección</th>
            <th class="num">Visitas/sem</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (s of filtered(); track s.id) {
            <tr [class.muted-row]="!s.isActive">
              <td>
                <div class="cell-main">{{ s.fullName }}</div>
                <div class="cell-sub">
                  {{ age(s.birthDate) }}
                  @if (!s.isActive) {
                    · inactivo
                  }
                </div>
              </td>
              <td>
                @if (programs.byId().get(s.programId ?? ''); as p) {
                  <span class="badge" [attr.data-color]="p.color">{{ p.name }}</span>
                } @else {
                  <span class="cell-sub">Sin programa</span>
                }
              </td>
              <td>
                <div>{{ s.guardianName }}</div>
                <div class="cell-sub">{{ s.guardianEmail }} · {{ s.guardianPhone }}</div>
              </td>
              <td class="cell-sub">{{ s.address }}</td>
              <td class="num">{{ load().get(s.id) ?? 0 }}</td>
              <td class="actions">
                <button class="btn btn-sm" (click)="qrFor.set(s.id)">
                  <app-icon name="qr" [size]="16" /> QR
                </button>
                <button class="icon-btn" (click)="openEdit(s)" aria-label="Editar">
                  <app-icon name="edit" [size]="18" />
                </button>
                <button
                  class="icon-btn danger"
                  (click)="students.remove(s.id, s.fullName)"
                  aria-label="Eliminar"
                >
                  <app-icon name="trash" [size]="18" />
                </button>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6">
                <div class="empty">
                  @if (students.loading()) {
                    Cargando…
                  } @else {
                    <strong>No hay estudiantes que coincidan</strong>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    @if (qrStudent(); as s) {
      <app-modal
        [open]="true"
        title="Código QR de asistencia"
        [subtitle]="s.fullName"
        size="sm"
        (closed)="qrFor.set(null)"
      >
        <app-qr-card
          [student]="s"
          [programName]="programs.byId().get(s.programId ?? '')?.name ?? ''"
        />
        <div modal-footer>
          <button class="btn btn-ghost" (click)="students.regenerateQr(s)">
            <app-icon name="refresh" [size]="16" /> Generar nuevo
          </button>
          <button class="btn btn-primary" (click)="print()">
            <app-icon name="printer" [size]="16" /> Imprimir
          </button>
        </div>
      </app-modal>
    }

    @if (editor.current(); as e) {
      <app-modal
        [open]="true"
        [title]="e.id ? 'Editar estudiante' : 'Nuevo estudiante'"
        (closed)="editor.close()"
      >
        <form id="student-form" #f="ngForm" class="form-grid" (ngSubmit)="save()">
          <label class="field"
            ><span>Nombre completo</span
            ><input class="input" name="fullName" [(ngModel)]="e.draft.fullName" required
          /></label>
          <label class="field"
            ><span>Fecha de nacimiento</span
            ><input
              class="input"
              type="date"
              name="birthDate"
              [(ngModel)]="e.draft.birthDate"
              required
          /></label>
          <label class="field span-2">
            <span>Programa</span>
            <select class="input" name="programId" [(ngModel)]="e.draft.programId">
              <option [ngValue]="null">Sin programa</option>
              @for (p of programs.items(); track p.id) {
                <option [ngValue]="p.id">{{ p.name }}</option>
              }
            </select>
          </label>
          <label class="field"
            ><span>Padre / madre / tutor</span
            ><input class="input" name="guardianName" [(ngModel)]="e.draft.guardianName" required
          /></label>
          <label class="field"
            ><span>Teléfono</span
            ><input class="input" name="guardianPhone" [(ngModel)]="e.draft.guardianPhone"
          /></label>
          <label class="field span-2"
            ><span>Correo del tutor</span
            ><input
              class="input"
              type="email"
              name="guardianEmail"
              [(ngModel)]="e.draft.guardianEmail"
              required
              email
            /><small
              >Con este correo el padre o la madre crea su cuenta y ve la asistencia y los
              pagos.</small
            ></label
          >
          <label class="field span-2"
            ><span>Dirección de las visitas</span
            ><input class="input" name="address" [(ngModel)]="e.draft.address"
          /></label>
          <label class="field span-2"
            ><span>Notas internas</span
            ><textarea class="input" name="notes" [(ngModel)]="e.draft.notes" rows="2"></textarea>
          </label>
          <label class="check span-2"
            ><input type="checkbox" name="active" [(ngModel)]="e.draft.isActive" /> Activo</label
          >
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editor.close()">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="student-form"
            [disabled]="f.invalid || students.saving()"
          >
            Guardar
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .search {
      position: relative;
      flex: 1;
      min-width: 220px;
      app-icon {
        position: absolute;
        left: 0.8rem;
        top: 12px;
        color: var(--muted);
      }
      .input {
        padding-left: 2.4rem;
      }
    }
    .auto {
      width: auto;
    }
    .muted-row td {
      opacity: 0.55;
    }
  `,
})
export class StudentsPage {
  protected readonly students = inject(StudentsFacade);
  protected readonly programs = inject(ProgramsFacade);
  private readonly schedules = inject(SchedulesFacade);
  protected readonly editor = new Editor<Draft<Student>>();
  protected readonly age = ageLabel;

  protected readonly query = signal('');
  protected readonly programFilter = signal('');
  protected readonly showInactive = signal(false);
  protected readonly qrFor = signal<string | null>(null);

  protected readonly qrStudent = computed(
    () => this.students.byId().get(this.qrFor() ?? '') ?? null,
  );
  protected readonly load = computed(() => {
    const map = new Map<string, number>();
    for (const s of this.schedules.active()) map.set(s.studentId, (map.get(s.studentId) ?? 0) + 1);
    return map;
  });
  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const program = this.programFilter();
    return this.students
      .items()
      .filter(
        (s) =>
          (this.showInactive() || s.isActive) &&
          (!program || s.programId === program) &&
          (!q ||
            [s.fullName, s.guardianName, s.guardianEmail].some((v) => v.toLowerCase().includes(q))),
      );
  });

  constructor() {
    void this.students.load();
    void this.programs.load();
    void this.schedules.load();
  }

  protected openNew() {
    this.editor.create({
      fullName: '',
      birthDate: '',
      programId: null,
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      address: '',
      notes: '',
      qrToken: '',
      isActive: true,
    });
  }

  protected openEdit(s: Student) {
    this.editor.edit(s, withoutId);
  }

  protected async save() {
    const e = this.editor.current();
    if (!e) return;
    // El token QR lo genera la base de datos al crear; al editar no se toca.
    const { qrToken: _qr, ...rest } = e.draft;
    const draft = {
      ...rest,
      guardianEmail: rest.guardianEmail.trim().toLowerCase(),
    } as Draft<Student>;
    if (await this.students.save(e.id, draft)) this.editor.close();
  }

  protected print() {
    window.print();
  }
}
