import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CharacterService } from '../../../core/services/character.service';
import { CombatService } from '../../../core/services/combat.service';
import { CreatureService } from '../../../core/services/creature.service';
import { DiceRollService } from '../../../core/services/dice-roll.service';
import { SessionProposalService } from '../../../core/services/session-proposal.service';
import { SessionService } from '../../../core/services/session.service';
import { SocketService } from '../../../core/services/socket.service';
import { DiceResultComponent } from '../../../shared/components/dice-result.component';
import { SystemBadgeComponent } from '../../../shared/components/system-badge.component';
import { CampaignLogComponent } from './campaign-log.component';
import { CampaignResourcesComponent } from './campaign-resources.component';

type ResourceMap = Record<string, string | number | boolean | null>;
type CampaignView = {
  id: string;
  name: string;
  system: string;
  ownerId: string;
  members: Array<{ role: 'GM' | 'PLAYER'; user: { id: string; name: string } }>;
  systemTemplate?: { id: string; slug: string; hasSanity: boolean; hasMana: boolean } | null;
};
type CharacterView = { id: string; name: string; class: string; resources: ResourceMap | null };
type SessionView = { id: string; date: string; narrativeLog?: string | null; privateGmNotes?: string | null; highlights?: string[] };
type CreatureView = { id: string; name: string; creatureType: string; xpReward?: number | null; stats?: Record<string, unknown> | null };
type CombatEncounterView = {
  id: string;
  name: string;
  round: number;
  currentTurn: number;
  combatants: Array<{ id: string; name: string; hp: number; maxHp: number; initiative: number }>;
};
type SessionProposalView = { id: string; status: 'OPEN' | 'DECIDED' | 'CANCELLED'; dates: string[]; decidedDate?: string | null };
type DiceRollView = { id: string; formula: string; result: number; label?: string | null; breakdown?: { rolls?: number[] } | null };

