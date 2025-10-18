import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const chainAdminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.canAccessChainAdmin()) {
    return true;
  }

  if (auth.canAccessRestaurantAdmin()) {
    void router.navigate(['/admin', 'restaurants']);
  } else {
    void router.navigate(['/']);
  }

  return false;
};
