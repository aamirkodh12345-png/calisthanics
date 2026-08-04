/* ══════════════════════════════════════════════════════════════════
   DIE ESSE — Galerie der acht Raenge

   Drei Teile:
     1. Ein waagerechtes Band unter dem Wappen. Wischen oder klicken
        fuehrt durch alle acht. Was noch nicht erreicht ist, liegt im
        Dunkeln und traegt den Vermerk VERSCHLOSSEN.
     2. Die Namen steigen im Material auf: matte Bronze beim Korn,
        Gold in der Mitte, beim Diamant spektrales Licht mit Aura.
     3. Ein zurueckhaltender Knopf oeffnet DIE KAMMER — dort stehen
        alle acht im freien Raum, ohne Verdunkelung, und man faehrt
        beim Scrollen nicht nach unten, sondern nach vorn.

   Haengt an window.__rang (Stufe) und window.FLOW3D (three.js).
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__rangGalerie) return;

  var NAMEN = ['korn', 'cluster', 'prisma', 'zwilling',
               'druse', 'geode', 'einkristall', 'diamant'];
  var TITEL = ['KORN', 'CLUSTER', 'PRISMA', 'ZWILLING',
               'DRUSE', 'GEODE', 'EINKRISTALL', 'DIAMANT'];
  var ROEMISCH = ['I', 'II', 'III', 'IV'];

  /* Was jeder Rang verspricht — steht klein unter dem Namen. */
  var SPRUCH = [
    'Das rohe Korn. Alles beginnt hier.',
    'Erste Ordnung im Gestein.',
    'Das Licht bricht sich zum ersten Mal.',
    'Zwei Achsen, ein Wille.',
    'Die Wand traegt hundert Klingen.',
    'Aussen Stein, innen Feuer.',
    'Eine einzige, ununterbrochene Ordnung.',
    'Haerter geht es nicht.'
  ];

  /* ── Die Metalle ──────────────────────────────────────────────
     Acht Stufen, die im Material aufsteigen. Bronze ist matt und
     bleibt ruhig; ab der Druse kommt Aura dazu, beim Diamanten
     wandert spektrales Licht durch die Schrift.                   */

  var CSS = [
    '.rg-band{margin-top:clamp(28px,4vw,52px);border-top:1px solid rgba(255,255,255,.16);padding-top:18px}',
    '.rg-kopf{display:flex;align-items:baseline;gap:14px;margin-bottom:14px}',
    '.rg-kopf h3{font-family:var(--font-display,inherit);font-size:11px;font-weight:800;',
      'letter-spacing:.16em;text-transform:uppercase;margin:0;color:#fff}',
    '.rg-zaehler{font-size:11px;letter-spacing:.12em;color:rgba(255,255,255,.45);',
      'font-variant-numeric:tabular-nums}',
    '.rg-knopf-kammer{margin-left:auto;background:transparent;border:1px solid rgba(255,255,255,.22);',
      'color:rgba(255,255,255,.65);font-family:inherit;font-size:9px;font-weight:700;letter-spacing:.16em;',
      'text-transform:uppercase;padding:7px 13px;cursor:pointer;transition:all .18s ease;line-height:1}',
    '.rg-knopf-kammer:hover{border-color:#E8492B;color:#fff;background:rgba(232,73,43,.14)}',

    /* Das Band */
    '.rg-huelle{position:relative}',
    '.rg-lauf{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;',
      'scroll-behavior:smooth;padding:2px 0 16px;-webkit-overflow-scrolling:touch;',
      'scrollbar-width:none}',
    '.rg-lauf::-webkit-scrollbar{display:none}',
    '.rg-karte{flex:0 0 auto;width:clamp(146px,20vw,196px);scroll-snap-align:center;',
      'background:#000;border:1px solid rgba(255,255,255,.14);padding:14px 14px 16px;',
      'position:relative;transition:border-color .2s ease,transform .2s ease}',
    '.rg-karte.jetzt{border-color:#E8492B}',
    '.rg-karte:hover{transform:translateY(-3px)}',
    '.rg-bild{width:100%;aspect-ratio:1;display:block;object-fit:contain;',
      'transition:filter .35s ease,opacity .35s ease}',

    /* Verschlossen: im Dunkeln, aber die Form bleibt erkennbar. */
    /* Dunkler, aber nicht ausgeloescht: die Silhouette muss lesbar
       bleiben, sonst ist die Vorschau wertlos. Die Kristalle stehen
       ohnehin auf Schwarz — zu wenig Helligkeit und sie verschwinden. */
    '.rg-karte.zu .rg-bild{filter:brightness(.46) saturate(.42) contrast(1.16);opacity:.72}',
    '.rg-karte.zu .rg-name{opacity:.52;filter:grayscale(.5)}',
    '.rg-karte.zu .rg-spruch{opacity:.3}',
    '.rg-schloss{position:absolute;left:0;right:0;bottom:0;text-align:center;',
      'font-size:8px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;',
      'color:rgba(255,255,255,.42);border-top:1px solid rgba(255,255,255,.10);',
      'padding:6px 4px;background:rgba(0,0,0,.72)}',
    '.rg-nr{font-size:9px;letter-spacing:.16em;color:rgba(255,255,255,.35);',
      'font-variant-numeric:tabular-nums;margin-bottom:6px}',
    '.rg-name{font-family:var(--font-display,inherit);font-size:clamp(15px,1.9vw,19px);',
      'font-weight:900;letter-spacing:-.02em;text-transform:uppercase;line-height:1;',
      'margin-top:10px;transition:opacity .3s ease}',
    '.rg-spruch{font-size:9.5px;line-height:1.45;color:rgba(255,255,255,.42);margin-top:5px;',
      'min-height:26px}',
    '.rg-grad{font-size:9px;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-top:7px;',
      'padding-bottom:20px}',
    '.rg-karte.zu .rg-grad{padding-bottom:24px}',

    /* Pfeile */
    '.rg-pfeil{position:absolute;top:38%;width:32px;height:32px;border:1px solid rgba(255,255,255,.22);',
      'background:rgba(0,0,0,.82);color:#fff;cursor:pointer;display:grid;place-items:center;',
      'font-size:15px;line-height:1;z-index:3;transition:all .18s ease;padding:0}',
    '.rg-pfeil:hover{background:#E8492B;border-color:#E8492B}',
    '.rg-pfeil.li{left:-6px}  .rg-pfeil.re{right:-6px}',
    '.rg-pfeil[disabled]{opacity:.2;cursor:default}',

    /* ── Die acht Metalle ── */
    '.m1{color:#8C6239}',                                   /* Bronze, matt */
    '.m2{background:linear-gradient(101deg,#A87039,#D9A066 42%,#9A6633);',
      '-webkit-background-clip:text;background-clip:text;color:transparent}',
    '.m3{background:linear-gradient(101deg,#B08A4A,#E8CB94 44%,#A87F42);',
      '-webkit-background-clip:text;background-clip:text;color:transparent}',
    '.m4{background:linear-gradient(101deg,#9AA3AC,#EDF2F6 46%,#8F99A3);',
      '-webkit-background-clip:text;background-clip:text;color:transparent}',
    '.m5{background:linear-gradient(101deg,#C9971F,#FFE9A3 45%,#BE8C15);',
      '-webkit-background-clip:text;background-clip:text;color:transparent;',
      'filter:drop-shadow(0 0 5px rgba(255,196,60,.34))}',
    '.m6{background:linear-gradient(101deg,#E8B33C,#FFF4CE 42%,#E8492B 88%);',
      '-webkit-background-clip:text;background-clip:text;color:transparent;',
      'filter:drop-shadow(0 0 9px rgba(255,150,40,.48))}',
    '.m7{background:linear-gradient(101deg,#DCE6EE,#FFFFFF 40%,#BFD2E2 72%,#FFFFFF);',
      'background-size:220% 100%;-webkit-background-clip:text;background-clip:text;',
      'color:transparent;filter:drop-shadow(0 0 12px rgba(210,235,255,.62));',
      'animation:rg-wandern 5.5s linear infinite}',
    '.m8{background:linear-gradient(101deg,#FF4D4D,#FFD24D 16%,#7BFF6B 33%,#4DE8FF 50%,',
      '#7B7BFF 67%,#FF6BE8 84%,#FF4D4D);background-size:260% 100%;',
      '-webkit-background-clip:text;background-clip:text;color:transparent;',
      'filter:drop-shadow(0 0 16px rgba(255,255,255,.72));',
      'animation:rg-wandern 3.4s linear infinite}',
    '@keyframes rg-wandern{to{background-position:260% 0}}',
    '@media (prefers-reduced-motion:reduce){.m7,.m8{animation:none}}',

    /* ── Die Kammer ── */
    '.rk-huelle{position:fixed;inset:0;z-index:9999;background:#000;display:none}',
    '.rk-huelle.an{display:block}',
    '.rk-leinwand{position:fixed;inset:0;width:100%;height:100%;display:block}',
    '.rk-lauf{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;',
      '-webkit-overflow-scrolling:touch;overscroll-behavior:contain;',
      'scrollbar-width:none}',
    '.rk-lauf::-webkit-scrollbar{display:none}',
    '.rk-huelle.an{animation:rk-auf .6s cubic-bezier(.16,.84,.28,1) both}',
    '@keyframes rk-auf{from{opacity:0}to{opacity:1}}',
    '.rk-text>*{animation:rk-text-auf .55s cubic-bezier(.16,.84,.28,1) both}',
    '@keyframes rk-text-auf{from{opacity:0;transform:translateY(14px)}',
      'to{opacity:1;transform:none}}',
    '.rk-strecke{position:relative;width:100%}',
    '.rk-text{position:fixed;left:0;right:0;bottom:11vh;text-align:center;',
      'pointer-events:none;padding:0 24px;z-index:2}',
    /* Die hellen Raenge spiegeln sich so stark im Wasser, dass die
       Schrift darin verschwindet. Ein Verlauf von unten faengt das
       ab, ohne den Blick auf die Szene zu verstellen.              */
    '.rk-schleier{position:fixed;left:0;right:0;bottom:0;height:46vh;z-index:1;',
      'pointer-events:none;background:linear-gradient(to top,',
      'rgba(0,0,0,.86) 0%,rgba(0,0,0,.66) 26%,rgba(0,0,0,.30) 58%,transparent 100%)}',
    '.rk-nr{font-size:10px;letter-spacing:.34em;color:rgba(255,255,255,.42);margin-bottom:10px}',
    '.rk-name{font-family:var(--font-display,inherit);font-size:clamp(34px,8vw,92px);',
      'font-weight:900;letter-spacing:-.045em;text-transform:uppercase;line-height:.94;margin:0}',
    '.rk-spruch{font-size:clamp(11px,1.5vw,14px);color:rgba(255,255,255,.55);margin-top:12px;',
      'letter-spacing:.02em}',
    '.rk-zu{position:fixed;top:20px;right:20px;z-index:5;width:42px;height:42px;',
      'background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.25);color:#fff;',
      'font-size:19px;cursor:pointer;display:grid;place-items:center;line-height:1;padding:0}',
    '.rk-zu:hover{background:#E8492B;border-color:#E8492B}',
    '.rk-fort{position:fixed;left:24px;top:50%;transform:translateY(-50%);z-index:4;',
      'display:flex;flex-direction:column;gap:9px}',
    '.rk-punkt{width:6px;height:6px;border:1px solid rgba(255,255,255,.42);',
      'transition:all .3s ease;background:transparent}',
    '.rk-punkt.an{background:#E8492B;border-color:#E8492B;transform:scale(1.5)}',
    '.rk-hinweis{position:fixed;left:0;right:0;bottom:22px;text-align:center;font-size:9px;',
      'letter-spacing:.24em;color:rgba(255,255,255,.34);z-index:3;pointer-events:none;',
      'transition:opacity .5s ease}',
    '@media (max-width:720px){.rk-fort{left:12px}.rk-text{bottom:14vh}}',
  ].join('');

  function stilSetzen() {
    if (document.getElementById('rg-stil')) return;
    var s = document.createElement('style');
    s.id = 'rg-stil';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* Welcher Rang ist erreicht?  Stufe 1..32, je vier je Rang. */
  function erreichterRang() {
    var e = window.__rang && window.__rang.stand();
    if (!e || !e.stufe) return { rang: 0, grad: 0, stufe: 1 };
    return {
      rang: Math.min(7, Math.floor((e.stufe - 1) / 4)),
      grad: (e.stufe - 1) % 4,
      stufe: e.stufe
    };
  }

  /* ══ Teil 1+2 · Das Band ═══════════════════════════════════════ */

  function bandBauen() {
    var haupt = document.querySelector('#screen-esse .esse-haupt');
    if (!haupt || document.getElementById('rg-band')) return;

    var band = document.createElement('div');
    band.className = 'rg-band';
    band.id = 'rg-band';

    var karten = NAMEN.map(function (n, i) {
      return '<article class="rg-karte" data-i="' + i + '">' +
               '<div class="rg-nr">' + String(i + 1).padStart(2, '0') + '</div>' +
               '<img class="rg-bild" src="rang/' + n + '.webp" alt="" loading="lazy">' +
               '<div class="rg-name m' + (i + 1) + '">' + TITEL[i] + '</div>' +
               '<div class="rg-spruch">' + SPRUCH[i] + '</div>' +
               '<div class="rg-grad" data-grad></div>' +
               '<div class="rg-schloss" hidden>Verschlossen</div>' +
             '</article>';
    }).join('');

    band.innerHTML =
      '<div class="rg-kopf">' +
        '<h3>Die acht Stufen</h3>' +
        '<span class="rg-zaehler" id="rg-zaehler">—</span>' +
        '<button class="rg-knopf-kammer" id="rg-kammer-auf">Die Kammer</button>' +
      '</div>' +
      '<div class="rg-huelle">' +
        '<button class="rg-pfeil li" id="rg-li" aria-label="Zurück">‹</button>' +
        '<div class="rg-lauf" id="rg-lauf">' + karten + '</div>' +
        '<button class="rg-pfeil re" id="rg-re" aria-label="Weiter">›</button>' +
      '</div>';

    haupt.parentNode.insertBefore(band, haupt.nextSibling);

    var lauf = band.querySelector('#rg-lauf');
    function schieben(richtung) {
      var k = lauf.querySelector('.rg-karte');
      if (!k) return;
      lauf.scrollBy({ left: richtung * (k.offsetWidth + 14) * 2, behavior: 'smooth' });
    }
    band.querySelector('#rg-li').addEventListener('click', function () { schieben(-1); });
    band.querySelector('#rg-re').addEventListener('click', function () { schieben(1); });
    lauf.addEventListener('scroll', pfeileSetzen, { passive: true });

    band.querySelector('#rg-kammer-auf').addEventListener('click', kammerOeffnen);

    /* Klick auf eine freigeschaltete Karte zeigt sie im Wappenfeld. */
    lauf.addEventListener('click', function (e) {
      var k = e.target.closest('.rg-karte');
      if (!k || k.classList.contains('zu')) return;
      var i = +k.dataset.i;
      if (window.__rang3d && window.__rang3d.morphZu) window.__rang3d.morphZu(NAMEN[i]);
    });

    function pfeileSetzen() {
      var max = lauf.scrollWidth - lauf.clientWidth - 2;
      band.querySelector('#rg-li').disabled = lauf.scrollLeft <= 2;
      band.querySelector('#rg-re').disabled = lauf.scrollLeft >= max;
    }
    setTimeout(pfeileSetzen, 60);
    return band;
  }

  function bandFuellen() {
    var band = document.getElementById('rg-band');
    if (!band) return;
    var st = erreichterRang();

    band.querySelectorAll('.rg-karte').forEach(function (k) {
      var i = +k.dataset.i;
      var offen = i <= st.rang;
      k.classList.toggle('zu', !offen);
      k.classList.toggle('jetzt', i === st.rang);
      k.querySelector('.rg-schloss').hidden = offen;
      var g = k.querySelector('[data-grad]');
      g.textContent = !offen ? ''
        : (i === st.rang ? 'Grad ' + ROEMISCH[st.grad] + ' von IV' : 'Vollendet');
    });

    band.querySelector('#rg-zaehler').textContent =
      (st.rang + 1) + ' von 8 · Stufe ' + st.stufe + ' von 32';

    /* Den erreichten Rang mittig stellen, ohne die Seite zu scrollen. */
    var jetzt = band.querySelector('.rg-karte.jetzt');
    var lauf = band.querySelector('#rg-lauf');
    if (jetzt && lauf) {
      lauf.scrollLeft = jetzt.offsetLeft - (lauf.clientWidth - jetzt.offsetWidth) / 2;
    }
  }

  /* ══ Teil 3 · Die Kammer ═══════════════════════════════════════
     Alle acht im freien Raum, ohne Verdunkelung. Gescrollt wird
     nicht nach unten, sondern nach vorn: das Rad steuert die Tiefe
     der Kamera, die Kristalle ziehen vorbei.                       */

  var kammer = null;

  function Kammer() {
    var F = window.FLOW3D, THREE = F.THREE;
    var self = this;
    this.THREE = THREE;

    var huelle = document.createElement('div');
    huelle.className = 'rk-huelle';
    huelle.innerHTML =
      '<canvas class="rk-leinwand"></canvas>' +
      '<div class="rk-lauf"><div class="rk-strecke"></div></div>' +
      '<div class="rk-schleier"></div>' +
      '<div class="rk-fort"></div>' +
      '<div class="rk-text">' +
        '<div class="rk-nr"></div><h2 class="rk-name"></h2><p class="rk-spruch"></p>' +
      '</div>' +
      '<div class="rk-hinweis">Scrollen führt nach vorn</div>' +
      '<button class="rk-zu" aria-label="Schließen">✕</button>';
    document.body.appendChild(huelle);

    this.huelle  = huelle;
    this.lauf    = huelle.querySelector('.rk-lauf');
    this.strecke = huelle.querySelector('.rk-strecke');
    this.textNr  = huelle.querySelector('.rk-nr');
    this.textName= huelle.querySelector('.rk-name');
    this.textSpr = huelle.querySelector('.rk-spruch');
    this.hinweis = huelle.querySelector('.rk-hinweis');

    huelle.querySelector('.rk-zu').addEventListener('click', function () { self.schliessen(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && huelle.classList.contains('an')) self.schliessen();
    });

    /* Scrollhoehe: acht Abschnitte a eine Bildhoehe. */
    this.strecke.style.height = (NAMEN.length * 100) + 'vh';

    var lw = huelle.querySelector('.rk-leinwand');
    this.renderer = new THREE.WebGLRenderer({ canvas: lw, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.transmissionResolutionScale = 0.5;

    this.szene = new THREE.Scene();
    this.szene.fog = new THREE.FogExp2(0x000000, 0.0016);
    this.kamera = new THREE.PerspectiveCamera(58, 1, 0.1, 4000);

    /* Beleuchtung wie im Wappenfeld, damit die Kristalle gleich
       aussehen — die Umgebung kommt aus rang3d.js.                */
    if (window.__rang3d && window.__rang3d.umgebung) {
      this.szene.environment = window.__rang3d.umgebung(this.renderer);
    }

    this.sterne = [];
    this.sterneBauen();
    this.staubBauen();
    this.nebelBauen();
    this.fernlichtBauen();
    this.kaemmeBauen();
    this.gesteineBauen();
    this.bodenBauen();

    this.composer = new F.EffectComposer(this.renderer);
    this.composer.addPass(new F.RenderPass(this.szene, this.kamera));
    /* Zurueckhaltend: bei starkem Bloom verschmelzen die Kristalle zu
       leuchtenden Flecken und sind nicht mehr auseinanderzuhalten.
       Die hohe Schwelle laesst nur die echten Spitzlichter bluehen.  */
    this.bloom = new F.UnrealBloomPass(new THREE.Vector2(1, 1), 0.38, 0.45, 0.86);
    this.composer.addPass(this.bloom);
    if (F.OutputPass) this.composer.addPass(new F.OutputPass());

    this.stuecke = [];
    this.auren = [];
    this.ABSTAND = 260;
    this.zielTiefe = 0;
    this.tiefe = 0;
    this.uhr = new THREE.Clock();

    this.lauf.addEventListener('scroll', function () { self.scrollen(); }, { passive: true });
    window.addEventListener('resize', function () { self.groesse(); });

    this.punkte = huelle.querySelector('.rk-fort');
    this.punkte.innerHTML = NAMEN.map(function () { return '<div class="rk-punkt"></div>'; }).join('');
  }

  Kammer.prototype.sterneBauen = function () {
    var THREE = this.THREE;
    for (var schicht = 0; schicht < 3; schicht++) {
      var n = 1800, pos = new Float32Array(n * 3), far = new Float32Array(n * 3),
          gr = new Float32Array(n);
      for (var j = 0; j < n; j++) {
        var r = 300 + Math.random() * 1400;
        var th = Math.random() * Math.PI * 2;
        var ph = Math.acos(Math.random() * 2 - 1);
        pos[j * 3]     = r * Math.sin(ph) * Math.cos(th);
        pos[j * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[j * 3 + 2] = r * Math.cos(ph) - 900;
        var c = new THREE.Color(), w = Math.random();
        if (w < 0.72)      c.setHSL(0,    0,   0.78 + Math.random() * 0.22);
        else if (w < 0.92) c.setHSL(0.06, 0.55, 0.74);          // warm, Richtung Esse
        else               c.setHSL(0.58, 0.45, 0.78);
        far[j * 3] = c.r; far[j * 3 + 1] = c.g; far[j * 3 + 2] = c.b;
        gr[j] = Math.random() * 2 + 0.4;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color',    new THREE.BufferAttribute(far, 3));
      geo.setAttribute('size',     new THREE.BufferAttribute(gr, 1));

      var mat = new THREE.ShaderMaterial({
        uniforms: { zeit: { value: 0 }, schicht: { value: schicht } },
        vertexShader:
          'attribute float size;\nattribute vec3 color;\nvarying vec3 vC;\n' +
          'uniform float zeit;\nuniform float schicht;\n' +
          'void main(){ vC=color; vec3 p=position;\n' +
          '  float a=zeit*0.035*(1.0-schicht*0.28);\n' +
          '  mat2 R=mat2(cos(a),-sin(a),sin(a),cos(a)); p.xy=R*p.xy;\n' +
          '  vec4 mv=modelViewMatrix*vec4(p,1.0);\n' +
          '  gl_PointSize=size*(300.0/max(1.0,-mv.z));\n' +
          '  gl_Position=projectionMatrix*mv; }',
        fragmentShader:
          'varying vec3 vC;\n' +
          'void main(){ float d=length(gl_PointCoord-vec2(0.5));\n' +
          '  if(d>0.5) discard;\n' +
          '  gl_FragColor=vec4(vC,1.0-smoothstep(0.0,0.5,d)); }',
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      });
      var p = new THREE.Points(geo, mat);
      this.szene.add(p);
      this.sterne.push(p);
    }
  };

  /* Feiner Staub, nah an der Kamera. Er zieht beim Fliegen sichtbar
     vorbei und macht aus einer Kamerafahrt erst eine Bewegung —
     ferne Sterne allein wirken statisch.                           */
  Kammer.prototype.staubBauen = function () {
    var THREE = this.THREE, n = 2600;
    var pos = new Float32Array(n * 3), gr = new Float32Array(n), ph = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 900;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 460 - 20;
      pos[i * 3 + 2] = -Math.random() * 2400 + 260;
      gr[i] = Math.random() * 1.9 + 0.35;
      ph[i] = Math.random() * 6.283;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('size',     new THREE.BufferAttribute(gr, 1));
    geo.setAttribute('phase',    new THREE.BufferAttribute(ph, 1));

    this.staub = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: { zeit: { value: 0 }, farbe: { value: new THREE.Color(0xFFD9B8) } },
      vertexShader:
        'attribute float size;\nattribute float phase;\nvarying float vA;\nuniform float zeit;\n' +
        'void main(){\n' +
        '  vec3 p=position;\n' +
        '  p.x+=sin(zeit*0.25+phase)*7.0;\n' +
        '  p.y+=cos(zeit*0.18+phase*1.7)*5.0;\n' +
        '  vA=0.35+0.65*(0.5+0.5*sin(zeit*1.1+phase*3.0));\n' +   // Flimmern
        '  vec4 mv=modelViewMatrix*vec4(p,1.0);\n' +
        '  gl_PointSize=size*(240.0/max(1.0,-mv.z));\n' +
        '  gl_Position=projectionMatrix*mv; }',
      fragmentShader:
        'varying float vA; uniform vec3 farbe;\n' +
        'void main(){ float d=length(gl_PointCoord-vec2(0.5));\n' +
        '  if(d>0.5) discard;\n' +
        '  float a=(1.0-smoothstep(0.0,0.5,d))*vA*0.5;\n' +
        '  gl_FragColor=vec4(farbe,a); }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.szene.add(this.staub);
  };

  /* Ein fernes Licht am Ende der Strecke — die Esse selbst. Gibt der
     Fahrt ein Ziel und dem Raum eine Lichtquelle.                   */
  Kammer.prototype.fernlichtBauen = function () {
    var THREE = this.THREE;
    var geo = new THREE.PlaneGeometry(1500, 1500);
    var mat = new THREE.ShaderMaterial({
      uniforms: { zeit: { value: 0 }, farbe: { value: new THREE.Color(0xE8492B) } },
      vertexShader: 'varying vec2 vU;\nvoid main(){ vU=uv;\n' +
        '  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:
        'varying vec2 vU; uniform float zeit; uniform vec3 farbe;\n' +
        'void main(){ float d=length(vU-0.5)*2.0;\n' +
        '  float kern=exp(-d*d*13.0);\n' +
        '  float hof =exp(-d*d*2.1)*0.42;\n' +
        '  float puls=0.90+0.10*sin(zeit*0.7);\n' +
        '  vec3 c=mix(farbe,vec3(1.0,0.94,0.86),kern);\n' +
        '  gl_FragColor=vec4(c,(kern+hof)*puls*0.85); }',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    });
    this.fernlicht = new THREE.Mesh(geo, mat);
    this.fernlicht.position.set(0, 40, -2680);
    this.szene.add(this.fernlicht);
  };

  /* Gesteinsbrocken, die im Raum treiben. Ein InstancedMesh, damit
     zweihundert Stueck einen einzigen Zeichenaufruf kosten.         */
  Kammer.prototype.gesteineBauen = function () {
    var THREE = this.THREE, n = 210;
    /* Unregelmaessig: eine Kugel mit verschobenen Eckpunkten. */
    var geo = new THREE.IcosahedronGeometry(1, 1);
    var p = geo.attributes.position;
    for (var i = 0; i < p.count; i++) {
      var f = 0.62 + Math.random() * 0.76;
      p.setXYZ(i, p.getX(i) * f, p.getY(i) * f * 0.84, p.getZ(i) * f);
    }
    geo.computeVertexNormals();

    var mat = new THREE.MeshStandardMaterial({
      color: 0x2A2622, roughness: 0.94, metalness: 0.04, flatShading: true
    });

    var netz = new THREE.InstancedMesh(geo, mat, n);
    var d = new THREE.Object3D();
    this.gesteinsDaten = [];
    for (var j = 0; j < n; j++) {
      var weit = 120 + Math.random() * 420;
      var wink = Math.random() * Math.PI * 2;
      var x = Math.cos(wink) * weit;
      var y = (Math.random() - 0.5) * 230 - 10;
      var z = 200 - Math.random() * 2500;
      var s = 1.4 + Math.random() * 8.5;
      d.position.set(x, y, z);
      d.rotation.set(Math.random() * 6.3, Math.random() * 6.3, Math.random() * 6.3);
      d.scale.setScalar(s);
      d.updateMatrix();
      netz.setMatrixAt(j, d.matrix);
      this.gesteinsDaten.push({
        x: x, y: y, z: z, s: s,
        drehX: (Math.random() - 0.5) * 0.16,
        drehY: (Math.random() - 0.5) * 0.16,
        phase: Math.random() * 6.283
      });
    }
    netz.instanceMatrix.needsUpdate = true;
    this.gesteine = netz;
    this.gesteinsHilfe = d;
    this.szene.add(netz);
  };

  /* ── Der Boden ────────────────────────────────────────────────
     Hoehlengestein, auf dem Wasser steht. Die Spiegelung ist nicht
     gerechnet, sondern gezielt gesetzt: der reflektierte Blick wird
     gegen die acht Kristalle geprueft, und wo er einen trifft, liegt
     ein Lichtfleck im Wasser. Das kostet acht Schleifendurchlaeufe
     statt eines zweiten Renderdurchgangs — und sieht bei stehendem
     Wasser praktisch gleich aus.                                    */
  Kammer.prototype.bodenBauen = function () {
    var THREE = this.THREE;
    var geo = new THREE.PlaneGeometry(2600, 3400, 1, 1);
    geo.rotateX(-Math.PI / 2);

    var orte = [], farben = [];
    for (var i = 0; i < 8; i++) {
      orte.push(new THREE.Vector3(0, 0, -i * 260));
      farben.push(new THREE.Color(0xffffff));
    }
    /* Die Farbe des Lichtflecks folgt dem Rang. */
    var TON = [0xBFC6CE, 0xC98A4E, 0xFF7A3C, 0xFF4A5A,
               0xFF5A3A, 0xFFA24A, 0xE8F2FF, 0xFFFFFF];
    farben = TON.map(function (t) { return new THREE.Color(t); });

    var mat = new THREE.ShaderMaterial({
      uniforms: {
        zeit:      { value: 0 },
        kamera:    { value: new THREE.Vector3() },
        orte:      { value: orte },
        farben:    { value: farben },
        naehe:     { value: 0 },
        nebelDicht:{ value: 0.00085 }
      },
      vertexShader:
        'varying vec3 vW; varying vec2 vU;\n' +
        'void main(){ vU=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz;\n' +
        '  gl_Position=projectionMatrix*viewMatrix*w; }',
      fragmentShader: [
        'varying vec3 vW; varying vec2 vU;',
        'uniform float zeit; uniform vec3 kamera;',
        'uniform vec3 orte[8]; uniform vec3 farben[8]; uniform float nebelDicht;',

        /* Rauschen */
        'float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }',
        'float noise(vec2 p){ vec2 i=floor(p), f=fract(p);',
        '  f=f*f*(3.0-2.0*f);',
        '  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),',
        '             mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y); }',
        'float fbm(vec2 p){ float s=0.0,a=0.5;',
        '  for(int i=0;i<5;i++){ s+=a*noise(p); p*=2.03; a*=0.5; } return s; }',

        'void main(){',
        '  vec2 q = vW.xz * 0.0105;',

        /* Gestein: grobe Struktur mit Rissen */
        '  float fels = fbm(q*2.1);',
        '  float riss = 1.0-smoothstep(0.0,0.06,abs(fbm(q*1.3)-0.5));',
        '  vec3 stein = mix(vec3(0.030,0.026,0.024), vec3(0.125,0.108,0.096), fels);',
        '  stein += vec3(0.028,0.024,0.020)*noise(q*26.0);',
        '  stein *= 1.0-riss*0.72;',

        /* Pfuetzen: eigene, groessere Struktur — Wasser sammelt sich
           in Senken, nicht ueberall.                                */
        '  float senke = fbm(q*0.85+vec2(11.3,4.7));',
        '  float wasser = smoothstep(0.470,0.545,senke);',

        /* Nasser Saum um jede Pfuetze: dunkler, aber noch matt. */
        '  float saum = smoothstep(0.38,0.50,senke)*(1.0-wasser);',
        '  stein *= 1.0-saum*0.42;',

        /* Blickrichtung und Spiegelstrahl. Die Wellen stoeren die
           Normale leicht — ohne sie waere die Spiegelung glasklar
           und damit falsch.                                        */
        '  vec3 blick = normalize(vW-kamera);',
        '  float w1 = fbm(q*9.0+vec2(zeit*0.06,zeit*0.045));',
        '  float w2 = fbm(q*17.0-vec2(zeit*0.04,zeit*0.07));',
        '  vec3 nrm = normalize(vec3((w1-0.5)*0.10,1.0,(w2-0.5)*0.10));',
        '  vec3 refl = reflect(blick,nrm);',

        /* Die acht Kristalle als Lichtquellen im Wasser. */
        '  vec3 glanz = vec3(0.0);',
        '  for(int i=0;i<8;i++){',
        '    vec3 zu = orte[i]-vW;',
        '    float t = dot(zu,refl);',
        '    if(t>0.0){',
        '      float d = length(vW+refl*t - orte[i]);',
        '      float treffer = exp(-d*d/2600.0);',
        '      float ferne = 1.0/(1.0+t*t*0.0000075);',
        '      glanz += farben[i]*treffer*ferne*4.2;',
        '    }',
        '  }',

        /* Streiflicht: flacher Blick spiegelt staerker. */
        '  float fresnel = pow(1.0-max(0.0,dot(-blick,nrm)),3.4);',
        '  vec3 nass = glanz*(0.42+fresnel*1.15);',
        '  nass += vec3(0.035,0.030,0.042)*fresnel;',            // Restlicht des Raums

        '  vec3 farbe = mix(stein, stein*0.16+nass, wasser);',

        /* Nebel: der Boden muss in der Ferne verschwinden, sonst
           sieht man die Kante der Flaeche.                         */
        '  float dist = length(vW-kamera);',
        '  float sicht = exp(-dist*dist*nebelDicht*nebelDicht);',
        '  float rand = 1.0-smoothstep(0.30,0.50,length(vU-0.5));',
        '  gl_FragColor = vec4(farbe, clamp(sicht*rand,0.0,1.0));',
        '}'
      ].join('\n'),
      transparent: true, depthWrite: false
    });

    this.boden = new THREE.Mesh(geo, mat);
    this.boden.position.set(0, -76, -900);
    this.szene.add(this.boden);
  };

  /* Eine Aura hinter jedem Kristall — ein stehendes Leuchten, das
     mit dem Rang kraeftiger wird.                                   */
  Kammer.prototype.auraFuer = function (i) {
    var THREE = this.THREE;
    var TON = [0x9AA3AC, 0xC98A4E, 0xFF7A3C, 0xFF4A5A,
               0xFF5A3A, 0xFFA24A, 0xE8F2FF, 0xFFFFFF];
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        zeit:   { value: 0 },
        farbe:  { value: new THREE.Color(TON[i]) },
        staerke:{ value: 0.20 + i * 0.055 }
      },
      vertexShader: 'varying vec2 vU;\nvoid main(){ vU=uv;\n' +
        '  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:
        'varying vec2 vU; uniform float zeit; uniform vec3 farbe; uniform float staerke;\n' +
        'void main(){ float d=length(vU-0.5)*2.0;\n' +
        '  if(d>1.0) discard;\n' +
        '  float hof=exp(-d*d*3.4);\n' +
        '  float ring=exp(-pow(d-0.42,2.0)*22.0)*0.30;\n' +
        '  float puls=0.86+0.14*sin(zeit*0.9+float(gl_FragCoord.x)*0.0);\n' +
        '  gl_FragColor=vec4(farbe,(hof+ring)*staerke*puls); }',
      transparent: true, blending: THREE.AdditiveBlending,
      depthWrite: false, side: THREE.DoubleSide
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(96, 96), mat);
    m.userData.istAura = true;
    return m;
  };

  Kammer.prototype.nebelBauen = function () {
    var THREE = this.THREE;
    var geo = new THREE.PlaneGeometry(6000, 3200, 60, 60);
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        zeit: { value: 0 },
        f1: { value: new THREE.Color(0xE8492B) },      // das Orange der App
        f2: { value: new THREE.Color(0x1B2A6B) },
        deck: { value: 0.15 }
      },
      vertexShader:
        'varying vec2 vU; varying float vH; uniform float zeit;\n' +
        'void main(){ vU=uv; vec3 p=position;\n' +
        '  float h=sin(p.x*0.008+zeit)*cos(p.y*0.008+zeit)*26.0;\n' +
        '  p.z+=h; vH=h;\n' +
        '  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
      fragmentShader:
        'uniform vec3 f1; uniform vec3 f2; uniform float deck; uniform float zeit;\n' +
        'varying vec2 vU; varying float vH;\n' +
        'void main(){ float m=sin(vU.x*8.0+zeit)*cos(vU.y*8.0+zeit);\n' +
        '  vec3 c=mix(f1,f2,m*0.5+0.5);\n' +
        '  float a=deck*smoothstep(1.0,0.12,length(vU-0.5)*2.0);\n' +
        '  a*=1.0+vH*0.01;\n' +
        '  gl_FragColor=vec4(c,max(0.0,a)); }',
      transparent: true, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, depthWrite: false
    });
    this.nebel = new THREE.Mesh(geo, mat);
    this.nebel.position.z = -2400;
    this.szene.add(this.nebel);
  };

  /* Statt Bergen: liegende Kaemme aus dem Orange der App, die als
     Schichten vorbeiziehen und Tiefe geben.                        */
  Kammer.prototype.kaemmeBauen = function () {
    var THREE = this.THREE;
    this.kaemme = [];
    var schichten = [
      { z: -1500, h: 150, farbe: 0x0E1119, deck: 0.85 },
      { z: -1850, h: 210, farbe: 0x121826, deck: 0.62 },
      { z: -2200, h: 280, farbe: 0x181d30, deck: 0.44 },
      { z: -2550, h: 350, farbe: 0x1F1A2A, deck: 0.30 }
    ];
    schichten.forEach(function (s, index) {
      var punkte = [], teile = 46;
      for (var i = 0; i <= teile; i++) {
        var x = (i / teile - 0.5) * 2600;
        var y = -120 + Math.sin(i * 0.42 + index) * s.h +
                Math.sin(i * 0.17 + index * 2) * s.h * 0.55 - 240;
        punkte.push(new THREE.Vector2(x, y));
      }
      punkte.push(new THREE.Vector2(3000, -1400));
      punkte.push(new THREE.Vector2(-3000, -1400));
      var geo = new THREE.ShapeGeometry(new THREE.Shape(punkte));
      var mat = new THREE.MeshBasicMaterial({
        color: s.farbe, transparent: true, opacity: s.deck, side: THREE.DoubleSide
      });
      var m = new THREE.Mesh(geo, mat);
      m.position.z = s.z;
      m.userData.grundZ = s.z;
      this.szene.add(m);
      this.kaemme.push(m);
    }, this);
  };

  /* Die acht Kristalle hintereinander in die Tiefe stellen. */
  Kammer.prototype.stueckeStellen = function () {
    var self = this, THREE = this.THREE;
    if (this.stuecke.length) return Promise.resolve();
    if (!window.__rang3d || !window.__rang3d.modellHolen) return Promise.resolve();

    return Promise.all(NAMEN.map(function (n, i) {
      return window.__rang3d.modellHolen(n).then(function (knoten) {
        if (!knoten) return;
        var k = knoten.clone(true);
        k.position.set(0, 0, -i * self.ABSTAND);
        k.scale.setScalar(12);            // aus Wappengroesse in Raumgroesse
        self.szene.add(k);
        self.stuecke[i] = k;

        /* Aura dahinter — sie steht frei in der Szene, nicht im
           Kristall, damit sie sich nicht mitdreht.                 */
        var a = self.auraFuer(i);
        a.position.set(0, 0, -i * self.ABSTAND - 18);
        self.szene.add(a);
        self.auren[i] = a;
      }).catch(function () {});
    }));
  };

  Kammer.prototype.groesse = function () {
    var b = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(b, h, false);
    this.composer.setSize(b, h);
    this.bloom.setSize(b, h);
    this.kamera.aspect = b / h;
    this.kamera.updateProjectionMatrix();
  };

  Kammer.prototype.scrollen = function () {
    var max = this.lauf.scrollHeight - this.lauf.clientHeight;
    var t = max > 0 ? this.lauf.scrollTop / max : 0;
    this.anteil = t;
    /* Aus dem Scrollweg wird Tiefe — nicht Hoehe. */
    this.zielTiefe = t * (NAMEN.length - 1) * this.ABSTAND;

    var i = Math.round(t * (NAMEN.length - 1));
    if (i !== this.zeigt) {
      this.zeigt = i;
      this.textNr.textContent   = String(i + 1).padStart(2, '0') + ' / 08';
      this.textName.textContent = TITEL[i];
      this.textName.className   = 'rk-name m' + (i + 1);
      this.textSpr.textContent  = SPRUCH[i];
      this.punkte.querySelectorAll('.rk-punkt').forEach(function (p, j) {
        p.classList.toggle('an', j === i);
      });
    }
    if (this.hinweis) this.hinweis.style.opacity = t > 0.02 ? '0' : '1';
  };

  Kammer.prototype.bild = function () {
    var dt = Math.min(0.05, this.uhr.getDelta());
    var zeit = this.uhr.getElapsedTime();

    /* Zwei Stufen Glaettung statt einer: die erste faengt das Rucken
       des Mausrads ab, die zweite fuehrt die Kamera. Zusammen ergibt
       das eine Fahrt, die nirgends hakt und trotzdem folgt.        */
    this.weichZiel = this.weichZiel || 0;
    this.weichZiel += (this.zielTiefe - this.weichZiel) * 0.14;
    this.tiefe     += (this.weichZiel - this.tiefe) * 0.055;

    this.kamera.position.z = 215 - this.tiefe;
    this.kamera.position.x = Math.sin(zeit * 0.11) * 3.4;
    this.kamera.position.y = 17 + Math.cos(zeit * 0.15) * 2.0;
    this.kamera.lookAt(0, -7, -this.tiefe - 130);

    this.sterne.forEach(function (s) {
      if (s.material.uniforms) s.material.uniforms.zeit.value = zeit;
    });
    if (this.nebel) this.nebel.material.uniforms.zeit.value = zeit * 0.42;
    if (this.staub) this.staub.material.uniforms.zeit.value = zeit;
    if (this.fernlicht) {
      this.fernlicht.material.uniforms.zeit.value = zeit;
      this.fernlicht.lookAt(this.kamera.position);
    }

    this.kaemme.forEach(function (m, i) {
      var p = 1 + i * 0.55;
      m.position.x = Math.sin(zeit * 0.1) * 4 * p;
      /* Mit der Kamera mitgefuehrt, nicht im Raum verankert: sonst
         holt die Fahrt die Berge ein und sie schieben sich als
         schwarze Keile ins Bild. Ein Horizont bleibt Horizont.     */
      m.position.z = this.kamera.position.z + m.userData.grundZ;
    }, this);

    /* Die Brocken treiben und drehen sich. */
    if (this.gesteine) {
      var d = this.gesteinsHilfe;
      for (var i = 0; i < this.gesteinsDaten.length; i++) {
        var g = this.gesteinsDaten[i];
        d.position.set(
          g.x + Math.sin(zeit * 0.09 + g.phase) * 6.5,
          g.y + Math.cos(zeit * 0.07 + g.phase * 1.4) * 5.0,
          g.z
        );
        d.rotation.set(zeit * g.drehX + g.phase, zeit * g.drehY, g.phase * 0.5);
        d.scale.setScalar(g.s);
        d.updateMatrix();
        this.gesteine.setMatrixAt(i, d.matrix);
      }
      this.gesteine.instanceMatrix.needsUpdate = true;
    }

    /* Der Boden braucht die Kameraposition fuer die Spiegelung und
       wandert mit, damit man seine Kante nie erreicht.             */
    if (this.boden) {
      var u = this.boden.material.uniforms;
      u.zeit.value = zeit;
      u.kamera.value.copy(this.kamera.position);
      this.boden.position.z = this.kamera.position.z - 900;
      for (var j = 0; j < 8; j++) u.orte.value[j].set(0, 0, -j * this.ABSTAND);
    }

    /* Jeder Kristall dreht sich; der gerade angesteuerte etwas
       kraeftiger und groesser.                                     */
    this.stuecke.forEach(function (k, i) {
      if (!k) return;
      k.rotation.y += dt * (0.22 + i * 0.02);
      var ab = Math.abs((this.tiefe / this.ABSTAND) - i);
      var nah = Math.max(0, 1 - ab);
      k.scale.setScalar(12 * (1 + nah * 0.18));
      var a = this.auren[i];
      if (a) {
        a.lookAt(this.kamera.position);          // immer zur Kamera
        a.scale.setScalar(1 + nah * 0.26);
      }
    }, this);

    this.composer.render();
  };

  Kammer.prototype.oeffnen = function () {
    var self = this;
    this.huelle.classList.add('an');
    document.body.style.overflow = 'hidden';
    this.groesse();
    this.lauf.scrollTop = 0;
    this.zeigt = -1;
    this.scrollen();

    this.stueckeStellen().then(function () {
      if (!self.laeuft) {
        self.laeuft = true;
        (function schleife() {
          if (!self.laeuft) return;
          self.rafId = requestAnimationFrame(schleife);
          self.bild();
        })();
      }
    });
  };

  Kammer.prototype.schliessen = function () {
    this.laeuft = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.huelle.classList.remove('an');
    document.body.style.overflow = '';
  };

  function kammerOeffnen() {
    if (!window.FLOW3D || !window.FLOW3D.EffectComposer) return;
    if (!kammer) {
      try { kammer = new Kammer(); }
      catch (e) { kammer = null; return; }
    }
    kammer.oeffnen();
  }

  /* ══ Anbindung ═════════════════════════════════════════════════ */

  function starten() {
    stilSetzen();
    if (!bandBauen()) { /* schon da */ }
    bandFuellen();
    if (window.__rang && window.__rang.horch && !starten.horcht) {
      starten.horcht = true;
      window.__rang.horch(function () { setTimeout(bandFuellen, 30); });
    }
  }

  window.__rangGalerie = {
    starten: starten,
    fuellen: bandFuellen,
    kammer: kammerOeffnen,
    schliessen: function () { if (kammer) kammer.schliessen(); },
    /* Welches Stueck steht der Kamera gerade am naechsten?  Damit
       laesst sich pruefen, ob Beschriftung und Modell zusammenpassen. */
    pruefen: function () {
      if (!kammer) return null;
      var kz = kammer.kamera.position.z, liste = [];
      kammer.stuecke.forEach(function (k, i) {
        if (k) liste.push({ i: i, name: NAMEN[i], abstand: +(kz - k.position.z).toFixed(0) });
      });
      var vorn = liste.filter(function (x) { return x.abstand > 0; })
                      .sort(function (a, b) { return a.abstand - b.abstand; })[0];
      return { kameraZ: +kz.toFixed(0), beschriftung: TITEL[kammer.zeigt],
               naechstesVorn: vorn, alle: liste };
    },
  };

  starten();
})();
