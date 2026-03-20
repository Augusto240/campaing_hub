import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CampaignService } from '../../../core/services/campaign.service';
import { CharacterService } from '../../../core/services/character.service';
import { SessionService } from '../../../core/services/session.service';
import { LootService } from '../../../core/services/loot.service';

@Component({
  selector: 'app-campaign-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container" *ngIf="!loading && campaign" [attr.data-system]="campaign.system">

      <!-- Header -->
      <div class="detail-header">
        <div class="header-left">
          <a routerLink="/campaigns" class="back-link">← Voltar</a>
          <h1>{{ campaign.name }}</h1>
          <div class="header-meta">
            <span class="system-badge" [ngClass]="'sys-' + campaign.system.toLowerCase()">
              {{ getSystemIcon(campaign.system) }} {{ getSystemName(campaign.system) }}
            </span>
            <span class="meta-sep">•</span>
            <span class="meta-text">GM: {{ campaign.owner.name }}</span>
            <span class="meta-sep">•</span>
            <span class="meta-text">Criada em {{ campaign.createdAt | date:'dd/MM/yyyy' }}</span>
          </div>
        </div>
        <div class="header-actions">
          <a class="btn btn-outline btn-sm" [routerLink]="['/campaigns', campaign.id, 'wiki']">Wiki</a>
          <a class="btn btn-outline btn-sm" [routerLink]="['/campaigns', campaign.id, 'tools']">Ferramentas</a>
        </div>
      </div>

      <p class="campaign-desc" *ngIf="campaign.description">{{ campaign.description }}</p>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'characters'" (click)="activeTab = 'characters'">
          ⚔️ Personagens <span class="tab-count">{{ characters.length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab === 'sessions'" (click)="activeTab = 'sessions'">
          📅 Sessões <span class="tab-count">{{ sessions.length }}</span>
        </button>
        <button class="tab" [class.active]="activeTab === 'members'" (click)="activeTab = 'members'">
          👥 Membros <span class="tab-count">{{ (campaign.members?.length || 0) + 1 }}</span>
        </button>
      </div>

      <!-- CHARACTERS TAB -->
      <div *ngIf="activeTab === 'characters'" class="tab-content" style="animation: slideUp 0.3s ease;">
        <div class="tab-header">
          <h2>Personagens da Campanha</h2>
          <button class="btn btn-primary btn-sm" (click)="openCharModal()">+ Novo Personagem</button>
        </div>

        <div class="char-grid" *ngIf="characters.length > 0">
          <div *ngFor="let char of characters" class="char-card">
            <div class="char-top">
              <div class="char-avatar">{{ char.name.charAt(0) }}</div>
              <div class="char-info">
                <h4>{{ char.name }}</h4>
                <span class="char-class">{{ char.class }}</span>
              </div>
              <div class="char-actions">
                <button class="btn-ghost btn-sm" (click)="openCharEditModal(char)" title="Editar">✏️</button>
                <button class="btn-ghost btn-sm" (click)="confirmDeleteChar(char)" title="Excluir">🗑️</button>
              </div>
            </div>
            <div class="char-stats-row">
              <div class="cs"><span class="cs-label">Nível</span><span class="cs-val">{{ char.level }}</span></div>
              <div class="cs"><span class="cs-label">XP</span><span class="cs-val">{{ char.xp | number }}</span></div>
              <div class="cs"><span class="cs-label">Jogador</span><span class="cs-val">{{ char.player?.name || '—' }}</span></div>
            </div>
          </div>
        </div>
        <div *ngIf="characters.length === 0" class="empty-state">
          <div class="empty-icon">⚔️</div>
          <h3>Nenhum personagem ainda</h3>
          <p>Adicione personagens a esta campanha</p>
          <button class="btn btn-primary btn-sm" (click)="openCharModal()">Criar Personagem</button>
        </div>
      </div>

      <!-- SESSIONS TAB -->
      <div *ngIf="activeTab === 'sessions'" class="tab-content" style="animation: slideUp 0.3s ease;">
        <div class="tab-header">
          <h2>Sessões</h2>
          <button class="btn btn-primary btn-sm" (click)="openSessionModal()">+ Nova Sessão</button>
        </div>

        <div class="sessions-list" *ngIf="sessions.length > 0">
          <div *ngFor="let s of sessions" class="session-card">
            <div class="session-header">
              <div class="session-date-wrap">
                <span class="session-date">{{ s.date | date:'dd/MM/yyyy' }}</span>
                <span class="session-xp badge badge-primary">✨ {{ s.xpAwarded }} XP</span>
              </div>
              <div class="session-actions">
                <button class="btn-ghost btn-sm" (click)="toggleLoot(s)" title="Ver Loot">
                  💎 {{ s._lootCount || 0 }}
                </button>
                <button class="btn-ghost btn-sm" (click)="openSessionEditModal(s)" title="Editar">✏️</button>
                <button class="btn-ghost btn-sm" (click)="confirmDeleteSession(s)" title="Excluir">🗑️</button>
              </div>
            </div>
            <p class="session-summary">{{ s.summary || 'Sem resumo' }}</p>
            <div class="session-creator">Por {{ s.creator?.name || '—' }}</div>

            <!-- Loot Section (expandable) -->
            <div *ngIf="s._showLoot" class="loot-section">
              <div class="divider"></div>
              <div class="loot-header">
                <h4>💎 Loot da Sessão</h4>
                <button class="btn btn-outline btn-sm" (click)="openLootModal(s)">+ Adicionar</button>
              </div>
              <div *ngIf="s._loot?.length > 0" class="loot-list">
                <div *ngFor="let loot of s._loot" class="loot-item">
                  <div class="loot-info">
                    <span class="loot-name">{{ loot.name }}</span>
                    <span class="loot-desc" *ngIf="loot.description">{{ loot.description }}</span>
                  </div>
                  <div class="loot-meta">
                    <span class="loot-value badge badge-warning">🪙 {{ loot.value }}</span>
                    <span class="loot-assigned" *ngIf="loot.assignedToCharacter">→ {{ loot.assignedToCharacter.name }}</span>
                  </div>
                  <div class="loot-actions">
                    <button class="btn-ghost btn-sm" (click)="openLootAssign(loot, s)" title="Atribuir">👤</button>
                    <button class="btn-ghost btn-sm" (click)="confirmDeleteLoot(loot)" title="Excluir">🗑️</button>
                  </div>
                </div>
              </div>
              <div *ngIf="!s._loot?.length" class="empty-msg">Nenhum loot nesta sessão</div>
            </div>
          </div>
        </div>
        <div *ngIf="sessions.length === 0" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Nenhuma sessão registrada</h3>
          <p>Registre a primeira sessão desta campanha</p>
          <button class="btn btn-primary btn-sm" (click)="openSessionModal()">Nova Sessão</button>
        </div>
      </div>

      <!-- MEMBERS TAB -->
      <div *ngIf="activeTab === 'members'" class="tab-content" style="animation: slideUp 0.3s ease;">
        <div class="tab-header"><h2>Membros da Campanha</h2></div>
        <div class="members-grid">
          <div class="member-card owner">
            <div class="member-avatar gm">{{ campaign.owner.name.charAt(0) }}</div>
            <div class="member-info">
              <span class="member-name">{{ campaign.owner.name }}</span>
              <span class="member-role badge badge-primary">GM / Dono</span>
            </div>
          </div>
          <div *ngFor="let m of campaign.members" class="member-card">
            <div class="member-avatar">{{ m.user.name.charAt(0) }}</div>
            <div class="member-info">
              <span class="member-name">{{ m.user.name }}</span>
              <span class="member-role badge badge-info">{{ m.role }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="loading"><div class="spinner"></div></div>

    <!-- CHARACTER MODAL -->
    <div *ngIf="showCharModal" class="modal-overlay" (click)="showCharModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingChar ? '✏️ Editar Personagem' : '⚔️ Novo Personagem' }}</h2>
          <button class="close-btn" (click)="showCharModal = false">×</button>
        </div>
        <form (ngSubmit)="submitChar()">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <input type="text" class="form-control" [(ngModel)]="charForm.name" name="charName" required placeholder="Ex: Aragorn">
          </div>
          <div class="form-group">
            <label class="form-label">Classe</label>
            <input type="text" class="form-control" [(ngModel)]="charForm.class" name="charClass" required placeholder="Ex: Guerreiro">
          </div>
          <div *ngIf="editingChar" class="form-row">
            <div class="form-group">
              <label class="form-label">Nível</label>
              <input type="number" class="form-control" [(ngModel)]="charForm.level" name="charLevel" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">XP</label>
              <input type="number" class="form-control" [(ngModel)]="charForm.xp" name="charXp" min="0">
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="showCharModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!charForm.name || !charForm.class">
              {{ editingChar ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- SESSION MODAL -->
    <div *ngIf="showSessionModal" class="modal-overlay" (click)="showSessionModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ editingSession ? '✏️ Editar Sessão' : '📅 Nova Sessão' }}</h2>
          <button class="close-btn" (click)="showSessionModal = false">×</button>
        </div>
        <form (ngSubmit)="submitSession()">
          <div class="form-group">
            <label class="form-label">Data</label>
            <input type="date" class="form-control" [(ngModel)]="sessionForm.date" name="sessionDate" required>
          </div>
          <div class="form-group">
            <label class="form-label">XP Concedido</label>
            <input type="number" class="form-control" [(ngModel)]="sessionForm.xpAwarded" name="sessionXp" min="0" placeholder="0">
          </div>
          <div class="form-group">
            <label class="form-label">Resumo</label>
            <textarea class="form-control" [(ngModel)]="sessionForm.summary" name="sessionSummary"
              rows="4" placeholder="O que aconteceu nesta sessão..."></textarea>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="showSessionModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!sessionForm.date">
              {{ editingSession ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- LOOT MODAL -->
    <div *ngIf="showLootModal" class="modal-overlay" (click)="showLootModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>💎 Novo Loot</h2>
          <button class="close-btn" (click)="showLootModal = false">×</button>
        </div>
        <form (ngSubmit)="submitLoot()">
          <div class="form-group">
            <label class="form-label">Nome do Item</label>
            <input type="text" class="form-control" [(ngModel)]="lootForm.name" name="lootName" required placeholder="Ex: Espada Flamejante">
          </div>
          <div class="form-group">
            <label class="form-label">Descrição</label>
            <textarea class="form-control" [(ngModel)]="lootForm.description" name="lootDesc" rows="3" placeholder="Descrição do item..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Valor (gold)</label>
            <input type="number" class="form-control" [(ngModel)]="lootForm.value" name="lootValue" min="0" placeholder="0">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="showLootModal = false">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="!lootForm.name">Criar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- ASSIGN LOOT MODAL -->
    <div *ngIf="showAssignModal" class="modal-overlay" (click)="showAssignModal = false">
      <div class="modal" style="max-width: 420px;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>👤 Atribuir Loot</h2>
          <button class="close-btn" (click)="showAssignModal = false">×</button>
        </div>
        <div style="padding: 1.5rem;">
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Atribuir <strong style="color: var(--accent-primary);">{{ assigningLoot?.name }}</strong> a um personagem:
          </p>
          <div class="assign-list">
            <button *ngFor="let c of characters" class="assign-item" (click)="assignLootTo(c.id)">
              <span class="assign-avatar">{{ c.name.charAt(0) }}</span>
              <span>{{ c.name }}</span>
              <span class="assign-class">{{ c.class }}</span>
            </button>
            <button class="assign-item unassign" (click)="assignLootTo(null)">
              <span class="assign-avatar">✕</span>
              <span>Desatribuir</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- DELETE CONFIRMATION -->
    <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="showDeleteConfirm = false">
      <div class="modal" style="max-width: 420px;" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>⚠️ Confirmar Exclusão</h2>
          <button class="close-btn" (click)="showDeleteConfirm = false">×</button>
        </div>
        <div style="padding: 1.5rem;">
          <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
            Tem certeza que deseja excluir <strong style="color: var(--accent-primary);">{{ deleteTarget?.name }}</strong>?
          </p>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showDeleteConfirm = false">Cancelar</button>
            <button class="btn btn-danger" (click)="executeDelete()">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .detail-header { margin-bottom: 1rem; display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .back-link { color: var(--text-secondary); font-size: 0.8rem; display: inline-block; margin-bottom: 0.5rem; text-decoration: none; }
    .back-link:hover { color: var(--accent-primary); }
    .detail-header h1 { font-size: 2rem; margin-bottom: 0.5rem; }
    .header-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .meta-sep { color: var(--text-muted); }
    .meta-text { color: var(--text-secondary); font-size: 0.85rem; }
    .campaign-desc { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.6; }

    .system-badge { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem;
      border-radius: 9999px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
    .sys-dnd5e { background: rgba(201,168,76,0.15); color: #c9a84c; border: 1px solid rgba(201,168,76,0.3); }
    .sys-pf2e { background: rgba(37,99,235,0.15); color: #2563eb; border: 1px solid rgba(37,99,235,0.3); }
    .sys-coc7e { background: rgba(5,150,105,0.15); color: #059669; border: 1px solid rgba(5,150,105,0.3); }
    .sys-tormenta20 { background: rgba(225,29,72,0.15); color: #e11d48; border: 1px solid rgba(225,29,72,0.3); }
    .sys-t20 { background: rgba(225,29,72,0.15); color: #e11d48; border: 1px solid rgba(225,29,72,0.3); }
    .sys-coc { background: rgba(5,150,105,0.15); color: #059669; border: 1px solid rgba(5,150,105,0.3); }
    .sys-pathfinder { background: rgba(37,99,235,0.15); color: #2563eb; border: 1px solid rgba(37,99,235,0.3); }
    .sys-other { background: rgba(139,92,246,0.15); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.3); }

    /* Tabs */
    .tabs { display: flex; gap: 0.25rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0; }
    .tab {
      background: none; border: none; padding: 0.75rem 1.25rem; font-size: 0.875rem; font-weight: 500;
      color: var(--text-secondary); cursor: pointer; border-bottom: 2px solid transparent;
      transition: all var(--transition-fast); display: flex; align-items: center; gap: 0.5rem; font-family: var(--font-body);
    }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
    .tab-count { background: rgba(201,168,76,0.15); color: var(--accent-primary); padding: 0.125rem 0.5rem;
      border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }

    .tab-content { min-height: 300px; }
    .tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; }
    .tab-header h2 { font-size: 1.25rem; }

    /* Characters */
    .char-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    .char-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      padding: 1.25rem; transition: all var(--transition-normal);
    }
    .char-card:hover { border-color: var(--border-glow); box-shadow: var(--shadow-glow); }
    .char-top { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; }
    .char-avatar {
      width: 44px; height: 44px; border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: #0f0f1a; display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; font-family: var(--font-display);
    }
    .char-info { flex: 1; }
    .char-info h4 { font-size: 1rem; margin-bottom: 0.125rem; }
    .char-class { color: var(--text-secondary); font-size: 0.8rem; }
    .char-actions { display: flex; gap: 0.25rem; }
    .char-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; }
    .cs { background: rgba(255,255,255,0.03); padding: 0.5rem; border-radius: var(--radius-sm); text-align: center; }
    .cs-label { display: block; font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .cs-val { display: block; font-size: 0.9rem; font-weight: 600; color: var(--accent-primary); margin-top: 0.125rem; }

    /* Sessions */
    .sessions-list { display: flex; flex-direction: column; gap: 1rem; }
    .session-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg);
      padding: 1.25rem; transition: all var(--transition-normal);
    }
    .session-card:hover { border-color: var(--border-glow); }
    .session-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .session-date-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .session-date { font-weight: 600; color: var(--accent-primary); font-family: var(--font-display); }
    .session-actions { display: flex; gap: 0.25rem; }
    .session-summary { color: var(--text-secondary); font-size: 0.875rem; line-height: 1.6; margin-bottom: 0.5rem; }
    .session-creator { font-size: 0.75rem; color: var(--text-muted); }

    /* Loot */
    .loot-section { margin-top: 0.5rem; }
    .loot-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .loot-header h4 { font-size: 0.9rem; color: var(--accent-primary); }
    .loot-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .loot-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
      background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); flex-wrap: wrap;
    }
    .loot-info { flex: 1; min-width: 150px; }
    .loot-name { font-weight: 500; font-size: 0.875rem; display: block; }
    .loot-desc { font-size: 0.75rem; color: var(--text-muted); display: block; }
    .loot-meta { display: flex; align-items: center; gap: 0.5rem; }
    .loot-assigned { font-size: 0.75rem; color: var(--info); }
    .loot-actions { display: flex; gap: 0.25rem; }
    .empty-msg { text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.85rem; }

    /* Members */
    .members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .member-card {
      display: flex; align-items: center; gap: 1rem; padding: 1rem;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); transition: all var(--transition-normal);
    }
    .member-card:hover { border-color: var(--border-glow); }
    .member-card.owner { border-color: rgba(201,168,76,0.3); }
    .member-avatar {
      width: 44px; height: 44px; border-radius: 50%;
      background: var(--bg-secondary); color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; font-weight: 700; font-family: var(--font-display);
    }
    .member-avatar.gm {
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); color: #0f0f1a;
    }
    .member-info { display: flex; flex-direction: column; gap: 0.25rem; }
    .member-name { font-weight: 500; }
    .member-role { font-size: 0.7rem; }

    /* Assign */
    .assign-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .assign-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-sm); cursor: pointer; transition: all var(--transition-fast);
      font-family: var(--font-body); font-size: 0.875rem; color: var(--text-primary);
    }
    .assign-item:hover { border-color: var(--accent-primary); background: rgba(201,168,76,0.05); }
    .assign-item.unassign { border-color: rgba(239,68,68,0.2); }
    .assign-item.unassign:hover { border-color: var(--danger); }
    .assign-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: #0f0f1a; display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem; font-weight: 700;
    }
    .assign-class { margin-left: auto; color: var(--text-muted); font-size: 0.8rem; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    @media (max-width: 768px) {
      .detail-header { flex-direction: column; }
      .tabs { overflow-x: auto; }
      .char-grid { grid-template-columns: 1fr; }
      .header-meta { flex-direction: column; align-items: flex-start; gap: 0.25rem; }
      .meta-sep { display: none; }
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class CampaignDetailComponent implements OnInit {
  campaign: any = null;
  characters: any[] = [];
  sessions: any[] = [];
  loading = true;
  activeTab = 'characters';
  campaignId = '';

  // Character modal
  showCharModal = false;
  editingChar = false;
  editingCharId = '';
  charForm = { name: '', class: '', level: 1, xp: 0 };

  // Session modal
  showSessionModal = false;
  editingSession = false;
  editingSessionId = '';
  sessionForm = { date: '', summary: '', xpAwarded: 0 };

  // Loot modal
  showLootModal = false;
  lootSessionId = '';
  lootForm = { name: '', description: '', value: 0 };

  // Assign loot
  showAssignModal = false;
  assigningLoot: any = null;
  assigningSessionRef: any = null;

  // Delete confirmation
  showDeleteConfirm = false;
  deleteTarget: any = null;
  deleteType = ''; // 'character', 'session', 'loot'

  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private characterService: CharacterService,
    private sessionService: SessionService,
    private lootService: LootService
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    if (this.campaignId) {
      this.loadAll();
    }
  }

  loadAll(): void {
    this.loading = true;
    this.campaignService.getCampaignById(this.campaignId).subscribe({
      next: (res) => {
        this.campaign = res.data;
        this.loading = false;
        this.loadCharacters();
        this.loadSessions();
      },
      error: () => { this.loading = false; }
    });
  }

  loadCharacters(): void {
    this.characterService.getCharactersByCampaign(this.campaignId).subscribe({
      next: (res) => { this.characters = res.data; },
      error: () => {}
    });
  }

  loadSessions(): void {
    this.sessionService.getSessionsByCampaign(this.campaignId).subscribe({
      next: (res) => {
        this.sessions = (res.data || []).map((s: any) => ({
          ...s,
          _showLoot: false,
          _loot: [],
          _lootCount: s.loot?.length || 0
        }));
      },
      error: () => {}
    });
  }

  // --- Characters ---
  openCharModal(): void {
    this.editingChar = false;
    this.charForm = { name: '', class: '', level: 1, xp: 0 };
    this.showCharModal = true;
  }

  openCharEditModal(char: any): void {
    this.editingChar = true;
    this.editingCharId = char.id;
    this.charForm = { name: char.name, class: char.class, level: char.level, xp: char.xp };
    this.showCharModal = true;
  }

  submitChar(): void {
    if (this.editingChar) {
      this.characterService.updateCharacter(this.editingCharId, this.charForm).subscribe({
        next: () => { this.showCharModal = false; this.loadCharacters(); },
        error: (err) => console.error(err)
      });
    } else {
      this.characterService.createCharacter({
        name: this.charForm.name, class: this.charForm.class, campaignId: this.campaignId
      }).subscribe({
        next: () => { this.showCharModal = false; this.loadCharacters(); },
        error: (err) => console.error(err)
      });
    }
  }

  confirmDeleteChar(char: any): void {
    this.deleteTarget = char;
    this.deleteType = 'character';
    this.showDeleteConfirm = true;
  }

  // --- Sessions ---
  openSessionModal(): void {
    this.editingSession = false;
    this.sessionForm = { date: new Date().toISOString().split('T')[0], summary: '', xpAwarded: 0 };
    this.showSessionModal = true;
  }

  openSessionEditModal(s: any): void {
    this.editingSession = true;
    this.editingSessionId = s.id;
    const d = new Date(s.date);
    this.sessionForm = {
      date: d.toISOString().split('T')[0],
      summary: s.summary || '',
      xpAwarded: s.xpAwarded
    };
    this.showSessionModal = true;
  }

  submitSession(): void {
    if (this.editingSession) {
      this.sessionService.updateSession(this.editingSessionId, this.sessionForm).subscribe({
        next: () => { this.showSessionModal = false; this.loadSessions(); },
        error: (err) => console.error(err)
      });
    } else {
      this.sessionService.createSession({
        campaignId: this.campaignId, ...this.sessionForm
      }).subscribe({
        next: () => { this.showSessionModal = false; this.loadSessions(); },
        error: (err) => console.error(err)
      });
    }
  }

  confirmDeleteSession(s: any): void {
    this.deleteTarget = s;
    this.deleteType = 'session';
    this.showDeleteConfirm = true;
  }

  // --- Loot ---
  toggleLoot(session: any): void {
    session._showLoot = !session._showLoot;
    if (session._showLoot && !session._lootLoaded) {
      this.lootService.getLootBySession(session.id).subscribe({
        next: (res) => {
          session._loot = res.data;
          session._lootCount = res.data.length;
          session._lootLoaded = true;
        },
        error: () => {}
      });
    }
  }

  openLootModal(session: any): void {
    this.lootSessionId = session.id;
    this.lootForm = { name: '', description: '', value: 0 };
    this.showLootModal = true;
  }

  submitLoot(): void {
    this.lootService.createLoot({
      sessionId: this.lootSessionId, campaignId: this.campaignId, ...this.lootForm
    }).subscribe({
      next: () => {
        this.showLootModal = false;
        // reload loot for that session
        const s = this.sessions.find((s: any) => s.id === this.lootSessionId);
        if (s) { s._lootLoaded = false; this.toggleLoot(s); s._showLoot = false; this.toggleLoot(s); }
      },
      error: (err) => console.error(err)
    });
  }

  openLootAssign(loot: any, session: any): void {
    this.assigningLoot = loot;
    this.assigningSessionRef = session;
    this.showAssignModal = true;
  }

  assignLootTo(characterId: string | null): void {
    this.lootService.assignLoot(this.assigningLoot.id, characterId).subscribe({
      next: () => {
        this.showAssignModal = false;
        if (this.assigningSessionRef) {
          this.assigningSessionRef._lootLoaded = false;
          this.assigningSessionRef._showLoot = false;
          this.toggleLoot(this.assigningSessionRef);
        }
      },
      error: (err) => console.error(err)
    });
  }

  confirmDeleteLoot(loot: any): void {
    this.deleteTarget = loot;
    this.deleteType = 'loot';
    this.showDeleteConfirm = true;
  }

  // --- Delete ---
  executeDelete(): void {
    if (!this.deleteTarget) return;
    switch (this.deleteType) {
      case 'character':
        this.characterService.deleteCharacter(this.deleteTarget.id).subscribe({
          next: () => { this.showDeleteConfirm = false; this.loadCharacters(); },
          error: (err) => console.error(err)
        });
        break;
      case 'session':
        this.sessionService.deleteSession(this.deleteTarget.id).subscribe({
          next: () => { this.showDeleteConfirm = false; this.loadSessions(); },
          error: (err) => console.error(err)
        });
        break;
      case 'loot':
        this.lootService.deleteLoot(this.deleteTarget.id).subscribe({
          next: () => { this.showDeleteConfirm = false; this.loadSessions(); },
          error: (err) => console.error(err)
        });
        break;
    }
  }

  getSystemIcon(sys: string): string {
    const key = (sys || '').toLowerCase();
    const icons: Record<string, string> = {
      dnd5e: 'd20',
      pf2e: 'PF',
      coc7e: 'CoC',
      tormenta20: 'T20',
      t20: 'T20',
      coc: 'CoC',
      pathfinder: 'PF',
      other: 'RPG'
    };
    return icons[key] || 'RPG';
  }

  getSystemName(sys: string): string {
    const key = (sys || '').toLowerCase();
    const names: Record<string, string> = {
      dnd5e: 'D&D 5e',
      pf2e: 'Pathfinder 2e',
      coc7e: 'Call of Cthulhu 7e',
      tormenta20: 'Tormenta20',
      t20: 'Tormenta20',
      coc: 'Call of Cthulhu',
      pathfinder: 'Pathfinder',
      other: 'Outro'
    };
    return names[key] || sys;
  }
}