@Component({
  selector: 'app-campaign-tools',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DiceResultComponent,
    SystemBadgeComponent,
    CampaignLogComponent,
    CampaignResourcesComponent,
  ],
  template: `
    <section class="shell" *ngIf="campaign; else loadingState">
      <header class="card header">
        <div>
          <a class="back" [routerLink]="['/campaigns', campaign.id]">Voltar para campanha</a>
          <app-system-badge [system]="campaign.systemTemplate?.slug || campaign.system"></app-system-badge>
          <h1>Ferramentas da Mesa</h1>
        </div>
        <div class="actions">
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaign.id, 'wiki']">Wiki</a>
          <a class="btn btn-outline" routerLink="/dice">Dados</a>
        </div>
      </header>

      <div class="grid">
        <!-- Log Narrativo -->
        <app-campaign-log
          [sessions]="sessions"
          [campaign]="campaign"
          (sessionSelected)="onSessionSelected($event)"
        />

        <!-- Recursos dos Personagens -->
        <app-campaign-resources
          [characters]="characters"
          [campaignId]="campaignId"
          [showMana]="campaign.systemTemplate?.hasMana ?? true"
          [showSanity]="campaign.systemTemplate?.hasSanity ?? false"
        />

        <!-- Tracker de Combate -->
        <article class="card panel">
          <h2>Tracker de Combate</h2>
          <div class="form-grid compact">
            <select class="form-control" [(ngModel)]="selectedEncounterId" (change)="setSelectedEncounter()">
              <option value="">Selecione um encontro</option>
              <option *ngFor="let encounter of encounters" [value]="encounter.id">{{ encounter.name }}</option>
            </select>
            <button class="btn btn-primary btn-sm" (click)="advanceTurn()" [disabled]="!selectedEncounterId || advancingTurn">Proximo turno</button>
          </div>
          <div class="combat-list" *ngIf="selectedEncounter">
            <div class="combat-item" *ngFor="let combatant of selectedEncounter.combatants; let i = index" [class.active]="i === selectedEncounter.currentTurn">
              <div><strong>{{ combatant.name }}</strong><small>Init {{ combatant.initiative }}</small></div>
              <div class="inline"><input class="form-control hp" type="number" [ngModel]="combatant.hp" (ngModelChange)="updateCombatantHp(combatant.id, $event)" /><span>/ {{ combatant.maxHp }}</span></div>
            </div>
          </div>
        </article>

        <!-- Compendio -->
        <article class="card panel">
          <h2>Compendio</h2>
          <input class="form-control" [(ngModel)]="creatureSearch" (ngModelChange)="filterCreatures()" placeholder="Buscar criatura" />
          <div class="combat-list">
            <button class="combat-item click" *ngFor="let creature of filteredCreatures" (click)="addCreatureToEncounter(creature)" [disabled]="!selectedEncounterId">
              <div><strong>{{ creature.name }}</strong><small>{{ creature.creatureType }} · XP {{ creature.xpReward || 0 }}</small></div>
              <span>Adicionar</span>
            </button>
          </div>
        </article>

        <!-- Votacao de Datas -->
        <article class="card panel">
          <h2>Votacao de Datas</h2>
          <div class="form-grid">
            <input class="form-control" type="datetime-local" [(ngModel)]="proposalDates[0]" />
            <input class="form-control" type="datetime-local" [(ngModel)]="proposalDates[1]" />
            <input class="form-control" type="datetime-local" [(ngModel)]="proposalDates[2]" />
          </div>
          <button class="btn btn-outline btn-sm" (click)="createProposal()" [disabled]="creatingProposal">Criar proposta</button>
          <div class="box" *ngFor="let proposal of proposals">
            <strong>{{ proposal.status }}</strong>
            <div class="chips">
              <button class="chip-button" *ngFor="let date of proposal.dates" (click)="voteProposal(proposal.id, date)">
                {{ date | date:'dd/MM HH:mm' }}
              </button>
            </div>
            <div class="chips" *ngIf="isGm && proposal.status === 'OPEN'">
              <button class="chip-button gm" *ngFor="let date of proposal.dates" (click)="decideProposal(proposal.id, date)">Confirmar {{ date | date:'dd/MM HH:mm' }}</button>
            </div>
          </div>
        </article>

        <!-- Feed ao Vivo -->
        <article class="card panel">
          <h2>Feed ao Vivo</h2>
          <div class="feed"><app-dice-result *ngFor="let roll of liveRolls" [roll]="roll"></app-dice-result></div>
        </article>
      </div>
    </section>

    <ng-template #loadingState><div class="loading"><div class="spinner"></div></div></ng-template>
  `,
  styles: [
    `
      .shell { width: min(1280px, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 3rem; }
      .header { display: flex; justify-content: space-between; gap: 1rem; padding: 1.2rem; margin-bottom: 1rem; }
      .header h1, .panel h2 { margin: 0.7rem 0; }
      .back { color: var(--text-secondary); text-decoration: none; }
      .actions { display: flex; gap: 0.6rem; align-content: start; flex-wrap: wrap; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
      .panel { padding: 1rem; display: grid; gap: 0.75rem; }
      .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.6rem; }
      .form-grid.compact { grid-template-columns: 1fr auto; }
      .box { padding: 0.8rem; border-radius: 1rem; background: rgba(255,255,255,0.04); display: grid; gap: 0.45rem; }
      .combat-list, .feed { display: grid; gap: 0.6rem; }
      .combat-item { display: flex; justify-content: space-between; gap: 0.8rem; padding: 0.75rem; border: 1px solid rgba(255,255,255,0.08); border-radius: 1rem; background: rgba(255,255,255,0.03); color: var(--text-primary); }
      .combat-item.active { border-color: rgba(201,168,76,0.4); }
      .combat-item.click { cursor: pointer; text-align: left; }
      .inline { display: flex; align-items: center; gap: 0.4rem; }
      .hp { width: 5rem; }
      .chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
      .chips span, .chip-button { padding: 0.35rem 0.65rem; border-radius: 999px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: var(--text-primary); }
      .chip-button { cursor: pointer; }
      .chip-button.gm { border-color: rgba(201,168,76,0.4); }
      small, span { color: var(--text-secondary); }
      @media (max-width: 980px) { .grid, .form-grid.compact { grid-template-columns: 1fr; } .header { flex-direction: column; } }
    `,
  ],
})
export class CampaignToolsComponent implements OnInit, OnDestroy {
  campaignId = '';
  campaign: CampaignView | null = null;
  characters: CharacterView[] = [];
  sessions: SessionView[] = [];
  creatures: CreatureView[] = [];
  filteredCreatures: CreatureView[] = [];
  encounters: CombatEncounterView[] = [];
  proposals: SessionProposalView[] = [];
  liveRolls: DiceRollView[] = [];
  selectedSessionId = '';
  selectedEncounterId = '';
  selectedEncounter: CombatEncounterView | null = null;
  creatureSearch = '';
  advancingTurn = false;
  creatingProposal = false;
  proposalDates = ['', '', ''];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly campaignService: CampaignService,
    private readonly characterService: CharacterService,
    private readonly sessionService: SessionService,
    private readonly combatService: CombatService,
    private readonly creatureService: CreatureService,
    private readonly proposalService: SessionProposalService,
    private readonly diceRollService: DiceRollService,
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

