import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../core/api.service';
import { AdminRestaurantUsersService } from './admin-restaurant-users.service';

describe('AdminRestaurantUsersService', () => {
  let service: AdminRestaurantUsersService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get']);

    TestBed.configureTestingModule({
      providers: [
        AdminRestaurantUsersService,
        { provide: ApiService, useValue: api },
      ],
    });

    service = TestBed.inject(AdminRestaurantUsersService);
    api.get.and.returnValue(of([]));
  });

  it('forwards the search term as a ransack email/name predicate', () => {
    service.list(10, { filters: { searchTerm: 'example.com' } }).subscribe();

    expect(api.get).toHaveBeenCalled();
    const [, options] = api.get.calls.mostRecent().args;

    expect(options?.params).toEqual(
      jasmine.objectContaining({
        'q[email_or_first_name_or_last_name_i_cont]': 'example.com',
      })
    );
  });

  it('omits the search predicate when no term is provided', () => {
    service.list(5).subscribe();

    const [, options] = api.get.calls.mostRecent().args;
    expect(options?.params).toEqual({});
  });
});
