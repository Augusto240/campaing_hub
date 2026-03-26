import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { MarkdownViewerComponent } from '../../../shared/components/markdown-viewer.component';

type SessionView = {
  id: string;
  date: string;
  narrativeLog?: string | null;
  privateGmNotes?: string | null;
  highlights?: string[];
};

type CampaignView = {
  id: string;
  ownerId: string;
  members: Array<{ role: 'GM' | 'PLAYER'; user: { id: string } }>;
};

@Component({
  selector: 'app-campaign-log',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownViewerComponent],
  template: `
    <article class="card panel">
      <h2>Log Narrativo</h2>
      <select class="form-control" [(ngModel)]="selectedSessionId" (change)="onSessionChange()">
        <option *ngFor="let session of sessions" [value]="session.id">{{ session.date | date:'dd/MM/yyyy' }}</option>
      </select>
      <textarea class="form-control area" [(ngModel)]="logForm.narrativeLog" placeholder="Narrativa publica"></textarea>
      <input class="form-control" [(ngModel)]="logForm.highlightsInput" placeholder="Highlights separados por virgula" />
      <textarea *ngIf="isGm" class="form-control area" [(ngModel)]="logForm.privateGmNotes" placeholder="Notas do GM"></textarea>
      <button class="btn btn-primary btn-sm" (click)="saveLog()" [disabled]="saving || !selectedSessionId">Salvar</button>
      <app-markdown-viewer [content]="logPreview"></app-markdown-viewer>
    </article>
  `,
  styles: [
    `
      .panel { padding: 1rem; display: grid; gap: 0.75rem; }
      .panel h2 { margin: 0.7rem 0; }
      .area { min-height: 9rem; }
    `,
  ],
})
export class CampaignLogComponent implements OnChanges {
  @Input() sessions: SessionView[] = [];
  @Input() campaign: CampaignView | null = null;
  @Output() sessionSelected = new EventEmitter<string>();

  selectedSessionId = '';
  saving = false;
  logForm = { narrativeLog: '', privateGmNotes: '', highlightsInput: '' };

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService
  ) {}

  get isGm(): boolean {
    const user = this.authService.currentUser;
    return !!(
      user &&
      this.campaign &&
      (this.campaign.ownerId === user.id ||
        this.campaign.members.some((m) => m.user.id === user.id && m.role === 'GM'))
    );
  }

  get logPreview(): string {
    return [this.logForm.narrativeLog, this.logForm.highlightsInput].filter(Boolean).join('\n\n');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sessions'] && this.sessions.length > 0 && !this.selectedSessionId) {
      this.selectedSessionId = this.sessions[0].id;
      this.syncLogForm();
      this.sessionSelected.emit(this.selectedSessionId);
    }
  }

  onSessionChange(): void {
    this.syncLogForm();
    this.sessionSelected.emit(this.selectedSessionId);
  }

  private syncLogForm(): void {
    const session = this.sessions.find((s) => s.id === this.selectedSessionId);
    if (!session) return;
    this.logForm = {
      narrativeLog: session.narrativeLog || '',
      privateGmNotes: session.privateGmNotes || '',
      highlightsInput: (session.highlights || []).join(', '),
    };
  }

  saveLog(): void {
    if (!this.selectedSessionId) return;
    this.saving = true;
    this.sessionService
      .updateSessionLog(this.selectedSessionId, {
        narrativeLog: this.logForm.narrativeLog,
        privateGmNotes: this.isGm ? this.logForm.privateGmNotes : undefined,
        highlights: this.logForm.highlightsInput
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      })
      .subscribe({
        next: () => {
          this.saving = false;
        },
        error: () => {
          this.saving = false;
        },
      });
  }
}
