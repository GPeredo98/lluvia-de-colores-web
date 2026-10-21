import { Injectable, computed, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
}

/** Estado global de notificaciones y diálogos de confirmación. */
@Injectable({ providedIn: 'root' })
export class NotificationFacade {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  private readonly _confirm = signal<ConfirmRequest | null>(null);

  readonly toasts = this._toasts.asReadonly();
  readonly confirmRequest = this._confirm.asReadonly();
  readonly hasConfirm = computed(() => this._confirm() !== null);

  success(message: string) {
    this.push('success', message);
  }

  error(message: string) {
    this.push('error', message, 6000);
  }

  info(message: string) {
    this.push('info', message);
  }

  dismiss(id: number) {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    danger?: boolean;
  }): Promise<boolean> {
    this._confirm()?.resolve(false);
    return new Promise((resolve) =>
      this._confirm.set({
        confirmLabel: 'Confirmar',
        danger: false,
        ...options,
        resolve,
      }),
    );
  }

  answer(ok: boolean) {
    this._confirm()?.resolve(ok);
    this._confirm.set(null);
  }

  private push(kind: ToastKind, message: string, ttl = 3500) {
    const id = this.nextId++;
    this._toasts.update((list) => [...list, { id, kind, message }]);
    setTimeout(() => this.dismiss(id), ttl);
  }
}

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : 'Ocurrió un error inesperado';
