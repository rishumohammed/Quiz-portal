const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('d:/Apps/aems/frontend/pages/dashboard', (filePath) => {
  if(filePath.endsWith('.vue')) {
    const c = fs.readFileSync(filePath, 'utf8');
    const m = c.match(/<template>\s*(<div[^>]*>|<v-container[^>]*>)/i);
    let wrapper = m ? m[1] : 'unknown';
    
    // find title class
    const t = c.match(/class="(?:[^"]*\s)?(text-h[456]|page-title)[^"]/);
    let titleClass = t ? t[1] : 'unknown';
    
    console.log(filePath.split('dashboard\\')[1] + ' | Wrapper: ' + wrapper + ' | Title: ' + titleClass);
  }
});
