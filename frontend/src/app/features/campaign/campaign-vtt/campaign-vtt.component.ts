import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CharacterService } from '../../../core/services/character.service';
import { DiceRollService } from '../../../core/services/dice-roll.service';
import { SocketService } from '../../../core/services/socket.service';
import {
  CampaignJoinedEvent,
  CampaignRealtimeAccessState,
  CampaignSocketErrorEvent,
  applyCampaignErrorEvent,
  applyCampaignJoinedEvent,
  canManageCampaignRealtime,
  createInitialCampaignRealtimeAccessState,
} from '../../../core/types';

type CharacterLite = {
  id: string;
  name: string;
  resources?: Record<string, unknown> | null;
  imageUrl?: string | null;
};

type VttToken = {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  hp: number | null;
  maxHp: number | null;
  initiative: number | null;
  characterId?: string;
  imageUrl?: string;
};

type VttTokenUpsertEvent = {
  campaignId: string;
  token: VttToken;
};

type VttChatMessage = {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  kind: 'chat' | 'system' | 'dice';
  createdAt: string;
};

type VttChatOutgoingEvent = {
  campaignId: string;
  message: VttChatMessage;
};

type DiceRealtimeEvent = {
  id: string;
  formula: string;
  result: number;
  userName?: string;
  characterName?: string | null;
};

