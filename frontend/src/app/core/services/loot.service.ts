import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LootService {
  private readonly API_URL = `${environment.apiUrl}/loot`;

  constructor(private http: HttpClient) {}

  getLootBySession(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/session/${sessionId}`);
  }

  createLoot(data: { sessionId: string; name: string; description?: string; value?: number; campaignId?: string }): Observable<any> {
    return this.http.post<any>(this.API_URL, data);
  }

  updateLoot(id: string, data: { name?: string; description?: string; value?: number }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, data);
  }

  deleteLoot(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }

  assignLoot(id: string, characterId: string | null): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/assign`, { characterId });
  }
}
