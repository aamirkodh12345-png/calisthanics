/* ══════════════════════════════════════════════════════════════════
   DIE ESSE — der Rang als echtes 3D-Objekt

   Ersetzt das Standbild im Wappenfeld durch das gerechnete Modell.
   Drehen mit Finger oder Maus, sonst dreht es langsam von selbst.
   Beim Aufstieg geht der alte Kristall in den neuen ueber.

   Laeuft auch bei file:// — deshalb kommen die Modelle als Daten-URI
   aus rang-modelle.js und nicht per fetch von der Platte.

   Faellt lautlos auf das Standbild zurueck, wenn WebGL fehlt.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__rang3d) return;

  var THREE = window.FLOW3D && window.FLOW3D.THREE;
  var GLTFLoader = window.FLOW3D && window.FLOW3D.GLTFLoader;
  var OrbitControls = window.FLOW3D && window.FLOW3D.OrbitControls;
  if (!THREE || !GLTFLoader || !window.RANG_GLB) return;

  /* ── Die Einstellungen aus der Werkstatt ───────────────────────
     Eins zu eins uebernommen, damit das Modell in der App genauso
     aussieht wie im Kontaktbogen.                                  */

  var E = {
    drehung: 10, neigung: 0, feindrehung: 13, fuellung: 0.88,
    glasHub: 0.8, schiller: 1.0, kante: 0.1, glut: 2.9, farbtiefe: 3.0,
    envStaerke: 1.7, spitzlicht: 0.0, innenlicht: 4.0, belichtung: 1.02,
    autoDrehung: 0.28,            // Umdrehungen je Minute
    glasKurve: [1, 1, 1, 1, 1, 1, 1, 1],
    saettigungsKurve: [0.0000074, 6, 6, 6, 5.4722747, 1.0377842, 2.0403011, 0.0000528],
    glutKurve: [0.3164062, 3.3215062, 1.8225, 2.460375, 1.35, 1, 1, 0.3164062],
    envKurve: [1.7490062, 0.4521217, 0.6724, 0.551368, 0.82, 1, 1, 1.7490062],
    zusatzSkala: { korn: 1.0526483, cluster: 0.9749193, prisma: 1.1065957,
                   zwilling: 0.8001919, druse: 0.7690950, geode: 0.8696733,
                   einkristall: 1.3512407, diamant: 1.3511621 },
  };

  var NAMEN = ['korn', 'cluster', 'prisma', 'zwilling',
               'druse', 'geode', 'einkristall', 'diamant'];

  /* ── Umgebung: schwarzer Raum mit sechs Softboxen ─────────────── */

  var SOFTBOXEN = [
    { u: 0.16, v: 0.26, bu: 0.16,  bv: 0.30, weich: 0.13,  i: 5.0  },
    { u: 0.70, v: 0.34, bu: 0.020, bv: 0.46, weich: 0.020, i: 12.0 },
    { u: 0.47, v: 0.44, bu: 0.30,  bv: 0.34, weich: 0.24,  i: 0.55 },
    { u: 0.88, v: 0.20, bu: 0.09,  bv: 0.16, weich: 0.09,  i: 2.20 },
    { u: 0.50, v: 0.03, bu: 1.00,  bv: 0.10, weich: 0.10,  i: 0.80 },
    { u: 0.50, v: 0.97, bu: 1.00,  bv: 0.09, weich: 0.13,  i: 0.14 },
  ];

  function glatt(a, b, x) {
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  function umgebungBauen(renderer) {
    var B = 512, H = 256, daten = new Float32Array(B * H * 4);
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < B; x++) {
        var u = (x + 0.5) / B, v = (y + 0.5) / H, e = 0.004;
        for (var k = 0; k < SOFTBOXEN.length; k++) {
          var L = SOFTBOXEN[k];
          var du = Math.abs(u - L.u); if (du > 0.5) du = 1 - du;
          var dv = Math.abs(v - L.v);
          e += L.i * (1 - glatt(L.bu * 0.5, L.bu * 0.5 + L.weich, du))
                   * (1 - glatt(L.bv * 0.5, L.bv * 0.5 + L.weich, dv));
        }
        var i = (y * B + x) * 4;
        daten[i] = daten[i + 1] = daten[i + 2] = e; daten[i + 3] = 1;
      }
    }
    var tex = new THREE.DataTexture(daten, B, H, THREE.RGBAFormat, THREE.FloatType);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.LinearSRGBColorSpace;
    tex.needsUpdate = true;
    var pm = new THREE.PMREMGenerator(renderer);
    var ziel = pm.fromEquirectangular(tex);
    tex.dispose(); pm.dispose();
    return ziel.texture;
  }

  /* ── Material ─────────────────────────────────────────────────── */

  function buntheit(c) {
    if (!c) return 0;
    var mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
    return mx < 1e-4 ? 0 : (mx - mn) / mx;
  }

  function saettigen(ziel, ur, f) {
    if (!ur) return;
    var l = 0.2126 * ur.r + 0.7152 * ur.g + 0.0722 * ur.b;
    ziel.setRGB(Math.max(0, l + (ur.r - l) * f),
                Math.max(0, l + (ur.g - l) * f),
                Math.max(0, l + (ur.b - l) * f));
  }

  function istKante(m) {
    var n = (m.name || '').toLowerCase();
    return n.indexOf('edge') >= 0 || n.indexOf('rim') >= 0 || n.indexOf('flare') >= 0;
  }

  function misch(a, b, t) { return a + (b - a) * t; }

  function veredeln(wurzel, nr) {
    var g = Math.min(1, E.glasKurve[nr] + E.glasHub);
    var sat = E.saettigungsKurve[nr], glutF = E.glutKurve[nr], envF = E.envKurve[nr];

    wurzel.traverse(function (o) {
      if (!o.material) return;
      var liste = Array.isArray(o.material) ? o.material : [o.material];

      liste.forEach(function (m0, idx) {
        var m = m0;
        if (!m.userData.ur) {
          m.userData.ur = {
            roughness: m.roughness || 0, metalness: m.metalness || 0,
            transmission: m.transmission || 0, thickness: m.thickness || 0,
            emissiveIntensity: m.emissiveIntensity == null ? 1 : m.emissiveIntensity,
            opacity: m.opacity == null ? 1 : m.opacity,
            color: m.color ? m.color.clone() : null,
            emissive: m.emissive ? m.emissive.clone() : null,
          };
        }
        var ur = m.userData.ur;

        if (istKante(m)) {
          m.opacity = Math.min(1, ur.opacity * E.kante);
          saettigen(m.color, ur.color, sat);
          if (m.emissive) saettigen(m.emissive, ur.emissive, sat);
          return;
        }

        if (!m.isMeshPhysicalMaterial) {
          var n = new THREE.MeshPhysicalMaterial({
            color: ur.color ? ur.color.clone() : new THREE.Color(0xffffff),
            roughness: ur.roughness, metalness: ur.metalness,
            emissive: ur.emissive ? ur.emissive.clone() : new THREE.Color(0),
            emissiveIntensity: ur.emissiveIntensity,
            transparent: m.transparent, opacity: ur.opacity,
            side: m.side, name: m.name,
          });
          n.userData.ur = ur;
          if (Array.isArray(o.material)) o.material[idx] = n; else o.material = n;
          m = n;
        }

        m.roughness    = misch(ur.roughness, 0.020, g);
        m.transmission = misch(ur.transmission, 0.94, g);
        m.ior          = misch(1.50, 1.95, g);
        m.thickness    = misch(Math.max(ur.thickness, 0.15), 1.40, g);

        if (ur.color && m.transmission > 0.02) {
          m.attenuationColor.copy(ur.color);
          m.attenuationDistance = misch(3.0, 0.55, g) * E.farbtiefe;
        } else {
          m.attenuationDistance = Infinity;
        }

        m.clearcoat = g * 0.85;
        m.clearcoatRoughness = 0.030;
        m.iridescence = E.schiller * g;
        m.iridescenceIOR = 1.32;
        m.iridescenceThicknessRange = [140, 420];

        var bunt = buntheit(ur.emissive) || buntheit(ur.color);
        m.emissiveIntensity = ur.emissiveIntensity * E.glut * (1 + (glutF - 1) * bunt);
        m.envMapIntensity = E.envStaerke * envF;
        saettigen(m.color, ur.color, sat);
        if (m.emissive) saettigen(m.emissive, ur.emissive, sat);
        m.needsUpdate = true;
      });
    });
  }

  /* ── Einpassen ────────────────────────────────────────────────
     Gleiche Rechnung wie in der Werkstatt: die Skalierung kommt aus
     der Silhouette im Bild, nicht aus der Modellgroesse. Nur so sind
     alle acht wirklich gleich gross.                                */

  function einpassen(gruppe, kamera, fuellung) {
    var punkte = [];
    gruppe.updateMatrixWorld(true);
    gruppe.traverse(function (o) {
      var g = o.geometry;
      if (!g || !g.attributes || !g.attributes.position) return;
      var a = g.attributes.position, v = new THREE.Vector3();
      for (var i = 0; i < a.count; i++) {
        v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld);
        punkte.push(v.x, v.y, v.z);
      }
    });
    if (!punkte.length) return;

    var v2 = new THREE.Vector3();
    function messen() {
      kamera.updateMatrixWorld(true);
      var vp = new THREE.Matrix4().multiplyMatrices(kamera.projectionMatrix, kamera.matrixWorldInverse);
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (var i = 0; i < punkte.length; i += 3) {
        v2.set(punkte[i], punkte[i + 1], punkte[i + 2])
          .applyMatrix4(gruppe.matrixWorld).applyMatrix4(vp);
        if (v2.x < x0) x0 = v2.x; if (v2.x > x1) x1 = v2.x;
        if (v2.y < y0) y0 = v2.y; if (v2.y > y1) y1 = v2.y;
      }
      return { b: x1 - x0, h: y1 - y0, mx: (x0 + x1) / 2, my: (y0 + y1) / 2 };
    }

    var rechts = new THREE.Vector3(), hoch = new THREE.Vector3();
    kamera.matrixWorld.extractBasis(rechts, hoch, new THREE.Vector3());
    var halb = Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * kamera.position.length();

    for (var n = 0; n < 5; n++) {
      gruppe.updateMatrixWorld(true);
      var r = messen();
      gruppe.scale.multiplyScalar((fuellung * 2) / Math.max(r.b, r.h));
      gruppe.updateMatrixWorld(true);
      var r2 = messen();
      gruppe.position.addScaledVector(rechts, -r2.mx * halb * kamera.aspect);
      gruppe.position.addScaledVector(hoch, -r2.my * halb);
    }
  }

  /* ── Der Betrachter ───────────────────────────────────────────── */

  function Betrachter(behaelter) {
    var self = this;
    this.behaelter = behaelter;
    this.laeuft = false;
    this.sichtbar = false;
    this.modelle = {};
    this.aktiv = null;
    this.uebergang = null;

    /* Absolut im Feld, nicht `height:100%`: das Wappenfeld bekommt
       seine Hoehe nur ueber aspect-ratio, hat also keine aufloesbare
       Hoehe. Ein height:100% darin faellt auf 0 zusammen — der
       Betrachter rechnet dann korrekt, malt aber ins Nichts.        */
    var leinwand = document.createElement('canvas');
    leinwand.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;' +
                             'display:block;touch-action:none;cursor:grab';
    this.leinwand = leinwand;

    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: leinwand, antialias: true, alpha: false,
        powerPreference: 'low-power',
      });
    } catch (e) { this.fehler = true; return; }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    /* Opakes Schwarz, nicht transparent: das Glas braucht etwas zum
       Brechen, sonst saeuft es ab. Der Grund der Seite ist ohnehin
       reines Schwarz, also faellt kein Kasten auf.                  */
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = E.belichtung;
    this.renderer.transmissionResolutionScale = 0.5;

    this.szene = new THREE.Scene();
    this.szene.environment = umgebungBauen(this.renderer);
    this.kamera = new THREE.PerspectiveCamera(18, 1, 0.05, 200);
    this.kamera.position.set(0, 0, 12);
    this.kamera.lookAt(0, 0, 0);

    this.halter = new THREE.Group();
    this.szene.add(this.halter);

    if (E.spitzlicht > 0) {
      var d = new THREE.DirectionalLight(0xffffff, E.spitzlicht);
      d.position.set(-2.4, 3.0, 2.2);
      this.szene.add(d);
    }

    /* Nur drehen. Zoomen und Verschieben wuerden das Symbol aus dem
       Rahmen tragen und den Bildausschnitt zerstoeren.              */
    if (OrbitControls) {
      var c = new THREE.Object3D();
      this.steuerung = new OrbitControls(this.kamera, leinwand);
      this.steuerung.enableZoom = false;
      this.steuerung.enablePan = false;
      this.steuerung.enableDamping = true;
      this.steuerung.dampingFactor = 0.075;
      /* Bewusst traege: das Feld ist nur rund 150 px breit, bei
         voller Geschwindigkeit schleudert ein kurzer Wisch das
         Modell um 180 Grad.                                        */
      this.steuerung.rotateSpeed = 0.55;
      this.steuerung.minPolarAngle = Math.PI * 0.16;
      this.steuerung.maxPolarAngle = Math.PI * 0.84;
      this.steuerung.addEventListener('start', function () {
        self.angefasst = true;
        clearTimeout(self.ruheUhr);
        leinwand.style.cursor = 'grabbing';
      });
      this.steuerung.addEventListener('end', function () {
        leinwand.style.cursor = 'grab';
        /* Nach einer Ruhepause dreht es wieder von selbst weiter —
           sonst steht das Symbol nach der ersten Beruehrung fuer
           immer still.                                             */
        clearTimeout(self.ruheUhr);
        self.ruheUhr = setTimeout(function () { self.angefasst = false; }, 3500);
      });
    }

    behaelter.appendChild(leinwand);
    this.beobachten();
    this.uhr = new THREE.Clock();
  }

  /* Rechnet nur, wenn das Feld auch zu sehen ist. Sonst laeuft auf
     dem Handy im Hintergrund dauernd der Renderer.                  */
  Betrachter.prototype.beobachten = function () {
    var self = this;
    if (!window.IntersectionObserver) { this.sichtbar = true; return; }
    new IntersectionObserver(function (e) {
      self.sichtbar = e[0].isIntersecting;
      if (self.sichtbar) self.starten();
    }, { threshold: 0.05 }).observe(this.behaelter);
  };

  Betrachter.prototype.groesse = function () {
    var b = this.behaelter.clientWidth || 200;
    var h = this.behaelter.clientHeight || b;
    if (this.breite === b && this.hoehe === h) return;
    this.breite = b; this.hoehe = h;
    this.renderer.setSize(b, h, false);
    this.kamera.aspect = b / h;
    this.kamera.updateProjectionMatrix();
  };

  Betrachter.prototype.laden = function (name) {
    var self = this;
    if (this.modelle[name]) return Promise.resolve(this.modelle[name]);
    var daten = window.RANG_GLB[name];
    if (!daten) return Promise.reject(new Error('kein Modell: ' + name));
    return new Promise(function (ja, nein) {
      new GLTFLoader().load(daten, function (gltf) {
        var nr = NAMEN.indexOf(name);
        var wurzel = gltf.scene;
        veredeln(wurzel, nr);

        var g = new THREE.Group();
        wurzel.updateMatrixWorld(true);
        var box = new THREE.Box3().setFromObject(wurzel);
        wurzel.position.sub(box.getCenter(new THREE.Vector3()));
        g.add(wurzel);

        var aussen = new THREE.Group();
        aussen.rotation.order = 'YXZ';
        aussen.rotation.x = THREE.MathUtils.degToRad(E.neigung);
        aussen.rotation.y = THREE.MathUtils.degToRad(E.drehung + E.feindrehung);
        aussen.add(g);

        self.halter.add(aussen);
        /* Die Groessenfaktoren stammen aus der Werkstatt, wo der
           Rahmen fast randvoll war. Hier wird gedreht — also gedaempft
           und begrenzt, sonst ragt ein schlanker Kristall beim Drehen
           aus dem Feld.                                              */
        var zs = E.zusatzSkala[name] || 1;
        zs = Math.min(1.12, Math.max(0.88, zs));
        self.kamera.updateProjectionMatrix();
        einpassen(g, self.kamera, E.fuellung * zs);
        self.halter.remove(aussen);

        gltf.scene.traverse(function (o) {
          if (o.isLight) o.intensity *= E.innenlicht;
        });

        self.modelle[name] = aussen;
        ja(aussen);
      }, null, nein);
    });
  };

  /* Rang zeigen. Mit `morph` geht der alte Kristall in den neuen
     ueber, statt hart getauscht zu werden.                          */
  Betrachter.prototype.zeigen = function (name, morph) {
    var self = this;
    if (this.name === name && !morph) return Promise.resolve();
    var vorher = this.aktiv;
    this.name = name;

    return this.laden(name).then(function (neu) {
      if (self.name !== name) return;          // inzwischen weitergeklickt

      if (morph && vorher && vorher !== neu) {
        self.halter.add(neu);
        self.uebergang = { alt: vorher, neu: neu, t: 0, dauer: 1.25 };
        neu.scale.setScalar(0.001);
      } else {
        self.halter.clear();
        self.halter.add(neu);
        neu.scale.setScalar(1);
        self.sichtbarSetzen(neu, 1);
      }
      self.aktiv = neu;
      self.starten();
    }).catch(function () { /* Standbild bleibt stehen */ });
  };

  Betrachter.prototype.sichtbarSetzen = function (knoten, wert) {
    knoten.traverse(function (o) {
      if (!o.material) return;
      var l = Array.isArray(o.material) ? o.material : [o.material];
      l.forEach(function (m) {
        if (m.userData.ur == null) return;
        if (wert >= 1) {
          m.opacity = m.userData.ur.opacity;
          m.transparent = m.userData.ur.opacity < 1;
        } else {
          m.transparent = true;
          m.opacity = m.userData.ur.opacity * wert;
        }
      });
    });
  };

  Betrachter.prototype.starten = function () {
    if (this.laeuft || this.fehler) return;
    this.laeuft = true;
    var self = this;
    (function schleife() {
      if (!self.laeuft) return;
      requestAnimationFrame(schleife);
      if (!self.sichtbar) return;
      self.bild();
    })();
  };

  Betrachter.prototype.bild = function () {
    this.groesse();
    var dt = Math.min(0.05, this.uhr.getDelta());

    /* Uebergang zwischen zwei Raengen */
    var u = this.uebergang;
    if (u) {
      u.t += dt / u.dauer;
      var t = Math.min(1, u.t);
      var w = t * t * (3 - 2 * t);
      u.alt.scale.setScalar(1 - 0.85 * w);
      u.alt.rotation.y += dt * 3.4;
      this.sichtbarSetzen(u.alt, 1 - w);
      u.neu.scale.setScalar(0.15 + 0.85 * w);
      this.sichtbarSetzen(u.neu, w);
      if (t >= 1) {
        this.halter.remove(u.alt);
        u.neu.scale.setScalar(1);
        this.sichtbarSetzen(u.neu, 1);
        this.uebergang = null;
      }
    }

    if (!this.angefasst && this.aktiv && !u) {
      this.aktiv.rotation.y += dt * E.autoDrehung * Math.PI * 2 / 60 * 10;
    }
    if (this.steuerung) this.steuerung.update();
    this.renderer.render(this.szene, this.kamera);
  };

  /* ── Anbindung an die Seite ───────────────────────────────────
     Der Rangname wird aus dem Standbild gelesen, das die App schon
     gesetzt hat. Kein Eingriff in den bestehenden Rang-Code.       */

  var betrachter = null;

  function nameAusFeld(feld) {
    var img = feld.querySelector('img');
    if (!img) return null;
    var t = (img.getAttribute('src') || '').split('/').pop().split('.')[0];
    return NAMEN.indexOf(t) >= 0 ? t : null;
  }

  var vorfuehrungBis = 0;

  function anbinden() {
    var feld = document.getElementById('esse-wappen');
    if (!feld) return;
    var name = nameAusFeld(feld);
    if (!name) return;
    /* Waehrend einer Vorfuehrung nicht mit der App abgleichen — sonst
       zieht sie den Rang sofort wieder auf den echten Stand zurueck. */
    if (Date.now() < vorfuehrungBis) return;

    if (!betrachter) {
      betrachter = new Betrachter(feld);
      if (betrachter.fehler) { betrachter = null; return; }   // Standbild bleibt
      window.__rang3d.betrachter = betrachter;
    }

    /* Die App baut das Wappenfeld bei jeder Aenderung neu auf
       (innerHTML = '') und wirft die Leinwand dabei hinaus. Statt in
       ihren Code zu greifen, haengen wir sie einfach wieder ein.    */
    feld.style.position = 'relative';
    if (!feld.contains(betrachter.leinwand)) feld.appendChild(betrachter.leinwand);
    var img = feld.querySelector('img');
    if (img) img.style.display = 'none';

    var wechsel = betrachter.name && betrachter.name !== name;
    betrachter.zeigen(name, wechsel);
  }

  /* Die App baut das Wappen nach, wenn sich der Rang aendert.
     Statt in ihren Code zu greifen, beobachten wir das Feld.        */
  function starten() {
    anbinden();
    var feld = document.getElementById('esse-wappen');
    if (!feld || !window.MutationObserver) return;
    new MutationObserver(function () { anbinden(); })
      .observe(feld, { childList: true, subtree: true, attributes: true,
                       attributeFilter: ['src'] });
  }

  window.__rang3d = {
    starten: starten,
    anbinden: anbinden,
    betrachter: null,
    E: E,
    NAMEN: NAMEN,

    /* Fuer die Kammer: dieselbe Beleuchtung wie im Wappenfeld, damit
       die Kristalle dort nicht anders aussehen.                     */
    umgebung: function (renderer) { return umgebungBauen(renderer); },

    /* Fuer die Kammer: ein fertig veredeltes, eingepasstes Modell.
       Braucht keinen sichtbaren Betrachter — laedt notfalls selbst. */
    modellHolen: function (name) {
      if (betrachter) return betrachter.laden(name);
      return Promise.reject(new Error('kein Betrachter'));
    },
    /* Zum Vorfuehren des Aufstiegs: __rang3d.morphZu('prisma')
       Haelt den Abgleich mit der App 8 Sekunden lang zurueck.       */
    morphZu: function (name) {
      vorfuehrungBis = Date.now() + 8000;
      if (betrachter) betrachter.zeigen(name, true);
    },
    /* Alle acht der Reihe nach vorfuehren. */
    vorfuehren: function () {
      if (!betrachter) return;
      vorfuehrungBis = Date.now() + NAMEN.length * 1800 + 4000;
      NAMEN.forEach(function (n, i) {
        setTimeout(function () { betrachter.zeigen(n, i > 0); }, i * 1800);
      });
    },
  };

  starten();
})();
