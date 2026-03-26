import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  WikiService,
  WikiTreeNode,
  WikiBlock,
  WikiBlockType,
  WikiCategory,
} from '../../../core/services/wiki.service';
import { SearchService } from '../../../core/services/search.service';

interface WikiPageExtended {
  id: string;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  isPublic: boolean;
  icon?: string;
  coverImage?: string;
  parentId?: string;
  isFavorite?: boolean;
  parent?: { id: string; title: string; icon?: string };
  children?: { id: string; title: string; icon?: string; category: WikiCategory }[];
  blocks?: WikiBlock[];
  incomingLinks?: { sourcePage: { id: string; title: string; icon?: string; category: WikiCategory } }[];
  author?: { id: string; name: string };
}

@Component({
  selector: 'app-campaign-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="wiki-container">
      <!-- Sidebar -->
      <aside class="wiki-sidebar">
        <div class="sidebar-header">
          <a class="back-link" [routerLink]="['/campaigns', campaignId]">← Campanha</a>
          <h2>Wiki</h2>
        </div>

        <div class="sidebar-search">
          <input
            type="text"
            class="form-control"
            placeholder="Buscar páginas..."
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
          />
        </div>

        <div class="sidebar-actions">
          <button class="btn btn-primary btn-sm" (click)="createPage()">+ Nova Página</button>
        </div>

        <!-- Favorites -->
        <div class="sidebar-section" *ngIf="favorites.length > 0">
          <div class="section-title">⭐ Favoritos</div>
          <div class="page-list">
            <button
              *ngFor="let page of favorites"
              class="page-item"
              [class.active]="selectedPage?.id === page.id"
              (click)="openPageById(page.id)"
            >
              <span class="page-icon">{{ page.icon || '📄' }}</span>
              <span class="page-title">{{ page.title }}</span>
            </button>
          </div>
        </div>

        <!-- Page Tree -->
        <div class="sidebar-section">
          <div class="section-title">📁 Páginas</div>
          <div class="page-tree">
            <ng-container *ngTemplateOutlet="pageTreeTemplate; context: { pages: pageTree, level: 0 }"></ng-container>
          </div>
        </div>

        <ng-template #pageTreeTemplate let-pages="pages" let-level="level">
          <div *ngFor="let node of pages" class="tree-node" [style.paddingLeft.px]="level * 16">
            <button
              class="page-item"
              [class.active]="selectedPage?.id === node.id"
              [class.has-children]="node.children?.length > 0"
              (click)="openPageById(node.id)"
            >
              <span class="expand-icon" *ngIf="node.children?.length > 0" (click)="toggleExpand($event, node.id)">
                {{ expandedNodes.has(node.id) ? '▼' : '▶' }}
              </span>
              <span class="page-icon">{{ node.icon || getCategoryIcon(node.category) }}</span>
              <span class="page-title">{{ node.title }}</span>
              <span class="page-badge" *ngIf="!node.isPublic">GM</span>
            </button>
            <div *ngIf="expandedNodes.has(node.id) && node.children?.length > 0" class="tree-children">
              <ng-container *ngTemplateOutlet="pageTreeTemplate; context: { pages: node.children, level: level + 1 }"></ng-container>
            </div>
          </div>
        </ng-template>
      </aside>

      <!-- Main Content -->
      <main class="wiki-main">
        <!-- Page View -->
        <div class="wiki-page" *ngIf="selectedPage && !isEditing">
          <div class="page-header" [style.backgroundImage]="selectedPage.coverImage ? 'url(' + selectedPage.coverImage + ')' : ''">
            <div class="page-breadcrumb" *ngIf="selectedPage.parent">
              <button class="breadcrumb-link" (click)="openPageById(selectedPage.parent!.id)">
                {{ selectedPage.parent!.icon || '📁' }} {{ selectedPage.parent!.title }}
              </button>
              <span>/</span>
            </div>
            <div class="page-title-row">
              <span class="page-icon-large">{{ selectedPage.icon || getCategoryIcon(selectedPage.category) }}</span>
              <h1>{{ selectedPage.title }}</h1>
              <button class="btn-icon" (click)="toggleFavorite()" [class.active]="selectedPage.isFavorite">
                {{ selectedPage.isFavorite ? '⭐' : '☆' }}
              </button>
            </div>
            <div class="page-meta">
              <span class="badge badge-category">{{ selectedPage.category }}</span>
              <span *ngFor="let tag of selectedPage.tags" class="badge badge-tag">{{ tag }}</span>
              <span *ngIf="!selectedPage.isPublic" class="badge badge-warning">Apenas GM</span>
            </div>
          </div>

          <div class="page-content">
            <!-- Block Editor View -->
            <div class="blocks-view" *ngIf="selectedPage.blocks && selectedPage.blocks.length > 0; else markdownView">
              <div
                *ngFor="let block of selectedPage.blocks; trackBy: trackByBlockId"
                class="block"
                [class]="'block-' + block.type.toLowerCase()"
                [style.marginLeft.px]="block.indent * 24"
              >
                <ng-container [ngSwitch]="block.type">
                  <h1 *ngSwitchCase="'HEADING_1'">{{ getBlockText(block) }}</h1>
                  <h2 *ngSwitchCase="'HEADING_2'">{{ getBlockText(block) }}</h2>
                  <h3 *ngSwitchCase="'HEADING_3'">{{ getBlockText(block) }}</h3>
                  <p *ngSwitchCase="'TEXT'">{{ getBlockText(block) }}</p>
                  <blockquote *ngSwitchCase="'QUOTE'" class="quote-block">{{ getBlockText(block) }}</blockquote>
                  <div *ngSwitchCase="'CALLOUT'" class="callout-block">
                    <span class="callout-icon">💡</span>
                    <span class="callout-text">{{ getBlockText(block) }}</span>
                  </div>
                  <div *ngSwitchCase="'TODO'" class="todo-block">
                    <input type="checkbox" [checked]="block.isChecked" disabled />
                    <span [class.completed]="block.isChecked">{{ getBlockText(block) }}</span>
                  </div>
                  <ul *ngSwitchCase="'BULLETED_LIST'"><li>{{ getBlockText(block) }}</li></ul>
                  <ol *ngSwitchCase="'NUMBERED_LIST'"><li>{{ getBlockText(block) }}</li></ol>
                  <pre *ngSwitchCase="'CODE'" class="code-block"><code>{{ getBlockText(block) }}</code></pre>
                  <hr *ngSwitchCase="'DIVIDER'" />
                  <p *ngSwitchDefault>{{ getBlockText(block) }}</p>
                </ng-container>
              </div>
            </div>

            <ng-template #markdownView>
              <div class="markdown-content" [innerHTML]="renderMarkdown(selectedPage.content)"></div>
            </ng-template>

            <!-- Children Pages -->
            <div class="children-section" *ngIf="selectedPage.children && selectedPage.children.length > 0">
              <h3>Sub-páginas</h3>
              <div class="children-grid">
                <button
                  *ngFor="let child of selectedPage.children"
                  class="child-card"
                  (click)="openPageById(child.id)"
                >
                  <span class="child-icon">{{ child.icon || getCategoryIcon(child.category) }}</span>
                  <span class="child-title">{{ child.title }}</span>
                </button>
              </div>
            </div>

            <!-- Backlinks -->
            <div class="backlinks-section" *ngIf="selectedPage.incomingLinks && selectedPage.incomingLinks.length > 0">
              <h3>Páginas que linkam aqui</h3>
              <div class="backlinks-list">
                <button
                  *ngFor="let link of selectedPage.incomingLinks"
                  class="backlink-item"
                  (click)="openPageById(link.sourcePage.id)"
                >
                  <span class="backlink-icon">{{ link.sourcePage.icon || getCategoryIcon(link.sourcePage.category) }}</span>
                  <span class="backlink-title">{{ link.sourcePage.title }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="page-actions">
            <button class="btn btn-outline" (click)="editPage()">Editar</button>
            <button class="btn btn-danger" (click)="deletePage()">Excluir</button>
          </div>
        </div>

        <!-- Editor -->
        <div class="wiki-editor" *ngIf="isEditing">
          <div class="editor-header">
            <h2>{{ editingPageId ? 'Editar Página' : 'Nova Página' }}</h2>
            <button class="btn btn-outline" (click)="cancelEdit()">Cancelar</button>
          </div>

          <div class="editor-form">
            <div class="form-row">
              <div class="form-group icon-picker">
                <label>Ícone</label>
                <input type="text" class="form-control" [(ngModel)]="form.icon" placeholder="📄" maxlength="4" />
              </div>
              <div class="form-group flex-1">
                <label>Título</label>
                <input type="text" class="form-control" [(ngModel)]="form.title" placeholder="Título da página" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Categoria</label>
                <select class="form-control" [(ngModel)]="form.category">
                  <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>Página Pai</label>
                <select class="form-control" [(ngModel)]="form.parentId">
                  <option [ngValue]="null">Nenhuma (raiz)</option>
                  <option *ngFor="let page of flatPageList" [ngValue]="page.id">{{ page.title }}</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Tags (separadas por vírgula)</label>
              <input type="text" class="form-control" [(ngModel)]="form.tagsInput" placeholder="tag1, tag2, tag3" />
            </div>

            <div class="form-group">
              <label>Imagem de Capa (URL)</label>
              <input type="text" class="form-control" [(ngModel)]="form.coverImage" placeholder="https://..." />
            </div>

            <div class="form-group">
              <label>Conteúdo (Markdown) - Use [[Nome da Página]] para criar links</label>
              <textarea
                class="form-control content-textarea"
                rows="20"
                [(ngModel)]="form.content"
                placeholder="Escreva o conteúdo em markdown..."
              ></textarea>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.isPublic" />
                Visível para jogadores
              </label>
            </div>
          </div>

          <div class="editor-actions">
            <button class="btn btn-outline" (click)="cancelEdit()">Cancelar</button>
            <button class="btn btn-primary" (click)="savePage()" [disabled]="!form.title">Salvar</button>
          </div>
        </div>

        <!-- Empty State -->
        <div class="wiki-empty" *ngIf="!selectedPage && !isEditing">
          <div class="empty-content">
            <span class="empty-icon">📚</span>
            <h2>Selecione uma página</h2>
            <p>Escolha uma página na sidebar ou crie uma nova.</p>
            <button class="btn btn-primary" (click)="createPage()">+ Nova Página</button>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .wiki-container {
      display: grid;
      grid-template-columns: 280px 1fr;
      min-height: calc(100vh - 60px);
      background: var(--color-bg-deepest);
    }
    .wiki-sidebar {
      background: var(--color-bg-deep);
      border-right: 1px solid var(--border-color);
      padding: 1rem;
      overflow-y: auto;
      max-height: calc(100vh - 60px);
    }
    .sidebar-header { margin-bottom: 1rem; }
    .sidebar-header h2 {
      font-family: var(--font-display);
      color: var(--color-primary);
      margin: 0.5rem 0 0 0;
    }
    .back-link {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.8rem;
    }
    .back-link:hover { color: var(--color-primary); }
    .sidebar-search { margin-bottom: 1rem; }
    .sidebar-search .form-control {
      background: var(--color-bg-surface);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      width: 100%;
    }
    .sidebar-actions { margin-bottom: 1rem; }
    .sidebar-section { margin-bottom: 1.5rem; }
    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      letter-spacing: 0.05em;
    }
    .page-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.4rem 0.5rem;
      border: none;
      background: transparent;
      color: var(--text-primary);
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-align: left;
      font-size: 0.9rem;
    }
    .page-item:hover { background: var(--color-bg-surface); }
    .page-item.active {
      background: var(--color-primary-glow);
      color: var(--color-primary);
    }
    .page-icon { font-size: 1rem; }
    .page-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .page-badge {
      font-size: 0.65rem;
      padding: 0.1rem 0.3rem;
      background: var(--color-warning);
      color: #000;
      border-radius: 3px;
    }
    .expand-icon {
      font-size: 0.7rem;
      width: 1rem;
      text-align: center;
      color: var(--text-muted);
    }
    .tree-node { margin-bottom: 2px; }
    .tree-children { margin-top: 2px; }
    .wiki-main {
      padding: 2rem;
      overflow-y: auto;
      max-height: calc(100vh - 60px);
    }
    .wiki-page { max-width: 900px; margin: 0 auto; }
    .page-header {
      background: var(--color-bg-surface);
      background-size: cover;
      background-position: center;
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      margin-bottom: 1.5rem;
      position: relative;
    }
    .page-breadcrumb {
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      color: var(--text-muted);
    }
    .breadcrumb-link {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .breadcrumb-link:hover { color: var(--color-primary); }
    .page-title-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .page-icon-large { font-size: 2.5rem; }
    .page-title-row h1 {
      font-family: var(--font-display);
      margin: 0;
      flex: 1;
    }
    .btn-icon {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0.7;
    }
    .btn-icon:hover, .btn-icon.active { opacity: 1; }
    .page-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    .badge {
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background: var(--color-bg-surface);
      color: var(--text-secondary);
    }
    .badge-tag {
      background: var(--color-primary-glow);
      color: var(--color-primary);
    }
    .badge-warning {
      background: var(--color-warning);
      color: #000;
    }
    .page-content {
      background: var(--color-bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 2rem;
      margin-bottom: 1.5rem;
    }
    .markdown-content {
      line-height: 1.8;
      color: var(--text-primary);
    }
    .markdown-content h1, .markdown-content h2, .markdown-content h3 {
      font-family: var(--font-display);
      color: var(--color-primary);
      margin-top: 1.5rem;
    }
    .blocks-view .block { margin-bottom: 0.5rem; }
    .quote-block {
      border-left: 3px solid var(--color-primary);
      padding-left: 1rem;
      color: var(--text-secondary);
      font-style: italic;
    }
    .callout-block {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--color-bg-elevated);
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--color-primary);
    }
    .callout-icon { font-size: 1.2rem; }
    .todo-block {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .todo-block .completed {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .code-block {
      background: var(--color-bg-deepest);
      padding: 1rem;
      border-radius: var(--radius-sm);
      overflow-x: auto;
      font-family: var(--font-mono);
    }
    .children-section, .backlinks-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    .children-section h3, .backlinks-section h3 {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .children-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    .child-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--color-bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-primary);
    }
    .child-card:hover { border-color: var(--color-primary); }
    .child-icon { font-size: 1.5rem; }
    .backlinks-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .backlink-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem;
      background: var(--color-bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .backlink-item:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
    }
    .page-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
    .wiki-editor { max-width: 900px; margin: 0 auto; }
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .editor-form {
      background: var(--color-bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .form-group { margin-bottom: 1rem; }
    .form-group.flex-1 { flex: 1; }
    .form-group.icon-picker { width: 80px; }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-muted);
      margin-bottom: 0.3rem;
    }
    .form-control {
      width: 100%;
      padding: 0.6rem;
      background: var(--color-bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
    }
    .form-control:focus {
      outline: none;
      border-color: var(--color-primary);
    }
    .content-textarea {
      font-family: var(--font-mono);
      min-height: 400px;
      resize: vertical;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-secondary);
      cursor: pointer;
    }
    .editor-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }
    .wiki-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
    }
    .empty-content {
      text-align: center;
      color: var(--text-muted);
    }
    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }
    .empty-content h2 { margin-bottom: 0.5rem; }
    .empty-content p { margin-bottom: 1.5rem; }
    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.9rem;
      transition: var(--transition-fast);
    }
    .btn-primary {
      background: var(--color-primary);
      color: #000;
    }
    .btn-primary:hover { background: var(--color-primary-light); }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
    }
    .btn-outline:hover {
      border-color: var(--color-primary);
      color: var(--color-primary);
    }
    .btn-danger {
      background: var(--color-danger);
      color: white;
    }
    .btn-sm {
      padding: 0.3rem 0.6rem;
      font-size: 0.8rem;
    }
    @media (max-width: 768px) {
      .wiki-container { grid-template-columns: 1fr; }
      .wiki-sidebar { display: none; }
      .form-row { flex-direction: column; }
    }
  `],
})
export class CampaignWikiComponent implements OnInit, OnDestroy {
  campaignId = '';
  pageTree: WikiTreeNode[] = [];
  flatPageList: { id: string; title: string }[] = [];
  favorites: WikiTreeNode[] = [];
  selectedPage: WikiPageExtended | null = null;
  expandedNodes = new Set<string>();

  searchQuery = '';
  isEditing = false;
  editingPageId: string | null = null;

  form = {
    title: '',
    content: '',
    category: 'LORE' as WikiCategory,
    tagsInput: '',
    isPublic: true,
    icon: '',
    coverImage: '',
    parentId: null as string | null,
  };

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
    'CHARACTER',
    'EVENT',
    'ITEM',
    'QUEST',
    'TIMELINE',
  ];

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private wikiService: WikiService,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    this.loadPageTree();
    this.loadFavorites();

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        if (query) {
          this.searchPages(query);
        } else {
          this.loadPageTree();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPageTree(): void {
    this.wikiService.getPageTree(this.campaignId).subscribe({
      next: (response) => {
        this.pageTree = response.data || [];
        this.flatPageList = this.flattenTree(this.pageTree);
      },
    });
  }

  loadFavorites(): void {
    this.wikiService.getFavorites(this.campaignId).subscribe({
      next: (response) => {
        this.favorites = (response.data || []).map((p: any) => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
          category: p.category,
          isPublic: true,
          position: 0,
          isFavorite: true,
          children: [],
        }));
      },
    });
  }

  flattenTree(nodes: WikiTreeNode[], result: { id: string; title: string }[] = []): { id: string; title: string }[] {
    for (const node of nodes) {
      result.push({ id: node.id, title: node.title });
      if (node.children) {
        this.flattenTree(node.children, result);
      }
    }
    return result;
  }

  openPageById(pageId: string): void {
    this.wikiService.getPageById(pageId).subscribe({
      next: (response) => {
        this.selectedPage = response.data as WikiPageExtended;
        this.isEditing = false;
      },
    });
  }

  toggleExpand(event: Event, nodeId: string): void {
    event.stopPropagation();
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
  }

  createPage(): void {
    this.selectedPage = null;
    this.editingPageId = null;
    this.isEditing = true;
    this.form = {
      title: '',
      content: '',
      category: 'LORE',
      tagsInput: '',
      isPublic: true,
      icon: '',
      coverImage: '',
      parentId: null,
    };
  }

  editPage(): void {
    if (!this.selectedPage) return;
    this.editingPageId = this.selectedPage.id;
    this.isEditing = true;
    this.form = {
      title: this.selectedPage.title,
      content: this.selectedPage.content,
      category: this.selectedPage.category,
      tagsInput: this.selectedPage.tags.join(', '),
      isPublic: this.selectedPage.isPublic,
      icon: this.selectedPage.icon || '',
      coverImage: this.selectedPage.coverImage || '',
      parentId: this.selectedPage.parentId || null,
    };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editingPageId = null;
  }

  savePage(): void {
    const tags = this.form.tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      campaignId: this.campaignId,
      title: this.form.title,
      content: this.form.content,
      category: this.form.category,
      tags,
      isPublic: this.form.isPublic,
      icon: this.form.icon || undefined,
      coverImage: this.form.coverImage || undefined,
      parentId: this.form.parentId || undefined,
    };

    const request$ = this.editingPageId
      ? this.wikiService.updatePage(this.editingPageId, payload)
      : this.wikiService.createPage(payload);

    request$.subscribe({
      next: (response) => {
        this.isEditing = false;
        this.loadPageTree();
        if (response.data) {
          this.openPageById(response.data.id);
        }
      },
    });
  }

  deletePage(): void {
    if (!this.selectedPage || !confirm('Tem certeza que deseja excluir esta página?')) return;

    this.wikiService.deletePage(this.selectedPage.id).subscribe({
      next: () => {
        this.selectedPage = null;
        this.loadPageTree();
      },
    });
  }

  toggleFavorite(): void {
    if (!this.selectedPage) return;

    this.wikiService.toggleFavorite(this.selectedPage.id).subscribe({
      next: () => {
        if (this.selectedPage) {
          this.selectedPage.isFavorite = !this.selectedPage.isFavorite;
        }
        this.loadFavorites();
      },
    });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  searchPages(query: string): void {
    this.searchService.searchWikiPages(this.campaignId, query).subscribe({
      next: (response) => {
        this.pageTree = (response.data || []).map((p) => ({
          id: p.id,
          title: p.title,
          icon: p.icon,
          category: p.category as WikiCategory,
          isPublic: true,
          position: 0,
          isFavorite: false,
          children: [],
        }));
      },
    });
  }

  getCategoryIcon(category: WikiCategory): string {
    const icons: Record<string, string> = {
      NPC: '👤',
      LOCATION: '🏰',
      FACTION: '⚔️',
      LORE: '📜',
      HOUSE_RULE: '📋',
      BESTIARY: '🐲',
      DEITY: '✨',
      MYTHOS: '🌙',
      SESSION_RECAP: '📝',
      CHARACTER: '🧙',
      EVENT: '⚡',
      ITEM: '🎒',
      QUEST: '🗡️',
      TIMELINE: '⏳',
    };
    return icons[category] || '📄';
  }

  getBlockText(block: WikiBlock): string {
    return (block.content['text'] as string) || '';
  }

  trackByBlockId(index: number, block: WikiBlock): string {
    return block.id;
  }

  renderMarkdown(markdown: string): string {
    if (!markdown) return '';
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    html = html.replace(/\[\[([^\]]+)\]\]/g, '<a class="wiki-link">$1</a>');
    html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^\- (.*)$/gm, '<li>$1</li>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/\n/g, '<br/>');
    return html;
  }
}
