import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-rarity-badge',
  standalone: true,
  template: `
    <span class="rarity-badge" [style.--rarity-color]="color()">{{ label() }}</span>
  `,
  styles: [
    `
      .rarity-badge {
        display: inline-flex;
        align-items: center;
        padding: 0.28rem 0.7rem;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--rarity-color) 45%, transparent);
        background: color-mix(in srgb, var(--rarity-color) 14%, transparent);
        color: var(--rarity-color);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
    `,
  ],
})
export class RarityBadgeComponent {
  readonly rarity = input<string>('COMMON');

  readonly normalized = computed(() => this.rarity().toLowerCase());
  readonly label = computed(() => this.normalized().replace(/_/g, ' '));
  readonly color = computed(() => {
    const map: Record<string, string> = {
      mundane: 'var(--color-rarity-mundane)',
      common: 'var(--color-rarity-common)',
      uncommon: 'var(--color-rarity-uncommon)',
      rare: 'var(--color-rarity-rare)',
      very_rare: 'var(--color-rarity-very-rare)',
      legendary: 'var(--color-rarity-legendary)',
      artifact: 'var(--color-rarity-artifact)',
      eldritch: 'var(--color-rarity-eldritch)',
    };

    return map[this.normalized()] ?? 'var(--color-primary)';
  });
}
