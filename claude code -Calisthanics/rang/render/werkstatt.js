/* ══════════════════════════════════════════════════════════════════
   DIE ESSE — Symbol-Werkstatt
   Rendert die acht Rang-Modelle unter identischen Bedingungen und
   legt sie als WebP ab.

   Der Kern des Ganzen ist `einpassen()`: Blickwinkel, Abstand und
   Bildausschnitt sind fuer alle acht garantiert gleich, weil die
   Skalierung aus der tatsaechlichen Silhouette im Bild hergeleitet
   wird — nicht aus der Modellgroesse. Genau daran ist der letzte
   Versuch gescheitert (Diamant riesig, Korn winzig).
   ══════════════════════════════════════════════════════════════════ */

import * as THREE            from 'three';
import { GLTFLoader }        from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer }    from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }        from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass }   from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }        from 'three/addons/postprocessing/OutputPass.js';

/* ── Die acht Raenge ─────────────────────────────────────────────── */

export const RAENGE = [
  { nr: 1, datei: '01-korn.glb',        name: 'korn',        titel: 'KORN'        },
  { nr: 2, datei: '02-cluster.glb',     name: 'cluster',     titel: 'CLUSTER'     },
  { nr: 3, datei: '03-prisma.glb',      name: 'prisma',      titel: 'PRISMA'      },
  { nr: 4, datei: '04-zwilling.glb',    name: 'zwilling',    titel: 'ZWILLING'    },
  { nr: 5, datei: '05-druse.glb',       name: 'druse',       titel: 'DRUSE'       },
  { nr: 6, datei: '06-geode.glb',       name: 'geode',       titel: 'GEODE'       },
  { nr: 7, datei: '07-einkristall.glb', name: 'einkristall', titel: 'EINKRISTALL' },
  { nr: 8, datei: '08-diamant.glb',     name: 'diamant',     titel: 'DIAMANT'     },
];

/* ── Voreinstellungen ────────────────────────────────────────────
   Vier fertige Looks zum Durchklicken. `glas` ist die Kurve ueber
   die acht Raenge: wie weit ein Rang vom rohen Stein zum reinen
   Kristall gewandert ist.                                          */

