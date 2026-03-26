import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HpBarComponent } from '../../../shared/components/hp-bar.component';
import { SanityMeterComponent } from '../../../shared/components/sanity-meter.component';

@Component({
  selector: 'app-sheet-coc7e',
  standalone: true,
  imports: [CommonModule, HpBarComponent, SanityMeterComponent],
  template: `
    <div class="sheet-grid">
      <app-hp-bar [current]="hp()" [max]="maxHp()" />
      <app-sanity-meter [current]="sanity()" [max]="maxSanity()" />
      <div class="attr-grid">
        <article *ngFor="let attr of attributes()">
          <span>{{ attr.label }}</span>
          <strong>{{ attr.value }}</strong>
        </article>
      </div>
    </div>
  `,
  styles: [
    `
      .sheet-grid { display: grid; gap: 0.75rem; }
      .attr-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0.45rem;
      }
      article {
        padding: 0.55rem;
        border-radius: 0.85rem;
        background: rgba(255, 255, 255, 0.04);
        text-align: center;
      }
      span { display: block; font-size: 0.68rem; color: var(--text-secondary); text-transform: uppercase; }
      strong { display: block; font-size: 1rem; margin-top: 0.2rem; }
    `,
  ],
})
export class SheetCoc7eComponent {
  readonly character = input.required<{ attributes?: Record<string, unknown> | null; resources?: Record<string, unknown> | null }>();

  readonly hp = computed(() => Number(this.character().resources?.['hp'] ?? 0));
  readonly maxHp = computed(() => Number(this.character().resources?.['maxHp'] ?? (this.hp() || 1)));
  readonly sanity = computed(() => Number(this.character().resources?.['sanity'] ?? 0));
  readonly maxSanity = computed(() => Number(this.character().resources?.['maxSanity'] ?? 99));
  readonly attributes = computed(() =>
    ['STR', 'CON', 'SIZ', 'DEX', 'APP', 'INT', 'POW', 'EDU'].map((label) => ({
      label,
      value: Number(this.character().attributes?.[label] ?? 0),
    }))
  );
}
