import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const restaurantAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.canAccessRestaurantAdmin()) {
    return true;
  }

  if (auth.canAccessChainAdmin()) {
    void router.navigate(['/admin', 'chains']);
  } else {
    void router.navigate(['/']);
  }

  return false;
};
