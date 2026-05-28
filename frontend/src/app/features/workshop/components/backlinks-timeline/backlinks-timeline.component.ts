import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { WorkshopStoreService } from '../../services/workshop-store.service';

@Component({
  selector: 'app-workshop-backlinks-timeline',
  standalone: true,
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="memory-panel">
      <section>
        <div class="panel-title">Backlinks</div>
        <button
          *ngFor="let backlink of store.selectedBacklinks()"
          class="memory-item"
          type="button"
          (click)="backlink.sourcePage && store.selectPage(backlink.sourcePage.id)"
        >
          <strong>{{ backlink.sourcePage?.title }}</strong>
          <span>{{ backlink.entity?.name }} citado como {{ backlink.label }}</span>
        </button>
        <p class="empty" *ngIf="store.selectedBacklinks().length === 0">Sem backlinks para esta pagina.</p>
      </section>

      <section>
        <div class="panel-title">Timeline</div>
        <button
          *ngFor="let entry of store.timeline().slice(0, 6)"
          class="memory-item"
          type="button"
          [class.live]="entry.kind === 'relation'"
          (click)="store.selectPage(entry.pageId)"
        >
          <strong>{{ entry.title }}</strong>
          <span>{{ entry.description }}</span>
          <small>{{ entry.happenedAt | date:'dd/MM HH:mm' }}</small>
        </button>
      </section>
    </aside>
  `,
  styles: [
    `
      .memory-panel {
        min-height: 0;
        overflow: auto;
        border-left: 1px solid #d7dde8;
        background: #f8fafc;
        padding: 1rem;
      }

      section + section {
        margin-top: 1.2rem;
        padding-top: 1.2rem;
        border-top: 1px solid #e0e7ef;
      }

      .panel-title {
        margin-bottom: 0.55rem;
        color: #526070;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .memory-item {
        width: 100%;
        display: grid;
        gap: 0.25rem;
        margin-bottom: 0.5rem;
        padding: 0.7rem;
        border: 1px solid #d9e1ea;
        border-radius: 8px;
        background: #ffffff;
        color: #1d2835;
        text-align: left;
        cursor: pointer;
      }

      .memory-item.live {
        border-color: #59aa8e;
        background: #f0faf5;
      }

      .memory-item:hover {
        border-color: #a9bacd;
      }

      .memory-item strong {
        font-size: 0.9rem;
      }

      .memory-item span,
      .memory-item small,
      .empty {
        color: #667589;
        font-size: 0.78rem;
        line-height: 1.35;
      }
    `,
  ],
})
export class WorkshopBacklinksTimelineComponent {
  constructor(readonly store: WorkshopStoreService) {}
}
