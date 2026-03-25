import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification, ApiResponse } from '../types/api.types';

/** Response for listing notifications */
export interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getNotifications(): Observable<ApiResponse<NotificationListResponse>> {
    return this.http.get<ApiResponse<NotificationListResponse>>(this.API_URL).pipe(
      tap(response => {
        if (response.data) {
          this.unreadCountSubject.next(response.data.unreadCount);
        }
      })
    );
  }

  markAsRead(notificationId: string): Observable<ApiResponse<Notification>> {
    return this.http.put<ApiResponse<Notification>>(`${this.API_URL}/${notificationId}/read`, {}).pipe(
      tap(() => {
        const currentCount = this.unreadCountSubject.value;
        this.unreadCountSubject.next(Math.max(0, currentCount - 1));
      })
    );
  }

  markAllAsRead(): Observable<ApiResponse<{ message: string; count: number }>> {
    return this.http.put<ApiResponse<{ message: string; count: number }>>(`${this.API_URL}/read-all`, {}).pipe(
      tap(() => {
        this.unreadCountSubject.next(0);
      })
    );
  }
}
