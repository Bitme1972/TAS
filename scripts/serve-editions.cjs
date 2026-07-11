const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.cwd(), 'dist-editions');
const portArg = process.argv.find(value => /^--port=\d+$/.test(value));
const port = portArg ? Number(portArg.split('=')[1]) : 8790;
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml'
};

if (!fs.existsSync(root)) {
  console.error('dist-editions does not exist. Run npm run build:editions first.');
  process.exit(1);
}

const server = http.createServer((request, response) => {
  try {
    const urlPath = decodeURIComponent((request.url || '/').split('?')[0]);
    const requested = urlPath === '/' ? '/community/' : urlPath;
    let file = path.resolve(root, `.${requested}`);
    if (!file.startsWith(root + path.sep) && file !== root) throw new Error('Invalid path');
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('TAS edition preview file not found.');
      return;
    }
    response.writeHead(200, {
      'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Invalid TAS preview request.');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`TAS edition previews are available at http://localhost:${port}/community/`);
  console.log(`Professional: http://localhost:${port}/professional/`);
  console.log(`Consultant:   http://localhost:${port}/consultant/`);
});
