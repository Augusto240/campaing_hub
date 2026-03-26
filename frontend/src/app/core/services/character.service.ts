import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  Character,
  CreateCharacterPayload,
  UpdateCharacterPayload,
  CharacterResources,
  SanityCheckPayload,
  SanityCheckResult,
  SanityEvent,
  CastSpellPayload,
  CastSpellResult,
  SpellCast,
} from '../types';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly API_URL = `${environment.apiUrl}/characters`;

  constructor(private http: HttpClient) {}

  getCharactersByCampaign(campaignId: string): Observable<ApiResponse<Character[]>> {
    return this.http.get<ApiResponse<Character[]>>(`${this.API_URL}/campaign/${campaignId}`);
  }

  getCharacterById(id: string): Observable<ApiResponse<Character>> {
    return this.http.get<ApiResponse<Character>>(`${this.API_URL}/${id}`);
  }

  createCharacter(data: CreateCharacterPayload): Observable<ApiResponse<Character>> {
    return this.http.post<ApiResponse<Character>>(this.API_URL, data);
  }

  updateCharacter(id: string, data: UpdateCharacterPayload): Observable<ApiResponse<Character>> {
    return this.http.put<ApiResponse<Character>>(`${this.API_URL}/${id}`, data);
  }

  updateResources(id: string, resources: CharacterResources): Observable<ApiResponse<Character>> {
    return this.http.patch<ApiResponse<Character>>(`${this.API_URL}/${id}/resources`, { resources });
  }

  sanityCheck(id: string, data: SanityCheckPayload): Observable<ApiResponse<SanityCheckResult>> {
    return this.http.post<ApiResponse<SanityCheckResult>>(`${this.API_URL}/${id}/sanity-check`, data);
  }

  getSanityEvents(id: string): Observable<ApiResponse<SanityEvent[]>> {
    return this.http.get<ApiResponse<SanityEvent[]>>(`${this.API_URL}/${id}/sanity-events`);
  }

  castSpell(id: string, data: CastSpellPayload): Observable<ApiResponse<CastSpellResult>> {
    return this.http.post<ApiResponse<CastSpellResult>>(`${this.API_URL}/${id}/spell-cast`, data);
  }

  getSpellCasts(id: string): Observable<ApiResponse<SpellCast[]>> {
    return this.http.get<ApiResponse<SpellCast[]>>(`${this.API_URL}/${id}/spell-casts`);
  }

  deleteCharacter(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }
}
