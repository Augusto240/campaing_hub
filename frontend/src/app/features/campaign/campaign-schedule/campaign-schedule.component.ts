import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { SessionProposalService } from '../../../core/services/session-proposal.service';

type CampaignView = {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{ role: 'GM' | 'PLAYER'; user: { id: string; name: string } }>;
};

type VoteView = {
  id: string;
  userId: string;
  date: string;
  available: boolean;
  user?: { name: string };
};

type ProposalView = {
  id: string;
  status: 'OPEN' | 'DECIDED' | 'CANCELLED';
  dates: string[];
  decidedDate?: string | null;
  votes?: VoteView[];
  createdAt: string;
};

@Component({
  selector: 'app-campaign-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="shell" *ngIf="campaign; else loadingState">
      <header class="header card">
        <div>
          <a class="back" [routerLink]="['/campaigns', campaign.id]">Voltar</a>
          <h1>Agenda de Sessoes</h1>
          <p class="subtitle">{{ campaign.name }}</p>
        </div>
        <button *ngIf="isGm" class="btn btn-primary" (click)="showNewProposal = !showNewProposal">
          {{ showNewProposal ? 'Cancelar' : 'Nova Proposta' }}
        </button>
      </header>

      <!-- Nova Proposta -->
      <div class="card panel" *ngIf="showNewProposal && isGm">
        <h2>Propor Datas</h2>
        <p class="hint">Selecione de 3 a 5 opcoes de datas para a proxima sessao.</p>
        <div class="dates-form">
          <div class="date-input" *ngFor="let date of proposalDates; let i = index">
            <input class="form-control" type="datetime-local" [(ngModel)]="proposalDates[i]" />
            <button class="icon-btn danger" *ngIf="proposalDates.length > 3" (click)="removeDate(i)">x</button>
          </div>
          <button class="btn btn-outline btn-sm" *ngIf="proposalDates.length < 5" (click)="addDate()">+ Adicionar data</button>
        </div>
        <button class="btn btn-primary" (click)="createProposal()" [disabled]="!canCreateProposal || creating">
          Criar Proposta
        </button>
      </div>

      <!-- Lista de Propostas -->
      <div class="proposals-list">
        <article class="card proposal" *ngFor="let proposal of proposals" [class.decided]="proposal.status === 'DECIDED'">
          <header class="proposal-header">
            <div>
              <span class="status-badge" [class]="proposal.status.toLowerCase()">{{ proposal.status }}</span>
              <span class="date-created">{{ proposal.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
            <div *ngIf="proposal.status === 'DECIDED'" class="decided-info">
              Data confirmada: <strong>{{ proposal.decidedDate | date:'dd/MM HH:mm' }}</strong>
            </div>
          </header>

          <div class="dates-grid" *ngIf="proposal.status === 'OPEN'">
            <div class="date-option" *ngFor="let date of proposal.dates">
              <div class="date-info">
                <strong>{{ date | date:'EEEE' }}</strong>
                <span>{{ date | date:'dd/MM HH:mm' }}</span>
              </div>
              <div class="votes-display">
                <span class="vote-count positive">{{ getVoteCount(proposal, date, true) }}</span>
                <span class="vote-count negative">{{ getVoteCount(proposal, date, false) }}</span>
              </div>
              <div class="vote-actions">
                <button
                  class="vote-btn positive"
                  [class.active]="getMyVote(proposal, date) === true"
                  (click)="vote(proposal.id, date, true)"
                  [disabled]="voting"
                  title="Posso"
                >
                  \u2714
                </button>
                <button
                  class="vote-btn negative"
                  [class.active]="getMyVote(proposal, date) === false"
                  (click)="vote(proposal.id, date, false)"
                  [disabled]="voting"
                  title="Nao posso"
                >
                  \u2718
                </button>
              </div>
              <button
                *ngIf="isGm"
                class="btn btn-primary btn-sm confirm-btn"
                (click)="decide(proposal.id, date)"
                [disabled]="deciding"
              >
                Confirmar
              </button>
            </div>
          </div>

          <!-- Voters -->
          <div class="voters" *ngIf="proposal.status === 'OPEN' && proposal.votes && proposal.votes.length > 0">
            <strong>Votos:</strong>
            <div class="voter-list">
              <span class="voter" *ngFor="let vote of proposal.votes">
                {{ getMemberName(vote.userId) }}:
                <span [class]="vote.available ? 'positive' : 'negative'">
                  {{ vote.date | date:'dd/MM' }} {{ vote.available ? '\u2714' : '\u2718' }}
                </span>
              </span>
            </div>
          </div>

          <!-- Cancel -->
          <div class="proposal-actions" *ngIf="proposal.status === 'OPEN' && isGm">
            <button class="btn btn-outline btn-sm danger" (click)="cancel(proposal.id)">Cancelar Proposta</button>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="proposals.length === 0">
        <p>Nenhuma proposta de data ativa.</p>
        <button *ngIf="isGm" class="btn btn-primary" (click)="showNewProposal = true">Criar Primeira Proposta</button>
      </div>
    </section>

    <ng-template #loadingState>
      <div class="loading"><div class="spinner"></div></div>
    </ng-template>
  `,
  styles: [
    `
      .shell { width: min(900px, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 3rem; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; padding: 1.2rem; margin-bottom: 1rem; }
      .header h1 { margin: 0 0 0.3rem; }
      .subtitle { color: var(--text-secondary); margin: 0; }
      .back { color: var(--text-secondary); text-decoration: none; display: block; margin-bottom: 0.5rem; }
      .panel { padding: 1.5rem; margin-bottom: 1rem; }
      .panel h2 { margin: 0 0 0.5rem; }
      .hint { color: var(--text-secondary); font-size: 0.9rem; margin: 0 0 1rem; }
      .dates-form { display: grid; gap: 0.6rem; margin-bottom: 1rem; }
      .date-input { display: flex; gap: 0.5rem; align-items: center; }
      .date-input .form-control { flex: 1; }
      .icon-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: var(--text-primary); cursor: pointer; }
      .icon-btn.danger { color: var(--color-danger); }
      .proposals-list { display: grid; gap: 1rem; }
      .proposal { padding: 1.2rem; }
      .proposal.decided { border-color: rgba(40, 167, 69, 0.4); }
      .proposal-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
      .status-badge { padding: 0.25rem 0.6rem; border-radius: 999px; font-size: 0.8rem; text-transform: uppercase; }
      .status-badge.open { background: rgba(0, 123, 255, 0.2); color: #4dabf7; }
      .status-badge.decided { background: rgba(40, 167, 69, 0.2); color: #51cf66; }
      .status-badge.cancelled { background: rgba(220, 53, 69, 0.2); color: #ff6b6b; }
      .date-created { font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem; }
      .decided-info { color: var(--color-primary); }
      .dates-grid { display: grid; gap: 0.75rem; }
      .date-option { display: grid; grid-template-columns: 1fr auto auto auto; gap: 1rem; align-items: center; padding: 0.75rem; background: rgba(255, 255, 255, 0.03); border-radius: 0.75rem; }
      .date-info strong { display: block; text-transform: capitalize; }
      .date-info span { font-size: 0.9rem; color: var(--text-secondary); }
      .votes-display { display: flex; gap: 0.5rem; }
      .vote-count { padding: 0.2rem 0.5rem; border-radius: 999px; font-size: 0.85rem; font-weight: 600; }
      .vote-count.positive { background: rgba(40, 167, 69, 0.2); color: #51cf66; }
      .vote-count.negative { background: rgba(220, 53, 69, 0.2); color: #ff6b6b; }
      .vote-actions { display: flex; gap: 0.4rem; }
      .vote-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); cursor: pointer; font-size: 1rem; }
      .vote-btn.positive { color: #51cf66; }
      .vote-btn.negative { color: #ff6b6b; }
      .vote-btn.active { background: rgba(255, 255, 255, 0.15); }
      .vote-btn:hover { background: rgba(255, 255, 255, 0.1); }
      .confirm-btn { min-width: 90px; }
      .voters { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }
      .voter-list { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-top: 0.5rem; font-size: 0.9rem; }
      .voter .positive { color: #51cf66; }
      .voter .negative { color: #ff6b6b; }
      .proposal-actions { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(255, 255, 255, 0.08); }
      .btn.danger { color: var(--color-danger); border-color: var(--color-danger); }
      .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
      @media (max-width: 600px) { .date-option { grid-template-columns: 1fr; gap: 0.5rem; } }
    `,
  ],
})
export class CampaignScheduleComponent implements OnInit {
  campaignId = '';
  campaign: CampaignView | null = null;
  proposals: ProposalView[] = [];
  proposalDates: string[] = ['', '', ''];
  showNewProposal = false;
  creating = false;
  voting = false;
  deciding = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly campaignService: CampaignService,
    private readonly proposalService: SessionProposalService
  ) {}

  get isGm(): boolean {
    const user = this.authService.currentUser;
    return !!(
      user &&
      this.campaign &&
      (this.campaign.ownerId === user.id ||
        this.campaign.members.some((m) => m.user.id === user.id && m.role === 'GM'))
    );
  }

  get canCreateProposal(): boolean {
    const validDates = this.proposalDates.filter(Boolean);
    return validDates.length >= 3;
  }

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.campaignId) return;

    this.campaignService.getCampaignById(this.campaignId).subscribe({
      next: (res) => {
        this.campaign = res.data as CampaignView;
        this.loadProposals();
      },
    });
  }

  loadProposals(): void {
    this.proposalService.listByCampaign(this.campaignId).subscribe({
      next: (res) => {
        this.proposals = (res.data || []) as ProposalView[];
      },
    });
  }

  addDate(): void {
    if (this.proposalDates.length < 5) {
      this.proposalDates.push('');
    }
  }

  removeDate(index: number): void {
    if (this.proposalDates.length > 3) {
      this.proposalDates.splice(index, 1);
    }
  }

  createProposal(): void {
    const dates = this.proposalDates.filter(Boolean);
    if (dates.length < 3) return;
    this.creating = true;
    this.proposalService.create(this.campaignId, dates).subscribe({
      next: () => {
        this.creating = false;
        this.showNewProposal = false;
        this.proposalDates = ['', '', ''];
        this.loadProposals();
      },
      error: () => {
        this.creating = false;
      },
    });
  }

  vote(proposalId: string, date: string, available: boolean): void {
    this.voting = true;
    this.proposalService.vote(proposalId, { date, available }).subscribe({
      next: () => {
        this.voting = false;
        this.loadProposals();
      },
      error: () => {
        this.voting = false;
      },
    });
  }

  decide(proposalId: string, date: string): void {
    this.deciding = true;
    this.proposalService.decide(proposalId, date).subscribe({
      next: () => {
        this.deciding = false;
        this.loadProposals();
      },
      error: () => {
        this.deciding = false;
      },
    });
  }

  cancel(proposalId: string): void {
    this.proposalService.cancel(proposalId).subscribe({
      next: () => this.loadProposals(),
    });
  }

  getVoteCount(proposal: ProposalView, date: string, available: boolean): number {
    if (!proposal.votes) return 0;
    return proposal.votes.filter((v) => v.date === date && v.available === available).length;
  }

  getMyVote(proposal: ProposalView, date: string): boolean | null {
    const user = this.authService.currentUser;
    if (!user || !proposal.votes) return null;
    const vote = proposal.votes.find((v) => v.userId === user.id && v.date === date);
    return vote?.available ?? null;
  }

  getMemberName(userId: string): string {
    if (!this.campaign) return 'Unknown';
    if (this.campaign.ownerId === userId) {
      const owner = this.campaign.members.find((m) => m.user.id === userId);
      return owner?.user.name || 'GM';
    }
    const member = this.campaign.members.find((m) => m.user.id === userId);
    return member?.user.name || 'Unknown';
  }
}
