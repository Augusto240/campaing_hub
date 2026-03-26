import { prisma } from '../../config/database';
import { getCacheValue, setCacheValue } from '../../config/redis';

const DASHBOARD_CACHE_TTL_SECONDS = 60;

const withCache = async <T>(
  key: string,
  ttlSeconds: number,
  resolver: () => Promise<T>
): Promise<T> => {
  const cached = await getCacheValue<T>(key);
  if (cached) {
    return cached;
  }

  const data = await resolver();
  await setCacheValue(key, data, ttlSeconds);
  return data;
};

export class DashboardService {
  async getDashboardStats(userId: string) {
    return withCache(`dashboard:${userId}`, DASHBOARD_CACHE_TTL_SECONDS, async () => {
      const campaigns = await prisma.campaign.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
        include: {
          sessions: {
            select: {
              xpAwarded: true,
              date: true,
            },
          },
          characters: {
            select: {
              level: true,
              xp: true,
            },
          },
        },
      });

      const totalCampaigns = campaigns.length;
      const totalSessions = campaigns.reduce((sum, c) => sum + c.sessions.length, 0);
      const totalCharacters = campaigns.reduce((sum, c) => sum + c.characters.length, 0);
      const totalXPAwarded = campaigns.reduce(
        (sum, c) => sum + c.sessions.reduce((sessionSum, session) => sessionSum + session.xpAwarded, 0),
        0
      );

      const avgXPPerCampaign = totalCampaigns > 0 ? totalXPAwarded / totalCampaigns : 0;

      const systemStats: Record<string, number> = {};
      campaigns.forEach((campaign) => {
        systemStats[campaign.system] = (systemStats[campaign.system] || 0) + 1;
      });

      const mostPlayedSystem =
        Object.entries(systemStats).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      const allSessions = campaigns.flatMap((campaign) => campaign.sessions);
      const xpOverTime = this.aggregateXPOverTime(allSessions);
      const sessionsPerMonth = this.getSessionsPerMonth(allSessions);

      const recentActivity = await prisma.activityLog.findMany({
        where: { userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });

      const allCharacters = campaigns.flatMap((campaign) => campaign.characters);
      const levelDistribution = this.getLevelDistribution(allCharacters);

      return {
        totalCampaigns,
        totalSessions,
        totalCharacters,
        totalXPAwarded,
        avgXPPerCampaign: Math.round(avgXPPerCampaign),
        mostPlayedSystem,
        systemDistribution: Object.entries(systemStats).map(([system, count]) => ({
          system,
          count,
        })),
        xpOverTime,
        sessionsPerMonth,
        recentActivity,
        levelDistribution,
      };
    });
  }

  private aggregateXPOverTime(sessions: { date: Date; xpAwarded: number }[]) {
    const sorted = sessions.sort((a, b) => a.date.getTime() - b.date.getTime());

    let cumulativeXP = 0;
    return sorted.map((session) => {
      cumulativeXP += session.xpAwarded;
      return {
        date: session.date.toISOString().split('T')[0],
        cumulativeXP,
        sessionXP: session.xpAwarded,
      };
    });
  }

  private getSessionsPerMonth(sessions: { date: Date }[]) {
    const monthCounts: Record<string, number> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthCounts[monthKey] = 0;
    }

    sessions.forEach((session) => {
      const monthKey = `${session.date.getFullYear()}-${String(
        session.date.getMonth() + 1
      ).padStart(2, '0')}`;
      if (monthKey in monthCounts) {
        monthCounts[monthKey]++;
      }
    });

    return Object.entries(monthCounts).map(([month, count]) => ({ month, count }));
  }

  private getLevelDistribution(characters: { level: number }[]) {
    const distribution: Record<number, number> = {};

    characters.forEach((character) => {
      distribution[character.level] = (distribution[character.level] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([level, count]) => ({
        level: Number(level),
        count,
      }))
      .sort((a, b) => a.level - b.level);
  }
}
