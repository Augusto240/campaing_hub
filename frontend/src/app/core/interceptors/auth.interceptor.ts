import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

interface RefreshTokenResponse {
  data?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new ReplaySubject<string | null>(1);

  constructor(private authService: AuthService) {}

  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/login') ||
           url.includes('/auth/register') ||
           url.includes('/auth/refresh') ||
           url.includes('/auth/logout');
  }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }

    const token = this.authService.getToken();

    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !this.isAuthEndpoint(request.url)) {
          return this.handle401Error(request, next, error);
        }
        return throwError(() => error);
      })
    );
  }

  private addToken<T>(request: HttpRequest<T>, token: string): HttpRequest<T> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  private handle401Error(
    request: HttpRequest<unknown>,
    next: HttpHandler,
    sourceError: HttpErrorResponse
  ): Observable<HttpEvent<unknown>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.authService.clearSession();
      return throwError(() => sourceError);
    }

    if (this.isRefreshing) {
      return this.refreshTokenSubject.pipe(
        take(1),
        switchMap((newAccessToken) => {
          if (!newAccessToken) {
            return throwError(() => sourceError);
          }
          return next.handle(this.addToken(request, newAccessToken));
        })
      );
    }

    this.isRefreshing = true;
    this.refreshTokenSubject = new ReplaySubject<string | null>(1);

    return this.authService.refreshToken().pipe(
      switchMap((response: RefreshTokenResponse) => {
        const newAccessToken = response.data?.accessToken;
        if (!newAccessToken) {
          throw new Error('Refresh endpoint returned no access token');
        }
        this.refreshTokenSubject.next(newAccessToken);
        return next.handle(this.addToken(request, newAccessToken));
      }),
      catchError((refreshError: unknown) => {
        this.refreshTokenSubject.next(null);
        this.authService.clearSession();
        return throwError(() => refreshError);
      }),
      finalize(() => {
        this.isRefreshing = false;
      })
    );
  }
}
