import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DiceRoll, DiceRollWithUser, DiceRollInput, ApiResponse } from '../types/api.types';

@Injectable({ providedIn: 'root' })
export class DiceRollService {
  private readonly API_URL = `${environment.apiUrl}/dice`;

  constructor(private http: HttpClient) {}

  createRoll(payload: DiceRollInput): Observable<ApiResponse<DiceRoll>> {
    return this.http.post<ApiResponse<DiceRoll>>(`${this.API_URL}/roll`, payload);
  }

  getCampaignRolls(
    campaignId: string,
    options?: { sessionId?: string; limit?: number }
  ): Observable<ApiResponse<DiceRollWithUser[]>> {
    let params = new HttpParams();
    if (options?.sessionId) {
      params = params.set('sessionId', options.sessionId);
    }
    if (options?.limit) {
      params = params.set('limit', String(options.limit));
    }
    return this.http.get<ApiResponse<DiceRollWithUser[]>>(`${this.API_URL}/campaign/${campaignId}`, { params });
  }
}
