const fs = require('fs');
const path = require('path');

// Common mojibake mapping from Windows-1252 / ISO-8859-1 double encoding
const REPLACEMENTS = [
  [/—/g, '—'],       // em dash
  [/–/g, '–'],       // en dash
  [/…/g, '…'],       // horizontal ellipsis
  [/•/g, '•'],       // bullet
  [/“/g, '“'],       // left double quote
  [/”/g, '”'],       // right double quote
  [/‘/g, '‘'],       // left single quote
  [/’/g, '’'],       // right single quote
  [/⌥/g, '⌥'],       // option key
  [/⚠️ï¸\x8f/g, '⚠️'],
  [/⚠️ /g, '⚠️ '],
  [/⚠️/g, '⚠️'],
  [/→/g, '→'],       // right arrow
  [/â—\x8f/g, '●'],     // black circle
  [/● /g, '● '],
  [/·/g, '·'],        // middle dot
  [/«/g, '«'],
  [/»/g, '»'],
  [/™/g, '™'],
  [/©/g, '©'],
  [/®/g, '®'],
  [/ /g, ' '],
  [/é/g, 'é'],
  [/è/g, 'è'],
  [/à/g, 'à'],
  [/â/g, 'â'],
  [/ï/g, 'ï'],
  [/î/g, 'î'],
  [/ö/g, 'ö'],
  [/ä/g, 'ä'],
  [/ü/g, 'ü'],
  [/ß/g, 'ß'],
  [/ñ/g, 'ñ'],
  [/▴/g, '▴'],
  [/○/g, '○'],
  [/✓/g, '✓'],
  [/✔/g, '✔'],
  [/☕/g, '☕'],
  [/♥/g, '♥'],
  [/←/g, '←'],
  [/↔/g, '↔'],
  [/✖/g, '✖']
];

function scanAndFix(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'dist' && entry.name !== 'out') {
        scanAndFix(full);
      }
    } else if (/\.(json|ts|tsx|js|cjs|mjs|html|md|yml)$/.test(entry.name)) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [pattern, replacement] of REPLACEMENTS) {
        if (pattern.test(content)) {
          content = content.replace(pattern, replacement);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log(`Fixed mojibake in: ${full}`);
      }
    }
  }
}

scanAndFix(path.resolve(__dirname, '..'));
console.log('Done scanning.');
