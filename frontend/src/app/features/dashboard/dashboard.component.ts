import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container">
      <div class="dash-header">
        <div>
          <h1>Bem-vindo, {{ userName }}!</h1>
          <p class="subtitle">Aqui está o resumo das suas aventuras</p>
        </div>
        <a routerLink="/campaigns" class="btn btn-primary">+ Nova Campanha</a>
      </div>

      <div *ngIf="loading" class="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && stats" class="dash-content">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrap dnd">🎲</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalCampaigns }}</div>
              <div class="stat-label">Campanhas</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap session">📅</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalSessions }}</div>
              <div class="stat-label">Sessões</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap char">⚔️</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalCharacters }}</div>
              <div class="stat-label">Personagens</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon-wrap xp">✨</div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalXPAwarded | number }}</div>
              <div class="stat-label">XP Total</div>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="card chart-card">
            <div class="card-header"><h3>📊 Sistemas de Jogo</h3></div>
            <div class="chart-body">
              <div *ngFor="let sys of stats.systemDistribution" class="bar-row">
                <span class="bar-label">{{ getSystemName(sys.system) }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="getSystemPct(sys.count)"
                    [style.background]="getSystemColor(sys.system)"></div>
                </div>
                <span class="bar-value">{{ sys.count }}</span>
              </div>
              <div *ngIf="!stats.systemDistribution?.length" class="empty-state">
                <p>Nenhuma campanha criada ainda</p>
              </div>
            </div>
          </div>

          <div class="card chart-card">
            <div class="card-header"><h3>📅 Sessões por Mês</h3></div>
            <div class="chart-body">
              <div *ngFor="let m of stats.sessionsPerMonth" class="bar-row">
                <span class="bar-label">{{ m.month }}</span>
                <div class="bar-track">
                  <div class="bar-fill accent" [style.width.%]="getMonthPct(m.count)"></div>
                </div>
                <span class="bar-value">{{ m.count }}</span>
              </div>
              <div *ngIf="!stats.sessionsPerMonth?.length" class="empty-state">
                <p>Nenhuma sessão registrada</p>
              </div>
            </div>
          </div>
        </div>

        <div class="card quick-card">
          <div class="card-header"><h3>⚡ Ações Rápidas</h3></div>
          <div class="quick-actions">
            <a routerLink="/campaigns" class="quick-btn">
              <span class="q-icon">🗺️</span>
              <span>Ver Campanhas</span>
            </a>
            <a routerLink="/campaigns" class="quick-btn">
              <span class="q-icon">➕</span>
              <span>Criar Campanha</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dash-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
    }
    .dash-header h1 { font-size: 1.75rem; color: var(--text-primary); }
    .subtitle { color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.25rem; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 1.25rem;
      display: flex; align-items: center; gap: 1rem;
      transition: all var(--transition-normal);
    }
    .stat-card:hover { border-color: var(--border-glow); box-shadow: var(--shadow-glow); transform: translateY(-2px); }
    .stat-icon-wrap {
      width: 52px; height: 52px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
    }
    .stat-icon-wrap.dnd { background: rgba(201,168,76,0.15); }
    .stat-icon-wrap.session { background: rgba(59,130,246,0.15); }
    .stat-icon-wrap.char { background: rgba(239,68,68,0.15); }
    .stat-icon-wrap.xp { background: rgba(139,92,246,0.15); }
    .stat-value { font-size: 1.75rem; font-weight: 700; font-family: var(--font-display); color: var(--accent-primary); }
    .stat-label { font-size: 0.8rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }

    .charts-row {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;
    }
    .chart-card { padding: 1.5rem; }
    .chart-body { padding-top: 0.5rem; }
    .bar-row { display: grid; grid-template-columns: 90px 1fr 40px; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .bar-label { font-size: 0.8rem; color: var(--text-secondary); font-weight: 500; }
    .bar-track { height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; background: var(--accent-primary); }
    .bar-fill.accent { background: var(--accent-secondary); }
    .bar-value { font-size: 0.8rem; color: var(--accent-primary); font-weight: 600; text-align: right; }

    .quick-card { padding: 1.5rem; }
    .quick-actions { display: flex; gap: 1rem; flex-wrap: wrap; padding-top: 0.5rem; }
    .quick-btn {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem;
      background: rgba(201,168,76,0.08); border: 1px solid var(--border-color);
      border-radius: var(--radius-md); color: var(--text-primary); font-size: 0.875rem;
      font-weight: 500; transition: all var(--transition-normal); cursor: pointer; text-decoration: none;
    }
    .quick-btn:hover { border-color: var(--accent-primary); background: rgba(201,168,76,0.15); color: var(--accent-primary); }
    .q-icon { font-size: 1.1rem; }

    @media (max-width: 768px) {
      .dash-header { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .charts-row { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  stats: any = null;
  loading = true;
  userName = '';

  constructor(private dashboardService: DashboardService, private authService: AuthService) {
    this.userName = this.authService.currentUser?.name || 'Aventureiro';
  }

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (res) => { this.stats = res.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getSystemName(sys: string): string {
    const names: Record<string, string> = { DND5E: 'D&D 5E', T20: 'Tormenta 20', CoC: 'Cthulhu', Pathfinder: 'Pathfinder', Other: 'Outro' };
    return names[sys] || sys;
  }

  getSystemColor(sys: string): string {
    const colors: Record<string, string> = { DND5E: '#c9a84c', T20: '#e11d48', CoC: '#059669', Pathfinder: '#2563eb', Other: '#8b5cf6' };
    return colors[sys] || '#8b5cf6';
  }

  getSystemPct(count: number): number {
    return this.stats?.totalCampaigns > 0 ? (count / this.stats.totalCampaigns) * 100 : 0;
  }

  getMonthPct(count: number): number {
    if (!this.stats?.sessionsPerMonth?.length) return 0;
    const max = Math.max(...this.stats.sessionsPerMonth.map((m: any) => m.count));
    return max > 0 ? (count / max) * 100 : 0;
  }
}
