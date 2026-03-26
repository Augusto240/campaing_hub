import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-hp-bar',
  standalone: true,
  template: `
    <div class="meter-shell">
      <div class="meter-row">
        <span>HP</span>
        <span>{{ current() }}/{{ max() }}</span>
      </div>
      <div class="meter-track">
        <div class="meter-fill" [style.width.%]="percentage()" [style.background]="fillColor()"></div>
      </div>
    </div>
  `,
  styles: [
    `
      .meter-shell { display: grid; gap: 0.35rem; }
      .meter-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.78rem;
        color: var(--text-secondary);
      }
      .meter-track {
        height: 0.7rem;
        border-radius: 999px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.08);
      }
      .meter-fill {
        height: 100%;
        border-radius: inherit;
        transition: width 180ms ease, background 180ms ease;
      }
    `,
  ],
})
export class HpBarComponent {
  readonly current = input<number>(0);
  readonly max = input<number>(1);

  readonly percentage = computed(() => {
    const max = this.max() || 1;
    return Math.max(0, Math.min(100, (this.current() / max) * 100));
  });

  readonly fillColor = computed(() => {
    const value = this.percentage();
    if (value <= 25) {
      return '#d64545';
    }
    if (value <= 50) {
      return '#e58b2a';
    }
    if (value <= 75) {
      return '#d1b34a';
    }
    return '#4ca56b';
  });
}
