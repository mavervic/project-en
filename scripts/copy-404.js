import fs from 'node:fs';
import path from 'node:path';

const indexPath = path.resolve('build/client/index.html');
const notFoundPath = path.resolve('build/client/404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('✓ Successfully duplicated build/client/index.html as 404.html for GitHub Pages SPA routing');
} else {
  console.warn('⚠️ Warning: build/client/index.html was not found; skipped 404.html copy');
}
