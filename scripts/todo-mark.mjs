#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const usage = `
Usage: node todo-mark.mjs <file> <id> <action> [--by=<name>]

Actions:
  done    - Mark item as completed
  undo    - Mark item as uncompleted

Examples:
  node todo-mark.mjs docs/IMPROVEMENT_TODO.md FE-1 done --by=john
  node todo-mark.mjs docs/IMPROVEMENT_TODO.md FE-1 undo
`;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log(usage);
    process.exit(1);
  }

  const [filePath, id, action] = args;
  const byFlag = args.find(arg => arg.startsWith('--by='));
  const author = byFlag ? byFlag.split('=')[1] : 'unknown';

  if (!['done', 'undo'].includes(action)) {
    console.error('Invalid action. Use "done" or "undo"');
    process.exit(1);
  }

  try {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    const today = new Date().toISOString().split('T')[0];
    const lines = content.split('\n');
    let found = false;

    const updatedLines = lines.map(line => {
      if (line.includes(`[ID: ${id}]`)) {
        found = true;
        
        if (action === 'done') {
          // Mark as completed
          const cleanLine = line.replace(/^- \[[ x]\]/, '- [x]')
                               .replace(/ \(done: .*?\)/, '');
          return `${cleanLine.replace(` [ID: ${id}]`, ` (done: ${today} by ${author}) [ID: ${id}]`)}`;
        } else {
          // Mark as uncompleted
          return line.replace(/^- \[x\]/, '- [ ]')
                    .replace(/ \(done: .*?\)/, '');
        }
      }
      return line;
    });

    if (!found) {
      console.error(`ID "${id}" not found in file`);
      process.exit(1);
    }

    await fs.writeFile(fullPath, updatedLines.join('\n'));
    console.log(`✅ Marked ${id} as ${action === 'done' ? 'completed' : 'uncompleted'}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
