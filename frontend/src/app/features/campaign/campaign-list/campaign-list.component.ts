import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../../core/services/campaign.service';
import { RpgSystemService } from '../../../core/services/rpg-system.service';
import { AppIconComponent } from '../../../shared/components/icon.component';

type CampaignCard = {
  id: string;
  name: string;
  description?: string;
  system: string;
  owner: { name: string };
  _count?: {
    characters?: number;
    sessions?: number;
  };
};

type SystemOption = {
  slug: string;
  name: string;
};

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AppIconComponent],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Minhas campanhas</h1>
          <p class="subtitle">Organize mesas, sistemas e memórias de sessão em um só lugar.</p>
        </div>
        <button class="btn btn-primary" type="button" (click)="openCreateModal()">Nova campanha</button>
      </div>

      <div *ngIf="loading" class="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading" class="campaigns-grid">
        <article *ngFor="let campaign of campaigns" class="campaign-card" [attr.data-system]="campaign.system">
          <div class="card-top">
            <div class="system-badge" [ngClass]="'sys-' + getSystemCss(campaign.system)">
              {{ getSystemIcon(campaign.system) }} {{ getSystemName(campaign.system) }}
            </div>
            <div class="card-actions">
              <button class="btn-ghost btn-sm" type="button" (click)="openEditModal(campaign)">Editar</button>
              <button class="btn-ghost btn-sm" type="button" (click)="confirmDelete(campaign)">Excluir</button>
            </div>
          </div>

          <a [routerLink]="['/campaigns', campaign.id]" class="card-link">
            <h3 class="card-title">{{ campaign.name }}</h3>
            <p class="card-desc">{{ campaign.description || 'Sem descrição registrada.' }}</p>
          </a>

          <div class="card-stats">
            <div class="mini-stat">
              <strong>{{ campaign._count?.characters || 0 }}</strong>
              <span>personagens</span>
            </div>
            <div class="mini-stat">
              <strong>{{ campaign._count?.sessions || 0 }}</strong>
              <span>sessões</span>
            </div>
          </div>

          <div class="card-bottom">
            <span class="gm-name">GM: {{ campaign.owner.name }}</span>
            <a [routerLink]="['/campaigns', campaign.id]" class="btn btn-outline btn-sm">Abrir</a>
          </div>
        </article>

        <div *ngIf="campaigns.length === 0" class="empty-state card">
          <h3>Nenhuma campanha encontrada</h3>
          <p>Crie sua primeira campanha para começar a centralizar sessões, wiki e compêndio.</p>
          <button class="btn btn-primary" type="button" (click)="openCreateModal()">Criar campanha</button>
        </div>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ editing ? 'Editar campanha' : 'Nova campanha' }}</h2>
              <p>{{ editing ? 'Atualize o posicionamento da mesa.' : 'Dê nome, tom e sistema à sua próxima aventura.' }}</p>
            </div>
            <button class="close-btn" type="button" (click)="showModal = false" aria-label="Fechar modal">
              <app-icon name="close" [size]="18"></app-icon>
            </button>
          </div>

          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Nome</label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.name"
                name="name"
                required
                placeholder="Ex: A Maldição de Strahd"
              >
            </div>

            <div class="form-group">
              <label class="form-label">Sistema</label>
              <select class="form-control" [(ngModel)]="formData.system" name="system" required>
                <option *ngFor="let system of systems" [value]="system.slug">{{ system.name }}</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea
                class="form-control"
                [(ngModel)]="formData.description"
                name="description"
                rows="4"
                placeholder="Tom, premissa, ameaças e o tipo de história que a campanha quer contar."
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!formData.name || !formData.system">
                {{ editing ? 'Salvar alterações' : 'Criar campanha' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="showDeleteConfirm = false">
        <div class="modal danger-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>Confirmar exclusão</h2>
              <p>Essa ação remove a campanha e seus vínculos principais.</p>
            </div>
            <button class="close-btn" type="button" (click)="showDeleteConfirm = false" aria-label="Fechar confirmação">
              <app-icon name="close" [size]="18"></app-icon>
            </button>
          </div>

          <div class="confirm-copy">
            Excluir a campanha
            <strong>{{ deletingCampaign?.name }}</strong>?
          </div>

          <div class="modal-footer">
            <button class="btn btn-outline" type="button" (click)="showDeleteConfirm = false">Cancelar</button>
            <button class="btn btn-danger" type="button" (click)="deleteCampaign()">Excluir campanha</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .page-header h1 {
        margin: 0;
      }

      .subtitle {
        margin-top: 0.35rem;
        color: var(--text-secondary);
        font-size: 0.95rem;
        max-width: 42rem;
      }

      .campaigns-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.25rem;
      }

      .campaign-card {
        display: flex;
        flex-direction: column;
        padding: 1.25rem;
        background: linear-gradient(180deg, rgba(27, 27, 38, 0.96), rgba(16, 16, 22, 0.98));
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
      }

      .campaign-card:hover {
        transform: translateY(-2px);
        border-color: rgba(201, 168, 76, 0.32);
        box-shadow: 0 20px 38px rgba(0, 0, 0, 0.26);
      }

      .card-top,
      .card-bottom {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
      }

      .card-top {
        margin-bottom: 1rem;
      }

      .card-actions {
        display: flex;
        gap: 0.35rem;
      }

      .system-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.28rem 0.78rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.03em;
      }

      .sys-dnd5e {
        background: rgba(201, 168, 76, 0.15);
        color: #c9a84c;
        border: 1px solid rgba(201, 168, 76, 0.3);
      }

      .sys-pf2e {
        background: rgba(37, 99, 235, 0.15);
        color: #93c5fd;
        border: 1px solid rgba(37, 99, 235, 0.3);
      }

      .sys-coc7e {
        background: rgba(5, 150, 105, 0.15);
        color: #6ee7b7;
        border: 1px solid rgba(5, 150, 105, 0.3);
      }

      .sys-tormenta20 {
        background: rgba(225, 29, 72, 0.15);
        color: #fda4af;
        border: 1px solid rgba(225, 29, 72, 0.3);
      }

      .sys-other {
        background: rgba(139, 92, 246, 0.15);
        color: #ddd6fe;
        border: 1px solid rgba(139, 92, 246, 0.3);
      }

      .card-link {
        color: inherit;
        text-decoration: none;
        flex: 1;
      }

      .card-title {
        margin: 0 0 0.45rem;
      }

      .card-desc {
        min-height: 3.4rem;
        margin: 0 0 1rem;
        color: var(--text-muted);
        font-size: 0.92rem;
        line-height: 1.45;
      }

      .card-stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
        padding: 0.9rem 0;
        margin-bottom: 1rem;
        border-top: 1px solid var(--border-color);
        border-bottom: 1px solid var(--border-color);
      }

      .mini-stat {
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        color: var(--text-secondary);
        font-size: 0.8rem;
      }

      .mini-stat strong {
        color: var(--text-primary);
        font-size: 1.15rem;
      }

      .gm-name {
        color: var(--text-secondary);
        font-size: 0.82rem;
      }

      .empty-state {
        grid-column: 1 / -1;
        padding: 2rem;
        text-align: center;
      }

      .empty-state h3 {
        margin-top: 0;
      }

      .empty-state p {
        color: var(--text-secondary);
        margin-bottom: 1rem;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: grid;
        place-items: center;
        padding: 1.5rem;
        background: rgba(10, 10, 15, 0.78);
        backdrop-filter: blur(8px);
      }

      .modal {
        width: min(100%, 620px);
        padding: 1.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(201, 168, 76, 0.18);
        background: linear-gradient(180deg, rgba(28, 28, 38, 0.98), rgba(13, 13, 19, 0.98));
        box-shadow: 0 35px 80px rgba(0, 0, 0, 0.38);
      }

      .danger-modal {
        width: min(100%, 470px);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .modal-header h2 {
        margin: 0;
      }

      .modal-header p {
        margin: 0.35rem 0 0;
        color: var(--text-secondary);
      }

      .close-btn {
        width: 2.5rem;
        height: 2.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        cursor: pointer;
        transition: border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
      }

      .close-btn:hover {
        color: var(--text-primary);
        border-color: rgba(201, 168, 76, 0.24);
        transform: translateY(-1px);
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-label {
        display: block;
        margin-bottom: 0.4rem;
        color: var(--text-secondary);
        font-size: 0.82rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .modal-footer {
        display: flex;
        justify-content: end;
        gap: 0.75rem;
        flex-wrap: wrap;
        margin-top: 1.25rem;
      }

      .confirm-copy {
        color: var(--text-secondary);
        line-height: 1.5;
      }

      .confirm-copy strong {
        color: var(--accent-primary);
      }

      .btn-danger {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.95), rgba(153, 27, 27, 0.95));
        color: #fff;
      }

      @media (max-width: 768px) {
        .page-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .campaigns-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignListComponent implements OnInit {
  campaigns: CampaignCard[] = [];
  systems: SystemOption[] = [];

  loading = true;
  showModal = false;
  showDeleteConfirm = false;
  editing = false;
  editingId = '';
  deletingCampaign: CampaignCard | null = null;

  formData: { name: string; system: string; description: string } = {
    name: '',
    system: 'dnd5e',
    description: '',
  };

  constructor(
    private readonly campaignService: CampaignService,
    private readonly rpgSystemService: RpgSystemService
  ) {}

  ngOnInit(): void {
    this.loadSystems();
    this.loadCampaigns(true);
  }

  loadSystems(): void {
    this.rpgSystemService.getSystems().subscribe({
      next: (response) => {
        this.systems = (response.data || []).map((system: { slug: string; name: string }) => ({
          slug: system.slug,
          name: system.name,
        }));

        if (this.systems.length === 0) {
          this.systems = [
            { slug: 'dnd5e', name: 'D&D 5e' },
            { slug: 'pf2e', name: 'Pathfinder 2e' },
            { slug: 'coc7e', name: 'Call of Cthulhu 7e' },
            { slug: 'tormenta20', name: 'Tormenta20' },
          ];
        }

        if (!this.formData.system || !this.systems.some((system) => system.slug === this.formData.system)) {
          this.formData.system = this.systems[0].slug;
        }
      },
      error: () => {
        this.systems = [
          { slug: 'dnd5e', name: 'D&D 5e' },
          { slug: 'pf2e', name: 'Pathfinder 2e' },
          { slug: 'coc7e', name: 'Call of Cthulhu 7e' },
          { slug: 'tormenta20', name: 'Tormenta20' },
        ];
      },
    });
  }

  loadCampaigns(bustCache = false): void {
    this.campaignService.getCampaigns({ bustCache }).subscribe({
      next: (response) => {
        this.campaigns = (response.data || []) as CampaignCard[];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openCreateModal(): void {
    this.editing = false;
    this.editingId = '';
    this.formData = {
      name: '',
      system: this.systems[0]?.slug || 'dnd5e',
      description: '',
    };
    this.showModal = true;
  }

  openEditModal(campaign: CampaignCard): void {
    this.editing = true;
    this.editingId = campaign.id;
    this.formData = {
      name: campaign.name,
      system: campaign.system,
      description: campaign.description || '',
    };
    this.showModal = true;
  }

  onSubmit(): void {
    if (this.editing) {
      this.campaignService.updateCampaign(this.editingId, this.formData).subscribe({
        next: () => {
          this.showModal = false;
          this.loadCampaigns(true);
        },
      });
      return;
    }

    this.campaignService.createCampaign(this.formData).subscribe({
      next: (response) => {
        const created = response.data as Partial<CampaignCard> & { id: string; name: string; system: string };

        if (created?.id) {
          const optimistic: CampaignCard = {
            id: created.id,
            name: created.name,
            description: created.description,
            system: created.system,
            owner: created.owner || { name: 'Você' },
            _count: {
              characters: 0,
              sessions: 0,
            },
          };

          this.campaigns = [optimistic, ...this.campaigns.filter((campaign) => campaign.id !== created.id)];
        }

        this.showModal = false;
        this.formData = {
          name: '',
          system: this.systems[0]?.slug || 'dnd5e',
          description: '',
        };
        this.loadCampaigns(true);
      },
    });
  }

  confirmDelete(campaign: CampaignCard): void {
    this.deletingCampaign = campaign;
    this.showDeleteConfirm = true;
  }

  deleteCampaign(): void {
    if (!this.deletingCampaign) {
      return;
    }

    this.campaignService.deleteCampaign(this.deletingCampaign.id).subscribe({
      next: () => {
        this.showDeleteConfirm = false;
        this.deletingCampaign = null;
        this.loadCampaigns(true);
      },
    });
  }

  getSystemCss(system: string): string {
    const key = (system || '').toLowerCase();
    if (key === 'dnd5e') {
      return 'dnd5e';
    }
    if (key === 'pf2e' || key === 'pathfinder') {
      return 'pf2e';
    }
    if (key === 'coc7e' || key === 'coc') {
      return 'coc7e';
    }
    if (key === 'tormenta20' || key === 't20') {
      return 'tormenta20';
    }
    return 'other';
  }

  getSystemIcon(system: string): string {
    const key = this.getSystemCss(system);
    const icons: Record<string, string> = {
      dnd5e: 'd20',
      pf2e: 'PF',
      coc7e: 'CoC',
      tormenta20: 'T20',
      other: 'RPG',
    };

    return icons[key] || 'RPG';
  }

  getSystemName(system: string): string {
    const key = this.getSystemCss(system);
    const names: Record<string, string> = {
      dnd5e: 'D&D 5e',
      pf2e: 'Pathfinder 2e',
      coc7e: 'Call of Cthulhu 7e',
      tormenta20: 'Tormenta20',
      other: 'Outro',
    };

    return names[key] || system;
  }
}
