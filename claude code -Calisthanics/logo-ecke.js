/* ══════════════════════════════════════════════════════════════════
   DIE MARKE IN DER ECKE

   Oben links, im schwarzen Feld der Navigation: das Logo als Bild.
   Faehrt man mit der Maus darueber, wird daraus der gedrehte
   ASCII-Stern — derselbe Renderer wie in logo-ascii.html, nur klein
   und nur dann rechnend, wenn er auch zu sehen ist.

   Das Feld "FLOW/CAL" ist ein CSS-::before und damit kein Element,
   an das sich etwas haengen laesst. Statt es zu leeren — was die
   Grid-Spalte kollabieren liesse und die Reiter verschieben wuerde —
   legt sich die Marke passgenau darueber.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__logoEcke) return;

  var BILD = 'flow-logo-klein.png';

  /* ── Sternform, aus der Logo-Vorlage vermessen ───────────────── */
  var STERN = [
    [ 18.838, 0.3346], [ 30.818, 0.6747], [ 56.967, 0.2546],
    [ 90.000, 0.9054], [123.033, 0.2546], [149.182, 0.6747],
    [161.162, 0.3346], [196.034, 1.0000], [218.512, 0.2108],
    [270.000, 0.8740], [321.488, 0.2108], [343.966, 1.0000]
  ];
  var TIEFE = 0.20, DREH = 0.85, NEIGUNG = 0.18;
  var RAMPE = ' .:-=+*#%@', GAMMA = 1.5;
  var SPALTEN = 26, ZEILEN = 13;          // klein — es sitzt in der Ecke
  var SKALA_X = 38, KAM = 3.4;
  var LICHT = norm({ x: 0.35, y: 0.55, z: 0.78 });

  function norm(v) {
    var l = Math.hypot(v.x, v.y, v.z);
    return { x: v.x / l, y: v.y / l, z: v.z / l };
  }

  function polygon() {
    return STERN.map(function (v) {
      var r = v[1], w = v[0] * Math.PI / 180;
      return { x: r * Math.cos(w), y: r * Math.sin(w) };
    });
  }

  function kantenNormale(p1, p2) {
    var ex = p2.x - p1.x, ey = p2.y - p1.y;
    var nx = ey, ny = -ex;
    var l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    var mx = (p1.x + p2.x) / 2, my = (p1.y + p2.y) / 2;
    if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; }
    return { nx: nx, ny: ny };
  }

  function randRadius(theta, poly) {
    var dx = Math.cos(theta), dy = Math.sin(theta), n = poly.length;
    for (var i = 0; i < n; i++) {
      var p1 = poly[i], p2 = poly[(i + 1) % n];
      var ex = p2.x - p1.x, ey = p2.y - p1.y;
      var nen = ex * dy - ey * dx;
      if (Math.abs(nen) < 1e-9) continue;
      var t = (ex * p1.y - ey * p1.x) / nen;
      var s = (dx * p1.y - dy * p1.x) / nen;
      if (t > 1e-6 && s >= -1e-6 && s <= 1 + 1e-6) return t;
    }
    return 0;
  }

  /* Grober als das grosse Vorbild — bei 26 Zeichen Breite bringt
     feinere Abtastung nichts mehr, kostet aber Rechenzeit.        */
  var W_SCHRITTE = 130, R_SCHRITTE = 14, K_SCHRITTE = 26, T_SCHRITTE = 5;

  function punkte(poly) {
    var flach = [], halb = TIEFE / 2, i, j;
    for (i = 0; i < W_SCHRITTE; i++) {
      var th = (i / W_SCHRITTE) * Math.PI * 2;
      var R = randRadius(th, poly), cx = Math.cos(th), cy = Math.sin(th);
      for (j = 1; j <= R_SCHRITTE; j++) {
        var t = j / R_SCHRITTE, x = cx * R * t, y = cy * R * t;
        flach.push(x, y, halb, 0, 0, 1);
        flach.push(x, y, -halb, 0, 0, -1);
      }
    }
    for (i = 0; i < poly.length; i++) {
      var p1 = poly[i], p2 = poly[(i + 1) % poly.length];
      var nr = kantenNormale(p1, p2);
      for (var s = 0; s <= K_SCHRITTE; s++) {
        var f = s / K_SCHRITTE;
        var px = p1.x + (p2.x - p1.x) * f, py = p1.y + (p2.y - p1.y) * f;
        for (var d = 0; d <= T_SCHRITTE; d++) {
          flach.push(px, py, -halb + (d / T_SCHRITTE) * TIEFE, nr.nx, nr.ny, 0);
        }
      }
    }
    return new Float32Array(flach);
  }

  var PUNKTE = null, ZBUF = null, BUF = null;

  function zeichnen(pre, winkelY) {
    if (!PUNKTE) {
      PUNKTE = punkte(polygon());
      ZBUF = new Float32Array(SPALTEN * ZEILEN);
      BUF = new Array(SPALTEN * ZEILEN);
    }
    ZBUF.fill(-Infinity); BUF.fill(' ');
    var cy = Math.cos(winkelY), sy = Math.sin(winkelY);
    var cx = Math.cos(NEIGUNG), sx = Math.sin(NEIGUNG);
    var hs = SPALTEN / 2, hz = ZEILEN / 2;
    var skalaY = SKALA_X * 0.4545 * (ZEILEN / SPALTEN) * 2;

    for (var i = 0; i < PUNKTE.length; i += 6) {
      var x1 = PUNKTE[i] * cy + PUNKTE[i + 2] * sy;
      var z1 = -PUNKTE[i] * sy + PUNKTE[i + 2] * cy;
      var nx1 = PUNKTE[i + 3] * cy + PUNKTE[i + 5] * sy;
      var nz1 = -PUNKTE[i + 3] * sy + PUNKTE[i + 5] * cy;
      var y2 = PUNKTE[i + 1] * cx - z1 * sx;
      var z2 = PUNKTE[i + 1] * sx + z1 * cx;
      var ny2 = PUNKTE[i + 4] * cx - nz1 * sx;
      var nz2 = PUNKTE[i + 4] * sx + nz1 * cx;
      if (nz2 <= 0) continue;
      var zc = KAM - z2; if (zc <= 0.1) continue;
      var ooz = 1 / zc;
      var xp = Math.round(hs + SKALA_X * ooz * x1);
      var yp = Math.round(hz - skalaY * ooz * y2);
      if (xp < 0 || xp >= SPALTEN || yp < 0 || yp >= ZEILEN) continue;
      var idx = yp * SPALTEN + xp;
      if (ooz > ZBUF[idx]) {
        ZBUF[idx] = ooz;
        var lum = nx1 * LICHT.x + ny2 * LICHT.y + nz2 * LICHT.z;
        lum = Math.max(-1, Math.min(1, lum));
        var t = Math.pow((lum + 1) / 2, GAMMA);
        var ci = Math.max(1, Math.min(RAMPE.length - 1,
                 1 + Math.round(t * (RAMPE.length - 2))));
        BUF[idx] = RAMPE[ci];
      }
    }
    var zeilen = [];
    for (var r = 0; r < ZEILEN; r++) {
      zeilen.push(BUF.slice(r * SPALTEN, r * SPALTEN + SPALTEN).join(''));
    }
    pre.textContent = zeilen.join('\n');
  }

  /* ── Aufbau ──────────────────────────────────────────────────── */

  var CSS = [
    '#flow-marke{',
      'position:fixed;left:0;top:0;z-index:260;',
      'display:flex;align-items:center;gap:9px;',
      'background:#000;color:#fff;text-decoration:none;',
      'padding:0 18px;cursor:pointer;overflow:hidden;',
    '}',
    '#flow-marke .m-bild{',
      'width:26px;height:26px;flex:0 0 auto;display:block;object-fit:contain;',
      'transition:opacity .22s ease,transform .35s cubic-bezier(.2,.7,.3,1);',
    '}',
    '#flow-marke .m-ascii{',
      'position:absolute;left:18px;top:50%;transform:translateY(-50%);',
      'font-family:"Courier New",Consolas,Monaco,monospace;font-weight:700;',
      'font-size:3.1px;line-height:1;white-space:pre;color:#fff;',
      'opacity:0;pointer-events:none;transition:opacity .22s ease;',
    '}',
    '#flow-marke .m-text{',
      'font-family:"Inter",system-ui,sans-serif;font-size:14px;font-weight:900;',
      'letter-spacing:-.01em;white-space:nowrap;',
    '}',
    /* Beruehrung: Bild weicht, der gedrehte Stern tritt hervor. */
    '#flow-marke:hover .m-bild,#flow-marke:focus-visible .m-bild{opacity:0;transform:scale(.82)}',
    '#flow-marke:hover .m-ascii,#flow-marke:focus-visible .m-ascii{opacity:1}',
    '@media (hover:none){#flow-marke .m-ascii{display:none}}',
    '@media (prefers-reduced-motion:reduce){#flow-marke .m-bild{transition:none}}',
  ].join('');

  var marke = null, laeuft = false, winkel = 0, rafId = null;

  /* Legt die Marke deckungsgleich auf das schwarze Feld der
     Navigation. Gemessen statt geraten — das Feld ist auf Handy und
     Rechner verschieden breit.                                     */
  function ausrichten() {
    var nav = document.getElementById('fx2-nav');
    if (!nav || !marke) return;
    var r = nav.getBoundingClientRect();
    marke.style.height = r.height + 'px';
    marke.style.top = r.top + 'px';
  }

  function schleife() {
    if (!laeuft) return;
    rafId = requestAnimationFrame(schleife);
    winkel += 0.016 * DREH;
    zeichnen(marke.querySelector('.m-ascii'), winkel);
  }

  function bauen() {
    if (document.getElementById('flow-marke')) return;
    var nav = document.getElementById('fx2-nav');
    if (!nav) return;

    var stil = document.createElement('style');
    stil.id = 'flow-marke-stil';
    stil.textContent = CSS;
    document.head.appendChild(stil);

    marke = document.createElement('a');
    marke.id = 'flow-marke';
    marke.href = '#';
    marke.setAttribute('aria-label', 'FLOW — zur Startansicht');
    marke.innerHTML =
      '<img class="m-bild" src="' + BILD + '" alt="">' +
      '<pre class="m-ascii" aria-hidden="true"></pre>' +
      '<span class="m-text">FLOW/CAL</span>';
    document.body.appendChild(marke);

    /* Nur rechnen, solange der Zeiger daraufsteht. */
    marke.addEventListener('mouseenter', function () {
      if (laeuft) return;
      laeuft = true; schleife();
    });
    marke.addEventListener('mouseleave', function () {
      laeuft = false;
      if (rafId) cancelAnimationFrame(rafId);
    });

    marke.addEventListener('click', function (e) {
      e.preventDefault();
      var erste = document.querySelector('#fx2-nav .tab');
      if (erste) erste.click();
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    ausrichten();
    setTimeout(ausrichten, 400);
    setTimeout(ausrichten, 1400);
    window.addEventListener('resize', ausrichten);
  }

  function start() {
    bauen();
    if (!document.getElementById('flow-marke')) setTimeout(start, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 300); });
  } else {
    setTimeout(start, 300);
  }

  window.__logoEcke = { bauen: bauen, ausrichten: ausrichten };
})();
