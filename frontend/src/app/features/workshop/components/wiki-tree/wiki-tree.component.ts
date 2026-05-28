import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopStoreService } from '../../services/workshop-store.service';

@Component({
  selector: 'app-workshop-wiki-tree',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="tree-panel" aria-label="Arvore da wiki">
      <div class="panel-title">Wiki viva</div>

      <button
        *ngFor="let node of store.flatTree()"
        class="tree-item"
        type="button"
        [class.active]="store.selectedPageId() === node.id"
        [style.padding-left.px]="16 + node.depth * 18"
        (click)="store.selectPage(node.id)"
      >
        <span class="tree-title">{{ node.title }}</span>
        <span class="tree-summary">{{ node.summary }}</span>
      </button>
    </aside>
  `,
  styles: [
    `
      .tree-panel {
        height: 100%;
        min-height: 0;
        overflow: auto;
        border-right: 1px solid #d7dde8;
        background: #f6f8fb;
        padding: 1rem 0.7rem;
      }

      .panel-title {
        padding: 0 0.6rem 0.75rem;
        color: #526070;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .tree-item {
        width: 100%;
        min-height: 58px;
        display: grid;
        gap: 0.22rem;
        margin-bottom: 0.25rem;
        padding: 0.55rem 0.7rem;
        border: 1px solid transparent;
        border-radius: 8px;
        background: transparent;
        color: #1d2835;
        text-align: left;
        cursor: pointer;
      }

      .tree-item:hover {
        background: #edf2f7;
      }

      .tree-item.active {
        background: #ffffff;
        border-color: #b9c7d8;
        box-shadow: 0 8px 22px rgba(34, 51, 84, 0.08);
      }

      .tree-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.92rem;
        font-weight: 750;
      }

      .tree-summary {
        display: -webkit-box;
        overflow: hidden;
        color: #697789;
        font-size: 0.76rem;
        line-height: 1.25;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
      }
    `,
  ],
})
export class WorkshopWikiTreeComponent {
  constructor(readonly store: WorkshopStoreService) {}
}
