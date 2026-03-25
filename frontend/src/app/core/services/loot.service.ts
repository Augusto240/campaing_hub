import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Loot,
  LootWithRelations,
  CreateLootInput,
  UpdateLootInput,
  AssignLootInput,
  ApiResponse,
} from '../types/api.types';

/** Extended create loot input with optional campaignId for convenience */
export interface CreateLootRequest extends CreateLootInput {
  campaignId?: string;
}

@Injectable({ providedIn: 'root' })
export class LootService {
  private readonly API_URL = `${environment.apiUrl}/loot`;

  constructor(private http: HttpClient) {}

  getLootBySession(sessionId: string): Observable<ApiResponse<LootWithRelations[]>> {
    return this.http.get<ApiResponse<LootWithRelations[]>>(`${this.API_URL}/session/${sessionId}`);
  }

  createLoot(data: CreateLootRequest): Observable<ApiResponse<Loot>> {
    return this.http.post<ApiResponse<Loot>>(this.API_URL, data);
  }

  updateLoot(id: string, data: UpdateLootInput): Observable<ApiResponse<Loot>> {
    return this.http.put<ApiResponse<Loot>>(`${this.API_URL}/${id}`, data);
  }

  deleteLoot(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${id}`);
  }

  assignLoot(id: string, characterId: string | null): Observable<ApiResponse<Loot>> {
    const payload: AssignLootInput = { characterId };
    return this.http.post<ApiResponse<Loot>>(`${this.API_URL}/${id}/assign`, payload);
  }
}
