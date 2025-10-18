import { NgIf } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TranslatePipe } from '../shared/translate.pipe';

@Component({
  standalone: true,
  selector: 'app-admin-shell',
  imports: [NgIf, RouterLink, RouterLinkActive, RouterOutlet, TranslatePipe],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }

    header.shell-header {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    header.shell-header h1 {
      margin: 0;
      font-size: clamp(2.35rem, 4vw, 2.9rem);
      letter-spacing: -0.04em;
    }

    header.shell-header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 560px;
    }

    nav.shell-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    nav.shell-nav a {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.65rem 1.2rem;
      border-radius: 999px;
      border: 1px solid transparent;
      background: rgba(10, 10, 10, 0.05);
      color: inherit;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s ease, border 0.2s ease, color 0.2s ease;
    }

    nav.shell-nav a.active {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      border-color: rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      color: color-mix(in srgb, var(--brand-green) 60%, black);
    }

    nav.shell-nav a:hover {
      background: rgba(10, 10, 10, 0.08);
    }
  `],
  template: `
    <header class="shell-header">
      <div>
        <h1>{{ 'admin.shell.title' | translate: 'Administration' }}</h1>
        <p>
          {{
            'admin.shell.subtitle'
              | translate: 'Switch between restaurant and chain administration tools.'
          }}
        </p>
      </div>

      <nav class="shell-nav" *ngIf="showNavigation()">
        <a
          *ngIf="showRestaurantAdmin()"
          routerLink="restaurants"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
        >
          {{ 'admin.shell.restaurant' | translate: 'Restaurant admin' }}
        </a>
        <a
          *ngIf="showChainAdmin()"
          routerLink="chains"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: false }"
        >
          {{ 'admin.shell.chain' | translate: 'Chain admin' }}
        </a>
      </nav>
    </header>

    <router-outlet />
  `,
})
export class AdminShellPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readonly showRestaurantAdmin = computed(() => this.auth.canAccessRestaurantAdmin());
  readonly showChainAdmin = computed(() => this.auth.canAccessChainAdmin());
  readonly showNavigation = computed(() => this.showRestaurantAdmin() || this.showChainAdmin());

  ngOnInit(): void {
    Promise.resolve().then(() => {
      if (this.showRestaurantAdmin()) {
        return;
      }

      if (this.showChainAdmin()) {
        void this.router.navigate(['chains'], { relativeTo: this.route, replaceUrl: true });
      }
    });
  }
}
