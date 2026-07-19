import { access, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'website');
const output = path.join(root, 'dist');
const checkOnly = process.argv.includes('--check');
const requiredFiles = ['index.html', 'styles.css', 'app.js'];

async function assertFile(relativePath) {
  const absolutePath = path.join(source, relativePath);
  await access(absolutePath);
  const content = await readFile(absolutePath, 'utf8');
  if (!content.trim()) throw new Error(`${relativePath} is empty`);
  return content;
}

async function main() {
  const [html] = await Promise.all(requiredFiles.map(assertFile));

  for (const asset of ['styles.css', 'app.js']) {
    if (!html.includes(asset)) {
      throw new Error(`index.html does not reference ${asset}`);
    }
  }

  if (checkOnly) {
    console.log('Website source validation passed.');
    return;
  }

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(source, output, { recursive: true });
  await writeFile(path.join(output, '.nojekyll'), '', 'utf8');
  console.log(`Website built into ${path.relative(root, output)}/`);
}

main().catch((error) => {
  console.error(`Website build failed: ${error.message}`);
  process.exitCode = 1;
});
