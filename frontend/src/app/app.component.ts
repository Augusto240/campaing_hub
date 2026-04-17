import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { AppIconComponent } from './shared/components/icon.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AppIconComponent],
  template: `
    <div class="app-shell">
      <nav class="navbar navbar-public" *ngIf="!authService.isAuthenticated">
        <div class="nav-inner">
          <a routerLink="/" class="nav-brand">
            <app-icon name="sword" class="brand-icon" [size]="24"></app-icon>
            <span class="brand-text">Campaign Hub</span>
          </a>

          <div class="nav-links">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
              <app-icon name="home" [size]="16"></app-icon>
              Início
            </a>
            <a routerLink="/wiki" routerLinkActive="active" class="nav-link">
              <app-icon name="book" [size]="16"></app-icon>
              Wiki
            </a>
            <a routerLink="/dice" routerLinkActive="active" class="nav-link">
              <app-icon name="dice" [size]="16"></app-icon>
              Dados
            </a>
          </div>

          <div class="nav-right">
            <a routerLink="/auth/login" class="btn btn-ghost">Entrar</a>
            <a routerLink="/auth/register" class="btn btn-accent">Criar conta</a>
          </div>
        </div>
      </nav>

      <nav class="navbar" *ngIf="authService.isAuthenticated">
        <div class="nav-inner">
          <a routerLink="/dashboard" class="nav-brand">
            <app-icon name="sword" class="brand-icon" [size]="24"></app-icon>
            <span class="brand-text">Campaign Hub</span>
          </a>

          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="nav-link">
              <app-icon name="spark" [size]="16"></app-icon>
              Dashboard
            </a>
            <a routerLink="/campaigns" routerLinkActive="active" class="nav-link">
              <app-icon name="map" [size]="16"></app-icon>
              Campanhas
            </a>
            <a routerLink="/wiki" routerLinkActive="active" class="nav-link">
              <app-icon name="book" [size]="16"></app-icon>
              Wiki
            </a>
            <a routerLink="/dice" routerLinkActive="active" class="nav-link">
              <app-icon name="dice" [size]="16"></app-icon>
              Dados
            </a>
          </div>

          <div class="nav-right">
            <div class="nav-notifications" title="Notificações">
              <app-icon name="bell" [size]="18"></app-icon>
              <span class="notif-badge" *ngIf="(notificationService.unreadCount$ | async)! > 0">
                {{ notificationService.unreadCount$ | async }}
              </span>
            </div>

            <div class="nav-user">
              <div class="user-avatar">{{ getUserInitial() }}</div>
              <span class="user-name">{{ (authService.currentUser$ | async)?.name }}</span>
            </div>

            <button class="btn-logout" type="button" (click)="logout()" title="Sair">
              <app-icon name="logout" [size]="18"></app-icon>
            </button>
          </div>
        </div>
      </nav>

      <main class="page-shell">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .app-shell {
        min-height: 100vh;
      }

      .navbar {
        position: sticky;
        top: 0;
        z-index: 100;
        padding: 0 1.5rem;
        background: color-mix(in srgb, var(--bg-secondary) 92%, transparent);
        border-bottom: 1px solid var(--border-color);
        backdrop-filter: blur(14px);
      }

      .navbar-public {
        background:
          linear-gradient(180deg, rgba(15, 15, 26, 0.96), rgba(17, 17, 24, 0.92)),
          radial-gradient(circle at top, rgba(201, 168, 76, 0.12), transparent 38%);
      }

      .nav-inner {
        max-width: 1280px;
        height: 64px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .nav-brand {
        display: inline-flex;
        align-items: center;
        gap: 0.7rem;
        color: var(--text-primary);
        text-decoration: none;
      }

      .brand-icon {
        color: var(--accent-primary);
        filter: drop-shadow(0 0 12px rgba(201, 168, 76, 0.35));
      }

      .brand-text {
        color: var(--accent-primary);
        font-family: var(--font-display);
        font-size: 1.1rem;
        font-weight: 700;
        letter-spacing: 0.035em;
      }

      .nav-links {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .nav-link {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 0.95rem;
        border-radius: 999px;
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 600;
        transition: background var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
      }

      .nav-link:hover {
        color: var(--text-primary);
        background: rgba(255, 255, 255, 0.05);
        transform: translateY(-1px);
      }

      .nav-link.active {
        color: var(--accent-primary);
        background: rgba(201, 168, 76, 0.12);
        border: 1px solid rgba(201, 168, 76, 0.2);
      }

      .nav-right {
        display: flex;
        align-items: center;
        gap: 0.85rem;
      }

      .btn-ghost {
        padding: 0.5rem 0.95rem;
        border-radius: 999px;
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 600;
        border: 1px solid var(--border-color);
        transition: border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
      }

      .btn-ghost:hover {
        color: var(--text-primary);
        border-color: rgba(201, 168, 76, 0.28);
        transform: translateY(-1px);
      }

      .btn-accent {
        padding: 0.55rem 1rem;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        color: #15120a;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 700;
        transition: transform var(--transition-fast), filter var(--transition-fast);
        box-shadow: var(--shadow-arcane);
      }

      .btn-accent:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }

      .nav-notifications {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.35rem;
        height: 2.35rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
      }

      .notif-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        padding: 0 0.25rem;
        border-radius: 999px;
        background: var(--danger);
        color: #fff;
        font-size: 0.65rem;
        font-weight: 700;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .nav-user {
        display: flex;
        align-items: center;
        gap: 0.55rem;
      }

      .user-avatar {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
        color: #15120a;
        font-size: 0.85rem;
        font-weight: 700;
      }

      .user-name {
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .btn-logout {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.35rem;
        height: 2.35rem;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.03);
        color: var(--text-secondary);
        cursor: pointer;
        transition: color var(--transition-fast), border-color var(--transition-fast), transform var(--transition-fast);
      }

      .btn-logout:hover {
        color: var(--text-primary);
        border-color: rgba(201, 168, 76, 0.24);
        transform: translateY(-1px);
      }

      .page-shell {
        min-height: calc(100vh - 64px);
      }

      @media (max-width: 920px) {
        .nav-inner {
          flex-wrap: wrap;
          height: auto;
          padding: 0.75rem 0;
        }
      }

      @media (max-width: 768px) {
        .brand-text,
        .user-name {
          display: none;
        }

        .nav-links {
          gap: 0.2rem;
        }

        .nav-link {
          padding: 0.55rem 0.7rem;
          font-size: 0;
        }

        .btn-ghost,
        .btn-accent {
          padding: 0.45rem 0.8rem;
          font-size: 0.8rem;
        }
      }
    `,
  ],
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    public notificationService: NotificationService
  ) {
    this.authService.currentUser$.subscribe((user) => {
      if (user && this.authService.isAuthenticated) {
        this.notificationService.getNotifications().subscribe({
          error: () => {},
        });
      }
    });
  }

  getUserInitial(): string {
    const user = this.authService.currentUser;
    return user?.name?.charAt(0)?.toUpperCase() || '?';
  }

  logout(): void {
    this.authService.logout();
  }
}
