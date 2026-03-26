import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, SessionProposal, VotePayload, SessionVote } from '../types';

@Injectable({ providedIn: 'root' })
export class SessionProposalService {
  private readonly campaignsApiUrl = `${environment.apiUrl}/campaigns`;
  private readonly proposalsApiUrl = `${environment.apiUrl}/session-proposals`;

  constructor(private readonly http: HttpClient) {}

  listByCampaign(campaignId: string): Observable<ApiResponse<SessionProposal[]>> {
    return this.http.get<ApiResponse<SessionProposal[]>>(
      `${this.campaignsApiUrl}/${campaignId}/session-proposals`
    );
  }

  create(campaignId: string, dates: string[]): Observable<ApiResponse<SessionProposal>> {
    return this.http.post<ApiResponse<SessionProposal>>(
      `${this.campaignsApiUrl}/${campaignId}/session-proposals`,
      { dates }
    );
  }

  vote(proposalId: string, payload: VotePayload): Observable<ApiResponse<SessionVote>> {
    return this.http.post<ApiResponse<SessionVote>>(
      `${this.proposalsApiUrl}/${proposalId}/votes`,
      payload
    );
  }

  decide(proposalId: string, decidedDate: string): Observable<ApiResponse<SessionProposal>> {
    return this.http.patch<ApiResponse<SessionProposal>>(
      `${this.proposalsApiUrl}/${proposalId}/decide`,
      { decidedDate }
    );
  }

  cancel(proposalId: string): Observable<ApiResponse<SessionProposal>> {
    return this.http.patch<ApiResponse<SessionProposal>>(
      `${this.proposalsApiUrl}/${proposalId}/cancel`,
      {}
    );
  }
}
