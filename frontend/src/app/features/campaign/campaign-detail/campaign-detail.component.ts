import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CampaignService } from '../../../core/services/campaign.service';
import { CharacterService } from '../../../core/services/character.service';
import { DiceRollService } from '../../../core/services/dice-roll.service';
import { SessionService } from '../../../core/services/session.service';
import { SocketService } from '../../../core/services/socket.service';
import { WikiService } from '../../../core/services/wiki.service';
import { CharacterSheetComponent } from '../character-sheet/character-sheet.component';
import { MarkdownViewerComponent } from '../../../shared/components/markdown-viewer.component';
import { DiceResultComponent } from '../../../shared/components/dice-result.component';
import { SystemBadgeComponent } from '../../../shared/components/system-badge.component';

type CampaignView = {
  id: string;
  name: string;
  description?: string;
  system: string;
  ownerId: string;
  createdAt: string;
  owner: { id: string; name: string };
  members: Array<{ role: 'GM' | 'PLAYER'; user: { id: string; name: string } }>;
  systemTemplate?: { id: string; name: string; slug: string } | null;
};

type CharacterView = {
  id: string;
  name: string;
  class: string;
  level: number;
  player?: { id: string; name: string };
  attributes?: Record<string, unknown> | null;
  resources?: Record<string, unknown> | null;
};

type SessionView = {
  id: string;
  date: string;
  summary?: string | null;
  narrativeLog?: string | null;
  highlights?: string[];
};

type WikiPageView = {
  id: string;
  title: string;
  category: string;
  content: string;
  isPublic: boolean;
};

type DiceRollView = {
  id: string;
  formula: string;
  result: number;
  label?: string | null;
  createdAt?: string;
  breakdown?: { rolls?: number[] } | null;
};

type PresenceEvent = {
  campaignId: string;
  onlineUserIds: string[];
};

