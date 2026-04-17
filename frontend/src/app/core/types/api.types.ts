/**
 * Campaign Hub - API Response Types
 *
 * Tipos centralizados para todas as respostas da API.
 * Baseado no schema Prisma atual.
 *
 * @module core/types/api.types
 */

// ============================================================================
// ENUMS (espelhando Prisma)
// ============================================================================

export type Role = 'ADMIN' | 'USER';
export type CampaignRole = 'GM' | 'PLAYER';
export type EventType = 'BATTLE' | 'STORY' | 'NPC' | 'TREASURE';
export type Rarity = 'MUNDANE' | 'COMMON' | 'UNCOMMON' | 'RARE' | 'VERY_RARE' | 'LEGENDARY' | 'ARTIFACT' | 'ELDRITCH';
export type ItemType = 'WEAPON' | 'ARMOR' | 'POTION' | 'SCROLL' | 'WAND' | 'RING' | 'MISC' | 'MAGIC_ITEM' | 'CONSUMABLE' | 'TOME' | 'MYTHOS_TOME' | 'RELIC';
export type WikiCategory = 'NPC' | 'LOCATION' | 'FACTION' | 'LORE' | 'HOUSE_RULE' | 'BESTIARY' | 'DEITY' | 'MYTHOS' | 'SESSION_RECAP';
export type WikiBlockType = 'TEXT' | 'CHECKLIST' | 'QUOTE' | 'CALLOUT' | 'CODE' | 'IMAGE' | 'TABLE';
export type RpgSystemSlug = 'DND5E' | 'T20' | 'COC' | 'PATHFINDER';

