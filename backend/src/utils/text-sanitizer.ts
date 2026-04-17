export type TextSanitizationStatus = 'unchanged' | 'repaired' | 'flagged';

export type TextSanitizationResult = {
  status: TextSanitizationStatus;
  original: string;
  value: string;
  reason?: string;
};

const CP437_STYLE_REPLACEMENTS: Array<[string, string]> = [
  ['├í', 'á'],
  ['├ú', 'ã'],
  ['├¡', 'í'],
  ['├║', 'ú'],
  ['├©', 'é'],
  ['├ª', 'ê'],
  ['├£', 'à'],
  ['├³', 'ó'],
  ['├Á', 'õ'],
  ['├ç', 'ç'],
  ['├‰', 'É'],
  ['ÔåÉ', '←'],
  ['Ôåæ', '↑'],
  ['Ôåô', '↓'],
  ['Ôå│', '· '],
  ['Ôÿà', '★'],
  ['Ôÿå', '☆'],
];

const SUSPICIOUS_PATTERNS = [
  /\uFFFD/g,
  /ï¿½/g,
  /Ã[^\s]/g,
  /Â[·ºª]/g,
  /â(?:€™|€œ|€|€”|€¢|†|š|œ|˜|™)/g,
  /ðŸ/g,
  /├[^\s]/g,
  /Ô(?:å|ÿ)/g,
];

const countSuspiciousMarkers = (value: string): number => {
  return SUSPICIOUS_PATTERNS.reduce((total, pattern) => {
    const matches = value.match(pattern);
    return total + (matches?.length ?? 0);
  }, 0);
};

const applyCp437StyleMap = (value: string): string => {
  return CP437_STYLE_REPLACEMENTS.reduce((current, [from, to]) => current.split(from).join(to), value);
};

const decodeLatin1AsUtf8 = (value: string): string => {
  return Buffer.from(value, 'latin1').toString('utf8');
};

export const containsLikelyMojibake = (value: string): boolean => countSuspiciousMarkers(value) > 0;

export const repairLikelyMojibake = (value: string): TextSanitizationResult => {
  const original = value;
  const originalScore = countSuspiciousMarkers(original);

  if (originalScore === 0) {
    return {
      status: 'unchanged',
      original,
      value: original,
    };
  }

  const candidates = new Map<string, string>();
  candidates.set('cp437-map', applyCp437StyleMap(original));
  candidates.set('latin1->utf8', decodeLatin1AsUtf8(original));
  candidates.set('cp437-map + latin1->utf8', decodeLatin1AsUtf8(applyCp437StyleMap(original)));

  let bestValue = original;
  let bestScore = originalScore;
  let bestReason: string | undefined;

  for (const [reason, candidate] of candidates.entries()) {
    const score = countSuspiciousMarkers(candidate);
    if (candidate !== original && score < bestScore) {
      bestValue = candidate;
      bestScore = score;
      bestReason = reason;
    }
  }

  if (bestValue !== original && bestScore === 0) {
    return {
      status: 'repaired',
      original,
      value: bestValue,
      reason: bestReason,
    };
  }

  if (original.includes('\uFFFD') || original.includes('ï¿½')) {
    return {
      status: 'flagged',
      original,
      value: original,
      reason: 'Replacement character detected; manual review required',
    };
  }

  if (bestValue !== original) {
    return {
      status: 'repaired',
      original,
      value: bestValue,
      reason: bestReason,
    };
  }

  return {
    status: 'flagged',
    original,
    value: original,
    reason: 'Unable to repair suspicious text safely',
  };
};
