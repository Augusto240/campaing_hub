import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopStoreService, normalizeEntityName } from '../../services/workshop-store.service';
import { WORKSHOP_BLOCK_LABELS, WorkshopBlock, WorkshopBlockType, WorkshopEntity } from '../../workshop.types';

type BlockCommand = {
  type: WorkshopBlockType;
  label: string;
  hint: string;
};

@Component({
  selector: 'app-workshop-block-editor',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="editor-panel" *ngIf="store.selectedPage() as page">
      <header class="editor-header">
        <div>
          <div class="eyebrow">Pagina ativa</div>
          <h1>{{ page.title }}</h1>
          <p>{{ page.summary }}</p>
        </div>
        <button class="secondary-action" type="button" (click)="addBlock()">Novo bloco</button>
      </header>

      <div class="tag-row">
        <span *ngFor="let tag of page.tags">{{ tag }}</span>
      </div>

      <div class="relation-row" *ngIf="store.selectedOutgoingRelations().length > 0">
        <button
          *ngFor="let relation of store.selectedOutgoingRelations()"
          class="relation-chip"
          type="button"
          [class.live]="relation.origin === 'live'"
          [disabled]="!relation.targetPage"
          (click)="relation.targetPage && store.selectPage(relation.targetPage.id)"
        >
          &#64;{{ relation.entity?.name || 'Entidade' }}
        </button>
      </div>

      <div class="blocks">
        <article *ngFor="let block of store.selectedBlocks()" class="block" [attr.data-type]="block.type">
          <div class="block-label">{{ blockLabel(block.type) }}</div>

          <label *ngIf="block.type === 'checklist'" class="checkline">
            <input type="checkbox" [checked]="block.checked" (change)="store.toggleChecklist(block.id)" />
            <textarea
              [value]="block.content"
              rows="1"
              placeholder="Item de acompanhamento"
              (input)="onInput(block, $event)"
              (focus)="onFocus(block)"
            ></textarea>
          </label>

          <textarea
            *ngIf="block.type !== 'checklist'"
            [class.heading]="block.type === 'heading'"
            [class.code]="block.type === 'code'"
            [value]="block.content"
            [rows]="block.type === 'heading' ? 1 : 3"
            [placeholder]="placeholderFor(block.type)"
            (input)="onInput(block, $event)"
            (focus)="onFocus(block)"
          ></textarea>

          <div class="command-menu" *ngIf="commandBlockId() === block.id">
            <button *ngFor="let command of commands" type="button" (click)="chooseCommand(block.id, command.type)">
              <strong>{{ command.label }}</strong>
              <span>{{ command.hint }}</span>
            </button>
          </div>

          <div class="mention-menu" *ngIf="mentionBlockId() === block.id && matchingEntities().length > 0">
            <button *ngFor="let entity of matchingEntities()" type="button" (click)="chooseMention(block, entity)">
              <strong>&#64;{{ entity.name }}</strong>
              <span>{{ entity.summary }}</span>
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `
      .editor-panel {
        min-width: 0;
        min-height: 0;
        overflow: auto;
        padding: 1.25rem 1.5rem 2rem;
        background: #ffffff;
      }

      .editor-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e3e8ef;
      }

      .eyebrow,
      .block-label {
        color: #687789;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      h1 {
        margin: 0.18rem 0 0.35rem;
        color: #17212f;
        font-family: Inter, Arial, sans-serif;
        font-size: clamp(1.7rem, 2.3vw, 2.45rem);
        letter-spacing: 0;
      }

      p {
        max-width: 760px;
        margin: 0;
        color: #5e6d80;
        line-height: 1.45;
      }

      .secondary-action {
        flex: 0 0 auto;
        min-height: 40px;
        padding: 0 0.85rem;
        border: 1px solid #c9d3e0;
        border-radius: 8px;
        background: #f7fafc;
        color: #1c2b3a;
        font-weight: 750;
        cursor: pointer;
      }

      .tag-row,
      .relation-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
        margin-top: 0.85rem;
      }

      .tag-row span,
      .relation-chip {
        min-height: 30px;
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 750;
      }

      .tag-row span {
        padding: 0 0.65rem;
        background: #eef3f8;
        color: #526070;
      }

      .relation-chip {
        padding: 0 0.7rem;
        border: 1px solid #bed0e6;
        background: #f5f9ff;
        color: #23476f;
        cursor: pointer;
      }

      .relation-chip.live {
        border-color: #55a789;
        background: #edf9f4;
        color: #12654a;
      }

      .blocks {
        display: grid;
        gap: 0.9rem;
        margin-top: 1.15rem;
      }

      .block {
        position: relative;
        display: grid;
        gap: 0.4rem;
        padding: 0.9rem;
        border: 1px solid #e1e7ef;
        border-radius: 8px;
        background: #fbfcfe;
      }

      .block[data-type='callout'] {
        border-color: #f0cf77;
        background: #fff9eb;
      }

      .block[data-type='quote'] {
        border-left: 4px solid #7d8fa8;
      }

      textarea {
        width: 100%;
        resize: vertical;
        border: 0;
        outline: none;
        background: transparent;
        color: #17212f;
        font: 500 0.98rem/1.5 Inter, Arial, sans-serif;
      }

      textarea.heading {
        font-size: 1.35rem;
        font-weight: 800;
      }

      textarea.code {
        border-radius: 6px;
        background: #192331;
        color: #e9f0f6;
        padding: 0.75rem;
        font-family: 'Fira Code', monospace;
        font-size: 0.9rem;
      }

      .checkline {
        display: grid;
        grid-template-columns: 22px 1fr;
        align-items: start;
        gap: 0.6rem;
      }

      .checkline input {
        margin-top: 0.35rem;
      }

      .command-menu,
      .mention-menu {
        position: absolute;
        left: 0.9rem;
        top: calc(100% - 0.2rem);
        z-index: 5;
        width: min(360px, calc(100vw - 2rem));
        display: grid;
        gap: 0.25rem;
        padding: 0.45rem;
        border: 1px solid #c8d3df;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 42px rgba(25, 36, 52, 0.18);
      }

      .command-menu button,
      .mention-menu button {
        display: grid;
        gap: 0.18rem;
        padding: 0.55rem 0.65rem;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #1f2e3d;
        text-align: left;
        cursor: pointer;
      }

      .command-menu button:hover,
      .mention-menu button:hover {
        background: #f1f5f9;
      }

      .command-menu span,
      .mention-menu span {
        color: #687789;
        font-size: 0.78rem;
      }
    `,
  ],
})
export class WorkshopBlockEditorComponent {
  readonly commandBlockId = signal<string | null>(null);
  readonly mentionBlockId = signal<string | null>(null);
  readonly mentionQuery = signal('');

