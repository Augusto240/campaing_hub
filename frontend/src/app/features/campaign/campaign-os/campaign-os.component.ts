import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RpgOsService } from '../../../core/services/rpg-os.service';
import { SocketService } from '../../../core/services/socket.service';
import { WikiService } from '../../../core/services/wiki.service';
import { CoreCampaignSnapshot } from '../../../core/types';

type OsPulseKind = 'wiki' | 'compendium' | 'vtt' | 'system';

type OsPulse = {
  id: string;
  kind: OsPulseKind;
  label: string;
  at: string;
};

type CorePageCreatedEvent = {
  pageId: string;
  title: string;
};

type CoreCompendiumCreatedEvent = {
  entryId: string;
  name: string;
  kind: 'CREATURE' | 'SPELL' | 'ITEM';
};

type CoreVttUpdatedEvent = {
  campaignId: string;
};

@Component({
  selector: 'app-campaign-os',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="os-shell" *ngIf="campaignId">
      <header class="os-hero card">
        <div class="hero-copy">
          <a class="back-link" [routerLink]="['/campaigns', campaignId]">Voltar para campanha</a>
          <p class="eyebrow">Campaign Hub RPG OS</p>
          <h1>Nucleo Vivo da Campanha</h1>
          <p class="hero-sub">
            Wiki, compendio, VTT e grafo em uma visao unica. Menos menu, mais memoria viva.
          </p>

          <div class="founders-row" *ngIf="snapshot as data">
            <span class="founder" [class.online]="data.founders.augustusFrostborne">
              Augustus Frostborne {{ data.founders.augustusFrostborne ? 'ativo' : 'ausente' }}
            </span>
            <span class="founder" [class.online]="data.founders.satoruNaitokira">
              Satoru Naitokira {{ data.founders.satoruNaitokira ? 'ativo' : 'ausente' }}
            </span>
          </div>
        </div>

        <div class="hero-actions">
          <button class="btn btn-primary" (click)="refreshSnapshot()" [disabled]="loading || syncing">
            {{ syncing ? 'Sincronizando...' : 'Sincronizar Agora' }}
          </button>
          <button class="btn btn-outline" (click)="bootstrapLegacy()" [disabled]="legacyImporting">
            {{ legacyImporting ? 'Importando legado...' : 'Importar Legado 2023' }}
          </button>
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaignId, 'wiki']">Wiki</a>
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaignId, 'compendium']">Compendio</a>
          <a class="btn btn-outline" [routerLink]="['/campaigns', campaignId, 'tabletop']">VTT</a>
        </div>
      </header>

      <ng-container *ngIf="snapshot as data; else loadingState">
        <section class="stats-grid">
          <article class="card stat-card">
            <p class="label">Paginas Wiki</p>
            <strong>{{ data.wiki.totalPages }}</strong>
            <small>Memoria textual da campanha</small>
          </article>

          <article class="card stat-card">
            <p class="label">Nos do Grafo</p>
            <strong>{{ data.graph.stats.nodes }}</strong>
            <small>{{ data.graph.stats.edges }} conexoes ativas</small>
          </article>

          <article class="card stat-card">
            <p class="label">Compendio Vivo</p>
            <strong>{{ data.compendium.creatures.length + data.compendium.spells.length + data.compendium.items.length }}</strong>
            <small>Entradas conectadas ao mundo</small>
          </article>

          <article class="card stat-card">
            <p class="label">Mesa Persistida</p>
            <strong>{{ data.vtt.state.tokens.length }} tokens</strong>
            <small>{{ data.vtt.state.lights.length }} luzes · {{ data.vtt.state.fog.maskedCells.length }} celulas com fog</small>
          </article>
        </section>

        <section class="memory-grid">
          <article class="card panel">
            <div class="panel-head">
              <h2>Memoria Narrativa</h2>
              <small>ultimas paginas</small>
            </div>

            <ul class="memory-list">
              <li *ngFor="let page of data.wiki.pages.slice(0, 8)">
                <div>
                  <strong>{{ page.title }}</strong>
                  <small>{{ page.category }} · {{ page.updatedAt | date:'dd/MM HH:mm' }}</small>
                </div>
                <span class="tag" *ngFor="let tag of page.tags.slice(0, 2)">{{ tag }}</span>
              </li>
            </ul>
          </article>

          <article class="card panel">
            <div class="panel-head">
              <h2>Compendio Conectado</h2>
              <small>criaturas, magias e itens</small>
            </div>

            <div class="compendium-slices">
              <section>
                <h3>Criaturas</h3>
                <ul>
                  <li *ngFor="let creature of data.compendium.creatures.slice(0, 4)">
                    <strong>{{ creature.name }}</strong>
                    <small>{{ creature.source }} · {{ creature.origin }}</small>
                  </li>
                </ul>
              </section>

              <section>
                <h3>Magias</h3>
                <ul>
                  <li *ngFor="let spell of data.compendium.spells.slice(0, 4)">
                    <strong>{{ spell.name }}</strong>
                    <small>{{ spell.source }} · {{ spell.origin }}</small>
                  </li>
                </ul>
              </section>

              <section>
                <h3>Itens</h3>
                <ul>
                  <li *ngFor="let item of data.compendium.items.slice(0, 4)">
                    <strong>{{ item.name }}</strong>
                    <small>{{ item.source }} · {{ item.origin }}</small>
                  </li>
                </ul>
              </section>
            </div>
          </article>

          <article class="card panel">
            <div class="panel-head">
              <h2>Mesa Virtual Persistida</h2>
              <small>estado da mesa no banco</small>
            </div>

            <div class="vtt-line"><span>Grid:</span><strong>{{ data.vtt.state.gridSize }} px</strong></div>
            <div class="vtt-line"><span>Mapa:</span><strong>{{ data.vtt.state.mapImageUrl ? 'definido' : 'nao definido' }}</strong></div>
            <div class="vtt-line"><span>Tokens:</span><strong>{{ data.vtt.state.tokens.length }}</strong></div>
            <div class="vtt-line"><span>Fog cells:</span><strong>{{ data.vtt.state.fog.maskedCells.length }}</strong></div>
            <div class="vtt-line"><span>Luzes:</span><strong>{{ data.vtt.state.lights.length }}</strong></div>
            <div class="vtt-line"><span>Atualizado:</span><strong>{{ data.vtt.state.updatedAt | date:'dd/MM HH:mm:ss' }}</strong></div>

            <div class="token-chip-row">
              <span class="token-chip" *ngFor="let token of data.vtt.state.tokens.slice(0, 10)">{{ token.label }}</span>
            </div>
          </article>

          <article class="card panel">
            <div class="panel-head">
              <h2>Pulso Realtime</h2>
              <small>eventos da campanha</small>
            </div>

            <ul class="pulse-list" *ngIf="pulses.length > 0; else emptyPulse">
              <li *ngFor="let pulse of pulses">
                <span class="pulse-kind" [attr.data-kind]="pulse.kind">{{ pulse.kind }}</span>
                <div>
                  <strong>{{ pulse.label }}</strong>
                  <small>{{ pulse.at | date:'HH:mm:ss' }}</small>
                </div>
              </li>
            </ul>
            <ng-template #emptyPulse>
              <p class="muted">Sem eventos capturados ainda. Abra wiki, compendio ou VTT para ver pulsos ao vivo.</p>
            </ng-template>
          </article>
        </section>
      </ng-container>
    </section>

    <ng-template #loadingState>
      <div class="loading"><div class="spinner"></div></div>
    </ng-template>
  `,
  styles: [
    `
      .os-shell {
        width: min(1300px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 1.4rem 0 3rem;
      }
      .os-hero {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 1rem;
        padding: 1.3rem;
        margin-bottom: 1rem;
        position: relative;
        overflow: hidden;
      }
      .os-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(circle at 84% 16%, rgba(201, 168, 76, 0.24), transparent 34%),
          radial-gradient(circle at 12% 88%, rgba(47, 83, 104, 0.22), transparent 30%);
        pointer-events: none;
      }
      .hero-copy,
      .hero-actions {
        position: relative;
        z-index: 1;
      }
      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
      }
      .eyebrow {
        margin: 0.6rem 0 0;
        color: var(--color-primary-light);
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-size: 0.74rem;
      }
      h1 {
        margin: 0.35rem 0;
        font-size: clamp(1.7rem, 4vw, 2.8rem);
      }
      .hero-sub {
        margin: 0;
        color: var(--text-secondary);
        max-width: 56ch;
      }
      .hero-actions {
        display: grid;
        align-content: center;
        gap: 0.55rem;
      }
      .founders-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin-top: 0.9rem;
      }
      .founder {
        display: inline-flex;
        align-items: center;
        padding: 0.32rem 0.7rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: var(--text-muted);
        font-size: 0.75rem;
      }
      .founder.online {
        border-color: rgba(201, 168, 76, 0.45);
        color: var(--text-primary);
        box-shadow: var(--shadow-arcane);
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.8rem;
        margin-bottom: 0.9rem;
      }
      .stat-card {
        padding: 0.9rem;
      }
      .stat-card .label {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }
      .stat-card strong {
        display: block;
        margin: 0.35rem 0;
        font-size: 1.6rem;
      }
      .stat-card small {
        color: var(--text-muted);
      }
      .memory-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.85rem;
      }
      .panel {
        padding: 1rem;
      }
      .panel-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 1.05rem;
      }
      .panel-head small {
        color: var(--text-muted);
      }
      .memory-list,
      .pulse-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.55rem;
      }
      .memory-list li,
      .pulse-list li {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        justify-content: space-between;
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 0.75rem;
        padding: 0.55rem 0.65rem;
        background: rgba(255, 255, 255, 0.02);
      }
      .memory-list strong,
      .pulse-list strong {
        display: block;
        font-size: 0.92rem;
      }
      .memory-list small,
      .pulse-list small {
        color: var(--text-muted);
      }
      .tag {
        font-size: 0.7rem;
        padding: 0.2rem 0.45rem;
        border-radius: 999px;
        background: rgba(201, 168, 76, 0.15);
        color: var(--color-primary-light);
      }
      .compendium-slices {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.7rem;
      }
      .compendium-slices h3 {
        margin: 0 0 0.4rem;
        font-size: 0.92rem;
      }
      .compendium-slices ul {
        margin: 0;
        padding-left: 1rem;
        display: grid;
        gap: 0.35rem;
      }
      .compendium-slices li {
        color: var(--text-secondary);
      }
      .compendium-slices strong {
        color: var(--text-primary);
      }
      .compendium-slices small {
        display: block;
        color: var(--text-muted);
      }
      .vtt-line {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.3rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }
      .vtt-line span {
        color: var(--text-secondary);
      }
      .token-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.8rem;
      }
      .token-chip {
        font-size: 0.72rem;
        padding: 0.2rem 0.48rem;
        border-radius: 999px;
        background: rgba(47, 83, 104, 0.28);
        color: #d4e8f5;
      }
      .pulse-kind {
        min-width: 5.6rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.66rem;
        padding: 0.18rem 0.35rem;
        border-radius: 999px;
      }
      .pulse-kind[data-kind='wiki'] {
        background: rgba(201, 168, 76, 0.16);
        color: var(--color-primary-light);
      }
      .pulse-kind[data-kind='compendium'] {
        background: rgba(127, 95, 191, 0.18);
        color: #d5c6ff;
      }
      .pulse-kind[data-kind='vtt'] {
        background: rgba(47, 83, 104, 0.24);
        color: #cae8ff;
      }
      .pulse-kind[data-kind='system'] {
        background: rgba(63, 132, 96, 0.24);
        color: #c7f1d8;
      }
      .muted {
        color: var(--text-muted);
        margin: 0;
      }
      @media (max-width: 1080px) {
        .os-hero,
        .stats-grid,
        .memory-grid,
        .compendium-slices {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignOsComponent implements OnInit, OnDestroy {
  campaignId = '';
  snapshot: CoreCampaignSnapshot | null = null;
  loading = true;
  syncing = false;
  legacyImporting = false;
  pulses: OsPulse[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly rpgOsService: RpgOsService,
    private readonly wikiService: WikiService,
    private readonly socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.campaignId) {
      this.loading = false;
      return;
    }

    this.refreshSnapshot();
    this.bindRealtime();
  }

  ngOnDestroy(): void {
    if (this.campaignId) {
      this.socketService.leaveCampaign(this.campaignId);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshSnapshot(): void {
    if (!this.campaignId) {
      return;
    }

    this.syncing = true;

    this.rpgOsService
      .getCampaignSnapshot(this.campaignId, 180)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.snapshot = res.data;
          this.loading = false;
          this.syncing = false;
        },
        error: () => {
          this.loading = false;
          this.syncing = false;
        },
      });
  }

  bootstrapLegacy(): void {
    if (!this.campaignId) {
      return;
    }

    this.legacyImporting = true;

    this.wikiService
      .bootstrapLegacy(this.campaignId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.pushPulse('system', 'Legado 2023 importado para a campanha');
          this.legacyImporting = false;
          this.refreshSnapshot();
        },
        error: () => {
          this.legacyImporting = false;
        },
      });
  }

  private bindRealtime(): void {
    this.socketService.connect();
    this.socketService.joinCampaign(this.campaignId);

    this.socketService
      .on<CorePageCreatedEvent>('core:page_created')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.pushPulse('wiki', `Nova pagina: ${event.title}`);
        this.refreshSnapshot();
      });

    this.socketService
      .on<CoreCompendiumCreatedEvent>('core:compendium_created')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.pushPulse('compendium', `Novo ${event.kind.toLowerCase()}: ${event.name}`);
        this.refreshSnapshot();
      });

    this.socketService
      .on<CoreVttUpdatedEvent>('vtt:state_updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.campaignId !== this.campaignId) {
          return;
        }

        this.pushPulse('vtt', 'Estado da mesa atualizado');
        this.refreshSnapshot();
      });
  }

  private pushPulse(kind: OsPulseKind, label: string): void {
    this.pulses = [
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        kind,
        label,
        at: new Date().toISOString(),
      },
      ...this.pulses,
    ].slice(0, 14);
  }
}
