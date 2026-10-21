import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';
import { Student, studentQrPayload } from '../../../core/domain/models';

/** Tarjeta imprimible con el QR que se deja en la casa del estudiante. */
@Component({
  selector: 'app-qr-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qr-print">
      <img class="logo" src="resources/logo.png" alt="Lluvia de Colores" width="180" height="63" />
      @if (dataUrl(); as src) {
        <img
          class="code"
          [src]="src"
          [alt]="'QR de ' + student().fullName"
          width="240"
          height="240"
        />
      } @else {
        <div class="code skeleton"></div>
      }
      <strong>{{ student().fullName }}</strong>
      @if (programName()) {
        <span>{{ programName() }}</span>
      }
      <p>
        Estimuladora: escanea este código con la app al <b>llegar</b> y al <b>salir</b> de la
        visita.
      </p>
    </div>
  `,
  styles: `
    .qr-print {
      display: grid;
      justify-items: center;
      gap: 0.4rem;
      padding: 1.25rem;
      border: 2px dashed var(--line-strong);
      border-radius: var(--radius-lg);
      text-align: center;
    }
    .logo {
      height: 50px;
      width: auto;
    }
    .code {
      width: 240px;
      height: 240px;
      margin: 0.5rem 0;
      border-radius: 12px;
    }
    strong {
      font-family: var(--font-display);
      font-size: 1.35rem;
      color: var(--ink);
    }
    span {
      color: var(--muted);
      font-weight: 700;
    }
    p {
      font-size: 0.85rem;
      color: var(--muted);
      max-width: 260px;
      margin-top: 0.4rem;
    }
  `,
})
export class QrCard {
  readonly student = input.required<Student>();
  readonly programName = input('');
  protected readonly dataUrl = signal<string | null>(null);

  constructor() {
    effect(() => {
      const payload = studentQrPayload(this.student());
      this.dataUrl.set(null);
      void import('qrcode').then((qr) =>
        qr
          .toDataURL(payload, {
            width: 480,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#13213f' },
          })
          .then((url) => this.dataUrl.set(url)),
      );
    });
  }
}
