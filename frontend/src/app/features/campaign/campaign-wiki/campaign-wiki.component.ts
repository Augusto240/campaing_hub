import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { WikiCategory, WikiService } from '../../../core/services/wiki.service';

@Component({
  selector: 'app-campaign-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container wiki-wrapper">
      <div class="wiki-header">
        <a class="back-link" [routerLink]="['/campaigns', campaignId]">← Voltar para campanha</a>
        <h1>Wiki da Campanha</h1>
      </div>

      <div class="wiki-toolbar">
        <input
          class="form-control"
          placeholder="Buscar por título ou conteúdo..."
          [(ngModel)]="searchTerm"
          (keyup.enter)="loadPages()"
        />
        <select class="form-control" [(ngModel)]="selectedCategory" (change)="loadPages()">
          <option value="">Todas as categorias</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <button class="btn btn-outline" (click)="loadPages()">Filtrar</button>
        <button class="btn btn-primary" (click)="startCreate()">+ Nova Página</button>
      </div>

      <div class="wiki-grid" *ngIf="!loading">
        <div class="wiki-list card">
          <div class="list-title">Páginas</div>
          <button
            *ngFor="let page of pages"
            class="wiki-list-item"
            [class.active]="selectedPage?.id === page.id"
            (click)="openPage(page)"
          >
            <div class="title">{{ page.title }}</div>
            <div class="meta">
              <span>{{ page.category }}</span>
              <span *ngIf="!page.isPublic" class="badge badge-warning">GM</span>
            </div>
          </button>
          <div class="empty" *ngIf="pages.length === 0">Nenhuma página encontrada.</div>
        </div>

        <div class="wiki-editor card" *ngIf="editorVisible">
          <div class="editor-head">
            <h3>{{ isEditing ? 'Editar página' : 'Nova página' }}</h3>
            <button class="btn btn-danger btn-sm" *ngIf="isEditing" (click)="deletePage()">Excluir</button>
          </div>

          <div class="editor-form">
            <input class="form-control" placeholder="Título" [(ngModel)]="form.title" />
            <select class="form-control" [(ngModel)]="form.category">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
            <input class="form-control" placeholder="Tags (separadas por vírgula)" [(ngModel)]="form.tagsInput" />
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.isPublic" />
              Visível para jogadores
            </label>
          </div>

          <div class="markdown-layout">
            <div>
              <div class="section-label">Markdown</div>
              <textarea
                class="form-control editor-textarea"
                rows="14"
                [(ngModel)]="form.content"
                placeholder="Escreva o conteúdo da wiki em markdown..."
              ></textarea>
            </div>
            <div>
              <div class="section-label">Preview</div>
              <div class="preview-box" [innerHTML]="renderMarkdown(form.content)"></div>
            </div>
          </div>

          <div class="editor-actions">
            <button class="btn btn-outline" (click)="cancelEdit()">Cancelar</button>
            <button class="btn btn-primary" [disabled]="!form.title || !form.content" (click)="savePage()">
              {{ isEditing ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .wiki-wrapper {
        padding-top: 2rem;
        padding-bottom: 2rem;
      }
      .wiki-header {
        margin-bottom: 1rem;
      }
      .back-link {
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.85rem;
      }
      .back-link:hover {
        color: var(--accent-primary);
      }
      .wiki-header h1 {
        margin-top: 0.5rem;
      }
      .wiki-toolbar {
        display: grid;
        grid-template-columns: 2fr 1fr auto auto;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .wiki-grid {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 1rem;
      }
      .card {
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-lg);
        padding: 1rem;
      }
      .list-title {
        font-weight: 700;
        margin-bottom: 0.75rem;
      }
      .wiki-list-item {
        width: 100%;
        text-align: left;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.02);
        padding: 0.65rem;
        margin-bottom: 0.5rem;
        color: var(--text-primary);
        cursor: pointer;
      }
      .wiki-list-item.active {
        border-color: var(--accent-primary);
        background: rgba(201, 168, 76, 0.08);
      }
      .wiki-list-item .title {
        font-size: 0.9rem;
        font-weight: 600;
      }
      .wiki-list-item .meta {
        font-size: 0.75rem;
        color: var(--text-muted);
        display: flex;
        gap: 0.5rem;
        align-items: center;
        margin-top: 0.25rem;
      }
      .empty {
        color: var(--text-muted);
        font-size: 0.85rem;
      }
      .editor-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .editor-form {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
      .markdown-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .section-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 0.35rem;
      }
      .editor-textarea {
        min-height: 350px;
      }
      .preview-box {
        min-height: 350px;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
        color: var(--text-primary);
        white-space: pre-wrap;
      }
      .editor-actions {
        margin-top: 1rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      @media (max-width: 1024px) {
        .wiki-grid {
          grid-template-columns: 1fr;
        }
        .wiki-toolbar {
          grid-template-columns: 1fr;
        }
        .editor-form,
        .markdown-layout {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignWikiComponent implements OnInit {
  campaignId = '';
  loading = true;
  pages: any[] = [];
  selectedPage: any | null = null;

  searchTerm = '';
  selectedCategory = '';
  categories: WikiCategory[] = [
    'NPC',
    'LOCATION',
    'FACTION',
    'LORE',
    'HOUSE_RULE',
    'BESTIARY',
    'DEITY',
    'MYTHOS',
    'SESSION_RECAP',
  ];

  editorVisible = false;
  isEditing = false;
  form: {
    title: string;
    content: string;
    category: WikiCategory;
    tagsInput: string;
    isPublic: boolean;
  } = {
    title: '',
    content: '',
    category: 'LORE',
    tagsInput: '',
    isPublic: true,
  };

  constructor(
    private route: ActivatedRoute,
    private wikiService: WikiService
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPages();
  }

  loadPages(): void {
    if (!this.campaignId) {
      return;
    }

    this.loading = true;
    this.wikiService
      .getCampaignPages(this.campaignId, {
        category: (this.selectedCategory as WikiCategory) || undefined,
        search: this.searchTerm || undefined,
      })
      .subscribe({
        next: (response) => {
          this.pages = response.data || [];
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  openPage(page: any): void {
    this.selectedPage = page;
    this.editorVisible = true;
    this.isEditing = true;
    this.form = {
      title: page.title || '',
      content: page.content || '',
      category: page.category || 'LORE',
      tagsInput: (page.tags || []).join(', '),
      isPublic: page.isPublic ?? true,
    };
  }

  startCreate(): void {
    this.selectedPage = null;
    this.editorVisible = true;
    this.isEditing = false;
    this.form = {
      title: '',
      content: '',
      category: 'LORE',
      tagsInput: '',
      isPublic: true,
    };
  }

  cancelEdit(): void {
    this.editorVisible = false;
    this.selectedPage = null;
  }

  savePage(): void {
    const tags = this.form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      campaignId: this.campaignId,
      title: this.form.title,
      content: this.form.content,
      category: this.form.category,
      tags,
      isPublic: this.form.isPublic,
    };

    const request$ = this.isEditing && this.selectedPage
      ? this.wikiService.updatePage(this.selectedPage.id, payload)
      : this.wikiService.createPage(payload);

    request$.subscribe({
      next: () => {
        this.editorVisible = false;
        this.loadPages();
      },
    });
  }

  deletePage(): void {
    if (!this.selectedPage) {
      return;
    }

    this.wikiService.deletePage(this.selectedPage.id).subscribe({
      next: () => {
        this.editorVisible = false;
        this.selectedPage = null;
        this.loadPages();
      },
    });
  }

  renderMarkdown(markdown: string): string {
    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return escaped
      .replace(/^### (.*)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^\- (.*)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');
  }
}

