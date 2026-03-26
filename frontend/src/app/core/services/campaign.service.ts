import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse,
  Campaign,
  CampaignWithRelations,
  CampaignStats,
  CampaignMember,
  CreateCampaignPayload,
  UpdateCampaignPayload,
  AddMemberPayload,
  GenerateEncounterPayload,
  GeneratedEncounter,
} from '../types';

@Injectable({
  providedIn: 'root',
})
export class CampaignService {
  private readonly API_URL = `${environment.apiUrl}/campaigns`;

  constructor(private http: HttpClient) {}

  getCampaigns(): Observable<ApiResponse<CampaignWithRelations[]>> {
    return this.http.get<ApiResponse<CampaignWithRelations[]>>(this.API_URL);
  }

  getCampaignById(id: string): Observable<ApiResponse<CampaignWithRelations>> {
    return this.http.get<ApiResponse<CampaignWithRelations>>(`${this.API_URL}/${id}`);
  }

  createCampaign(data: CreateCampaignPayload): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.API_URL, data);
  }

  updateCampaign(id: string, data: UpdateCampaignPayload): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.API_URL}/${id}`, data);
  }

  deleteCampaign(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${id}`);
  }

  addMember(campaignId: string, payload: AddMemberPayload): Observable<ApiResponse<CampaignMember>> {
    return this.http.post<ApiResponse<CampaignMember>>(`${this.API_URL}/${campaignId}/members`, payload);
  }

  removeMember(campaignId: string, userId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/${campaignId}/members/${userId}`);
  }

  getCampaignStats(campaignId: string): Observable<ApiResponse<CampaignStats>> {
    return this.http.get<ApiResponse<CampaignStats>>(`${this.API_URL}/${campaignId}/stats`);
  }

  exportCampaignData(campaignId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${campaignId}/export`, {
      responseType: 'blob',
    });
  }

  generateEncounter(
    campaignId: string,
    payload: GenerateEncounterPayload
  ): Observable<ApiResponse<GeneratedEncounter>> {
    return this.http.post<ApiResponse<GeneratedEncounter>>(
      `${this.API_URL}/${campaignId}/generate-encounter`,
      payload
    );
  }
}
