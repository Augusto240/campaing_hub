import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CampaignService } from '../../../core/services/campaign.service';
import { RpgSystemService } from '../../../core/services/rpg-system.service';

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
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>Minhas Campanhas</h1>
          <p class="subtitle">Gerencie suas mesas e sistemas</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">Nova Campanha</button>
      </div>

      <div *ngIf="loading" class="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading" class="campaigns-grid">
        <div *ngFor="let campaign of campaigns" class="campaign-card" [attr.data-system]="campaign.system">
          <div class="card-top">
            <div class="system-badge" [ngClass]="'sys-' + getSystemCss(campaign.system)">
              {{ getSystemIcon(campaign.system) }} {{ getSystemName(campaign.system) }}
            </div>
            <div class="card-actions">
              <button class="btn-ghost btn-sm" (click)="openEditModal(campaign)" title="Editar">Editar</button>
              <button class="btn-ghost btn-sm" (click)="confirmDelete(campaign)" title="Excluir">Excluir</button>
            </div>
          </div>

          <a [routerLink]="['/campaigns', campaign.id]" class="card-link">
            <h3 class="card-title">{{ campaign.name }}</h3>
            <p class="card-desc">{{ campaign.description || 'Sem descri��o' }}</p>
          </a>

          <div class="card-stats">
            <div class="mini-stat">{{ campaign._count?.characters || 0 }} personagens</div>
            <div class="mini-stat">{{ campaign._count?.sessions || 0 }} sess�es</div>
          </div>

          <div class="card-bottom">
            <span class="gm-name">GM: {{ campaign.owner.name }}</span>
            <a [routerLink]="['/campaigns', campaign.id]" class="btn btn-outline btn-sm">Abrir</a>
          </div>
        </div>

        <div *ngIf="campaigns.length === 0" class="empty-state" style="grid-column: 1 / -1;">
          <h3>Nenhuma campanha encontrada</h3>
          <p>Crie sua primeira campanha.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Criar Campanha</button>
        </div>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing ? 'Editar Campanha' : 'Nova Campanha' }}</h2>
            <button class="close-btn" (click)="showModal = false">�</button>
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
                placeholder="Ex: A Maldi��o de Strahd"
              >
            </div>
            <div class="form-group">
              <label class="form-label">Sistema</label>
              <select class="form-control" [(ngModel)]="formData.system" name="system" required>
                <option *ngFor="let system of systems" [value]="system.slug">{{ system.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Descri��o</label>
              <textarea
                class="form-control"
                [(ngModel)]="formData.description"
                name="description"
                rows="4"
                placeholder="Contexto da campanha"
              ></textarea>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showModal = false">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="!formData.name || !formData.system">
                {{ editing ? 'Salvar' : 'Criar' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="showDeleteConfirm = false">
        <div class="modal" style="max-width: 420px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirmar Exclus�o</h2>
            <button class="close-btn" (click)="showDeleteConfirm = false">�</button>
          </div>
          <div style="padding: 1.5rem;">
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
              Excluir a campanha <strong style="color: var(--accent-primary);">{{ deletingCampaign?.name }}</strong>?
            </p>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="showDeleteConfirm = false">Cancelar</button>
              <button class="btn btn-danger" (click)="deleteCampaign()">Excluir</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
      .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }
      .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }
      .campaign-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
      }
      .campaign-card:hover { border-color: var(--border-glow); box-shadow: var(--shadow-glow); }
      .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
      .card-actions { display: flex; gap: 0.25rem; }
      .system-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.7rem;
        font-weight: 600;
      }
      .sys-dnd5e { background: rgba(201,168,76,0.15); color: #c9a84c; border: 1px solid rgba(201,168,76,0.3); }
      .sys-pf2e { background: rgba(37,99,235,0.15); color: #2563eb; border: 1px solid rgba(37,99,235,0.3); }
      .sys-coc7e { background: rgba(5,150,105,0.15); color: #059669; border: 1px solid rgba(5,150,105,0.3); }
      .sys-tormenta20 { background: rgba(225,29,72,0.15); color: #e11d48; border: 1px solid rgba(225,29,72,0.3); }
      .sys-other { background: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }
      .card-link { text-decoration: none; color: inherit; flex: 1; }
      .card-title { margin-bottom: 0.4rem; }
      .card-desc { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1rem; }
      .card-stats { display: flex; gap: 1rem; padding: 0.8rem 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); margin-bottom: 1rem; }
      .mini-stat { color: var(--text-secondary); font-size: 0.8rem; }
      .card-bottom { display: flex; justify-content: space-between; align-items: center; }
      .gm-name { color: var(--text-secondary); font-size: 0.8rem; }
      @media (max-width: 768px) {
        .page-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
        .campaigns-grid { grid-template-columns: 1fr; }
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
            owner: created.owner || { name: 'Voce' },
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
