import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopStoreService } from './services/workshop-store.service';
import { WorkshopWikiTreeComponent } from './components/wiki-tree/wiki-tree.component';
import { WorkshopBlockEditorComponent } from './components/editor/block-editor.component';
import { WorkshopBacklinksTimelineComponent } from './components/backlinks-timeline/backlinks-timeline.component';
import { WorkshopKnowledgeGraphComponent } from './components/knowledge-graph/knowledge-graph.component';

@Component({
  selector: 'app-workshop-shell',
  standalone: true,
  imports: [
    CommonModule,
    WorkshopWikiTreeComponent,
    WorkshopBlockEditorComponent,
    WorkshopBacklinksTimelineComponent,
    WorkshopKnowledgeGraphComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="workshop-shell">
      <header class="topbar">
        <div>
          <span>Campaign Hub</span>
          <strong>Wiki viva com Angular</strong>
        </div>
        <div class="status">Mock-first demo</div>
      </header>

      <div class="loading-state" *ngIf="store.loading()">Carregando workshop...</div>
      <div class="error-state" *ngIf="store.error() as error">{{ error }}</div>

      <div class="workspace" *ngIf="!store.loading() && !store.error()">
        <app-workshop-wiki-tree></app-workshop-wiki-tree>
        <div class="center-column">
          <app-workshop-block-editor></app-workshop-block-editor>
          <app-workshop-knowledge-graph></app-workshop-knowledge-graph>
        </div>
        <app-workshop-backlinks-timeline></app-workshop-backlinks-timeline>
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: #e9eef5;
        color: #17212f;
        font-family: Inter, Arial, sans-serif;
      }

      .workshop-shell {
        min-height: 100vh;
        display: grid;
        grid-template-rows: 58px 1fr;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        border-bottom: 1px solid #cfd8e3;
        background: #ffffff;
        padding: 0 1rem;
      }

      .topbar div:first-child {
        display: flex;
        align-items: baseline;
        gap: 0.7rem;
        min-width: 0;
      }

      .topbar span,
      .status {
        color: #667589;
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      .topbar strong {
        overflow: hidden;
        color: #17212f;
        font-size: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .status {
        min-height: 30px;
        display: inline-flex;
        align-items: center;
        padding: 0 0.65rem;
        border: 1px solid #cbd7e4;
        border-radius: 999px;
        background: #f6f9fc;
      }

      .workspace {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(220px, 290px) minmax(0, 1fr) minmax(250px, 320px);
      }

      .center-column {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
      }

      .loading-state,
      .error-state {
        display: grid;
        place-items: center;
        min-height: calc(100vh - 58px);
        color: #526070;
        font-weight: 750;
      }

      @media (max-width: 1080px) {
        .workspace {
          grid-template-columns: minmax(210px, 270px) minmax(0, 1fr);
        }

        app-workshop-backlinks-timeline {
          grid-column: 1 / -1;
          min-height: 260px;
        }
      }

      @media (max-width: 760px) {
        .workshop-shell {
          grid-template-rows: auto 1fr;
        }

        .topbar {
          align-items: flex-start;
          flex-direction: column;
          padding: 0.8rem 1rem;
        }

        .workspace {
          grid-template-columns: 1fr;
        }

        app-workshop-wiki-tree {
          min-height: 260px;
        }
      }
    `,
  ],
})
export class WorkshopShellComponent implements OnInit {
  constructor(readonly store: WorkshopStoreService) {}

  ngOnInit(): void {
    void this.store.load();
  }
}
