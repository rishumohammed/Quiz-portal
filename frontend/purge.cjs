const fs = require('fs');
const path = require('path');

const directories = [
  'd:/Apps/aems/frontend/components',
  'd:/Apps/aems/frontend/pages',
  'd:/Apps/aems/frontend/layouts'
];

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileList);
    } else if (filePath.endsWith('.vue')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

let modifiedCount = 0;

directories.forEach(dir => {
  const vueFiles = walk(dir);
  vueFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Map legacy radius variables
    content = content.replace(/var\(--r(\d+)\)/g, (match, p1) => {
      const r = parseInt(p1, 10);
      if (r <= 8) return 'var(--radius-sm)';
      if (r >= 9 && r <= 12) return 'var(--radius-md)';
      return 'var(--radius-lg)'; // 13px+
    });

    // 2. Process <style> blocks for box-shadows
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
    content = content.replace(styleRegex, (match, styleContent) => {
      let newStyleContent = styleContent.replace(/([^{]+)\{([^}]+)\}/g, (ruleMatch, selector, cssBody) => {
        if (!/box-shadow\s*:/.test(cssBody)) {
          return ruleMatch; // no box shadow
        }
        
        // Remove all box-shadow declarations
        let newCssBody = cssBody.replace(/box-shadow\s*:[^;\}]+(?:;|\s*(?=\}))/g, '');

        // If no border exists, add border: 1px solid var(--border)
        if (!/border\s*:/.test(newCssBody)) {
          newCssBody = newCssBody.replace(/(\s*)$/, '\n  border: 1px solid var(--border);$1');
        }

        return `${selector}{${newCssBody}}`;
      });
      return match.replace(styleContent, newStyleContent);
    });

    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      modifiedCount++;
      console.log(`Modified: ${file}`);
    }
  });
});

console.log(`\nFinished! Modified ${modifiedCount} files.`);
