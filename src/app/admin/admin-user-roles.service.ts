import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, firstValueFrom, map, of, tap, throwError } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { UserRole, UserSummary } from '../core/models';

interface UserRoleApiResponse {
  id: number;
  user_id?: number;
  userId?: number;
  role: string;
  resource_type?: string | null;
  resourceType?: string | null;
  resource_id?: number | null;
  resourceId?: number | null;
}

interface UserApiResponse {
  id: number;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

export interface UserRolePayload {
  role: string;
  resourceType: string | null;
  resourceId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AdminUserRolesService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private currentUserRolesCache: { userId: number; roles: UserRole[] } | null = null;

  listByUser(userId: number) {
    let params = new HttpParams();
    params = params.set('user_id', String(userId));

    return this.api.get<UserRoleApiResponse[]>('/user_roles', { params }).pipe(
      map(response => response.map(role => this.normalizeUserRole(role))),
      tap(roles => this.updateCacheIfCurrentUser(userId, roles))
    );
  }

  create(userId: number, payload: UserRolePayload) {
    const body = {
      user_role: {
        user_id: userId,
        role: payload.role,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId,
      },
    };

    return this.api.post<UserRoleApiResponse>('/user_roles', body).pipe(
      map(role => this.normalizeUserRole(role)),
      tap(role => this.mergeIntoCache(role))
    );
  }

  update(roleId: number, payload: UserRolePayload) {
    const body = {
      user_role: {
        role: payload.role,
        resource_type: payload.resourceType,
        resource_id: payload.resourceId,
      },
    };

    return this.api.patch<UserRoleApiResponse>(`/user_roles/${roleId}`, body).pipe(
      map(role => this.normalizeUserRole(role)),
      tap(role => this.mergeIntoCache(role))
    );
  }

  delete(roleId: number) {
    return this.api.delete<unknown>(`/user_roles/${roleId}`).pipe(
      map(() => void 0),
      tap(() => this.removeFromCache(roleId))
    );
  }

  searchUsers(query: string) {
    const trimmed = query.trim();
    if (!trimmed) {
      return of<UserSummary[]>([]);
    }

    let params = new HttpParams();
    params = params.set('q[first_name_or_last_name_or_email_cont]', trimmed);

    return this.api.get<UserApiResponse[]>('/users', { params }).pipe(
      map(response => response.map(user => this.normalizeUser(user)))
    );
  }

  getCurrentUserRoles() {
    const currentUser = this.auth.user();
    if (!currentUser) {
      return of<UserRole[]>([]);
    }

    if (this.currentUserRolesCache && this.currentUserRolesCache.userId === currentUser.id) {
      return of(this.currentUserRolesCache.roles);
    }

    return this.listByUser(currentUser.id);
  }

  async isCurrentUserSuperAdmin(): Promise<boolean> {
    const currentUser = this.auth.user();
    if (!currentUser) {
      return false;
    }

    try {
      return await firstValueFrom(
        this.getCurrentUserRoles().pipe(
          map(roles => roles.some(role => role.role === 'super_admin')),
          catchError(error => {
            if (error instanceof HttpErrorResponse && error.status === 403) {
              return of(false);
            }

            return throwError(() => error);
          })
        )
      );
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 403) {
        return false;
      }

      throw error;
    }
  }

  private normalizeUserRole(role: UserRoleApiResponse): UserRole {
    const id = this.normalizeNumber(role.id);
    const userId = this.normalizeNumber(role.userId ?? role.user_id);
    const resourceId = this.normalizeOptionalNumber(role.resourceId ?? role.resource_id);
    const resourceType = this.normalizeOptionalString(role.resourceType ?? role.resource_type);

    return {
      id,
      userId,
      role: typeof role.role === 'string' ? role.role : String(role.role),
      resourceType,
      resourceId,
    };
  }

  private normalizeUser(user: UserApiResponse): UserSummary {
    return {
      id: this.normalizeNumber(user.id),
      email: this.normalizeOptionalString(user.email),
      firstName: this.normalizeOptionalString(user.first_name ?? user.firstName),
      lastName: this.normalizeOptionalString(user.last_name ?? user.lastName),
    };
  }

  private normalizeNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    throw new Error(`Invalid numeric value received: ${value}`);
  }

  private normalizeOptionalNumber(value: unknown): number | null {
    if (value == null) {
      return null;
    }

    try {
      return this.normalizeNumber(value);
    } catch {
      return null;
    }
  }

  private normalizeOptionalString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    return null;
  }

  private updateCacheIfCurrentUser(userId: number, roles: UserRole[]): void {
    const currentUser = this.auth.user();
    if (!currentUser || currentUser.id !== userId) {
      return;
    }

    this.currentUserRolesCache = { userId, roles };
  }

  private mergeIntoCache(role: UserRole): void {
    const currentUser = this.auth.user();
    if (!currentUser || currentUser.id !== role.userId) {
      return;
    }

    const existing = this.currentUserRolesCache?.roles ?? [];
    const index = existing.findIndex(item => item.id === role.id);
    const next = [...existing];

    if (index === -1) {
      next.push(role);
    } else {
      next[index] = role;
    }

    this.currentUserRolesCache = { userId: currentUser.id, roles: next };
  }

  private removeFromCache(roleId: number): void {
    if (!this.currentUserRolesCache) {
      return;
    }

    const next = this.currentUserRolesCache.roles.filter(role => role.id !== roleId);
    this.currentUserRolesCache = { ...this.currentUserRolesCache, roles: next };
  }
}
