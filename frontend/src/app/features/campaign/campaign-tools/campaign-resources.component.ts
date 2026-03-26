import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { CharacterService } from '../../../core/services/character.service';
import { SocketService } from '../../../core/services/socket.service';
import { HpBarComponent } from '../../../shared/components/hp-bar.component';
import { ManaBarComponent } from '../../../shared/components/mana-bar.component';
import { SanityMeterComponent } from '../../../shared/components/sanity-meter.component';

type ResourceMap = Record<string, string | number | boolean | null>;
type CharacterView = { id: string; name: string; class: string; resources: ResourceMap | null };
type ResourceUpdate = { id: string; resources: ResourceMap };

@Component({
  selector: 'app-campaign-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, HpBarComponent, ManaBarComponent, SanityMeterComponent],
  template: `
    <article class="card panel">
      <h2>Recursos dos Personagens</h2>
      <div class="resource-grid">
        <div class="resource-card" *ngFor="let character of characters">
          <strong>{{ character.name }}</strong>
          <small>{{ character.class }}</small>
          <div class="bars">
            <app-hp-bar [current]="getResource(character, 'hp')" [max]="getResource(character, 'maxHp') || 1" />
            <app-mana-bar *ngIf="showMana" [current]="getResource(character, 'mana')" [max]="getResource(character, 'maxMana') || 1" />
            <app-sanity-meter *ngIf="showSanity" [current]="getResource(character, 'sanity')" [max]="getResource(character, 'maxSanity') || 99" />
          </div>
          <div class="resource-fields" *ngIf="resourceDrafts[character.id] as draft">
            <input class="form-control" type="number" [ngModel]="draft['hp']" (ngModelChange)="onResourceChange(character.id, 'hp', $event)" placeholder="HP" />
            <input class="form-control" type="number" [ngModel]="draft['mana']" (ngModelChange)="onResourceChange(character.id, 'mana', $event)" placeholder="Mana" />
            <input class="form-control" type="number" [ngModel]="draft['faith']" (ngModelChange)="onResourceChange(character.id, 'faith', $event)" placeholder="Fe" />
            <input class="form-control" type="number" [ngModel]="draft['sanity']" (ngModelChange)="onResourceChange(character.id, 'sanity', $event)" placeholder="Sanidade" />
          </div>
          <span class="sync-status">{{ resourceSaveState[character.id] || 'Pronto' }}</span>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      .panel { padding: 1rem; display: grid; gap: 0.75rem; }
      .panel h2 { margin: 0.7rem 0; }
      .resource-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0.75rem; }
      .resource-card { padding: 0.8rem; border-radius: 1rem; background: rgba(255,255,255,0.04); display: grid; gap: 0.5rem; }
      .resource-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; }
      .bars { display: grid; gap: 0.4rem; }
      small, .sync-status { color: var(--text-secondary); font-size: 0.8rem; }
    `,
  ],
})
export class CampaignResourcesComponent implements OnInit, OnDestroy {
  @Input() characters: CharacterView[] = [];
  @Input() campaignId = '';
  @Input() showMana = true;
  @Input() showSanity = true;

  resourceDrafts: Record<string, Record<string, string>> = {};
  resourceSaveState: Record<string, string> = {};

  private readonly destroy$ = new Subject<void>();
  private readonly resourcePatch$ = new Subject<{ characterId: string; resources: Record<string, string | number | boolean> }>();

  constructor(
    private readonly characterService: CharacterService,
    private readonly socketService: SocketService
  ) {}

  ngOnInit(): void {
    this.characters.forEach((c) => this.initResourceDraft(c));

    this.resourcePatch$
      .pipe(
        debounceTime(500),
        switchMap((payload) => {
          this.resourceSaveState[payload.characterId] = 'Sincronizando...';
          return this.characterService.updateResources(payload.characterId, payload.resources).pipe(
            catchError(() => {
              this.resourceSaveState[payload.characterId] = 'Falha';
              return of(null);
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        if (!response?.data) return;
        const character = this.characters.find((c) => c.id === response.data.id);
        if (!character) return;
        character.resources = response.data.resources as ResourceMap;
        this.initResourceDraft(character);
        this.resourceSaveState[character.id] = 'Sincronizado';
      });

    this.socketService
      .on<ResourceUpdate>('character:resources_updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((update) => {
        const character = this.characters.find((c) => c.id === update.id);
        if (!character) return;
        character.resources = update.resources;
        this.initResourceDraft(character);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getResource(character: CharacterView, key: string): number {
    const val = character.resources?.[key];
    return typeof val === 'number' ? val : Number(val) || 0;
  }

  private initResourceDraft(character: CharacterView): void {
    const resources = character.resources || {};
    const pick = (key: string) => String(resources[key] ?? 0);
    this.resourceDrafts[character.id] = {
      hp: pick('hp'),
      mana: pick('mana'),
      faith: pick('faith'),
      sanity: pick('sanity'),
    };
  }

  onResourceChange(characterId: string, key: string, rawValue: string): void {
    const draft = this.resourceDrafts[characterId];
    if (!draft) return;
    draft[key] = rawValue;
    const numeric = Number(rawValue);
    this.resourcePatch$.next({
      characterId,
      resources: { [key]: Number.isFinite(numeric) ? numeric : rawValue },
    });
  }
}
