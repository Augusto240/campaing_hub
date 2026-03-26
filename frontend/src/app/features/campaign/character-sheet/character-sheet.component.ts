import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { SheetCoc7eComponent } from './sheet-coc7e.component';
import { SheetDnd5eComponent } from './sheet-dnd5e.component';
import { SheetGenericComponent } from './sheet-generic.component';
import { SheetPf2eComponent } from './sheet-pf2e.component';
import { SheetT20Component } from './sheet-t20.component';

type CharacterView = {
  attributes?: Record<string, unknown> | null;
  resources?: Record<string, unknown> | null;
  class?: string;
};

type SystemView = {
  slug?: string | null;
};

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    CommonModule,
    SheetDnd5eComponent,
    SheetPf2eComponent,
    SheetCoc7eComponent,
    SheetT20Component,
    SheetGenericComponent,
  ],
  template: `
    <ng-container [ngSwitch]="slug()">
      <app-sheet-dnd5e *ngSwitchCase="'dnd5e'" [character]="character()" />
      <app-sheet-pf2e *ngSwitchCase="'pf2e'" [character]="character()" />
      <app-sheet-coc7e *ngSwitchCase="'coc7e'" [character]="character()" />
      <app-sheet-t20 *ngSwitchCase="'tormenta20'" [character]="character()" />
      <app-sheet-generic *ngSwitchDefault [character]="character()" />
    </ng-container>
  `,
})
export class CharacterSheetComponent {
  readonly character = input.required<CharacterView>();
  readonly system = input<SystemView | null>(null);

  readonly slug = computed(() => this.system()?.slug ?? 'generic');
}
