import { CompendiumEntry } from '../../../core/types';

export const getKnowledgePresenceScore = (entry: CompendiumEntry): number => {
  return (
    entry.links.usedInSessions.length * 3 +
    entry.links.linkedCharacters.length * 2 +
    entry.links.referencedInWiki.length * 2 +
    entry.links.usedAsCombatantCount
  );
};

export const sortKnowledgeEntriesByPresence = (
  entries: CompendiumEntry[]
): CompendiumEntry[] => {
  return [...entries].sort(
    (left, right) =>
      getKnowledgePresenceScore(right) - getKnowledgePresenceScore(left) ||
      left.name.localeCompare(right.name)
  );
};
