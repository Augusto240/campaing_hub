import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateDiceRollPayload {
  campaignId: string;
  sessionId?: string;
  characterId?: string;
  formula: string;
  label?: string;
  isPrivate?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DiceRollService {
  private readonly API_URL = `${environment.apiUrl}/dice`;

  constructor(private http: HttpClient) {}

  createRoll(payload: CreateDiceRollPayload): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/roll`, payload);
  }

  getCampaignRolls(
    campaignId: string,
    options?: { sessionId?: string; limit?: number }
  ): Observable<any> {
    let params = new HttpParams();
    if (options?.sessionId) {
      params = params.set('sessionId', options.sessionId);
    }
    if (options?.limit) {
      params = params.set('limit', String(options.limit));
    }
    return this.http.get<any>(`${this.API_URL}/campaign/${campaignId}`, { params });
  }
}

