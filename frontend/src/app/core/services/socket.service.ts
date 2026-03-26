import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;

  constructor(private readonly authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      return;
    }

    this.socket = io(environment.apiUrl.replace('/api', ''), {
      auth: { token },
      transports: ['websocket'],
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinCampaign(campaignId: string): void {
    this.connect();
    this.socket?.emit('campaign:join', campaignId);
  }

  leaveCampaign(campaignId: string): void {
    this.socket?.emit('campaign:leave', campaignId);
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>((observer) => {
      const listener = (payload: T) => observer.next(payload);
      this.connect();
      this.socket?.on(event, listener);

      return () => {
        this.socket?.off(event, listener);
      };
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
