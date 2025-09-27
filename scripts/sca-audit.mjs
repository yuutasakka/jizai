#!/usr/bin/env node
// Local SCA runner (root + backend)
// Usage: node scripts/sca-audit.mjs

import { spawnSync } from 'node:child_process';
import { cwd } from 'node:process';
import { resolve } from 'node:path';

const targets = ['.', 'backend'];

function run(cmd, args, workdir) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', cwd: workdir, shell: true });
  return res.status === 0;
}

let failed = false;
for (const t of targets) {
  const dir = resolve(cwd(), t);
  console.log(`\n🔎 Auditing: ${dir}`);
  if (!run('npm', ['ci'], dir) && !run('npm', ['install'], dir)) {
    console.error('❌ Install failed');
    failed = true;
    continue;
  }
  if (!run('npm', ['audit', '--audit-level=high'], dir)) {
    console.error('❌ High+ vulnerabilities found');
    failed = true;
  }
  run('npm', ['outdated'], dir);
}

process.exit(failed ? 1 : 0);

