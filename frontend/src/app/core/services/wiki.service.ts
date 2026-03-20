import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type WikiCategory =
  | 'NPC'
  | 'LOCATION'
  | 'FACTION'
  | 'LORE'
  | 'HOUSE_RULE'
  | 'BESTIARY'
  | 'DEITY'
  | 'MYTHOS'
  | 'SESSION_RECAP';

export interface WikiPagePayload {
  campaignId: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WikiService {
  private readonly API_URL = `${environment.apiUrl}/wiki`;

  constructor(private http: HttpClient) {}

  getCampaignPages(
    campaignId: string,
    options?: { category?: WikiCategory; search?: string; tag?: string }
  ): Observable<any> {
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

    return this.http.get<any>(`${this.API_URL}/campaign/${campaignId}`, { params });
  }

  getPageById(wikiPageId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${wikiPageId}`);
  }

  createPage(payload: WikiPagePayload): Observable<any> {
    return this.http.post<any>(this.API_URL, payload);
  }

  updatePage(wikiPageId: string, payload: Partial<WikiPagePayload>): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${wikiPageId}`, payload);
  }

  deletePage(wikiPageId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${wikiPageId}`);
  }
}