export const LOOKS = {
  esse: {
    titel: 'ESSE — Stein wird Kristall',
    beschreibung: 'Die Dramaturgie des Rangsystems: Korn ist roher Stein, Diamant ist reines Glas.',
    glas:   [0.20, 0.38, 0.55, 0.66, 0.76, 0.86, 0.95, 1.00],
    chrom:  0.00, envStaerke: 1.00, bloom: 0.26, glut: 0.55,
    kante:  0.70, belichtung: 0.92, spitzlicht: 0.55, innenlicht: 0.35, ton: 'aces',
  },
  glas: {
    titel: 'GLAS — alle acht aus Kristall',
    beschreibung: 'Fluessiges Glas durchgehend, harte Reflexe, maximale Brechung.',
    glas:   [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00],
    chrom:  0.00, envStaerke: 1.20, bloom: 0.30, glut: 0.45,
    kante:  0.60, belichtung: 0.98, spitzlicht: 0.60, innenlicht: 0.30, ton: 'aces',
  },
  chrom: {
    titel: 'CHROM — fluessiges Metall',
    beschreibung: 'Keine Brechung, dafuer volle Spiegelung. Haerteste Kontraste.',
    glas:   [0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    chrom:  1.00, envStaerke: 1.35, bloom: 0.22, glut: 0.35,
    kante:  0.45, belichtung: 0.88, spitzlicht: 0.45, innenlicht: 0.20, ton: 'aces',
  },
  obsidian: {
    titel: 'OBSIDIAN — dunkel und poliert',
    beschreibung: 'Fast schwarz, nur die Kanten und Reflexstreifen zeichnen die Form.',
    glas:   [0.35, 0.42, 0.50, 0.58, 0.66, 0.74, 0.82, 0.90],
    chrom:  0.25, envStaerke: 0.70, bloom: 0.20, glut: 0.80,
    kante:  1.00, belichtung: 0.74, spitzlicht: 0.35, innenlicht: 0.55, ton: 'agx',
  },
};

/* ── Die Umgebung ────────────────────────────────────────────────
   Kein HDRI von der Platte, sondern selbst gebaut: tiefschwarzer
   Raum mit vier Softboxen. Das ist fuer Glas besser als ein echtes
   Foto-HDRI — die Reflexe bleiben lange, klare Streifen statt
   Raumgeruempel, und der Grund bleibt wirklich schwarz.            */

const SOFTBOXEN = [
  /* u = Rundum (0..1), v = Hoehe (0 oben, 1 unten)
     Die Zahl hinter i ist der grobe Beitrag zur Gesamthelligkeit
     (Intensitaet x Flaechenanteil). Die Summe soll um 0.5 liegen —
     darueber blasen die hellen Raenge aus und die Saettigung
     kollabiert, weil ausgebrannte Pixel weiss und damit unbunt sind. */
  { u: 0.16, v: 0.26, bu: 0.16, bv: 0.30, weich: 0.13, i:  5.0 }, // Fuehrung, gross und weich  ~.25
  { u: 0.70, v: 0.34, bu: 0.020, bv: 0.46, weich: 0.020, i: 12.0 }, // Kantenlicht, schmal, hart ~.11
  { u: 0.47, v: 0.44, bu: 0.30, bv: 0.34, weich: 0.24, i: 0.55 }, // Aufhellung                ~.06
  { u: 0.88, v: 0.20, bu: 0.09, bv: 0.16, weich: 0.09, i: 2.20 }, // zweite Kante              ~.03
  { u: 0.50, v: 0.03, bu: 1.00, bv: 0.10, weich: 0.10, i: 0.80 }, // Kopflicht                 ~.04
  { u: 0.50, v: 0.97, bu: 1.00, bv: 0.09, weich: 0.13, i: 0.14 }, // Bodenwurf                 ~.01
];

const GRUND = 0.004;

function glatt(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function umgebungBauen(renderer) {
  const B = 1024, H = 512;
  const daten = new Float32Array(B * H * 4);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < B; x++) {
      const u = (x + 0.5) / B, v = (y + 0.5) / H;
      let e = GRUND;

      for (const L of SOFTBOXEN) {
        let du = Math.abs(u - L.u);
        if (du > 0.5) du = 1 - du;              // rundum, also zyklisch
        const dv = Math.abs(v - L.v);
        const fu = 1 - glatt(L.bu * 0.5, L.bu * 0.5 + L.weich, du);
        const fv = 1 - glatt(L.bv * 0.5, L.bv * 0.5 + L.weich, dv);
        e += L.i * fu * fv;
      }

      const i = (y * B + x) * 4;
      daten[i] = daten[i + 1] = daten[i + 2] = e;
      daten[i + 3] = 1;
    }
  }

  const tex = new THREE.DataTexture(daten, B, H, THREE.RGBAFormat, THREE.FloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.needsUpdate = true;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const ziel = pmrem.fromEquirectangular(tex);
  tex.dispose();
  pmrem.dispose();
  return ziel.texture;
}

/* ── Material-Veredelung ─────────────────────────────────────────
   Die Farben aus den GLB-Dateien bleiben unangetastet — die
   Saettigungskurve 0·98·187·176·136·63·22·1 steckt in ihnen und ist
   der Kern des Entwurfs. Veraendert wird nur die Oberflaeche.       */

function istKante(m) {
  const n = (m.name || '').toLowerCase();
  return n.includes('edge') || n.includes('rim') || n.includes('flare');
}

function zuPhysical(m) {
  if (m.isMeshPhysicalMaterial) return m;
  const n = new THREE.MeshPhysicalMaterial({
    color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
    roughness: m.roughness ?? 1,
    metalness: m.metalness ?? 0,
    emissive: m.emissive ? m.emissive.clone() : new THREE.Color(0x000000),
    emissiveIntensity: m.emissiveIntensity ?? 1,
    transparent: m.transparent ?? false,
    opacity: m.opacity ?? 1,
    side: m.side,
    name: m.name,
  });
  n.userData.ersetzt = true;
  return n;
}

const misch = (a, b, t) => a + (b - a) * t;

/* Merkt sich die Ausgangswerte, damit die Regler immer vom Original
   aus rechnen und nicht auf sich selbst aufaddieren.               */
function urzustand(m) {
  if (!m.userData.ur) {
    m.userData.ur = {
      roughness: m.roughness ?? 1,
      metalness: m.metalness ?? 0,
      transmission: m.transmission ?? 0,
      ior: m.ior ?? 1.5,
      thickness: m.thickness ?? 0,
      emissiveIntensity: m.emissiveIntensity ?? 1,
      opacity: m.opacity ?? 1,
      color: m.color ? m.color.clone() : null,
      emissive: m.emissive ? m.emissive.clone() : null,
    };
  }
  return m.userData.ur;
}

/* Saettigung einer Farbe um `f` skalieren. f<1 blasser, f>1 kraeftiger,
   f=0 neutralgrau. Die Helligkeit bleibt dabei erhalten.
   Damit laesst sich die gemessene Kurve 0·98·187·176·136·63·22·1
   erzwingen, statt nur auf sie zu hoffen — und der Diamant kommt mit
   seinen 22 Regenbogen-Kanten trotzdem als reines Schwarzweiss heraus. */
/* Wie bunt ist eine Farbe ueberhaupt? 0 = neutralgrau, 1 = voll bunt. */
function buntheit(c) {
  if (!c) return 0;
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
  return mx < 1e-4 ? 0 : (mx - mn) / mx;
}

function saettigen(ziel, ur, f) {
  if (!ur) return;
  const l = 0.2126 * ur.r + 0.7152 * ur.g + 0.0722 * ur.b;
  ziel.setRGB(
    Math.max(0, l + (ur.r - l) * f),
    Math.max(0, l + (ur.g - l) * f),
    Math.max(0, l + (ur.b - l) * f)
  );
}

export function veredeln(wurzel, p) {
  wurzel.traverse(o => {
    if (!o.material) return;
    const liste = Array.isArray(o.material) ? o.material : [o.material];

    liste.forEach((m0, idx) => {
      let m = m0;

      /* Leuchtkanten bleiben was sie sind: duenne, gluehende Linien.
         Die Saettigung gilt aber auch fuer sie — beim Diamanten sind
         genau diese Kanten der ganze Farbkreis.                      */
      if (istKante(m)) {
        const ur = urzustand(m);
        m.opacity = Math.min(1, ur.opacity * p.kante);
        m.emissiveIntensity = ur.emissiveIntensity;
        m.toneMapped = true;
        saettigen(m.color, ur.color, p.saettigung);
        if (m.emissive) saettigen(m.emissive, ur.emissive, p.saettigung);
        return;
      }

      if (!m.isMeshPhysicalMaterial) {
        m = zuPhysical(m);
        if (Array.isArray(o.material)) o.material[idx] = m; else o.material = m;
      }

      const ur = urzustand(m);
      const g = p.glas;      // 0 = roher Stein, 1 = reiner Kristall
      const c = p.chrom;

      m.roughness    = misch(misch(ur.roughness, 0.020, g), 0.045, c);
      m.metalness    = misch(ur.metalness, 1.0, c);
      m.transmission = misch(ur.transmission, 0.94, g) * (1 - c);
      m.ior          = misch(1.50, 1.95, g);
      m.thickness    = misch(Math.max(ur.thickness, 0.15), 1.40, g);

      /* Die GLB-Dateien setzen attenuationColor auf Weiss — das
         entfaerbt das durchscheinende Licht und ist der Grund, warum
         Rubin und Achat blass wirken. Physikalisch faerbt ein farbiges
         Volumen das Licht auf seinem Weg ein. Also: Eigenfarbe.      */
      if (ur.color && m.transmission > 0.02) {
        m.attenuationColor.copy(ur.color);
        m.attenuationDistance = misch(3.0, 0.55, g) * p.farbtiefe;
      } else {
        m.attenuationDistance = Infinity;
      }

      m.clearcoat          = Math.max(c, g * 0.85);
      m.clearcoatRoughness = 0.030;
      m.iridescence        = p.schiller * g;
      m.iridescenceIOR     = 1.32;
      m.iridescenceThicknessRange = [140, 420];

      /* Der Glut-Hebel darf nur farbiges Leuchten verstaerken. Ohne
         diese Staffelung arbeitet er beim Zwilling gegen sich selbst:
         dessen `whiteHotCore` gluecht weiss, und mehr Weiss senkt die
         Saettigung, statt sie zu heben. Neutrale Kerne werden ueber
         `neutral` statt dessen gedaempft.                            */
      const bunt = buntheit(ur.emissive) || buntheit(ur.color);
      const hebel = 1 + (p.glutHebel - 1) * bunt;
      const daempfung = bunt < 0.25 ? p.neutral : 1;
      m.emissiveIntensity = ur.emissiveIntensity * p.glut * hebel * daempfung;
      m.envMapIntensity   = p.envStaerke;
      saettigen(m.color, ur.color, p.saettigung);
      if (m.emissive) saettigen(m.emissive, ur.emissive, p.saettigung);
      m.needsUpdate = true;
    });
  });
}

/* ── Der Bildausschnitt ──────────────────────────────────────────
   Skaliert und verschiebt das Modell so, dass seine Silhouette den
   Rahmen exakt zu `fuellung` ausfuellt und mittig sitzt. Gerechnet
   wird auf den echten Eckpunkten im Bild, nicht auf der Modell-
   Bounding-Box — nur so sind alle acht wirklich gleich gross.       */

export function einpassen(gruppe, kamera, fuellung) {
  const punkte = [];
  gruppe.updateMatrixWorld(true);
  gruppe.traverse(o => {
    const g = o.geometry;
    if (!g || !g.attributes || !g.attributes.position) return;
    const a = g.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld);
      punkte.push(v.x, v.y, v.z);
    }
  });
  if (!punkte.length) return { skala: 1, punkte: 0 };

  const v = new THREE.Vector3();
  const messen = () => {
    kamera.updateMatrixWorld(true);
    const vp = new THREE.Matrix4().multiplyMatrices(kamera.projectionMatrix, kamera.matrixWorldInverse);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < punkte.length; i += 3) {
      v.set(punkte[i], punkte[i + 1], punkte[i + 2]).applyMatrix4(gruppe.matrixWorld).applyMatrix4(vp);
      if (v.x < x0) x0 = v.x; if (v.x > x1) x1 = v.x;
      if (v.y < y0) y0 = v.y; if (v.y > y1) y1 = v.y;
    }
    return { x0, x1, y0, y1, b: x1 - x0, h: y1 - y0, mx: (x0 + x1) / 2, my: (y0 + y1) / 2 };
  };

  /* Perspektive ist nicht linear, darum ein paar Durchgaenge.       */
  const rechts = new THREE.Vector3(), hoch = new THREE.Vector3();
  kamera.matrixWorld.extractBasis(rechts, hoch, new THREE.Vector3());
  const abstand = kamera.position.length();
  const halb = Math.tan(THREE.MathUtils.degToRad(kamera.fov) / 2) * abstand;

  for (let n = 0; n < 6; n++) {
    gruppe.updateMatrixWorld(true);
    const r = messen();
    const f = (fuellung * 2) / Math.max(r.b, r.h);
    gruppe.scale.multiplyScalar(f);
    gruppe.updateMatrixWorld(true);
    const r2 = messen();
    gruppe.position.addScaledVector(rechts, -r2.mx * halb * kamera.aspect);
    gruppe.position.addScaledVector(hoch,   -r2.my * halb);
  }

  gruppe.updateMatrixWorld(true);
  const s = messen();
  return {
    skala: gruppe.scale.x,
    punkte: punkte.length / 3,
    breite: s.b / 2, hoehe: s.h / 2,          // 1.0 = voller Rahmen
    versatz: Math.hypot(s.mx, s.my),
  };
}

