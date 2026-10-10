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
      
      let modified = false;
      
      // Match ${Number(inner).toFixed(2)} and revert to ${inner}
      const undoRegex = /\$\{Number\((.*?)\)\.toFixed\(2\)\}/g;
      
      const newContent = content.replace(undoRegex, (match, inner) => {
        return `\${${inner}}`;
      });
      
      if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Reverted ${fullPath}`);
      }
    }
  }
}

processDir('c:/NG-Office_work/stitch_expert_consultation_marketplace_platform/frontend/src');
processDir('c:/NG-Office_work/stitch_expert_consultation_marketplace_platform/Admin/src');
console.log('Done reverting string literals.');
