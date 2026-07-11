const http = require('http');
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const match = arg.match(/^--([^=]+)=(.*)$/);
  return match ? [match[1], match[2]] : [arg.replace(/^--/, ''), true];
}));
const root = path.resolve(process.cwd(), String(args.dir || 'dist'));
const port = Number(args.port || 8787);
if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
  console.error(`Static output folder does not exist: ${root}`);
  process.exit(1);
}
const types = {
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
  '.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8','.srt':'application/x-subrip; charset=utf-8',
  '.md':'text/markdown; charset=utf-8','.txt':'text/plain; charset=utf-8','.msi':'application/x-msi','.zip':'application/zip'
};
function safeFile(urlPath) {
  let decoded;
  try { decoded = decodeURIComponent((urlPath || '/').split('?')[0]); } catch { return null; }
  const relative = decoded.replace(/^\/+/, '');
  let target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(root + path.sep)) return null;
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
  return target;
}
const server = http.createServer((req,res) => {
  const file = safeFile(req.url);
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'});
    res.end('Not found'); return;
  }
  const stat = fs.statSync(file);
  const type = types[path.extname(file).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  const headers = {'Content-Type':type,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) { res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); res.end(); return; }
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), stat.size - 1) : stat.size - 1;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= stat.size) {
      res.writeHead(416, {'Content-Range':`bytes */${stat.size}`}); res.end(); return;
    }
    Object.assign(headers, {'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});
    res.writeHead(206, headers);
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file,{start,end}).pipe(res); return;
  }
  headers['Content-Length'] = stat.size;
  res.writeHead(200, headers);
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(file).pipe(res);
});
server.listen(port,'0.0.0.0',() => {
  console.log(`Serving ${root}`);
  console.log(`Open http://localhost:${port}/`);
  console.log('Press Ctrl+C to stop.');
});
