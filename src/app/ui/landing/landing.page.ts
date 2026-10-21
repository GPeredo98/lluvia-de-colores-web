import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LandingFacade } from '../../core/application';
import { AboutSection } from './sections/about';
import { CalendarSection } from './sections/calendar';
import { ContactSection } from './sections/contact';
import { FaqSection } from './sections/faq';
import { HeroSection } from './sections/hero';
import { LandingFooter } from './sections/footer';
import { LandingNav } from './sections/nav';
import { PricingSection } from './sections/pricing';
import { ProgramsSection } from './sections/programs';
import { TeamSection } from './sections/team';
import { TestimonialsSection } from './sections/testimonials';

@Component({
  selector: 'app-landing-page',
  imports: [
    LandingNav,
    HeroSection,
    AboutSection,
    ProgramsSection,
    PricingSection,
    CalendarSection,
    TeamSection,
    TestimonialsSection,
    FaqSection,
    ContactSection,
    LandingFooter,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-landing-nav />
    <main>
      <app-hero />
      <app-programs />
      <app-about />
      <app-pricing />
      <app-calendar />
      <app-team />
      <app-testimonials />
      <app-faq />
      <app-contact />
    </main>
    <app-landing-footer />
  `,
  styles: `
    :host {
      display: block;
      background: var(--surface);
    }
  `,
})
export class LandingPage {
  constructor() {
    void inject(LandingFacade).load();
  }
}
