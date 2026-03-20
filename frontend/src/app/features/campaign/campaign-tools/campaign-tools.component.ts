import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { CampaignService } from '../../../core/services/campaign.service';
import { CharacterService } from '../../../core/services/character.service';
import { SessionService } from '../../../core/services/session.service';

type JsonPrimitive = string | number | boolean | null;
type ResourceMap = Record<string, JsonPrimitive>;

type CampaignMember = {
  role: 'GM' | 'PLAYER';
  user: {
    id: string;
    name: string;
  };
};

type CampaignView = {
  id: string;
  name: string;
  system: string;
  ownerId: string;
  systemTemplate?: {
    id: string;
    name: string;
    hasSanity: boolean;
    hasMana: boolean;
  } | null;
  members: CampaignMember[];
};

type CharacterView = {
  id: string;
  name: string;
  class: string;
  resources: ResourceMap | null;
};

type SessionView = {
  id: string;
  date: string;
  summary?: string | null;
  narrativeLog?: string | null;
  privateGmNotes?: string | null;
  highlights?: string[];
};

type ResourcePatchEvent = {
  characterId: string;
  resources: Record<string, string | number | boolean>;
};

@Component({
  selector: 'app-campaign-tools',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container tools-page" *ngIf="campaign">
      <div class="tools-header">
        <a class="back-link" [routerLink]="['/campaigns', campaign.id]">Voltar para campanha</a>
        <h1>Ferramentas da Campanha</h1>
        <p class="subtitle">{{ campaign.name }} � {{ campaign.systemTemplate?.name || campaign.system }}</p>
        <div class="header-links">
          <a class="btn btn-outline btn-sm" [routerLink]="['/campaigns', campaign.id, 'wiki']">Wiki</a>
          <a class="btn btn-outline btn-sm" routerLink="/dice">Rolagens</a>
        </div>
      </div>

      <div class="card section-card" *ngIf="sessions.length > 0">
        <div class="section-head">
          <h2>Log Narrativo de Sess�es</h2>
        </div>

        <div class="session-selector">
          <label for="session-select">Sess�o</label>
          <select id="session-select" class="form-control" [(ngModel)]="selectedSessionId" (change)="syncLogEditor()">
            <option *ngFor="let session of sessions" [value]="session.id">
              {{ session.date | date:'dd/MM/yyyy' }} - {{ session.summary || 'Sem resumo' }}
            </option>
          </select>
        </div>

        <div class="tabs">
          <button class="tab" [class.active]="activeLogTab === 'public'" (click)="activeLogTab = 'public'">
            Narrativa P�blica
          </button>
          <button
            class="tab"
            *ngIf="canEditSessionLog"
            [class.active]="activeLogTab === 'gm'"
            (click)="activeLogTab = 'gm'"
          >
            Notas do GM
          </button>
        </div>

        <div class="log-grid">
          <div>
            <label class="form-label" *ngIf="activeLogTab === 'public'">Narrativa</label>
            <label class="form-label" *ngIf="activeLogTab === 'gm'">Notas Privadas do GM</label>
            <textarea
              class="form-control"
              rows="10"
              *ngIf="activeLogTab === 'public'"
              [(ngModel)]="sessionLogForm.narrativeLog"
              [readonly]="!canEditSessionLog"
            ></textarea>
            <textarea
              class="form-control"
              rows="10"
              *ngIf="activeLogTab === 'gm'"
              [(ngModel)]="sessionLogForm.privateGmNotes"
              [readonly]="!canEditSessionLog"
            ></textarea>

            <label class="form-label">Highlights (separados por v�rgula)</label>
            <input
              class="form-control"
              [(ngModel)]="sessionLogForm.highlightsInput"
              [readonly]="!canEditSessionLog"
            />
          </div>

          <div>
            <div class="form-label">Preview</div>
            <div class="preview-box" [innerHTML]="renderMarkdown(activeLogTab === 'public' ? sessionLogForm.narrativeLog : sessionLogForm.privateGmNotes)"></div>
            <div class="highlight-preview" *ngIf="parsedHighlights.length > 0">
              <h4>Highlights</h4>
              <ul>
                <li *ngFor="let highlight of parsedHighlights">{{ highlight }}</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="actions" *ngIf="canEditSessionLog">
          <button class="btn btn-primary" (click)="saveSessionLog()" [disabled]="savingSessionLog">
            {{ savingSessionLog ? 'Salvando...' : 'Salvar Log' }}
          </button>
        </div>
      </div>

      <div class="card section-card">
        <div class="section-head">
          <h2>Recursos de Personagem</h2>
          <p>Atualiza��o autom�tica com debounce (500ms)</p>
        </div>

        <div class="resource-grid" *ngIf="characters.length > 0">
          <div class="resource-card" *ngFor="let character of characters">
            <div class="resource-title">
              <strong>{{ character.name }}</strong>
              <span>{{ character.class }}</span>
            </div>

            <div class="resource-fields" *ngIf="resourceDrafts[character.id] as draft">
              <label>
                HP
                <input type="number" class="form-control" [ngModel]="draft['hp']" (ngModelChange)="onResourceChange(character.id, 'hp', $event)" />
              </label>
              <label>
                Mana
                <input type="number" class="form-control" [ngModel]="draft['mana']" (ngModelChange)="onResourceChange(character.id, 'mana', $event)" />
              </label>
              <label>
                F�
                <input type="number" class="form-control" [ngModel]="draft['faith']" (ngModelChange)="onResourceChange(character.id, 'faith', $event)" />
              </label>
              <label>
                Sanidade
                <input type="number" class="form-control" [ngModel]="draft['sanity']" (ngModelChange)="onResourceChange(character.id, 'sanity', $event)" />
              </label>
            </div>

            <small class="save-state">{{ resourceSaveState[character.id] || 'Pronto' }}</small>
          </div>
        </div>
      </div>

      <div class="card section-card" *ngIf="campaign.systemTemplate?.hasSanity">
        <div class="section-head">
          <h2>Sanidade (Call of Cthulhu)</h2>
        </div>

        <div class="form-grid">
          <select class="form-control" [(ngModel)]="sanityForm.characterId" (change)="loadSanityEvents()">
            <option value="" disabled>Selecione um personagem</option>
            <option *ngFor="let character of characters" [value]="character.id">{{ character.name }}</option>
          </select>
          <input class="form-control" type="number" [(ngModel)]="sanityForm.roll" placeholder="Rolagem" />
          <input class="form-control" type="number" [(ngModel)]="sanityForm.difficulty" placeholder="Dificuldade" />
          <input class="form-control" [(ngModel)]="sanityForm.trigger" placeholder="Gatilho" />
          <input class="form-control" type="number" [(ngModel)]="sanityForm.successLoss" placeholder="Perda (sucesso)" />
          <input class="form-control" type="number" [(ngModel)]="sanityForm.failedLoss" placeholder="Perda (falha)" />
          <select class="form-control" [(ngModel)]="sanityForm.sessionId">
            <option value="">Sem sess�o</option>
            <option *ngFor="let session of sessions" [value]="session.id">{{ session.date | date:'dd/MM/yyyy' }}</option>
          </select>
        </div>

        <div class="actions">
          <button class="btn btn-primary" (click)="runSanityCheck()" [disabled]="runningSanityCheck || !sanityForm.characterId || !sanityForm.trigger">
            {{ runningSanityCheck ? 'Executando...' : 'Executar Sanity Check' }}
          </button>
        </div>

        <div class="events-list" *ngIf="sanityEvents.length > 0">
          <h4>�ltimos eventos</h4>
          <div class="event-item" *ngFor="let event of sanityEvents">
            <strong>{{ event.trigger }}</strong>
            <span>Perda: {{ event.sanityLost }}</span>
            <span *ngIf="event.tempInsanity">Temp: {{ event.tempInsanity }}</span>
            <span *ngIf="event.permInsanity">Perm: {{ event.permInsanity }}</span>
          </div>
        </div>
      </div>

      <div class="card section-card" *ngIf="campaign.systemTemplate?.hasMana">
        <div class="section-head">
          <h2>Mana e Pontos de F� (Tormenta20)</h2>
        </div>

        <div class="form-grid">
          <select class="form-control" [(ngModel)]="spellForm.characterId" (change)="loadSpellCasts()">
            <option value="" disabled>Selecione um personagem</option>
            <option *ngFor="let character of characters" [value]="character.id">{{ character.name }}</option>
          </select>
          <input class="form-control" [(ngModel)]="spellForm.spellName" placeholder="Nome da magia" />
          <input class="form-control" type="number" [(ngModel)]="spellForm.manaCost" placeholder="Custo de mana" />
          <input class="form-control" type="number" [(ngModel)]="spellForm.faithCost" placeholder="Custo de f�" />
          <input class="form-control" [(ngModel)]="spellForm.result" placeholder="Resultado (opcional)" />
          <select class="form-control" [(ngModel)]="spellForm.sessionId">
            <option value="">Sem sess�o</option>
            <option *ngFor="let session of sessions" [value]="session.id">{{ session.date | date:'dd/MM/yyyy' }}</option>
          </select>
        </div>

        <div class="actions">
          <button class="btn btn-primary" (click)="castSpell()" [disabled]="castingSpell || !spellForm.characterId || !spellForm.spellName">
            {{ castingSpell ? 'Conjurando...' : 'Registrar Conjura��o' }}
          </button>
        </div>

        <div class="events-list" *ngIf="spellCasts.length > 0">
          <h4>�ltimas conjura��es</h4>
          <div class="event-item" *ngFor="let cast of spellCasts">
            <strong>{{ cast.spellName }}</strong>
            <span>Mana: {{ cast.manaCost }}</span>
            <span>F�: {{ cast.faithCost }}</span>
            <span *ngIf="cast.result">{{ cast.result }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="loading">
      <div class="spinner"></div>
    </div>
  `,
  styles: [
    `
      .tools-page {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }
      .tools-header {
        margin-bottom: 1.5rem;
      }
      .subtitle {
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }
      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.85rem;
      }
      .back-link:hover {
        color: var(--accent-primary);
      }
      .header-links {
        margin-top: 0.75rem;
        display: flex;
        gap: 0.5rem;
      }
      .section-card {
        margin-bottom: 1rem;
      }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 0.75rem;
      }
      .section-head p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
      .session-selector {
        margin-bottom: 0.75rem;
      }
      .session-selector label {
        display: block;
        margin-bottom: 0.25rem;
        font-size: 0.8rem;
        color: var(--text-secondary);
      }
      .tabs {
        display: flex;
        gap: 0.35rem;
        margin-bottom: 0.75rem;
      }
      .tab {
        background: var(--bg-secondary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        padding: 0.45rem 0.75rem;
        cursor: pointer;
      }
      .tab.active {
        color: var(--accent-primary);
        border-color: var(--accent-primary);
      }
      .log-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .preview-box {
        min-height: 220px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        white-space: pre-wrap;
      }
      .highlight-preview {
        margin-top: 0.75rem;
      }
      .highlight-preview ul {
        margin: 0.35rem 0 0;
        padding-left: 1rem;
      }
      .resource-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 0.75rem;
      }
      .resource-card {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 0.75rem;
      }
      .resource-title {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .resource-title span {
        color: var(--text-secondary);
        font-size: 0.8rem;
      }
      .resource-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .resource-fields label {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
      .save-state {
        display: block;
        margin-top: 0.5rem;
        color: var(--text-muted);
      }
      .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.6rem;
      }
      .actions {
        margin-top: 0.75rem;
      }
      .events-list {
        margin-top: 1rem;
      }
      .events-list h4 {
        margin-bottom: 0.5rem;
      }
      .event-item {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        padding: 0.45rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 0.85rem;
      }
      @media (max-width: 960px) {
        .log-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignToolsComponent implements OnInit, OnDestroy {
  loading = true;

  campaign: CampaignView | null = null;
  characters: CharacterView[] = [];
  sessions: SessionView[] = [];

  selectedSessionId = '';
  activeLogTab: 'public' | 'gm' = 'public';
  sessionLogForm = {
    narrativeLog: '',
    privateGmNotes: '',
    highlightsInput: '',
  };
  savingSessionLog = false;

  sanityForm = {
    characterId: '',
    roll: 50,
    difficulty: 50,
    trigger: '',
    successLoss: 0,
    failedLoss: 1,
    sessionId: '',
  };
  runningSanityCheck = false;
  sanityEvents: Array<{
    id: string;
    trigger: string;
    sanityLost: number;
    tempInsanity: string | null;
    permInsanity: string | null;
  }> = [];

  spellForm = {
    characterId: '',
    spellName: '',
    manaCost: 0,
    faithCost: 0,
    result: '',
    sessionId: '',
  };
  castingSpell = false;
  spellCasts: Array<{
    id: string;
    spellName: string;
    manaCost: number;
    faithCost: number;
    result: string | null;
  }> = [];

  resourceDrafts: Record<string, Record<string, string>> = {};
  resourceSaveState: Record<string, string> = {};

  private readonly destroy$ = new Subject<void>();
  private readonly resourcePatch$ = new Subject<ResourcePatchEvent>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
    private readonly campaignService: CampaignService,
    private readonly characterService: CharacterService,
    private readonly sessionService: SessionService
  ) {}

  get canEditSessionLog(): boolean {
    const campaign = this.campaign;
    const currentUser = this.authService.currentUser;

    if (!campaign || !currentUser) {
      return false;
    }

    if (campaign.ownerId === currentUser.id) {
      return true;
    }

    return campaign.members.some((member) => member.user.id === currentUser.id && member.role === 'GM');
  }

  get parsedHighlights(): string[] {
    return this.sessionLogForm.highlightsInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  ngOnInit(): void {
    this.resourcePatch$
      .pipe(
        debounceTime(500),
        switchMap((payload) => {
          this.resourceSaveState[payload.characterId] = 'Salvando...';
          return this.characterService.updateResources(payload.characterId, payload.resources).pipe(
            catchError(() => {
              this.resourceSaveState[payload.characterId] = 'Falha ao salvar';
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        if (!response?.data) {
          return;
        }

        const character = this.characters.find((item) => item.id === response.data.id);
        if (!character) {
          return;
        }

        character.resources = response.data.resources as ResourceMap;
        this.initResourceDraft(character);
        this.resourceSaveState[character.id] = 'Sincronizado';
      });

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (!campaignId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    forkJoin({
      campaign: this.campaignService.getCampaignById(campaignId),
      characters: this.characterService.getCharactersByCampaign(campaignId),
      sessions: this.sessionService.getSessionsByCampaign(campaignId),
    }).subscribe({
      next: ({ campaign, characters, sessions }) => {
        this.campaign = campaign.data as CampaignView;
        this.characters = (characters.data || []) as CharacterView[];
        this.sessions = (sessions.data || []) as SessionView[];

        this.characters.forEach((character) => this.initResourceDraft(character));

        if (this.sessions.length > 0) {
          this.selectedSessionId = this.sessions[0].id;
          this.syncLogEditor();
        }

        if (this.characters.length > 0) {
          const firstCharacterId = this.characters[0].id;
          this.sanityForm.characterId = firstCharacterId;
          this.spellForm.characterId = firstCharacterId;
          void this.loadSanityEvents();
          void this.loadSpellCasts();
        }

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private initResourceDraft(character: CharacterView): void {
    const resources = character.resources || {};

    const pickValue = (key: string): string => {
      const value = resources[key];
      if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
        return String(value);
      }
      return '0';
    };

    this.resourceDrafts[character.id] = {
      hp: pickValue('hp'),
      mana: pickValue('mana'),
      faith: pickValue('faith'),
      sanity: pickValue('sanity'),
    };
  }

  onResourceChange(characterId: string, key: string, rawValue: string): void {
    const draft = this.resourceDrafts[characterId];
    if (!draft) {
      return;
    }

    draft[key] = rawValue;

    const numeric = Number(rawValue);
    const parsedValue = Number.isFinite(numeric) ? numeric : rawValue;

    this.resourcePatch$.next({
      characterId,
      resources: {
        [key]: parsedValue,
      },
    });
  }

  syncLogEditor(): void {
    const session = this.sessions.find((item) => item.id === this.selectedSessionId);
    if (!session) {
      return;
    }

    this.sessionLogForm = {
      narrativeLog: session.narrativeLog || '',
      privateGmNotes: session.privateGmNotes || '',
      highlightsInput: (session.highlights || []).join(', '),
    };
  }

  saveSessionLog(): void {
    if (!this.selectedSessionId) {
      return;
    }

    this.savingSessionLog = true;
    this.sessionService
      .updateSessionLog(this.selectedSessionId, {
        narrativeLog: this.sessionLogForm.narrativeLog || undefined,
        privateGmNotes: this.sessionLogForm.privateGmNotes || undefined,
        highlights: this.parsedHighlights,
      })
      .subscribe({
        next: (response) => {
          const updated = response.data as SessionView;
          const index = this.sessions.findIndex((item) => item.id === updated.id);
          if (index >= 0) {
            this.sessions[index] = {
              ...this.sessions[index],
              ...updated,
            };
          }
          this.syncLogEditor();
          this.savingSessionLog = false;
        },
        error: () => {
          this.savingSessionLog = false;
        },
      });
  }

  runSanityCheck(): void {
    const characterId = this.sanityForm.characterId;
    if (!characterId || !this.sanityForm.trigger.trim()) {
      return;
    }

    this.runningSanityCheck = true;
    this.characterService
      .sanityCheck(characterId, {
        roll: this.sanityForm.roll,
        difficulty: this.sanityForm.difficulty,
        trigger: this.sanityForm.trigger,
        sessionId: this.sanityForm.sessionId || undefined,
        successLoss: this.sanityForm.successLoss,
        failedLoss: this.sanityForm.failedLoss,
      })
      .subscribe({
        next: (response) => {
          const payload = response.data as { character?: CharacterView };
          const updatedCharacter = payload.character;
          if (updatedCharacter?.id) {
            const character = this.characters.find((item) => item.id === updatedCharacter.id);
            if (character) {
              character.resources = updatedCharacter.resources;
              this.initResourceDraft(character);
            }
          }

          this.sanityForm.trigger = '';
          this.runningSanityCheck = false;
          void this.loadSanityEvents();
        },
        error: () => {
          this.runningSanityCheck = false;
        },
      });
  }

  castSpell(): void {
    const characterId = this.spellForm.characterId;
    if (!characterId || !this.spellForm.spellName.trim()) {
      return;
    }

    this.castingSpell = true;
    this.characterService
      .castSpell(characterId, {
        spellName: this.spellForm.spellName,
        manaCost: this.spellForm.manaCost,
        faithCost: this.spellForm.faithCost,
        result: this.spellForm.result || undefined,
        sessionId: this.spellForm.sessionId || undefined,
      })
      .subscribe({
        next: (response) => {
          const payload = response.data as { character?: CharacterView };
          const updatedCharacter = payload.character;
          if (updatedCharacter?.id) {
            const character = this.characters.find((item) => item.id === updatedCharacter.id);
            if (character) {
              character.resources = updatedCharacter.resources;
              this.initResourceDraft(character);
            }
          }

          this.spellForm.spellName = '';
          this.spellForm.result = '';
          this.castingSpell = false;
          void this.loadSpellCasts();
        },
        error: () => {
          this.castingSpell = false;
        },
      });
  }

  loadSanityEvents(): Promise<void> {
    if (!this.sanityForm.characterId) {
      this.sanityEvents = [];
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.characterService.getSanityEvents(this.sanityForm.characterId).subscribe({
        next: (response) => {
          this.sanityEvents = (response.data || []) as Array<{
            id: string;
            trigger: string;
            sanityLost: number;
            tempInsanity: string | null;
            permInsanity: string | null;
          }>;
          resolve();
        },
        error: () => {
          this.sanityEvents = [];
          resolve();
        },
      });
    });
  }

  loadSpellCasts(): Promise<void> {
    if (!this.spellForm.characterId) {
      this.spellCasts = [];
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      this.characterService.getSpellCasts(this.spellForm.characterId).subscribe({
        next: (response) => {
          this.spellCasts = (response.data || []) as Array<{
            id: string;
            spellName: string;
            manaCost: number;
            faithCost: number;
            result: string | null;
          }>;
          resolve();
        },
        error: () => {
          this.spellCasts = [];
          resolve();
        },
      });
    });
  }

  renderMarkdown(markdown: string): string {
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');
  }
}
