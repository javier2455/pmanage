const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    
    // Handle Next.js static files
    if (parsedUrl.pathname.startsWith('/_next/') || 
        parsedUrl.pathname.startsWith('/next/') ||
        parsedUrl.pathname.includes('.ico') ||
        parsedUrl.pathname.includes('.svg') ||
        parsedUrl.pathname.includes('.png') ||
        parsedUrl.pathname.includes('.jpg') ||
        parsedUrl.pathname.includes('.jpeg') ||
        parsedUrl.pathname.includes('.gif') ||
        parsedUrl.pathname.includes('.webp')) {
      
      const filePath = path.join(__dirname, '.next', parsedUrl.pathname);
      const fs = require('fs');
      
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentTypes = {
          '.ico': 'image/x-icon',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
        };
        
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        fs.createReadStream(filePath).pipe(res);
        return;
      }
    }
    
    // Handle public folder files
    if (parsedUrl.pathname.startsWith('/') && !parsedUrl.pathname.startsWith('/_next')) {
      const publicPath = path.join(__dirname, 'public', parsedUrl.pathname);
      const fs = require('fs');
      
      if (fs.existsSync(publicPath) && fs.statSync(publicPath).isFile()) {
        const ext = path.extname(publicPath);
        const contentTypes = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.ico': 'image/x-icon',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.webp': 'image/webp',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
        };
        
        res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        fs.createReadStream(publicPath).pipe(res);
        return;
      }
    }

    handle(req, res, parsedUrl);
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
  });
});
