import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import {
  Location,
  LocationInput,
  LocationOpeningHour,
  LocationOpeningHourException,
  LocationOpeningHourExceptionInput,
  LocationOpeningHourInput,
} from '../core/models';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private api = inject(ApiService);

  listForRestaurant(restaurantId: number) {
    return this.api.get<Location[]>('/locations', {
      params: {
        locatable_type: 'Restaurant',
        locatable_id: restaurantId,
      },
    });
  }

  createForRestaurant(restaurantId: number, payload: LocationInput) {
    return this.api.post<Location>('/locations', {
      location: {
        ...payload,
        locatable_type: 'Restaurant',
        locatable_id: restaurantId,
      },
    });
  }

  update(id: number, payload: LocationInput) {
    return this.api.put<Location>(`/locations/${id}`, {
      location: payload,
    });
  }

  delete(id: number) {
    return this.api.delete<void>(`/locations/${id}`);
  }

  listOpeningHours(locationId: number) {
    return this.api.get<LocationOpeningHour[]>(`/locations/${locationId}/opening_hours`);
  }

  createOpeningHour(locationId: number, payload: LocationOpeningHourInput) {
    return this.api.post<LocationOpeningHour>(`/locations/${locationId}/opening_hours`, {
      location_opening_hour: payload,
    });
  }

  updateOpeningHour(
    locationId: number,
    openingHourId: number,
    payload: LocationOpeningHourInput
  ) {
    return this.api.put<LocationOpeningHour>(
      `/locations/${locationId}/opening_hours/${openingHourId}`,
      {
        location_opening_hour: payload,
      }
    );
  }

  deleteOpeningHour(locationId: number, openingHourId: number) {
    return this.api.delete<void>(`/locations/${locationId}/opening_hours/${openingHourId}`);
  }

  listOpeningHourExceptions(locationId: number) {
    return this.api.get<LocationOpeningHourException[]>(
      `/locations/${locationId}/opening_hour_exceptions`
    );
  }

  createOpeningHourException(
    locationId: number,
    payload: LocationOpeningHourExceptionInput
  ) {
    return this.api.post<LocationOpeningHourException>(
      `/locations/${locationId}/opening_hour_exceptions`,
      {
        location_opening_hour_exception: payload,
      }
    );
  }

  updateOpeningHourException(
    locationId: number,
    exceptionId: number,
    payload: LocationOpeningHourExceptionInput
  ) {
    return this.api.put<LocationOpeningHourException>(
      `/locations/${locationId}/opening_hour_exceptions/${exceptionId}`,
      {
        location_opening_hour_exception: payload,
      }
    );
  }

  deleteOpeningHourException(locationId: number, exceptionId: number) {
    return this.api.delete<void>(
      `/locations/${locationId}/opening_hour_exceptions/${exceptionId}`
    );
  }
}
