import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

type DiceResultView = {
  formula: string;
  result: number;
  label?: string | null;
  isPrivate?: boolean;
  breakdown?: {
    rolls?: number[];
    kept?: number[];
    dropped?: number[];
    modifier?: number;
  } | null;
};

@Component({
  selector: 'app-dice-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="result-card" [class.critical]="isCritical()" [class.fumble]="isFumble()">
      <div class="head">
        <div>
          <strong>{{ roll().label || roll().formula }}</strong>
          <small>{{ roll().formula }}</small>
        </div>
        <span class="value">{{ roll().result }}</span>
      </div>
      <div class="breakdown" *ngIf="roll().breakdown?.rolls?.length">
        <span *ngFor="let value of roll().breakdown?.rolls">{{ value }}</span>
      </div>
      <div class="meta" *ngIf="roll().isPrivate">Privada</div>
    </div>
  `,
  styles: [
    `
      .result-card {
        display: grid;
        gap: 0.5rem;
        padding: 0.9rem;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.09);
        background: linear-gradient(160deg, rgba(33, 32, 43, 0.9), rgba(15, 15, 20, 0.92));
      }
      .result-card.critical { border-color: rgba(201, 168, 76, 0.6); box-shadow: 0 0 18px rgba(201, 168, 76, 0.18); }
      .result-card.fumble { border-color: rgba(214, 69, 69, 0.6); box-shadow: 0 0 18px rgba(214, 69, 69, 0.18); }
      .head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      .head strong { display: block; }
      .head small { color: var(--text-secondary); }
      .value {
        min-width: 3rem;
        text-align: center;
        font-family: var(--font-mono);
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--color-primary);
      }
      .breakdown {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .breakdown span {
        padding: 0.25rem 0.55rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        font-family: var(--font-mono);
        font-size: 0.78rem;
      }
      .meta { color: var(--text-secondary); font-size: 0.78rem; }
    `,
  ],
})
export class DiceResultComponent {
  readonly roll = input.required<DiceResultView>();

  readonly isCritical = computed(() => this.roll().result === 20);
  readonly isFumble = computed(() => this.roll().result === 1);
}
