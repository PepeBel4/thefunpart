import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  styles: [`
    .card {
      max-width: 420px;
      margin: 3rem auto;
      padding: 2.25rem;
      background: var(--surface);
      border-radius: var(--radius-card);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    h2 {
      font-size: clamp(1.85rem, 3vw, 2.4rem);
      font-weight: 700;
      margin: 0;
    }

    label {
      display: block;
      margin: 0.25rem 0 0.35rem;
      font-weight: 600;
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-soft);
      border-radius: 12px;
      background: var(--surface-elevated);
      font-size: 1rem;
    }

    button {
      margin-top: 0.5rem;
      width: 100%;
      background: var(--brand-green);
      color: #042f1a;
      border: 0;
      padding: 0.9rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      box-shadow: 0 18px 30px rgba(6, 193, 103, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 40px rgba(6, 193, 103, 0.32);
    }
  `],
  template: `
    <div class="card">
      <div>
        <h2>Welcome back</h2>
        <p>Sign in to keep your cravings satisfied.</p>
      </div>
      <form (ngSubmit)="submit()">
        <label>Email</label>
        <input [(ngModel)]="email" name="email" type="email" required />
        <label>Password</label>
        <input [(ngModel)]="password" name="password" type="password" required />
        <button type="submit">Log in</button>
      </form>
    </div>
  `
})
export class LoginPage {
  private auth = inject(AuthService);
  email = '';
  password = '';
  async submit(){ await this.auth.login(this.email, this.password); }
}
