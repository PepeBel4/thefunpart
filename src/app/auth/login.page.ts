import { Component, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [FormsModule],
  styles: [`
    .card { max-width: 420px; margin: 2rem auto; padding: 1.5rem; border:1px solid #eee; border-radius:12px; }
    label { display:block; margin:.5rem 0 .25rem; }
    input { width:100%; padding:.5rem; border:1px solid #ccc; border-radius:8px; }
    button { margin-top: 1rem; width:100%; background:#111; color:#fff; border:0; padding:.75rem; border-radius:8px; }
  `],
  template: `
    <div class="card">
      <h2>Welcome back</h2>
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
