import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignService } from '../../../core/services/campaign.service';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <div class="page-header">
        <div>
          <h1>⚔️ Minhas Campanhas</h1>
          <p class="subtitle">Gerencie suas aventuras épicas</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">+ Nova Campanha</button>
      </div>

      <div *ngIf="loading" class="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading" class="campaigns-grid">
        <div *ngFor="let c of campaigns" class="campaign-card" [attr.data-system]="c.system">
          <div class="card-top">
            <div class="system-badge" [ngClass]="'sys-' + c.system.toLowerCase()">
              {{ getSystemIcon(c.system) }} {{ getSystemName(c.system) }}
            </div>
            <div class="card-actions">
              <button class="btn-ghost btn-sm" (click)="openEditModal(c)" title="Editar">✏️</button>
              <button class="btn-ghost btn-sm" (click)="confirmDelete(c)" title="Excluir">🗑️</button>
            </div>
          </div>

          <a [routerLink]="['/campaigns', c.id]" class="card-link">
            <h3 class="card-title">{{ c.name }}</h3>
            <p class="card-desc">{{ c.description || 'Nenhuma descrição' }}</p>
          </a>

          <div class="card-stats">
            <div class="mini-stat"><span class="ms-icon">⚔️</span> {{ c._count?.characters || 0 }} Personagens</div>
            <div class="mini-stat"><span class="ms-icon">📅</span> {{ c._count?.sessions || 0 }} Sessões</div>
          </div>

          <div class="card-bottom">
            <div class="gm-info">
              <div class="gm-avatar">{{ c.owner.name.charAt(0) }}</div>
              <span class="gm-name">GM: {{ c.owner.name }}</span>
            </div>
            <a [routerLink]="['/campaigns', c.id]" class="btn btn-outline btn-sm">Abrir →</a>
          </div>
        </div>

        <div *ngIf="campaigns.length === 0" class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🗺️</div>
          <h3>Nenhuma campanha encontrada</h3>
          <p>Crie sua primeira campanha para começar a aventura!</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Criar Campanha</button>
        </div>
      </div>

      <!-- Create / Edit Modal -->
      <div *ngIf="showModal" class="modal-overlay" (click)="showModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing ? '✏️ Editar Campanha' : '🗺️ Nova Campanha' }}</h2>
            <button class="close-btn" (click)="showModal = false">×</button>
          </div>
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Nome da Campanha</label>
              <input type="text" class="form-control" [(ngModel)]="formData.name" name="name"
                required placeholder="Ex: A Maldição de Strahd">
            </div>
            <div class="form-group">
              <label class="form-label">Sistema</label>
              <select class="form-control" [(ngModel)]="formData.system" name="system">
                <option value="DND5E">D&D 5ª Edição</option>
                <option value="T20">Tormenta 20</option>
                <option value="CoC">Call of Cthulhu</option>
                <option value="Pathfinder">Pathfinder</option>
                <option value="Other">Outro</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea class="form-control" [(ngModel)]="formData.description" name="description"
                rows="4" placeholder="Descreva a história da sua campanha..."></textarea>
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

      <!-- Delete Confirmation -->
      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="showDeleteConfirm = false">
        <div class="modal" style="max-width: 420px;" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>⚠️ Confirmar Exclusão</h2>
            <button class="close-btn" (click)="showDeleteConfirm = false">×</button>
          </div>
          <div style="padding: 1.5rem;">
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
              Tem certeza que deseja excluir a campanha <strong style="color: var(--accent-primary);">{{ deletingCampaign?.name }}</strong>?
              Todos os personagens, sessões e itens serão perdidos.
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
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 1.75rem; }
    .subtitle { color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem; }

    .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.25rem; }

    .campaign-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 1.5rem;
      transition: all var(--transition-normal); display: flex; flex-direction: column;
    }
    .campaign-card:hover { border-color: var(--border-glow); box-shadow: var(--shadow-glow); transform: translateY(-3px); }

    .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .card-actions { display: flex; gap: 0.25rem; }

    .system-badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.7rem;
      font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .sys-dnd5e { background: rgba(201,168,76,0.15); color: #c9a84c; border: 1px solid rgba(201,168,76,0.3); }
    .sys-t20 { background: rgba(225,29,72,0.15); color: #e11d48; border: 1px solid rgba(225,29,72,0.3); }
    .sys-coc { background: rgba(5,150,105,0.15); color: #059669; border: 1px solid rgba(5,150,105,0.3); }
    .sys-pathfinder { background: rgba(37,99,235,0.15); color: #2563eb; border: 1px solid rgba(37,99,235,0.3); }
    .sys-other { background: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }

    .card-link { text-decoration: none; color: inherit; flex: 1; }
    .card-title { font-size: 1.2rem; color: var(--text-primary); margin-bottom: 0.5rem; transition: color var(--transition-fast); }
    .card-link:hover .card-title { color: var(--accent-primary); }
    .card-desc { color: var(--text-muted); font-size: 0.85rem; line-height: 1.5;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 1rem; }

    .card-stats { display: flex; gap: 1.25rem; padding: 0.875rem 0; border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); margin-bottom: 1rem; }
    .mini-stat { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8rem; color: var(--text-secondary); }
    .ms-icon { font-size: 0.9rem; }

    .card-bottom { display: flex; justify-content: space-between; align-items: center; }
    .gm-info { display: flex; align-items: center; gap: 0.5rem; }
    .gm-avatar { width: 28px; height: 28px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: #0f0f1a; display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 700; }
    .gm-name { font-size: 0.8rem; color: var(--text-secondary); }

    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .campaigns-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class CampaignListComponent implements OnInit {
  campaigns: any[] = [];
  loading = true;
  showModal = false;
  showDeleteConfirm = false;
  editing = false;
  editingId = '';
  deletingCampaign: any = null;
  formData = { name: '', system: 'DND5E', description: '' };

  constructor(private campaignService: CampaignService) {}

  ngOnInit(): void { this.loadCampaigns(); }

  loadCampaigns(): void {
    this.campaignService.getCampaigns().subscribe({
      next: (res) => { this.campaigns = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCreateModal(): void {
    this.editing = false;
    this.editingId = '';
    this.formData = { name: '', system: 'DND5E', description: '' };
    this.showModal = true;
  }

  openEditModal(campaign: any): void {
    this.editing = true;
    this.editingId = campaign.id;
    this.formData = { name: campaign.name, system: campaign.system, description: campaign.description || '' };
    this.showModal = true;
  }

  onSubmit(): void {
    if (this.editing) {
      this.campaignService.updateCampaign(this.editingId, this.formData).subscribe({
        next: () => { this.showModal = false; this.loadCampaigns(); },
        error: (err) => console.error(err)
      });
    } else {
      this.campaignService.createCampaign(this.formData).subscribe({
        next: () => { this.showModal = false; this.formData = { name: '', system: 'DND5E', description: '' }; this.loadCampaigns(); },
        error: (err) => console.error(err)
      });
    }
  }

  confirmDelete(campaign: any): void {
    this.deletingCampaign = campaign;
    this.showDeleteConfirm = true;
  }

  deleteCampaign(): void {
    if (!this.deletingCampaign) return;
    this.campaignService.deleteCampaign(this.deletingCampaign.id).subscribe({
      next: () => { this.showDeleteConfirm = false; this.deletingCampaign = null; this.loadCampaigns(); },
      error: (err) => console.error(err)
    });
  }

  getSystemIcon(sys: string): string {
    const icons: Record<string, string> = { DND5E: '🐉', T20: '⚡', CoC: '🐙', Pathfinder: '🏰', Other: '🎭' };
    return icons[sys] || '🎭';
  }

  getSystemName(sys: string): string {
    const names: Record<string, string> = { DND5E: 'D&D 5E', T20: 'Tormenta 20', CoC: 'Cthulhu', Pathfinder: 'Pathfinder', Other: 'Outro' };
    return names[sys] || sys;
  }
}
