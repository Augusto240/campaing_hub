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

  deleteCharacter(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }
}
