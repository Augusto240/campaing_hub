import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CampaignService } from '../../../core/services/campaign.service';
import { CombatService } from '../../../core/services/combat.service';
import { CompendiumService } from '../../../core/services/compendium.service';
import { CreatureService } from '../../../core/services/creature.service';
import { SessionService } from '../../../core/services/session.service';
import { SystemBadgeComponent } from '../../../shared/components/system-badge.component';
import { CompendiumEntry, CompendiumKind } from '../../../core/types';
import {
  getKnowledgePresenceScore,
  sortKnowledgeEntriesByPresence,
} from './campaign-compendium.utils';

type CampaignView = {
  id: string;
  name: string;
  systemTemplate?: { id: string; slug: string; name: string } | null;
};

type CreatureView = {
  id: string;
  name: string;
  creatureType: string;
  xpReward?: number | null;
  description?: string | null;
  stats?: Record<string, unknown> | null;
  abilities?: Array<{ name: string; description: string }> | null;
  loot?: Array<{ name: string; chance: number }> | null;
};

type SessionView = { id: string; date: string };
type EncounterView = { id: string; name: string };

const CREATURE_TYPES = [
  'aberration',
  'beast',
  'celestial',
  'construct',
  'dragon',
  'elemental',
  'fey',
  'fiend',
  'giant',
  'humanoid',
  'monstrosity',
  'ooze',
  'plant',
  'undead',
  'mythos',
  'horror',
];

const COMPENDIUM_TABS: Array<{ label: string; kind: CompendiumKind }> = [
  { label: 'Bestiario', kind: 'BESTIARY' },
  { label: 'Magias', kind: 'SPELL' },
  { label: 'Itens', kind: 'ITEM' },
  { label: 'Classes', kind: 'CLASS' },
];

