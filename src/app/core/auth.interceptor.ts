import { HttpInterceptorFn } from '@angular/common/http';

// If you later switch to token-based auth, add Authorization header here.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
