import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { HpBarComponent } from '../../../shared/components/hp-bar.component';

type CharacterLike = {
  class?: string;
  attributes?: Record<string, unknown> | null;
  resources?: Record<string, unknown> | null;
};

@Component({
  selector: 'app-sheet-generic',
  standalone: true,
  imports: [CommonModule, HpBarComponent],
  template: `
    <div class="sheet-grid">
      <app-hp-bar [current]="hp()" [max]="maxHp()" />
      <div class="panel">
        <strong>{{ character().class || 'Sem classe' }}</strong>
        <div class="attr-grid">
          <div *ngFor="let entry of entries()">
            <span>{{ entry.key }}</span>
            <strong>{{ entry.value }}</strong>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .sheet-grid { display: grid; gap: 0.75rem; }
      .panel {
        padding: 0.75rem;
        border-radius: 0.9rem;
        background: rgba(255, 255, 255, 0.04);
      }
      .attr-grid {
        margin-top: 0.65rem;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.45rem;
      }
      .attr-grid div {
        display: grid;
        gap: 0.15rem;
        padding: 0.5rem;
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.04);
      }
      .attr-grid span { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; }
    `,
  ],
})
export class SheetGenericComponent {
  readonly character = input.required<CharacterLike>();

  readonly hp = computed(() => Number(this.character().resources?.['hp'] ?? 0));
  readonly maxHp = computed(() => Number(this.character().resources?.['maxHp'] ?? (this.hp() || 1)));
  readonly entries = computed(() =>
    Object.entries(this.character().attributes ?? {})
      .slice(0, 6)
      .map(([key, value]) => ({ key, value }))
  );
}