type SessionCreatedEvent = {
  session: SessionView;
};

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SystemBadgeComponent,
    CharacterSheetComponent,
    MarkdownViewerComponent,
    DiceResultComponent,
  ],
  template: `
    <section class="campaign-shell" *ngIf="campaign; else loadingState">
      <header class="hero card">
        <div class="hero-copy">
          <a routerLink="/campaigns" class="back-link">Voltar para campanhas</a>
          <app-system-badge [system]="systemSlug"></app-system-badge>
          <h1>{{ campaign.name }}</h1>
          <p>{{ campaign.description || 'Campanha ativa com recursos realtime, wiki e ferramentas de mesa.' }}</p>
          <div class="hero-meta">
            <span>GM: {{ campaign.owner.name }}</span>
            <span>{{ playerCount }} jogadores</span>
            <span>{{ onlineCount }} online</span>
          </div>
        </div>

        <div class="hero-actions">
          <a class="btn btn-primary" [routerLink]="['/campaigns', campaign.id, 'tools']">Ferramentas da Mesa</a>
           <a class="btn btn-outline" [routerLink]="['/campaigns', campaign.id, 'vtt']">Mesa VTT</a>
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaign.id, 'combat']">Combate</a>
           <a class="btn btn-outline" [routerLink]="['/campaigns', campaign.id, 'compendium']">Compendium</a>
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaign.id, 'schedule']">Agenda</a>
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaign.id, 'wiki']">Wiki</a>
        </div>
      </header>

      <nav class="tab-bar">
        <button class="tab" *ngFor="let tab of tabs" [class.active]="activeTab === tab.id" (click)="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </nav>

      <section *ngIf="activeTab === 'overview'" class="grid-overview">
        <article class="card overview-panel">
          <div class="panel-head">
            <h2>Proxima Sessao</h2>
          </div>
          <ng-container *ngIf="nextSession; else noSession">
            <strong>{{ nextSession.date | date:'dd/MM/yyyy' }}</strong>
            <p>{{ nextSession.summary || 'Sem resumo definido.' }}</p>
            <div class="highlights" *ngIf="nextSession.highlights?.length">
              <span *ngFor="let highlight of nextSession.highlights">{{ highlight }}</span>
            </div>
          </ng-container>
        </article>

        <article class="card overview-panel">
          <div class="panel-head">
            <h2>Ultima Narrativa</h2>
          </div>
          <app-markdown-viewer [content]="lastNarrative"></app-markdown-viewer>
        </article>

        <article class="card overview-panel">
          <div class="panel-head">
            <h2>Feed ao Vivo</h2>
          </div>
          <div class="roll-feed">
            <app-dice-result *ngFor="let roll of liveRolls" [roll]="roll"></app-dice-result>
          </div>
        </article>
      </section>

      <section *ngIf="activeTab === 'party'" class="party-grid">
        <article class="card party-card" *ngFor="let character of characters">
          <div class="party-head">
            <div>
              <h3>{{ character.name }}</h3>
              <small>{{ character.class }} · {{ character.player?.name || 'Sem jogador' }}</small>
            </div>
            <span class="level-pill">Nivel {{ character.level }}</span>
          </div>
          <app-character-sheet [character]="character" [system]="campaign.systemTemplate || null"></app-character-sheet>
        </article>
      </section>

      <section *ngIf="activeTab === 'sessions'" class="list-grid">
        <article class="card list-card" *ngFor="let session of sessions">
          <div class="list-head">
            <div>
              <h3>{{ session.date | date:'dd/MM/yyyy' }}</h3>
              <small>{{ session.summary || 'Sem resumo.' }}</small>
            </div>
            <a class="btn btn-outline btn-sm" [routerLink]="['/campaigns', campaign.id, 'tools']">Editar</a>
          </div>
          <app-markdown-viewer [content]="session.narrativeLog || ''"></app-markdown-viewer>
        </article>
      </section>

      <section *ngIf="activeTab === 'dice'" class="list-grid">
        <article class="card list-card">
          <div class="list-head">
            <div>
              <h3>Historico de Rolagens</h3>
              <small>Feed persistido e sincronizado em tempo real.</small>
            </div>
            <a class="btn btn-primary btn-sm" routerLink="/dice">Abrir Mesa de Dados</a>
          </div>
          <div class="roll-feed">
            <app-dice-result *ngFor="let roll of liveRolls" [roll]="roll"></app-dice-result>
          </div>
        </article>
      </section>

      <section *ngIf="activeTab === 'wiki'" class="list-grid">
        <article class="card list-card" *ngFor="let page of wikiPages">
          <div class="list-head">
            <div>
              <h3>{{ page.title }}</h3>
              <small>{{ page.category }} <span *ngIf="!page.isPublic">· GM</span></small>
            </div>
          </div>
          <app-markdown-viewer [content]="page.content"></app-markdown-viewer>
        </article>
      </section>
    </section>

    <ng-template #loadingState>
      <div class="loading">
        <div class="spinner"></div>
      </div>
    </ng-template>

    <ng-template #noSession>
      <p>Nenhuma sessao futura registrada.</p>
    </ng-template>
  `,
  styles: [
    `
      .campaign-shell {
        width: min(1280px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 1.6rem 0 3rem;
      }
      .hero {
        display: grid;
        grid-template-columns: 1.8fr 1fr;
        gap: 1.4rem;
        padding: 1.6rem;
        position: relative;
        overflow: hidden;
      }
      .hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at top right, rgba(201, 168, 76, 0.15), transparent 30%),
          radial-gradient(circle at bottom left, rgba(47, 83, 104, 0.18), transparent 35%);
        pointer-events: none;
      }
      .hero-copy,
      .hero-actions {
        position: relative;
        z-index: 1;
      }
      .back-link {
        display: inline-block;
        margin-bottom: 0.6rem;
        color: var(--text-secondary);
        text-decoration: none;
      }
      .hero h1 {
        margin: 0.8rem 0 0.5rem;
        font-size: clamp(2rem, 4vw, 3.4rem);
      }
      .hero p {
        margin: 0;
        max-width: 60ch;
        color: var(--text-secondary);
        font-size: 1.05rem;
      }
      .hero-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1rem;
        margin-top: 1rem;
        color: var(--text-secondary);
      }
      .hero-actions {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.75rem;
      }
      .tab-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 1rem 0 1.2rem;
      }
      .tab {
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        padding: 0.72rem 1rem;
        border-radius: 999px;
        cursor: pointer;
      }
      .tab.active {
        color: var(--text-primary);
        border-color: rgba(201, 168, 76, 0.45);
        box-shadow: var(--shadow-arcane);
      }
      .grid-overview {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }
      .overview-panel,
      .list-card,
      .party-card {
        padding: 1.1rem;
      }
      .panel-head,
      .list-head,
      .party-head {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 0.9rem;
      }
      .panel-head h2,
      .list-head h3,
      .party-head h3 {
        margin: 0;
      }
      .party-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1rem;
      }
      .level-pill,
      .highlights span {
        display: inline-flex;
        align-items: center;
        padding: 0.3rem 0.65rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
        font-size: 0.76rem;
      }
      .highlights {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-top: 0.7rem;
      }
      .list-grid {
        display: grid;
        gap: 1rem;
      }
      .roll-feed {
        display: grid;
        gap: 0.75rem;
      }
      @media (max-width: 980px) {
        .hero,
        .grid-overview {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignDetailComponent implements OnInit, OnDestroy {
  campaignId = '';
  campaign: CampaignView | null = null;
  characters: CharacterView[] = [];
  sessions: SessionView[] = [];
  wikiPages: WikiPageView[] = [];
  liveRolls: DiceRollView[] = [];
  onlineUserIds = new Set<string>();
  activeTab: 'overview' | 'party' | 'sessions' | 'dice' | 'wiki' = 'overview';
  readonly tabs = [
    { id: 'overview', label: 'Visao Geral' },
    { id: 'party', label: 'Party' },
    { id: 'sessions', label: 'Sessao' },
    { id: 'dice', label: 'Dados' },
    { id: 'wiki', label: 'Wiki' },
  ] as const;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly campaignService: CampaignService,
    private readonly characterService: CharacterService,
    private readonly sessionService: SessionService,
    private readonly wikiService: WikiService,
    private readonly diceRollService: DiceRollService,
    private readonly socketService: SocketService
  ) {}

  get systemSlug(): string {
    return this.campaign?.systemTemplate?.slug || this.campaign?.system || 'rpg';
  }

  get playerCount(): number {
    return (this.campaign?.members?.length || 0) + 1;
  }

  get onlineCount(): number {
    return this.onlineUserIds.size;
  }

  get nextSession(): SessionView | null {
    const now = Date.now();
    return (
      [...this.sessions]
        .filter((session) => new Date(session.date).getTime() >= now)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null
    );
  }

  get lastNarrative(): string {
    const latest = [...this.sessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .find((session) => (session.narrativeLog || '').trim().length > 0);

    return latest?.narrativeLog || 'Nenhum log narrativo publicado ainda.';
  }

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.campaignId) {
      return;
    }

    forkJoin({
      campaign: this.campaignService.getCampaignById(this.campaignId),
      characters: this.characterService.getCharactersByCampaign(this.campaignId),
      sessions: this.sessionService.getSessionsByCampaign(this.campaignId),
      wikiPages: this.wikiService.getCampaignPages(this.campaignId),
      rolls: this.diceRollService.getCampaignRolls(this.campaignId, { limit: 8 }),
    }).subscribe({
      next: ({ campaign, characters, sessions, wikiPages, rolls }) => {
        this.campaign = campaign.data as CampaignView;
        this.characters = (characters.data || []) as CharacterView[];
        this.sessions = (sessions.data || []) as SessionView[];
        this.wikiPages = ((wikiPages.data || []) as WikiPageView[]).slice(0, 4);
        this.liveRolls = ((rolls.data || []) as DiceRollView[]).slice(0, 8);
        this.bindRealtime();
      },
    });
  }

  ngOnDestroy(): void {
    if (this.campaignId) {
      this.socketService.leaveCampaign(this.campaignId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private bindRealtime(): void {
    this.socketService.connect();
    this.socketService.joinCampaign(this.campaignId);

    this.socketService
      .on<PresenceEvent>('presence:update')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.campaignId !== this.campaignId) {
          return;
        }

        this.onlineUserIds = new Set(event.onlineUserIds);
      });

    this.socketService
      .on<DiceRollView>('dice:rolled')
      .pipe(takeUntil(this.destroy$))
      .subscribe((roll) => {
        this.liveRolls = [roll, ...this.liveRolls].slice(0, 8);
      });

    this.socketService
      .on<SessionCreatedEvent>('session:created')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.sessions = [event.session, ...this.sessions].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
  }
}
