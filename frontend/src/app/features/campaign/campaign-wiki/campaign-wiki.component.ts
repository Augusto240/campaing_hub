import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WikiService } from '../../../core/services/wiki.service';
import {
  WikiBlock,
  WikiCategory,
  WikiFavorite,
  WikiPage,
  WikiPageRelations,
  WikiTemplate,
  WikiTreeNode,
} from '../../../core/types';

type WikiPageView = WikiPage & {
  parent?: {
    id: string;
    title: string;
    category: WikiCategory;
  } | null;
  _count?: {
    children: number;
  };
};

type FlatTreeNode = {
  id: string;
  title: string;
  category: WikiCategory;
  isPublic: boolean;
  depth: number;
};

type EditableWikiBlock = {
  id: string;
  blockType: 'TEXT' | 'CHECKLIST' | 'QUOTE' | 'CALLOUT' | 'CODE' | 'IMAGE' | 'TABLE';
  payload: {
    content?: string;
    checklistText?: string;
  };
};

@Component({
  selector: 'app-campaign-wiki',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container wiki-wrapper">
      <div class="wiki-header">
        <a class="back-link" [routerLink]="['/campaigns', campaignId]">ÔåÉ Voltar para campanha</a>
        <h1>Wiki da Campanha</h1>
      </div>

      <div class="wiki-toolbar">
        <input
          class="form-control"
          placeholder="Buscar por t├¡tulo ou conte├║do..."
          [(ngModel)]="searchTerm"
          (keyup.enter)="loadPages()"
        />
        <select class="form-control" [(ngModel)]="selectedCategory" (change)="loadPages()">
          <option value="">Todas as categorias</option>
          <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
        </select>
        <button class="btn btn-outline" (click)="loadPages()">Filtrar</button>
        <button class="btn btn-outline" (click)="bootstrapLegacy()" [disabled]="bootstrappingLegacy">
          {{ bootstrappingLegacy ? 'Importando legado...' : 'Importar Legado 2023' }}
        </button>
        <button class="btn btn-outline" (click)="openTemplateCreator()">Usar Template</button>
        <button class="btn btn-primary" (click)="startCreate()">+ Nova P├ígina</button>
      </div>

      <div class="template-box card" *ngIf="templateCreatorVisible">
        <div class="editor-head">
          <h3>Nova P├ígina por Template</h3>
          <button class="btn btn-outline btn-sm" (click)="templateCreatorVisible = false">Fechar</button>
        </div>

        <div class="editor-form">
          <input class="form-control" placeholder="T├¡tulo da nova p├ígina" [(ngModel)]="templateForm.title" />
          <select class="form-control" [(ngModel)]="templateForm.templateKey">
            <option *ngFor="let template of templates" [value]="template.key">
              {{ template.name }}
            </option>
          </select>
          <select class="form-control" [(ngModel)]="templateForm.parentPageId">
            <option value="">Sem p├ígina m├úe (raiz)</option>
            <option *ngFor="let option of getParentOptions()" [value]="option.id">
              {{ formatTreeOption(option) }}
            </option>
          </select>
          <label class="checkbox-label">
            <input type="checkbox" [(ngModel)]="templateForm.isPublic" />
            Vis├¡vel para jogadores
          </label>
        </div>

        <button
          class="btn btn-primary"
          [disabled]="!templateForm.title || creatingFromTemplate"
          (click)="createFromTemplate()"
        >
          {{ creatingFromTemplate ? 'Criando...' : 'Criar P├ígina com Template' }}
        </button>
      </div>

      <div class="legacy-feedback" *ngIf="legacyMessage">
        {{ legacyMessage }}
      </div>

      <div class="wiki-grid" *ngIf="!loading">
        <div class="wiki-list card">
          <div class="list-title">├ürvore da Wiki Viva</div>

          <div
            class="drop-root"
            (dragover)="onTreeDragOver($event)"
            (drop)="onTreeDropOnRoot($event)"
          >
            Solte aqui para mover para raiz
          </div>

          <div class="favorites-box" *ngIf="favorites.length > 0">
            <div class="section-label">Favoritos</div>
            <button class="wiki-list-item" *ngFor="let favorite of favorites" (click)="openPageById(favorite.page.id)">
              <div class="title">Ôÿà {{ favorite.page.title }}</div>
            </button>
          </div>

          <button
            *ngFor="let node of getVisibleTreeNodes()"
            class="wiki-list-item"
            [class.active]="selectedPage?.id === node.id"
            [class.moving]="draggingNodeId === node.id"
            draggable="true"
            (dragstart)="onTreeDragStart(node.id)"
            (dragover)="onTreeDragOver($event)"
            (drop)="onTreeDropOnNode(node.id, $event)"
            (click)="openPageById(node.id)"
          >
            <div class="title" [style.padding-left.px]="node.depth * 18">{{ node.title }}</div>
            <div class="meta">
              <span>{{ node.category }}</span>
              <span *ngIf="!node.isPublic" class="badge badge-warning">GM</span>
            </div>
          </button>
          <div class="empty" *ngIf="getVisibleTreeNodes().length === 0">Nenhuma p├ígina encontrada.</div>
        </div>

        <div class="wiki-editor card" *ngIf="editorVisible">
          <div class="editor-head">
            <h3>{{ isEditing ? 'Editar p├ígina' : 'Nova p├ígina' }}</h3>
            <div class="editor-head-actions">
              <button class="btn btn-outline btn-sm" *ngIf="isEditing && selectedPage" (click)="toggleFavorite()">
                {{ isSelectedFavorite() ? 'Ôÿà Favorita' : 'Ôÿå Favoritar' }}
              </button>
              <button class="btn btn-danger btn-sm" *ngIf="isEditing" (click)="deletePage()">Excluir</button>
            </div>
          </div>

          <div class="editor-form">
            <input class="form-control" placeholder="T├¡tulo" [(ngModel)]="form.title" />
            <select class="form-control" [(ngModel)]="form.category">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
            <select class="form-control" [(ngModel)]="form.parentPageId">
              <option value="">Sem p├ígina m├úe (raiz)</option>
              <option *ngFor="let option of getParentOptions()" [value]="option.id">
                {{ formatTreeOption(option) }}
              </option>
            </select>
            <input class="form-control" placeholder="Tags (separadas por v├¡rgula)" [(ngModel)]="form.tagsInput" />
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="form.isPublic" />
              Vis├¡vel para jogadores
            </label>
          </div>

          <div class="markdown-layout" *ngIf="!blockEditorMode">
            <div>
              <div class="section-label">Markdown</div>
              <textarea
                class="form-control editor-textarea"
                rows="14"
                [(ngModel)]="form.content"
                placeholder="Escreva o conte├║do da wiki em markdown..."
              ></textarea>
            </div>
            <div>
              <div class="section-label">Preview</div>
              <div class="preview-box" [innerHTML]="renderMarkdown(form.content)"></div>
            </div>
          </div>

          <div class="blocks-layout" *ngIf="blockEditorMode">
            <div class="section-label">Blocos (Notion interno)</div>
            <div class="block-item" *ngFor="let block of blocks; let i = index">
              <select class="form-control block-type" [(ngModel)]="block.blockType">
                <option value="TEXT">Texto</option>
                <option value="CHECKLIST">Checklist</option>
                <option value="QUOTE">Quote</option>
                <option value="CALLOUT">Callout</option>
                <option value="CODE">Code</option>
                <option value="IMAGE">Imagem</option>
                <option value="TABLE">Tabela</option>
              </select>

              <textarea
                *ngIf="block.blockType !== 'CHECKLIST'"
                class="form-control block-content"
                rows="4"
                [(ngModel)]="block.payload.content"
              ></textarea>

              <textarea
                *ngIf="block.blockType === 'CHECKLIST'"
                class="form-control block-content"
                rows="4"
                [(ngModel)]="block.payload.checklistText"
                placeholder="Uma tarefa por linha"
              ></textarea>

              <div class="block-actions">
                <button class="btn btn-outline btn-sm" (click)="moveBlock(i, -1)" [disabled]="i === 0">Ôåæ</button>
                <button class="btn btn-outline btn-sm" (click)="moveBlock(i, 1)" [disabled]="i === blocks.length - 1">Ôåô</button>
                <button class="btn btn-danger btn-sm" (click)="removeBlock(i)">Remover</button>
              </div>
            </div>

            <div class="block-adders">
              <button class="btn btn-outline" (click)="addBlock('TEXT')">+ Texto</button>
              <button class="btn btn-outline" (click)="addBlock('CHECKLIST')">+ Checklist</button>
              <button class="btn btn-outline" (click)="addBlock('CALLOUT')">+ Callout</button>
              <button class="btn btn-outline" (click)="addBlock('QUOTE')">+ Quote</button>
              <button class="btn btn-outline" (click)="addBlock('CODE')">+ Code</button>
              <button class="btn btn-outline" (click)="addBlock('IMAGE')">+ Imagem</button>
            </div>
          </div>

          <div class="editor-actions">
            <button class="btn btn-outline" (click)="cancelEdit()">Cancelar</button>
            <button class="btn btn-outline" *ngIf="isEditing" (click)="toggleEditorMode()">
              {{ blockEditorMode ? 'Modo Markdown' : 'Modo Blocos' }}
            </button>
            <button class="btn btn-primary" [disabled]="!form.title || !form.content" (click)="savePage()">
              {{ isEditing ? 'Salvar' : 'Criar' }}
            </button>
            <button class="btn btn-primary" *ngIf="isEditing && blockEditorMode" (click)="saveBlocks()">
              Salvar Blocos
            </button>
          </div>

          <div class="relations-panel" *ngIf="isEditing && selectedPage">
            <div class="section-label">Conex├Áes da P├ígina</div>
            <div class="loading-mini" *ngIf="loadingRelations">Carregando conex├Áes...</div>

            <div class="relations-grid" *ngIf="!loadingRelations && relations">
              <div class="relation-card">
                <h4>P├ígina m├úe</h4>
                <button
                  class="link-chip"
                  *ngIf="relations.parent"
                  (click)="openPageById(relations.parent.id)"
                >
                  {{ relations.parent.title }}
                </button>
                <div class="empty" *ngIf="!relations.parent">P├ígina raiz</div>
              </div>

              <div class="relation-card">
                <h4>Filhas</h4>
                <button
                  class="link-chip"
                  *ngFor="let child of relations.children"
                  (click)="openPageById(child.id)"
                >
                  {{ child.title }}
                </button>
                <div class="empty" *ngIf="relations.children.length === 0">Nenhuma subp├ígina</div>
              </div>

              <div class="relation-card">
                <h4>Backlinks</h4>
                <button
                  class="link-chip"
                  *ngFor="let ref of relations.backlinks"
                  (click)="openPageById(ref.id)"
                >
                  {{ ref.title }}
                </button>
                <div class="empty" *ngIf="relations.backlinks.length === 0">Nenhum backlink</div>
              </div>

              <div class="relation-card">
                <h4>Links de sa├¡da</h4>
                <button
                  class="link-chip"
                  *ngFor="let ref of relations.outgoingLinks"
                  (click)="openPageById(ref.id)"
                >
                  {{ ref.title }}
                </button>
                <div class="empty" *ngIf="relations.outgoingLinks.length === 0">Nenhum link interno</div>
              </div>

              <div class="relation-card relation-card-wide">
                <h4>P├íginas relacionadas por tags</h4>
                <button
                  class="link-chip"
                  *ngFor="let ref of relations.relatedByTag"
                  (click)="openPageById(ref.id)"
                >
                  {{ ref.title }}
                  <span class="shared-tags">({{ ref.sharedTags.join(', ') }})</span>
                </button>
                <div class="empty" *ngIf="relations.relatedByTag.length === 0">
                  Nenhuma p├ígina relacionada por tags
                </div>
              </div>

              <div class="relation-card relation-card-wide">
                <h4>Backlinks de Entidades</h4>
                <div class="link-chip static-chip" *ngFor="let ref of relations.entityBacklinks">
                  <strong>{{ ref.title }}</strong>
                  <span class="entity-meta">{{ ref.entityType }} · {{ ref.excerpt || 'Sem resumo' }}</span>
                </div>
                <div class="empty" *ngIf="relations.entityBacklinks.length === 0">
                  Nenhuma entidade faz referencia a esta pagina
                </div>
              </div>

              <div class="relation-card relation-card-wide">
                <h4>Entidades Citadas na Pagina</h4>
                <div class="link-chip static-chip" *ngFor="let ref of relations.outgoingEntities">
                  <strong>{{ ref.title }}</strong>
                  <span class="entity-meta">{{ ref.entityType }}</span>
                </div>
                <div class="empty" *ngIf="relations.outgoingEntities.length === 0">
                  Nenhuma entidade citada com &#64; ou [[...]]
                </div>
              </div>
            </div>
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
      .legacy-feedback {
        margin-bottom: 1rem;
        color: var(--accent-primary);
        border: 1px solid rgba(201, 168, 76, 0.4);
        background: rgba(201, 168, 76, 0.08);
        border-radius: var(--radius-sm);
        padding: 0.6rem 0.8rem;
        font-size: 0.85rem;
      }
      .template-box {
        margin-bottom: 1rem;
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
      .drop-root {
        border: 1px dashed rgba(201, 168, 76, 0.5);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: 0.78rem;
        padding: 0.5rem 0.6rem;
        margin-bottom: 0.75rem;
        text-align: center;
      }
      .favorites-box {
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
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
      .wiki-list-item.moving {
        opacity: 0.55;
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
      .editor-head-actions {
        display: flex;
        gap: 0.5rem;
      }
      .editor-form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }
      .editor-form .checkbox-label {
        grid-column: 1 / -1;
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
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .blocks-layout {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.02);
      }
      .block-item {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: 0.6rem;
        margin-bottom: 0.75rem;
        background: rgba(15, 15, 26, 0.45);
      }
      .block-type {
        margin-bottom: 0.5rem;
      }
      .block-content {
        margin-bottom: 0.5rem;
      }
      .block-actions,
      .block-adders {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .relations-panel {
        margin-top: 1.25rem;
        border-top: 1px solid var(--border-color);
        padding-top: 1rem;
      }
      .relations-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }
      .relation-card {
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.02);
        padding: 0.75rem;
      }
      .relation-card h4 {
        margin: 0 0 0.6rem;
        font-size: 0.85rem;
        color: var(--accent-primary);
      }
      .relation-card-wide {
        grid-column: 1 / -1;
      }
      .link-chip {
        width: 100%;
        display: block;
        margin-bottom: 0.5rem;
        text-align: left;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        background: rgba(15, 15, 26, 0.55);
        color: var(--text-primary);
        padding: 0.5rem 0.6rem;
        cursor: pointer;
      }
      .link-chip:hover {
        border-color: var(--accent-primary);
      }
      .static-chip {
        cursor: default;
      }
      .static-chip:hover {
        border-color: var(--border-color);
      }
      .entity-meta {
        display: block;
        margin-top: 0.2rem;
        font-size: 0.74rem;
        color: var(--text-muted);
      }
      .shared-tags {
        color: var(--text-muted);
        margin-left: 0.3rem;
        font-size: 0.78rem;
      }
      .loading-mini {
        color: var(--text-muted);
        font-size: 0.85rem;
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
        .relations-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class CampaignWikiComponent implements OnInit {
  campaignId = '';
  loading = true;
  pages: WikiPageView[] = [];
  tree: WikiTreeNode[] = [];
  flatTreeNodes: FlatTreeNode[] = [];
  favorites: WikiFavorite[] = [];
  templates: WikiTemplate[] = [];
  selectedPage: WikiPageView | null = null;
  relations: WikiPageRelations | null = null;
  blocks: EditableWikiBlock[] = [];
  blockEditorMode = false;
  loadingRelations = false;
  loadingBlocks = false;
  bootstrappingLegacy = false;
  legacyMessage = '';
  templateCreatorVisible = false;
  creatingFromTemplate = false;
  draggingNodeId: string | null = null;
  movingHierarchy = false;

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
    parentPageId: string;
    title: string;
    content: string;
    category: WikiCategory;
    tagsInput: string;
    isPublic: boolean;
  } = {
    parentPageId: '',
    title: '',
    content: '',
    category: 'LORE',
    tagsInput: '',
    isPublic: true,
  };

  templateForm: {
    title: string;
    templateKey: 'CHARACTER_DOSSIER' | 'LOCATION_ATLAS' | 'SESSION_CHRONICLE';
    parentPageId: string;
    isPublic: boolean;
  } = {
    title: '',
    templateKey: 'CHARACTER_DOSSIER',
    parentPageId: '',
    isPublic: true,
  };

  constructor(
    private route: ActivatedRoute,
    private wikiService: WikiService
  ) {}

  ngOnInit(): void {
    this.campaignId = this.route.snapshot.paramMap.get('id') || '';
    this.loadTemplates();
    this.loadPages();
  }

  private loadTemplates(): void {
    this.wikiService.getTemplates().subscribe({
      next: (response) => {
        this.templates = response.data || [];
      },
    });
  }

  loadPages(): void {
    if (!this.campaignId) {
      return;
    }

    this.loading = true;
    forkJoin({
      pages: this.wikiService.getCampaignPages(this.campaignId, {
        category: (this.selectedCategory as WikiCategory) || undefined,
        search: this.searchTerm || undefined,
      }),
      tree: this.wikiService.getCampaignTree(this.campaignId),
      favorites: this.wikiService.getFavorites(this.campaignId),
    }).subscribe({
      next: ({ pages, tree, favorites }) => {
        this.pages = (pages.data || []) as WikiPageView[];
        this.tree = tree.data || [];
        this.flatTreeNodes = this.flattenTree(this.tree);
        this.favorites = favorites.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  openPage(page: WikiPageView): void {
    this.selectedPage = page;
    this.editorVisible = true;
    this.isEditing = true;
    this.form = {
      parentPageId: page.parentPageId || '',
      title: page.title || '',
      content: page.content || '',
      category: page.category || 'LORE',
      tagsInput: (page.tags || []).join(', '),
      isPublic: page.isPublic ?? true,
    };

    this.loadRelations(page.id);
    this.loadBlocks(page.id);
  }

  openPageById(pageId: string): void {
    const existingPage = this.pages.find((page) => page.id === pageId);

    if (existingPage) {
      this.openPage(existingPage);
      return;
    }

    this.wikiService.getPageById(pageId).subscribe({
      next: (response) => {
        const page = response.data as WikiPageView;
        this.pages = [page, ...this.pages.filter((entry) => entry.id !== page.id)];
        this.openPage(page);
      },
    });
  }

  startCreate(): void {
    this.selectedPage = null;
    this.relations = null;
    this.blocks = [];
    this.blockEditorMode = false;
    this.editorVisible = true;
    this.isEditing = false;
    this.form = {
      parentPageId: '',
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
    this.relations = null;
    this.blocks = [];
    this.blockEditorMode = false;
  }

  savePage(): void {
    const tags = this.form.tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      campaignId: this.campaignId,
      parentPageId: this.form.parentPageId || null,
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
        this.legacyMessage = '';
        this.editorVisible = false;
        this.selectedPage = null;
        this.relations = null;
        this.blocks = [];
        this.blockEditorMode = false;
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
        this.relations = null;
        this.blocks = [];
        this.blockEditorMode = false;
        this.loadPages();
      },
    });
  }

  openTemplateCreator(): void {
    this.templateCreatorVisible = true;
    this.templateForm = {
      title: '',
      templateKey: this.templates[0]?.key || 'CHARACTER_DOSSIER',
      parentPageId: '',
      isPublic: true,
    };
  }

  createFromTemplate(): void {
    if (!this.campaignId || !this.templateForm.title || this.creatingFromTemplate) {
      return;
    }

    this.creatingFromTemplate = true;
    this.wikiService
      .createPageFromTemplate(this.campaignId, {
        title: this.templateForm.title,
        templateKey: this.templateForm.templateKey,
        parentPageId: this.templateForm.parentPageId || null,
        isPublic: this.templateForm.isPublic,
      })
      .subscribe({
        next: (response) => {
          this.creatingFromTemplate = false;
          this.templateCreatorVisible = false;
          this.legacyMessage = 'Template aplicado com sucesso.';
          this.loadPages();
          this.openPage(response.data as WikiPageView);
        },
        error: () => {
          this.creatingFromTemplate = false;
        },
      });
  }

  private loadBlocks(wikiPageId: string): void {
    this.loadingBlocks = true;
    this.wikiService.getPageBlocks(wikiPageId).subscribe({
      next: (response) => {
        this.blocks = (response.data || []).map((block) => this.toEditableBlock(block));
        this.loadingBlocks = false;
      },
      error: () => {
        this.loadingBlocks = false;
      },
    });
  }

  private toEditableBlock(block: WikiBlock): EditableWikiBlock {
    const payload = block.payload || {};

    if (block.blockType === 'CHECKLIST') {
      const items = Array.isArray(payload['items']) ? payload['items'] : [];
      const checklistText = items
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return '';
          }

          const record = item as Record<string, unknown>;
          const checked = Boolean(record['checked']);
          const text = String(record['text'] || '');
          return checked ? `[x] ${text}` : `[ ] ${text}`;
        })
        .filter((line) => line.length > 0)
        .join('\n');

      return {
        id: block.id,
        blockType: block.blockType,
        payload: {
          checklistText,
        },
      };
    }

    return {
      id: block.id,
      blockType: block.blockType,
      payload: {
        content: String(payload['content'] || ''),
      },
    };
  }

  toggleEditorMode(): void {
    this.blockEditorMode = !this.blockEditorMode;
  }

  addBlock(type: EditableWikiBlock['blockType']): void {
    this.blocks.push({
      id: `new-${Date.now()}-${Math.random()}`,
      blockType: type,
      payload: type === 'CHECKLIST' ? { checklistText: '' } : { content: '' },
    });
  }

  removeBlock(index: number): void {
    this.blocks.splice(index, 1);
  }

  moveBlock(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= this.blocks.length) {
      return;
    }

    const current = this.blocks[index];
    this.blocks[index] = this.blocks[target];
    this.blocks[target] = current;
  }

  saveBlocks(): void {
    if (!this.selectedPage) {
      return;
    }

    const normalizedBlocks = this.blocks.map((block) => {
      if (block.blockType === 'CHECKLIST') {
        const lines = String(block.payload.checklistText || '')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        return {
          blockType: block.blockType,
          payload: {
            items: lines.map((line) => {
              const checked = line.startsWith('[x]') || line.startsWith('[X]');
              const text = line.replace(/^\[(x|X| )\]\s*/, '').trim();
              return {
                text,
                checked,
              };
            }),
          },
        };
      }

      return {
        blockType: block.blockType,
        payload: {
          content: String(block.payload.content || ''),
        },
      };
    });

    this.wikiService
      .upsertPageBlocks(this.selectedPage.id, {
        blocks: normalizedBlocks,
      })
      .subscribe({
        next: () => {
          this.legacyMessage = 'Blocos salvos com sucesso.';
          this.loadPages();
          this.loadBlocks(this.selectedPage!.id);
        },
      });
  }

  isSelectedFavorite(): boolean {
    if (!this.selectedPage) {
      return false;
    }

    return this.favorites.some((favorite) => favorite.page.id === this.selectedPage!.id);
  }

  toggleFavorite(): void {
    if (!this.selectedPage) {
      return;
    }

    const request$ = this.isSelectedFavorite()
      ? this.wikiService.removeFavorite(this.selectedPage.id)
      : this.wikiService.addFavorite(this.selectedPage.id);

    request$.subscribe({
      next: () => {
        this.loadPages();
      },
    });
  }

  private loadRelations(wikiPageId: string): void {
    this.loadingRelations = true;
    this.relations = null;

    this.wikiService.getPageRelations(wikiPageId).subscribe({
      next: (response) => {
        this.relations = response.data;
        this.loadingRelations = false;
      },
      error: () => {
        this.loadingRelations = false;
      },
    });
  }

  private flattenTree(nodes: WikiTreeNode[], depth = 0): FlatTreeNode[] {
    const flat: FlatTreeNode[] = [];

    for (const node of nodes) {
      flat.push({
        id: node.id,
        title: node.title,
        category: node.category,
        isPublic: node.isPublic,
        depth,
      });

      flat.push(...this.flattenTree(node.children, depth + 1));
    }

    return flat;
  }

  getVisibleTreeNodes(): FlatTreeNode[] {
    if (!this.searchTerm && !this.selectedCategory) {
      return this.flatTreeNodes;
    }

    const visibleIds = new Set(this.pages.map((page) => page.id));
    return this.flatTreeNodes.filter((node) => visibleIds.has(node.id));
  }

  onTreeDragStart(nodeId: string): void {
    this.draggingNodeId = nodeId;
  }

  onTreeDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onTreeDropOnNode(targetNodeId: string, event: DragEvent): void {
    event.preventDefault();
    void this.moveTreeNode(targetNodeId);
  }

  onTreeDropOnRoot(event: DragEvent): void {
    event.preventDefault();
    void this.moveTreeNode(null);
  }

  formatTreeOption(option: FlatTreeNode): string {
    return `${'Ôå│ '.repeat(option.depth)}${option.title}`;
  }

  getParentOptions(): FlatTreeNode[] {
    if (!this.selectedPage) {
      return this.flatTreeNodes;
    }

    const invalidParentIds = this.collectDescendantIds(this.selectedPage.id);
    invalidParentIds.add(this.selectedPage.id);

    return this.flatTreeNodes.filter((option) => !invalidParentIds.has(option.id));
  }

  private collectDescendantIds(rootId: string): Set<string> {
    const descendants = new Set<string>();
    const root = this.findTreeNode(this.tree, rootId);

    if (!root) {
      return descendants;
    }

    const walk = (node: WikiTreeNode) => {
      for (const child of node.children) {
        descendants.add(child.id);
        walk(child);
      }
    };

    walk(root);
    return descendants;
  }

  private async moveTreeNode(nextParentId: string | null): Promise<void> {
    const sourceNodeId = this.draggingNodeId;
    this.draggingNodeId = null;

    if (!sourceNodeId || this.movingHierarchy) {
      return;
    }

    if (sourceNodeId === nextParentId) {
      return;
    }

    if (nextParentId) {
      const invalidParentIds = this.collectDescendantIds(sourceNodeId);
      if (invalidParentIds.has(nextParentId)) {
        this.legacyMessage = 'Movimento invalido: uma pagina nao pode virar filha de sua descendente.';
        return;
      }
    }

    this.movingHierarchy = true;
    this.wikiService
      .updatePage(sourceNodeId, {
        parentPageId: nextParentId,
      })
      .subscribe({
        next: () => {
          this.legacyMessage = 'Hierarquia atualizada com sucesso.';
          this.movingHierarchy = false;
          this.loadPages();
          if (this.selectedPage?.id) {
            this.loadRelations(this.selectedPage.id);
          }
        },
        error: () => {
          this.legacyMessage = 'Falha ao mover pagina na arvore hierarquica.';
          this.movingHierarchy = false;
        },
      });
  }

  private findTreeNode(nodes: WikiTreeNode[], targetId: string): WikiTreeNode | null {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }

      const inChildren = this.findTreeNode(node.children, targetId);
      if (inChildren) {
        return inChildren;
      }
    }

    return null;
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

  bootstrapLegacy(): void {
    if (!this.campaignId || this.bootstrappingLegacy) {
      return;
    }

    this.bootstrappingLegacy = true;
    this.legacyMessage = '';

    this.wikiService.bootstrapLegacy(this.campaignId).subscribe({
      next: (response) => {
        const result = response.data;
        this.legacyMessage = `Legado sincronizado: ${result.createdCount} p├ígina(s) criada(s), ${result.skippedCount} j├í existiam.`;
        this.bootstrappingLegacy = false;
        this.loadPages();
      },
      error: () => {
        this.legacyMessage = 'N├úo foi poss├¡vel importar o legado. Verifique permiss├Áes de GM nesta campanha.';
        this.bootstrappingLegacy = false;
      },
    });
  }
}

