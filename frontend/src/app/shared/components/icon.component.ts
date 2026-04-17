import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppIconName =
  | 'bell'
  | 'book'
  | 'calendar'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-up'
  | 'close'
  | 'dice'
  | 'home'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'map'
  | 'shield'
  | 'spark'
  | 'sword'
  | 'star'
  | 'star-filled'
  | 'user';

type AppIconDefinition = {
  viewBox: string;
  paths: Array<{
    d: string;
    fill?: string;
    strokeLinecap?: 'round' | 'square' | 'butt';
    strokeLinejoin?: 'round' | 'bevel' | 'miter';
    strokeWidth?: number;
  }>;
};

const ICONS: Record<AppIconName, AppIconDefinition> = {
  sword: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M14.5 4.5 19 9l-8.6 8.6-2.3-.9-.9-2.3L14.5 4.5Z' },
      { d: 'm13 6 5 5' },
      { d: 'm7 17-3 3' },
      { d: 'm6 14 4 4' },
    ],
  },
  home: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M3 10.5 12 3l9 7.5' },
      { d: 'M5.5 9.5V20h13V9.5' },
      { d: 'M10 20v-6h4v6' },
    ],
  },
  book: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5A2.5 2.5 0 0 0 17.5 16H4Z' },
      { d: 'M6.5 3H18v13' },
      { d: 'M4 18.5A2.5 2.5 0 0 0 6.5 21H20' },
      { d: 'M8 7h6' },
      { d: 'M8 10h6' },
    ],
  },
  dice: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M11 2.8a2 2 0 0 1 2 0l6.5 3.8a2 2 0 0 1 1 1.8v7.6a2 2 0 0 1-1 1.8L13 21.6a2 2 0 0 1-2 0l-6.5-3.8a2 2 0 0 1-1-1.8V8.4a2 2 0 0 1 1-1.8L11 2.8Z' },
      { d: 'M12 7.4v9.2' },
      { d: 'M7.5 10.3 12 13l4.5-2.7' },
      { d: 'M8 6.8 12 9l4-2.2' },
    ],
  },
  bell: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M8 17h8' },
      { d: 'M10 20a2 2 0 0 0 4 0' },
      { d: 'M6 17V11a6 6 0 1 1 12 0v6l1.6 1.6a.6.6 0 0 1-.4 1H4.8a.6.6 0 0 1-.4-1L6 17Z' },
    ],
  },
  logout: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2' },
      { d: 'M10 12h10' },
      { d: 'm17 8 4 4-4 4' },
    ],
  },
  close: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 6l12 12' },
      { d: 'M18 6 6 18' },
    ],
  },
  'chevron-left': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm15 18-6-6 6-6' }],
  },
  'chevron-up': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm18 15-6-6-6 6' }],
  },
  'chevron-down': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm6 9 6 6 6-6' }],
  },
  star: {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm12 3.5 2.7 5.5 6 1-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6L3.3 10l6-1L12 3.5Z' }],
  },
  'star-filled': {
    viewBox: '0 0 24 24',
    paths: [{ d: 'm12 3.5 2.7 5.5 6 1-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6L3.3 10l6-1L12 3.5Z', fill: 'currentColor' }],
  },
  calendar: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M6 4v4' },
      { d: 'M18 4v4' },
      { d: 'M4 8h16' },
      { d: 'M5 6h14a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z' },
      { d: 'M8 12h3' },
      { d: 'M8 16h3' },
      { d: 'M14 12h2' },
    ],
  },
  spark: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3.5 13.8 8l4.7 1.8-4.7 1.8L12 16l-1.8-4.4L5.5 9.8 10.2 8 12 3.5Z' },
      { d: 'M19 3v4' },
      { d: 'M21 5h-4' },
      { d: 'M5 17v4' },
      { d: 'M7 19H3' },
    ],
  },
  map: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'm3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z' },
      { d: 'M9 4v14' },
      { d: 'M15 6v14' },
    ],
  },
  shield: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 3 5 6v5c0 5.5 2.8 8.8 7 10 4.2-1.2 7-4.5 7-10V6l-7-3Z' },
      { d: 'm9.5 12 1.6 1.6 3.9-4.1' },
    ],
  },
  user: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' },
      { d: 'M5 20a7 7 0 0 1 14 0' },
    ],
  },
  mail: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M4 6h16a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a1 1 0 0 1 1-1Z' },
      { d: 'm4 8 8 6 8-6' },
    ],
  },
  lock: {
    viewBox: '0 0 24 24',
    paths: [
      { d: 'M7 10V8a5 5 0 0 1 10 0v2' },
      { d: 'M6 10h12a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a1 1 0 0 1 1-1Z' },
      { d: 'M12 14v3' },
    ],
  },
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="icon-svg"
      [attr.viewBox]="icon.viewBox"
      [attr.width]="size"
      [attr.height]="size"
      [attr.role]="decorative ? 'presentation' : 'img'"
      [attr.aria-hidden]="decorative ? 'true' : 'false'"
      [attr.aria-label]="decorative ? null : label"
    >
      <ng-container *ngFor="let path of icon.paths">
        <path
          [attr.d]="path.d"
          [attr.fill]="path.fill ?? 'none'"
          [attr.stroke]="path.fill ? 'none' : 'currentColor'"
          [attr.stroke-width]="path.strokeWidth ?? 1.85"
          [attr.stroke-linecap]="path.strokeLinecap ?? 'round'"
          [attr.stroke-linejoin]="path.strokeLinejoin ?? 'round'"
        />
      </ng-container>
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: inherit;
        line-height: 0;
        flex-shrink: 0;
      }

      .icon-svg {
        display: block;
      }
    `,
  ],
})
export class AppIconComponent {
  @Input({ required: true }) name!: AppIconName;
  @Input() size = 18;
  @Input() decorative = true;
  @Input() label = '';

  get icon(): AppIconDefinition {
    return ICONS[this.name];
  }
}
