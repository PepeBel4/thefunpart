import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { ApiService } from './api.service';
import { Router } from '@angular/router';
import { SessionUser } from './models';
import { firstValueFrom } from 'rxjs';
import { CartService } from '../cart/cart.service';


interface LoginPayload { email: string; password: string; }
interface RegisterPayload {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

interface PasswordResetPayload {
  email: string;
}

interface PasswordResetUpdatePayload {
  reset_password_token: string;
  password: string;
  password_confirmation: string;
}


@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private cart = inject(CartService);
  private readonly storageKey = 'thefunpart:sessionUser';


  private _user = signal<SessionUser | null>(null);
  user = computed(() => this._user());
  isLoggedIn = computed(() => !!this._user());
  canAccessAdmin = computed(() => this.userHasAdminAccess(this._user()));
  canAccessRestaurantAdmin = computed(() => this.userHasRestaurantAdminAccess(this._user()));
  canAccessChainAdmin = computed(() => this.userHasChainAdminAccess(this._user()));
  isSuperAdmin = computed(() => this.userHasRole(this._user(), 'super_admin'));


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


  async requestPasswordReset(email: string) {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return;
    }

    const payload: PasswordResetPayload = { email: normalizedEmail };

    await firstValueFrom(
      this.api.post('/auth/password', {
        user: payload,
      })
    );
  }

  async finishPasswordReset(token: string, password: string, confirmation: string) {
    const payload: PasswordResetUpdatePayload = {
      reset_password_token: token,
      password,
      password_confirmation: confirmation,
    };

    await firstValueFrom(
      this.api.put('/auth/password', {
        user: payload,
      })
    );
  }


  async logout() {
    await firstValueFrom(this.api.delete('/auth/logout', {}));
    this.cart.clear();
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
      userRecord['user_roles'],
      userRecord['userRoles'],
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

  getChainAdminChainIds(): number[] {
    const user = this._user();
    if (!user) {
      return [];
    }

    return Object.entries(user.chainRoles)
      .filter(([, roles]) => roles.some(role => this.isAdminRole(role)))
      .map(([id]) => Number.parseInt(id, 10))
      .filter(id => Number.isFinite(id));
  }

  hasChainAdminAccessForChain(chainId: number): boolean {
    if (!Number.isFinite(chainId)) {
      return false;
    }

    const user = this._user();
    if (!user) {
      return false;
    }

    if (this.userHasRole(user, 'super_admin')) {
      return true;
    }

    const roles = user.chainRoles?.[chainId];
    if (!roles) {
      return false;
    }

    return roles.some(role => this.isAdminRole(role));
  }

  private userHasAdminAccess(user: SessionUser | null): boolean {
    return this.userHasRestaurantAdminAccess(user) || this.userHasChainAdminAccess(user);
  }

  private userHasRestaurantAdminAccess(user: SessionUser | null): boolean {
    if (!user) {
      return false;
    }

    const normalizedRoles = user.roles
      .map(role => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
      .filter(role => !!role);

    if (normalizedRoles.includes('super_admin')) {
      return true;
    }

    if (normalizedRoles.includes('restaurant_admin')) {
      return true;
    }

    const hasGeneralAdminRole = normalizedRoles.some(role => role !== 'chain_admin' && this.isAdminRole(role));
    if (hasGeneralAdminRole) {
      return true;
    }

    return this.hasScopedAdminRole(user.restaurantRoles);
  }

  private userHasChainAdminAccess(user: SessionUser | null): boolean {
    if (!user) {
      return false;
    }

    const normalizedRoles = user.roles
      .map(role => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
      .filter(role => !!role);

    if (normalizedRoles.includes('super_admin')) {
      return true;
    }

    if (normalizedRoles.includes('chain_admin')) {
      return true;
    }

    return this.hasScopedAdminRole(user.chainRoles);
  }

  private hasScopedAdminRole(scopedRoles: Record<number, string[]>): boolean {
    return Object.values(scopedRoles).some(roles => roles.some(role => this.isAdminRole(role)));
  }

  private userHasRole(user: SessionUser | null, role: string): boolean {
    if (!user) {
      return false;
    }

    const normalizedTarget = role.trim().toLowerCase();
    if (!normalizedTarget) {
      return false;
    }

    return user.roles.some(candidate => {
      if (typeof candidate !== 'string') {
        return false;
      }
      return candidate.trim().toLowerCase() === normalizedTarget;
    });
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
    const collected = new Set<string>();

    const addRole = (role: unknown) => {
      if (typeof role === 'string') {
        const normalized = role.trim().toLowerCase();
        if (normalized) {
          collected.add(normalized);
        }
        return true;
      }

      if (typeof role === 'number') {
        const normalized = String(role).trim().toLowerCase();
        if (normalized) {
          collected.add(normalized);
        }
        return true;
      }

      if (typeof role === 'boolean') {
        if (role) {
          collected.add('admin');
        }
        return true;
      }

      return false;
    };

    const visit = (input: unknown) => {
      if (input == null) {
        return;
      }

      if (Array.isArray(input)) {
        for (const entry of input) {
          visit(entry);
        }
        return;
      }

      if (addRole(input)) {
        return;
      }

      if (typeof input === 'object') {
        const record = input as Record<string, unknown>;

        let foundCandidate = false;

        const arrayKeys = ['roles', 'user_roles', 'userRoles', 'role_names', 'roleNames'];
        for (const key of arrayKeys) {
          if (key in record) {
            foundCandidate = true;
            visit(record[key]);
          }
        }

        const explicitKeys = ['role', 'role_name', 'roleName'];
        for (const key of explicitKeys) {
          if (key in record) {
            foundCandidate = true;
            visit(record[key]);
          }
        }

        if (!foundCandidate) {
          const secondaryKeys = ['name', 'value', 'type', 'code'];
          for (const key of secondaryKeys) {
            if (key in record) {
              foundCandidate = true;
              visit(record[key]);
            }
          }
        }

        if (this.readBoolean(record['admin'] ?? record['is_admin'] ?? record['isAdmin'])) {
          collected.add('admin');
          foundCandidate = true;
        }

        if (!foundCandidate) {
          for (const [key, flag] of Object.entries(record)) {
            if (typeof flag === 'boolean' && flag) {
              addRole(key);
            }
          }
        }
      }
    };

    visit(value);

    return collected.size ? Array.from(collected) : null;
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
          this.normalizeRoleArray(record['user_roles']) ??
          this.normalizeRoleArray(record['userRoles']) ??
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
            this.normalizeRoleArray(nested['user_roles']) ??
            this.normalizeRoleArray(nested['userRoles']) ??
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