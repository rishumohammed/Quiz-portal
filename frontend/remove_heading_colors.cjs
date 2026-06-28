const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Regex to match <h1...h6> tags and capture their class attributes
  const headingRegex = /<(h[1-6])([^>]*)class="([^"]*)"([^>]*)>/g;

  content = content.replace(headingRegex, (match, tag, beforeClass, classAttr, afterClass) => {
    // Remove text-primary and text-primary-dark from the class attribute
    let newClassAttr = classAttr
      .replace(/\btext-primary-dark\b/g, '')
      .replace(/\btext-primary\b/g, '')
      .replace(/\s+/g, ' ') // clean up extra spaces
      .trim();

    return `<${tag}${beforeClass}class="${newClassAttr}"${afterClass}>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && fullPath.endsWith('.vue')) {
      processFile(fullPath);
    }
  }
}

console.log('Starting scan...');
scanDirectory(path.join(__dirname, 'pages', 'dashboard'));
scanDirectory(path.join(__dirname, 'components'));
console.log('Finished.');
