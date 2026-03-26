import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HpBarComponent } from '../../../shared/components/hp-bar.component';
import { ManaBarComponent } from '../../../shared/components/mana-bar.component';

@Component({
  selector: 'app-sheet-t20',
  standalone: true,
  imports: [CommonModule, HpBarComponent, ManaBarComponent],
  template: `
    <div class="sheet-grid">
      <app-hp-bar [current]="hp()" [max]="maxHp()" />
      <app-mana-bar [current]="mana()" [max]="maxMana()" />
      <div class="attr-grid">
        <article *ngFor="let attr of attributes()">
          <span>{{ attr.label }}</span>
          <strong>{{ attr.value }}</strong>
          <small>{{ attr.modifier }}</small>
        </article>
      </div>
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
      small { color: var(--color-mana); }
    `,
  ],
})
export class SheetT20Component {
  readonly character = input.required<{ attributes?: Record<string, unknown> | null; resources?: Record<string, unknown> | null }>();

  readonly hp = computed(() => Number(this.character().resources?.['hp'] ?? 0));
  readonly maxHp = computed(() => Number(this.character().resources?.['maxHp'] ?? (this.hp() || 1)));
  readonly mana = computed(() => Number(this.character().resources?.['mana'] ?? 0));
  readonly maxMana = computed(() => Number(this.character().resources?.['maxMana'] ?? (this.mana() || 1)));
  readonly attributes = computed(() =>
    ['FOR', 'DES', 'CON', 'INT', 'SAB', 'CAR'].map((label) => {
      const value = Number(this.character().attributes?.[label] ?? 10);
      const modifier = Math.floor((value - 10) / 2);
      return {
        label,
        value,
        modifier: modifier >= 0 ? `+${modifier}` : `${modifier}`,
      };
    })
  );
}
