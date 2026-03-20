import { calculateLevelFromXP, getXPForNextLevel, calculateXPProgress } from '../utils/xp-calculator';

describe('XP Calculator', () => {
  describe('calculateLevelFromXP', () => {
    it('should return level 1 for 0 XP', () => {
      expect(calculateLevelFromXP(0)).toBe(1);
    });

    it('should return level 2 for 300 XP', () => {
      expect(calculateLevelFromXP(300)).toBe(2);
    });

    it('should return level 3 for 1000 XP', () => {
      expect(calculateLevelFromXP(1000)).toBe(3);
    });

    it('should return level 5 for 7000 XP', () => {
      expect(calculateLevelFromXP(7000)).toBe(5);
    });

    it('should return level 20 for 400000 XP', () => {
      expect(calculateLevelFromXP(400000)).toBe(20);
    });
  });

  describe('getXPForNextLevel', () => {
    it('should return 300 for level 1', () => {
      expect(getXPForNextLevel(1)).toBe(300);
    });

    it('should return 900 for level 2', () => {
      expect(getXPForNextLevel(2)).toBe(900);
    });

    it('should return max level XP for level 20', () => {
      expect(getXPForNextLevel(20)).toBe(355000);
    });
  });

  describe('calculateXPProgress', () => {
    it('should calculate correct progress for level 1', () => {
      const progress = calculateXPProgress(150, 1);
      
      expect(progress.currentLevelXP).toBe(0);
      expect(progress.nextLevelXP).toBe(300);
      expect(progress.progressXP).toBe(150);
      expect(progress.progressPercentage).toBe(50);
    });

    it('should calculate correct progress for level 5', () => {
      const progress = calculateXPProgress(10000, 5);
      
      expect(progress.currentLevelXP).toBe(6500);
      expect(progress.nextLevelXP).toBe(14000);
      expect(progress.progressXP).toBe(3500);
      expect(Math.round(progress.progressPercentage)).toBe(47);
    });

    it('should not exceed 100% progress', () => {
      const progress = calculateXPProgress(1000, 2);
      
      expect(progress.progressPercentage).toBeLessThanOrEqual(100);
    });
  });
});
