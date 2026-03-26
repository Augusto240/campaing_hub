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
  parentId?: string | null;
}

export interface WikiTreeNode {
  id: string;
  title: string;
  icon: string | null;
  category: WikiCategory;
  isPublic: boolean;
  position: number;
  isFavorite: boolean;
  children: WikiTreeNode[];
}

export interface WikiBlock {
  id: string;
  pageId: string;
  type: WikiBlockType;
  content: Record<string, unknown>;
  position: number;
  indent: number;
  isChecked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WikiBlockType =
  | 'TEXT'
  | 'HEADING_1'
  | 'HEADING_2'
  | 'HEADING_3'
  | 'BULLETED_LIST'
  | 'NUMBERED_LIST'
  | 'TODO'
  | 'TOGGLE'
  | 'QUOTE'
  | 'CALLOUT'
  | 'CODE'
  | 'DIVIDER'
  | 'IMAGE'
  | 'LINK_TO_PAGE'
  | 'EMBED';

export interface CreateBlockPayload {
  type: WikiBlockType;
  content: Record<string, unknown>;
  position?: number;
  indent?: number;
  isChecked?: boolean;
}

export interface WikiBacklink {
  id: string;
  context: string;
  sourcePage: {
    id: string;
    title: string;
    icon: string | null;
    category: WikiCategory;
  };
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
    if (options?.parentId !== undefined) {
      params = params.set('parentId', options.parentId === null ? 'null' : options.parentId);
    }

    return this.http.get<ApiResponse<WikiPage[]>>(`${this.API_URL}/campaign/${campaignId}`, {
      params,
    });
  }

  getPageTree(campaignId: string): Observable<ApiResponse<WikiTreeNode[]>> {
    return this.http.get<ApiResponse<WikiTreeNode[]>>(
      `${this.API_URL}/campaign/${campaignId}/tree`
    );
  }

  getFavorites(campaignId: string): Observable<ApiResponse<WikiPage[]>> {
    return this.http.get<ApiResponse<WikiPage[]>>(
      `${this.API_URL}/campaign/${campaignId}/favorites`
    );
  }

  getPageById(wikiPageId: string): Observable<ApiResponse<WikiPage>> {
    return this.http.get<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}`);
  }

  createPage(payload: CreateWikiPagePayload & {
    parentId?: string;
    icon?: string;
    coverImage?: string;
  }): Observable<ApiResponse<WikiPage>> {
    return this.http.post<ApiResponse<WikiPage>>(this.API_URL, payload);
  }

  updatePage(
    wikiPageId: string,
    payload: UpdateWikiPagePayload & {
      parentId?: string | null;
      icon?: string | null;
      coverImage?: string | null;
      position?: number;
      isFavorite?: boolean;
    }
  ): Observable<ApiResponse<WikiPage>> {
    return this.http.put<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}`, payload);
  }

  deletePage(wikiPageId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${wikiPageId}`);
  }

  movePage(
    wikiPageId: string,
    parentId: string | null,
    position: number
  ): Observable<ApiResponse<WikiPage>> {
    return this.http.post<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}/move`, {
      parentId,
      position,
    });
  }

  toggleFavorite(wikiPageId: string): Observable<ApiResponse<WikiPage>> {
    return this.http.post<ApiResponse<WikiPage>>(`${this.API_URL}/${wikiPageId}/favorite`, {});
  }

  // === BLOCKS ===

  getBlocks(wikiPageId: string): Observable<ApiResponse<WikiBlock[]>> {
    return this.http.get<ApiResponse<WikiBlock[]>>(`${this.API_URL}/${wikiPageId}/blocks`);
  }

  createBlock(wikiPageId: string, payload: CreateBlockPayload): Observable<ApiResponse<WikiBlock>> {
    return this.http.post<ApiResponse<WikiBlock>>(`${this.API_URL}/${wikiPageId}/blocks`, payload);
  }

  updateBlock(
    blockId: string,
    payload: Partial<CreateBlockPayload>
  ): Observable<ApiResponse<WikiBlock>> {
    return this.http.put<ApiResponse<WikiBlock>>(`${this.API_URL}/blocks/${blockId}`, payload);
  }

  deleteBlock(blockId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/blocks/${blockId}`);
  }

  reorderBlocks(wikiPageId: string, blockIds: string[]): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/${wikiPageId}/blocks/reorder`, {
      blockIds,
    });
  }

  duplicateBlock(blockId: string): Observable<ApiResponse<WikiBlock>> {
    return this.http.post<ApiResponse<WikiBlock>>(`${this.API_URL}/blocks/${blockId}/duplicate`, {});
  }

  // === BACKLINKS ===

  getBacklinks(wikiPageId: string): Observable<ApiResponse<WikiBacklink[]>> {
    return this.http.get<ApiResponse<WikiBacklink[]>>(`${this.API_URL}/${wikiPageId}/backlinks`);
  }

  getOutgoingLinks(wikiPageId: string): Observable<ApiResponse<WikiBacklink[]>> {
    return this.http.get<ApiResponse<WikiBacklink[]>>(`${this.API_URL}/${wikiPageId}/outgoing`);
  }
}