// ============================================================================
// BASE ENTITIES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface RpgSystem {
  id: string;
  name: string;
  slug: RpgSystemSlug;
  description: string | null;
  diceFormula: string;
  attributeSchema: Record<string, unknown>;
  xpTable: Record<string, number> | null;
  hasSpellSlots: boolean;
  hasSanity: boolean;
  hasMana: boolean;
  hasHeroPoints: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  system: string;
  systemId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignWithRelations extends Campaign {
  owner: Pick<User, 'id' | 'name'>;
  members: CampaignMember[];
  _count?: {
    characters: number;
    sessions: number;
  };
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  role: CampaignRole;
  joinedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  xp: number;
  version: number;
  playerId: string;
  campaignId: string;
  systemId: string | null;
  attributes: Record<string, number>;
  resources: CharacterResources;
  inventory: InventoryItem[];
  notes: string | null;
  imageUrl: string | null;
  sheetFileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CharacterResources {
  hp?: number;
  maxHp?: number;
  mana?: number;
  maxMana?: number;
  sanity?: number;
  maxSanity?: number;
  heroPoints?: number;
  [key: string]: number | string | boolean | undefined;
}

export interface InventoryItem {
  name: string;
  quantity: number;
  description?: string;
}

export interface CharacterWithPlayer extends Character {
  player: Pick<User, 'id' | 'name'>;
}

export interface Session {
  id: string;
  campaignId: string;
  date: string;
  summary: string | null;
  narrativeLog: string | null;
  privateGmNotes: string | null;
  highlights: string[];
  xpAwarded: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SessionWithRelations extends Session {
  creator: Pick<User, 'id' | 'name'>;
  loot?: Loot[];
  _count?: {
    loot: number;
    diceRolls: number;
  };
}

export interface Loot {
  id: string;
  name: string;
  description: string | null;
  value: number;
  sessionId: string;
  assignedToCharacterId: string | null;
  createdAt: string;
}

export interface LootWithRelations extends Loot {
  assignedToCharacter?: Pick<Character, 'id' | 'name'> | null;
  lootItems?: LootItem[];
}

export interface Item {
  id: string;
  name: string;
  description: string | null;
  rarity: Rarity;
  weight: number | null;
  value: number | null;
  itemType: ItemType;
  systemId: string | null;
  properties: Record<string, unknown> | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface LootItem {
  id: string;
  lootId: string;
  itemId: string;
  quantity: number;
  item?: Item;
}

export interface Event {
  id: string;
  campaignId: string;
  title: string;
  description: string | null;
  eventDate: string;
  type: EventType;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface WikiPage {
  id: string;
  campaignId: string;
  parentPageId: string | null;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WikiPageWithAuthor extends WikiPage {
  author: Pick<User, 'id' | 'name'>;
  parent?: Pick<WikiPage, 'id' | 'title' | 'category'> | null;
  _count?: {
    children: number;
  };
}

export interface WikiTreeNode {
  id: string;
  title: string;
  category: WikiCategory;
  parentPageId: string | null;
  isPublic: boolean;
  updatedAt: string;
  children: WikiTreeNode[];
}

export interface WikiPageRelations {
  page: {
    id: string;
    title: string;
    category: WikiCategory;
    tags: string[];
    parentPageId: string | null;
  };
  parent: {
    id: string;
    title: string;
    category: WikiCategory;
  } | null;
  children: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: string;
  }>;
  backlinks: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: string;
  }>;
  outgoingLinks: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: string;
  }>;
  relatedByTag: Array<{
    id: string;
    title: string;
    category: WikiCategory;
    updatedAt: string;
    sharedTags: string[];
    sharedTagsCount: number;
  }>;
  entityBacklinks: Array<{
    entityType: 'CHARACTER' | 'SESSION' | 'ITEM' | 'CREATURE';
    entityId: string;
    title: string;
    excerpt: string;
    updatedAt: string;
  }>;
  outgoingEntities: Array<{
    entityType: 'CHARACTER' | 'SESSION' | 'ITEM' | 'CREATURE';
    entityId: string;
    title: string;
  }>;
}

export interface DiceRoll {
  id: string;
  sessionId: string | null;
  campaignId: string;
  userId: string;
  characterId: string | null;
  formula: string;
  result: number;
  breakdown: DiceBreakdown;
  label: string | null;
  isPrivate: boolean;
  createdAt: string;
}

export interface DiceBreakdown {
  rolls: number[];
  modifier: number;
  kept?: number[];
  dropped?: number[];
}

export interface DiceRollWithUser extends DiceRoll {
  user: Pick<User, 'id' | 'name'>;
  character?: Pick<Character, 'id' | 'name'> | null;
}

export interface SanityEvent {
  id: string;
  characterId: string;
  sessionId: string | null;
  trigger: string;
  sanityLost: number;
  tempInsanity: string | null;
  permInsanity: string | null;
  createdAt: string;
}

export interface SpellCast {
  id: string;
  characterId: string;
  sessionId: string | null;
  spellName: string;
  manaCost: number;
  faithCost: number;
  result: string | null;
  createdAt: string;
}

// ============================================================================
// API RESPONSE WRAPPERS
// ============================================================================

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WikiBlock {
  id: string;
  blockType: WikiBlockType;
  sortOrder: number;
  payload: Record<string, unknown>;
  updatedAt: string;
}

export interface WikiTemplate {
  key:
    | 'CHARACTER_DOSSIER'
    | 'LOCATION_ATLAS'
    | 'SESSION_CHRONICLE'
    | 'FACTION_DOSSIER'
    | 'ENCOUNTER_BRIEF'
    | 'GM_SESSION_PLAN';
  name: string;
  description: string;
  category: WikiCategory;
  tags: string[];
  blockTypes: WikiBlockType[];
}

export interface WikiFavorite {
  id: string;
  createdAt: string;
  page: {
    id: string;
    title: string;
    category: WikiCategory;
    isPublic: boolean;
    updatedAt: string;
  };
}

export interface WikiMentionSuggestion {
  id: string;
  title: string;
  category: WikiCategory;
}

export type WikiTimelineEntryKind = 'WIKI_PAGE' | 'SESSION' | 'EVENT';

export interface WikiTimelineEntry {
  id: string;
  kind: WikiTimelineEntryKind;
  campaignId: string;
  happenedAt: string;
  title: string;
  summary: string;
  tags: string[];
  category: WikiCategory | 'SESSION' | 'EVENT';
  referenceId: string;
  legacyAnchor: boolean;
}

export type CompendiumKind = 'BESTIARY' | 'SPELL' | 'ITEM' | 'CLASS';

export interface CompendiumLinkedCharacter {
  characterId: string;
  characterName: string;
}

export interface CompendiumEntry {
  id: string;
  systemSlug: string;
  kind: CompendiumKind;
  name: string;
  summary: string;
  tags: string[];
  source: 'SRD' | 'OGL' | 'LEGACY';
  payload: Record<string, unknown>;
  links: {
    usedInSessions: string[];
    usedAsCombatantCount: number;
    linkedCharacters: CompendiumLinkedCharacter[];
    referencedInWiki: Array<{
      wikiPageId: string;
      title: string;
      updatedAt: string;
    }>;
  };
}

export interface CampaignCompendiumResponse {
  campaignId: string;
  systemSlug: string;
  totals: Record<CompendiumKind, number>;
  entries: CompendiumEntry[];
}

export type KnowledgeGraphNodeType =
  | 'WIKI_PAGE'
  | 'CHARACTER'
  | 'SESSION'
  | 'ITEM'
  | 'CREATURE'
  | 'COMPENDIUM_ENTRY';

export type KnowledgeGraphEdgeType =
  | 'WIKI_LINK'
  | 'WIKI_MENTION'
  | 'SESSION_COMBATANT'
  | 'CHARACTER_ITEM'
  | 'COMPENDIUM_REFERENCE';

export interface KnowledgeGraphNode {
  id: string;
  type: KnowledgeGraphNodeType;
  label: string;
  legacyAnchor: boolean;
  metadata: {
    campaignId: string;
    sourceId: string;
    category?: string;
    tags?: string[];
    updatedAt?: string;
  };
}

export interface KnowledgeGraphEdge {
  id: string;
  type: KnowledgeGraphEdgeType;
  source: string;
  target: string;
  weight: number;
  metadata: {
    reason: string;
  };
}

export interface CampaignKnowledgeGraph {
  campaignId: string;
  generatedAt: string;
  stats: {
    nodes: number;
    edges: number;
    legacyAnchors: number;
  };
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

export type CoreCompendiumKind = 'CREATURE' | 'SPELL' | 'ITEM';

export type CoreCompendiumSource = 'SRD' | 'HOMEBREW' | 'LEGACY';

export interface CoreCompendiumEntry {
  id: string;
  systemSlug: string;
  kind: CoreCompendiumKind;
  source: CoreCompendiumSource;
  name: string;
  summary: string;
  tags: string[];
  content: Record<string, unknown>;
  origin: 'STATIC' | 'CAMPAIGN';
}

export interface CoreCompendiumView {
  campaignId: string;
  systemSlug: string;
  creatures: CoreCompendiumEntry[];
  spells: CoreCompendiumEntry[];
  items: CoreCompendiumEntry[];
}

export interface CoreTabletopToken {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface CoreTabletopFog {
  cellSize: number;
  opacity: number;
  maskedCells: string[];
}

export interface CoreTabletopLight {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
}

export interface CoreTabletopState {
  mapImageUrl: string | null;
  gridSize: number;
  tokens: CoreTabletopToken[];
  fog: CoreTabletopFog;
  lights: CoreTabletopLight[];
  updatedAt: string;
  updatedBy: string;
}

export interface CoreVttSnapshot {
  campaignId: string;
  sessionId: string | null;
  state: CoreTabletopState;
  metadata: Record<string, unknown>;
}

export interface CoreCampaignSnapshot {
  campaignId: string;
  generatedAt: string;
  founders: {
    augustusFrostborne: boolean;
    satoruNaitokira: boolean;
  };
  wiki: {
    totalPages: number;
    pages: Array<{
      id: string;
      title: string;
      category: WikiCategory;
      parentPageId: string | null;
      tags: string[];
      isPublic: boolean;
      updatedAt: string;
    }>;
  };
  compendium: CoreCompendiumView;
  vtt: CoreVttSnapshot;
  graph: {
    stats: {
      nodes: number;
      edges: number;
      legacyAnchors: number;
    };
  };
  characters: Array<{
    id: string;
    name: string;
  }>;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

// ============================================================================
// DASHBOARD TYPES
// ============================================================================

export interface DashboardStats {
  totalCampaigns: number;
  totalCharacters: number;
  totalSessions: number;
  totalXPAwarded: number;
  avgXPPerCampaign: number;
  mostPlayedSystem: string;
  systemDistribution: SystemDistributionEntry[];
  xpOverTime: XPOverTimeEntry[];
  recentActivity: ActivityLogEntry[];
  sessionsPerMonth: SessionsPerMonth[];
  levelDistribution: CharacterLevelDistribution[];
}

export interface SystemDistributionEntry {
  system: string;
  count: number;
}

export interface XPOverTimeEntry {
  date: string;
  cumulativeXP: number;
  sessionXP: number;
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
}

export interface SessionsPerMonth {
  month: string;
  count: number;
}

// ============================================================================
// CAMPAIGN STATS
// ============================================================================

export interface CampaignStats {
  totalSessions: number;
  totalCharacters: number;
  totalXpAwarded: number;
  totalLootValue: number;
  sessionsPerMonth: SessionsPerMonth[];
  characterLevels: CharacterLevelDistribution[];
}

export interface CharacterLevelDistribution {
  level: number;
  count: number;
}

// ============================================================================
// INPUT TYPES (para forms)
// ============================================================================

export interface CreateCampaignInput {
  name: string;
  description?: string;
  system: RpgSystemSlug | string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
}

export interface CreateCharacterInput {
  name: string;
  class: string;
  campaignId: string;
  attributes?: Record<string, number>;
  resources?: CharacterResources;
}

export interface UpdateCharacterInput {
  name?: string;
  class?: string;
  level?: number;
  xp?: number;
  attributes?: Record<string, number>;
  resources?: CharacterResources;
  notes?: string;
}

export interface CreateSessionInput {
  campaignId: string;
  date: string;
  summary?: string;
  xpAwarded?: number;
}

export interface UpdateSessionInput {
  date?: string;
  summary?: string;
  narrativeLog?: string;
  privateGmNotes?: string;
  highlights?: string[];
  xpAwarded?: number;
}

export interface CreateLootInput {
  sessionId: string;
  name: string;
  description?: string;
  value?: number;
}

export interface UpdateLootInput {
  name?: string;
  description?: string;
  value?: number;
}

export interface AssignLootInput {
  characterId: string | null;
}

export interface CreateWikiPageInput {
  campaignId: string;
  parentPageId?: string | null;
  title: string;
  content: string;
  category: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpdateWikiPageInput {
  parentPageId?: string | null;
  title?: string;
  content?: string;
  category?: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
}

export interface CreateWikiFromTemplateInput {
  title: string;
  templateKey:
    | 'CHARACTER_DOSSIER'
    | 'LOCATION_ATLAS'
    | 'SESSION_CHRONICLE'
    | 'FACTION_DOSSIER'
    | 'ENCOUNTER_BRIEF'
    | 'GM_SESSION_PLAN';
  parentPageId?: string | null;
  category?: WikiCategory;
  tags?: string[];
  isPublic?: boolean;
}

export interface UpsertWikiBlocksInput {
  blocks: Array<{
    blockType: WikiBlockType;
    payload: Record<string, unknown>;
  }>;
}

export interface DiceRollInput {
  campaignId: string;
  formula: string;
  label?: string;
  characterId?: string;
  sessionId?: string;
  isPrivate?: boolean;
}

export interface SanityCheckInput {
  trigger: string;
  diceResult: number;
  sanityLost: number;
  sessionId?: string;
}

export interface SpellCastInput {
  spellName: string;
  manaCost: number;
  faithCost?: number;
  result?: string;
  sessionId?: string;
}

export interface AddMemberInput {
  userId: string;
  role: CampaignRole;
}

// ============================================================================
// PAYLOAD ALIASES (for service compatibility)
// ============================================================================

export type CreateCampaignPayload = CreateCampaignInput;
export type UpdateCampaignPayload = UpdateCampaignInput;
export type CreateSessionPayload = CreateSessionInput;
export type UpdateSessionPayload = UpdateSessionInput;
export type CreateLootPayload = CreateLootInput;
export type UpdateLootPayload = UpdateLootInput;
export type AssignLootPayload = AssignLootInput;
export type CreateWikiPagePayload = CreateWikiPageInput;
export type UpdateWikiPagePayload = UpdateWikiPageInput;
export type RollDicePayload = DiceRollInput;
export type AddMemberPayload = AddMemberInput;

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================================================
// ENCOUNTER GENERATOR
// ============================================================================

export interface GenerateEncounterPayload {
  partyLevel: number;
  partySize: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly';
  environment?: string;
}

export interface GeneratedEncounter {
  creatures: Array<{
    id: string;
    name: string;
    count: number;
    xpReward: number;
  }>;
  totalXp: number;
  difficulty: string;
  environment: string;
}

// ============================================================================
// CHARACTER PAYLOADS
// ============================================================================

export type CreateCharacterPayload = CreateCharacterInput;
export type UpdateCharacterPayload = UpdateCharacterInput;

// ============================================================================
// SANITY (Call of Cthulhu)
// ============================================================================

export interface SanityCheckPayload {
  trigger: string;
  diceResult: number;
  sanityLost: number;
  sessionId?: string;
}

export interface SanityCheckResult {
  success: boolean;
  sanityLost: number;
  currentSanity: number;
  tempInsanity?: string;
}

export interface SanityEvent {
  id: string;
  characterId: string;
  sessionId: string | null;
  trigger: string;
  sanityLost: number;
  tempInsanity: string | null;
  permInsanity: string | null;
  createdAt: string;
}

// ============================================================================
// SPELL CAST (Tormenta20 / Mana systems)
// ============================================================================

export interface CastSpellPayload {
  spellName: string;
  manaCost: number;
  faithCost?: number;
  result?: string;
  sessionId?: string;
}

export interface CastSpellResult {
  success: boolean;
  currentMana: number;
  cast: SpellCast;
}

export interface SpellCast {
  id: string;
  characterId: string;
  sessionId: string | null;
  spellName: string;
  manaCost: number;
  faithCost: number;
  result: string | null;
  createdAt: string;
}

// ============================================================================
// COMBAT SYSTEM
// ============================================================================

export interface CombatEncounter {
  id: string;
  sessionId: string;
  name: string;
  isActive: boolean;
  currentTurn: number;
  round: number;
  createdAt: string;
  combatants: Combatant[];
}

export interface Combatant {
  id: string;
  encounterId: string;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isNpc: boolean;
  characterId: string | null;
  creatureId: string | null;
  conditions: string[];
  notes: string | null;
  order: number;
}

export interface CreateEncounterPayload {
  sessionId: string;
  name: string;
}

export interface AddCombatantPayload {
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  isNpc?: boolean;
  characterId?: string;
  creatureId?: string;
}

export interface UpdateCombatantPayload {
  initiative?: number;
  hp?: number;
  conditions?: string[];
  notes?: string;
}

// ============================================================================
// CREATURES (Bestiary)
// ============================================================================

export interface Creature {
  id: string;
  systemId: string;
  name: string;
  creatureType: string;
  stats: Record<string, unknown>;
  abilities: Array<{
    name: string;
    description: string;
    damage?: string;
  }>;
  loot: Record<string, unknown> | null;
  xpReward: number | null;
  description: string | null;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CreateCreaturePayload {
  systemId: string;
  name: string;
  creatureType: string;
  stats: Record<string, unknown>;
  abilities: Array<{
    name: string;
    description: string;
    damage?: string;
  }>;
  xpReward?: number;
  description?: string;
  isPublic?: boolean;
}

// ============================================================================
// SESSION PROPOSALS
// ============================================================================

export type ProposalStatus = 'OPEN' | 'DECIDED' | 'CANCELLED';

export interface SessionProposal {
  id: string;
  campaignId: string;
  proposedBy: string;
  dates: string[];
  decidedDate: string | null;
  status: ProposalStatus;
  createdAt: string;
  proposer?: Pick<User, 'id' | 'name'>;
  votes: SessionVote[];
}

export interface SessionVote {
  id: string;
  proposalId: string;
  userId: string;
  date: string;
  available: boolean;
  user?: Pick<User, 'id' | 'name'>;
}

export interface CreateProposalPayload {
  dates: string[];
}

export interface VotePayload {
  date: string;
  available: boolean;
}
