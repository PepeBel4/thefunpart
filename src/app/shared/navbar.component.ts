import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { NgIf } from '@angular/common';
import { CartService } from '../cart/cart.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, NgIf],
  styles: [`
    nav { display:flex; align-items:center; gap:1rem; padding: .75rem 1rem; border-bottom: 1px solid #eee; }
    .brand { font-weight: 700; }
    .spacer { flex:1; }
    a { text-decoration: none; color: inherit; }
    button { background:#111; color:#fff; border:0; padding:.5rem .75rem; border-radius:8px; cursor:pointer; }
  `],
  template: `
    <nav>
      <a routerLink="/" class="brand">thefunpart</a>
      <a routerLink="/orders">Orders</a>
      <span class="spacer"></span>
      <a routerLink="/checkout">Cart ({{ cart.count() }})</a>
      <button *ngIf="auth.isLoggedIn(); else login" (click)="auth.logout()">Logout</button>
      <ng-template #login>
        <a routerLink="/login">Login</a>
      </ng-template>
    </nav>
  `
})
export class NavbarComponent {
  auth = inject(AuthService);
  cart = inject(CartService);
}