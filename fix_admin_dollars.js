const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      const currencyRegex = />\$\{([^}]+)\}</g;
      
      const newContent = content.replace(currencyRegex, (match, inner) => {
        if (inner.includes('toFixed')) {
          return match;
        }
        return `>₹{Number(${inner}).toFixed(2)}<`;
      });
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir('c:/NG-Office_work/stitch_expert_consultation_marketplace_platform/Admin/src');
console.log('Done fixing $ literals in Admin.');
