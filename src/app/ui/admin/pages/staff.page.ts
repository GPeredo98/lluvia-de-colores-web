import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SchedulesFacade, StaffFacade } from '../../../core/application';
import { BRAND_COLORS, Draft, Staff } from '../../../core/domain/models';
import { Avatar } from '../../shared/avatar';
import { Editor, withoutId } from '../../shared/editor';
import { Icon } from '../../shared/icon';
import { Modal } from '../../shared/modal';

type StaffForm = Draft<Staff> & { specialtiesText: string };

@Component({
  selector: 'app-staff-page',
  imports: [FormsModule, Icon, Modal, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-head">
      <div>
        <h1>Estimuladoras</h1>
        <p>El correo es el que usan para ingresar a la app móvil y marcar asistencia.</p>
      </div>
      <button class="btn btn-primary" (click)="openNew()">
        <app-icon name="plus" [size]="18" /> Nueva estimuladora
      </button>
    </header>

    <div class="grid">
      @for (s of staff.items(); track s.id) {
        <article class="card member" [class.inactive]="!s.isActive" [attr.data-color]="s.color">
          <div class="top">
            <app-avatar [name]="s.fullName" [photo]="s.photoUrl" [color]="s.color" [size]="64" />
            <div class="menu">
              <button class="icon-btn" (click)="openEdit(s)" aria-label="Editar">
                <app-icon name="edit" [size]="18" />
              </button>
              <button
                class="icon-btn danger"
                (click)="staff.remove(s.id, s.fullName)"
                aria-label="Eliminar"
              >
                <app-icon name="trash" [size]="18" />
              </button>
            </div>
          </div>
          <h3>{{ s.fullName }}</h3>
          <p class="role">{{ s.roleTitle }}</p>
          <ul class="contact">
            <li><app-icon name="mail" [size]="15" /> {{ s.email || '—' }}</li>
            <li><app-icon name="phone" [size]="15" /> {{ s.phone || '—' }}</li>
            <li>
              <app-icon name="clock" [size]="15" /> {{ weeklyLoad().get(s.id) ?? 0 }} visitas por
              semana
            </li>
          </ul>
          <div class="tags">
            @if (!s.isActive) {
              <span class="badge" data-color="red">Inactiva</span>
            }
            @if (s.showOnLanding && s.isActive) {
              <span class="badge" data-color="green">En la web</span>
            }
            @for (t of s.specialties; track t) {
              <span class="badge plain">{{ t }}</span>
            }
          </div>
        </article>
      } @empty {
        <div class="card empty">
          @if (staff.loading()) {
            Cargando…
          } @else {
            <strong>Aún no registraste personal</strong>
          }
        </div>
      }
    </div>

    @if (editor.current(); as e) {
      <app-modal
        [open]="true"
        [title]="e.id ? 'Editar estimuladora' : 'Nueva estimuladora'"
        (closed)="editor.close()"
      >
        <form id="staff-form" #f="ngForm" class="form-grid" (ngSubmit)="save()">
          <div class="field span-2 photo">
            <app-avatar
              [name]="e.draft.fullName || '?'"
              [photo]="e.draft.photoUrl"
              [color]="e.draft.color"
              [size]="72"
            />
            <div>
              <label class="btn btn-sm">
                <app-icon name="upload" [size]="16" />
                {{ uploading() ? 'Subiendo…' : 'Subir foto' }}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  (change)="upload($event)"
                  [disabled]="uploading()"
                />
              </label>
              @if (e.draft.photoUrl) {
                <button
                  type="button"
                  class="btn btn-ghost btn-sm"
                  (click)="e.draft.photoUrl = null"
                >
                  Quitar
                </button>
              }
              <small>JPG o PNG, máximo 2 MB.</small>
            </div>
          </div>
          <label class="field"
            ><span>Nombre completo</span
            ><input class="input" name="fullName" [(ngModel)]="e.draft.fullName" required
          /></label>
          <label class="field"
            ><span>Cargo</span
            ><input
              class="input"
              name="roleTitle"
              [(ngModel)]="e.draft.roleTitle"
              required
              placeholder="Estimuladora"
          /></label>
          <label class="field"
            ><span>Correo (acceso a la app)</span
            ><input
              class="input"
              type="email"
              name="email"
              [(ngModel)]="e.draft.email"
              required
              email
          /></label>
          <label class="field"
            ><span>Teléfono</span><input class="input" name="phone" [(ngModel)]="e.draft.phone"
          /></label>
          <label class="field span-2"
            ><span>Biografía corta</span
            ><textarea
              class="input"
              name="bio"
              [(ngModel)]="e.draft.bio"
              rows="2"
              maxlength="220"
            ></textarea>
          </label>
          <label class="field span-2"
            ><span>Especialidades (separadas por coma)</span
            ><input class="input" name="spec" [(ngModel)]="e.draft.specialtiesText"
          /></label>
          <div class="field">
            <span>Color</span>
            <div class="color-picker">
              @for (c of colors; track c) {
                <button
                  type="button"
                  [attr.data-color]="c"
                  [attr.aria-pressed]="e.draft.color === c"
                  (click)="e.draft.color = c"
                  [attr.aria-label]="c"
                ></button>
              }
            </div>
          </div>
          <label class="field"
            ><span>Orden en la web</span
            ><input class="input" type="number" name="order" [(ngModel)]="e.draft.sortOrder"
          /></label>
          <div class="field span-2 checks">
            <label class="check"
              ><input type="checkbox" name="active" [(ngModel)]="e.draft.isActive" /> Activa (puede
              marcar asistencia)</label
            >
            <label class="check"
              ><input type="checkbox" name="landing" [(ngModel)]="e.draft.showOnLanding" /> Mostrar
              en la sección “Equipo”</label
            >
          </div>
        </form>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="editor.close()">Cancelar</button>
          <button
            class="btn btn-primary"
            type="submit"
            form="staff-form"
            [disabled]="f.invalid || staff.saving() || uploading()"
          >
            Guardar
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
    .member {
      padding: 1.25rem;
      display: grid;
      gap: 0.35rem;
      border-top: 4px solid var(--accent);
      align-content: start;
    }
    .inactive {
      opacity: 0.6;
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }
    .menu {
      display: flex;
    }
    h3 {
      font-size: 1.15rem;
    }
    .role {
      color: var(--accent-ink, var(--accent));
      font-weight: 800;
      font-size: 0.88rem;
    }
    .contact {
      list-style: none;
      margin: 0.4rem 0;
      padding: 0;
      display: grid;
      gap: 0.25rem;
      font-size: 0.86rem;
      color: var(--muted);
      li {
        display: flex;
        gap: 0.45rem;
        align-items: center;
        overflow-wrap: anywhere;
      }
    }
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .photo {
      display: flex;
      gap: 1rem;
      align-items: center;
      > div {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
      }
      small {
        width: 100%;
      }
    }
    .checks {
      display: flex;
      flex-wrap: wrap;
      gap: 1.25rem;
    }
  `,
})
export class StaffPage {
  protected readonly staff = inject(StaffFacade);
  private readonly schedules = inject(SchedulesFacade);
  protected readonly editor = new Editor<StaffForm>();
  protected readonly colors = BRAND_COLORS;
  protected readonly uploading = signal(false);

  protected readonly weeklyLoad = computed(() => {
    const map = new Map<string, number>();
    for (const s of this.schedules.active()) map.set(s.staffId, (map.get(s.staffId) ?? 0) + 1);
    return map;
  });

  constructor() {
    void this.staff.load();
    void this.schedules.load();
  }

  protected openNew() {
    this.editor.create({
      fullName: '',
      roleTitle: 'Estimuladora',
      bio: '',
      photoUrl: null,
      specialties: [],
      specialtiesText: '',
      email: '',
      phone: '',
      color: BRAND_COLORS[this.staff.items().length % BRAND_COLORS.length],
      isActive: true,
      showOnLanding: true,
      sortOrder: this.staff.items().length + 1,
    });
  }

  protected openEdit(s: Staff) {
    this.editor.edit(s, (x) => ({ ...withoutId(x), specialtiesText: x.specialties.join(', ') }));
  }

  protected async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const e = this.editor.current();
    if (!file || !e) return;
    this.uploading.set(true);
    const url = await this.staff.uploadPhoto(file);
    this.uploading.set(false);
    input.value = '';
    if (url) this.editor.current.set({ ...e, draft: { ...e.draft, photoUrl: url } });
  }

  protected async save() {
    const e = this.editor.current();
    if (!e) return;
    const { specialtiesText, ...rest } = e.draft;
    const draft: Draft<Staff> = {
      ...rest,
      email: rest.email.trim().toLowerCase(),
      sortOrder: Number(rest.sortOrder),
      specialties: specialtiesText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };
    if (await this.staff.save(e.id, draft)) this.editor.close();
  }
}
