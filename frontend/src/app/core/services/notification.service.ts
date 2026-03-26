import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Notification } from '../types';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<ApiResponse<NotificationsResponse>> {
    return this.http.get<ApiResponse<NotificationsResponse>>(this.API_URL).pipe(
      tap((response) => {
        if (response.data) {
          this.unreadCountSubject.next(response.data.unreadCount);
        }
      })
    );
  }

  markAsRead(notificationId: string): Observable<ApiResponse<Notification>> {
    return this.http
      .put<ApiResponse<Notification>>(`${this.API_URL}/${notificationId}/read`, {})
      .pipe(
        tap(() => {
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        })
      );
  }

  markAllAsRead(): Observable<ApiResponse<null>> {
    return this.http.put<ApiResponse<null>>(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
      })
    );
  }
}
