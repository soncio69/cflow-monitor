import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // For this simple internal tool, we don't need JWT tokens
  // The auth is handled via localStorage flag
  return next(req);
};
