import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Creature, CreateCreaturePayload } from '../types';

interface ListCreaturesOptions {
  systemId?: string;
  search?: string;
  creatureType?: string;
  includePrivate?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CreatureService {
  private readonly apiUrl = `${environment.apiUrl}/creatures`;

  constructor(private readonly http: HttpClient) {}

  list(options?: ListCreaturesOptions): Observable<ApiResponse<Creature[]>> {
    let params = new HttpParams();

    if (options?.systemId) {
      params = params.set('systemId', options.systemId);
    }
    if (options?.search) {
      params = params.set('search', options.search);
    }
    if (options?.creatureType) {
      params = params.set('creatureType', options.creatureType);
    }
    if (options?.includePrivate !== undefined) {
      params = params.set('includePrivate', String(options.includePrivate));
    }

    return this.http.get<ApiResponse<Creature[]>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<Creature>> {
    return this.http.get<ApiResponse<Creature>>(`${this.apiUrl}/${id}`);
  }

  create(payload: CreateCreaturePayload): Observable<ApiResponse<Creature>> {
    return this.http.post<ApiResponse<Creature>>(this.apiUrl, payload);
  }

  update(id: string, payload: Partial<CreateCreaturePayload>): Observable<ApiResponse<Creature>> {
    return this.http.put<ApiResponse<Creature>>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/${id}`);
  }
}