@Component({
  selector: 'app-campaign-compendium',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SystemBadgeComponent],
  template: `
    <section class="shell" *ngIf="campaign; else loadingState">
      <header class="header card">
        <div>
          <a class="back" [routerLink]="['/campaigns', campaign.id]">Voltar</a>
          <h1>Compendio da Campanha</h1>
          <p class="header-copy">Magias, itens, classes e memoria de mesa conectados a sessoes, wiki e personagens.</p>
          <app-system-badge [system]="campaign.systemTemplate?.slug || 'generic'"></app-system-badge>
        </div>
      </header>

      <nav class="tabs card">
        <button
          class="tab"
          *ngFor="let tab of compendiumTabs"
          [class.active]="activeKind === tab.kind"
          (click)="setActiveKind(tab.kind)"
        >
          {{ tab.label }}
          <span *ngIf="kindTotals[tab.kind] !== undefined">({{ kindTotals[tab.kind] }})</span>
        </button>
      </nav>

      <!-- Filtros -->
      <div class="filters card">
        <input class="form-control search" [(ngModel)]="searchTerm" (ngModelChange)="filterCreatures()" placeholder="Buscar por nome ou descricao..." />
        <select class="form-control" [(ngModel)]="typeFilter" (change)="filterCreatures()" *ngIf="activeKind === 'BESTIARY'">
          <option value="">Todos os tipos</option>
          <option *ngFor="let type of creatureTypes" [value]="type">{{ type | titlecase }}</option>
        </select>
        <div class="xp-range" *ngIf="activeKind === 'BESTIARY'">
          <label>XP: {{ xpMin }} - {{ xpMax }}</label>
          <input type="range" [(ngModel)]="xpMin" min="0" max="10000" step="100" (change)="filterCreatures()" />
          <input type="range" [(ngModel)]="xpMax" min="0" max="10000" step="100" (change)="filterCreatures()" />
        </div>
      </div>

      <div class="results-summary">
        {{ getActiveResultCount() }} resultados
        <span *ngIf="activeKind !== 'BESTIARY'">· Entradas mais conectadas sobem primeiro</span>
      </div>

      <!-- Painel de Adicionar ao Combate -->
      <div class="add-panel card" *ngIf="selectedCreature && activeKind === 'BESTIARY'">
        <h3>Adicionar {{ selectedCreature.name }} ao Combate</h3>
        <div class="form-row">
          <select class="form-control" [(ngModel)]="selectedSessionId" (change)="loadEncounters()">
            <option value="">Selecione sessao</option>
            <option *ngFor="let session of sessions" [value]="session.id">{{ session.date | date:'dd/MM/yyyy' }}</option>
          </select>
          <select class="form-control" [(ngModel)]="selectedEncounterId">
            <option value="">Selecione encontro</option>
            <option *ngFor="let encounter of encounters" [value]="encounter.id">{{ encounter.name }}</option>
          </select>
          <input class="form-control sm" type="number" [(ngModel)]="addCount" min="1" max="10" />
          <button class="btn btn-primary" (click)="addToEncounter()" [disabled]="!selectedEncounterId || adding">Adicionar</button>
          <button class="btn btn-outline" (click)="selectedCreature = null">Cancelar</button>
        </div>
      </div>

      <!-- Grid de Criaturas -->
      <div class="creatures-grid" *ngIf="activeKind === 'BESTIARY'">
        <article class="creature-card card" *ngFor="let creature of filteredCreatures" (click)="selectCreature(creature)">
          <header class="creature-header">
            <h3>{{ creature.name }}</h3>
            <span class="xp-badge" *ngIf="creature.xpReward">{{ creature.xpReward }} XP</span>
          </header>
          <div class="creature-type">{{ creature.creatureType | titlecase }}</div>
          <p class="description" *ngIf="creature.description">{{ creature.description | slice:0:120 }}{{ creature.description && creature.description.length > 120 ? '...' : '' }}</p>

          <!-- Stats -->
          <div class="stats-grid" *ngIf="creature.stats">
            <div class="stat" *ngFor="let stat of getStats(creature)">
              <span class="stat-label">{{ stat.key }}</span>
              <strong>{{ stat.value }}</strong>
            </div>
          </div>

          <!-- Abilities -->
          <div class="abilities" *ngIf="creature.abilities && creature.abilities.length > 0">
            <strong>Habilidades:</strong>
            <ul>
              <li *ngFor="let ability of creature.abilities.slice(0, 3)">
                <strong>{{ ability.name }}:</strong> {{ ability.description | slice:0:60 }}...
              </li>
            </ul>
          </div>

          <!-- Loot -->
          <div class="loot" *ngIf="creature.loot && creature.loot.length > 0">
            <strong>Loot Possivel:</strong>
            <div class="loot-items">
              <span class="loot-item" *ngFor="let item of creature.loot">
                {{ item.name }} ({{ item.chance }}%)
              </span>
            </div>
          </div>

          <button class="btn btn-outline btn-sm add-btn">+ Adicionar ao Combate</button>
        </article>
      </div>

      <div class="creatures-grid" *ngIf="activeKind !== 'BESTIARY'">
        <article class="creature-card card" *ngFor="let entry of knowledgeEntries">
          <header class="creature-header">
            <h3>{{ entry.name }}</h3>
            <span class="xp-badge">{{ entry.source }}</span>
          </header>

          <div class="creature-type">{{ activeKind }}</div>
          <p class="description">{{ entry.summary }}</p>

          <div class="signal-row" *ngIf="getKnowledgePresenceScore(entry) > 0">
            <span class="signal-chip" *ngIf="entry.links.usedInSessions.length > 0">
              {{ entry.links.usedInSessions.length }} sessoes
            </span>
            <span class="signal-chip" *ngIf="entry.links.linkedCharacters.length > 0">
              {{ entry.links.linkedCharacters.length }} personagens
            </span>
            <span class="signal-chip" *ngIf="entry.links.referencedInWiki.length > 0">
              {{ entry.links.referencedInWiki.length }} paginas wiki
            </span>
          </div>

          <div class="loot-items">
            <span class="loot-item" *ngFor="let tag of entry.tags">{{ tag }}</span>
          </div>

          <div class="abilities" *ngIf="entry.links.linkedCharacters.length > 0">
            <strong>Relacionado a personagens:</strong>
            <ul>
              <li *ngFor="let link of entry.links.linkedCharacters">{{ link.characterName }}</li>
            </ul>
          </div>

          <div class="abilities" *ngIf="entry.links.usedInSessions.length > 0">
            <strong>Usado em sessoes:</strong>
            <ul>
              <li *ngFor="let sessionId of entry.links.usedInSessions">{{ sessionId }}</li>
            </ul>
          </div>

          <div class="abilities" *ngIf="entry.links.referencedInWiki.length > 0">
            <strong>Referenciado na wiki:</strong>
            <ul>
              <li *ngFor="let wikiRef of entry.links.referencedInWiki">
                {{ wikiRef.title }}
              </li>
            </ul>
          </div>
        </article>
      </div>

      <div class="empty-state" *ngIf="activeKind === 'BESTIARY' && filteredCreatures.length === 0">
        <p>Nenhuma criatura encontrada com os filtros atuais.</p>
      </div>

      <div class="empty-state" *ngIf="activeKind !== 'BESTIARY' && knowledgeEntries.length === 0">
        <p>Nenhuma entrada encontrada para os filtros atuais.</p>
      </div>
    </section>

    <ng-template #loadingState>
      <div class="loading"><div class="spinner"></div></div>
    </ng-template>
  `,
  styles: [
    `
      .shell { width: min(1200px, calc(100% - 2rem)); margin: 0 auto; padding: 1.5rem 0 3rem; }
      .header { padding: 1.2rem; margin-bottom: 1rem; }
      .header h1 { margin: 0.5rem 0; }
      .header-copy { margin: 0 0 0.75rem; color: var(--text-secondary); max-width: 48rem; }
      .back { color: var(--text-secondary); text-decoration: none; }
      .filters { padding: 1rem; margin-bottom: 0.75rem; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
      .results-summary { margin: 0 0 1rem; color: var(--text-secondary); font-size: 0.85rem; }
      .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; padding: 0.75rem; flex-wrap: wrap; }
      .tab { border: 1px solid var(--border-color); background: rgba(255,255,255,0.03); color: var(--text-secondary); padding: 0.45rem 0.7rem; border-radius: 999px; cursor: pointer; }
      .tab.active { border-color: rgba(201,168,76,0.6); color: var(--text-primary); }
      .search { flex: 1; min-width: 200px; }
      .xp-range { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }
      .xp-range label { font-size: 0.85rem; color: var(--text-secondary); }
      .xp-range input[type="range"] { width: 100px; }
      .add-panel { padding: 1rem; margin-bottom: 1rem; }
      .add-panel h3 { margin: 0 0 0.75rem; }
      .form-row { display: flex; gap: 0.6rem; flex-wrap: wrap; align-items: center; }
      .form-row .sm { width: 60px; }
      .creatures-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
      .creature-card { padding: 1rem; cursor: pointer; transition: border-color 0.2s, transform 0.2s ease, box-shadow 0.2s ease; }
      .creature-card:hover { border-color: rgba(201, 168, 76, 0.5); transform: translateY(-2px); box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24); }
      .creature-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
      .creature-header h3 { margin: 0; font-size: 1.1rem; }
      .xp-badge { padding: 0.2rem 0.5rem; border-radius: 999px; background: rgba(201, 168, 76, 0.2); font-size: 0.8rem; color: var(--color-primary); }
      .creature-type { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
      .description { font-size: 0.9rem; color: var(--text-secondary); margin: 0.5rem 0; }
      .signal-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0.75rem 0; }
      .signal-chip { padding: 0.25rem 0.6rem; border-radius: 999px; background: rgba(201, 168, 76, 0.12); border: 1px solid rgba(201, 168, 76, 0.28); color: var(--color-primary); font-size: 0.78rem; }
      .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.3rem; margin: 0.75rem 0; }
      .stat { text-align: center; padding: 0.3rem; background: rgba(255, 255, 255, 0.03); border-radius: 0.5rem; }
      .stat-label { display: block; font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; }
      .stat strong { font-size: 0.9rem; }
      .abilities { margin: 0.75rem 0; }
      .abilities ul { margin: 0.3rem 0 0; padding-left: 1.2rem; font-size: 0.85rem; color: var(--text-secondary); }
      .abilities li { margin: 0.2rem 0; }
      .loot { margin: 0.75rem 0; }
      .loot-items { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.3rem; }
      .loot-item { padding: 0.2rem 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 999px; font-size: 0.8rem; color: var(--text-secondary); }
      .add-btn { margin-top: 0.75rem; width: 100%; }
      .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
      @media (max-width: 600px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
    `,
  ],
})
export class CampaignCompendiumComponent implements OnInit {
  campaignId = '';
  campaign: CampaignView | null = null;
  creatures: CreatureView[] = [];
  filteredCreatures: CreatureView[] = [];
  sessions: SessionView[] = [];
  encounters: EncounterView[] = [];

