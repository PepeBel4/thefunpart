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
      position: relative;
      display: grid;
      grid-template-rows: auto 1fr;
      min-height: 100vh;
      padding: clamp(1rem, 4vw, 2.5rem) clamp(1rem, 4vw, 3rem) 4rem;
      gap: clamp(1.5rem, 4vw, 2rem);
    }

    .main {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: clamp(2rem, 4vw, 2.75rem);
      width: min(1220px, 100%);
      margin: 0 auto;
      padding: clamp(2rem, 5vw, 3rem) clamp(1.25rem, 3vw, 2.75rem) clamp(2.5rem, 5vw, 3.5rem);
      border-radius: clamp(24px, 4vw, 36px);
      overflow: hidden;
      isolation: isolate;
    }

    .main.has-sidebar {
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
      :host {
        padding-inline: clamp(0.75rem, 4vw, 1.5rem);
      }

      .main {
        gap: 2rem;
        padding: clamp(1.75rem, 6vw, 2.5rem) clamp(1rem, 6vw, 2rem) clamp(2rem, 7vw, 3rem);
      }
    }

    @media (max-width: 980px) {
      .main {
        grid-template-columns: 1fr;
      }

      .main.has-sidebar {
        grid-template-columns: 1fr;
      }

      .sidebar-shell {
        gap: 1.25rem;
      }
    }
  `],
  template: `
    <app-navbar />
    <main class="main glass-panel" [class.has-sidebar]="showSidebarShell()">
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

    const suppressedExact = new Set(['', '/', '/orders', '/profile', '/admin', '/b2b']);
    if (suppressedExact.has(normalized)) {
      return false;
    }

    const suppressedPrefixes = ['/chains/', '/orders/', '/admin/'];
    if (suppressedPrefixes.some(prefix => normalized.startsWith(prefix))) {
      return false;
    }

    return true;
  }
}