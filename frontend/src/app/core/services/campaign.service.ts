import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Campaign,
  CampaignWithRelations,
  CampaignMember,
  CampaignStats,
  CampaignRole,
  CreateCampaignInput,
  UpdateCampaignInput,
  AddMemberInput,
  ApiResponse,
} from '../types/api.types';

@Injectable({
  providedIn: 'root'
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

  createCampaign(data: CreateCampaignInput): Observable<ApiResponse<Campaign>> {
    return this.http.post<ApiResponse<Campaign>>(this.API_URL, data);
  }

  updateCampaign(id: string, data: UpdateCampaignInput): Observable<ApiResponse<Campaign>> {
    return this.http.put<ApiResponse<Campaign>>(`${this.API_URL}/${id}`, data);
  }

  deleteCampaign(id: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${id}`);
  }

  addMember(campaignId: string, email: string, role: CampaignRole): Observable<ApiResponse<CampaignMember>> {
    const payload: AddMemberInput = { email, role };
    return this.http.post<ApiResponse<CampaignMember>>(`${this.API_URL}/${campaignId}/members`, payload);
  }

  removeMember(campaignId: string, userId: string): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API_URL}/${campaignId}/members/${userId}`);
  }

  getCampaignStats(campaignId: string): Observable<ApiResponse<CampaignStats>> {
    return this.http.get<ApiResponse<CampaignStats>>(`${this.API_URL}/${campaignId}/stats`);
  }

  exportCampaignData(campaignId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${campaignId}/export`, {
      responseType: 'blob'
    });
  }
}
