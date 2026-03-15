const fs = require('fs');
const path = require('path');

const root = process.cwd();
const srcDir = path.join(root, 'src');
const outDir = path.join(root, 'dist', 'img', 'icons');
const staticDir = path.join(root, 'node_modules', 'lucide-static', 'icons');

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : fullPath;
  });
}

function toKebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

const files = walk(srcDir).filter((file) => file.endsWith('.tsx'));
const iconSet = new Set();
const importRe = /import\s*\{([\s\S]*?)\}\s*from\s*['\"]lucide-react['\"]/g;

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = importRe.exec(text))) {
    const parts = match[1].split(',').map((v) => v.trim()).filter(Boolean);
    for (const part of parts) {
      const base = part.split(/\s+as\s+/i)[0].trim();
      if (base) iconSet.add(base);
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });

const missing = [];
let copied = 0;
for (const iconName of Array.from(iconSet).sort()) {
  const kebab = toKebab(iconName);
  const src = path.join(staticDir, `${kebab}.svg`);
  const dst = path.join(outDir, `${kebab}.svg`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dst);
    copied++;
  } else {
    missing.push(`${iconName} -> ${kebab}.svg`);
  }
}

console.log(`icons used: ${iconSet.size}`);
console.log(`icons copied: ${copied}`);
console.log(`output: ${outDir}`);
if (missing.length) {
  console.log(`missing: ${missing.length}`);
  for (const m of missing) console.log(`  ${m}`);
  process.exitCode = 2;
}
