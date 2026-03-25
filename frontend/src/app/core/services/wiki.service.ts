import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  WikiPage,
  WikiPageWithAuthor,
  WikiCategory,
  CreateWikiPageInput,
  UpdateWikiPageInput,
  ApiResponse,
} from '../types/api.types';

// Re-export WikiCategory for components that import from this service
export { WikiCategory } from '../types/api.types';

/** Options for filtering wiki pages */
export interface WikiPageFilterOptions {
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
    options?: WikiPageFilterOptions
  ): Observable<ApiResponse<WikiPageWithAuthor[]>> {
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

    return this.http.get<ApiResponse<WikiPageWithAuthor[]>>(`${this.API_URL}/campaign/${campaignId}`, { params });
  }

  getPageById(wikiPageId: string): Observable<ApiResponse<WikiPageWithAuthor>> {
    return this.http.get<ApiResponse<WikiPageWithAuthor>>(`${this.API_URL}/${wikiPageId}`);
  }

  createPage(payload: CreateWikiPageInput): Observable<ApiResponse<WikiPage>> {
    return this.http.post<ApiResponse<WikiPage>>(this.API_URL, payload);
  }

  updatePage(wikiPageId: string, payload: UpdateWikiPageInput): Observable<ApiResponse<WikiPage>> {
    return this.http.put<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}`, payload);
  }

  deletePage(wikiPageId: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${wikiPageId}`);
  }
}
