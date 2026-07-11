const fs = require('fs');
const path = require('path');

for (const relativePath of ['dist', 'dist-editions', 'dist-entitled']) {
  const target = path.join(process.cwd(), relativePath);
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}
console.log('Cleaned generated build output. Protected source, evidence data and previews were not changed.');
