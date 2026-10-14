import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotifyService } from './notify.service';

/** Adds the JWT to API calls and logs the user out when the server rejects the token. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notify = inject(NotifyService);
  const token = auth.token;

  const isApi = req.url.startsWith(environment.apiUrl);
  const authReq = token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && token && isApi) {
        notify.error('Your session has ended. Please log in again.');
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