    forkJoin({
      campaign: this.campaignService.getCampaignById(this.campaignId),
      characters: this.characterService.getCharactersByCampaign(this.campaignId),
      sessions: this.sessionService.getSessionsByCampaign(this.campaignId),
      proposals: this.proposalService.listByCampaign(this.campaignId),
      rolls: this.diceRollService.getCampaignRolls(this.campaignId, { limit: 6 }),
    }).subscribe({
      next: ({ campaign, characters, sessions, proposals, rolls }) => {
        this.campaign = campaign.data as CampaignView;
        this.characters = (characters.data || []) as CharacterView[];
        this.sessions = (sessions.data || []) as SessionView[];
        this.proposals = (proposals.data || []) as SessionProposalView[];
        this.liveRolls = (rolls.data || []) as DiceRollView[];
        this.loadCreatures();
        this.bindRealtime();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.campaignId) this.socketService.leaveCampaign(this.campaignId);
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSessionSelected(sessionId: string): void {
    this.selectedSessionId = sessionId;
    this.loadEncounters();
  }

  private bindRealtime(): void {
    this.socketService.joinCampaign(this.campaignId);
    this.socketService
      .on<DiceRollView>('dice:rolled')
      .pipe(takeUntil(this.destroy$))
      .subscribe((roll) => {
        this.liveRolls = [roll, ...this.liveRolls].slice(0, 6);
      });
    this.socketService
      .on<CombatEncounterView>('combat:created')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadEncounters());
    this.socketService
      .on<{ encounterId: string }>('combat:turn_changed')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadEncounters());
  }

  loadEncounters(): void {
    if (!this.selectedSessionId) {
      this.encounters = [];
      this.selectedEncounter = null;
      return;
    }
    this.combatService.listSessionEncounters(this.selectedSessionId).subscribe({
      next: (response) => {
        this.encounters = (response.data || []) as CombatEncounterView[];
        this.setSelectedEncounter();
      },
    });
  }

  setSelectedEncounter(): void {
    this.selectedEncounter =
      this.encounters.find((e) => e.id === this.selectedEncounterId) || this.encounters[0] || null;
    if (this.selectedEncounter) this.selectedEncounterId = this.selectedEncounter.id;
  }

  advanceTurn(): void {
    if (!this.selectedEncounterId) return;
    this.advancingTurn = true;
    this.combatService.nextTurn(this.selectedEncounterId).subscribe({
      next: (response) => {
        this.selectedEncounter = response.data as CombatEncounterView;
        this.advancingTurn = false;
      },
      error: () => {
        this.advancingTurn = false;
      },
    });
  }

  loadCreatures(): void {
    if (!this.campaign?.systemTemplate?.id) return;
    this.creatureService
      .list({ systemId: this.campaign.systemTemplate.id, includePrivate: true })
      .subscribe({
        next: (response) => {
          this.creatures = (response.data || []) as CreatureView[];
          this.filterCreatures();
        },
      });
  }

  filterCreatures(): void {
    const term = this.creatureSearch.trim().toLowerCase();
    this.filteredCreatures = this.creatures.filter(
      (c) =>
        !term || c.name.toLowerCase().includes(term) || c.creatureType.toLowerCase().includes(term)
    );
  }

  addCreatureToEncounter(creature: CreatureView): void {
    if (!this.selectedEncounterId) return;
    this.combatService
      .addCombatant(this.selectedEncounterId, {
        name: creature.name,
        initiative: this.extractStatNumber(creature.stats, 'DEX', 10),
        hp: this.extractStatNumber(creature.stats, 'hp', 10),
        maxHp: this.extractStatNumber(creature.stats, 'hp', 10),
        isNpc: true,
      })
      .subscribe({ next: () => this.loadEncounters() });
  }

  updateCombatantHp(combatantId: string, rawValue: string): void {
    if (!this.selectedEncounterId) return;
    const hp = Number(rawValue);
    if (!Number.isFinite(hp)) return;
    this.combatService.updateCombatant(this.selectedEncounterId, combatantId, { hp }).subscribe();
  }

  createProposal(): void {
    const dates = this.proposalDates.filter(Boolean);
    if (dates.length < 3) return;
    this.creatingProposal = true;
    this.proposalService.create(this.campaignId, dates).subscribe({
      next: () => {
        this.creatingProposal = false;
        this.reloadProposals();
        this.proposalDates = ['', '', ''];
      },
      error: () => {
        this.creatingProposal = false;
      },
    });
  }

  voteProposal(proposalId: string, date: string): void {
    this.proposalService.vote(proposalId, { date, available: true }).subscribe({
      next: () => this.reloadProposals(),
    });
  }

  decideProposal(proposalId: string, date: string): void {
    this.proposalService.decide(proposalId, date).subscribe({
      next: () => this.reloadProposals(),
    });
  }

  private reloadProposals(): void {
    this.proposalService.listByCampaign(this.campaignId).subscribe({
      next: (response) => {
        this.proposals = (response.data || []) as SessionProposalView[];
      },
    });
  }

  private extractStatNumber(
    stats: Record<string, unknown> | null | undefined,
    key: string,
    fallback: number
  ): number {
    if (!stats) return fallback;
    if (typeof stats[key] === 'number') return Number(stats[key]);
    const attrs =
      stats['attributes'] && typeof stats['attributes'] === 'object' && !Array.isArray(stats['attributes'])
        ? (stats['attributes'] as Record<string, unknown>)
        : null;
    return attrs && typeof attrs[key] === 'number' ? Number(attrs[key]) : fallback;
  }
}
