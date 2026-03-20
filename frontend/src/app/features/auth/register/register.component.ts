import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-bg">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
      </div>

      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">🛡️</div>
          <h1>Campaign Hub</h1>
          <p>Crie sua conta e junte-se à aventura</p>
        </div>

        <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
          <div class="form-group">
            <label class="form-label">Nome</label>
            <div class="input-wrapper">
              <span class="input-icon">👤</span>
              <input type="text" class="form-control" [(ngModel)]="formData.name"
                name="name" required placeholder="Seu nome de aventureiro">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="input-wrapper">
              <span class="input-icon">✉️</span>
              <input type="email" class="form-control" [(ngModel)]="formData.email"
                name="email" required email placeholder="seu@email.com">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Senha</label>
            <div class="input-wrapper">
              <span class="input-icon">🔒</span>
              <input type="password" class="form-control" [(ngModel)]="formData.password"
                name="password" required minlength="6" placeholder="Mínimo 6 caracteres">
            </div>
          </div>

          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>

          <button type="submit" class="btn btn-primary btn-full"
            [disabled]="!registerForm.form.valid || loading">
            {{ loading ? 'Criando conta...' : '🛡️ Criar Conta' }}
          </button>
        </form>

        <div class="auth-footer">
          Já tem uma conta?
          <a routerLink="/auth/login">Entrar</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--bg-primary); position: relative; overflow: hidden;
    }
    .auth-bg { position: absolute; inset: 0; pointer-events: none; }
    .bg-orb { position: absolute; border-radius: 50%; filter: blur(100px); opacity: 0.15; }
    .bg-orb-1 { width: 500px; height: 500px; background: #8b5cf6; top: -20%; right: -10%; animation: pulse 8s ease-in-out infinite; }
    .bg-orb-2 { width: 400px; height: 400px; background: var(--accent-primary); bottom: -15%; left: -5%; animation: pulse 6s ease-in-out infinite reverse; }
    .bg-orb-3 { width: 300px; height: 300px; background: #10b981; top: 50%; left: 20%; animation: pulse 10s ease-in-out infinite; }

    .auth-card {
      background: var(--bg-secondary); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: 2.5rem; width: 100%; max-width: 420px;
      position: relative; z-index: 1; box-shadow: var(--shadow-lg); animation: slideUp 0.5s ease;
    }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-logo { font-size: 3rem; margin-bottom: 0.75rem; }
    .auth-header h1 { font-family: var(--font-display); font-size: 1.75rem; color: var(--accent-primary); margin-bottom: 0.375rem; }
    .auth-header p { color: var(--text-secondary); font-size: 0.875rem; }

    .input-wrapper { position: relative; }
    .input-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); font-size: 0.875rem; pointer-events: none; }
    .input-wrapper .form-control { padding-left: 2.75rem; }

    .error-msg { color: var(--danger); font-size: 0.8rem; margin-bottom: 1rem; padding: 0.5rem 0.75rem;
      background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: var(--radius-sm); }

    .btn-full { width: 100%; margin-top: 0.5rem; padding: 0.875rem; font-size: 0.95rem; }

    .auth-footer { text-align: center; margin-top: 1.5rem; color: var(--text-secondary); font-size: 0.875rem; }
    .auth-footer a { color: var(--accent-primary); font-weight: 600; }
  `]
})
export class RegisterComponent {
  formData = { name: '', email: '', password: '' };
  loading = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.formData.name, this.formData.email, this.formData.password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.errorMessage = err.error?.message || 'Falha no registro. Tente novamente.';
        this.loading = false;
      }
    });
  }
}
