import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppIconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AppIconComponent],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
      </div>

      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            <app-icon name="shield" [size]="38"></app-icon>
          </div>
          <h1>Campaign Hub</h1>
          <p>Crie sua conta e entre na mesa viva.</p>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-icon name="user" [size]="16"></app-icon>
              </span>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="formData.name"
                name="name"
                required
                placeholder="Seu nome de aventureiro"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-icon name="mail" [size]="16"></app-icon>
              </span>
              <input
                type="email"
                class="form-control"
                [(ngModel)]="formData.email"
                name="email"
                required
                email
                placeholder="seu@email.com"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-wrapper">
              <span class="input-icon">
                <app-icon name="lock" [size]="16"></app-icon>
              </span>
              <input
                type="password"
                class="form-control"
                [(ngModel)]="formData.password"
                name="password"
                required
                minlength="6"
                placeholder="Mínimo de 6 caracteres"
              >
            </div>
          </div>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" class="btn btn-primary btn-full" [disabled]="!registerForm.form.valid || loading">
            <app-icon *ngIf="!loading" name="shield" [size]="16"></app-icon>
            {{ loading ? 'Criando conta...' : 'Criar conta' }}
          </button>
        </form>

        <div class="auth-footer">
          Já tem uma conta?
          <a routerLink="/auth/login">Entrar</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .auth-page {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-primary);
        position: relative;
        overflow: hidden;
      }

      .auth-bg {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .bg-orb {
        position: absolute;
        border-radius: 50%;
        filter: blur(100px);
        opacity: 0.15;
      }

      .bg-orb-1 {
        width: 500px;
        height: 500px;
        background: #8b5cf6;
        top: -20%;
        right: -10%;
        animation: pulse 8s ease-in-out infinite;
      }

      .bg-orb-2 {
        width: 420px;
        height: 420px;
        background: var(--accent-primary);
        bottom: -15%;
        left: -5%;
        animation: pulse 6s ease-in-out infinite reverse;
      }

      .bg-orb-3 {
        width: 320px;
        height: 320px;
        background: #10b981;
        top: 50%;
        left: 20%;
        animation: pulse 10s ease-in-out infinite;
      }

      .auth-card {
        width: 100%;
        max-width: 430px;
        padding: 2.5rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        background: linear-gradient(180deg, rgba(25, 24, 34, 0.96), rgba(14, 14, 20, 0.98));
        position: relative;
        z-index: 1;
        box-shadow: 0 30px 80px rgba(0, 0, 0, 0.34);
      }

      .auth-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .auth-logo {
        width: 72px;
        height: 72px;
        margin: 0 auto 0.9rem;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--accent-primary);
        background: radial-gradient(circle, rgba(201, 168, 76, 0.2), rgba(201, 168, 76, 0.06));
        box-shadow: var(--shadow-arcane);
      }

      .auth-header h1 {
        margin: 0 0 0.35rem;
        color: var(--accent-primary);
        font-family: var(--font-display);
        font-size: 1.8rem;
      }

      .auth-header p {
        margin: 0;
        color: var(--text-secondary);
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-label {
        display: block;
        margin-bottom: 0.35rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      .input-wrapper {
        position: relative;
      }

      .input-icon {
        position: absolute;
        left: 0.95rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        pointer-events: none;
      }

      .input-wrapper .form-control {
        padding-left: 2.8rem;
      }

      .error-msg {
        margin-bottom: 1rem;
        padding: 0.65rem 0.8rem;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(239, 68, 68, 0.25);
        background: rgba(239, 68, 68, 0.1);
        color: #fda4a4;
        font-size: 0.85rem;
      }

      .btn-full {
        width: 100%;
        margin-top: 0.4rem;
        padding: 0.9rem 1rem;
        font-size: 0.95rem;
      }

      .auth-footer {
        margin-top: 1.4rem;
        text-align: center;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .auth-footer a {
        color: var(--accent-primary);
        font-weight: 700;
      }
    `,
  ],
})
export class RegisterComponent {
  formData = { name: '', email: '', password: '' };
  loading = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.formData.name, this.formData.email, this.formData.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (error) => {
        this.errorMessage = error.error?.message || 'Falha no registro. Tente novamente.';
        this.loading = false;
      },
    });
  }
}
