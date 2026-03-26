import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CombatService } from '../../../core/services/combat.service';
import { SessionService } from '../../../core/services/session.service';
import { SocketService } from '../../../core/services/socket.service';
import { HpBarComponent } from '../../../shared/components/hp-bar.component';

type CampaignView = {
  id: string;
  name: string;
  ownerId: string;
  members: Array<{ role: 'GM' | 'PLAYER'; user: { id: string } }>;
};

type SessionView = { id: string; date: string };

type CombatantView = {
  id: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isNpc: boolean;
  conditions: string[];
  notes?: string | null;
};

type EncounterView = {
  id: string;
  name: string;
  round: number;
  currentTurn: number;
  isActive: boolean;
  combatants: CombatantView[];
};

const CONDITION_ICONS: Record<string, string> = {
  poisoned: '\uD83D\uDFE2',
  paralyzed: '\uD83D\uDD35',
  frightened: '\uD83D\uDFE1',
  stunned: '\u26A1',
  blinded: '\uD83D\uDDA4',
  charmed: '\uD83D\uDC9C',
  prone: '\u2B07\uFE0F',
  restrained: '\u26D3\uFE0F',
  insanity: '\uD83D\uDFE3',
  unconscious: '\uD83D\uDCA4',
  concentrating: '\uD83C\uDFAF',
};