  readonly commands: BlockCommand[] = [
    { type: 'paragraph', label: 'Texto', hint: 'Paragrafo simples' },
    { type: 'heading', label: 'Titulo', hint: 'Secao de destaque' },
    { type: 'quote', label: 'Citacao', hint: 'Memoria narrada' },
    { type: 'callout', label: 'Nota', hint: 'Bloco de contexto' },
    { type: 'checklist', label: 'Checklist', hint: 'Item de acompanhamento' },
    { type: 'code', label: 'Codigo', hint: 'Trecho tecnico' },
  ];

  constructor(readonly store: WorkshopStoreService) {}

  blockLabel(type: WorkshopBlockType): string {
    return WORKSHOP_BLOCK_LABELS[type];
  }

  placeholderFor(type: WorkshopBlockType): string {
    const placeholders: Record<WorkshopBlockType, string> = {
      paragraph: 'Digite texto, / para blocos ou @ para entidade',
      heading: 'Titulo da secao',
      quote: 'Citacao ou memoria',
      callout: 'Nota de contexto',
      checklist: 'Item',
      code: 'Codigo ou pseudo-fluxo',
    };

    return placeholders[type];
  }

  addBlock(): void {
    const blocks = this.store.selectedBlocks();
    this.store.insertBlockAfter(blocks[blocks.length - 1]?.id ?? null);
  }

  onFocus(block: WorkshopBlock): void {
    if (block.content.trim() === '/') {
      this.commandBlockId.set(block.id);
    }
  }

  onInput(block: WorkshopBlock, event: Event): void {
    const content = (event.target as HTMLTextAreaElement).value;
    this.store.updateBlockContent(block.id, content);

    this.commandBlockId.set(content.trim() === '/' ? block.id : null);
    this.updateMentionState(block.id, content);
  }

  chooseCommand(blockId: string, type: WorkshopBlockType): void {
    this.store.setBlockType(blockId, type);
    this.commandBlockId.set(null);
  }

  matchingEntities(): WorkshopEntity[] {
    const query = normalizeEntityName(this.mentionQuery());
    return this.store
      .entities()
      .filter((entity) => normalizeEntityName(entity.name).includes(query))
      .slice(0, 5);
  }

  chooseMention(block: WorkshopBlock, entity: WorkshopEntity): void {
    const nextContent = block.content.replace(/@([^@]*)$/, `@${entity.name}`);
    this.store.updateBlockContent(block.id, nextContent);
    this.mentionBlockId.set(null);
    this.mentionQuery.set('');
  }

  private updateMentionState(blockId: string, content: string): void {
    const match = content.match(/@([^@]*)$/);
    if (!match) {
      this.mentionBlockId.set(null);
      this.mentionQuery.set('');
      return;
    }

    this.mentionBlockId.set(blockId);
    this.mentionQuery.set(match[1]?.trim() ?? '');
  }
}
