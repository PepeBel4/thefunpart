import { NgIf } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { CartSidebarComponent } from './cart/card-sidebar.component';
import { CookieConsentComponent } from './shared/cookie-consent.component';
import { CardSpotlightComponent } from './cards/card-spotlight.component';
import { CardSpotlightService } from './cards/card-spotlight.service';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PushNotificationsService } from './core/push-notifications.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NavbarComponent, CartSidebarComponent, CookieConsentComponent, CardSpotlightComponent, NgIf],
  styles: [`
    :host {
      display: grid;
      grid-template-rows: auto 1fr auto;
      min-height: 100vh;
      background: radial-gradient(circle at top, rgba(var(--brand-green-rgb, 6, 193, 103), 0.05), transparent 60%),
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

    .app-footer {
      border-top: 1px solid rgba(12, 36, 32, 0.08);
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(14px);
    }

    .app-footer__content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      width: min(1220px, 100%);
      margin: 0 auto;
      padding: 1.25rem clamp(1.5rem, 3vw, 3rem);
      color: var(--text-secondary);
      font-size: 0.925rem;
    }

    .app-footer__links {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }

    .app-footer__links a {
      color: inherit;
      font-weight: 600;
      text-decoration: none;
      position: relative;
    }

    .app-footer__links a::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -0.2rem;
      width: 100%;
      height: 2px;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.5);
      opacity: 0;
      transform: scaleX(0.6);
      transform-origin: center;
      transition: opacity 150ms ease, transform 150ms ease;
    }

    .app-footer__links a:hover::after,
    .app-footer__links a:focus-visible::after {
      opacity: 1;
      transform: scaleX(1);
    }

    @media (max-width: 720px) {
      .app-footer__content {
        flex-direction: column;
        align-items: flex-start;
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
    <footer class="app-footer">
      <div class="app-footer__content">
        <span>© {{ currentYear }} The Fun Part. Alle rechten voorbehouden.</span>
        <nav class="app-footer__links" aria-label="Footer links">
          <a routerLink="/algemene-voorwaarden">Algemene voorwaarden</a>
          <span aria-hidden="true">•</span>
          <a routerLink="/privacyverklaring">Privacyverklaring</a>
        </nav>
      </div>
    </footer>
    <app-cookie-consent />
  `
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private cardSpotlight = inject(CardSpotlightService);
  private pushNotifications = inject(PushNotificationsService);

  readonly currentYear = new Date().getFullYear();
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

  ngOnInit(): void {
    void this.pushNotifications.initialize();
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
