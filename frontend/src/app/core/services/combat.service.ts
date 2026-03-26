import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CombatEncounter,
  Combatant,
  AddCombatantPayload,
  UpdateCombatantPayload,
} from '../types';

interface CreateEncounterPayload {
  name: string;
  combatants: AddCombatantPayload[];
}

@Injectable({ providedIn: 'root' })
export class CombatService {
  private readonly sessionsApiUrl = `${environment.apiUrl}/sessions`;
  private readonly combatApiUrl = `${environment.apiUrl}/combat`;

  constructor(private readonly http: HttpClient) {}

  createEncounter(
    sessionId: string,
    payload: CreateEncounterPayload
  ): Observable<ApiResponse<CombatEncounter>> {
    return this.http.post<ApiResponse<CombatEncounter>>(
      `${this.sessionsApiUrl}/${sessionId}/combat`,
      payload
    );
  }

  listSessionEncounters(sessionId: string): Observable<ApiResponse<CombatEncounter[]>> {
    return this.http.get<ApiResponse<CombatEncounter[]>>(
      `${this.sessionsApiUrl}/${sessionId}/combat`
    );
  }

  getEncounter(encounterId: string): Observable<ApiResponse<CombatEncounter>> {
    return this.http.get<ApiResponse<CombatEncounter>>(`${this.combatApiUrl}/${encounterId}`);
  }

  nextTurn(encounterId: string): Observable<ApiResponse<CombatEncounter>> {
    return this.http.patch<ApiResponse<CombatEncounter>>(
      `${this.combatApiUrl}/${encounterId}/next-turn`,
      {}
    );
  }

  reorder(encounterId: string, combatantIds: string[]): Observable<ApiResponse<CombatEncounter>> {
    return this.http.patch<ApiResponse<CombatEncounter>>(
      `${this.combatApiUrl}/${encounterId}/reorder`,
      { combatantIds }
    );
  }

  updateCombatant(
    encounterId: string,
    combatantId: string,
    payload: UpdateCombatantPayload
  ): Observable<ApiResponse<Combatant>> {
    return this.http.patch<ApiResponse<Combatant>>(
      `${this.combatApiUrl}/${encounterId}/combatants/${combatantId}`,
      payload
    );
  }

  addCombatant(
    encounterId: string,
    payload: AddCombatantPayload
  ): Observable<ApiResponse<Combatant>> {
    return this.http.post<ApiResponse<Combatant>>(
      `${this.combatApiUrl}/${encounterId}/combatants`,
      payload
    );
  }

  removeCombatant(encounterId: string, combatantId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.combatApiUrl}/${encounterId}/combatants/${combatantId}`
    );
  }
}
