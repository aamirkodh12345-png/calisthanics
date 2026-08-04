/* Winziger lokaler Server fuer die Symbol-Werkstatt.
   Zwei Aufgaben:
     1. rang/ statisch ausliefern — sonst sperrt CORS bei file:// das
        Laden der GLB-Dateien und das Auslesen der Leinwand.
     2. POST /save nimmt fertige Bilder entgegen und legt sie ab.
        Damit umgehen wir die Browser-Downloads, die im Panel oft
        nicht finalisieren.                                          */

import http from 'node:http';
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/* fileURLToPath, nicht url.pathname: der Projektordner hat ein
   Leerzeichen im Namen und kaeme sonst als %20 an.

   Wurzel ist das ganze Projekt, nicht nur rang/ — so laesst sich die
   fertige App unter /flow-6-1.html gegen die neuen Symbole pruefen,
   statt sie nur zu vermuten.                                       */
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUS    = path.join(WURZEL, 'rang', 'render', 'out');
const PORT   = 8778;

const TYP = {
  '.html': 'text/html; charset=utf-8',
  '.js'  : 'text/javascript; charset=utf-8',
  '.mjs' : 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb' : 'model/gltf-binary',
  '.webp': 'image/webp',
  '.png' : 'image/png',
  '.hdr' : 'application/octet-stream',
};

fs.mkdirSync(AUS, { recursive: true });

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/save') {
    let roh = '';
    req.on('data', c => { roh += c; });
    req.on('end', () => {
      try {
        const { name, b64 } = JSON.parse(roh);
        if (!/^[a-z0-9._-]+$/i.test(name)) throw new Error('Name unzulaessig: ' + name);
        const ziel = path.join(AUS, name);
        fs.writeFileSync(ziel, Buffer.from(b64, 'base64'));
        const kb = (fs.statSync(ziel).size / 1024).toFixed(1);
        console.log('gespeichert  ' + name.padEnd(28) + kb + ' KB');
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, kb: +kb }));
      } catch (e) {
        console.error('FEHLER beim Speichern:', e.message);
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, fehler: e.message }));
      }
    });
    return;
  }

  // statisch
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';

  let datei = path.join(WURZEL, p);

  /* Saubere Adressen wie bei Netlify, Vercel und GitHub Pages:
     /anmeldung findet anmeldung.html. Lokal genauso zu testen wie
     spaeter live — sonst faellt ein kaputter Link erst online auf. */
  if (!fs.existsSync(datei) && !path.extname(p)) {
    const mitEndung = path.join(WURZEL, p + '.html');
    if (fs.existsSync(mitEndung)) datei = mitEndung;
  }

  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
    res.writeHead(404); res.end('nicht gefunden: ' + p); return;
  }
  res.writeHead(200, {
    'content-type': TYP[path.extname(datei)] || 'application/octet-stream',
    'cache-control': 'no-store',
  });
  fs.createReadStream(datei).pipe(res);
});

server.listen(PORT, () => {
  console.log('Werkstatt laeuft:  http://localhost:' + PORT + '/render/index.html');
  console.log('Ausgabe nach:      ' + AUS);
});
