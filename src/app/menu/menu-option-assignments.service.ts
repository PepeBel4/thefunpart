import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { MenuOptionAssignment, MenuOptionAssignmentInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuOptionAssignmentsService {
  private api = inject(ApiService);

  list(params: Record<string, unknown> = {}) {
    return this.api.get<MenuOptionAssignment[]>('/option_assignments', { params });
  }

  create(payload: MenuOptionAssignmentInput) {
    return this.api.post<MenuOptionAssignment>('/option_assignments', {
      option_assignment: payload,
    });
  }

  update(id: number, payload: MenuOptionAssignmentInput) {
    return this.api.put<MenuOptionAssignment>(`/option_assignments/${id}`, {
      option_assignment: payload,
    });
  }

  delete(id: number) {
    return this.api.delete<void>(`/option_assignments/${id}`);
  }
}
