/**
 * inject-do.js — Post-build script
 *
 * After `npm run build`, adapter-cloudflare generates:
 *   .svelte-kit/cloudflare/_worker.js
 *
 * Cloudflare requires the Durable Object class to be a named export
 * from the same entrypoint file. This script appends the export line
 * to the generated _worker.js so wrangler can find it.
 *
 * Usage: node inject-do.js   (run after npm run build)
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerPath = resolve(__dirname, '.svelte-kit/cloudflare/_worker.js');

if (!existsSync(workerPath)) {
    console.error('❌  Build output not found. Run npm run build first.');
    process.exit(1);
}

// Read CollabTracker source and inline it directly into _worker.js
const doSrc = resolve(__dirname, 'src/lib/server/CollabTracker.js');
const doCode = readFileSync(doSrc, 'utf-8');

let workerCode = readFileSync(workerPath, 'utf-8');

if (!workerCode.includes('CollabTracker')) {
    // Strip the import from the class body (we'll hoist it to the top of the file)
    const classBody = doCode
        .replace(/^import\s+.*from\s+['"]cloudflare:workers['"];?\r?\n?/m, '')
        .trim();

    // Hoist the DurableObject import to the very top of _worker.js
    if (!workerCode.includes('DurableObject')) {
        workerCode = `import { DurableObject } from 'cloudflare:workers';\n` + workerCode;
    }

    // Append the class at the end
    workerCode += `\n\n// ── CollabTracker Durable Object (inlined by inject-do.js) ──\n${classBody}\n`;
    writeFileSync(workerPath, workerCode, 'utf-8');
    console.log('✅  CollabTracker DO export injected into _worker.js');
} else {
    console.log('ℹ️   CollabTracker already present in _worker.js, skipping.');
}
