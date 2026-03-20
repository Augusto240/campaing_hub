import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly API_URL = `${environment.apiUrl}/characters`;

  constructor(private http: HttpClient) {}

  getCharactersByCampaign(campaignId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/campaign/${campaignId}`);
  }

  getCharacterById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  createCharacter(data: { name: string; class: string; campaignId: string }): Observable<any> {
    return this.http.post<any>(this.API_URL, data);
  }

  updateCharacter(id: string, data: { name?: string; class?: string; level?: number; xp?: number }): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, data);
  }

  updateResources(id: string, resources: Record<string, string | number | boolean>): Observable<any> {
    return this.http.patch<any>(`${this.API_URL}/${id}/resources`, { resources });
  }

  sanityCheck(
    id: string,
    data: {
      roll: number;
      difficulty: number;
      trigger: string;
      sessionId?: string;
      successLoss?: number;
      failedLoss?: number;
    }
  ): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/sanity-check`, data);
  }

  getSanityEvents(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}/sanity-events`);
  }

  castSpell(
    id: string,
    data: {
      spellName: string;
      manaCost: number;
      faithCost?: number;
      result?: string;
      sessionId?: string;
    }
  ): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${id}/spell-cast`, data);
  }

  getSpellCasts(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}/spell-casts`);
  }

  deleteCharacter(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}