/* ── Die Buehne ──────────────────────────────────────────────────── */

export class Buehne {
  constructor(leinwand, kante = 1024) {
    this.kante = kante;
    this.renderer = new THREE.WebGLRenderer({
      canvas: leinwand,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,     // sonst ist toDataURL leer
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(kante, kante, false);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    /* Der Transmissionspuffer wird ohnehin weichgezeichnet — volle
       Aufloesung kostet bei 2048 viel und bringt nichts sichtbares. */
    this.renderer.transmissionResolutionScale = 0.6;

    this.szene = new THREE.Scene();
    this.szene.background = null;                 // Glas bricht gegen Schwarz

    this.kamera = new THREE.PerspectiveCamera(18, 1, 0.05, 200);

    this.halter = new THREE.Group();
    this.szene.add(this.halter);

    this.umgebung = umgebungBauen(this.renderer);
    this.szene.environment = this.umgebung;

    /* Ein einzelnes hartes Licht fuer die Glanzkante — die Umgebung
       allein laesst die Silhouette bei dunklen Raengen absaufen.    */
    this.spitze = new THREE.DirectionalLight(0xffffff, 2.2);
    this.spitze.position.set(-2.4, 3.0, 2.2);
    this.szene.add(this.spitze);

    this.composer = new EffectComposer(this.renderer);
    this.composer.setSize(kante, kante);
    this.composer.addPass(new RenderPass(this.szene, this.kamera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(kante, kante), 0.34, 0.55, 0.72);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());

    this.lader = new GLTFLoader();
    this.modelle = {};
  }

  async laden(rang) {
    const gltf = await this.lader.loadAsync('/rang/' + rang.datei);
    const wurzel = gltf.scene;
    const lichter = [];
    wurzel.traverse(o => { if (o.isLight) lichter.push(o); });
    lichter.forEach(l => { l.userData.urIntensitaet = l.intensity; });
    this.modelle[rang.name] = { wurzel, lichter, rang };
    return this.modelle[rang.name];
  }

  async allesLaden(fortschritt) {
    for (const r of RAENGE) {
      await this.laden(r);
      if (fortschritt) fortschritt(r);
    }
  }

  /* Stellt genau ein Modell auf die Buehne und passt es ein.        */
  aufbauen(name, p) {
    this.halter.clear();
    const m = this.modelle[name];
    if (!m) return null;

    const g = new THREE.Group();
    g.add(m.wurzel);
    m.wurzel.position.set(0, 0, 0);
    m.wurzel.rotation.set(0, 0, 0);
    m.wurzel.scale.set(1, 1, 1);

    /* Erst zentrieren, dann drehen — sonst wandert das Modell beim
       Drehen aus dem Bild.                                          */
    m.wurzel.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m.wurzel);
    const mitte = box.getCenter(new THREE.Vector3());
    m.wurzel.position.sub(mitte);

    g.rotation.set(
      THREE.MathUtils.degToRad(p.neigung),
      THREE.MathUtils.degToRad(p.drehung + (p.feindrehung || 0)),
      0
    );
    g.rotation.order = 'YXZ';
    this.halter.add(g);

    this.kamera.position.set(0, 0, 12);
    this.kamera.lookAt(0, 0, 0);
    this.kamera.updateProjectionMatrix();

    /* Der Groessenausgleich geht in die Zielfuellung ein, nicht als
       nachtraegliche Skalierung — sonst wandert die Zentrierung mit. */
    const zusatz = (p.zusatzSkala && p.zusatzSkala[name]) || 1;
    const bericht = einpassen(g, this.kamera, p.fuellung * zusatz);

    const k = m.rang.nr - 1;
    const glasWert = p.glasKurve[k];
    /* Glut und Umgebung sind der zweite Stellhebel beim Einmessen:
       wenn die Materialfarbe schon voll ausgereizt ist, laesst sich
       Saettigung nur noch ueber mehr farbiges Eigenleuchten und
       weniger weisse Spiegelung gewinnen.                           */
    const glutF    = (p.glutKurve    && p.glutKurve[k])    ?? 1;
    const envF     = (p.envKurve     && p.envKurve[k])     ?? 1;
    const neutralF = (p.neutralKurve && p.neutralKurve[k]) ?? 1;
    veredeln(m.wurzel, {
      glas: glasWert, chrom: p.chrom, kante: p.kante, schiller: p.schiller,
      glut: p.glut,
      glutHebel: glutF,          // wirkt nur auf farbiges Leuchten
      neutral: neutralF,         // daempft weisse Gluehkerne
      envStaerke: p.envStaerke * envF,
      farbtiefe: p.farbtiefe ?? 1,
      saettigung: (p.saettigungsKurve && p.saettigungsKurve[k]) ?? 1,
    });
    m.lichter.forEach(l => {
      const bunt = buntheit(l.color);
      l.intensity = l.userData.urIntensitaet * p.innenlicht
                  * (1 + (glutF - 1) * bunt) * (bunt < 0.25 ? neutralF : 1);
    });

    this.spitze.intensity = p.spitzlicht;
    this.renderer.toneMappingExposure = p.belichtung;
    this.renderer.toneMapping = p.ton === 'agx' ? THREE.AgXToneMapping
                              : p.ton === 'neutral' ? THREE.NeutralToneMapping
                              : THREE.ACESFilmicToneMapping;
    this.bloom.strength = p.bloom;
    this.bloom.radius = p.bloomRadius;
    this.bloom.threshold = p.bloomSchwelle;

    return { ...bericht, glas: glasWert, zusatz };
  }

  zeichnen() { this.composer.render(); }
}
