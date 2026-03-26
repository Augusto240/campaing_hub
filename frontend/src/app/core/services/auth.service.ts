import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse, User, AuthTokens, Role } from '../types';

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUserSubject.next(user);
      } catch {
        this.logout();
      }
    }
  }

  register(name: string, email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, { name, email, password }).pipe(
      tap((response) => {
        if (response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  login(email: string, password: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, { email, password }).pipe(
      tap((response) => {
        if (response.data) {
          this.setSession(response.data);
        }
      })
    );
  }

  logout(): void {
    const refreshToken = localStorage.getItem('refreshToken');

    this.clearSession();

    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({
        error: () => {},
      });
    }
  }

  clearSession(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<ApiResponse<AuthTokens>> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<ApiResponse<AuthTokens>>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        if (response.data) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      })
    );
  }

  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/profile`);
  }

  private setSession(authResult: AuthResponse): void {
    localStorage.setItem('accessToken', authResult.accessToken);
    localStorage.setItem('refreshToken', authResult.refreshToken);
    localStorage.setItem('user', JSON.stringify(authResult.user));
    this.currentUserSubject.next(authResult.user);
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}
