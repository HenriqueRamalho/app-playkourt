const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates/local-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates/local-cert.pem')),
};

const port = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    handle(req, res, parse(req.url, true));
  }).listen(port, () => {
    console.log(`> Ready on https://localplaykourt.com:${port}`);
  });
});
