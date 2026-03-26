import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types';

export type SpellSchool =
  | 'ABJURATION'
  | 'CONJURATION'
  | 'DIVINATION'
  | 'ENCHANTMENT'
  | 'EVOCATION'
  | 'ILLUSION'
  | 'NECROMANCY'
  | 'TRANSMUTATION'
  | 'UNIVERSAL';

export type MagicType = 'ARCANE' | 'DIVINE' | 'PRIMAL' | 'OCCULT' | 'UNIVERSAL';

export interface Spell {
  id: string;
  systemId: string;
  name: string;
  level: number;
  school: SpellSchool;
  magicType: MagicType;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  higherLevels: string | null;
  ritual: boolean;
  concentration: boolean;
  classes: string[];
  source: string | null;
  isHomebrew: boolean;
  createdAt: string;
}

export interface CharacterClass {
  id: string;
  systemId: string;
  name: string;
  description: string;
  hitDie: string;
  primaryAbility: string;
  savingThrows: string[];
  skills: string[];
  equipment: unknown;
  features: unknown;
  subclasses: unknown;
  spellcasting: unknown;
  source: string | null;
  isHomebrew: boolean;
  createdAt: string;
}

export interface Ancestry {
  id: string;
  systemId: string;
  name: string;
  description: string;
  speed: number;
  size: string;
  traits: unknown;
  languages: string[];
  subraces: unknown;
  source: string | null;
  isHomebrew: boolean;
  createdAt: string;
}

export interface Condition {
  id: string;
  systemId: string;
  name: string;
  description: string;
  effects: unknown;
  icon: string | null;
  color: string;
  source: string | null;
  createdAt: string;
}

export interface Background {
  id: string;
  systemId: string;
  name: string;
  description: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment: unknown;
  feature: unknown;
  suggestedCharacteristics: unknown;
  source: string | null;
  isHomebrew: boolean;
  createdAt: string;
}

export interface Feat {
  id: string;
  systemId: string;
  name: string;
  description: string;
  prerequisites: string | null;
  benefits: unknown;
  source: string | null;
  isHomebrew: boolean;
  createdAt: string;
}

export interface SpellFilters {
  level?: number;
  school?: SpellSchool;
  class?: string;
  ritual?: boolean;
  concentration?: boolean;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class CompendiumService {
  private readonly API_URL = `${environment.apiUrl}/compendium`;

  constructor(private http: HttpClient) {}

  // === SPELLS ===

  getSpells(systemId: string, filters?: SpellFilters): Observable<ApiResponse<Spell[]>> {
    let params = new HttpParams();
    if (filters?.level !== undefined) params = params.set('level', filters.level.toString());
    if (filters?.school) params = params.set('school', filters.school);
    if (filters?.class) params = params.set('class', filters.class);
    if (filters?.ritual !== undefined) params = params.set('ritual', filters.ritual.toString());
    if (filters?.concentration !== undefined)
      params = params.set('concentration', filters.concentration.toString());
    if (filters?.search) params = params.set('search', filters.search);

    return this.http.get<ApiResponse<Spell[]>>(`${this.API_URL}/systems/${systemId}/spells`, {
      params,
    });
  }

  getSpell(spellId: string): Observable<ApiResponse<Spell>> {
    return this.http.get<ApiResponse<Spell>>(`${this.API_URL}/spells/${spellId}`);
  }

  createSpell(systemId: string, spell: Partial<Spell>): Observable<ApiResponse<Spell>> {
    return this.http.post<ApiResponse<Spell>>(`${this.API_URL}/systems/${systemId}/spells`, spell);
  }

  // === CLASSES ===

  getClasses(systemId: string, search?: string): Observable<ApiResponse<CharacterClass[]>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<CharacterClass[]>>(
      `${this.API_URL}/systems/${systemId}/classes`,
      { params }
    );
  }

  getClass(classId: string): Observable<ApiResponse<CharacterClass>> {
    return this.http.get<ApiResponse<CharacterClass>>(`${this.API_URL}/classes/${classId}`);
  }

  createClass(
    systemId: string,
    charClass: Partial<CharacterClass>
  ): Observable<ApiResponse<CharacterClass>> {
    return this.http.post<ApiResponse<CharacterClass>>(
      `${this.API_URL}/systems/${systemId}/classes`,
      charClass
    );
  }

  // === ANCESTRIES ===

  getAncestries(systemId: string, search?: string): Observable<ApiResponse<Ancestry[]>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Ancestry[]>>(
      `${this.API_URL}/systems/${systemId}/ancestries`,
      { params }
    );
  }

  getAncestry(ancestryId: string): Observable<ApiResponse<Ancestry>> {
    return this.http.get<ApiResponse<Ancestry>>(`${this.API_URL}/ancestries/${ancestryId}`);
  }

  createAncestry(systemId: string, ancestry: Partial<Ancestry>): Observable<ApiResponse<Ancestry>> {
    return this.http.post<ApiResponse<Ancestry>>(
      `${this.API_URL}/systems/${systemId}/ancestries`,
      ancestry
    );
  }

  // === CONDITIONS ===

  getConditions(systemId: string): Observable<ApiResponse<Condition[]>> {
    return this.http.get<ApiResponse<Condition[]>>(
      `${this.API_URL}/systems/${systemId}/conditions`
    );
  }

  getCondition(conditionId: string): Observable<ApiResponse<Condition>> {
    return this.http.get<ApiResponse<Condition>>(`${this.API_URL}/conditions/${conditionId}`);
  }

  createCondition(systemId: string, condition: Partial<Condition>): Observable<ApiResponse<Condition>> {
    return this.http.post<ApiResponse<Condition>>(
      `${this.API_URL}/systems/${systemId}/conditions`,
      condition
    );
  }

  // === BACKGROUNDS ===

  getBackgrounds(systemId: string, search?: string): Observable<ApiResponse<Background[]>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Background[]>>(
      `${this.API_URL}/systems/${systemId}/backgrounds`,
      { params }
    );
  }

  getBackground(backgroundId: string): Observable<ApiResponse<Background>> {
    return this.http.get<ApiResponse<Background>>(`${this.API_URL}/backgrounds/${backgroundId}`);
  }

  createBackground(
    systemId: string,
    background: Partial<Background>
  ): Observable<ApiResponse<Background>> {
    return this.http.post<ApiResponse<Background>>(
      `${this.API_URL}/systems/${systemId}/backgrounds`,
      background
    );
  }

  // === FEATS ===

  getFeats(systemId: string, search?: string): Observable<ApiResponse<Feat[]>> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<ApiResponse<Feat[]>>(`${this.API_URL}/systems/${systemId}/feats`, {
      params,
    });
  }

  getFeat(featId: string): Observable<ApiResponse<Feat>> {
    return this.http.get<ApiResponse<Feat>>(`${this.API_URL}/feats/${featId}`);
  }

  createFeat(systemId: string, feat: Partial<Feat>): Observable<ApiResponse<Feat>> {
    return this.http.post<ApiResponse<Feat>>(`${this.API_URL}/systems/${systemId}/feats`, feat);
  }
}
