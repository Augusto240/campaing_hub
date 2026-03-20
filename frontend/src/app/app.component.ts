import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <!-- Public Navbar -->
      <nav class="navbar navbar-public" *ngIf="!authService.isAuthenticated">
        <div class="nav-inner">
          <a routerLink="/" class="nav-brand">
            <span class="brand-icon">⚔️</span>
            <span class="brand-text">Campaign Hub</span>
          </a>

          <div class="nav-links">
            <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <span class="nav-icon">🏠</span>
              Início
            </a>
            <a routerLink="/wiki" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📚</span>
              Wiki
            </a>
            <a routerLink="/dice" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🎲</span>
              Dados
            </a>
          </div>

          <div class="nav-right">
            <a routerLink="/auth/login" class="btn btn-ghost">Entrar</a>
            <a routerLink="/auth/register" class="btn btn-accent">Criar Conta</a>
          </div>
        </div>
      </nav>

      <!-- Authenticated Navbar -->
      <nav class="navbar" *ngIf="authService.isAuthenticated">
        <div class="nav-inner">
          <a routerLink="/dashboard" class="nav-brand">
            <span class="brand-icon">⚔️</span>
            <span class="brand-text">Campaign Hub</span>
          </a>

          <div class="nav-links">
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              <span class="nav-icon">📊</span>
              Dashboard
            </a>
            <a routerLink="/campaigns" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🗺️</span>
              Campanhas
            </a>
            <a routerLink="/wiki" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">📚</span>
              Wiki
            </a>
            <a routerLink="/dice" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">🎲</span>
              Dados
            </a>
          </div>

          <div class="nav-right">
            <div class="nav-notifications" title="Notificações">
              🔔
              <span class="notif-badge" *ngIf="(notificationService.unreadCount$ | async)! > 0">
                {{ notificationService.unreadCount$ | async }}
              </span>
            </div>

            <div class="nav-user">
              <div class="user-avatar">{{ getUserInitial() }}</div>
              <span class="user-name">{{ (authService.currentUser$ | async)?.name }}</span>
            </div>

            <button class="btn-logout" (click)="logout()" title="Sair">
              🚪
            </button>
          </div>
        </div>
      </nav>

      <main [class.has-nav]="true">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app {
      min-height: 100vh;
    }

    .navbar {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      padding: 0 1.5rem;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(12px);
    }

    .nav-inner {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 60px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      text-decoration: none;
      color: var(--text-primary);
    }

    .brand-icon {
      font-size: 1.5rem;
    }

    .brand-text {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--accent-primary);
      letter-spacing: 0.025em;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all var(--transition-fast);
      text-decoration: none;
    }

    .nav-link:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.05);
    }

    .nav-link.active {
      color: var(--accent-primary);
      background: rgba(201, 168, 76, 0.1);
    }

    .nav-icon {
      font-size: 1rem;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-ghost {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all var(--transition-fast);
      text-decoration: none;
      border: 1px solid var(--border-color);
    }

    .btn-ghost:hover {
      color: var(--text-primary);
      border-color: var(--text-muted);
    }

    .btn-accent {
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      background: var(--accent-primary);
      color: #0f0f1a;
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .btn-accent:hover {
      filter: brightness(1.15);
      transform: translateY(-1px);
    }

    .nav-notifications {
      position: relative;
      cursor: pointer;
      font-size: 1.125rem;
      padding: 0.375rem;
    }

    .notif-badge {
      position: absolute;
      top: -2px;
      right: -4px;
      background: var(--danger);
      color: white;
      border-radius: 50%;
      width: 18px;
      height: 18px;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .nav-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      color: #0f0f1a;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .user-name {
      font-size: 0.875rem;
      color: var(--text-secondary);
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-logout {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.125rem;
      padding: 0.375rem;
      opacity: 0.6;
      transition: opacity var(--transition-fast);
    }

    .btn-logout:hover {
      opacity: 1;
    }

    main {
      min-height: 100vh;
    }

    main.has-nav {
      min-height: calc(100vh - 60px);
    }

    @media (max-width: 768px) {
      .user-name { display: none; }
      .brand-text { display: none; }
      .nav-link { padding: 0.5rem 0.625rem; font-size: 0; }
      .nav-icon { font-size: 1.25rem; }
      .btn-ghost, .btn-accent { font-size: 0.75rem; padding: 0.375rem 0.75rem; }
    }
  `]
})
export class AppComponent {
  constructor(
    public authService: AuthService,
    public notificationService: NotificationService
  ) {
    this.authService.currentUser$.subscribe(user => {
      if (user && this.authService.isAuthenticated) {
        this.notificationService.getNotifications().subscribe({
          error: () => {}
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
