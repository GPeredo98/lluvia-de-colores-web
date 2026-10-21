import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-color]': 'color()', '[style.--size]': 'size() + "px"' },
  template: `
    @if (photo()) {
      <img [src]="photo()" [alt]="name()" loading="lazy" />
    } @else {
      <span>{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      place-items: center;
      flex: none;
      width: var(--size);
      height: var(--size);
      border-radius: 50%;
      background: var(--accent-soft);
      color: var(--accent-ink, var(--accent));
      font-family: var(--font-display);
      font-weight: 700;
      font-size: calc(var(--size) * 0.38);
      overflow: hidden;
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly photo = input<string | null>(null);
  readonly color = input<string>('blue');
  readonly size = input(40);
  protected readonly initials = computed(() =>
    this.name()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(''),
  );
}
