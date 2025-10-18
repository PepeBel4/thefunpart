import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { SessionUser } from './models';
import { firstValueFrom } from 'rxjs';


interface LoginPayload { email: string; password: string; }
interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private readonly storageKey = 'thefunpart:sessionUser';


  private _user = signal<SessionUser | null>(null);
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());
  canAccessAdmin = computed(() => this.userHasAdminAccess(this._user()));


  constructor() {
    const stored = this.getStoredUser();
    if (stored) {
      this._user.set(stored);
    }

    effect(() => {
      const current = this._user();
      if (!this.isBrowser()) {
        return;
      }

      try {
        if (current) {
          window.localStorage.setItem(this.storageKey, JSON.stringify(current));
        } else {
          window.localStorage.removeItem(this.storageKey);
        }
      } catch {
        // ignore storage errors
      }
    });
  }


  async login(email: string, password: string) {
    const response = await firstValueFrom(
      this.api.post<SessionUser | { user: SessionUser }>('/auth/login', {
        user: { email, password }
      })
    );
    const sessionUser = this.normalizeSessionUser(response);
    if (!sessionUser) {
      throw new Error('Unexpected login response shape');
    }
    this._user.set(sessionUser);
    await this.router.navigateByUrl('/');
  }


  async register(input: { email: string; password: string; firstName?: string; lastName?: string }) {
    const payload: RegisterPayload = {
      email: input.email.trim(),
      password: input.password,
    };

    const firstName = input.firstName?.trim();
    const lastName = input.lastName?.trim();

    if (firstName) {
      payload.first_name = firstName;
    }

    if (lastName) {
      payload.last_name = lastName;
    }

    const response = await firstValueFrom(
      this.api.post<SessionUser | { user: SessionUser }>('/auth/register', {
        user: payload,
      })
    );

    const sessionUser = this.normalizeSessionUser(response);
    if (!sessionUser) {
      throw new Error('Unexpected register response shape');
    }

    this._user.set(sessionUser);
    await this.router.navigateByUrl('/');
  }


  async logout() {
    await firstValueFrom(this.api.delete('/auth/logout', {}));
    this._user.set(null);
    await this.router.navigateByUrl('/login');
  }


  updateSessionUser(update: Partial<SessionUser>) {
    const current = this._user();
    if (!current) {
      return;
    }

    this._user.set({ ...current, ...update });
  }


  private getStoredUser(): SessionUser | null {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(this.storageKey);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored);
      return this.normalizeSessionUser(parsed);
    } catch {
      // ignore parsing errors
    }

    return null;
  }

  private normalizeSessionUser(value: unknown): SessionUser | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const source = value as Record<string, unknown>;
    const maybeUser = 'user' in source ? source['user'] : value;
    if (!maybeUser || typeof maybeUser !== 'object') {
      return null;
    }

    const userRecord = maybeUser as Record<string, unknown>;
    const id = this.normalizeId(userRecord['id']);
    const email = typeof userRecord['email'] === 'string' ? userRecord['email'] : null;

    if (id == null || !email) {
      return null;
    }

    const globalRoles = new Set<string>();
    const globalRoleSources = [
      userRecord['roles'],
      userRecord['role'],
      userRecord['role_names'],
      userRecord['roleNames'],
    ];

    for (const source of globalRoleSources) {
      const roles = this.normalizeGlobalRoles(source);
      roles?.forEach(role => globalRoles.add(role));
    }

    if (
      this.readBoolean(
        userRecord['super_admin'] ??
          userRecord['is_super_admin'] ??
          userRecord['superAdmin'] ??
          userRecord['isSuperAdmin']
      )
    ) {
      globalRoles.add('super_admin');
    }

    const restaurantRoles = this.normalizeScopedRoles(
      userRecord['restaurant_roles'] ?? userRecord['restaurantRoles']
    );
    const restaurantAdminIds = this.normalizeIdArray(
      userRecord['admin_restaurant_ids'] ?? userRecord['restaurant_admin_ids']
    );
    restaurantAdminIds.forEach(id => this.appendScopedRoles(restaurantRoles, id, ['admin']));

    const chainRoles = this.normalizeScopedRoles(userRecord['chain_roles'] ?? userRecord['chainRoles']);
    const chainAdminIds = this.normalizeIdArray(
      userRecord['admin_chain_ids'] ?? userRecord['chain_admin_ids']
    );
    chainAdminIds.forEach(id => this.appendScopedRoles(chainRoles, id, ['admin']));

    return {
      id,
      email,
      firstName: this.readOptionalString(userRecord['first_name'] ?? userRecord['firstName']),
      lastName: this.readOptionalString(userRecord['last_name'] ?? userRecord['lastName']),
      gender: this.readOptionalString(userRecord['gender']),
      birthDate: this.readOptionalString(userRecord['birth_date'] ?? userRecord['birthDate']),
      roles: Array.from(globalRoles),
      restaurantRoles,
      chainRoles,
    };
  }

  private userHasAdminAccess(user: SessionUser | null): boolean {
    if (!user) {
      return false;
    }

    if (user.roles.some(role => this.isAdminRole(role))) {
      return true;
    }

    const hasScopedAdminRole = (scopedRoles: Record<number, string[]>) =>
      Object.values(scopedRoles).some(roles => roles.some(role => this.isAdminRole(role)));

    return hasScopedAdminRole(user.restaurantRoles) || hasScopedAdminRole(user.chainRoles);
  }

  private normalizeId(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const numericId = Number.parseInt(value, 10);
      if (Number.isFinite(numericId)) {
        return numericId;
      }
    }

    return null;
  }

  private readOptionalString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    return null;
  }



  private normalizeGlobalRoles(value: unknown): string[] | null {
    if (!value) {
      return null;
    }

    const collected = new Set<string>();
    const addRoles = (input: unknown) => {
      const roles = this.normalizeRoleArray(input);
      roles?.forEach(role => collected.add(role));
    };

    if (Array.isArray(value) || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      addRoles(value);
      return collected.size ? Array.from(collected) : null;
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      let foundExplicit = false;

      for (const key of ['global', 'global_roles', 'globalRoles']) {
        if (key in record) {
          foundExplicit = true;
          addRoles(record[key]);
        }
      }

      if (!foundExplicit) {
        for (const [key, flag] of Object.entries(record)) {
          if (typeof flag === 'boolean' && flag) {
            const normalizedKey = key.trim().toLowerCase();
            if (normalizedKey) {
              collected.add(normalizedKey);
            }
          }
        }
      }
    }

    return collected.size ? Array.from(collected) : null;
  }

  private normalizeRoleArray(value: unknown): string[] | null {
    if (Array.isArray(value)) {
      const normalized = value
        .map(role => (typeof role === 'string' ? role.trim().toLowerCase() : null))
        .filter((role): role is string => !!role);
      return normalized.length ? Array.from(new Set(normalized)) : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed ? [trimmed] : null;
    }

    if (typeof value === 'number') {
      const converted = String(value).trim().toLowerCase();
      return converted ? [converted] : null;
    }

    if (typeof value === 'boolean') {
      return value ? ['admin'] : null;
    }

    return null;
  }

  private normalizeScopedRoles(value: unknown): Record<number, string[]> {
    const result: Record<number, string[]> = {};
    if (!value) {
      return result;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (typeof entry === 'number' || typeof entry === 'string') {
          const id = this.normalizeId(entry);
          if (id != null) {
            this.appendScopedRoles(result, id, ['admin']);
          }
          continue;
        }

        if (!entry || typeof entry !== 'object') {
          continue;
        }

        const record = entry as Record<string, unknown>;
        const id =
          this.normalizeId(record['id']) ??
          this.normalizeId(record['restaurant_id']) ??
          this.normalizeId(record['restaurantId']) ??
          this.normalizeId(record['chain_id']) ??
          this.normalizeId(record['chainId']);

        if (id == null) {
          continue;
        }

        const roles =
          this.normalizeRoleArray(record['roles']) ??
          this.normalizeRoleArray(record['role']) ??
          this.normalizeRoleArray(record['role_names']) ??
          this.normalizeRoleArray(record['roleNames']);

        if (roles?.length) {
          this.appendScopedRoles(result, id, roles);
          continue;
        }

        if (this.readBoolean(record['admin'] ?? record['is_admin'] ?? record['isAdmin'])) {
          this.appendScopedRoles(result, id, ['admin']);
        }
      }

      return result;
    }

    if (typeof value === 'object') {
      for (const [key, rawRoles] of Object.entries(value as Record<string, unknown>)) {
        const id = this.normalizeId(key);
        if (id == null) {
          continue;
        }

        if (Array.isArray(rawRoles) || typeof rawRoles === 'string') {
          const roles = this.normalizeRoleArray(rawRoles);
          if (roles?.length) {
            this.appendScopedRoles(result, id, roles);
          }
          continue;
        }

        if (typeof rawRoles === 'boolean') {
          if (rawRoles) {
            this.appendScopedRoles(result, id, ['admin']);
          }
          continue;
        }

        if (typeof rawRoles === 'number') {
          if (rawRoles === 1) {
            this.appendScopedRoles(result, id, ['admin']);
          }
          continue;
        }

        if (rawRoles && typeof rawRoles === 'object') {
          const nested = rawRoles as Record<string, unknown>;
          const roles =
            this.normalizeRoleArray(nested['roles']) ??
            this.normalizeRoleArray(nested['role']) ??
            this.normalizeRoleArray(nested['role_names']) ??
            this.normalizeRoleArray(nested['roleNames']);

          if (roles?.length) {
            this.appendScopedRoles(result, id, roles);
            continue;
          }

          if (this.readBoolean(nested['admin'] ?? nested['is_admin'] ?? nested['isAdmin'])) {
            this.appendScopedRoles(result, id, ['admin']);
            continue;
          }
        }
      }
    }

    return result;
  }

  private normalizeIdArray(value: unknown): number[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      const ids: number[] = [];
      for (const item of value) {
        const id = this.normalizeId(item);
        if (id != null) {
          ids.push(id);
        }
      }
      return ids;
    }

    const id = this.normalizeId(value);
    return id != null ? [id] : [];
  }

  private appendScopedRoles(target: Record<number, string[]>, id: number, roles: string[]): void {
    if (!roles || !roles.length) {
      return;
    }

    const normalizedRoles = roles
      .map(role => role.trim().toLowerCase())
      .filter(role => !!role);

    if (!normalizedRoles.length) {
      return;
    }

    const current = target[id] ?? [];
    const merged = new Set(current.map(role => role.trim().toLowerCase()));
    normalizedRoles.forEach(role => merged.add(role));
    target[id] = Array.from(merged);
  }

  private readBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      if (value === 1) {
        return true;
      }
      if (value === 0) {
        return false;
      }
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'yes', 'y'].includes(normalized)) {
        return true;
      }
      if (['false', '0', 'no', 'n'].includes(normalized)) {
        return false;
      }
    }

    return false;
  }

  private isAdminRole(role: string): boolean {
    const normalized = role.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return (
      normalized === 'admin' ||
      normalized === 'administrator' ||
      normalized.endsWith('_admin') ||
      normalized.includes('admin')
    );
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}