@Component({
  selector: 'app-campaign-combat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HpBarComponent],
  template: `
    <section class="shell" *ngIf="campaign; else loadingState">
      <header class="header card">
        <div>
          <a class="back" [routerLink]="['/campaigns', campaign.id]">Voltar</a>
          <h1>Combate - {{ campaign.name }}</h1>
        </div>
        <div class="actions">
          <select class="form-control" [(ngModel)]="selectedSessionId" (change)="loadEncounters()">
            <option value="">Selecione sessao</option>
            <option *ngFor="let session of sessions" [value]="session.id">{{ session.date | date:'dd/MM/yyyy' }}</option>
          </select>
          <button *ngIf="isGm" class="btn btn-primary" (click)="showNewEncounter = true">Novo Encontro</button>
        </div>
      </header>

      <!-- Novo Encontro -->
      <div class="card panel" *ngIf="showNewEncounter && isGm">
        <h2>Criar Encontro</h2>
        <div class="form-row">
          <input class="form-control" [(ngModel)]="newEncounterName" placeholder="Nome do encontro" />
          <button class="btn btn-primary" (click)="createEncounter()" [disabled]="!newEncounterName || !selectedSessionId || creatingEncounter">Criar</button>
          <button class="btn btn-outline" (click)="showNewEncounter = false">Cancelar</button>
        </div>
      </div>

      <!-- Lista de Encontros -->
      <div class="encounters-grid">
        <article class="card encounter-card" *ngFor="let encounter of encounters" [class.active]="encounter.id === selectedEncounterId">
          <header class="encounter-header" (click)="selectEncounter(encounter.id)">
            <h3>{{ encounter.name }}</h3>
            <div class="round-badge">Round {{ encounter.round }} · Turno {{ encounter.currentTurn + 1 }}</div>
          </header>

          <div class="encounter-body" *ngIf="encounter.id === selectedEncounterId">
            <!-- Controles GM -->
            <div class="gm-controls" *ngIf="isGm">
              <button class="btn btn-primary" (click)="nextTurn()" [disabled]="advancingTurn">
                Proximo Turno
              </button>
              <button class="btn btn-outline" (click)="showAddCombatant = !showAddCombatant">
                + Combatente
              </button>
            </div>

            <!-- Adicionar Combatente -->
            <div class="add-combatant" *ngIf="showAddCombatant && isGm">
              <input class="form-control" [(ngModel)]="newCombatant.name" placeholder="Nome" />
              <input class="form-control sm" type="number" [(ngModel)]="newCombatant.initiative" placeholder="Init" />
              <input class="form-control sm" type="number" [(ngModel)]="newCombatant.hp" placeholder="HP" />
              <input class="form-control sm" type="number" [(ngModel)]="newCombatant.maxHp" placeholder="Max HP" />
              <label class="checkbox">
                <input type="checkbox" [(ngModel)]="newCombatant.isNpc" /> NPC
              </label>
              <button class="btn btn-primary btn-sm" (click)="addCombatant()" [disabled]="!newCombatant.name">Add</button>
            </div>

            <!-- Lista de Combatentes -->
            <div class="combatants-list">
              <div
                class="combatant-row"
                *ngFor="let combatant of encounter.combatants; let i = index"
                [class.active-turn]="i === encounter.currentTurn"
                [class.npc]="combatant.isNpc"
                [class.dead]="combatant.hp <= 0"
              >
                <div class="turn-indicator" *ngIf="i === encounter.currentTurn">></div>
                <div class="combatant-info">
                  <strong>{{ combatant.name }}</strong>
                  <span class="initiative">Init {{ combatant.initiative }}</span>
                  <span class="npc-badge" *ngIf="combatant.isNpc">NPC</span>
                </div>
                <div class="conditions">
                  <span class="condition" *ngFor="let cond of combatant.conditions" [title]="cond">
                    {{ getConditionIcon(cond) }}
                  </span>
                </div>
                <div class="hp-section">
                  <app-hp-bar [current]="combatant.hp" [max]="combatant.maxHp" />
                  <div class="hp-controls" *ngIf="isGm">
                    <input
                      class="form-control hp-input"
                      type="number"
                      [ngModel]="combatant.hp"
                      (ngModelChange)="updateHp(combatant.id, $event)"
                    />
                    <span class="hp-max">/ {{ combatant.maxHp }}</span>
                  </div>
                </div>
                <div class="combatant-actions" *ngIf="isGm">
                  <button class="icon-btn" (click)="toggleConditionMenu(combatant.id)" title="Condicoes">
                    +
                  </button>
                  <button class="icon-btn danger" (click)="removeCombatant(combatant.id)" title="Remover">
                    x
                  </button>
                </div>

                <!-- Condition Menu -->
                <div class="condition-menu" *ngIf="conditionMenuOpen === combatant.id">
                  <button
                    class="condition-option"
                    *ngFor="let cond of availableConditions"
                    (click)="toggleCondition(combatant, cond)"
                    [class.active]="combatant.conditions.includes(cond)"
                  >
                    {{ getConditionIcon(cond) }} {{ cond }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="encounters.length === 0 && selectedSessionId">
        <p>Nenhum encontro nesta sessao.</p>
        <button *ngIf="isGm" class="btn btn-primary" (click)="showNewEncounter = true">Criar Encontro</button>
      </div>
    </section>

    <ng-template #loadingState>
      <div class="loading"><div class="spinner"></div></div>
    </ng-template>
  `,
  styles: [
    `
      .shell { width: min(1100px, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 3rem; }
      .header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 1.2rem; margin-bottom: 1rem; }
      .header h1 { margin: 0; }
      .back { color: var(--text-secondary); text-decoration: none; margin-bottom: 0.5rem; display: block; }
      .actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
      .panel { padding: 1rem; margin-bottom: 1rem; }
      .panel h2 { margin: 0 0 0.75rem; }
      .form-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
      .form-row input { flex: 1; min-width: 200px; }
      .encounters-grid { display: grid; gap: 1rem; }
      .encounter-card { padding: 0; overflow: hidden; }
      .encounter-card.active { border: 1px solid rgba(201, 168, 76, 0.6); }
      .encounter-header { padding: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
      .encounter-header h3 { margin: 0; }
      .round-badge { padding: 0.3rem 0.7rem; border-radius: 999px; background: rgba(201, 168, 76, 0.2); font-size: 0.85rem; }
      .encounter-body { padding: 0 1rem 1rem; }
      .gm-controls { display: flex; gap: 0.6rem; margin-bottom: 1rem; }
      .add-combatant { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.03); border-radius: 0.75rem; }
      .add-combatant .sm { width: 80px; }
      .checkbox { display: flex; align-items: center; gap: 0.3rem; color: var(--text-secondary); }
      .combatants-list { display: grid; gap: 0.5rem; }
      .combatant-row { display: grid; grid-template-columns: auto 1fr auto 180px auto; gap: 0.75rem; align-items: center; padding: 0.75rem; border-radius: 0.75rem; background: rgba(255, 255, 255, 0.03); position: relative; }
      .combatant-row.active-turn { background: rgba(201, 168, 76, 0.15); border: 1px solid rgba(201, 168, 76, 0.4); }
      .combatant-row.npc { border-left: 3px solid var(--color-danger); }
      .combatant-row.dead { opacity: 0.5; }
      .turn-indicator { font-weight: bold; color: var(--color-primary); width: 1rem; }
      .combatant-info { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
      .combatant-info strong { margin-right: 0.3rem; }
      .initiative { font-size: 0.8rem; color: var(--text-secondary); }
      .npc-badge { font-size: 0.7rem; padding: 0.15rem 0.4rem; border-radius: 999px; background: rgba(220, 53, 69, 0.3); color: var(--color-danger-light, #ff6b6b); }
      .conditions { display: flex; gap: 0.3rem; }
      .condition { font-size: 1.1rem; cursor: default; }
      .hp-section { display: grid; gap: 0.3rem; }
      .hp-controls { display: flex; align-items: center; gap: 0.3rem; }
      .hp-input { width: 60px; text-align: center; }
      .hp-max { font-size: 0.85rem; color: var(--text-secondary); }
      .combatant-actions { display: flex; gap: 0.4rem; }
      .icon-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05); color: var(--text-primary); cursor: pointer; font-size: 0.9rem; }
      .icon-btn.danger { color: var(--color-danger); }
      .icon-btn:hover { background: rgba(255, 255, 255, 0.1); }
      .condition-menu { position: absolute; top: 100%; right: 0; z-index: 10; background: var(--bg-card); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 0.75rem; padding: 0.5rem; display: grid; gap: 0.25rem; min-width: 140px; }
      .condition-option { padding: 0.4rem 0.6rem; border: none; background: none; color: var(--text-primary); cursor: pointer; text-align: left; border-radius: 0.5rem; }
      .condition-option:hover { background: rgba(255, 255, 255, 0.08); }
      .condition-option.active { background: rgba(201, 168, 76, 0.2); }
      .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
      @media (max-width: 700px) {
        .combatant-row { grid-template-columns: 1fr; gap: 0.5rem; }
        .turn-indicator { display: none; }
      }
    `,
  ],
})
export class CampaignCombatComponent implements OnInit, OnDestroy {
  campaignId = '';
  campaign: CampaignView | null = null;
  sessions: SessionView[] = [];
  encounters: EncounterView[] = [];
  selectedSessionId = '';
  selectedEncounterId = '';
  showNewEncounter = false;
  showAddCombatant = false;
  newEncounterName = '';
  creatingEncounter = false;
  advancingTurn = false;
  conditionMenuOpen: string | null = null;
  availableConditions = Object.keys(CONDITION_ICONS);

