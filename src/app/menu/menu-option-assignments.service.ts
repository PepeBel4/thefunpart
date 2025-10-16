import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { MenuOptionAssignment, MenuOptionAssignmentInput } from '../core/models';

@Injectable({ providedIn: 'root' })
export class MenuOptionAssignmentsService {
  private api = inject(ApiService);

  list(params: Record<string, unknown> = {}) {
    return this.api.get<MenuOptionAssignment[]>('/menu_item_option_assignments', { params });
  }

  create(payload: MenuOptionAssignmentInput) {
    return this.api.post<MenuOptionAssignment>('/menu_item_option_assignments', {
      menu_item_option_assignment: payload,
    });
  }

  update(id: number, payload: MenuOptionAssignmentInput) {
    return this.api.put<MenuOptionAssignment>(`/menu_item_option_assignments/${id}`, {
      menu_item_option_assignment: payload,
    });
  }

  delete(id: number) {
    return this.api.delete<void>(`/menu_item_option_assignments/${id}`);
  }
}