  searchTerm = '';
  typeFilter = '';
  xpMin = 0;
  xpMax = 10000;
  creatureTypes = CREATURE_TYPES;

  selectedCreature: CreatureView | null = null;
  selectedSessionId = '';
  selectedEncounterId = '';
  addCount = 1;
  adding = false;
  activeKind: CompendiumKind = 'BESTIARY';
  compendiumTabs = COMPENDIUM_TABS;
  knowledgeEntries: CompendiumEntry[] = [];
  kindTotals: Record<CompendiumKind, number> = {
    BESTIARY: 0,
    SPELL: 0,
    ITEM: 0,
    CLASS: 0,
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly campaignService: CampaignService,
    private readonly compendiumService: CompendiumService,
    private readonly creatureService: CreatureService,
    private readonly sessionService: SessionService,
    private readonly combatService: CombatService
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.campaignId) return;

    this.campaignService.getCampaignById(this.campaignId).subscribe({
      next: (res) => {
        this.campaign = res.data as CampaignView;
        this.loadCreatures();
        this.loadCompendiumTotals();
        this.loadKnowledgeEntries();
        this.loadSessions();
      },
    });
  }

  setActiveKind(kind: CompendiumKind): void {
    if (this.activeKind === kind) {
      return;
    }

    this.activeKind = kind;
    this.selectedCreature = null;

    if (kind === 'BESTIARY') {
      this.filterCreatures();
      return;
    }

    this.loadKnowledgeEntries();
  }

  loadCreatures(): void {
    if (!this.campaign?.systemTemplate?.id) return;
    this.creatureService.list({ systemId: this.campaign.systemTemplate.id }).subscribe({
      next: (res) => {
        this.creatures = (res.data || []) as CreatureView[];
        this.filterCreatures();
      },
    });
  }

  loadSessions(): void {
    this.sessionService.getSessionsByCampaign(this.campaignId).subscribe({
      next: (res) => {
        this.sessions = (res.data || []) as SessionView[];
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
      },
    });
  }

  filterCreatures(): void {
    if (this.activeKind !== 'BESTIARY') {
      this.loadKnowledgeEntries();
      return;
    }

    const term = this.searchTerm.trim().toLowerCase();
    this.filteredCreatures = this.creatures.filter((c) => {
      const matchesTerm =
        !term ||
        c.name.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term));
      const matchesType = !this.typeFilter || c.creatureType === this.typeFilter;
      const xp = c.xpReward || 0;
      const matchesXp = xp >= this.xpMin && xp <= this.xpMax;
      return matchesTerm && matchesType && matchesXp;
    });
  }

  selectCreature(creature: CreatureView): void {
    this.selectedCreature = creature;
    this.addCount = 1;
  }

  getStats(creature: CreatureView): Array<{ key: string; value: string | number }> {
    if (!creature.stats) return [];
    const attrs = creature.stats['attributes'] as Record<string, unknown> | undefined;
    if (attrs && typeof attrs === 'object') {
      return Object.entries(attrs)
        .slice(0, 6)
        .map(([key, value]) => ({ key, value: String(value) }));
    }
    return Object.entries(creature.stats)
      .filter(([k]) => !['abilities', 'loot'].includes(k))
      .slice(0, 6)
      .map(([key, value]) => ({ key, value: String(value) }));
  }

  addToEncounter(): void {
    if (!this.selectedCreature || !this.selectedEncounterId) return;
    this.adding = true;

    const hp = this.extractHp(this.selectedCreature);
    const init = this.extractInit(this.selectedCreature);

    const requests = Array.from({ length: this.addCount }, (_, i) => {
      const name = this.addCount > 1 ? `${this.selectedCreature!.name} ${i + 1}` : this.selectedCreature!.name;
      return this.combatService.addCombatant(this.selectedEncounterId, {
        name,
        initiative: init,
        hp,
        maxHp: hp,
        isNpc: true,
      });
    });

    let completed = 0;
    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed === requests.length) {
            this.adding = false;
            this.selectedCreature = null;
          }
        },
        error: () => {
          this.adding = false;
        },
      });
    });
  }

  private extractHp(creature: CreatureView): number {
    const stats = creature.stats;
    if (!stats) return 10;
    if (typeof stats['hp'] === 'number') return stats['hp'];
    return 10;
  }

  private extractInit(creature: CreatureView): number {
    const stats = creature.stats;
    if (!stats) return 10;
    const attrs = stats['attributes'] as Record<string, unknown> | undefined;
    if (attrs && typeof attrs['DEX'] === 'number') {
      return Math.floor((Number(attrs['DEX']) - 10) / 2) + 10;
    }
    return 10;
  }

  private loadKnowledgeEntries(): void {
    if (!this.campaignId || this.activeKind === 'BESTIARY') {
      return;
    }

    this.compendiumService
      .getCampaignCompendium({
        campaignId: this.campaignId,
        kind: this.activeKind,
        search: this.searchTerm || undefined,
        limit: 120,
      })
      .subscribe({
        next: (res) => {
          this.knowledgeEntries = sortKnowledgeEntriesByPresence(res.data.entries || []);
          this.kindTotals = res.data.totals;
        },
      });
  }

  private loadCompendiumTotals(): void {
    if (!this.campaignId) {
      return;
    }

    this.compendiumService
      .getCampaignCompendium({
        campaignId: this.campaignId,
        kind: 'BESTIARY',
        limit: 1,
      })
      .subscribe({
        next: (res) => {
          this.kindTotals = res.data.totals;
        },
      });
  }

  getKnowledgePresenceScore(entry: CompendiumEntry): number {
    return getKnowledgePresenceScore(entry);
  }

  getActiveResultCount(): number {
    return this.activeKind === 'BESTIARY'
      ? this.filteredCreatures.length
      : this.knowledgeEntries.length;
  }
}
