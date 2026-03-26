import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WikiCategory, WikiService } from '../../../core/services/wiki.service';
import { WikiPage, WikiPageReference, WikiTreeNode } from '../../../core/types';

interface TreeRow {
  id: string;
  title: string;
  category: WikiCategory;
  isPublic: boolean;
  parentPageId: string | null;
  depth: number;
}

interface WikiEditorForm {
  title: string;
  content: string;
  category: WikiCategory;
  tagsInput: string;
  isPublic: boolean;
  parentPageId: string;
}

@Component({
  selector: 'app-campaign-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container wiki-wrapper">
      <div class="wiki-header">
        <a class="back-link" [routerLink]="['/campaigns', campaignId]">← Voltar para campanha</a>
        <h1>Wiki da Campanha - Nexus de Conhecimento</h1>
        <p>
          Estrutura hierarquica, links internos com &#64; e importacao canonica do legado 2023.
        </p>
      </div>

      <div
        class="flash"
        *ngIf="flashMessage"
        [class.error]="flashType === 'error'"
        [class.success]="flashType === 'success'"
      >
        {{ flashMessage }}
      </div>

      <div class="wiki-toolbar">
        <input
          class="form-control"
          placeholder="Buscar por titulo ou conteudo..."
          [(ngModel)]="searchTerm"
          (keyup.enter)="loadData(false)"
        />
        <select class="form-control" [(ngModel)]="selectedCategory" (change)="loadData(false)">
          <option value="">Todas as categorias</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <button class="btn btn-outline" (click)="loadData(false)">Filtrar</button>
        <button class="btn btn-outline" [disabled]="seeding" (click)="seedLegacy()">
          {{ seeding ? 'Importando legado...' : 'Importar legado 2023' }}
        </button>
        <button class="btn btn-primary" (click)="startCreate()">+ Nova Pagina</button>
      </div>

      <div class="loading" *ngIf="loading">Carregando wiki...</div>

      <div class="wiki-grid" *ngIf="!loading">
        <aside class="wiki-list card">
          <div class="list-title">Arvore de Paginas</div>
          <button
            *ngFor="let row of treeRows"
            class="tree-item"
            [class.active]="selectedPage?.id === row.id"
            [style.padding-left.px]="12 + row.depth * 18"
            (click)="openPageById(row.id)"
          >
            <span class="tree-title">{{ row.title }}</span>
            <span class="tree-meta">{{ row.category }}</span>
            <span *ngIf="!row.isPublic" class="badge badge-warning">GM</span>
            <span class="tree-actions">
              <span class="tree-add" (click)="startCreate(row.id); $event.stopPropagation()">+</span>
            </span>
          </button>
          <div class="empty" *ngIf="treeRows.length === 0">Nenhuma pagina encontrada.</div>
        </aside>

        <section class="wiki-editor card" *ngIf="editorVisible">
          <div class="editor-head">
            <h3>{{ isEditing ? 'Editar pagina' : 'Nova pagina' }}</h3>
            <div class="editor-head-actions">
              <button class="btn btn-outline btn-sm" *ngIf="selectedPage" (click)="startCreate(selectedPage.id)">
                + Subpagina
              </button>
              <button class="btn btn-danger btn-sm" *ngIf="isEditing" (click)="deletePage()">Excluir</button>
            </div>
          </div>

          <div class="editor-form">
            <input class="form-control" placeholder="Titulo" [(ngModel)]="form.title" />
            <select class="form-control" [(ngModel)]="form.category">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
            <select class="form-control" [(ngModel)]="form.parentPageId">
              <option value="">Sem pagina pai (raiz)</option>
              <option *ngFor="let page of availableParents" [value]="page.id">{{ page.title }}</option>
            </select>
            <input class="form-control" placeholder="Tags (separadas por virgula)" [(ngModel)]="form.tagsInput" />
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.isPublic" />
              Visivel para jogadores
            </label>
            <div class="internal-link-row">
              <select class="form-control" [(ngModel)]="internalLinkTarget">
                <option value="">Inserir link interno com &#64;...</option>
                <option *ngFor="let page of pages" [value]="page.title">{{ page.title }}</option>
              </select>
              <button class="btn btn-outline" (click)="insertInternalLink()">Inserir &#64;link</button>
            </div>
          </div>

          <div class="markdown-layout">
            <div>
              <div class="section-label">Markdown</div>
              <textarea
                class="form-control editor-textarea"
                rows="14"
                [(ngModel)]="form.content"
                placeholder="Escreva o conteudo da wiki em markdown e use &#64;NomeDaPagina para links internos..."
              ></textarea>
            </div>
            <div>
              <div class="section-label">Preview</div>
              <div class="preview-box" [innerHTML]="renderMarkdown(form.content)"></div>
            </div>
          </div>

          <div class="references" *ngIf="isEditing && selectedPage">
            <div>
              <h4>Paginas citadas</h4>
              <p class="empty" *ngIf="linkedPages.length === 0">Nenhuma ligacao interna encontrada.</p>
              <button *ngFor="let link of linkedPages" class="ref-chip" (click)="openPageById(link.id)">
                &#64;{{ link.title }}
              </button>
            </div>
            <div>
              <h4>Backlinks</h4>
              <p class="empty" *ngIf="backlinks.length === 0">Nenhuma pagina aponta para esta entrada.</p>
              <button *ngFor="let link of backlinks" class="ref-chip" (click)="openPageById(link.id)">
                {{ link.title }}
              </button>
            </div>
          </div>

          <div class="editor-actions">
            <button class="btn btn-outline" (click)="cancelEdit()">Cancelar</button>
            <button class="btn btn-primary" [disabled]="!form.title || !form.content" (click)="savePage()">
              {{ isEditing ? 'Salvar' : 'Criar' }}
            </button>
          </div>
        </section>

        <section class="wiki-empty card" *ngIf="!editorVisible">
          <h3>Selecione uma pagina</h3>
          <p>Abra uma pagina da arvore ou crie uma nova entrada para comecar.</p>
        </section>
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
      .wiki-header p {
        margin-top: 0.35rem;
        color: var(--text-secondary);
      }
      .flash {
        border: 1px solid rgba(201, 168, 76, 0.4);
        border-radius: var(--radius-sm);
        background: rgba(201, 168, 76, 0.1);
        color: var(--text-primary);
        padding: 0.6rem 0.8rem;
        margin-bottom: 0.8rem;
      }
      .flash.success {
        border-color: rgba(39, 174, 96, 0.45);
        background: rgba(39, 174, 96, 0.12);
      }
      .flash.error {
        border-color: rgba(231, 76, 60, 0.45);
        background: rgba(231, 76, 60, 0.12);
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
        grid-template-columns: 2fr 1fr auto auto auto;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .loading {
        color: var(--text-secondary);
        padding: 1rem;
      }
      .wiki-grid {
        display: grid;
        grid-template-columns: 320px 1fr;
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
      .tree-item {
        width: 100%;
        text-align: left;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.02);
        padding: 0.55rem 0.55rem 0.55rem 0.65rem;
        margin-bottom: 0.45rem;
        color: var(--text-primary);
        cursor: pointer;
        display: grid;
        grid-template-columns: 1fr auto auto auto;
        align-items: center;
        gap: 0.45rem;
      }
      .tree-item.active {
        border-color: var(--accent-primary);
        background: rgba(201, 168, 76, 0.08);
      }
      .tree-title {
        font-weight: 600;
      }
      .tree-meta {
        color: var(--text-muted);
        font-size: 0.72rem;
      }
      .tree-actions {
        display: inline-flex;
      }
      .tree-add {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: inline-grid;
        place-items: center;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 0.85rem;
      }
      .editor-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }
      .editor-head-actions {
        display: flex;
        gap: 0.5rem;
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
      .internal-link-row {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
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
      .preview-box .wiki-link-ref {
        color: var(--accent-primary);
        font-weight: 700;
      }
      .references {
        margin-top: 0.85rem;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .references h4 {
        margin: 0 0 0.4rem;
        font-size: 0.9rem;
      }
      .ref-chip {
        border: 1px solid rgba(201, 168, 76, 0.35);
        border-radius: 999px;
        background: rgba(201, 168, 76, 0.1);
        color: var(--text-primary);
        padding: 0.24rem 0.6rem;
        margin: 0 0.35rem 0.35rem 0;
        cursor: pointer;
      }
      .editor-actions {
        margin-top: 1rem;
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      .wiki-empty {
        min-height: 260px;
        display: grid;
        place-content: center;
        text-align: center;
      }
      .empty {
        color: var(--text-muted);
        font-size: 0.85rem;
      }
      @media (max-width: 1200px) {
        .wiki-toolbar {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 1024px) {
        .wiki-grid {
          grid-template-columns: 1fr;
        }
        .editor-form,
        .markdown-layout,
        .references,
        .internal-link-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignWikiComponent implements OnInit {
  campaignId = '';
  loading = true;
  seeding = false;

  pages: WikiPage[] = [];
  treeRows: TreeRow[] = [];
  selectedPage: WikiPage | null = null;
  selectedPageId: string | null = null;

  linkedPages: WikiPageReference[] = [];
  backlinks: WikiPageReference[] = [];

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

  flashMessage = '';
  flashType: 'success' | 'error' | 'info' = 'info';

  editorVisible = false;
  isEditing = false;
  internalLinkTarget = '';

  form: WikiEditorForm = {
    title: '',
    content: '',
    category: 'LORE',
    tagsInput: '',
    isPublic: true,
    parentPageId: '',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly wikiService: WikiService
  ) {}

  get availableParents(): WikiPage[] {
    return this.pages.filter((page) => page.id !== this.selectedPage?.id);
  }

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    this.loadData(false);
  }

  loadData(preserveSelection = true): void {
    if (!this.campaignId) {
      return;
    }

    this.loading = true;
    forkJoin({
      pagesResponse: this.wikiService.getCampaignPages(this.campaignId, {
        category: (this.selectedCategory as WikiCategory) || undefined,
        search: this.searchTerm || undefined,
      }),
      treeResponse: this.wikiService.getCampaignTree(this.campaignId),
    }).subscribe({
      next: ({ pagesResponse, treeResponse }) => {
        this.pages = pagesResponse.data || [];
        this.treeRows = this.flattenTree(treeResponse.data || []);
        this.loading = false;

        if (preserveSelection && this.selectedPageId && this.pages.some((page) => page.id === this.selectedPageId)) {
          this.openPageById(this.selectedPageId, false);
        }
      },
      error: () => {
        this.loading = false;
        this.setFlash('Falha ao carregar a wiki da campanha.', 'error');
      },
    });
  }

  openPageById(pageId: string, forceEditor = true): void {
    this.selectedPageId = pageId;

    this.wikiService.getPageById(pageId).subscribe({
      next: (response) => {
        const page = response.data;
        this.selectedPage = page;
        this.linkedPages = page.linkedPages || [];
        this.backlinks = page.backlinks || [];

        this.form = {
          title: page.title,
          content: page.content,
          category: page.category,
          tagsInput: page.tags.join(', '),
          isPublic: page.isPublic,
          parentPageId: page.parentPageId || '',
        };

        this.isEditing = true;
        this.editorVisible = forceEditor || this.editorVisible;
      },
      error: () => {
        this.setFlash('Nao foi possivel abrir a pagina selecionada.', 'error');
      },
    });
  }

  startCreate(parentPageId: string | null = null): void {
    this.selectedPage = null;
    this.selectedPageId = null;
    this.linkedPages = [];
    this.backlinks = [];
    this.editorVisible = true;
    this.isEditing = false;

    this.form = {
      title: '',
      content: '',
      category: 'LORE',
      tagsInput: '',
      isPublic: true,
      parentPageId: parentPageId || '',
    };
  }

  cancelEdit(): void {
    this.editorVisible = false;
  }

  seedLegacy(): void {
    if (!this.campaignId) {
      return;
    }

    this.seeding = true;
    this.wikiService.seedLegacy(this.campaignId).subscribe({
      next: (response) => {
        const result = response.data;
        this.seeding = false;
        this.setFlash(
          `Legado importado: ${result.created} criadas, ${result.skipped} reaproveitadas, total canonico ${result.total}.`,
          'success'
        );
        this.loadData(false);
      },
      error: () => {
        this.seeding = false;
        this.setFlash('Falha ao importar o legado. Verifique se voce e GM da campanha.', 'error');
      },
    });
  }

  savePage(): void {
    const tags = this.form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const basePayload = {
      parentPageId: this.form.parentPageId || null,
      title: this.form.title,
      content: this.form.content,
      category: this.form.category,
      tags,
      isPublic: this.form.isPublic,
    };

    const request$ = this.isEditing && this.selectedPage
      ? this.wikiService.updatePage(this.selectedPage.id, basePayload)
      : this.wikiService.createPage({
          campaignId: this.campaignId,
          ...basePayload,
        });

    request$.subscribe({
      next: () => {
        this.setFlash(this.isEditing ? 'Pagina atualizada com sucesso.' : 'Pagina criada com sucesso.', 'success');
        this.editorVisible = false;
        this.loadData(this.isEditing);
      },
      error: () => {
        this.setFlash('Nao foi possivel salvar a pagina.', 'error');
      },
    });
  }

  deletePage(): void {
    if (!this.selectedPage) {
      return;
    }

    this.wikiService.deletePage(this.selectedPage.id).subscribe({
      next: () => {
        this.setFlash('Pagina removida com sucesso.', 'success');
        this.editorVisible = false;
        this.selectedPage = null;
        this.selectedPageId = null;
        this.linkedPages = [];
        this.backlinks = [];
        this.loadData(false);
      },
      error: () => {
        this.setFlash('Falha ao remover a pagina.', 'error');
      },
    });
  }

  insertInternalLink(): void {
    if (!this.internalLinkTarget) {
      return;
    }

    const separator = this.form.content.length > 0 && !this.form.content.endsWith(' ') ? ' ' : '';
    this.form.content = `${this.form.content}${separator}@${this.internalLinkTarget}`;
    this.internalLinkTarget = '';
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
      .replace(/@([^\n@#.,;:!?()[\]{}]{2,80})/g, '<span class="wiki-link-ref">@$1</span>')
      .replace(/^\- (.*)$/gm, '<li>$1</li>')
      .replace(/\n/g, '<br/>');
  }

  private flattenTree(nodes: WikiTreeNode[], depth = 0): TreeRow[] {
    const rows: TreeRow[] = [];

    for (const node of nodes) {
      rows.push({
        id: node.id,
        title: node.title,
        category: node.category,
        isPublic: node.isPublic,
        parentPageId: node.parentPageId,
        depth,
      });

      rows.push(...this.flattenTree(node.children, depth + 1));
    }

    return rows;
  }

  private setFlash(message: string, type: 'success' | 'error' | 'info'): void {
    this.flashMessage = message;
    this.flashType = type;
  }
}