  newCombatant = { name: '', initiative: 10, hp: 10, maxHp: 10, isNpc: true };

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly campaignService: CampaignService,
    private readonly sessionService: SessionService,
    private readonly combatService: CombatService,
    private readonly socketService: SocketService
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

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.campaignId) return;

    this.campaignService.getCampaignById(this.campaignId).subscribe({
      next: (res) => {
        this.campaign = res.data as CampaignView;
        this.loadSessions();
        this.bindRealtime();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.campaignId) this.socketService.leaveCampaign(this.campaignId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindRealtime(): void {
    this.socketService.connect();
    this.socketService.joinCampaign(this.campaignId);

    this.socketService
      .on<{ encounterId: string; round: number; currentTurn: number }>('combat:turn_changed')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const encounter = this.encounters.find((e) => e.id === data.encounterId);
        if (encounter) {
          encounter.round = data.round;
          encounter.currentTurn = data.currentTurn;
        }
      });

    this.socketService
      .on<{ encounterId: string; combatant: CombatantView }>('combat:combatant_updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        const encounter = this.encounters.find((e) => e.id === data.encounterId);
        if (!encounter) return;
        const idx = encounter.combatants.findIndex((c) => c.id === data.combatant.id);
        if (idx >= 0) encounter.combatants[idx] = data.combatant;
      });
  }

  loadSessions(): void {
    this.sessionService.getSessionsByCampaign(this.campaignId).subscribe({
      next: (res) => {
        this.sessions = (res.data || []) as SessionView[];
        if (this.sessions.length > 0) {
          this.selectedSessionId = this.sessions[0].id;
          this.loadEncounters();
        }
      },
    });
  }

  loadEncounters(): void {
    if (!this.selectedSessionId) {
      this.encounters = [];
      return;
    }
    this.combatService.listSessionEncounters(this.selectedSessionId).subscribe({
      next: (res) => {
        this.encounters = (res.data || []) as EncounterView[];
        if (this.encounters.length > 0 && !this.selectedEncounterId) {
          this.selectedEncounterId = this.encounters[0].id;
        }
      },
    });
  }

  selectEncounter(id: string): void {
    this.selectedEncounterId = this.selectedEncounterId === id ? '' : id;
    this.conditionMenuOpen = null;
  }

  createEncounter(): void {
    if (!this.newEncounterName || !this.selectedSessionId) return;
    this.creatingEncounter = true;
    this.combatService
      .createEncounter(this.selectedSessionId, { name: this.newEncounterName, combatants: [] })
      .subscribe({
        next: () => {
          this.creatingEncounter = false;
          this.showNewEncounter = false;
          this.newEncounterName = '';
          this.loadEncounters();
        },
        error: () => {
          this.creatingEncounter = false;
        },
      });
  }

  nextTurn(): void {
    if (!this.selectedEncounterId) return;
    this.advancingTurn = true;
    this.combatService.nextTurn(this.selectedEncounterId).subscribe({
      next: (res) => {
        const updated = res.data as EncounterView;
        const idx = this.encounters.findIndex((e) => e.id === updated.id);
        if (idx >= 0) this.encounters[idx] = updated;
        this.advancingTurn = false;
      },
      error: () => {
        this.advancingTurn = false;
      },
    });
  }

  addCombatant(): void {
    if (!this.selectedEncounterId || !this.newCombatant.name) return;
    this.combatService
      .addCombatant(this.selectedEncounterId, {
        name: this.newCombatant.name,
        initiative: this.newCombatant.initiative,
        hp: this.newCombatant.hp,
        maxHp: this.newCombatant.maxHp,
        isNpc: this.newCombatant.isNpc,
      })
      .subscribe({
        next: () => {
          this.newCombatant = { name: '', initiative: 10, hp: 10, maxHp: 10, isNpc: true };
          this.showAddCombatant = false;
          this.loadEncounters();
        },
      });
  }

  updateHp(combatantId: string, hp: number): void {
    if (!this.selectedEncounterId || !Number.isFinite(hp)) return;
    this.combatService.updateCombatant(this.selectedEncounterId, combatantId, { hp }).subscribe();
  }

  removeCombatant(combatantId: string): void {
    if (!this.selectedEncounterId) return;
    this.combatService.removeCombatant(this.selectedEncounterId, combatantId).subscribe({
      next: () => this.loadEncounters(),
    });
  }

  toggleConditionMenu(combatantId: string): void {
    this.conditionMenuOpen = this.conditionMenuOpen === combatantId ? null : combatantId;
  }

  toggleCondition(combatant: CombatantView, condition: string): void {
    if (!this.selectedEncounterId) return;
    const conditions = combatant.conditions.includes(condition)
      ? combatant.conditions.filter((c) => c !== condition)
      : [...combatant.conditions, condition];
    this.combatService
      .updateCombatant(this.selectedEncounterId, combatant.id, { conditions })
      .subscribe({
        next: () => {
          combatant.conditions = conditions;
        },
      });
  }

  getConditionIcon(condition: string): string {
    return CONDITION_ICONS[condition] || '\u2753';
  }
}
