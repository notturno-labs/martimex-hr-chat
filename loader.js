/* ============================================================
   MARTI CHAT – loader.js
   Stranica (martimex.hr) sama učitava Voiceflow widget.
   Ovaj file mu dodaje skripte s GitHuba (a kasnije po potrebi i CSS).
   ============================================================ */
(function () {

  /* ---------- POSTAVKE – ovo smiješ mijenjati ---------- */

  // CSS s izgledom chata – za sada ga nema.
  // Kad ga napraviš, ovdje upiši ime filea, npr. 'widget-style.css'.
  var CSS_FILE = '';

  // Skripte koje se učitavaju prije pokretanja chata – jedno ime po retku.
  // Redak koji počinje s # se preskače (tako privremeno isključiš modul).
  var MODULI = `
    kartica-artikla.js
  `;

  // Ostale Voiceflow postavke koje želiš dodati s GitHuba (za sada ništa).
  var DODATNO = {};

  /* ---------- ISPOD OVOGA NE TREBAŠ DIRATI ---------- */

  if (window.__martimexLoader) return;
  window.__martimexLoader = true;

  var BASE = document.currentScript.src.replace(/[^\/]*$/, '');  // adresa ovog repozitorija
  var v = Math.floor(Date.now() / 60000);                         // nova oznaka svake minute

  window.MartimexExtensions = window.MartimexExtensions || [];

  // Učita jednu skriptu; ako je nema, zapiše upozorenje i ide dalje
  function load(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;  // preuzimaju se paralelno, izvršavaju redom
      s.onload = resolve;
      s.onerror = function () { console.warn('[Martimex] Nije učitano:', src); resolve(); };
      document.head.appendChild(s);
    });
  }

  // Omota ekstenziju tako da njezina greška ne sruši cijeli chat
  function sigurno(ext) {
    var w = Object.assign({}, ext);
    ['match', 'render', 'effect'].forEach(function (k) {
      if (typeof ext[k] !== 'function') return;
      w[k] = function () {
        try { return ext[k].apply(this, arguments); }
        catch (e) {
          console.error('[Martimex] Greška u ekstenziji ' + ext.name + ':', e);
          return k === 'match' ? false : undefined;
        }
      };
    });
    return w;
  }

  var datoteke = MODULI.split('\n')
    .map(function (l) { return l.trim(); })
    .filter(function (l) { return l && !/^(#|\/\/)/.test(l); });

  Promise.all(datoteke.map(function (f) { return load(BASE + f + '?v=' + v); }))
    .then(function () {
      var ekstenzije = window.MartimexExtensions
        .filter(function (e) {
          var ok = e && typeof e.match === 'function';
          if (!ok) console.warn('[Martimex] Preskočena neispravna ekstenzija:', e);
          return ok;
        })
        .map(sigurno);

      var cfg = Object.assign({}, DODATNO);
      cfg.assistant = Object.assign({}, DODATNO.assistant, { extensions: ekstenzije });
      if (CSS_FILE) cfg.assistant.stylesheet = BASE + CSS_FILE + '?v=' + v;

      window.MartimexConfig = cfg;  // za kraću verziju koda na stranici
      if (typeof window.__martimexGitHub === 'function') window.__martimexGitHub(cfg);
    });

})();
