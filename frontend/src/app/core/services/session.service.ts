import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  Session,
  CreateSessionPayload,
  UpdateSessionPayload,
} from '../types';

interface UpdateSessionLogPayload {
  narrativeLog?: string;
  privateGmNotes?: string;
  highlights?: string[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly API_URL = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  getSessionsByCampaign(campaignId: string): Observable<ApiResponse<Session[]>> {
    return this.http.get<ApiResponse<Session[]>>(`${this.API_URL}/campaign/${campaignId}`);
  }

  getSessionById(id: string): Observable<ApiResponse<Session>> {
    return this.http.get<ApiResponse<Session>>(`${this.API_URL}/${id}`);
  }

  createSession(data: CreateSessionPayload): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(this.API_URL, data);
  }

  updateSession(id: string, data: UpdateSessionPayload): Observable<ApiResponse<Session>> {
    return this.http.put<ApiResponse<Session>>(`${this.API_URL}/${id}`, data);
  }

  updateSessionLog(id: string, data: UpdateSessionLogPayload): Observable<ApiResponse<Session>> {
    return this.http.patch<ApiResponse<Session>>(`${this.API_URL}/${id}/log`, data);
  }

  deleteSession(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }
}