@Component({
  selector: 'app-campaign-vtt',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="vtt-shell" *ngIf="campaignId">
      <header class="vtt-header card">
        <div>
          <a class="back-link" [routerLink]="['/campaigns', campaignId]">Voltar para campanha</a>
          <h1>Mesa VTT Arcana</h1>
          <p>Mapa com grid, tokens colaborativos, chat e dados em tempo real.</p>
        </div>

        <div class="header-actions">
          <div class="status-stack">
            <span class="status-pill" [attr.data-tone]="realtimeAccess.joined ? 'success' : 'warning'">
              {{ connectionLabel }}
            </span>
            <span class="status-pill" [attr.data-tone]="canManageBoard ? 'accent' : 'muted'">
              {{ permissionLabel }}
            </span>
          </div>
          <button class="btn btn-outline" (click)="showGrid = !showGrid">
            {{ showGrid ? 'Ocultar grid' : 'Mostrar grid' }}
          </button>
          <button class="btn btn-outline" (click)="snapToGrid = !snapToGrid">
            {{ snapToGrid ? 'Snap ativo' : 'Snap desativado' }}
          </button>
          <button class="btn btn-danger" (click)="clearBoard()" [disabled]="tokens.length === 0 || !canManageBoard">Limpar mesa</button>
        </div>
      </header>

      <div class="table-notice card" *ngIf="statusMessage">
        {{ statusMessage }}
      </div>

      <div class="vtt-layout">
        <article class="board card">
          <div
            #boardRef
            class="board-stage"
            [class.grid-visible]="showGrid"
            (pointermove)="onBoardPointerMove($event)"
            (pointerup)="onBoardPointerUp()"
            (pointerleave)="onBoardPointerUp()"
          >
            <div class="fog-layer"></div>

            <button
              *ngFor="let token of tokens"
              class="token"
              type="button"
              [class.selected]="selectedTokenId === token.id"
              [style.left.%]="token.x"
              [style.top.%]="token.y"
              [style.--token-color]="token.color"
              (pointerdown)="onTokenPointerDown(token, $event)"
              (click)="selectedTokenId = token.id"
            >
              <span class="token-name">{{ token.name }}</span>
              <span class="token-hp" *ngIf="token.maxHp !== null">{{ token.hp ?? 0 }}/{{ token.maxHp }}</span>
            </button>
          </div>
        </article>

        <aside class="side card">
          <h2>Tokens</h2>

          <p class="side-note" *ngIf="!canManageBoard">
            Modo leitura ativo. Chat e rolagens seguem disponiveis, mas apenas o GM altera tokens.
          </p>

          <label class="field">
            Nome
            <input class="form-control" [(ngModel)]="newToken.name" placeholder="Ex: Augustus Frostborne" [disabled]="!canManageBoard" />
          </label>

          <label class="field">
            Vincular personagem
            <select class="form-control" [(ngModel)]="newToken.characterId" (ngModelChange)="onCharacterSelected($event)" [disabled]="!canManageBoard">
              <option value="">Sem vinculo</option>
              <option *ngFor="let character of characters" [value]="character.id">{{ character.name }}</option>
            </select>
          </label>

          <div class="field-grid">
            <label class="field">
              HP
              <input class="form-control" type="number" [(ngModel)]="newToken.hp" [disabled]="!canManageBoard" />
            </label>
            <label class="field">
              Max HP
              <input class="form-control" type="number" [(ngModel)]="newToken.maxHp" [disabled]="!canManageBoard" />
            </label>
            <label class="field">
              Init
              <input class="form-control" type="number" [(ngModel)]="newToken.initiative" [disabled]="!canManageBoard" />
            </label>
            <label class="field">
              Cor
              <input class="form-control color-input" type="color" [(ngModel)]="newToken.color" [disabled]="!canManageBoard" />
            </label>
          </div>

          <button class="btn btn-primary" (click)="addToken()" [disabled]="!newToken.name || !canManageBoard">Adicionar token</button>

          <div class="selected-card" *ngIf="selectedToken">
            <h3>Token selecionado</h3>
            <div class="selected-line"><strong>{{ selectedToken.name }}</strong></div>
            <div class="selected-line">Posicao: {{ selectedToken.x | number:'1.0-0' }} / {{ selectedToken.y | number:'1.0-0' }}</div>
            <div class="selected-line" *ngIf="selectedToken.maxHp !== null">
              HP: {{ selectedToken.hp ?? 0 }} / {{ selectedToken.maxHp }}
            </div>

            <div class="selected-actions" *ngIf="canManageBoard">
              <button class="btn btn-outline btn-sm" (click)="nudgeSelected(-5, 0)">Esq</button>
              <button class="btn btn-outline btn-sm" (click)="nudgeSelected(5, 0)">Dir</button>
              <button class="btn btn-outline btn-sm" (click)="nudgeSelected(0, -5)">Cima</button>
              <button class="btn btn-outline btn-sm" (click)="nudgeSelected(0, 5)">Baixo</button>
              <button class="btn btn-danger btn-sm" (click)="removeSelectedToken()">Remover</button>
            </div>
          </div>
        </aside>
      </div>

      <div class="console-grid">
        <article class="chat card">
          <div class="chat-header">
            <h2>Chat de Mesa</h2>
            <small>Tempo real via Socket.IO</small>
          </div>

          <div class="chat-log">
            <div *ngFor="let msg of chatMessages" class="chat-item" [attr.data-kind]="msg.kind">
              <div class="meta">
                <strong>{{ msg.authorName }}</strong>
                <span>{{ msg.createdAt | date:'HH:mm:ss' }}</span>
              </div>
              <p>{{ msg.text }}</p>
            </div>
            <div *ngIf="chatMessages.length === 0" class="chat-empty">Sem mensagens ainda.</div>
          </div>

          <div class="chat-form">
            <input
              class="form-control"
              [(ngModel)]="chatInput"
              placeholder="Digite uma mensagem para a mesa"
              (keyup.enter)="sendChat()"
              [disabled]="!realtimeAccess.joined"
            />
            <button class="btn btn-primary" (click)="sendChat()" [disabled]="!chatInput.trim() || !realtimeAccess.joined">Enviar</button>
          </div>
        </article>

        <article class="dice card">
          <h2>Dados</h2>

          <label class="field">
            Formula
            <input class="form-control" [(ngModel)]="diceFormula" placeholder="Ex: 1d20+5" />
          </label>

          <div class="dice-actions">
            <button class="btn btn-primary" (click)="rollDice()" [disabled]="!diceFormula.trim() || rollingDice">
              {{ rollingDice ? 'Rolando...' : 'Rolar dado' }}
            </button>
            <button class="btn btn-outline" (click)="rollLegacy4d6()">Rolagem 4d6 legado</button>
          </div>

          <p class="dice-note">
            A rolagem 4d6 legado honra o prototipo 2023 e envia o resultado para o chat da mesa.
          </p>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .vtt-shell {
        width: min(1320px, calc(100% - 2rem));
        margin: 0 auto;
        padding: 1.5rem 0 3rem;
        display: grid;
        gap: 1rem;
      }
      .vtt-header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1.2rem;
      }
      .vtt-header h1 {
        margin: 0.35rem 0;
      }
      .vtt-header p {
        margin: 0;
        color: var(--text-secondary);
      }
      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.9rem;
      }
      .header-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-content: start;
        justify-content: flex-end;
      }
      .status-stack {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: flex-end;
      }
      .status-pill {
        padding: 0.32rem 0.7rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 0.78rem;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .status-pill[data-tone='success'] {
        border-color: rgba(16, 185, 129, 0.28);
        background: rgba(16, 185, 129, 0.12);
        color: #6ee7b7;
      }
      .status-pill[data-tone='warning'] {
        border-color: rgba(245, 158, 11, 0.28);
        background: rgba(245, 158, 11, 0.12);
        color: #fbbf24;
      }
      .status-pill[data-tone='accent'] {
        border-color: rgba(201, 168, 76, 0.3);
        background: rgba(201, 168, 76, 0.14);
        color: var(--color-primary);
      }
      .status-pill[data-tone='muted'] {
        border-color: rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
      }
      .table-notice {
        padding: 0.8rem 1rem;
        color: var(--text-secondary);
      }
      .vtt-layout {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 380px);
        gap: 1rem;
      }
      .board,
      .side,
      .chat,
      .dice {
        padding: 1rem;
      }
      .board-stage {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 10;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        overflow: hidden;
        background:
          radial-gradient(circle at 10% 15%, rgba(201, 168, 76, 0.14), transparent 35%),
          radial-gradient(circle at 75% 85%, rgba(14, 116, 144, 0.2), transparent 40%),
          linear-gradient(140deg, rgba(15, 15, 26, 0.95), rgba(16, 23, 34, 0.95));
      }
      .board-stage.grid-visible::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
        background-size: 8% 8%;
        pointer-events: none;
      }
      .fog-layer {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, transparent 35%, rgba(0, 0, 0, 0.42));
        pointer-events: none;
      }
      .token {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 72px;
        min-height: 72px;
        border-radius: 14px;
        border: 2px solid var(--token-color);
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.72));
        color: #fff;
        cursor: grab;
        padding: 0.35rem;
        display: grid;
        gap: 0.2rem;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.4);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
      }
      .token.selected {
        box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.5), 0 14px 28px rgba(0, 0, 0, 0.45);
      }
      .token-name {
        font-size: 0.72rem;
        line-height: 1.1;
        font-weight: 600;
      }
      .token-hp {
        font-size: 0.66rem;
        color: rgba(255, 255, 255, 0.9);
      }
      .side h2,
      .chat h2,
      .dice h2 {
        margin-top: 0;
      }
      .field {
        display: grid;
        gap: 0.35rem;
        margin-bottom: 0.75rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
      .side-note {
        margin: 0 0 0.9rem;
        color: var(--text-secondary);
        font-size: 0.84rem;
      }
      .field-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
      }
      .color-input {
        min-height: 42px;
      }
      .selected-card {
        margin-top: 0.9rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 0.85rem;
      }
      .selected-card h3 {
        margin: 0 0 0.45rem;
      }
      .selected-line {
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
        font-size: 0.85rem;
      }
      .selected-actions {
        margin-top: 0.8rem;
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .console-grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
        gap: 1rem;
      }
      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.7rem;
      }
      .chat-header small {
        color: var(--text-secondary);
      }
      .chat-log {
        min-height: 260px;
        max-height: 360px;
        overflow: auto;
        display: grid;
        gap: 0.55rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        padding: 0.7rem;
        margin-bottom: 0.8rem;
      }
      .chat-item {
        border-left: 3px solid transparent;
        padding-left: 0.55rem;
        animation: fadeIn 180ms ease;
      }
      .chat-item[data-kind='chat'] {
        border-left-color: rgba(201, 168, 76, 0.7);
      }
      .chat-item[data-kind='dice'] {
        border-left-color: rgba(16, 185, 129, 0.8);
      }
      .chat-item[data-kind='system'] {
        border-left-color: rgba(96, 165, 250, 0.8);
      }
      .chat-item .meta {
        display: flex;
        justify-content: space-between;
        gap: 0.7rem;
        font-size: 0.78rem;
        color: var(--text-secondary);
      }
      .chat-item p {
        margin: 0.2rem 0 0;
        white-space: pre-wrap;
      }
      .chat-empty {
        color: var(--text-muted);
        font-size: 0.85rem;
      }
      .chat-form {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.6rem;
      }
      .dice-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
        margin: 0.5rem 0 0.7rem;
      }
      .dice-note {
        color: var(--text-secondary);
        font-size: 0.85rem;
        margin: 0;
      }
      @media (max-width: 1024px) {
        .vtt-layout,
        .console-grid {
          grid-template-columns: 1fr;
        }
        .vtt-header {
          flex-direction: column;
        }
        .header-actions {
          justify-content: flex-start;
        }
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(4px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class CampaignVttComponent implements OnInit, OnDestroy {
  @ViewChild('boardRef') boardRef?: ElementRef<HTMLDivElement>;

  campaignId = '';
  loading = false;

  showGrid = true;
  snapToGrid = true;

  tokens: VttToken[] = [];
  selectedTokenId: string | null = null;

  characters: CharacterLite[] = [];

  newToken: {
    name: string;
    characterId: string;
    color: string;
    hp: number | null;
    maxHp: number | null;
    initiative: number | null;
  } = {
    name: '',
    characterId: '',
    color: '#c9a84c',
    hp: null,
    maxHp: null,
    initiative: null,
  };

  chatInput = '';
  chatMessages: VttChatMessage[] = [];

  diceFormula = '1d20+5';
  rollingDice = false;
  realtimeAccess: CampaignRealtimeAccessState = createInitialCampaignRealtimeAccessState();
  statusMessage = 'Entrando na campanha em tempo real...';

  private draggingTokenId: string | null = null;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly socketService: SocketService,
    private readonly characterService: CharacterService,
    private readonly diceRollService: DiceRollService
  ) {}

  get selectedToken(): VttToken | null {
    if (!this.selectedTokenId) {
      return null;
    }

    return this.tokens.find((token) => token.id === this.selectedTokenId) ?? null;
  }

  get canManageBoard(): boolean {
    return canManageCampaignRealtime(this.realtimeAccess);
  }

  get connectionLabel(): string {
    return this.realtimeAccess.joined ? 'Realtime conectado' : 'Conectando';
  }

  get permissionLabel(): string {
    if (!this.realtimeAccess.joined) {
      return 'Aguardando acesso';
    }

    return this.realtimeAccess.isGM ? 'Modo GM' : 'Modo leitura';
  }

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.params['id'] as string;
    if (!this.campaignId) {
      return;
    }

    this.loadCharacters();
    this.bindRealtime();
  }

  ngOnDestroy(): void {
    if (this.campaignId) {
      this.socketService.leaveCampaign(this.campaignId);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCharacters(): void {
    this.characterService.getCharactersByCampaign(this.campaignId).subscribe({
      next: (response) => {
        this.characters = (response.data || []) as CharacterLite[];
      },
    });
  }

  bindRealtime(): void {
    this.socketService
      .on<CampaignJoinedEvent>('campaign:joined')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        this.realtimeAccess = applyCampaignJoinedEvent(this.realtimeAccess, this.campaignId, event);
        if (event.campaignId !== this.campaignId) {
          return;
        }

        this.statusMessage = event.isGM
          ? 'Mesa liberada para o mestre.'
          : 'Modo leitura ativo. Chat e rolagens seguem disponiveis.';
      });

    this.socketService
      .on<CampaignSocketErrorEvent>('campaign:error')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        const nextState = applyCampaignErrorEvent(this.realtimeAccess, this.campaignId, event);
        if (nextState === this.realtimeAccess) {
          return;
        }

        this.realtimeAccess = nextState;
        this.statusMessage = event.message;
        this.appendLocalSystemMessage(event.message);
      });

    this.socketService.joinCampaign(this.campaignId);

    this.socketService
      .on<VttTokenUpsertEvent>('vtt:token:upsert')
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (!payload || payload.campaignId !== this.campaignId) {
          return;
        }

        this.upsertToken(payload.token, false);
      });

    this.socketService
      .on<VttChatOutgoingEvent>('vtt:chat:message')
      .pipe(takeUntil(this.destroy$))
      .subscribe((payload) => {
        if (!payload || payload.campaignId !== this.campaignId) {
          return;
        }

        this.chatMessages = [...this.chatMessages.slice(-59), payload.message];
      });

    this.socketService
      .on<DiceRealtimeEvent>('dice:rolled')
      .pipe(takeUntil(this.destroy$))
      .subscribe((roll) => {
        const actor = roll.characterName || roll.userName || 'Mesa';
        this.chatMessages = [
          ...this.chatMessages.slice(-59),
          {
            id: roll.id,
            authorId: 'dice-system',
            authorName: 'Dice Feed',
            text: `${actor} rolou ${roll.formula} = ${roll.result}`,
            kind: 'dice',
            createdAt: new Date().toISOString(),
          },
        ];
      });
  }

  onCharacterSelected(characterId: string): void {
    if (!characterId) {
      return;
    }

    const character = this.characters.find((item) => item.id === characterId);
    if (!character) {
      return;
    }

    this.newToken.name = character.name;
    this.newToken.hp = this.readResourceNumber(character.resources, 'hp');
    this.newToken.maxHp = this.readResourceNumber(character.resources, 'maxHp');
  }

  addToken(): void {
    if (!this.ensureCanManageBoard('Somente o GM pode adicionar ou mover tokens nesta mesa.')) {
      return;
    }

    const id = `token-${Date.now()}`;

    const token: VttToken = {
      id,
      name: this.newToken.name.trim(),
      x: this.randomSpawn(),
      y: this.randomSpawn(),
      color: this.newToken.color,
      hp: this.newToken.hp,
      maxHp: this.newToken.maxHp,
      initiative: this.newToken.initiative,
      ...(this.newToken.characterId ? { characterId: this.newToken.characterId } : {}),
    };

    this.upsertToken(token, true);

    this.newToken = {
      name: '',
      characterId: '',
      color: '#c9a84c',
      hp: null,
      maxHp: null,
      initiative: null,
    };
  }

  clearBoard(): void {
    if (!this.ensureCanManageBoard('Somente o GM pode limpar a mesa.')) {
      return;
    }

    this.tokens = [];
    this.selectedTokenId = null;

    this.socketService.emit('vtt:chat:message', {
      campaignId: this.campaignId,
      text: 'Mesa limpa pelo mestre.',
      kind: 'system',
    });
  }

  onTokenPointerDown(token: VttToken, event: PointerEvent): void {
    if (!this.ensureCanManageBoard('Somente o GM pode mover tokens nesta mesa.')) {
      return;
    }

    this.selectedTokenId = token.id;
    this.draggingTokenId = token.id;
    event.preventDefault();
  }

  onBoardPointerMove(event: PointerEvent): void {
    if (!this.draggingTokenId || !this.boardRef?.nativeElement) {
      return;
    }

    const boardRect = this.boardRef.nativeElement.getBoundingClientRect();

    const nextX = ((event.clientX - boardRect.left) / boardRect.width) * 100;
    const nextY = ((event.clientY - boardRect.top) / boardRect.height) * 100;

    const x = this.normalizePosition(nextX);
    const y = this.normalizePosition(nextY);

    this.tokens = this.tokens.map((token) =>
      token.id === this.draggingTokenId
        ? {
            ...token,
            x,
            y,
          }
        : token
    );
  }

  onBoardPointerUp(): void {
    if (!this.draggingTokenId) {
      return;
    }

    const token = this.tokens.find((item) => item.id === this.draggingTokenId);
    this.draggingTokenId = null;

    if (!token) {
      return;
    }

    this.socketService.emit('vtt:token:upsert', {
      campaignId: this.campaignId,
      token,
    });
  }

  nudgeSelected(deltaX: number, deltaY: number): void {
    if (!this.ensureCanManageBoard('Somente o GM pode reposicionar tokens nesta mesa.')) {
      return;
    }

    const token = this.selectedToken;
    if (!token) {
      return;
    }

    const moved: VttToken = {
      ...token,
      x: this.normalizePosition(token.x + deltaX),
      y: this.normalizePosition(token.y + deltaY),
    };

    this.upsertToken(moved, true);
  }

  removeSelectedToken(): void {
    if (!this.ensureCanManageBoard('Somente o GM pode remover tokens nesta mesa.')) {
      return;
    }

    if (!this.selectedTokenId) {
      return;
    }

    this.tokens = this.tokens.filter((token) => token.id !== this.selectedTokenId);
    this.selectedTokenId = null;
  }

  sendChat(): void {
    if (!this.realtimeAccess.joined) {
      this.statusMessage = 'A mesa ainda nao confirmou seu acesso realtime.';
      return;
    }

    const text = this.chatInput.trim();
    if (!text) {
      return;
    }

    this.socketService.emit('vtt:chat:message', {
      campaignId: this.campaignId,
      text,
      kind: 'chat',
    });

    this.chatInput = '';
  }

  rollDice(): void {
    const formula = this.diceFormula.trim();
    if (!formula) {
      return;
    }

    this.rollingDice = true;

    this.diceRollService
      .createRoll({
        campaignId: this.campaignId,
        formula,
        label: 'VTT quick roll',
      })
      .subscribe({
        next: () => {
          this.rollingDice = false;
        },
        error: () => {
          this.rollingDice = false;
          this.socketService.emit('vtt:chat:message', {
            campaignId: this.campaignId,
            text: `Falha ao rolar a formula ${formula}`,
            kind: 'system',
          });
        },
      });
  }

  rollLegacy4d6(): void {
    const rolls = [0, 0, 0, 0].map(() => Math.floor(Math.random() * 6) + 1);
    const sorted = [...rolls].sort((a, b) => a - b);
    const dropped = sorted[0];
    const kept = sorted.slice(1);
    const total = kept.reduce((sum, value) => sum + value, 0);

    this.socketService.emit('vtt:chat:message', {
      campaignId: this.campaignId,
      text: `4d6 legado => [${rolls.join(', ')}], descarta ${dropped}, total ${total}`,
      kind: 'dice',
    });
  }

  private upsertToken(token: VttToken, emit = true): void {
    const index = this.tokens.findIndex((item) => item.id === token.id);

    if (index === -1) {
      this.tokens = [...this.tokens, token];
    } else {
      const cloned = [...this.tokens];
      cloned[index] = token;
      this.tokens = cloned;
    }

    if (emit) {
      this.socketService.emit('vtt:token:upsert', {
        campaignId: this.campaignId,
        token,
      });
    }
  }

  private ensureCanManageBoard(message: string): boolean {
    if (this.canManageBoard) {
      return true;
    }

    this.statusMessage = message;
    return false;
  }

  private appendLocalSystemMessage(text: string): void {
    this.chatMessages = [
      ...this.chatMessages.slice(-59),
      {
        id: `local-${Date.now()}`,
        authorId: 'campaign-system',
        authorName: 'Campaign Hub',
        text,
        kind: 'system',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private readResourceNumber(
    resources: Record<string, unknown> | null | undefined,
    key: string
  ): number | null {
    if (!resources) {
      return null;
    }

    const value = resources[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    return null;
  }

  private normalizePosition(value: number): number {
    const clamped = Math.max(5, Math.min(95, value));
    if (!this.snapToGrid) {
      return clamped;
    }

    return Math.round(clamped / 5) * 5;
  }

  private randomSpawn(): number {
    const min = 18;
    const max = 82;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
