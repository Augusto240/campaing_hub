import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Loot, CreateLootPayload } from '../types';

interface UpdateLootPayload {
  name?: string;
  description?: string;
  value?: number;
}

@Injectable({ providedIn: 'root' })
export class LootService {
  private readonly API_URL = `${environment.apiUrl}/loot`;

  constructor(private http: HttpClient) {}

  getLootBySession(sessionId: string): Observable<ApiResponse<Loot[]>> {
    return this.http.get<ApiResponse<Loot[]>>(`${this.API_URL}/session/${sessionId}`);
  }

  createLoot(data: CreateLootPayload): Observable<ApiResponse<Loot>> {
    return this.http.post<ApiResponse<Loot>>(this.API_URL, data);
  }

  updateLoot(id: string, data: UpdateLootPayload): Observable<ApiResponse<Loot>> {
    return this.http.put<ApiResponse<Loot>>(`${this.API_URL}/${id}`, data);
  }

  deleteLoot(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }

  assignLoot(id: string, characterId: string | null): Observable<ApiResponse<Loot>> {
    return this.http.post<ApiResponse<Loot>>(`${this.API_URL}/${id}/assign`, { characterId });
  }
}
