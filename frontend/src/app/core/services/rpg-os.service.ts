import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, CoreCampaignSnapshot } from '../types';

@Injectable({ providedIn: 'root' })
export class RpgOsService {
  private readonly apiUrl = `${environment.apiUrl}/core`;

  constructor(private readonly http: HttpClient) {}

  getCampaignSnapshot(campaignId: string, limit = 160): Observable<ApiResponse<CoreCampaignSnapshot>> {
    const params = new HttpParams().set('limit', String(limit));

    return this.http.get<ApiResponse<CoreCampaignSnapshot>>(
      `${this.apiUrl}/campaign/${campaignId}/snapshot`,
      { params }
    );
  }
}
