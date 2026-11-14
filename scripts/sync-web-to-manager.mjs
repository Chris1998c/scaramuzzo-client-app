#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const managerPublic = join(root, '..', 'scaramuzzo-manager', 'public');
const target = join(managerPublic, 'app-clienti');

if (!existsSync(join(dist, 'index.html'))) {
  throw new Error('Manca dist/index.html. Esegui npm run export:web.');
}
if (!existsSync(managerPublic)) {
  throw new Error('Repo Manager non trovato in ../scaramuzzo-manager/public.');
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
cpSync(dist, target, { recursive: true });
console.log(`Export Clienti copiato in ${target}`);
