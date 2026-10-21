import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Anima la entrada del elemento al aparecer en pantalla. Solo actúa en el navegador:
 * el HTML del servidor queda visible (bueno para SEO y sin JS).
 */
@Directive({ selector: '[appReveal]' })
export class Reveal {
  readonly delay = input(0, { alias: 'appReveal', transform: (v: unknown) => Number(v) || 0 });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!('IntersectionObserver' in window)) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) return; // ya visible: no lo ocultamos
      el.classList.add('reveal');
      el.style.transitionDelay = `${this.delay()}ms`;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            observer.disconnect();
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      );
      observer.observe(el);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
