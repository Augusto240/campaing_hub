import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CampaignKnowledgeGraph } from '../types';

@Injectable({ providedIn: 'root' })
export class KnowledgeGraphService {
  private readonly API_URL = `${environment.apiUrl}/knowledge-graph`;

  constructor(private readonly http: HttpClient) {}

  getCampaignGraph(campaignId: string, limit = 140): Observable<ApiResponse<CampaignKnowledgeGraph>> {
    const params = new HttpParams().set('limit', String(limit));

    return this.http.get<ApiResponse<CampaignKnowledgeGraph>>(`${this.API_URL}/campaign/${campaignId}`, {
      params,
    });
  }
}
