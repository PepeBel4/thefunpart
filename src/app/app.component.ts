import { Component, signal, computed, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar.component';
import { CartSidebarComponent } from './cart/card-sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, CartSidebarComponent],
  styles: [`
    :host { display: grid; grid-template-rows: auto 1fr; height: 100dvh; }
    main { display: grid; grid-template-columns: 1fr 360px; gap: 1rem; padding: 1rem; }
    @media (max-width: 980px) { main { grid-template-columns: 1fr; } }
  `],
  template: `
    <app-navbar />
    <main>
      <router-outlet />
      <app-cart-sidebar />
    </main>
  `
})
export class AppComponent {}