import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-system-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="system-badge" [style.--system-color]="color()" [style.--system-surface]="surface()">
      <span class="dot"></span>
      {{ label() }}
    </span>
  `,
  styles: [
    `
      .system-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.35rem 0.75rem;
        border-radius: 999px;
        border: 1px solid color-mix(in srgb, var(--system-color) 40%, transparent);
        background: var(--system-surface);
        color: var(--system-color);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }
      .dot {
        width: 0.55rem;
        height: 0.55rem;
        border-radius: 50%;
        background: var(--system-color);
        box-shadow: 0 0 12px color-mix(in srgb, var(--system-color) 65%, transparent);
      }
    `,
  ],
})
export class SystemBadgeComponent {
  readonly system = input<string>('');

  readonly normalized = computed(() => this.system().toLowerCase());
  readonly label = computed(() => {
    const map: Record<string, string> = {
      dnd5e: 'D&D 5e',
      pf2e: 'Pathfinder 2e',
      coc7e: 'Call of Cthulhu 7e',
      tormenta20: 'Tormenta20',
    };

    return map[this.normalized()] ?? this.system() ?? 'RPG';
  });

  readonly color = computed(() => {
    const map: Record<string, string> = {
      dnd5e: 'var(--color-system-dnd)',
      pf2e: 'var(--color-system-pf2)',
      coc7e: 'var(--color-system-coc)',
      tormenta20: 'var(--color-system-t20)',
    };

    return map[this.normalized()] ?? 'var(--color-primary)';
  });

  readonly surface = computed(() => `color-mix(in srgb, ${this.color()} 14%, transparent)`);
}
