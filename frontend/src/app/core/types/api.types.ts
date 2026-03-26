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
  legacySource: string | null;
  title: string;
  content: string;
  category: WikiCategory;
  tags: string[];
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  linkedPages?: WikiPageReference[];
  backlinks?: WikiPageReference[];
}

export interface WikiPageReference {
  id: string;
  title: string;
}

export interface WikiTreeNode {
  id: string;
  title: string;
  category: WikiCategory;
  isPublic: boolean;
  parentPageId: string | null;
  updatedAt: string;
  children: WikiTreeNode[];
}

export interface LegacyWikiSeedResult {
  created: number;
  skipped: number;
  total: number;
}

export interface WikiPageWithAuthor extends WikiPage {
  author: Pick<User, 'id' | 'name'>;
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
  activeCampaigns: Campaign[];
  recentActivity: ActivityLogEntry[];
  sessionsPerMonth: SessionsPerMonth[];
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
  email: string;
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
