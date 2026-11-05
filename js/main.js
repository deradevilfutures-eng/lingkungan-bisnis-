(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');

  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // safety net: never leave content hidden
    setTimeout(function () {
      revealEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
      });
    }, 1200);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- drawer + dots ---------- */
  var drawer = document.getElementById('drawer');
  var drawerList = document.getElementById('drawerList');
  var dots = document.getElementById('dots');
  var menuBtn = document.getElementById('menuBtn');
  var dotLinks = [], drawerLinks = [];

  slides.forEach(function (s, i) {
    var n = i + 1, label = s.getAttribute('data-label');
    var li = document.createElement('li');
    var a = document.createElement('a');
    a.href = '#' + s.id;
    a.innerHTML = '<i>' + (n < 10 ? '0' + n : n) + '</i><span></span>';
    a.lastChild.textContent = label;
    a.addEventListener('click', closeMenu);
    li.appendChild(a); drawerList.appendChild(li); drawerLinks.push(a);

    var d = document.createElement('a');
    d.href = '#' + s.id; d.setAttribute('aria-label', n + '. ' + label);
    d.innerHTML = '<span></span>'; d.firstChild.textContent = label;
    dots.appendChild(d); dotLinks.push(d);
  });

  function openMenu() { drawer.hidden = false; menuBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; }
  function closeMenu() { drawer.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  menuBtn.addEventListener('click', function () { drawer.hidden ? openMenu() : closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !drawer.hidden) { closeMenu(); menuBtn.focus(); } });

  /* ---------- current section tracking ---------- */
  var nowLabel = document.getElementById('nowLabel');
  var nowN = document.getElementById('nowN');
  var current = 0;
  var setCurrent = function (i) {
    if (i === current && nowN.textContent === String(i + 1)) return;
    current = i;
    nowLabel.textContent = slides[i].getAttribute('data-label');
    nowN.textContent = String(i + 1);
    dotLinks.forEach(function (d, k) { d.classList.toggle('on', k === i); });
    drawerLinks.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  };
  setCurrent(0);




  /* ---------- pecah teks jadi kata / huruf untuk animasi muncul bertahap ---------- */
  var wordSel = ['.eyebrow', '.lead', '.card h3', '.card p', '.callout', '.darkbox span', '.quote', '.blist li', '.nlist li', '.row h3', '.row p', '.step > span:last-child', '.step-note', '.refs li', '.stext h3', '.stext p', '.swot-note p', '.tbox h3', '.tbox p', '.tchip', '.mini b', '.mini-title', '.thanks-quote', '.thanks-by', '.authors'];
  var charSel = ['.shead h2', '.thanks-title'];
  function splitNode(node, mode, st) {
    var disp = window.getComputedStyle(node).display;
    if (/flex|grid/.test(disp) && Array.prototype.some.call(node.childNodes, function (n) { return n.nodeType === 3 && n.nodeValue.trim(); })) {
      var fw = document.createElement('span'); fw.className = 'fw';
      Array.prototype.slice.call(node.childNodes).forEach(function (n) { if (!(n.nodeType === 1 && n.classList.contains('qmark'))) fw.appendChild(n); });
      node.appendChild(fw); node = fw;
    }
    Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
      if (ch.nodeType === 3) {
        var parts = ch.nodeValue.split(/(\s+)/), frag = document.createDocumentFragment();
        parts.forEach(function (p) {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
          var w = document.createElement('span');
          if (mode === 'char') {
            w.className = 'nb';
            p.split('').forEach(function (chr) { var s = document.createElement('span'); s.className = 'sw ch'; s.textContent = chr; st.list.push(s); w.appendChild(s); });
          } else { w.className = 'sw'; w.textContent = p; st.list.push(w); }
          frag.appendChild(w);
        });
        node.replaceChild(frag, ch);
      } else if (ch.nodeType === 1 && ch.tagName !== 'IMG' && ch.tagName !== 'SVG') { splitNode(ch, mode, st); }
    });
  }
  if (!reduce) slides.forEach(function (s) {
    var groups = [];
    s.querySelectorAll(charSel.concat(wordSel).join(',')).forEach(function (el) {
      if (el.closest('.sw')) return;
      var isChar = el.matches(charSel.join(','));
      var st = { list: [] };
      el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
      splitNode(el, isChar ? 'char' : 'word', st);
      groups.push({ list: st.list, step: isChar ? 0.07 : 0.14 });
    });
    /* urutan dari atas ke bawah: blok berikutnya baru mulai setelah blok sebelumnya selesai */
    var t = 0.5, items = [];
    groups.forEach(function (g) {
      g.list.forEach(function (sp) { items.push([sp, t]); t += g.step; });
      t += 0.35;
    });
    var f = Math.min(1, 14 / Math.max(t, 1));
    items.forEach(function (it) { it[0].style.setProperty('--d', (it[1] * f).toFixed(3) + 's'); });
    /* elemen desain (kartu, ikon, kotak) tampil sedikit sebelum teks di dalamnya */
    var ri = 0;
    s.querySelectorAll('.reveal').forEach(function (el) {
      var first = el.querySelector('.sw'), rd;
      if (el.matches('.eyebrow, h2, .lead, .thanks-title, .thanks-quote, .thanks-by')) rd = 0;
      else if (first) rd = Math.max(0, parseFloat(first.style.getPropertyValue('--d')) - 0.6);
      else {
        var prev = 0.3;
        items.forEach(function (it) { if (it[0].compareDocumentPosition(el) & 4) prev = Math.max(prev, parseFloat(it[0].style.getPropertyValue('--d')) + 0.5); });
        rd = prev + ri * 0.05;
      }
      ri++;
      el.style.setProperty('--rd', rd.toFixed(3) + 's');
    });
  });

  /* ---------- panggung morph (mirip transisi Morph PowerPoint) ---------- */
  var stageEl = document.createElement('div'); stageEl.id = 'stage'; stageEl.setAttribute('aria-hidden', 'true');
  var keys = ['cover', 'navy', 'purple', 'pastel', 'gray2', 'gray', 'white', 'earth'], layers = {};
  keys.forEach(function (k) { var d = document.createElement('div'); d.className = 'bgl k-' + k; stageEl.appendChild(d); layers[k] = d; });
  var colors = ['#FFB800', '#22D3EE', '#FF5C7A', '#A78BFA'], orbs = [], rings = [];
  colors.forEach(function (c) { var o = document.createElement('div'); o.className = 'orb'; o.style.setProperty('--oc', c); stageEl.appendChild(o); orbs.push(o); });
  for (var q = 0; q < 2; q++) { var r = document.createElement('div'); r.className = 'ring'; stageEl.appendChild(r); rings.push(r); }
  document.body.insertBefore(stageEl, document.body.firstChild);
  function bgKey(s) {
    if (s.classList.contains('cover')) return 'cover';
    for (var k = 1; k < keys.length; k++) if (s.classList.contains('bg-' + keys[k])) return keys[k];
    return 'navy';
  }
  function stage(i) {
    var s = slides[i], t0 = i / 22 * Math.PI * 2 * 1.4, big = s.classList.contains('cover') ? 1.25 : 1;
    var key = bgKey(s);
    keys.forEach(function (k) { layers[k].classList.toggle('on', k === key); });
    stageEl.setAttribute('data-mode', s.classList.contains('light') ? 'light' : 'dark');
    orbs.forEach(function (o, k) {
      var cx = 50 + 46 * Math.cos(t0 * (1 + .25 * k) + k * 1.7), cy = 50 + 46 * Math.sin(t0 * (.8 + .2 * k) + k * 2.1);
      var d = (23 + 14 * (1 + Math.sin(t0 + k * 1.3)) / 2) * big, sc = d / 40;
      o.style.transform = 'translate(calc(' + cx + 'vw - 20vw), calc(' + cy + 'vh - 20vw)) scale(' + sc + ')';
    });
    rings.forEach(function (o, k) {
      var cx = 50 + 38 * Math.cos(t0 * .7 + k * 3.1 + .5), cy = 50 + 38 * Math.sin(t0 * .9 + k * 2.3);
      var d = 28 + 19 * (1 + Math.cos(t0 * 1.2 + k)) / 2, sc = d / 40;
      o.style.transform = 'translate(calc(' + cx + 'vw - 20vw), calc(' + cy + 'vh - 20vw)) scale(' + sc + ')';
    });
    slides.forEach(function (sl, k) {
      sl.classList.toggle('active', k === i);
      if (k === i) sl.classList.add('seen'); else if (Math.abs(k - i) > 1) sl.classList.remove('seen');
      if (k === i) sl.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
      else if (Math.abs(k - i) > 1) sl.querySelectorAll('.reveal').forEach(function (el) { el.classList.remove('in'); });
    });
  }
  stage(0);



  /* ---------- backsound otomatis di slide terakhir ---------- */
  var au = new Audio('assets/backsound-rihanna.mp3?v=4');
  au.loop = true;
  au.preload = 'auto';
  au.volume = 0;
  var wantSound = true, fadeT = null, lastIdx = slides.length - 1;

  function fade(to, ms, done) {
    clearInterval(fadeT);
    var from = au.volume, t0 = performance.now();
    fadeT = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / ms);
      au.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k >= 1) {
        clearInterval(fadeT);
        if (done) done();
      }
    }, 40);
  }

  function startSound() {
    if (!wantSound || !au.paused) return;
    var p = au.play();
    if (p && p.then) {
      p.then(function () { fade(0.6, 2500); })
       .catch(function () { /* Browser may require another user gesture; retry below. */ });
    }
  }

  function stopSound() {
    if (au.paused && au.volume === 0) return;
    fade(0, 2200, function () { au.pause(); });
  }

  function audioFor(i) {
    if (i === lastIdx) startSound();
    else stopSound();
  }

  /* Retry autoplay after a user gesture if the browser initially blocks playback. */
  ['pointerdown', 'keydown', 'touchend', 'wheel'].forEach(function (ev) {
    window.addEventListener(ev, function () {
      if (current === lastIdx && wantSound && au.paused) startSound();
    }, { passive: true });
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      au.pause();
    } else if (current === lastIdx && wantSound) {
      startSound();
    }
  });

  /* ---------- satu tautan per slide (#id) + salin tautan ---------- */
  var ids = {}; slides.forEach(function (s, i) { ids[s.id] = i; });
  var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast);
  var tt;
  function say(msg) { toast.textContent = msg; toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(function () { toast.classList.remove('show'); }, 2600); }
  function urlFor(id) { return location.href.split('#')[0] + '#' + id; }
  slides.forEach(function (s) {
    var f = s.querySelector('.sfoot'); if (!f) return;
    var b = document.createElement('button'); b.type = 'button'; b.className = 'copylink'; b.textContent = 'Salin tautan slide';
    b.setAttribute('aria-label', 'Salin tautan ke slide ' + s.getAttribute('data-label'));
    b.addEventListener('click', function () {
      var u = urlFor(s.id);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(u).then(function () { say('Tautan disalin: #' + s.id); }, function () { say(u); });
      } else { say(u); }
    });
    var last = f.lastElementChild;
    var wrap = document.createElement('span'); wrap.className = 'right';
    f.appendChild(wrap); wrap.appendChild(b); if (last && last.classList.contains('pg')) wrap.appendChild(last);
    if (last && last.classList.contains('scroll-cue')) wrap.appendChild(last);
  });
  var origSet = setCurrent;
  setCurrent = function (i) {
    var changed = i !== current;
    origSet(i);
    stage(i);
    audioFor(i);
    if (changed) { try { history.replaceState(null, '', '#' + slides[i].id); } catch (e) {} }
  };
  function goHash(smooth) {
    var id = (location.hash || '').slice(1);
    if (id in ids) slides[ids[id]].scrollIntoView({ behavior: smooth && !reduce ? 'smooth' : 'instant', block: 'start' });
  }
  window.addEventListener('hashchange', function () { goHash(true); });
  if (location.hash) { window.addEventListener('load', function () { goHash(false); }); goHash(false); }

  /* ---------- scroll: progress bar, current section, topbar, parallax ---------- */
  var bar = document.getElementById('progress');
  var topbar = document.querySelector('.topbar');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    var mid = y + window.innerHeight * 0.45, idx = 0;
    for (var i = 0; i < slides.length; i++) { if (slides[i].offsetTop <= mid) idx = i; }
    setCurrent(idx);
    if (y > lastY + 8 && y > 240) topbar.classList.add('hide');
    else if (y < lastY - 8 || y < 240) topbar.classList.remove('hide');
    lastY = y;
    if (!reduce) {
      var art = document.querySelector('.cover-art img');
      if (art && y < window.innerHeight) art.style.translate = '0 ' + (y * 0.12) + 'px';
      var hs = document.querySelector('.mark-handshake');
      if (hs) { var r = hs.getBoundingClientRect(); hs.style.setProperty('--px', (r.top * -0.03) + 'px'); }
    }
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- pointer spotlight + card tilt ---------- */
  if (fine && !reduce) {
    slides.forEach(function (s) {
      s.addEventListener('pointermove', function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        s.style.setProperty('--my', (e.clientY - r.top) + 'px');
        s.classList.add('hot');
      });
      s.addEventListener('pointerleave', function () { s.classList.remove('hot'); });
    });
    document.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        c.style.setProperty('--ty', (px * 6) + 'deg');
        c.style.setProperty('--tx', (py * -6) + 'deg');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--tx', '0deg'); c.style.setProperty('--ty', '0deg'); });
    });
  }


  /* ---------- roda mouse/trackpad: satu gulir = satu slide ---------- */
  var lastWheel = 0, lockUntil = 0;
  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || !drawer.hidden || Math.abs(e.deltaY) < 4 || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dir = e.deltaY > 0 ? 1 : -1, r = slides[current].getBoundingClientRect();
    if ((dir > 0 && r.bottom > window.innerHeight + 6) || (dir < 0 && r.top < -6)) return; /* slide lebih tinggi dari layar: gulir biasa */
    var now = Date.now(), gap = now - lastWheel; lastWheel = now;
    e.preventDefault();
    if (now < lockUntil || gap < 100) return; /* abaikan momentum trackpad */
    var to = Math.max(0, Math.min(slides.length - 1, current + dir));
    if (to === current) return;
    lockUntil = now + 900;
    slides[to].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }, { passive: false });

  /* ---------- keyboard: left/right arrows jump between sections ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || !drawer.hidden) return;
    var t = e.target && e.target.tagName;
    if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
    var to = null;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') to = Math.min(slides.length - 1, current + 1);
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') to = Math.max(0, current - 1);
    if (to !== null && to !== current) {
      e.preventDefault();
      slides[to].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  });
})();
