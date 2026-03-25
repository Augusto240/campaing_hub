import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Session,
  SessionWithRelations,
  CreateSessionInput,
  UpdateSessionInput,
  ApiResponse,
} from '../types/api.types';

/** Input for updating session narrative log */
export interface UpdateSessionLogInput {
  narrativeLog?: string;
  privateGmNotes?: string;
  highlights?: string[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly API_URL = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  getSessionsByCampaign(campaignId: string): Observable<ApiResponse<SessionWithRelations[]>> {
    return this.http.get<ApiResponse<SessionWithRelations[]>>(`${this.API_URL}/campaign/${campaignId}`);
  }

  getSessionById(id: string): Observable<ApiResponse<SessionWithRelations>> {
    return this.http.get<ApiResponse<SessionWithRelations>>(`${this.API_URL}/${id}`);
  }

  createSession(data: CreateSessionInput): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(this.API_URL, data);
  }

  updateSession(id: string, data: UpdateSessionInput): Observable<ApiResponse<Session>> {
    return this.http.put<ApiResponse<Session>>(`${this.API_URL}/${id}`, data);
  }

  updateSessionLog(id: string, data: UpdateSessionLogInput): Observable<ApiResponse<Session>> {
    return this.http.patch<ApiResponse<Session>>(`${this.API_URL}/${id}/log`, data);
  }

  deleteSession(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${id}`);
  }

  getSessionReport(id: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${id}/report`, {
      responseType: 'blob'
    });
  }
}
