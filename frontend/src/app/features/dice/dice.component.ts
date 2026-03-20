import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../core/services/campaign.service';
import { CharacterService } from '../../core/services/character.service';
import { DiceRollService } from '../../core/services/dice-roll.service';
import { SessionService } from '../../core/services/session.service';

type CampaignOption = { id: string; name: string };
type CharacterOption = { id: string; name: string };
type SessionOption = { id: string; date: string };

type DiceRollView = {
  id: string;
  formula: string;
  result: number;
  label?: string | null;
  isPrivate: boolean;
  createdAt: string;
  user?: { name: string };
  character?: { name: string } | null;
};

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dice-page">
      <div class="dice-hero">
        <a routerLink="/" class="back-home">Inicio</a>
        <h1>Rolagem de Dados</h1>
        <p>Historico persistido por campanha com parser avancado de formulas</p>
      </div>

      <div class="dice-container">
        <section class="card config-card">
          <h2>Configuracao de Persistencia</h2>
          <div class="config-grid">
            <select class="form-control" [(ngModel)]="selectedCampaignId" (change)="onCampaignChange()">
              <option value="">Selecione a campanha</option>
              <option *ngFor="let campaign of campaigns" [value]="campaign.id">{{ campaign.name }}</option>
            </select>

            <select class="form-control" [(ngModel)]="selectedSessionId" (change)="refreshHistory()" [disabled]="!selectedCampaignId">
              <option value="">Sem sessao</option>
              <option *ngFor="let session of sessions" [value]="session.id">{{ session.date | date:'dd/MM/yyyy' }}</option>
            </select>

            <select class="form-control" [(ngModel)]="selectedCharacterId" [disabled]="!selectedCampaignId">
              <option value="">Sem personagem</option>
              <option *ngFor="let character of characters" [value]="character.id">{{ character.name }}</option>
            </select>

            <input class="form-control" placeholder="Rotulo (ex: Ataque)" [(ngModel)]="rollLabel" />
            <label class="private-toggle">
              <input type="checkbox" [(ngModel)]="isPrivateRoll" />
              Rolagem privada
            </label>
          </div>
          <small class="help-text">
            Para 1d20+STR, selecione o personagem. Sem campanha selecionada, a rolagem fica local (nao persistida).
          </small>
        </section>

        <section class="card quick-card">
          <h2>Rolagem Rapida</h2>
          <div class="quick-grid">
            <button class="dice-btn" *ngFor="let sides of quickDice" (click)="rollFormula('1d' + sides)">
              d{{ sides }}
            </button>
            <button class="dice-btn" (click)="rollFormula('advantage')">advantage</button>
            <button class="dice-btn" (click)="rollFormula('disadvantage')">disadvantage</button>
          </div>
        </section>

        <section class="card formula-card">
          <h2>Formula Customizada</h2>
          <div class="formula-row">
            <input
              class="form-control"
              [(ngModel)]="customFormula"
              placeholder="Ex: 2d6+3, 4d6kh3, 1d20+STR"
            />
            <button class="btn btn-primary" (click)="rollFormula(customFormula)" [disabled]="rolling">
              {{ rolling ? 'Rolando...' : 'Rolar' }}
            </button>
          </div>
          <div class="last-roll" *ngIf="lastRoll">
            <strong>Ultima rolagem:</strong>
            <span>{{ lastRoll.formula }} = {{ lastRoll.result }}</span>
            <span *ngIf="lastRoll.label">({{ lastRoll.label }})</span>
          </div>
          <div class="error" *ngIf="errorMessage">{{ errorMessage }}</div>
        </section>

        <section class="card history-card">
          <div class="history-head">
            <h2>Historico</h2>
            <button class="btn btn-outline btn-sm" (click)="refreshHistory()" [disabled]="!selectedCampaignId">Atualizar</button>
          </div>

          <div *ngIf="history.length === 0" class="empty-history">
            Nenhuma rolagem registrada.
          </div>

          <div class="history-list" *ngIf="history.length > 0">
            <div class="history-item" *ngFor="let item of history">
              <div class="history-main">
                <strong>{{ item.formula }}</strong>
                <span class="result">= {{ item.result }}</span>
                <span *ngIf="item.label" class="label">{{ item.label }}</span>
                <span *ngIf="item.isPrivate" class="private-badge">privada</span>
              </div>
              <div class="history-meta">
                <span>{{ item.user?.name || 'Voce' }}</span>
                <span *ngIf="item.character">� {{ item.character.name }}</span>
                <span>� {{ item.createdAt | date:'dd/MM HH:mm:ss' }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .dice-page { min-height: 100vh; background: var(--bg-primary); }
      .dice-hero {
        text-align: center;
        padding: 2rem;
        border-bottom: 1px solid var(--border-color);
        background: linear-gradient(to bottom, var(--bg-secondary), var(--bg-primary));
      }
      .back-home { color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; }
      .back-home:hover { color: var(--accent-primary); }
      .dice-container { max-width: 980px; margin: 0 auto; padding: 1.5rem; display: grid; gap: 1rem; }
      .card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1rem;
      }
      h2 { margin-bottom: 0.75rem; }
      .config-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.5rem;
      }
      .private-toggle {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
      .help-text { display: block; margin-top: 0.6rem; color: var(--text-muted); }
      .quick-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .dice-btn {
        border: 1px solid var(--border-color);
        background: var(--bg-secondary);
        color: var(--text-primary);
        border-radius: var(--radius-sm);
        padding: 0.55rem 0.85rem;
        cursor: pointer;
      }
      .dice-btn:hover { border-color: var(--accent-primary); }
      .formula-row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
      .last-roll { margin-top: 0.6rem; color: var(--text-secondary); display: flex; gap: 0.4rem; flex-wrap: wrap; }
      .error { margin-top: 0.6rem; color: var(--danger); font-size: 0.85rem; }
      .history-head { display: flex; justify-content: space-between; align-items: center; }
      .empty-history { color: var(--text-muted); }
      .history-list { margin-top: 0.6rem; display: grid; gap: 0.45rem; }
      .history-item {
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: var(--radius-sm);
        padding: 0.55rem;
      }
      .history-main { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
      .result { color: var(--accent-primary); font-weight: 700; }
      .label { color: var(--text-secondary); font-size: 0.85rem; }
      .private-badge {
        background: rgba(239, 68, 68, 0.15);
        color: var(--danger);
        border-radius: 9999px;
        padding: 0.15rem 0.45rem;
        font-size: 0.7rem;
      }
      .history-meta { margin-top: 0.2rem; color: var(--text-muted); font-size: 0.78rem; }
      @media (max-width: 760px) {
        .formula-row { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class DiceComponent implements OnInit {
  campaigns: CampaignOption[] = [];
  sessions: SessionOption[] = [];
  characters: CharacterOption[] = [];

  selectedCampaignId = '';
  selectedSessionId = '';
  selectedCharacterId = '';
  rollLabel = '';
  isPrivateRoll = false;

  quickDice = [4, 6, 8, 10, 12, 20, 100];
  customFormula = '1d20';

  history: DiceRollView[] = [];
  lastRoll: DiceRollView | null = null;

  rolling = false;
  errorMessage = '';

  constructor(
    private readonly campaignService: CampaignService,
    private readonly sessionService: SessionService,
    private readonly characterService: CharacterService,
    private readonly diceRollService: DiceRollService
  ) {}

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns().subscribe({
      next: (response) => {
        this.campaigns = (response.data || []).map((campaign: { id: string; name: string }) => ({
          id: campaign.id,
          name: campaign.name,
        }));
      },
      error: () => {
        this.campaigns = [];
      },
    });
  }

  onCampaignChange(): void {
    this.selectedSessionId = '';
    this.selectedCharacterId = '';
    this.history = [];

    if (!this.selectedCampaignId) {
      this.sessions = [];
      this.characters = [];
      return;
    }

    this.sessionService.getSessionsByCampaign(this.selectedCampaignId).subscribe({
      next: (response) => {
        this.sessions = (response.data || []).map((session: { id: string; date: string }) => ({
          id: session.id,
          date: session.date,
        }));
      },
      error: () => {
        this.sessions = [];
      },
    });

    this.characterService.getCharactersByCampaign(this.selectedCampaignId).subscribe({
      next: (response) => {
        this.characters = (response.data || []).map((character: { id: string; name: string }) => ({
          id: character.id,
          name: character.name,
        }));
      },
      error: () => {
        this.characters = [];
      },
    });

    this.refreshHistory();
  }

  refreshHistory(): void {
    if (!this.selectedCampaignId) {
      this.history = [];
      return;
    }

    this.diceRollService
      .getCampaignRolls(this.selectedCampaignId, {
        sessionId: this.selectedSessionId || undefined,
        limit: 100,
      })
      .subscribe({
        next: (response) => {
          this.history = (response.data || []) as DiceRollView[];
        },
        error: () => {
          this.history = [];
        },
      });
  }

  rollFormula(formula: string): void {
    const trimmedFormula = (formula || '').trim();
    if (!trimmedFormula) {
      return;
    }

    this.errorMessage = '';

    if (!this.selectedCampaignId) {
      this.rollLocally(trimmedFormula);
      return;
    }

    this.rolling = true;
    this.diceRollService
      .createRoll({
        campaignId: this.selectedCampaignId,
        sessionId: this.selectedSessionId || undefined,
        characterId: this.selectedCharacterId || undefined,
        formula: trimmedFormula,
        label: this.rollLabel || undefined,
        isPrivate: this.isPrivateRoll,
      })
      .subscribe({
        next: (response) => {
          const createdRoll = response.data as DiceRollView;
          this.lastRoll = createdRoll;
          this.history = [createdRoll, ...this.history].slice(0, 100);
          this.rolling = false;
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Falha ao executar rolagem.';
          this.rolling = false;
        },
      });
  }

  private rollLocally(formula: string): void {
    const normalized = formula.trim().toLowerCase();
    const parsedFormula =
      normalized === 'advantage'
        ? '2d20kh1'
        : normalized === 'disadvantage'
          ? '2d20kl1'
          : formula;

    const match = parsedFormula.match(/^(\d{1,3})d(\d{1,4})([+-]\d+)?$/i);
    if (!match) {
      this.errorMessage = 'Selecione uma campanha para usar parser avancado (kh/kl/atributos).';
      return;
    }

    const count = Number(match[1]);
    const sides = Number(match[2]);
    const modifier = Number(match[3] || 0);

    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const result = rolls.reduce((sum, value) => sum + value, 0) + modifier;

    const localRoll: DiceRollView = {
      id: `local-${Date.now()}`,
      formula: parsedFormula,
      result,
      label: this.rollLabel || null,
      isPrivate: this.isPrivateRoll,
      createdAt: new Date().toISOString(),
    };

    this.lastRoll = localRoll;
    this.history = [localRoll, ...this.history].slice(0, 100);
  }
}
