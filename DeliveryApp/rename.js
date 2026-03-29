const fs = require('fs');
const path = require('path');

function walk(dir) {
  const files = fs.readdirSync(dir).filter(f => !['node_modules', '.expo', '.git', 'scripts'].includes(f));
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        // A very basic attempt to remove basic TS types so standard .jsx parsers won't crash if they run without TS presets
        // Actually we will just rename it first.
        fs.renameSync(fullPath, fullPath.replace(/\.tsx$/, '.jsx').replace(/\.ts$/, '.js'));
      }
    }
  }
}

walk(process.cwd());
console.log('Renamed all .tsx and .ts files to .jsx and .js');
