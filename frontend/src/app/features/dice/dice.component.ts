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
  breakdown?: {
    rolls?: number[];
    rolledDice?: number[];
    kept?: number[];
    keptDice?: number[];
    modifier?: number;
  };
};

type RollMood = 'critical' | 'fumble' | 'high' | 'low' | 'normal';

@Component({
  selector: 'app-dice',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="dice-page">
      <div class="dice-hero">
        <a routerLink="/" class="back-home">Inicio</a>
        <h1>Mesa de Dados</h1>
        <p>Rolagem com atmosfera de mesa, contexto narrativo e historico vivo de campanha</p>

        <div class="hero-nav" *ngIf="selectedCampaignId">
          <a class="hero-chip" [routerLink]="['/campaigns', selectedCampaignId]">Campanha</a>
          <a class="hero-chip" [routerLink]="['/campaigns', selectedCampaignId, 'wiki']">Wiki</a>
          <a class="hero-chip" [routerLink]="['/campaigns', selectedCampaignId, 'compendium']">Compendio</a>
        </div>
      </div>

      <div class="dice-container">
        <section class="card config-card">
          <h2>Contexto de Rolagem</h2>
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

            <select class="form-control" [(ngModel)]="contextType">
              <option value="ATAQUE">Ataque</option>
              <option value="TESTE">Teste</option>
              <option value="RESISTENCIA">Resistencia</option>
              <option value="INICIATIVA">Iniciativa</option>
              <option value="MAGIA">Magia</option>
            </select>

            <input class="form-control" placeholder="Cena atual (ex: Docas em chamas)" [(ngModel)]="sceneContext" />
            <input class="form-control" placeholder="Rotulo extra" [(ngModel)]="rollLabel" />

            <label class="private-toggle">
              <input type="checkbox" [(ngModel)]="isPrivateRoll" />
              Rolagem privada
            </label>
            <label class="private-toggle">
              <input type="checkbox" [(ngModel)]="ambientSoundEnabled" />
              Som de impacto
            </label>
            <label class="private-toggle" [class.disabled]="!selectedSessionId">
              <input type="checkbox" [(ngModel)]="autoLogToSession" [disabled]="!selectedSessionId" />
              Registrar no log da sessao
            </label>
          </div>
          <small class="help-text">
            Para 1d20+STR, selecione o personagem. Sem campanha selecionada, a rolagem fica local (nao persistida).
          </small>
          <small class="help-text" *ngIf="sessionFeedback">{{ sessionFeedback }}</small>
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
          <div class="last-roll" *ngIf="lastRoll" [class.critical]="lastMood === 'critical'" [class.fumble]="lastMood === 'fumble'">
            <div class="last-roll-head">
              <strong>Ultima rolagem</strong>
              <span class="mood" [class.critical]="lastMood === 'critical'" [class.fumble]="lastMood === 'fumble'">
                {{ moodLabel(lastMood) }}
              </span>
            </div>
            <div class="last-roll-main">{{ lastRoll.formula }} = {{ lastRoll.result }}</div>
            <div class="last-roll-meta" *ngIf="lastRoll.label">{{ lastRoll.label }}</div>
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
            <div class="history-item" *ngFor="let item of history" [ngClass]="getMoodClass(item)">
              <div class="history-main">
                <strong>{{ item.formula }}</strong>
                <span class="result">= {{ item.result }}</span>
                <span class="mood-chip" [ngClass]="getMoodClass(item)">{{ moodLabel(getRollMood(item)) }}</span>
                <span *ngIf="item.label" class="label">{{ item.label }}</span>
                <span *ngIf="item.isPrivate" class="private-badge">privada</span>
              </div>
              <div class="history-meta">
                <span>{{ item.user?.name || 'Voce' }}</span>
                <span *ngIf="item.character">| {{ item.character.name }}</span>
                <span>| {{ item.createdAt | date:'dd/MM HH:mm:ss' }}</span>
                <span *ngIf="extractDice(item).length > 0">| dados: {{ extractDice(item).join(', ') }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .dice-page { min-height: 100vh; background: radial-gradient(circle at 10% 0%, rgba(198, 159, 82, 0.1), transparent 30%), var(--bg-primary); }
      .dice-hero {
        text-align: center;
        padding: 2.4rem 1rem 2rem;
        border-bottom: 1px solid var(--border-color);
        background: linear-gradient(180deg, rgba(15, 15, 26, 0.94), rgba(15, 15, 26, 0.68));
      }
      .dice-hero h1 { margin: 0.6rem 0 0.2rem; letter-spacing: 0.06em; }
      .dice-hero p { margin: 0; color: var(--text-secondary); }
      .back-home { color: var(--text-secondary); text-decoration: none; font-size: 0.85rem; }
      .back-home:hover { color: var(--accent-primary); }
      .hero-nav { margin-top: 0.85rem; display: flex; justify-content: center; gap: 0.45rem; flex-wrap: wrap; }
      .hero-chip {
        text-decoration: none;
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(201, 168, 76, 0.35);
        border-radius: 999px;
        padding: 0.28rem 0.75rem;
        font-size: 0.78rem;
      }
      .dice-container { max-width: 1040px; margin: 0 auto; padding: 1.5rem; display: grid; gap: 1rem; }
      .card {
        background: linear-gradient(180deg, rgba(23, 23, 37, 0.96), rgba(15, 15, 26, 0.96));
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
      .private-toggle.disabled { opacity: 0.55; }
      .help-text { display: block; margin-top: 0.6rem; color: var(--text-muted); }
      .quick-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .dice-btn {
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.02);
        color: var(--text-primary);
        border-radius: var(--radius-sm);
        padding: 0.55rem 0.85rem;
        cursor: pointer;
      }
      .dice-btn:hover { border-color: rgba(201, 168, 76, 0.7); }
      .formula-row { display: grid; grid-template-columns: 1fr auto; gap: 0.5rem; }
      .last-roll {
        margin-top: 0.75rem;
        border-radius: 0.8rem;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
      }
      .last-roll.critical { border-color: rgba(244, 180, 0, 0.85); box-shadow: 0 0 0 1px rgba(244, 180, 0, 0.2), 0 0 24px rgba(244, 180, 0, 0.15); }
      .last-roll.fumble { border-color: rgba(239, 68, 68, 0.6); box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.2), 0 0 24px rgba(239, 68, 68, 0.12); }
      .last-roll-head { display: flex; justify-content: space-between; align-items: center; }
      .last-roll-main { margin-top: 0.2rem; font-size: 1.1rem; font-weight: 700; }
      .last-roll-meta { margin-top: 0.2rem; color: var(--text-secondary); font-size: 0.85rem; }
      .mood {
        border-radius: 999px;
        font-size: 0.7rem;
        padding: 0.18rem 0.5rem;
        background: rgba(255, 255, 255, 0.07);
      }
      .mood.critical { background: rgba(244, 180, 0, 0.2); color: #f4b400; }
      .mood.fumble { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      .error { margin-top: 0.6rem; color: var(--danger); font-size: 0.85rem; }
      .history-head { display: flex; justify-content: space-between; align-items: center; }
      .empty-history { color: var(--text-muted); }
      .history-list { margin-top: 0.6rem; display: grid; gap: 0.5rem; }
      .history-item {
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-sm);
        padding: 0.65rem;
        background: rgba(255, 255, 255, 0.02);
      }
      .history-item.critical { border-color: rgba(244, 180, 0, 0.75); }
      .history-item.fumble { border-color: rgba(239, 68, 68, 0.65); }
      .history-main { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
      .result { color: var(--accent-primary); font-weight: 700; }
      .mood-chip {
        border-radius: 999px;
        padding: 0.12rem 0.45rem;
        font-size: 0.7rem;
        background: rgba(255, 255, 255, 0.08);
      }
      .mood-chip.critical { background: rgba(244, 180, 0, 0.22); color: #f4b400; }
      .mood-chip.fumble { background: rgba(239, 68, 68, 0.22); color: #ef4444; }
      .label { color: var(--text-secondary); font-size: 0.85rem; }
      .private-badge {
        background: rgba(239, 68, 68, 0.15);
        color: var(--danger);
        border-radius: 9999px;
        padding: 0.15rem 0.45rem;
        font-size: 0.7rem;
      }
      .history-meta { margin-top: 0.25rem; color: var(--text-muted); font-size: 0.78rem; }
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
  sceneContext = '';
  contextType = 'TESTE';
  isPrivateRoll = false;
  ambientSoundEnabled = true;
  autoLogToSession = false;

  quickDice = [4, 6, 8, 10, 12, 20, 100];
  customFormula = '1d20';

  history: DiceRollView[] = [];
  lastRoll: DiceRollView | null = null;
  lastMood: RollMood = 'normal';

  rolling = false;
  errorMessage = '';
  sessionFeedback = '';

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
    this.sessionFeedback = '';
    this.autoLogToSession = false;

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
    this.sessionFeedback = '';

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
        label: this.buildRollLabel(),
        isPrivate: this.isPrivateRoll,
      })
      .subscribe({
        next: (response) => {
          const createdRoll = response.data as DiceRollView;
          this.lastRoll = createdRoll;
          this.lastMood = this.getRollMood(createdRoll);
          this.playRollTone(this.lastMood);
          this.history = [createdRoll, ...this.history].slice(0, 100);
          this.rolling = false;

          if (this.autoLogToSession && this.selectedSessionId) {
            this.appendRollToSessionLog(this.selectedSessionId, createdRoll);
          }
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Falha ao executar rolagem.';
          this.rolling = false;
        },
      });
  }

  getRollMood(roll: DiceRollView): RollMood {
    const normalizedFormula = roll.formula.toLowerCase();
    const dice = this.extractDice(roll);

    if (normalizedFormula.includes('d20') && dice.length > 0) {
      const primary = dice[dice.length - 1];
      if (primary === 20) {
        return 'critical';
      }
      if (primary === 1) {
        return 'fumble';
      }
    }

    if (roll.result >= 25) {
      return 'high';
    }

    if (roll.result <= 5) {
      return 'low';
    }

    return 'normal';
  }

  getMoodClass(roll: DiceRollView): string {
    return this.getRollMood(roll);
  }

  moodLabel(mood: RollMood): string {
    if (mood === 'critical') {
      return 'Critico';
    }
    if (mood === 'fumble') {
      return 'Falha critica';
    }
    if (mood === 'high') {
      return 'Impactante';
    }
    if (mood === 'low') {
      return 'Arriscada';
    }
    return 'Padrao';
  }

  extractDice(roll: DiceRollView): number[] {
    const breakdown = roll.breakdown || {};

    if (Array.isArray(breakdown.keptDice) && breakdown.keptDice.length > 0) {
      return breakdown.keptDice;
    }

    if (Array.isArray(breakdown.kept) && breakdown.kept.length > 0) {
      return breakdown.kept;
    }

    if (Array.isArray(breakdown.rolledDice) && breakdown.rolledDice.length > 0) {
      return breakdown.rolledDice;
    }

    if (Array.isArray(breakdown.rolls) && breakdown.rolls.length > 0) {
      return breakdown.rolls;
    }

    return [];
  }

  private buildRollLabel(): string | undefined {
    const parts: string[] = [];

    const context = this.contextType.trim();
    if (context) {
      parts.push(`[${context}]`);
    }

    const scene = this.sceneContext.trim();
    if (scene) {
      parts.push(scene);
    }

    const custom = this.rollLabel.trim();
    if (custom) {
      parts.push(custom);
    }

    if (parts.length === 0) {
      return undefined;
    }

    return parts.join(' - ');
  }

  private appendRollToSessionLog(sessionId: string, roll: DiceRollView): void {
    this.sessionService.getSessionById(sessionId).subscribe({
      next: (response) => {
        const session = response.data;
        const current = String(session.narrativeLog || '').trim();
        const stamp = new Date(roll.createdAt).toLocaleString('pt-BR');
        const line = `- ${stamp}: ${roll.formula} = ${roll.result}${roll.label ? ` (${roll.label})` : ''}`;
        const nextLog = current.length > 0 ? `${current}\n${line}` : `## Registro de Rolagens da Mesa\n${line}`;

        this.sessionService.updateSessionLog(sessionId, { narrativeLog: nextLog }).subscribe({
          next: () => {
            this.sessionFeedback = 'Rolagem registrada no log da sessao.';
          },
          error: () => {
            this.sessionFeedback = 'Sem permissao de GM para registrar no log da sessao.';
          },
        });
      },
      error: () => {
        this.sessionFeedback = 'Nao foi possivel carregar sessao para registrar a rolagem.';
      },
    });
  }

  private playRollTone(mood: RollMood): void {
    if (!this.ambientSoundEnabled) {
      return;
    }

    const audioContextCtor =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!audioContextCtor) {
      return;
    }

    try {
      const context = new audioContextCtor();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      const baseFreq = mood === 'critical' ? 580 : mood === 'fumble' ? 130 : 320;
      oscillator.type = mood === 'critical' ? 'triangle' : mood === 'fumble' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(baseFreq, context.currentTime);

      gainNode.gain.setValueAtTime(0.001, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.25);

      oscillator.onended = () => {
        context.close().catch(() => undefined);
      };
    } catch {
      // Som e opcional; erro aqui nao deve quebrar a experiencia de rolagem.
    }
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
      label: this.buildRollLabel() || null,
      isPrivate: this.isPrivateRoll,
      createdAt: new Date().toISOString(),
      breakdown: {
        rolls,
        modifier,
      },
    };

    this.lastRoll = localRoll;
    this.lastMood = this.getRollMood(localRoll);
    this.playRollTone(this.lastMood);
    this.history = [localRoll, ...this.history].slice(0, 100);
  }
}
