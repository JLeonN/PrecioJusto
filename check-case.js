import fs from 'fs';
import path from 'path';

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  // Simple regex to find imports
  const importRegex = /import\s+(?:.*?\s+from\s+)?['"](.*?)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];
    
    // Skip external modules or aliased paths (except relative or components/pages etc that might be local)
    if (!importPath.startsWith('.') && !importPath.startsWith('/') && !importPath.startsWith('components') && !importPath.startsWith('pages') && !importPath.startsWith('layouts') && !importPath.startsWith('src')) {
      continue;
    }
    
    // We try to resolve
    // This script might be too simple, but let's see if we can just quickly check if there's any obvious mismatch.
    // Actually Vite handles aliases like components/ pages/ layouts/, let's resolve them to src/
    let resolvedBase = path.dirname(filePath);
    let checkPath = importPath;
    
    if (importPath.startsWith('components/')) { resolvedBase = path.join(process.cwd(), 'src'); }
    if (importPath.startsWith('pages/')) { resolvedBase = path.join(process.cwd(), 'src'); }
    if (importPath.startsWith('layouts/')) { resolvedBase = path.join(process.cwd(), 'src'); }
    if (importPath.startsWith('src/')) { resolvedBase = process.cwd(); checkPath = importPath; }
    
    const absoluteCheck = path.resolve(resolvedBase, checkPath);
    // Add extension if missing
    const extensions = ['.js', '.vue', '.json', ''];
    let found = false;
    let actualCasePath = null;
    
    for (const ext of extensions) {
      const p = absoluteCheck + ext;
      if (fs.existsSync(p)) {
        // Need to check real case
        const dir = path.dirname(p);
        const base = path.basename(p);
        const files = fs.readdirSync(dir);
        if (!files.includes(base)) {
          console.error(`Case match failed in ${filePath}: import '${importPath}' -> expected '${base}', found in dir: ${files.find(f => f.toLowerCase() === base.toLowerCase())}`);
        } else {
          // Check parent directories as well for case
          const parentDir = path.dirname(dir);
          const dirBase = path.basename(dir);
          if (fs.existsSync(parentDir)) {
             const parentFiles = fs.readdirSync(parentDir);
             if (!parentFiles.includes(dirBase)) {
                console.error(`Directory case match failed in ${filePath}: import '${importPath}' -> expected '${dirBase}', found in parent dir: ${parentFiles.find(f => f.toLowerCase() === dirBase.toLowerCase())}`);
             }
          }
        }
        found = true;
        break;
      }
    }
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.js') || p.endsWith('.vue')) {
      checkFile(p);
    }
  }
}

walk(path.join(process.cwd(), 'src'));
console.log('Done scanning.');
