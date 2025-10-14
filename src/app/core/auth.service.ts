import { Injectable, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { SessionUser } from './models';
import { firstValueFrom } from 'rxjs';


interface LoginPayload { email: string; password: string; }


@Injectable({ providedIn: 'root' })
export class AuthService {
private api = inject(ApiService);
private router = inject(Router);


private _user = signal<SessionUser | null>(null);
user = computed(() => this._user());
isLoggedIn = computed(() => !!this._user());


async login(email: string, password: string) {
await firstValueFrom(
  this.api.post<SessionUser>('/auth/login', { user: { email, password } })
);
this._user.set({ id: 0, email });
await this.router.navigateByUrl('/');
}


async logout() {
await firstValueFrom(this.api.delete('/auth/logout', {}));
this._user.set(null);
await this.router.navigateByUrl('/login');
}
}