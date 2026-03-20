export interface XPTable {
  [level: number]: number;
}

// DND 5E XP progression table
export const DND5E_XP_TABLE: XPTable = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

export function calculateLevelFromXP(xp: number, xpTable: XPTable = DND5E_XP_TABLE): number {
  let level = 1;
  
  for (let i = 20; i >= 1; i--) {
    if (xp >= xpTable[i]) {
      level = i;
      break;
    }
  }
  
  return level;
}

export function getXPForNextLevel(currentLevel: number, xpTable: XPTable = DND5E_XP_TABLE): number {
  const nextLevel = currentLevel + 1;
  return xpTable[nextLevel] || xpTable[20];
}

export function calculateXPProgress(currentXP: number, currentLevel: number, xpTable: XPTable = DND5E_XP_TABLE): {
  currentLevelXP: number;
  nextLevelXP: number;
  progressXP: number;
  progressPercentage: number;
} {
  const currentLevelXP = xpTable[currentLevel];
  const nextLevelXP = xpTable[currentLevel + 1] || xpTable[20];
  const progressXP = currentXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercentage = (progressXP / xpNeeded) * 100;

  return {
    currentLevelXP,
    nextLevelXP,
    progressXP,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}
