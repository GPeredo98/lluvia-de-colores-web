import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NotificationFacade } from '../../core/application';
import { Icon } from './icon';
import { Modal } from './modal';

@Component({
  selector: 'app-toast-host',
  imports: [Icon, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" role="status" aria-live="polite">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast" [attr.data-color]="colors[t.kind]">
          <app-icon [name]="icons[t.kind]" />
          <span>{{ t.message }}</span>
          <button class="icon-btn" (click)="notify.dismiss(t.id)" aria-label="Cerrar aviso">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>

    @if (notify.confirmRequest(); as req) {
      <app-modal [open]="true" [title]="req.title" size="sm" (closed)="notify.answer(false)">
        <p>{{ req.message }}</p>
        <div modal-footer>
          <button class="btn btn-ghost" (click)="notify.answer(false)">Cancelar</button>
          <button
            class="btn"
            [class.btn-danger]="req.danger"
            [class.btn-primary]="!req.danger"
            (click)="notify.answer(true)"
          >
            {{ req.confirmLabel }}
          </button>
        </div>
      </app-modal>
    }
  `,
  styles: `
    .toasts {
      position: fixed;
      z-index: 1000;
      right: 1rem;
      bottom: 1rem;
      display: grid;
      gap: 0.5rem;
      width: min(380px, calc(100vw - 2rem));
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.7rem 0.6rem 0.7rem 1rem;
      background: var(--surface);
      border-radius: var(--radius);
      border-left: 5px solid var(--accent);
      box-shadow: var(--shadow-lg);
      font-weight: 600;
      color: var(--ink);
      animation: slide 0.3s var(--ease);
      app-icon {
        color: var(--accent);
      }
      span {
        flex: 1;
      }
    }
    @keyframes slide {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
    }
  `,
})
export class ToastHost {
  protected readonly notify = inject(NotificationFacade);
  protected readonly colors = { success: 'green', error: 'red', info: 'blue' } as const;
  protected readonly icons = { success: 'check', error: 'alert', info: 'info' } as const;
}
