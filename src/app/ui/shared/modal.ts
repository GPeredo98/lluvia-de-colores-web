import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { Icon } from './icon';

/** Diálogo modal basado en <dialog> nativo (foco atrapado y Escape gratis). */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog
      #dialog
      [class]="'modal modal-' + size()"
      (close)="closed.emit()"
      (click)="onBackdrop($event)"
      [attr.aria-labelledby]="'modal-title'"
    >
      <div class="modal-box">
        <header class="modal-head">
          <div>
            <h2 id="modal-title">{{ title() }}</h2>
            @if (subtitle()) {
              <p>{{ subtitle() }}</p>
            }
          </div>
          <button type="button" class="icon-btn" (click)="dialog.close()" aria-label="Cerrar">
            <app-icon name="x" />
          </button>
        </header>
        <div class="modal-body"><ng-content /></div>
        <ng-content select="[modal-footer]" />
      </div>
    </dialog>
  `,
  styles: `
    .modal {
      border: 0;
      padding: 0;
      background: transparent;
      width: min(100% - 2rem, var(--w));
      max-height: calc(100dvh - 2rem);
      overflow: visible;
      --w: 640px;
    }
    .modal-sm {
      --w: 440px;
    }
    .modal-lg {
      --w: 860px;
    }
    .modal::backdrop {
      background: rgb(19 33 63 / 45%);
      backdrop-filter: blur(3px);
    }
    .modal[open] {
      animation: pop 0.25s var(--ease);
    }
    @keyframes pop {
      from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
      }
    }
    .modal-box {
      background: var(--surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      max-height: calc(100dvh - 2rem);
    }
    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1.25rem 0.5rem 1.5rem;
      h2 {
        font-size: 1.35rem;
      }
      p {
        color: var(--muted);
        font-size: 0.9rem;
        margin-top: 0.15rem;
      }
    }
    .modal-body {
      padding: 0.75rem 1.5rem 1.5rem;
      overflow-y: auto;
    }
    :host ::ng-deep [modal-footer] {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--line);
    }
  `,
})
export class Modal {
  readonly open = input(false);
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.open() && !el.open) el.showModal();
      if (!this.open() && el.open) el.close();
    });
  }

  protected onBackdrop(event: MouseEvent) {
    if (event.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
