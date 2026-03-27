import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CreateWikiFromTemplateInput,
  UpsertWikiBlocksInput,
  WikiBlock,
  WikiFavorite,
  WikiMentionSuggestion,
  WikiPageRelations,
  WikiPage,
  WikiTemplate,
  WikiTreeNode,
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

  getCampaignTree(campaignId: string): Observable<ApiResponse<WikiTreeNode[]>> {
    return this.http.get<ApiResponse<WikiTreeNode[]>>(`${this.API_URL}/campaign/${campaignId}/tree`);
  }

  getPageById(wikiPageId: string): Observable<ApiResponse<WikiPage>> {
    return this.http.get<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}`);
  }

  getPageRelations(wikiPageId: string, limit = 8): Observable<ApiResponse<WikiPageRelations>> {
    const params = new HttpParams().set('limit', String(limit));

    return this.http.get<ApiResponse<WikiPageRelations>>(`${this.API_URL}/${wikiPageId}/relations`, {
      params,
    });
  }

  getTemplates(): Observable<ApiResponse<WikiTemplate[]>> {
    return this.http.get<ApiResponse<WikiTemplate[]>>(`${this.API_URL}/templates`);
  }

  createPageFromTemplate(
    campaignId: string,
    payload: CreateWikiFromTemplateInput
  ): Observable<ApiResponse<WikiPage>> {
    return this.http.post<ApiResponse<WikiPage>>(`${this.API_URL}/campaign/${campaignId}/from-template`, payload);
  }

  getPageBlocks(wikiPageId: string): Observable<ApiResponse<WikiBlock[]>> {
    return this.http.get<ApiResponse<WikiBlock[]>>(`${this.API_URL}/${wikiPageId}/blocks`);
  }

  upsertPageBlocks(
    wikiPageId: string,
    payload: UpsertWikiBlocksInput
  ): Observable<ApiResponse<WikiBlock[]>> {
    return this.http.put<ApiResponse<WikiBlock[]>>(`${this.API_URL}/${wikiPageId}/blocks`, payload);
  }

  addFavorite(wikiPageId: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/${wikiPageId}/favorite`, {});
  }

  removeFavorite(wikiPageId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${wikiPageId}/favorite`);
  }

  getFavorites(campaignId: string): Observable<ApiResponse<WikiFavorite[]>> {
    return this.http.get<ApiResponse<WikiFavorite[]>>(`${this.API_URL}/campaign/${campaignId}/favorites`);
  }

  searchMentions(
    campaignId: string,
    query: string,
    limit = 8
  ): Observable<ApiResponse<WikiMentionSuggestion[]>> {
    const params = new HttpParams().set('query', query).set('limit', String(limit));

    return this.http.get<ApiResponse<WikiMentionSuggestion[]>>(
      `${this.API_URL}/campaign/${campaignId}/mentions`,
      { params }
    );
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
