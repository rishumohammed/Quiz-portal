const fs = require('fs'); 
const path = require('path'); 

function walk(dir) { 
  let results = []; 
  const list = fs.readdirSync(dir); 
  list.forEach(file => { 
    file = path.join(dir, file); 
    const stat = fs.statSync(file); 
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file)); 
    } else if (file.endsWith('.vue')) { 
      results.push(file); 
    } 
  }); 
  return results; 
} 

const files = walk('c:/App/NEW LMS/aems/frontend/pages/dashboard/employer'); 
files.forEach(file => { 
  let content = fs.readFileSync(file, 'utf8'); 
  content = content.replace(/text-white/g, 'text-grey-darken-4'); 
  content = content.replace(/color="#1a1a2e"/g, 'color="white"'); 
  content = content.replace(/bg-color="#1e1e2d"/g, 'bg-color="white"'); 
  fs.writeFileSync(file, content); 
}); 
console.log('Replaced text-white in files');
