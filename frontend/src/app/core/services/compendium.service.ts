import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  CampaignCompendiumResponse,
  CompendiumKind,
} from '../types';

@Injectable({ providedIn: 'root' })
export class CompendiumService {
  private readonly apiUrl = `${environment.apiUrl}/compendium`;

  constructor(private readonly http: HttpClient) {}

  getCampaignCompendium(input: {
    campaignId: string;
    kind?: CompendiumKind;
    search?: string;
    limit?: number;
  }): Observable<ApiResponse<CampaignCompendiumResponse>> {
    let params = new HttpParams();

    if (input.kind) {
      params = params.set('kind', this.toQueryKind(input.kind));
    }

    if (input.search) {
      params = params.set('search', input.search);
    }

    if (input.limit) {
      params = params.set('limit', String(input.limit));
    }

    return this.http.get<ApiResponse<CampaignCompendiumResponse>>(
      `${this.apiUrl}/campaign/${input.campaignId}`,
      { params }
    );
  }

  private toQueryKind(kind: CompendiumKind): 'bestiary' | 'spell' | 'item' | 'class' {
    if (kind === 'BESTIARY') {
      return 'bestiary';
    }

    if (kind === 'SPELL') {
      return 'spell';
    }

    if (kind === 'ITEM') {
      return 'item';
    }

    return 'class';
  }
}
