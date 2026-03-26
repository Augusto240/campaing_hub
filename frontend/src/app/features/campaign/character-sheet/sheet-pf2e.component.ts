import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HpBarComponent } from '../../../shared/components/hp-bar.component';

@Component({
  selector: 'app-sheet-pf2e',
  standalone: true,
  imports: [CommonModule, HpBarComponent],
  template: `
    <div class="sheet-grid">
      <app-hp-bar [current]="hp()" [max]="maxHp()" />
      <div class="attr-grid">
        <article *ngFor="let attr of attributes()">
          <span>{{ attr.label }}</span>
          <strong>{{ attr.value }}</strong>
        </article>
      </div>
      <div class="notes">PF2e suporta proficiencias e tres acoes por turno neste sistema dinamico.</div>
    </div>
  `,
  styles: [
    `
      .sheet-grid { display: grid; gap: 0.75rem; }
      .attr-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.45rem;
      }
      article {
        padding: 0.6rem;
        border-radius: 0.9rem;
        background: rgba(255, 255, 255, 0.04);
        text-align: center;
      }
      span { display: block; font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; }
      strong { display: block; font-size: 1.05rem; margin-top: 0.2rem; }
      .notes { color: var(--text-secondary); font-size: 0.82rem; }
    `,
  ],
})
export class SheetPf2eComponent {
  readonly character = input.required<{ attributes?: Record<string, unknown> | null; resources?: Record<string, unknown> | null }>();

  readonly hp = computed(() => Number(this.character().resources?.['hp'] ?? 0));
  readonly maxHp = computed(() => Number(this.character().resources?.['maxHp'] ?? (this.hp() || 1)));
  readonly attributes = computed(() =>
    ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((label) => ({
      label,
      value: Number(this.character().attributes?.[label] ?? 10),
    }))
  );
}
