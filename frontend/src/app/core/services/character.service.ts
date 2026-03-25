import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Character,
  CharacterWithPlayer,
  CharacterResources,
  SanityEvent,
  SpellCast,
  CreateCharacterInput,
  UpdateCharacterInput,
  SpellCastInput,
  ApiResponse,
} from '../types/api.types';

/** Input for sanity check endpoint */
export interface SanityCheckRequest {
  roll: number;
  difficulty: number;
  trigger: string;
  sessionId?: string;
  successLoss?: number;
  failedLoss?: number;
}

/** Response from sanity check endpoint */
export interface SanityCheckResult {
  success: boolean;
  sanityLost: number;
  newSanity: number;
  tempInsanity: string | null;
  permInsanity: string | null;
  event: SanityEvent;
}

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private readonly API_URL = `${environment.apiUrl}/characters`;

  constructor(private http: HttpClient) {}

  getCharactersByCampaign(campaignId: string): Observable<ApiResponse<CharacterWithPlayer[]>> {
    return this.http.get<ApiResponse<CharacterWithPlayer[]>>(`${this.API_URL}/campaign/${campaignId}`);
  }

  getCharacterById(id: string): Observable<ApiResponse<CharacterWithPlayer>> {
    return this.http.get<ApiResponse<CharacterWithPlayer>>(`${this.API_URL}/${id}`);
  }

  createCharacter(data: CreateCharacterInput): Observable<ApiResponse<Character>> {
    return this.http.post<ApiResponse<Character>>(this.API_URL, data);
  }

  updateCharacter(id: string, data: UpdateCharacterInput): Observable<ApiResponse<Character>> {
    return this.http.put<ApiResponse<Character>>(`${this.API_URL}/${id}`, data);
  }

  updateResources(id: string, resources: CharacterResources): Observable<ApiResponse<Character>> {
    return this.http.patch<ApiResponse<Character>>(`${this.API_URL}/${id}/resources`, { resources });
  }

  sanityCheck(id: string, data: SanityCheckRequest): Observable<ApiResponse<SanityCheckResult>> {
    return this.http.post<ApiResponse<SanityCheckResult>>(`${this.API_URL}/${id}/sanity-check`, data);
  }

  getSanityEvents(id: string): Observable<ApiResponse<SanityEvent[]>> {
    return this.http.get<ApiResponse<SanityEvent[]>>(`${this.API_URL}/${id}/sanity-events`);
  }

  castSpell(id: string, data: SpellCastInput): Observable<ApiResponse<SpellCast>> {
    return this.http.post<ApiResponse<SpellCast>>(`${this.API_URL}/${id}/spell-cast`, data);
  }

  getSpellCasts(id: string): Observable<ApiResponse<SpellCast[]>> {
    return this.http.get<ApiResponse<SpellCast[]>>(`${this.API_URL}/${id}/spell-casts`);
  }

  deleteCharacter(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${id}`);
  }
}
