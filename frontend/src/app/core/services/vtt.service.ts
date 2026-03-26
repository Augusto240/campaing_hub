import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types';

export interface GameMap {
  id: string;
  campaignId: string;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
  gridType: 'SQUARE' | 'HEX_HORIZONTAL' | 'HEX_VERTICAL' | 'NONE';
  gridSize: number;
  gridColor: string;
  gridOpacity: number;
  fogOfWar: { revealed: { x: number; y: number; radius: number }[] } | null;
  walls: unknown[] | null;
  lights: unknown[] | null;
  isActive: boolean;
  tokens?: MapToken[];
  createdAt: string;
  updatedAt: string;
}

export interface MapToken {
  id: string;
  mapId: string;
  name: string;
  imageUrl: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isVisible: boolean;
  isLocked: boolean;
  layer: string;
  conditions: string[];
  hp: number | null;
  maxHp: number | null;
  aura: unknown | null;
  vision: unknown | null;
  controlledBy: string[];
  character?: { id: string; name: string; imageUrl: string | null };
  creature?: { id: string; name: string };
}

export interface CreateMapPayload {
  name: string;
  imageUrl: string;
  width?: number;
  height?: number;
  gridType?: GameMap['gridType'];
  gridSize?: number;
}

export interface CreateTokenPayload {
  name: string;
  imageUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  characterId?: string;
  creatureId?: string;
  controlledBy?: string[];
}

export interface MoveTokenPayload {
  x: number;
  y: number;
  rotation?: number;
}

@Injectable({ providedIn: 'root' })
export class VttService {
  private readonly API_URL = `${environment.apiUrl}/vtt`;

  constructor(private http: HttpClient) {}

  // === MAPS ===

  getMaps(campaignId: string): Observable<ApiResponse<GameMap[]>> {
    return this.http.get<ApiResponse<GameMap[]>>(`${this.API_URL}/campaign/${campaignId}/maps`);
  }

  getMap(mapId: string): Observable<ApiResponse<GameMap>> {
    return this.http.get<ApiResponse<GameMap>>(`${this.API_URL}/maps/${mapId}`);
  }

  createMap(campaignId: string, payload: CreateMapPayload): Observable<ApiResponse<GameMap>> {
    return this.http.post<ApiResponse<GameMap>>(
      `${this.API_URL}/campaign/${campaignId}/maps`,
      payload
    );
  }

  updateMap(mapId: string, payload: Partial<CreateMapPayload>): Observable<ApiResponse<GameMap>> {
    return this.http.put<ApiResponse<GameMap>>(`${this.API_URL}/maps/${mapId}`, payload);
  }

  deleteMap(mapId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/maps/${mapId}`);
  }

  setActiveMap(campaignId: string, mapId: string): Observable<ApiResponse<GameMap>> {
    return this.http.post<ApiResponse<GameMap>>(
      `${this.API_URL}/campaign/${campaignId}/maps/${mapId}/activate`,
      {}
    );
  }

  // === TOKENS ===

  createToken(mapId: string, payload: CreateTokenPayload): Observable<ApiResponse<MapToken>> {
    return this.http.post<ApiResponse<MapToken>>(`${this.API_URL}/maps/${mapId}/tokens`, payload);
  }

  updateToken(
    tokenId: string,
    payload: Partial<CreateTokenPayload>
  ): Observable<ApiResponse<MapToken>> {
    return this.http.put<ApiResponse<MapToken>>(`${this.API_URL}/tokens/${tokenId}`, payload);
  }

  moveToken(tokenId: string, payload: MoveTokenPayload): Observable<ApiResponse<MapToken>> {
    return this.http.post<ApiResponse<MapToken>>(`${this.API_URL}/tokens/${tokenId}/move`, payload);
  }

  deleteToken(tokenId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/tokens/${tokenId}`);
  }

  batchMoveTokens(
    moves: { tokenId: string; x: number; y: number; rotation?: number }[]
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/tokens/batch-move`, { moves });
  }

  // === FOG OF WAR ===

  revealFog(
    mapId: string,
    areas: { x: number; y: number; radius: number }[]
  ): Observable<ApiResponse<GameMap>> {
    return this.http.post<ApiResponse<GameMap>>(`${this.API_URL}/maps/${mapId}/fog/reveal`, {
      areas,
    });
  }

  resetFog(mapId: string): Observable<ApiResponse<GameMap>> {
    return this.http.post<ApiResponse<GameMap>>(`${this.API_URL}/maps/${mapId}/fog/reset`, {});
  }
}
