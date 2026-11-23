(function () {
  if (!window.matchMedia("(max-width: 767px)").matches) { initDesktop(); return; }
  var track = document.getElementById("track");
  /* mobile: niente seconda home (#menu), c'è l'hamburger */
  if (window.matchMedia("(max-width: 767px)").matches) {
    var m2 = document.getElementById("menu");
    if (m2) m2.parentNode.removeChild(m2);
    var hl = document.querySelector("#home a[href='#menu']");
    if (hl) hl.setAttribute("href", "#who");
    if (location.hash === "#menu") location.hash = "#who";
    /* sezioni raggruppate: il titolo (who/, how/ ...) resta fisso finché la sezione non finisce */
    (function () {
      var gs = [], by = {};
      Array.prototype.forEach.call(document.querySelectorAll(".panel"), function (p) {
        var s = p.getAttribute("data-section");
        if (s === "home" || s === "menu") return;
        if (!by[s]) { by[s] = []; gs.push(by[s]); }
        by[s].push(p.id);
      });
      return gs;
    })().forEach(function (g) {
      var first = document.getElementById(g[0]);
      if (!first) return;
      var wrap = document.createElement("div");
      wrap.className = "sec";
      first.parentNode.insertBefore(wrap, first);
      var lab = first.querySelector(".layer.blue .label");
      if (lab) wrap.appendChild(lab);
      g.forEach(function (id) { var p = document.getElementById(id); if (p) wrap.appendChild(p); });
    });
  }
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var idx = 0;
  var mq = window.matchMedia("(max-width: 767px)");
  var mobile = mq.matches;                     /* mobile: scorrimento verticale nativo */
  (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { location.reload(); });

  function clamp(n) { return Math.max(0, Math.min(panels.length - 1, n)); }
  function current() { return clamp(Math.round(track.scrollLeft / track.clientWidth)); }
  /* scorrimento animato: curva morbida, da sinistra a destra (e ritorno) */
  var raf = null, animating = false;
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }   /* easeInOutCubic */
  /* hamburger (mobile) */
  var burger = document.querySelector(".burger"), drawer = document.getElementById("drawer");
  function setDrawer(open) {
    document.documentElement.classList.toggle("drawer-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) drawer.removeAttribute("inert"); else drawer.setAttribute("inert", "");
  }
  function markNav(i) {
    var sec = panels[i].getAttribute("data-section");
    Array.prototype.forEach.call(drawer.querySelectorAll("a"), function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + sec);
    });
  }
  burger.addEventListener("click", function () { setDrawer(!document.documentElement.classList.contains("drawer-open")); });
  window.addEventListener("keydown", function (e) { if (e.key === "Escape") setDrawer(false); });
  drawer.addEventListener("click", function (e) { if (e.target.closest("a")) setDrawer(false); });

  function topOf(el) { return el.getBoundingClientRect().top - track.getBoundingClientRect().top + track.scrollTop; }
  function remPx() { return parseFloat(getComputedStyle(document.documentElement).fontSize); }
  function stickBottom() {
    var l = document.querySelector(".sec > .label");
    return remPx() * 6.75 + (l ? l.offsetHeight : 0);
  }
  /* dove portare lo scorrimento: titolo fisso subito sotto la fascia blu */
  function mobileTarget(i) {
    var p = panels[i];
    if (p.id === "home") return 0;
    var lab = p.parentNode && p.parentNode.classList.contains("sec") && p === p.parentNode.querySelector(".panel") ? p.parentNode.querySelector(".label") : null;
    if (lab) return topOf(p.parentNode) - remPx() * 6.75;
    return topOf(p) - stickBottom();
  }
  function bandH() { return parseFloat(getComputedStyle(document.documentElement).fontSize) * 10.625; }
  function onHome(i) { document.documentElement.classList.toggle("on-home", panels[i].id === "home"); }
  function setActive(i) {
    markNav(i);
    onHome(i);
    panels.forEach(function (p, n) { p.classList.toggle("is-active", n === i); });
    if (history.replaceState) history.replaceState(null, "", "#" + hashId(i));
  }
  function go(i, instant) {
    if (mobile) {
      idx = clamp(i);
      track.scrollTo({ top: mobileTarget(idx), behavior: instant || reduce ? "auto" : "smooth" });
      if (instant) setActive(idx);
      return;
    }
    idx = clamp(i);
    var to = idx * track.clientWidth;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
    if (instant || reduce) {
      track.style.scrollSnapType = "none";
      track.scrollLeft = to;
      track.style.scrollSnapType = "";
      animating = false;
      setActive(idx);
      return;
    }
    var from = track.scrollLeft, dist = to - from;
    if (Math.abs(dist) < 1) { animating = false; setActive(idx); return; }
    var dur = Math.min(1500, 900 + 150 * (Math.abs(dist) / track.clientWidth - 1));   /* 0,9 s per un passo, fino a 1,5 s */
    var t0 = null;
    animating = true;
    track.style.scrollSnapType = "none";          /* lo snap non deve interferire con l'animazione */
    function step(now) {
      if (t0 === null) t0 = now;
      var p = Math.min(1, (now - t0) / dur);
      track.scrollLeft = from + dist * ease(p);
      if (p < 1) { raf = requestAnimationFrame(step); return; }
      raf = null;
      animating = false;
      track.style.scrollSnapType = "";
      setActive(idx);
    }
    raf = requestAnimationFrame(step);
  }
  /* passaggio in dissolvenza (senza scorrimento) */
  function goFade(i) {
    if (reduce || !document.startViewTransition) { go(i); return; }
    document.startViewTransition(function () { go(i, true); });
  }
  function indexOfId(id) {
    for (var i = 0; i < panels.length; i++) if (panels[i].id === id) return i;
    return -1;
  }

  /* pagina team: scorre solo la parte chiara, la parte blu resta ferma */
  var teamIds = (function () { var n = document.querySelectorAll("#team .team-slide").length, a = ["team"], k; for (k = 2; k <= n; k++) a.push("team-" + k); return a; })();
  var teamPanel = indexOfId("team");
  var teamEl = panels[teamPanel];
  var slides = Array.prototype.slice.call(teamEl.querySelectorAll(".team-slide"));
  var dotEls = Array.prototype.slice.call(teamEl.querySelectorAll(".team-dots .dot"));
  var slide = 0;
  function hashId(i) { return i === teamPanel ? teamIds[slide] : panels[i].id; }
  function setSlide(n, instant) {
    slide = Math.max(0, Math.min(slides.length - 1, n));
    var rows = teamEl.querySelector(".team-slides");
    if (instant || reduce) {
      rows.style.transition = "none";
      teamEl.style.setProperty("--i", slide);
      void rows.offsetWidth;
      rows.style.transition = "";
    } else {
      teamEl.style.setProperty("--i", slide);
    }
    slides.forEach(function (el, k) {
      if (k === slide) { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
      else { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
    });
    dotEls.forEach(function (d, k) { d.classList.toggle("on", k === slide); });
    if (idx === teamPanel && history.replaceState) history.replaceState(null, "", "#" + teamIds[slide]);
  }
  function scrollToSlide(n, instant) {
    var el = slides[Math.max(0, Math.min(slides.length - 1, n))];
    var top = topOf(el) - stickBottom();
    track.scrollTo({ top: top, behavior: instant || reduce ? "auto" : "smooth" });
  }
  function openTeam(n) {
    if (mobile) { if (n === 0) go(teamPanel); else scrollToSlide(n); return; }
    if (idx === teamPanel && !animating) { setSlide(n); return; }
    setSlide(n, true);
    go(teamPanel);
  }
  /* un passo avanti/indietro: dentro "team" cambia persona, altrove cambia pagina */
  function stepBy(dir) {
    var base = animating ? idx : current();
    if (base === teamPanel) {
      if (dir > 0 && slide < slides.length - 1) { setSlide(slide + 1); return; }
      if (dir < 0 && slide > 0) { setSlide(slide - 1); return; }
    }
    var target = clamp(base + dir);
    if (target === teamPanel && base !== teamPanel) setSlide(dir > 0 ? 0 : slides.length - 1, true);
    go(target);
  }

  /* rotella / trackpad: un passo per gesto; l'inversione di direzione vale subito come nuovo gesto */
  var accepted = false, wheelTimer = null, lockUntil = 0, lastDir = 0;
  track.addEventListener("wheel", function (e) {
    if (mobile) return;
    e.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(function () { accepted = false; }, 140);
    var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 8) return;
    var dir = d > 0 ? 1 : -1, now = Date.now();
    var reversed = lastDir !== 0 && dir !== lastDir;
    if (!reversed && (accepted || now < lockUntil)) return;
    accepted = true;
    lastDir = dir;
    lockUntil = now + 950;
    stepBy(dir);
  }, { passive: false });

  /* tastiera */
  window.addEventListener("keydown", function (e) {
    if (mobile) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target && e.target.tagName;
    if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
    var k = e.key, step = 0;
    if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey)) step = 1;
    else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) step = -1;
    else if (k === "Home") { e.preventDefault(); go(0); return; }
    else if (k === "End") { e.preventDefault(); go(panels.length - 1); return; }
    if (!step) return;
    e.preventDefault();
    stepBy(step);
  });

  /* ancore: ogni sezione ha un proprio URL (#who, #how, #for, #where ...) */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href^='#']");
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    if (!id) { e.preventDefault(); return; }
    var ti = teamIds.indexOf(id);
    if (ti >= 0) { e.preventDefault(); openTeam(ti); return; }
    var i = indexOfId(id);
    if (i < 0) return;
    e.preventDefault();
    go(i);
  });
  window.addEventListener("hashchange", function () {
    var th = teamIds.indexOf(location.hash.slice(1));
    if (th >= 0) { openTeam(th); return; }
    var i = indexOfId(location.hash.slice(1));
    if (i >= 0 && i !== idx) go(i);
  });

  /* pannello attivo + hash */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting || animating) return;
      panels.forEach(function (p) { p.classList.toggle("is-active", p === en.target); });
      idx = panels.indexOf(en.target);
      markNav(idx);
      onHome(idx);
      if (history.replaceState) history.replaceState(null, "", "#" + hashId(idx));
    });
  }, mobile ? { root: track, rootMargin: "-50% 0px -50% 0px", threshold: 0 } : { root: track, threshold: 0.6 });
  panels.forEach(function (p) { io.observe(p); });

  window.addEventListener("resize", function () { if (!mobile) go(idx, true); });

  var startTeam = teamIds.indexOf(location.hash.slice(1));
  if (mobile) slides.forEach(function (el) { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); });
  if (startTeam >= 0 && !mobile) setSlide(startTeam, true);
  var start = startTeam >= 0 ? teamPanel : indexOfId(location.hash.slice(1));
  go(start >= 0 ? start : 0, true);
  if (mobile && startTeam > 0) scrollToSlide(startTeam, true);
  /* il browser applica lo scorrimento nativo dell'ancora dopo il caricamento: lo ripeto con la mia posizione */
  if (mobile) window.addEventListener("load", function () {
    setTimeout(function () {
      go(start >= 0 ? start : 0, true);
      if (startTeam > 0) scrollToSlide(startTeam, true);
    }, 0);
  });

  /* home: dopo un tempo predefinito passa da sola al menu, se l'utente non ha ancora fatto nulla */
  var HOME_DELAY = 2000;   /* millisecondi */
  if (idx === 0) {
    var auto = setTimeout(function () { if (idx === 0) goFade(1); }, HOME_DELAY);
    ["wheel", "keydown", "click", "touchstart", "hashchange"].forEach(function (ev) {
      window.addEventListener(ev, function () { clearTimeout(auto); }, { once: true, passive: true });
    });
  }

  /* =====================================================================
     DESKTOP: da "who" in poi la parte blu resta ferma, scorre solo la parte chiara
     ===================================================================== */
  function initDesktop() {
    var track = document.getElementById("track");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mq = window.matchMedia("(max-width: 767px)");
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { location.reload(); });
    var byId = function (id) { return document.getElementById(id); };

    /* 1. costruisco un'unica scena con le sezioni who, team, how, for, where */
    var order = Array.prototype.map.call(document.querySelectorAll(".panel"), function (p) { return p.id; }).filter(function (i) { return i !== "home" && i !== "menu"; });
    var teamIds = (function () { var n = document.querySelectorAll("#team .team-slide").length, a = ["team"], k; for (k = 2; k <= n; k++) a.push("team-" + k); return a; })();
    var stage = byId(order[0]);
    var blue = stage.querySelector(".layer.blue"), cream = stage.querySelector(".layer.cream");
    var strip = document.createElement("div");
    strip.className = "team-slides stage-slides";
    var slides = [], texKeys = [], teamDots = null;
    function isChrome(el) { return el.getAttribute("aria-hidden") === "true"; }
    function wrap(children) {
      var w = document.createElement("div");
      w.className = "team-slide stage-slide";
      children.forEach(function (c) { w.appendChild(c); });
      return w;
    }
    order.forEach(function (pid) {
      var p = byId(pid);
      var title = p.querySelector(".layer.blue .label").textContent.trim();
      var section = p.getAttribute("data-section");
      var cr = p.querySelector(".layer.cream");
      var kids = Array.prototype.slice.call(cr.children).filter(function (c) { return !isChrome(c); });
      if (texKeys.indexOf(pid) < 0) texKeys.push(pid);
      if (pid === "team") {
        var tds = cr.querySelector(".team-dots");
        if (tds) { teamDots = tds; tds.classList.remove("reveal"); }
        var ts = Array.prototype.slice.call(cr.querySelectorAll(".team-slide"));
        ts.forEach(function (el, k) {
          el.classList.add("stage-slide");
          strip.appendChild(el);
          slides.push({ id: teamIds[k], section: section, title: title, tex: pid, el: el, team: true });
        });
      } else {
        var rest = kids;
        var el = wrap(rest);
        strip.appendChild(el);
        slides.push({ id: pid, section: section, title: title, tex: pid, el: el, team: false });
      }
    });
    order.slice(1).forEach(function (pid) { var p = byId(pid); if (p && p.parentNode) p.parentNode.removeChild(p); });
    /* i contenuti di who sono già stati spostati: ripulisco il livello chiaro */
    Array.prototype.slice.call(cream.children).forEach(function (c) { if (!isChrome(c)) cream.removeChild(c); });
    cream.appendChild(strip);
    if (teamDots) cream.appendChild(teamDots);
    stage.id = "stage";
    stage.classList.add("panel-stage");
    var S = slides.length;
    stage.style.setProperty("--n", S);
    strip.style.width = (S * 100) + "%";
    slides.forEach(function (sl) { sl.el.style.flex = "0 0 " + (100 / S) + "%"; });

    /* texture: una per sezione, in dissolvenza */
    var texes = {};
    texKeys.forEach(function (k) {
      var t = document.createElement("div");
      t.className = "tex";
      t.style.backgroundImage = 'url("assets/thin-pattern-' + k + '.png")';
      stage.insertBefore(t, stage.firstChild);
      texes[k] = t;
    });

    var labels = Array.prototype.slice.call(stage.querySelectorAll(".label"));
    var menuLinks = Array.prototype.slice.call(stage.querySelectorAll(".menu a"));
    var dotEls = teamDots ? Array.prototype.slice.call(teamDots.querySelectorAll(".dot")) : [];

    /* 2. posizioni: 0 home, 1 menu, 2.. le diapositive della scena */
    var panels = [byId("home"), byId("menu"), stage];
    var posIds = ["home", "menu"].concat(slides.map(function (s) { return s.id; }));
    var last = posIds.length - 1;
    var pos = 0, animating = false, raf = null, curTitle = null, curSlide = -1, tfPending = null, tfTimer = null;
    function clampPos(n) { return Math.max(0, Math.min(last, n)); }
    function panelOf(p) { return p < 2 ? p : 2; }
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function trackPanel() { return Math.max(0, Math.min(2, Math.round(track.scrollLeft / track.clientWidth))); }

    function setTitle(t, instant) {
      if (t === curTitle) return;
      var first = curTitle === null;
      curTitle = t;
      if (instant || first || reduce) { labels.forEach(function (l) { l.textContent = t; l.style.opacity = ""; l.style.translate = ""; l.style.transition = ""; }); return; }
      labels.forEach(function (l) { l.style.transition = "opacity 0.35s ease"; l.style.opacity = "0"; });
      setTimeout(function () {
        labels.forEach(function (l) {
          l.textContent = t;
          l.style.transition = "none"; l.style.translate = "-1.5rem 0"; void l.offsetWidth;
          l.style.transition = "opacity 0.7s ease, translate 0.7s ease"; l.style.opacity = "1"; l.style.translate = "0 0";
        });
      }, 380);
    }
    var pager = document.createElement("nav");
    pager.className = "pager"; pager.setAttribute("aria-label", "Previous / next");
    pager.innerHTML = '<button type="button" class="pg-prev"><i>&lsaquo;</i><span>prev</span></button><button type="button" class="pg-next"><span>next</span><i>&rsaquo;</i></button>';
    stage.appendChild(pager);
    var counter = document.createElement("div");
    counter.className = "counter";
    counter.innerHTML = '<button type="button" class="ct-prev" aria-label="Previous"><svg viewBox="0 0 24 48" aria-hidden="true"><path d="M18 2 L4 24 L18 46"/></svg></button><span class="ct-num"></span><button type="button" class="ct-next" aria-label="Next"><svg viewBox="0 0 24 48" aria-hidden="true"><path d="M6 2 L20 24 L6 46"/></svg></button>';
    stage.appendChild(counter);
    var ctPrev = counter.querySelector(".ct-prev"), ctNext = counter.querySelector(".ct-next"), ctNum = counter.querySelector(".ct-num");
    function grp(s) { return s.section; }
    function grpRange(n) {
      var g = grp(slides[n]), a = n, b = n;
      while (a > 0 && grp(slides[a - 1]) === g) a--;
      while (b < S - 1 && grp(slides[b + 1]) === g) b++;
      return [a, b];
    }
    function updCounter(n) {
      var r = grpRange(n), size = r[1] - r[0] + 1;
      counter.classList.toggle("on", size > 1);
      if (size < 2) return;
      var cur = n - r[0] + 1, hasTeam = false, k;
      for (k = r[0]; k <= r[1]; k++) if (slides[k].team) hasTeam = true;
      if (!window.matchMedia("(min-width: 1400px) and (min-height: 800px)").matches) hasTeam = false;
      ctNum.classList.toggle("names", hasTeam); counter.classList.toggle("names-mode", hasTeam); counter.classList.toggle("on-team", hasTeam && !!slides[n].team);
      if (hasTeam) {
        var h = "";
        for (k = r[0]; k <= r[1]; k++) {
          if (!slides[k].team) continue;
          var nm = slides[k].team ? slides[k].el.querySelector("h2").textContent.trim().split(/\s+/).slice(1).join(" ") : slides[k].title;
          if (h) h += '<span class="ct-sep" aria-hidden="true">/</span>';
          h += '<button type="button" class="ct-name' + (k === n ? " on" : "") + '" data-n="' + k + '">' + nm + "</button>";
        }
        ctNum.innerHTML = h;
      } else {
        ctNum.innerHTML = "<b>" + (cur < 10 ? "0" : "") + cur + "</b> / " + (size < 10 ? "0" : "") + size;
      }
      ctPrev.disabled = n <= r[0]; ctNext.disabled = n >= r[1];
    }
    /* nelle schede del team il contatore sta alla stessa altezza del telefono */
    function alignCounter() {
      counter.style.top = "";
      return; /* altezza fissa come nella prima schermata */
      if (!stage.classList.contains("in-team")) return;
      var tel = null, k;
      for (k = 0; k < slides.length; k++) {
        if (!slides[k].el.hasAttribute("inert")) { tel = slides[k].el.querySelector(".team-side p"); break; }
      }
      if (!tel) return;
      var rs = stage.getBoundingClientRect(), rt = tel.getBoundingClientRect(), rc = counter.getBoundingClientRect();
      var lines = tel.getClientRects ? 1 : 1;
      var lh = parseFloat(getComputedStyle(tel).lineHeight) || rt.height / 2;
      var phoneCenter = rt.bottom - lh / 2;
      counter.style.top = Math.round(phoneCenter - rs.top - rc.height / 2) + "px";
    }
    window.addEventListener("resize", alignCounter);
    var wideNow = window.matchMedia("(min-width: 1400px) and (min-height: 800px)").matches;
    window.addEventListener("resize", function () {
      var w = window.matchMedia("(min-width: 1400px) and (min-height: 800px)").matches;
      if (w !== wideNow) { wideNow = w; if (curSlide >= 0) updCounter(curSlide); }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(alignCounter);
    ctNum.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".ct-name");
      if (b) goPos(parseInt(b.getAttribute("data-n"), 10) + 2);
    });
    ctPrev.addEventListener("click", function () { goPos(pos - 1); });
    ctNext.addEventListener("click", function () { goPos(pos + 1); });
    var pgPrev = pager.querySelector(".pg-prev"), pgNext = pager.querySelector(".pg-next");
    /* prev/next saltano tra sezioni principali (who, how, for, where) */
    function secStarts() {
      var st = [];
      slides.forEach(function (s, k) { if (k === 0 || s.section !== slides[k - 1].section) st.push(k); });
      return st;
    }
    function secIndex() {
      var st = secStarts(), cur = Math.max(0, Math.min(S - 1, pos - 2)), si = 0;
      st.forEach(function (k, i) { if (k <= cur) si = i; });
      return si;
    }
    pgPrev.addEventListener("click", function () {
      var st = secStarts(), si = secIndex(), cur = pos - 2;
      if (cur > st[si]) goPos(st[si] + 2);
      else if (si > 0) goPos(st[si - 1] + 2);
    });
    pgNext.addEventListener("click", function () {
      var st = secStarts(), si = secIndex();
      if (si < st.length - 1) goPos(st[si + 1] + 2);
    });
    function setSlide(n, instant) {
      n = Math.max(0, Math.min(S - 1, n));
      var sl = slides[n];
      if (tfPending) tfPending();
      var teamFade = !instant && !reduce && curSlide >= 0 && curSlide !== n && slides[curSlide].section === sl.section && slides[curSlide].team === sl.team;   /* stessa sezione (team→team, how→how): dissolvenza */
      function jump() {
        strip.style.transition = "none";
        stage.style.setProperty("--i", n);
        void strip.offsetWidth;
        strip.style.transition = "";
      }
      if (teamFade) {
        /* tra una persona e l'altra: dissolvenza invece di scorrimento */
        var oldEl = slides[curSlide].el, newEl = sl.el, back = n < curSlide;   /* › verso destra, ‹ verso sinistra */
        oldEl.classList.add("tf-out");
        var done = false;
        tfPending = function () {
          if (done) return; done = true; clearTimeout(tfTimer); tfPending = null;
          jump(); oldEl.classList.remove("tf-out");
          newEl.classList.remove("tf-in", "tf-back"); void newEl.offsetWidth; newEl.classList.add("tf-in"); if (back) newEl.classList.add("tf-back");
          setTimeout(function () { newEl.classList.remove("tf-in", "tf-back"); }, 1150);
        };
        tfTimer = setTimeout(tfPending, 600);
      } else if (instant || reduce) {
        jump();
      } else {
        stage.style.setProperty("--i", n);
      }
      slides.forEach(function (o, k) {
        if (k === n) { o.el.removeAttribute("inert"); o.el.removeAttribute("aria-hidden"); }
        else { o.el.setAttribute("inert", ""); o.el.setAttribute("aria-hidden", "true"); }
      });
      stage.classList.toggle("in-team", sl.team);
      updCounter(n);
      alignCounter();
      dotEls.forEach(function (d, k) { d.classList.toggle("on", slides[n].team && k === n - slides.findIndex(function (x) { return x.team; })); });
      Object.keys(texes).forEach(function (k) { texes[k].classList.toggle("on", k === sl.tex); });
      menuLinks.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + sl.section;
        a.classList.toggle("active", on);
        if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      setTitle(sl.title, instant);
      curSlide = n;
    }
    function setActivePanel() {
      var pi = panelOf(pos);
      pgPrev.disabled = pos < 2 || (secIndex() === 0 && pos - 2 <= secStarts()[0]); pgNext.disabled = pos < 2 || secIndex() >= secStarts().length - 1;
      panels.forEach(function (p, k) { p.classList.toggle("is-active", k === pi); });
      if (pi < 2) Object.keys(texes).forEach(function (k) { texes[k].classList.remove("on"); });
      else texes[slides[curSlide].tex].classList.add("on");
      if (history.replaceState) history.replaceState(null, "", "#" + posIds[pos]);
    }
    function scrollTrack(pi, instant) {
      var to = pi * track.clientWidth;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (instant || reduce) {
        track.style.scrollSnapType = "none";
        track.scrollLeft = to;
        track.style.scrollSnapType = "";
        animating = false;
        return;
      }
      var from = track.scrollLeft, dist = to - from;
      if (Math.abs(dist) < 1) { animating = false; return; }
      var dur = Math.min(1500, 900 + 150 * (Math.abs(dist) / track.clientWidth - 1));
      var t0 = null;
      animating = true;
      track.style.scrollSnapType = "none";
      function step(now) {
        if (t0 === null) t0 = now;
        var p = Math.min(1, (now - t0) / dur);
        track.scrollLeft = from + dist * ease(p);
        if (p < 1) { raf = requestAnimationFrame(step); return; }
        raf = null; animating = false;
        track.style.scrollSnapType = "";
      }
      raf = requestAnimationFrame(step);
    }
    function goPos(p, instant) {
      p = clampPos(p);
      var enteringStage = p >= 2 && (trackPanel() < 2 || animating && panelOf(pos) < 2);
      pos = p;
      if (p >= 2) setSlide(p - 2, instant || enteringStage);
      setActivePanel();
      scrollTrack(panelOf(p), instant);
    }
    function goFade(p) {
      if (reduce || !document.startViewTransition) { goPos(p); return; }
      document.startViewTransition(function () { goPos(p, true); });
    }
    function posOf(id) { return posIds.indexOf(id); }

    /* rotella / trackpad: un passo per gesto */
    var accepted = false, wheelTimer = null, lockUntil = 0, lastDir = 0;
    track.addEventListener("wheel", function (e) {
      e.preventDefault();
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { accepted = false; }, 140);
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (Math.abs(d) < 8) return;
      var dir = d > 0 ? 1 : -1, now = Date.now();
      var reversed = lastDir !== 0 && dir !== lastDir;
      if (!reversed && (accepted || now < lockUntil)) return;
      accepted = true; lastDir = dir; lockUntil = now + 950;
      goPos(pos + dir);
    }, { passive: false });

    window.addEventListener("keydown", function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target && e.target.tagName;
      if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT") return;
      var k = e.key, step = 0;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey)) step = 1;
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey)) step = -1;
      else if (k === "Home") { e.preventDefault(); goPos(0); return; }
      else if (k === "End") { e.preventDefault(); goPos(last); return; }
      if (!step) return;
      e.preventDefault();
      goPos(pos + step);
    });

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href^='#']");
      if (!a) return;
      var id = a.getAttribute("href").slice(1);
      if (!id) { e.preventDefault(); return; }
      var p = posOf(id);
      if (p < 0) return;
      e.preventDefault();
      goPos(p);
    });
    window.addEventListener("hashchange", function () {
      var p = posOf(location.hash.slice(1));
      if (p >= 0 && p !== pos) goPos(p);
    });
    window.addEventListener("resize", function () { scrollTrack(panelOf(pos), true); });

    var start = posOf(location.hash.slice(1));
    if (start < 0) start = 0;
    if (start < 2) setSlide(0, true);
    goPos(start, true);

    /* home: dopo 2 secondi passa da sola al menu, se l'utente non ha ancora fatto nulla */
    var HOME_DELAY = 2000;
    if (pos === 0) {
      var auto = setTimeout(function () { if (pos === 0) goFade(1); }, HOME_DELAY);
      ["wheel", "keydown", "click", "touchstart", "hashchange"].forEach(function (ev) {
        window.addEventListener(ev, function () { clearTimeout(auto); }, { once: true, passive: true });
      });
    }
  }
})();
