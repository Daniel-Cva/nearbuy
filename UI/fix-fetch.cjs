const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(function(file) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      filelist = walkSync(p, filelist);
    } else {
      if (p.endsWith('.svelte') || p.endsWith('.js')) {
        filelist.push(p);
      }
    }
  });
  return filelist;
};

const dirs = ['src/routes/admin', 'src/routes/user'];
let files = [];
dirs.forEach(d => files = files.concat(walkSync(d)));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Extremely basic regex to add credentials: 'include'
  // Looks for fetch(URL, { ... }) without credentials inside
  const fetchRegex = /fetch\(\s*([^,]+)(?:\s*,\s*(\{[\s\S]*?\}))?\s*\)/g;
  
  content = content.replace(fetchRegex, (match, url, optionsStr) => {
    if (optionsStr) {
      if (!optionsStr.includes('credentials')) {
        // Insert credentials: 'include', into options
        let newOpts = optionsStr.replace(/\{/, "{ credentials: 'include',");
        changed = true;
        return `fetch(${url}, ${newOpts})`;
      }
      return match;
    } else {
      // Add options object
      changed = true;
      return `fetch(${url}, { credentials: 'include' })`;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
console.log('Done');
