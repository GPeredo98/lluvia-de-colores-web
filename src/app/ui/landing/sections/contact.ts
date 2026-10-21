import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LandingFacade } from '../../../core/application';
import { Icon } from '../../shared/icon';
import { Reveal } from '../../shared/reveal';

@Component({
  selector: 'app-contact',
  imports: [Icon, Reveal, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let c = landing.content().contact;
    <section id="contacto" class="section contact">
      <div class="container grid">
        <div class="info" appReveal>
          <span class="eyebrow" data-color="green"
            ><app-icon name="message" [size]="16" /> Contacto</span
          >
          <h2>Conversemos sobre tu hijo</h2>
          <p>Te orientamos sin compromiso para elegir el programa ideal.</p>
          <ul>
            <li data-color="green">
              <span><app-icon name="phone" /></span>
              <div><small>Teléfono</small>{{ c.phone }}</div>
            </li>
            <li data-color="blue">
              <span><app-icon name="mail" /></span>
              <div>
                <small>Correo</small><a [href]="'mailto:' + c.email">{{ c.email }}</a>
              </div>
            </li>
            <li data-color="pink">
              <span><app-icon name="pin" /></span>
              <div><small>Dirección</small>{{ c.address }}, {{ c.city }}</div>
            </li>
            <li data-color="yellow">
              <span><app-icon name="clock" /></span>
              <div><small>Horario</small>{{ c.hours }}</div>
            </li>
          </ul>
        </div>

        <form class="card form" #f="ngForm" (ngSubmit)="send(f.value)" appReveal="120">
          <h3>Escríbenos por WhatsApp</h3>
          <div class="form-grid">
            <label class="field"
              ><span>Tu nombre</span><input class="input" name="name" ngModel required
            /></label>
            <label class="field"
              ><span>Edad de tu hijo</span
              ><input class="input" name="age" ngModel placeholder="Ej. 2 años"
            /></label>
            <label class="field span-2">
              <span>Programa de interés</span>
              <select class="input" name="program" [ngModel]="''">
                <option value="">Aún no lo sé</option>
                @for (p of landing.programs(); track p.id) {
                  <option [value]="p.name">{{ p.name }}</option>
                }
              </select>
            </label>
            <label class="field span-2"
              ><span>Mensaje</span
              ><textarea class="input" name="message" ngModel rows="3"></textarea>
            </label>
          </div>
          <button class="btn btn-primary btn-lg" type="submit" [disabled]="f.invalid">
            <app-icon name="message" [size]="18" /> Enviar por WhatsApp
          </button>
        </form>
      </div>
    </section>
  `,
  styles: `
    .contact {
      background: var(--bg);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: clamp(2rem, 6vw, 4rem);
      align-items: start;
    }
    h2 {
      font-size: clamp(2rem, 4vw, 2.8rem);
    }
    .info > p {
      margin-top: 0.75rem;
      font-size: 1.08rem;
      color: var(--muted);
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 2rem 0 0;
      display: grid;
      gap: 1rem;
    }
    li {
      display: flex;
      gap: 0.9rem;
      align-items: center;
      font-weight: 700;
      color: var(--ink);
      > span {
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: var(--accent-soft);
        color: var(--accent);
        flex: none;
      }
      small {
        display: block;
        font-size: 0.78rem;
        color: var(--muted);
        font-weight: 700;
      }
      a {
        color: inherit;
      }
    }
    .form {
      padding: 1.75rem;
      border-radius: var(--radius-lg);
      display: grid;
      gap: 1.25rem;
      box-shadow: var(--shadow);
      h3 {
        font-size: 1.35rem;
      }
    }
    @media (max-width: 880px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class ContactSection {
  protected readonly landing = inject(LandingFacade);

  protected send(v: { name: string; age: string; program: string; message: string }) {
    const lines = [
      `¡Hola! Soy ${v.name}.`,
      v.age && `Mi hijo/a tiene ${v.age}.`,
      v.program && `Me interesa: ${v.program}.`,
      v.message,
    ].filter(Boolean);
    window.open(this.landing.whatsappLink(lines.join('\n')), '_blank', 'noopener');
  }
}
