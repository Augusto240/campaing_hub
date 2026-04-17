import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, SessionsPerMonth } from '../../core/types';
import { AppIconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, AppIconComponent],
  template: `
    <div class="container">
      <div class="dash-header">
        <div>
          <h1>Bem-vindo, {{ userName }}.</h1>
          <p class="subtitle">Resumo da campanha viva, pronto para abrir a próxima sessão.</p>
        </div>
        <a routerLink="/campaigns" class="btn btn-primary">
          <app-icon name="map" [size]="16"></app-icon>
          Nova campanha
        </a>
      </div>

      <div *ngIf="loading" class="loading"><div class="spinner"></div></div>

      <div *ngIf="!loading && stats" class="dash-content">
        <div class="stats-grid">
          <article class="stat-card">
            <div class="stat-icon-wrap dnd">
              <app-icon name="dice" [size]="22"></app-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalCampaigns }}</div>
              <div class="stat-label">Campanhas</div>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-icon-wrap session">
              <app-icon name="calendar" [size]="22"></app-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalSessions }}</div>
              <div class="stat-label">Sessões</div>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-icon-wrap char">
              <app-icon name="sword" [size]="22"></app-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalCharacters }}</div>
              <div class="stat-label">Personagens</div>
            </div>
          </article>

          <article class="stat-card">
            <div class="stat-icon-wrap xp">
              <app-icon name="spark" [size]="22"></app-icon>
            </div>
            <div class="stat-body">
              <div class="stat-value">{{ stats.totalXPAwarded | number }}</div>
              <div class="stat-label">XP total</div>
            </div>
          </article>
        </div>

        <div class="charts-row">
          <section class="card chart-card">
            <div class="card-header">
              <h3>
                <app-icon name="book" [size]="16"></app-icon>
                Sistemas de jogo
              </h3>
            </div>
            <div class="chart-body">
              <div *ngFor="let sys of stats.systemDistribution" class="bar-row">
                <span class="bar-label">{{ getSystemName(sys.system) }}</span>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    [style.width.%]="getSystemPct(sys.count)"
                    [style.background]="getSystemColor(sys.system)"
                  ></div>
                </div>
                <span class="bar-value">{{ sys.count }}</span>
              </div>

              <div *ngIf="!stats.systemDistribution?.length" class="empty-state">
                <p>Nenhuma campanha criada ainda.</p>
              </div>
            </div>
          </section>

          <section class="card chart-card">
            <div class="card-header">
              <h3>
                <app-icon name="calendar" [size]="16"></app-icon>
                Sessões por mês
              </h3>
            </div>
            <div class="chart-body">
              <div *ngFor="let month of stats.sessionsPerMonth" class="bar-row">
                <span class="bar-label">{{ month.month }}</span>
                <div class="bar-track">
                  <div class="bar-fill accent" [style.width.%]="getMonthPct(month.count)"></div>
                </div>
                <span class="bar-value">{{ month.count }}</span>
              </div>

              <div *ngIf="!stats.sessionsPerMonth?.length" class="empty-state">
                <p>Nenhuma sessão registrada.</p>
              </div>
            </div>
          </section>
        </div>

        <section class="card quick-card">
          <div class="card-header">
            <h3>
              <app-icon name="spark" [size]="16"></app-icon>
              Ações rápidas
            </h3>
          </div>
          <div class="quick-actions">
            <a routerLink="/campaigns" class="quick-btn">
              <app-icon name="map" [size]="16"></app-icon>
              <span>Ver campanhas</span>
            </a>
            <a routerLink="/campaigns" class="quick-btn">
              <app-icon name="shield" [size]="16"></app-icon>
              <span>Criar campanha</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .dash-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .dash-header h1 {
        margin: 0;
        font-size: 1.85rem;
        color: var(--text-primary);
      }

      .subtitle {
        margin-top: 0.35rem;
        color: var(--text-secondary);
        font-size: 0.95rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .stat-card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1.25rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform var(--transition-normal), border-color var(--transition-normal), box-shadow var(--transition-normal);
      }

      .stat-card:hover {
        transform: translateY(-2px);
        border-color: rgba(201, 168, 76, 0.34);
        box-shadow: 0 18px 34px rgba(0, 0, 0, 0.22);
      }

      .stat-icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: var(--radius-md);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .stat-icon-wrap.dnd {
        background: rgba(201, 168, 76, 0.15);
        color: var(--color-primary-light);
      }

      .stat-icon-wrap.session {
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
      }

      .stat-icon-wrap.char {
        background: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
      }

      .stat-icon-wrap.xp {
        background: rgba(139, 92, 246, 0.15);
        color: #ddd6fe;
      }

      .stat-value {
        font-size: 1.8rem;
        font-weight: 700;
        font-family: var(--font-display);
        color: var(--accent-primary);
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .charts-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
      }

      .chart-card,
      .quick-card {
        padding: 1.4rem;
      }

      .card-header h3 {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
      }

      .chart-body {
        padding-top: 0.8rem;
      }

      .bar-row {
        display: grid;
        grid-template-columns: 100px 1fr 40px;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .bar-label {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 600;
      }

      .bar-track {
        height: 8px;
        border-radius: 4px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.06);
      }

      .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.45s ease;
      }

      .bar-fill.accent {
        background: linear-gradient(90deg, rgba(201, 168, 76, 0.55), rgba(138, 106, 30, 0.95));
      }

      .bar-value {
        font-size: 0.8rem;
        color: var(--accent-primary);
        font-weight: 700;
        text-align: right;
      }

      .quick-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        padding-top: 0.75rem;
      }

      .quick-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.8rem 1.2rem;
        border-radius: var(--radius-md);
        border: 1px solid var(--border-color);
        background: rgba(201, 168, 76, 0.08);
        color: var(--text-primary);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
        transition: border-color var(--transition-normal), background var(--transition-normal), transform var(--transition-normal);
      }

      .quick-btn:hover {
        transform: translateY(-1px);
        border-color: rgba(201, 168, 76, 0.34);
        background: rgba(201, 168, 76, 0.15);
      }

      .empty-state {
        padding: 1rem 0 0.25rem;
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .dash-header {
          flex-direction: column;
          align-items: flex-start;
        }

        .charts-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  stats: DashboardStats | null = null;
  loading = true;
  userName = '';

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly authService: AuthService
  ) {
    this.userName = this.authService.currentUser?.name || 'Aventureiro';
  }

  ngOnInit(): void {
    this.dashboardService.getStats().subscribe({
      next: (response) => {
        this.stats = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getSystemName(system: string): string {
    const names: Record<string, string> = {
      DND5E: 'D&D 5e',
      T20: 'Tormenta 20',
      CoC: 'Call of Cthulhu',
      Pathfinder: 'Pathfinder',
      Other: 'Outro',
    };

    return names[system] || system;
  }

  getSystemColor(system: string): string {
    const colors: Record<string, string> = {
      DND5E: '#c9a84c',
      T20: '#e11d48',
      CoC: '#059669',
      Pathfinder: '#2563eb',
      Other: '#8b5cf6',
    };

    return colors[system] || '#8b5cf6';
  }

  getSystemPct(count: number): number {
    if (!this.stats || this.stats.totalCampaigns <= 0) {
      return 0;
    }

    return (count / this.stats.totalCampaigns) * 100;
  }

  getMonthPct(count: number): number {
    if (!this.stats?.sessionsPerMonth?.length) {
      return 0;
    }

    const max = Math.max(...this.stats.sessionsPerMonth.map((month: SessionsPerMonth) => month.count));
    return max > 0 ? (count / max) * 100 : 0;
  }
}
