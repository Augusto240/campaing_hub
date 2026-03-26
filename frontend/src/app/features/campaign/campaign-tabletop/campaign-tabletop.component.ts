import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SocketService } from '../../../core/services/socket.service';

type TabletopToken = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

type TabletopState = {
  mapImageUrl: string | null;
  gridSize: number;
  tokens: TabletopToken[];
  updatedAt: string;
  updatedBy: string;
};

type TabletopStateEvent = {
  campaignId: string;
  state: TabletopState;
};

@Component({
  selector: 'app-campaign-tabletop',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container tabletop-page">
      <header class="tabletop-header card">
        <div>
          <a [routerLink]="['/campaigns', campaignId]" class="back-link">← Voltar para campanha</a>
          <h1>Mesa Online (VTT Beta)</h1>
          <p>
            Mapa interativo, tokens arrastaveis e sincronizacao realtime para todos da campanha.
          </p>
        </div>
        <div class="presence-pill">{{ connectedLabel }}</div>
      </header>

      <section class="tabletop-grid">
        <aside class="card sidebar">
          <h3>Mapa e grade</h3>
          <label class="field-label">URL do mapa</label>
          <input
            class="form-control"
            [(ngModel)]="draftMapUrl"
            placeholder="https://.../mapa.jpg"
          />
          <div class="toolbar-row">
            <button class="btn btn-outline btn-sm" (click)="applyMapUrl()">Aplicar</button>
            <button class="btn btn-outline btn-sm" (click)="clearMap()">Limpar</button>
          </div>

          <label class="field-label">Tamanho da grade: {{ state.gridSize }} px</label>
          <input
            type="range"
            min="24"
            max="120"
            step="4"
            class="form-control"
            [ngModel]="state.gridSize"
            (ngModelChange)="updateGridSize($event)"
          />

          <hr />

          <h3>Tokens</h3>
          <div class="toolbar-row">
            <button class="btn btn-primary btn-sm" (click)="addToken()">+ Token</button>
            <button class="btn btn-danger btn-sm" [disabled]="!selectedTokenId" (click)="removeSelectedToken()">
              Remover
            </button>
          </div>

          <div class="token-list">
            <button
              *ngFor="let token of state.tokens"
              class="token-item"
              [class.active]="selectedTokenId === token.id"
              (click)="selectToken(token.id)"
            >
              <span class="dot" [style.background]="token.color"></span>
              <span>{{ token.label }}</span>
            </button>
          </div>

          <div *ngIf="selectedToken as token" class="token-editor">
            <label class="field-label">Nome</label>
            <input class="form-control" [ngModel]="token.label" (ngModelChange)="renameToken(token.id, $event)" />

            <label class="field-label">Cor</label>
            <input type="color" class="color-input" [ngModel]="token.color" (ngModelChange)="recolorToken(token.id, $event)" />

            <label class="field-label">Tamanho</label>
            <input
              type="range"
              min="24"
              max="160"
              step="4"
              class="form-control"
              [ngModel]="token.size"
              (ngModelChange)="resizeToken(token.id, $event)"
            />
          </div>
        </aside>

        <section class="card map-shell">
          <div class="map-stage" #stage>
            <div class="map-bg" *ngIf="state.mapImageUrl" [style.background-image]="mapBackground"></div>
            <div class="map-grid" [style.background-size]="gridBackgroundSize"></div>

            <button
              *ngFor="let token of state.tokens"
              class="token"
              [class.active]="selectedTokenId === token.id"
              [style.left.px]="token.x"
              [style.top.px]="token.y"
              [style.width.px]="token.size"
              [style.height.px]="token.size"
              [style.background]="token.color"
              (mousedown)="startDrag($event, token.id)"
              (click)="selectToken(token.id)"
            >
              {{ shortLabel(token.label) }}
            </button>
          </div>
          <div class="map-footer">
            <span>Campanha: {{ campaignId }}</span>
            <span>Atualizado: {{ state.updatedAt ? (state.updatedAt | date:'HH:mm:ss') : '--:--:--' }}</span>
          </div>
        </section>
      </section>
    </div>
  `,
  styles: [
    `
      .tabletop-page {
        padding: 1.8rem 0 2.6rem;
      }
      .tabletop-header {
        padding: 1.2rem;
        margin-bottom: 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .tabletop-header h1 {
        margin: 0.5rem 0 0.35rem;
      }
      .tabletop-header p {
        margin: 0;
        color: var(--text-secondary);
      }
      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
      }
      .presence-pill {
        align-self: flex-start;
        border: 1px solid var(--border-color);
        border-radius: 999px;
        padding: 0.35rem 0.7rem;
        font-size: 0.8rem;
      }
      .tabletop-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
        gap: 1rem;
      }
      .sidebar {
        padding: 1rem;
      }
      .sidebar h3 {
        margin: 0 0 0.5rem;
      }
      .field-label {
        display: block;
        margin: 0.5rem 0 0.35rem;
        color: var(--text-secondary);
        font-size: 0.8rem;
        text-transform: uppercase;
      }
      .toolbar-row {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;
      }
      .token-list {
        display: grid;
        gap: 0.4rem;
        margin-top: 0.6rem;
      }
      .token-item {
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-primary);
        border-radius: var(--radius-sm);
        padding: 0.45rem 0.55rem;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        cursor: pointer;
      }
      .token-item.active {
        border-color: var(--accent-primary);
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
      }
      .token-editor {
        margin-top: 0.75rem;
      }
      .color-input {
        width: 100%;
        height: 38px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: transparent;
      }
      .map-shell {
        padding: 0.7rem;
      }
      .map-stage {
        position: relative;
        min-height: 70vh;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        overflow: hidden;
        background: #0d0d12;
      }
      .map-bg,
      .map-grid {
        position: absolute;
        inset: 0;
      }
      .map-bg {
        background-size: cover;
        background-position: center;
        opacity: 0.58;
      }
      .map-grid {
        background-image:
          linear-gradient(to right, rgba(255, 255, 255, 0.09) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.09) 1px, transparent 1px);
      }
      .token {
        position: absolute;
        border-radius: 50%;
        border: 2px solid rgba(0, 0, 0, 0.55);
        color: #15120a;
        font-weight: 700;
        display: grid;
        place-items: center;
        cursor: grab;
        user-select: none;
        z-index: 10;
      }
      .token.active {
        box-shadow: 0 0 0 2px var(--accent-primary), 0 0 22px rgba(201, 168, 76, 0.4);
      }
      .map-footer {
        margin-top: 0.55rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
        display: flex;
        justify-content: space-between;
      }
      @media (max-width: 1024px) {
        .tabletop-grid {
          grid-template-columns: 1fr;
        }
        .map-stage {
          min-height: 56vh;
        }
      }
    `,
  ],
})
export class CampaignTabletopComponent implements OnInit, OnDestroy {
  @ViewChild('stage') stageRef?: ElementRef<HTMLDivElement>;

  campaignId = '';
  connectedLabel = 'Realtime desconectado';
  draftMapUrl = '';
  selectedTokenId: string | null = null;

  state: TabletopState = {
    mapImageUrl: null,
    gridSize: 56,
    tokens: [],
    updatedAt: '',
    updatedBy: '',
  };

  private readonly destroy$ = new Subject<void>();
  private draggingTokenId: string | null = null;
  private dragPointerOffsetX = 0;
  private dragPointerOffsetY = 0;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly socketService: SocketService
  ) {}

  get mapBackground(): string {
    return this.state.mapImageUrl ? `url('${this.state.mapImageUrl}')` : 'none';
  }

  get gridBackgroundSize(): string {
    return `${this.state.gridSize}px ${this.state.gridSize}px`;
  }

  get selectedToken(): TabletopToken | undefined {
    return this.state.tokens.find((token) => token.id === this.selectedTokenId);
  }

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.campaignId) {
      return;
    }

    this.socketService.connect();
    this.socketService.joinCampaign(this.campaignId);

    this.socketService
      .on<TabletopStateEvent>('campaign:tabletop:state')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.campaignId !== this.campaignId) {
          return;
        }

        this.connectedLabel = 'Realtime conectado';
        this.state = event.state;
        this.draftMapUrl = this.state.mapImageUrl || '';
      });

    this.socketService.emit('campaign:tabletop:request', this.campaignId);

    window.addEventListener('mousemove', this.onWindowMouseMove);
    window.addEventListener('mouseup', this.onWindowMouseUp);
  }

  ngOnDestroy(): void {
    if (this.campaignId) {
      this.socketService.leaveCampaign(this.campaignId);
    }

    this.destroy$.next();
    this.destroy$.complete();

    window.removeEventListener('mousemove', this.onWindowMouseMove);
    window.removeEventListener('mouseup', this.onWindowMouseUp);
  }

  applyMapUrl(): void {
    const value = this.draftMapUrl.trim();
    this.pushState({ mapImageUrl: value.length > 0 ? value : null });
  }

  clearMap(): void {
    this.draftMapUrl = '';
    this.pushState({ mapImageUrl: null });
  }

  updateGridSize(value: number | string): void {
    const grid = Number(value);
    if (!Number.isFinite(grid)) {
      return;
    }

    this.pushState({ gridSize: Math.max(24, Math.min(120, Math.round(grid))) });
  }

  addToken(): void {
    const token: TabletopToken = {
      id: `token_${Date.now()}_${Math.round(Math.random() * 9999)}`,
      label: `Token ${this.state.tokens.length + 1}`,
      x: 80 + this.state.tokens.length * 24,
      y: 80 + this.state.tokens.length * 24,
      color: '#c9a84c',
      size: 56,
    };

    this.selectedTokenId = token.id;
    this.pushState({ tokens: [...this.state.tokens, token] });
  }

  selectToken(tokenId: string): void {
    this.selectedTokenId = tokenId;
  }

  removeSelectedToken(): void {
    if (!this.selectedTokenId) {
      return;
    }

    const nextTokens = this.state.tokens.filter((token) => token.id !== this.selectedTokenId);
    this.selectedTokenId = null;
    this.pushState({ tokens: nextTokens });
  }

  renameToken(tokenId: string, label: string): void {
    this.patchToken(tokenId, { label: label.slice(0, 60) });
  }

  recolorToken(tokenId: string, color: string): void {
    this.patchToken(tokenId, { color });
  }

  resizeToken(tokenId: string, sizeValue: number | string): void {
    const size = Number(sizeValue);
    if (!Number.isFinite(size)) {
      return;
    }

    this.patchToken(tokenId, { size: Math.max(24, Math.min(160, Math.round(size))) });
  }

  startDrag(event: MouseEvent, tokenId: string): void {
    const token = this.state.tokens.find((item) => item.id === tokenId);
    const stageRect = this.stageRef?.nativeElement.getBoundingClientRect();
    if (!token) {
      return;
    }

    this.draggingTokenId = tokenId;
    this.selectedTokenId = tokenId;
    this.dragPointerOffsetX = event.clientX - (token.x + (stageRect?.left ?? 0));
    this.dragPointerOffsetY = event.clientY - (token.y + (stageRect?.top ?? 0));
    event.preventDefault();
  }

  shortLabel(label: string): string {
    const text = label.trim();
    if (!text) {
      return 'T';
    }

    return text.length <= 3 ? text.toUpperCase() : text.slice(0, 3).toUpperCase();
  }

  private patchToken(tokenId: string, patch: Partial<TabletopToken>): void {
    const nextTokens = this.state.tokens.map((token) =>
      token.id === tokenId
        ? {
            ...token,
            ...patch,
          }
        : token
    );

    this.pushState({ tokens: nextTokens });
  }

  private readonly onWindowMouseMove = (event: MouseEvent): void => {
    if (!this.draggingTokenId) {
      return;
    }

    const stageElement = this.stageRef?.nativeElement;
    if (!stageElement) {
      return;
    }

    const stageRect = stageElement.getBoundingClientRect();
    const draggingToken = this.state.tokens.find((token) => token.id === this.draggingTokenId);
    const tokenSize = draggingToken?.size ?? 56;

    const localX = event.clientX - stageRect.left - this.dragPointerOffsetX;
    const localY = event.clientY - stageRect.top - this.dragPointerOffsetY;

    const maxX = Math.max(0, stageRect.width - tokenSize);
    const maxY = Math.max(0, stageRect.height - tokenSize);

    const nextX = Math.max(0, Math.min(maxX, localX));
    const nextY = Math.max(0, Math.min(maxY, localY));

    this.state = {
      ...this.state,
      tokens: this.state.tokens.map((token) =>
        token.id === this.draggingTokenId
          ? {
              ...token,
              x: nextX,
              y: nextY,
            }
          : token
      ),
    };
  };

  private readonly onWindowMouseUp = (): void => {
    if (!this.draggingTokenId) {
      return;
    }

    this.draggingTokenId = null;
    this.pushState({ tokens: this.state.tokens });
  };

  private pushState(patch: Partial<TabletopState>): void {
    this.state = {
      ...this.state,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    this.socketService.emit('campaign:tabletop:update', {
      campaignId: this.campaignId,
      ...patch,
    });
  }
}
