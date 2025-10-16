import { NgIf } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { CartSidebarComponent } from './cart/card-sidebar.component';
import { CookieConsentComponent } from './shared/cookie-consent.component';
import { CardSpotlightComponent } from './cards/card-spotlight.component';
import { CardSpotlightService } from './cards/card-spotlight.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CartSidebarComponent, CookieConsentComponent, CardSpotlightComponent, NgIf],
  styles: [`
    :host {
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(6, 193, 103, 0.05), transparent 60%),
        var(--surface-elevated);
    }

    main {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 2.5rem;
      width: min(1220px, 100%);
      margin: 0 auto;
      padding: 2.5rem clamp(1.5rem, 3vw, 3rem) 3.5rem;
    }

    main.has-sidebar {
      grid-template-columns: minmax(0, 1fr) 360px;
    }

    .page-shell {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .sidebar-shell {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    @media (max-width: 1080px) {
      main {
        gap: 2rem;
        padding-inline: clamp(1rem, 4vw, 2rem);
      }
    }

    @media (max-width: 980px) {
      main {
        grid-template-columns: 1fr;
        padding-bottom: 2.5rem;
      }

      main.has-sidebar {
        grid-template-columns: 1fr;
      }

      .sidebar-shell {
        gap: 1.25rem;
      }
    }
  `],
  template: `
    <app-navbar />
    <main [class.has-sidebar]="showSidebarShell()">
      <section class="page-shell">
        <router-outlet />
      </section>
      <div class="sidebar-shell" *ngIf="showSidebarShell()">
        <app-card-spotlight />
        <app-cart-sidebar *ngIf="showCartSidebar()" />
      </div>
    </main>
    <app-cookie-consent />
  `
})
export class AppComponent {
  private router = inject(Router);
  private cardSpotlight = inject(CardSpotlightService);

  readonly showCartSidebar = signal(this.shouldShowCart(this.router.url));
  readonly showSidebarShell = computed(
    () => this.showCartSidebar() || this.cardSpotlight.spotlight() !== null
  );

  constructor() {
    this.router.events
      .pipe(
        takeUntilDestroyed(),
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe(event => {
        this.showCartSidebar.set(this.shouldShowCart(event.urlAfterRedirects));
      });
  }

  private shouldShowCart(url: string): boolean {
    const normalized = url.split('?')[0]?.split('#')[0] ?? '';

    if (normalized === '' || normalized === '/') {
      return false;
    }

    if (normalized.startsWith('/chains/')) {
      return false;
    }

    return true;
  }
}