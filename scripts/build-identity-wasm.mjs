import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const version = process.argv[2] || 'v2';
const manifestPath = join(root, 'public', 'wasm', version, 'manifest.json');
const activePath = join(root, 'public', 'wasm', 'active.json');

if (!/^v\d+$/u.test(version)) {
    throw new Error(`Invalid WASM version [${version}]. Use a semantic folder like v2.`);
}

if (!existsSync(manifestPath)) {
    throw new Error(`Missing manifest: ${manifestPath}`);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const assetPaths = Object.values(manifest.assets || {});

for (const asset of assetPaths) {
    if (typeof asset !== 'string' || !asset.startsWith('/')) {
        throw new Error(`Manifest asset must be an absolute public path: ${asset}`);
    }

    const localPath = join(root, 'public', asset.replace(/^\//u, ''));
    if (!existsSync(localPath)) {
        throw new Error(`Missing WASM asset referenced by ${version}: ${asset}`);
    }
}

mkdirSync(dirname(activePath), { recursive: true });
copyFileSync(manifestPath, activePath);
writeFileSync(
    join(root, 'public', 'wasm', 'BUILD.json'),
    `${JSON.stringify({
        active: version,
        built_at: new Date().toISOString(),
        runtime: manifest.runtime,
        assets: assetPaths.length,
    }, null, 2)}\n`
);

console.log(`Activated identity WASM ${version}`);
