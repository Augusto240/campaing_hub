import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  WikiPage,
  WikiCategory,
  CreateWikiPagePayload,
  UpdateWikiPagePayload,
} from '../types';

// Re-export for backward compatibility
export { WikiCategory } from '../types';

interface GetPagesOptions {
  category?: WikiCategory;
  search?: string;
  tag?: string;
}

@Injectable({ providedIn: 'root' })
export class WikiService {
  private readonly API_URL = `${environment.apiUrl}/wiki`;

  constructor(private http: HttpClient) {}

  getCampaignPages(
    campaignId: string,
    options?: GetPagesOptions
  ): Observable<ApiResponse<WikiPage[]>> {
    let params = new HttpParams();
    if (options?.category) {
      params = params.set('category', options.category);
    }
    if (options?.search) {
      params = params.set('search', options.search);
    }
    if (options?.tag) {
      params = params.set('tag', options.tag);
    }

    return this.http.get<ApiResponse<WikiPage[]>>(`${this.API_URL}/campaign/${campaignId}`, {
      params,
    });
  }

  getPageById(wikiPageId: string): Observable<ApiResponse<WikiPage>> {
    return this.http.get<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}`);
  }

  createPage(payload: CreateWikiPagePayload): Observable<ApiResponse<WikiPage>> {
    return this.http.post<ApiResponse<WikiPage>>(this.API_URL, payload);
  }

  updatePage(wikiPageId: string, payload: UpdateWikiPagePayload): Observable<ApiResponse<WikiPage>> {
    return this.http.put<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}`, payload);
  }

  deletePage(wikiPageId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${wikiPageId}`);
  }

  bootstrapLegacy(campaignId: string): Observable<
    ApiResponse<{
      createdCount: number;
      skippedCount: number;
      createdPages: Array<{ id: string; title: string; category: WikiCategory }>;
    }>
  > {
    return this.http.post<
      ApiResponse<{
        createdCount: number;
        skippedCount: number;
        createdPages: Array<{ id: string; title: string; category: WikiCategory }>;
      }>
    >(`${this.API_URL}/campaign/${campaignId}/bootstrap-legacy`, {});
  }
}
