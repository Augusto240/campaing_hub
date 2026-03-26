import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-mana-bar',
  standalone: true,
  template: `
    <div class="meter-shell">
      <div class="meter-row">
        <span>Mana</span>
        <span>{{ current() }}/{{ max() }}</span>
      </div>
      <div class="meter-track">
        <div class="meter-fill" [style.width.%]="percentage()"></div>
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
        background: linear-gradient(90deg, #215d96, #51b0ff);
        transition: width 180ms ease;
      }
    `,
  ],
})
export class ManaBarComponent {
  readonly current = input<number>(0);
  readonly max = input<number>(1);

  readonly percentage = computed(() => {
    const max = this.max() || 1;
    return Math.max(0, Math.min(100, (this.current() / max) * 100));
  });
}
