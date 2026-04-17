const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');

const SEARCH_ROOTS = [
  path.join(repoRoot, 'backend', 'src'),
  path.join(repoRoot, 'frontend', 'src'),
];

const EXTRA_FILES = [
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'QUICKSTART.md'),
  path.join(repoRoot, 'TROUBLESHOOTING.md'),
  path.join(repoRoot, 'docker-compose.yml'),
  path.join(repoRoot, 'frontend', 'nginx.conf'),
];

const FILE_EXTENSIONS = new Set(['.ts', '.js', '.json', '.scss', '.css', '.html', '.md', '.yml', '.yaml', '.sql']);

const IGNORED_PARTS = new Set(['node_modules', 'dist', 'coverage', '.git', 'PROJETO-SITE-RPG--main']);

const SUSPICIOUS_PATTERNS = [
  { label: 'replacement-char', regex: /\uFFFD/g },
  { label: 'mojibake-replacement', regex: /ï¿½/g },
  { label: 'latin1-utf8', regex: /Ã[^\s]/g },
  { label: 'stray-prefix', regex: /Â[·ºª]/g },
  { label: 'double-encoded-punct', regex: /â(?:€™|€œ|€|€”|€¢|†|š|œ|˜|™)/g },
  { label: 'emoji-mojibake', regex: /ðŸ/g },
  { label: 'cp437-style', regex: /├[^\s]/g },
  { label: 'legacy-symbol', regex: /Ô(?:å|ÿ)/g },
];

const ALLOWLIST = [];

const normalizeSlashes = (value) => value.split(path.sep).join('/');

const isAllowed = (filePath, snippet) => {
  const normalized = normalizeSlashes(path.relative(repoRoot, filePath));
  return ALLOWLIST.some((entry) => {
    return entry.file === normalized && (entry.snippet === undefined || snippet.includes(entry.snippet));
  });
};

const walk = (dir, files) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_PARTS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
};

const files = [];
for (const root of SEARCH_ROOTS) {
  walk(root, files);
}
for (const extraFile of EXTRA_FILES) {
  if (fs.existsSync(extraFile)) {
    files.push(extraFile);
  }
}

const findings = [];

for (const filePath of files) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of SUSPICIOUS_PATTERNS) {
      const matches = line.match(pattern.regex);
      if (!matches) {
        continue;
      }

      if (isAllowed(filePath, line)) {
        continue;
      }

      findings.push({
        file: normalizeSlashes(path.relative(repoRoot, filePath)),
        line: index + 1,
        label: pattern.label,
        snippet: line.trim(),
      });
      break;
    }
  });
}

if (findings.length > 0) {
  console.error('Mojibake/encoding regressions found:\n');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.label}] ${finding.snippet}`);
  }
  process.exitCode = 1;
} else {
  console.log('No mojibake markers found in tracked source/config files.');
}
