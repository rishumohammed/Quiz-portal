const fs = require('fs');
const path = require('path');

const navFile = fs.readFileSync('stores/nav.ts', 'utf8');
const routeMatches = [...navFile.matchAll(/route:\s*['"](.*?)['"]/g)];

const routes = [...new Set(routeMatches.map(m => m[1]))];

console.log(`Checking ${routes.length} unique routes...`);

routes.forEach(route => {
  if (route === '/' || route === '/login' || route === '/dashboard') return;

  const relPath = route.startsWith('/') ? route.slice(1) : route;
  const basePath = path.join('pages', relPath);
  
  const possiblePaths = [
    basePath + '.vue',
    path.join(basePath, 'index.vue')
  ];
  
  const exists = possiblePaths.some(p => fs.existsSync(p));
  
  if (!exists) {
    console.error(`❌ BROKEN: ${route}`);
  } else {
    console.log(`✅ OK: ${route}`);
  }
});
