const fs = require('fs');
const path = require('path');

const root = process.cwd();
const sfxDir = path.join(root, 'public', 'sfx');
const incomingDir = path.join(sfxDir, '_incoming');
const archiveRootDir = path.join(sfxDir, '_archive');
const requiredFiles = ['menu-open.mp3', 'menu-close.mp3', 'menu-select.mp3'];
const minBytes = 1024;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function timestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function validateIncoming() {
  ensureDir(incomingDir);

  const errors = [];
  for (const fileName of requiredFiles) {
    const fullPath = path.join(incomingDir, fileName);
    if (!fs.existsSync(fullPath)) {
      errors.push(`Fehlt im Staging-Ordner: ${fileName}`);
      continue;
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      errors.push(`Kein regulärer Datei-Eintrag: ${fileName}`);
      continue;
    }
    if (stat.size < minBytes) {
      errors.push(`Datei ist zu klein (< ${minBytes} bytes): ${fileName}`);
    }
  }

  return errors;
}

function archiveCurrentFiles(archiveDir) {
  ensureDir(archiveDir);
  for (const fileName of requiredFiles) {
    const source = path.join(sfxDir, fileName);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(archiveDir, fileName));
    }
  }
}

function replaceFiles() {
  for (const fileName of requiredFiles) {
    const source = path.join(incomingDir, fileName);
    const target = path.join(sfxDir, fileName);
    fs.copyFileSync(source, target);
  }
}

function main() {
  ensureDir(sfxDir);
  ensureDir(incomingDir);
  ensureDir(archiveRootDir);

  const errors = validateIncoming();
  if (errors.length) {
    console.error('SFX-Replace abgebrochen.');
    console.error('Lege diese Dateien in public/sfx/_incoming:');
    for (const fileName of requiredFiles) {
      console.error(`  - ${fileName}`);
    }
    console.error('Probleme:');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  const archiveDir = path.join(archiveRootDir, timestamp());
  archiveCurrentFiles(archiveDir);
  replaceFiles();

  console.log('SFX erfolgreich ersetzt.');
  console.log(`Backup: ${archiveDir}`);
  console.log('Aktualisiert:');
  for (const fileName of requiredFiles) {
    console.log(`  - public/sfx/${fileName}`);
  }
}

main();
