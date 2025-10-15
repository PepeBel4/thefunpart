import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';
import { UserProfile, UserProfileInput } from './models';

interface ProfileApiResponse {
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private api = inject(ApiService);

  getProfile() {
    return this.api.get<ProfileApiResponse>('/profile').pipe(map((response) => this.normalize(response)));
  }

  updateProfile(input: UserProfileInput) {
    const payload = {
      user: {
        first_name: input.firstName,
        last_name: input.lastName,
        gender: input.gender,
        birth_date: input.birthDate,
      },
    };

    return this.api.put<ProfileApiResponse>('/profile', payload).pipe(map((response) => this.normalize(response)));
  }

  private normalize(response: ProfileApiResponse | null | undefined): UserProfile {
    if (!response || typeof response !== 'object') {
      return { firstName: null, lastName: null, gender: null, birthDate: null };
    }

    const firstName = this.normalizeString(response.first_name ?? response.firstName);
    const lastName = this.normalizeString(response.last_name ?? response.lastName);
    const gender = this.normalizeString(response.gender);
    const birthDate = this.normalizeDate(response.birth_date ?? response.birthDate);

    return {
      firstName,
      lastName,
      gender,
      birthDate,
    };
  }

  private normalizeString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }

    return null;
  }

  private normalizeDate(value: unknown): string | null {
    const normalized = this.normalizeString(value);
    if (!normalized) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      return normalized;
    }

    if (/^\d{4}-\d{2}-\d{2}T/.test(normalized)) {
      return normalized.split('T')[0];
    }

    return normalized;
  }
}
