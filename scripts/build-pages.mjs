// Dependency-free validation and static packaging for GitHub Pages.
import * as fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '_site');
const files = ['index.html', 'style.css', 'app.js', 'data.js', 'i18n.js'];
const context = { window: {} };

for (const file of ['data.js', 'portraits.js', 'i18n.js', 'app.js']) {
  const source = await fs.readFile(path.join(root, file), 'utf8');
  new vm.Script(source, { filename: file });
  if (file !== 'app.js') vm.runInNewContext(source, context);
}

const { IOUTLIVE_PEOPLE: people, IOUTLIVE_ODDITIES: cosmic, IOUTLIVE_ZH: chinese,
  IOUTLIVE_PORTRAITS: portraits, IOUTLIVE_AGE_REMARKS: remarks } = context.window;
const records = [...people, ...cosmic];
if (new Set(records.map(p => p.id)).size !== records.length) throw Error('Duplicate record IDs');
if (!remarks.length || remarks.at(-1).below !== null) throw Error('Missing open-ended age remark');

const images = {};
for (const record of records) {
  if (!chinese[record.id]?.name || !chinese[record.id]?.description) {
    throw Error(`Missing Chinese translation: ${record.id}`);
  }
  const image = portraits[record.id];
  if (!image?.url?.startsWith('assets/portraits/') || !image.credits?.startsWith('https://')) {
    throw Error(`Missing image or credits: ${record.id}`);
  }
  const imagePath = path.resolve(root, image.url);
  if (!imagePath.startsWith(path.join(root, 'assets', 'portraits') + path.sep)) {
    throw Error(`Image outside the portrait directory: ${record.id}`);
  }
  if ((await fs.stat(imagePath)).size < 100) throw Error(`Empty image: ${record.id}`);
  images[record.id] = image;
}

const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"/g)) {
  const file = match[1];
  if (!files.includes(file) && file !== 'portraits.js') throw Error(`Unpackaged dependency: ${file}`);
}

// The only removed directory is this build's fixed, workspace-local output.
if (path.dirname(output) !== root || path.basename(output) !== '_site') throw Error('Invalid output directory');
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(path.join(output, 'assets', 'portraits'), { recursive: true });
for (const file of files) await fs.copyFile(path.join(root, file), path.join(output, file));
for (const image of Object.values(images)) {
  await fs.copyFile(path.join(root, image.url), path.join(output, image.url));
}
await fs.writeFile(path.join(output, 'portraits.js'), 'window.IOUTLIVE_PORTRAITS = ' + JSON.stringify(images) + ';\n');
await fs.writeFile(path.join(output, '.nojekyll'), '');
console.log(`Validated and packaged ${people.length} people, ${cosmic.length} cosmic entries, and ${records.length} images in _site/`);
