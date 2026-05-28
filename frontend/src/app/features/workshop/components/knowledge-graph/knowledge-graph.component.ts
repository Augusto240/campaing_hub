import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkshopGraphNode } from '../../workshop.types';
import { WorkshopStoreService } from '../../services/workshop-store.service';

@Component({
  selector: 'app-workshop-knowledge-graph',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="graph-panel">
      <header>
        <div>
          <div class="panel-title">Knowledge graph</div>
          <p>{{ store.graphView().nodes.length }} nos, {{ store.graphView().edges.length }} relacoes</p>
        </div>
      </header>

      <svg viewBox="0 0 720 360" role="img" aria-label="Grafo de conhecimento da wiki">
        <line
          *ngFor="let edge of store.graphView().edges"
          [attr.x1]="x(edge.source)"
          [attr.y1]="y(edge.source)"
          [attr.x2]="x(edge.target)"
          [attr.y2]="y(edge.target)"
          [class.highlight]="edge.id === store.graphView().highlightEdgeId"
        />

        <g
          *ngFor="let node of store.graphView().nodes"
          class="node"
          [class.entity]="node.type !== 'page'"
          [attr.transform]="'translate(' + x(node.id) + ' ' + y(node.id) + ')'"
        >
          <circle r="18"></circle>
          <text x="0" y="36">{{ shortLabel(node) }}</text>
        </g>
      </svg>
    </section>
  `,
  styles: [
    `
      .graph-panel {
        border-top: 1px solid #d7dde8;
        background: #f8fafc;
        padding: 0.85rem 1rem 1rem;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.45rem;
      }

      .panel-title {
        color: #526070;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      p {
        margin: 0.2rem 0 0;
        color: #667589;
        font-size: 0.78rem;
      }

      svg {
        width: 100%;
        height: 230px;
        display: block;
        border: 1px solid #dce4ee;
        border-radius: 8px;
        background:
          linear-gradient(#eef3f8 1px, transparent 1px),
          linear-gradient(90deg, #eef3f8 1px, transparent 1px),
          #ffffff;
        background-size: 34px 34px;
      }

      line {
        stroke: #9cadc2;
        stroke-width: 2;
      }

      line.highlight {
        stroke: #21a67a;
        stroke-width: 4;
      }

      .node circle {
        fill: #24476f;
        stroke: #ffffff;
        stroke-width: 3;
      }

      .node.entity circle {
        fill: #8058a8;
      }

      .node text {
        fill: #17212f;
        font-family: Inter, Arial, sans-serif;
        font-size: 0.72rem;
        font-weight: 750;
        letter-spacing: 0;
        text-anchor: middle;
      }
    `,
  ],
})
export class WorkshopKnowledgeGraphComponent {
  constructor(readonly store: WorkshopStoreService) {}

  x(nodeId: string): number {
    return this.position(nodeId).x;
  }

  y(nodeId: string): number {
    return this.position(nodeId).y;
  }

  shortLabel(node: WorkshopGraphNode): string {
    return node.label.length > 18 ? `${node.label.slice(0, 16)}...` : node.label;
  }

  private position(nodeId: string): { x: number; y: number } {
    const nodes = this.store.graphView().nodes;
    const index = Math.max(nodes.findIndex((node) => node.id === nodeId), 0);
    const total = Math.max(nodes.length, 1);
    const angle = -Math.PI / 2 + (index / total) * Math.PI * 2;
    const radiusX = 260;
    const radiusY = 112;

    return {
      x: Math.round(360 + Math.cos(angle) * radiusX),
      y: Math.round(172 + Math.sin(angle) * radiusY),
    };
  }
}
