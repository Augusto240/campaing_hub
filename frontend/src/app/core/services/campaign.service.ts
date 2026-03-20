import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  system: string;
  ownerId: string;
  createdAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  members: any[];
  characters: any[];
  sessions: any[];
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  private readonly API_URL = `${environment.apiUrl}/campaigns`;

  constructor(private http: HttpClient) {}

  getCampaigns(): Observable<any> {
    return this.http.get<any>(this.API_URL);
  }

  getCampaignById(id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${id}`);
  }

  createCampaign(data: { name: string; description?: string; system: string }): Observable<any> {
    return this.http.post<any>(this.API_URL, data);
  }

  updateCampaign(id: string, data: Partial<Campaign>): Observable<any> {
    return this.http.put<any>(`${this.API_URL}/${id}`, data);
  }

  deleteCampaign(id: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${id}`);
  }

  addMember(campaignId: string, userId: string, role: 'GM' | 'PLAYER'): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${campaignId}/members`, { userId, role });
  }

  removeMember(campaignId: string, userId: string): Observable<any> {
    return this.http.delete<any>(`${this.API_URL}/${campaignId}/members/${userId}`);
  }

  getCampaignStats(campaignId: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${campaignId}/stats`);
  }

  exportCampaignData(campaignId: string): Observable<Blob> {
    return this.http.get(`${this.API_URL}/${campaignId}/export`, {
      responseType: 'blob'
    });
  }
}
