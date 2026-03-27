export type TabletopToken = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
};

export type TabletopLightSource = {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
};

export type TabletopFogState = {
  cellSize: number;
  opacity: number;
  maskedCells: string[];
};

export type CampaignTabletopState = {
  mapImageUrl: string | null;
  gridSize: number;
  tokens: TabletopToken[];
  fog: TabletopFogState;
  lights: TabletopLightSource[];
  updatedAt: string;
  updatedBy: string;
};

export type TabletopStatePatch = {
  mapImageUrl?: string | null;
  gridSize?: number;
  tokens?: TabletopToken[];
  fog?: Partial<TabletopFogState>;
  lights?: TabletopLightSource[];
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const CELL_KEY_PATTERN = /^\d{1,4}:\d{1,4}$/;

export const sanitizeTokens = (tokens: TabletopToken[]): TabletopToken[] => {
  return tokens.slice(0, 150).map((token) => ({
    id: String(token.id || '').slice(0, 64),
    label: String(token.label || 'Token').slice(0, 60),
    x: clamp(Number.isFinite(token.x) ? token.x : 0, 0, 5000),
    y: clamp(Number.isFinite(token.y) ? token.y : 0, 0, 5000),
    color: String(token.color || '#c9a84c').slice(0, 20),
    size: clamp(Number.isFinite(token.size) ? token.size : 56, 24, 160),
  }));
};

export const sanitizeFogState = (fog: Partial<TabletopFogState> | undefined): TabletopFogState => {
  const defaultFog: TabletopFogState = {
    cellSize: 56,
    opacity: 0.72,
    maskedCells: [],
  };

  if (!fog) {
    return defaultFog;
  }

  const maskedCells = Array.isArray(fog.maskedCells)
    ? Array.from(
        new Set(
          fog.maskedCells
            .filter((entry): entry is string => typeof entry === 'string')
            .map((entry) => entry.trim())
            .filter((entry) => CELL_KEY_PATTERN.test(entry))
        )
      ).slice(0, 6000)
    : [];

  return {
    cellSize: clamp(
      Number.isFinite(fog.cellSize ?? NaN) ? Number(fog.cellSize) : defaultFog.cellSize,
      24,
      120
    ),
    opacity: clamp(
      Number.isFinite(fog.opacity ?? NaN) ? Number(fog.opacity) : defaultFog.opacity,
      0.15,
      0.95
    ),
    maskedCells,
  };
};

export const sanitizeLights = (lights: TabletopLightSource[]): TabletopLightSource[] => {
  return lights.slice(0, 24).map((light, index) => ({
    id: String(light.id || `light-${index}`).slice(0, 64),
    x: clamp(Number.isFinite(light.x) ? light.x : 0, 0, 5000),
    y: clamp(Number.isFinite(light.y) ? light.y : 0, 0, 5000),
    radius: clamp(Number.isFinite(light.radius) ? light.radius : 180, 60, 1200),
    intensity: clamp(Number.isFinite(light.intensity) ? light.intensity : 0.8, 0.15, 1),
    color: String(light.color || '#ffe6a3').slice(0, 20),
  }));
};

export const createInitialTabletopState = (userId: string): CampaignTabletopState => {
  return {
    mapImageUrl: null,
    gridSize: 56,
    tokens: [],
    fog: sanitizeFogState(undefined),
    lights: [],
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
};

export const buildNextTabletopState = (
  currentState: CampaignTabletopState,
  patch: TabletopStatePatch,
  userId: string
): CampaignTabletopState => {
  const nextFog =
    patch.fog === undefined
      ? currentState.fog
      : sanitizeFogState({
          ...currentState.fog,
          ...patch.fog,
        });

  return {
    mapImageUrl:
      patch.mapImageUrl === undefined
        ? currentState.mapImageUrl
        : patch.mapImageUrl
          ? String(patch.mapImageUrl).slice(0, 500)
          : null,
    gridSize:
      patch.gridSize === undefined
        ? currentState.gridSize
        : clamp(Math.round(patch.gridSize), 24, 120),
    tokens: patch.tokens === undefined ? currentState.tokens : sanitizeTokens(patch.tokens),
    fog: nextFog,
    lights: patch.lights === undefined ? currentState.lights : sanitizeLights(patch.lights),
    updatedAt: new Date().toISOString(),
    updatedBy: userId,
  };
};
