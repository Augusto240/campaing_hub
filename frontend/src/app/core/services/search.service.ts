import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types';

export interface SearchResult {
  type: 'wiki' | 'character' | 'session' | 'creature' | 'item';
  id: string;
  title: string;
  snippet: string;
  extra?: Record<string, unknown>;
}

export interface QuickSearchResult {
  id: string;
  title: string;
  icon: string | null;
  category: string;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly API_URL = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) {}

  search(
    campaignId: string,
    query: string,
    options?: {
      types?: string[];
      limit?: number;
      offset?: number;
    }
  ): Observable<ApiResponse<SearchResult[]>> {
    let params = new HttpParams().set('q', query);

    if (options?.types) {
      params = params.set('types', options.types.join(','));
    }
    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }
    if (options?.offset) {
      params = params.set('offset', options.offset.toString());
    }

    return this.http.get<ApiResponse<SearchResult[]>>(
      `${this.API_URL}/campaign/${campaignId}`,
      { params }
    );
  }

  searchWikiPages(campaignId: string, query: string): Observable<ApiResponse<QuickSearchResult[]>> {
    const params = new HttpParams().set('q', query);

    return this.http.get<ApiResponse<QuickSearchResult[]>>(
      `${this.API_URL}/campaign/${campaignId}/wiki`,
      { params }
    );
  }

  getRecentPages(
    campaignId: string,
    limit: number = 10
  ): Observable<ApiResponse<QuickSearchResult[]>> {
    const params = new HttpParams().set('limit', limit.toString());

    return this.http.get<ApiResponse<QuickSearchResult[]>>(
      `${this.API_URL}/campaign/${campaignId}/recent`,
      { params }
    );
  }
}
