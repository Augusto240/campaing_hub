import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly API_URL = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  getSessionsByCampaign(campaignId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/campaign/${campaignId}`);
  }

  getSessionById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  createSession(data: { campaignId: string; date: string; summary?: string; xpAwarded?: number }): Observable<any> {
    return this.http.post<any>(this.API_URL, data);
  }

  updateSession(id: string, data: { date?: string; summary?: string; xpAwarded?: number }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, data);
  }

  deleteSession(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}
