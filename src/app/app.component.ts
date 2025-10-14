import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { CartSidebarComponent } from './cart/card-sidebar.component';
import { CookieConsentComponent } from './shared/cookie-consent.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CartSidebarComponent, CookieConsentComponent],
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
      grid-template-columns: minmax(0, 1fr) 360px;
      gap: 2.5rem;
      width: min(1220px, 100%);
      margin: 0 auto;
      padding: 2.5rem clamp(1.5rem, 3vw, 3rem) 3.5rem;
    }

    .page-shell {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
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
    }
  `],
  template: `
    <app-navbar />
    <main>
      <section class="page-shell">
        <router-outlet />
      </section>
      <app-cart-sidebar />
    </main>
    <app-cookie-consent />
  `
})
export class AppComponent {}