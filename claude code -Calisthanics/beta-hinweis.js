/* ══════════════════════════════════════════════════════════════════
   BETA-STREIFEN

   Ein schmales Band direkt unter der Navigation. Sagt jedem, der
   hereinkommt, in welchem Zustand FLOW gerade ist — bevor er sich
   ueber Luecken oder zuruckgesetzte Daten wundert.

   Liegt bewusst in einer eigenen Datei: app.html und tutorial.html
   binden dieselbe ein, so gibt es den Text nur an einer Stelle.

   Zum Abschalten spaeter: diese eine <script>-Zeile aus beiden
   Seiten entfernen — sonst nichts.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  if (window.__betaHinweis) return;

  /* ── Was drin steht ──────────────────────────────────────────
     "Beta" ist hier der richtige Begriff: die App laeuft und ist
     benutzbar, es fehlen aber noch Teile (Skill Tree) und Fehler
     sind moeglich. "Alpha" waere sie, solange Kernfunktionen noch
     gar nicht stehen — das ist laengst vorbei.                  */
  var MARKE = 'Beta';
  var TEXT  = 'FLOW ist noch im Aufbau — Funktionen kommen dazu und können sich ändern.';

  var CSS = [
    '#beta-band{',
      'position:fixed;left:0;right:0;top:var(--fx2-nav-h,46px);z-index:205;',
      'display:flex;align-items:center;justify-content:center;gap:10px;',
      'background:#2A0B4E;',
      'border-bottom:1px solid rgba(201,166,255,.28);',
      'padding:6px 14px;',
      'font-family:var(--font-display,"Helvetica Neue",Inter,system-ui,sans-serif);',
      'line-height:1.25;text-align:center;',
      'pointer-events:none;user-select:none;',
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);',
    '}',
    /* Die Marke traegt das kraeftigere Lila, der Fliesstext das hellere —
       so bleibt der Streifen ruhig und ist trotzdem sofort lesbar. */
    '#beta-band .b-marke{',
      'flex:0 0 auto;',
      'background:#C9A6FF;color:#2A0B4E;',
      'font-size:9px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;',
      'padding:3px 7px;',
    '}',
    '#beta-band .b-text{',
      'color:#C9A6FF;',
      'font-size:11px;font-weight:600;letter-spacing:.01em;',
    '}',
    /* Auf schmalen Geraeten nur die Kurzform — der lange Satz waere
       dort zweizeilig und wuerde zu viel vom Bild wegnehmen.      */
    '@media (max-width:560px){',
      '#beta-band{padding:5px 10px;gap:7px}',
      '#beta-band .b-text{font-size:10px}',
      '#beta-band .b-lang{display:none}',
    '}',
    '@media (min-width:561px){',
      '#beta-band .b-kurz{display:none}',
    '}',
  ].join('');

  var band = null;

  /* Der Streifen liegt fest unter der Navigation und wuerde sonst die
     erste Zeile der Seite verdecken. Statt Zahlen fest einzutragen —
     die Navigation ist auf Handy und Rechner verschieden hoch — wird
     gemessen: Nav-Hoehe festhalten, Streifen daruntersetzen, und
     `--fx2-nav-h` um die Streifenhoehe anheben. Alles, was sich an
     dieser Variablen ausrichtet, rueckt damit von selbst nach.     */
  function ausrichten() {
    if (!band) return;
    var nav = document.getElementById('fx2-nav');
    if (!nav) { band.style.top = '0px'; return; }

    nav.style.height = '';                      // erst zuruecksetzen,
    var wurzel = document.documentElement;       // sonst misst man den
    wurzel.style.removeProperty('--fx2-nav-h');  // eigenen Aufschlag mit
    var navH = nav.getBoundingClientRect().height;
    if (!navH) return;

    nav.style.height = navH + 'px';             // Nav auf ihrer Hoehe halten
    band.style.top = navH + 'px';
    var bandH = band.getBoundingClientRect().height;
    wurzel.style.setProperty('--fx2-nav-h', (navH + bandH) + 'px');
  }

  function bauen() {
    if (document.getElementById('beta-band')) return;

    var stil = document.createElement('style');
    stil.id = 'beta-band-stil';
    stil.textContent = CSS;
    document.head.appendChild(stil);

    band = document.createElement('div');
    band.id = 'beta-band';
    band.setAttribute('role', 'status');
    band.innerHTML =
      '<span class="b-marke">' + MARKE + '</span>' +
      '<span class="b-text">' +
        '<span class="b-lang">' + TEXT + '</span>' +
        '<span class="b-kurz">Noch im Aufbau</span>' +
      '</span>';
    document.body.appendChild(band);

    ausrichten();
    /* Die Navigation wird erst per JS aufgebaut — ein zweiter Anlauf
       kurz danach faengt das ab.                                    */
    setTimeout(ausrichten, 400);
    setTimeout(ausrichten, 1400);
    window.addEventListener('resize', ausrichten);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bauen);
  } else {
    bauen();
  }

  window.__betaHinweis = { bauen: bauen, ausrichten: ausrichten };
})();
