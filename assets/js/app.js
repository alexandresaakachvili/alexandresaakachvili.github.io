(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  if (coarse) document.documentElement.classList.add("is-coarse");
  var hasGSAP = typeof window.gsap !== "undefined";
  var lenis = null;

  var Cursor = {
    enabled: false,
    dot: null,
    ring: null,
    svg: null,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    moved: false
  };

  var Hover = {
    listeners: [],
    pending: false,
    on: function (fn) { Hover.listeners.push(fn); },
    test: function () {
      if (!Cursor.moved || !Hover.listeners.length) return;
      var el = document.elementFromPoint(Cursor.x, Cursor.y);
      for (var i = 0; i < Hover.listeners.length; i++) Hover.listeners[i](el);
    },
    schedule: function () {
      if (Hover.pending) return;
      Hover.pending = true;
      requestAnimationFrame(function () { Hover.pending = false; Hover.test(); });
    }
  };
  window.addEventListener("scroll", Hover.schedule, { passive: true });
  window.addEventListener("mousemove", Hover.schedule, { passive: true });
  document.addEventListener("click", function () {
    Hover.schedule();
    setTimeout(Hover.schedule, 250);
    setTimeout(Hover.schedule, 600);
  });

  function initPreloader() {
    var el = document.querySelector("[data-preloader]");
    if (!el) return;

    if (document.documentElement.classList.contains("no-preloader")) { el.remove(); return; }
    var count = el.querySelector("[data-preloader-count]");
    var bar = el.querySelector("[data-preloader-bar]");
    var pct = 0, done = false;

    function finish() {
      if (done) return;
      done = true;
      if (count) count.textContent = "100";
      if (bar) bar.style.width = "100%";
      setTimeout(function () {
        el.classList.add("is-done");
        setTimeout(function () { el.remove(); }, 900);
      }, 180);
    }

    var timer = setInterval(function () {
      pct += Math.random() * 18 + 6;
      if (pct >= 96) pct = 96;
      if (count) count.textContent = String(Math.floor(pct));
      if (bar) bar.style.width = pct + "%";
    }, 120);

    function ready() { clearInterval(timer); finish(); }

    if (document.readyState === "complete") setTimeout(ready, 280);
    else window.addEventListener("load", function () { setTimeout(ready, 220); });
    setTimeout(ready, 3400);
  }

  function initSmoothScroll() {
    if (reduced || typeof window.Lenis === "undefined") return;
    lenis = new window.Lenis({
      duration: 1.1,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true,
      touchMultiplier: 1.6
    });
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function initReveals() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var delay = parseFloat(el.dataset.revealDelay || "0");
        setTimeout(function () { el.classList.add("is-in"); }, delay * 1000);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0 });

    // Ce qui est déjà à l'écran apparaît sans attendre l'observateur — aussi après un saut d'ancre (retour sur la carte d'un projet), que le navigateur fait parfois après le chargement.
    function revealVisible() {
      items.forEach(function (el) {
        if (el.classList.contains("is-in") || el.dataset.revealPending) return;
        var r = el.getBoundingClientRect();
        if (r.top >= window.innerHeight || r.bottom <= 0) return;
        el.dataset.revealPending = "1";
        var delay = parseFloat(el.dataset.revealDelayLoad || el.dataset.revealDelay || "0");
        setTimeout(function () { el.classList.add("is-in"); }, delay * 1000);
        io.unobserve(el);
      });
    }
    items.forEach(function (el) { io.observe(el); });
    revealVisible();
    window.addEventListener("load", revealVisible);
    window.addEventListener("hashchange", revealVisible);

    function finDePage() {
      if (window.innerHeight + window.scrollY < document.documentElement.scrollHeight - 4) return;
      items.forEach(function (el) {
        if (el.classList.contains("is-in")) return;
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }
    window.addEventListener("scroll", finDePage, { passive: true });
  }

  function applyStagger() {
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var step = parseFloat(group.dataset.stagger) || 0.07;

      var rows = [];
      var rowTop = null;
      Array.prototype.forEach.call(group.children, function (el) {
        var top = el.offsetTop;
        if (rowTop === null || Math.abs(top - rowTop) > 4) { rowTop = top; rows.push([]); }
        rows[rows.length - 1].push(el);
      });

      var cols = rows.length ? rows[0].length : 1;
      var rowSpan = cols * step + 0.1;

      rows.forEach(function (row, r) {
        row.forEach(function (el, c) {
          el.dataset.revealDelay = (c * step).toFixed(3);
          el.dataset.revealDelayLoad = (r * rowSpan + c * step).toFixed(3);
        });
      });
    });
  }

  function initParallax() {
    if (reduced || !hasGSAP || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    document.querySelectorAll(".media-parallax img").forEach(function (img) {
      var box = img.closest(".media-parallax") || img.parentElement;
      window.gsap.fromTo(img,
        { yPercent: -7, scale: 1.14 },
        {
          yPercent: 7, scale: 1.14, ease: "none",
          scrollTrigger: { trigger: box, start: "top bottom", end: "bottom top", scrub: true }
        }
      );
    });
  }

  function initBrand() {
    if (reduced || coarse) return;
    document.querySelectorAll(".brand__name").forEach(function (el) {
      var text = el.textContent;
      if (!text) return;
      el.textContent = "";

      var i = 0;
      text.split(" ").forEach(function (word, w) {
        if (w) { el.appendChild(document.createTextNode(" ")); i++; }
        var box = document.createElement("span");
        box.className = "brand__word";
        for (var c = 0; c < word.length; c++, i++) {
          var s = document.createElement("span");
          s.textContent = word.charAt(c);
          s.style.setProperty("--i", i);
          box.appendChild(s);
        }
        el.appendChild(box);
      });
    });
  }

  var ICONS = {
    home: '<path d="M3 10.8 12 3.6l9 7.2V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z"/>',
    view: '<path d="M1.7 12S5.7 5.3 12 5.3 22.3 12 22.3 12 18.3 18.7 12 18.7 1.7 12 1.7 12z"/><circle cx="12" cy="12" r="3.3"/>',
    play: '<path class="solid" d="M8.5 5.2v13.6L19.4 12z"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M15 5.5v-1A1.5 1.5 0 0 0 13.5 3H4.5A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15h1"/>',
    external: '<path class="sq" d="M5 19 15 9"/><path class="sq" d="M8 5.5h10.5V16"/>',
    close: '<path d="m6.5 6.5 11 11"/><path d="m17.5 6.5-11 11"/>',
    top: '<path class="sq" d="M12 21.5V8.5"/><path class="sq" d="M4.5 12.5 12 5l7.5 7.5"/>',
    trophy: '<path d="M7.5 4h9v3.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H5a2.5 2.5 0 0 0 2.6 3.4"/><path d="M16.5 6H19a2.5 2.5 0 0 1-2.6 3.4"/><path d="M12 12v3.2"/><path d="M9.2 19.5h5.6"/><path d="M10 15.2h4v4.3h-4z"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    secret: '<path d="M9.2 9.3a2.9 2.9 0 0 1 5.6.7c0 1.9-2.8 2.3-2.8 4.3"/><path d="M12 17.6v.1"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><path d="M8.3 16.5 12 7l3.7 9.5"/><path d="M7.6 12.6h8.8"/><path d="M7 15h10"/>',
    key: '<circle cx="7.5" cy="15.5" r="4"/><path d="M10.4 12.6 20.5 2.5"/><path d="m17 6 3 3"/><path d="m14 9 2.5 2.5"/>',
    podium: '<path d="M9 20V7.5h6V20"/><path d="M15 20v-8h6v8"/><path d="M3 20v-5h6v5"/><path d="M2 20h20"/>',
    coins: '<ellipse cx="12" cy="6.5" rx="7" ry="2.6"/><path d="M5 6.5v3.6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6.5"/><path d="M5 10.1v3.6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-3.6"/><path d="M5 13.7v3.6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-3.6"/>',
    swear: '<path d="M4 5.2h16a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H9.6l-4.2 3.6v-3.6H4a1.8 1.8 0 0 1-1.8-1.8V7A1.8 1.8 0 0 1 4 5.2z"/>'
  };

  function placeDot(x, y) {
    Cursor.dot.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%)";
  }

  function initCursor() {
    if (coarse || reduced) return;
    Cursor.enabled = true;
    document.documentElement.classList.add("has-custom-cursor");

    Cursor.dot = document.createElement("div");
    Cursor.dot.className = "cursor";
    Cursor.ring = document.createElement("div");
    Cursor.ring.className = "cursor-ring";
    Cursor.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    Cursor.svg.setAttribute("viewBox", "0 0 24 24");
    Cursor.svg.setAttribute("aria-hidden", "true");
    Cursor.ring.appendChild(Cursor.svg);

    document.documentElement.appendChild(Cursor.dot);
    document.documentElement.appendChild(Cursor.ring);

    try {
      var last = sessionStorage.getItem("as-cursor");
      if (last) {
        var parts = last.split(",");
        var lx = parseFloat(parts[0]);
        var ly = parseFloat(parts[1]);
        if (lx >= 0 && ly >= 0 && lx <= window.innerWidth && ly <= window.innerHeight) {
          Cursor.x = lx; Cursor.y = ly; Cursor.moved = true;
        }
      }
    } catch (e) {  }

    var rx = Cursor.x, ry = Cursor.y;
    placeDot(Cursor.x, Cursor.y);
    Cursor.ring.style.transform =
      "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";

    var shown = false;
    Cursor.dot.style.opacity = "0";
    Cursor.ring.style.opacity = "0";
    function revealCursor() {
      if (shown) return;
      shown = true;
      Cursor.dot.style.opacity = "";
      Cursor.ring.style.opacity = "";
    }

    setTimeout(revealCursor, 420);
    var targets = "a, button, [data-cursor]";
    var current = null;

    function setHover(t) {
      if (t === current) return;
      current = t;
      if (!t) { document.documentElement.classList.remove("cursor-hover"); return; }
      var kind = t.dataset.cursor ||
        (t.tagName === "A" && t.host && t.host !== window.location.host ? "external" : "view");
      Cursor.svg.innerHTML = ICONS[kind] || ICONS.view;
      document.documentElement.classList.add("cursor-hover");
    }

    Hover.on(function (el) {
      setHover(el && el.closest ? el.closest(targets) : null);
    });

    var firstMove = true;
    window.addEventListener("mousemove", function (e) {
      Cursor.x = e.clientX; Cursor.y = e.clientY;
      Cursor.moved = true;

      if (firstMove) {
        firstMove = false;

        rx = Cursor.x; ry = Cursor.y;
        Cursor.dot.style.transition = "none";
        placeDot(Cursor.x, Cursor.y);
        Cursor.ring.style.transform =
          "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
        void Cursor.dot.offsetWidth;
        Cursor.dot.style.transition = "";
        revealCursor();
      } else {
        placeDot(Cursor.x, Cursor.y);
      }
    }, { passive: true });

    window.addEventListener("pagehide", function () {
      try { sessionStorage.setItem("as-cursor", Cursor.x + "," + Cursor.y); } catch (e) {  }
    });

    (function loop() {
      rx += (Cursor.x - rx) * 0.18;
      ry += (Cursor.y - ry) * 0.18;
      Cursor.ring.style.transform =
        "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
  }

  // Calque de particules plein écran (losanges ambre / crème) partagé par le curseur de niveau et le tactile.
  function makeFx() {
    var fx = document.createElement("div");
    fx.className = "fx";
    document.documentElement.appendChild(fx);

    function spawn(cls, x, y) {
      var p = document.createElement("i");
      if (cls) p.className = cls;
      p.style.left = x + "px";
      p.style.top = y + "px";
      fx.appendChild(p);
      return p;
    }

    function remove() { this.effect.target.remove(); }

    function burst(x, y, n, spread, size, duration, mix) {
      for (var i = 0; i < n; i++) {
        var a = (i / n) * Math.PI * 2 + (Math.random() - .5) * .7;
        var d = spread * (.5 + Math.random() * .8);
        var s = size * (.6 + Math.random() * .8);
        var p = spawn(mix && i % 3 === 1 ? "is-cream" : "", x, y);
        p.style.width = p.style.height = s.toFixed(1) + "px";
        p.animate([
          { transform: "translate(-50%,-50%) rotate(45deg) scale(1)", opacity: 1 },
          { transform: "translate(calc(-50% + " + (Math.cos(a) * d).toFixed(1) + "px),calc(-50% + " + (Math.sin(a) * d).toFixed(1) + "px)) rotate(" + (45 + (Math.random() - .5) * 240).toFixed(0) + "deg) scale(.15)", opacity: 0 }
        ], { duration: duration * (.7 + Math.random() * .5), easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }).onfinish = remove;
      }
    }

    // Un losange de traînée qui s'éteint sur place.
    function trailDot(x, y) {
      var p = spawn(Math.random() < .25 ? "is-cream" : "", x, y);
      p.style.width = p.style.height = (4 + Math.random() * 4).toFixed(1) + "px";
      p.animate([
        { transform: "translate(-50%,-50%) rotate(45deg) scale(1)", opacity: .9 },
        { transform: "translate(-50%,-50%) rotate(45deg) scale(.1)", opacity: 0 }
      ], { duration: 380, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" }).onfinish = remove;
    }

    return { el: fx, spawn: spawn, remove: remove, burst: burst, trailDot: trailDot };
  }

  // Clics rapprochés (moins de 2 s) : succès 7 / 15 / 22, comptés à la souris comme au doigt.
  var clickTimes = [];
  function countClick(now) {
    clickTimes.push(now);
    while (clickTimes.length && now - clickTimes[0] > 2000) clickTimes.shift();
    if (clickTimes.length >= 7) Achievements.unlock("clicks7");
    if (clickTimes.length >= 15) Achievements.unlock("clicks15");
    if (clickTimes.length >= 22) Achievements.unlock("clicks22");
  }

  // Tactile (et ordinateur sans curseur dessiné) : les clics comptent ; au doigt, petit éclat au tap et traînée au glissé.
  function initTouchFx() {
    if (Cursor.enabled) return;
    var FX = coarse && !reduced ? makeFx() : null;
    var downX = 0, downY = 0, moved = false, down = false, lastX = 0, lastY = 0, lastT = 0, lastTrail = 0;

    document.addEventListener("pointerdown", function (e) {
      if (document.querySelector(".crash")) return;
      down = true; moved = false; downX = e.clientX; downY = e.clientY;
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now();
    });
    document.addEventListener("pointermove", function (e) {
      if (down && !moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 10) moved = true;
    }, { passive: true });
    // La traînée écoute touchmove et non pointermove : dès que le doigt fait défiler la page, le navigateur
    // envoie pointercancel et coupe les pointermove, alors que touchmove continue pendant tout le défilement.
    if (FX) document.addEventListener("touchmove", function (e) {
      var t = e.touches[0];
      if (!t) return;
      var now = performance.now();
      var speed = Math.hypot(t.clientX - lastX, t.clientY - lastY) / Math.max(1, now - lastT);
      lastX = t.clientX; lastY = t.clientY; lastT = now;
      if (speed < .25 || now - lastTrail < 28) return;
      lastTrail = now;
      FX.trailDot(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener("pointerup", function (e) {
      if (!down) return;
      down = false;
      if (moved) return;
      countClick(performance.now());
      if (FX && e.pointerType === "touch") FX.burst(e.clientX, e.clientY, 7, 48, 6, 480, true);
    });
    document.addEventListener("pointercancel", function () { down = false; });
  }

  function initLevel() {
    if (!Cursor.enabled) return;
    var root = document.documentElement;
    var MAX = 100;
    var level = 0;
    try { level = Math.min(MAX, parseInt(localStorage.getItem("as-level"), 10) || 0); } catch (e) { level = 0; }

    var FX = makeFx(), fx = FX.el, spawn = FX.spawn, remove = FX.remove, burst = FX.burst;
    var label = document.createElement("span");
    label.className = "cursor-level";
    label.innerHTML = '<span data-level-text></span><span class="cursor-crown"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17h18l-1.6-9.4-4.6 4.2L12 5l-2.8 6.8-4.6-4.2z"/></svg></span>';
    Cursor.ring.appendChild(label);
    var labelText = label.querySelector("[data-level-text]");

    function tierOf(l) { return l >= MAX ? 2 : l >= 30 ? 1 : 0; }

    function levelAchievements() {
      if (level >= 10) Achievements.unlock("lvl10");
      if (level >= 30) Achievements.unlock("lvl30");
      if (level >= MAX) Achievements.unlock("lvl100");
    }

    function render() {
      labelText.textContent = level >= MAX ? "MAX" : (I18N.current === "en" ? "LV " : "NV ") + level;
      root.classList.toggle("has-level", level > 0);
      for (var t = 1; t <= 2; t++) root.classList.toggle("cursor-tier-" + t, tierOf(level) === t);
    }
    Level.render = render;
    Level.max = function () { gain(MAX, Cursor.x, Cursor.y); };
    render();
    levelAchievements();
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      try { level = Math.min(MAX, parseInt(localStorage.getItem("as-level"), 10) || 0); } catch (err) {  }
      render();
    });

    function wave(x, y, size, duration, delay) {
      var w = spawn("fx__wave", x, y);
      w.style.width = w.style.height = size + "px";
      w.animate([
        { transform: "translate(-50%,-50%) scale(.05)", opacity: .9, borderWidth: "3px" },
        { transform: "translate(-50%,-50%) scale(1)", opacity: 0, borderWidth: "1px" }
      ], { duration: duration, delay: delay || 0, easing: "cubic-bezier(.1,.7,.3,1)", fill: "both" }).onfinish = remove;
    }

    function converge(x, y) {
      var a = Math.random() * Math.PI * 2;
      var d = 55 + Math.random() * 45;
      var p = spawn(Math.random() < .3 ? "is-cream" : "", x + Math.cos(a) * d, y + Math.sin(a) * d);
      p.animate([
        { transform: "translate(-50%,-50%) rotate(45deg) scale(.3)", opacity: 0 },
        { opacity: 1, offset: .3 },
        { transform: "translate(calc(-50% - " + (Math.cos(a) * d).toFixed(1) + "px),calc(-50% - " + (Math.sin(a) * d).toFixed(1) + "px)) rotate(225deg) scale(1)", opacity: 0 }
      ], { duration: 420, easing: "cubic-bezier(.6,0,.9,.4)", fill: "forwards" }).onfinish = remove;
    }

    function pop(k) {
      label.animate([
        { transform: "scale(1)" },
        { transform: "scale(" + k + ")", color: "#fff", offset: .3 },
        { transform: "scale(1)" }
      ], { duration: 480, easing: "cubic-bezier(.2,1.4,.35,1)" });
    }

    function shake(amp, dur) {
      var els = [document.querySelector("main"), document.querySelector(".site-footer")];
      var header = document.querySelector(".site-header");
      if (header && !header.classList.contains("is-hidden")) els.push(header);
      els = els.filter(Boolean);
      root.classList.add("is-shaking");
      var t0 = performance.now();
      (function frame(now) {
        var k = 1 - (now - t0) / dur;
        if (k <= 0) {
          els.forEach(function (el) { el.style.transform = ""; });
          root.classList.remove("is-shaking");
          return;
        }
        var a = amp * k * k;
        var x = (Math.random() * 2 - 1) * a, y = (Math.random() * 2 - 1) * a, r = (Math.random() * 2 - 1) * a * .06;
        els.forEach(function (el) {
          el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) rotate(" + r.toFixed(2) + "deg)";
        });
        requestAnimationFrame(frame);
      })(t0);
    }

    function shockwave(x, y, radius, push) {
      document.querySelectorAll("[data-tilt]").forEach(function (card) {
        var r = card.getBoundingClientRect();
        if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
        var dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
        var d = Math.hypot(dx, dy) || 1;
        var force = Math.max(0, 1 - d / radius);
        if (!force) return;
        var el = card.__tiltInner || card;
        var move = push * (.35 + .65 * force);
        setTimeout(function () {
          el.classList.add("is-shocked");
          el.style.transform = "translate3d(" + (dx / d * move).toFixed(1) + "px," + (dy / d * move).toFixed(1) + "px,0) rotate(" + (dx / d * push / 10 * force).toFixed(2) + "deg) scale(" + (1 + push / 1000 * force).toFixed(3) + ")";
          setTimeout(function () { el.classList.remove("is-shocked"); el.style.transform = ""; }, 150);
        }, d * .2);
      });
    }

    function gain(n, x, y) {
      var before = level;
      level = Math.min(MAX, level + n);
      try { localStorage.setItem("as-level", String(level)); } catch (e) {  }
      render();
      levelAchievements();
      var tier = tierOf(level);
      if (tier > tierOf(before)) {
        burst(x, y, 26 + tier * 10, 170, 8, 800, true);
        for (var i = 0; i < 3; i++) wave(x, y, 240 + i * 140, 650, i * 110);
        shake(5, 380);
        pop(2.3);
        return;
      }
      burst(x, y, [6, 10, 16][tier], 55 + tier * 25, 6, 520, tier > 0);
      if (tier === 2) wave(x, y, 120, 450);
      pop(level >= MAX ? 1.25 : 1.6);
    }

    var RELEASE = [
      { n: 12, spread: 90, size: 6, waves: [220], shake: 3, radius: 260, push: 10 },
      { n: 20, spread: 140, size: 8, waves: [440], shake: 7, radius: 650, push: 26 },
      { n: 48, spread: 260, size: 11, waves: [420, 900, 1500], shake: 16, radius: 2400, push: 48 }
    ];

    function release(x, y) {
      var r = RELEASE[tierOf(level)];
      burst(x, y, r.n, r.spread, r.size, 700 + r.n * 4, true);
      r.waves.forEach(function (w, i) { wave(x, y, w, 550 + i * 150, i * 70); });
      shake(r.shake, 380 + r.shake * 8);
      shockwave(x, y, r.radius, r.push);
      Fight.shock();
      gain(5, x, y);
      Achievements.unlock("charge");
    }

    var down = null, charge = 0, raf = null, lastSpawn = 0, selecting = false, downX = 0, downY = 0, moved = false;

    function setCharge(p) {
      charge = p;
      root.style.setProperty("--charge", p.toFixed(3));
      root.classList.toggle("is-charging", p > 0);
      root.classList.toggle("is-charged", p >= 1);
    }

    function isSelecting() {
      var sel = window.getSelection ? window.getSelection() : null;
      return !!sel && !sel.isCollapsed && sel.toString().length > 0;
    }

    function tick(now) {
      if (!down) return;
      if (!selecting && moved && isSelecting()) { selecting = true; setCharge(0); }
      if (selecting) { raf = requestAnimationFrame(tick); return; }
      var p = Math.max(0, Math.min(1, (now - down - 260) / 900));
      if (p !== charge) setCharge(p);
      if (p > 0 && now - lastSpawn > (p >= 1 ? 110 : 55)) { lastSpawn = now; converge(Cursor.x, Cursor.y); }
      raf = requestAnimationFrame(tick);
    }

    function reset() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      down = null;
      setCharge(0);
    }

    document.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.pointerType === "touch" || document.querySelector(".crash")) return;
      down = performance.now();
      downX = e.clientX; downY = e.clientY; moved = false;
      selecting = false;
      lastSpawn = 0;
      raf = requestAnimationFrame(tick);
    });

    document.addEventListener("pointermove", function (e) {
      if (down && !moved && Math.hypot(e.clientX - downX, e.clientY - downY) > 6) moved = true;
    });

    document.addEventListener("pointerup", function (e) {
      if (!down || e.button !== 0) return;
      var charged = charge >= 1;
      var wasSelecting = selecting;
      reset();
      if (wasSelecting) return;
      countClick(performance.now());
      if (charged) release(e.clientX, e.clientY);
      else gain(1, e.clientX, e.clientY);
    });

    document.addEventListener("pointercancel", reset);
    window.addEventListener("blur", reset);

    var lastX = Cursor.x, lastY = Cursor.y, lastT = 0, lastTrail = 0;
    window.addEventListener("mousemove", function (e) {
      var now = performance.now();
      var speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / Math.max(1, now - lastT);
      lastX = e.clientX; lastY = e.clientY; lastT = now;
      if (!tierOf(level) || speed < .6 || now - lastTrail < 28) return;
      lastTrail = now;
      var dot = Cursor.dot.getBoundingClientRect();
      FX.trailDot(dot.left + dot.width / 2, dot.top + dot.height / 2);
    }, { passive: true });
  }

  function initVideos() {
    var boxes = document.querySelectorAll("[data-video]");
    if (!boxes.length) return;

    function mount(box) {
      if (box.querySelector("iframe")) return;
      var id = box.dataset.video;
      if (!id) return;
      var q = encodeURIComponent(id);
      var frame = document.createElement("iframe");

      var start = box.dataset.start ? parseInt(box.dataset.start, 10) : 0;
      frame.src = "https://www.youtube-nocookie.com/embed/" + q +
        "?autoplay=1&mute=1&loop=1&playlist=" + q +
        "&controls=0&modestbranding=1&rel=0&playsinline=1" +
        (start ? "&start=" + start : "");
      frame.title = box.dataset.title || I18N.t("ui.video", "Vidéo");
      frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      frame.setAttribute("allowfullscreen", "");
      frame.setAttribute("frameborder", "0");
      box.appendChild(frame);
      box.classList.add("is-playing");
    }

    if (reduced || !("IntersectionObserver" in window)) {
      boxes.forEach(function (box) {
        box.addEventListener("click", function () { mount(box); });
      });
      return;
    }

    boxes.forEach(function (box) {
      box.addEventListener("click", function () {
        if (!box.dataset.video) return;
        var t = box.dataset.start ? "&t=" + box.dataset.start : "";
        window.open("https://www.youtube.com/watch?v=" + encodeURIComponent(box.dataset.video) + t,
                    "_blank", "noopener");
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        mount(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "200px 0px 200px 0px", threshold: 0 });

    boxes.forEach(function (box) { io.observe(box); });
  }

  function initTilt() {
    if (reduced) return;
    var cards = document.querySelectorAll("[data-tilt]");
    if (!cards.length) return;

    if (coarse) { document.addEventListener("touchstart", function () {}, { passive: true }); return; }

    cards.forEach(function (card) {
      var inner = card.querySelector(".fav__inner, .card__inner, .spec__inner");

      var selfTilt = !inner;
      if (selfTilt) inner = card;
      card.__tiltInner = inner;
      var prefix = selfTilt ? "perspective(900px) " : "";

      var soft = card.dataset.tilt === "soft";
      var rot = soft ? 6.5 : 13;
      var slide = soft ? 6 : 14;
      var lift = soft ? 14 : 30;
      var grow = soft ? 1.035 : 1.06;

      var raf = null, tx = 0, ty = 0;

      card.__tiltApply = function (clientX, clientY) {
        var r = card.getBoundingClientRect();

        tx = (clientX - r.left) / r.width - 0.5;
        ty = (clientY - r.top) / r.height - 0.5;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          inner.style.transform = prefix +
            "rotateY(" + (tx * rot).toFixed(2) + "deg) " +
            "rotateX(" + (-ty * rot).toFixed(2) + "deg) " +
            "translate3d(" + (tx * slide).toFixed(1) + "px," + (ty * slide).toFixed(1) + "px," + lift + "px) " +
            "scale(" + grow + ")";
        });
      };

      card.__tiltReset = function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        inner.style.transform = "";
      };

      card.addEventListener("mousemove", function (e) {
        card.__tiltApply(e.clientX, e.clientY);
      });
      card.addEventListener("mouseleave", card.__tiltReset);
    });

    var hovered = null;

    Hover.on(function (el) {
      var card = el && el.closest ? el.closest("[data-tilt]") : null;
      if (card === hovered) return;
      if (hovered) {
        hovered.classList.remove("is-hovered");
        if (hovered.__tiltReset) hovered.__tiltReset();
      }
      hovered = card;
      if (card) {
        card.classList.add("is-hovered");

        if (card.__tiltApply) card.__tiltApply(Cursor.x, Cursor.y);
      }
    });
  }

  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.dataset.copy;

        function repli() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = "-1000px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) {  }
          ta.remove();
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text)["catch"](repli);
        } else {
          repli();
        }
      });
    });
  }

  function initHeader() {
    var header = document.querySelector("[data-header]");
    if (header) {
      var last = 0;
      window.addEventListener("scroll", function () {
        var y = window.scrollY;
        if (y > last && y > 240) header.classList.add("is-hidden");
        else header.classList.remove("is-hidden");
        last = y;
      }, { passive: true });
    }

  }

  function initCarousels() {
    document.querySelectorAll("[data-carousel]").forEach(function (box) {
      var track = box.querySelector(".carousel__track");
      if (!track) return;
      var slides = track.children;
      if (slides.length < 2) return;
      var dots = box.querySelector(".carousel__dots");
      var i = 0;
      var timer = null;

      function play() {
        if (timer || reduced) return;
        timer = setInterval(function () { go(i + 1); }, 3000);
      }
      function pause() {
        if (!timer) return;
        clearInterval(timer);
        timer = null;
      }

      function relaunch() { pause(); play(); }

      function go(k) {
        i = (k + slides.length) % slides.length;
        track.style.transform = "translate3d(" + (-i * 100) + "%,0,0)";
        if (!dots) return;
        for (var d = 0; d < dots.children.length; d++) {
          dots.children[d].classList.toggle("is-current", d === i);
        }
      }

      if (dots) {
        for (var s = 0; s < slides.length; s++) {
          var b = document.createElement("button");
          b.type = "button";
          b.setAttribute("aria-label", I18N.t("ui.slide", "Visuel") + " " + (s + 1));
          b.dataset.go = s;
          b.addEventListener("click", function (e) { go(parseInt(e.currentTarget.dataset.go, 10)); relaunch(); });
          dots.appendChild(b);
        }
      }

      var prev = box.querySelector(".carousel__nav--prev");
      var next = box.querySelector(".carousel__nav--next");
      if (prev) prev.addEventListener("click", function () { go(i - 1); relaunch(); });
      if (next) next.addEventListener("click", function () { go(i + 1); relaunch(); });

      Hover.on(function (el) {
        var dessus = el && el.closest ? el.closest("[data-carousel]") === box : false;
        if (dessus) pause(); else play();
      });

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) pause(); else play();
      });

      go(0);
      play();
    });
  }

  function initToTop() {
    document.querySelectorAll("[data-to-top]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (lenis) lenis.scrollTo(0, { duration: 1.1 });
        else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  function initLightbox() {
    var main = document.querySelector("main");
    if (!main) return;

    function zoomable(img) {
      if (!img || img.tagName !== "IMG") return null;
      if (img.closest("a")) return null;
      if (img.classList.contains("video__poster")) return null;
      if (img.closest(".spec")) return null;
      return img.closest(".figure, .carousel__slide") ? img : null;
    }

    main.querySelectorAll(".figure img, .carousel__slide img").forEach(function (img) {
      var cible = zoomable(img);
      if (!cible) return;
      var cadre = cible.closest(".figure, .carousel__slide");
      if (cadre && !cadre.dataset.cursor) cadre.dataset.cursor = "view";
    });

    var boite = document.createElement("div");
    boite.className = "lightbox";
    boite.setAttribute("role", "dialog");
    boite.setAttribute("aria-modal", "true");
    boite.hidden = true;

    var vue = document.createElement("img");
    vue.className = "lightbox__img";
    vue.alt = "";
    boite.appendChild(vue);

    var fermer = document.createElement("button");
    fermer.type = "button";
    fermer.className = "lightbox__close";
    fermer.dataset.cursor = "close";
    fermer.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.close + '</svg>';
    boite.appendChild(fermer);

    document.documentElement.appendChild(boite);

    var ouverte = false;

    vue.dataset.cursor = "view";

    var MAX = 4;
    var z = { s: 1, x: 0, y: 0 };

    function boxOf() {
      var r = boite.getBoundingClientRect();
      var W = vue.offsetWidth, H = vue.offsetHeight;

      var nw = vue.naturalWidth || W, nh = vue.naturalHeight || H;
      var dw = W, dh = H;
      if (W / H > nw / nh) { dh = H; dw = H * nw / nh; } else { dw = W; dh = W * nh / nw; }
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, W: W, H: H, dw: dw, dh: dh };
    }

    function clamp(v, lim) { return Math.max(-lim, Math.min(lim, v)); }

    function surImage(px, py) {
      var b = boxOf();
      var w = b.dw * z.s / 2, h = b.dh * z.s / 2;
      return Math.abs(px - (b.cx + z.x)) <= w && Math.abs(py - (b.cy + z.y)) <= h;
    }

    function apply() {
      var b = boxOf();
      z.x = clamp(z.x, Math.max(0, (b.dw * z.s - b.W) / 2));
      z.y = clamp(z.y, Math.max(0, (b.dh * z.s - b.H) / 2));
      vue.style.transform = z.s === 1
        ? ""
        : "translate3d(" + z.x.toFixed(1) + "px," + z.y.toFixed(1) + "px,0) scale(" + z.s.toFixed(3) + ")";
      boite.classList.toggle("is-zoomed", z.s > 1);
    }

    function zoomAt(s, px, py) {
      s = Math.max(1, Math.min(MAX, s));
      var b = boxOf();
      var k = s / z.s;
      var fx = px - b.cx, fy = py - b.cy;
      z.x = fx - (fx - z.x) * k;
      z.y = fy - (fy - z.y) * k;
      z.s = s;
      if (s === 1) { z.x = 0; z.y = 0; }
      apply();
    }

    function resetZoom() { z.s = 1; z.x = 0; z.y = 0; vue.style.transform = ""; boite.classList.remove("is-zoomed", "is-dragging"); }

    var pushed = false, closing = false;

    function ouvrir(img) {
      vue.src = img.currentSrc || img.src;
      vue.alt = img.alt || "";
      resetZoom();
      fermer.setAttribute("aria-label", I18N.t("ui.close", "Fermer"));
      Achievements.unlock("zoom");
      boite.hidden = false;
      void boite.offsetWidth;
      boite.classList.add("is-open");
      ouverte = true;
      if (lenis) lenis.stop();
      document.documentElement.classList.add("lenis-stopped");
      fermer.focus();
      try { history.pushState({ lightbox: true }, ""); pushed = true; } catch (e) { pushed = false; }
    }

    function fermerVraiment() {
      if (!ouverte) return;
      ouverte = false; pushed = false; closing = false;
      boite.classList.remove("is-open");
      if (lenis) lenis.start();
      document.documentElement.classList.remove("lenis-stopped");

      setTimeout(function () { if (!ouverte) { boite.hidden = true; vue.src = ""; resetZoom(); } }, 400);
    }

    function refermer() {
      if (!ouverte) return;
      if (pushed) {
        if (closing) return;
        closing = true;
        history.back();
        setTimeout(function () { if (ouverte) fermerVraiment(); }, 400);
        return;
      }
      fermerVraiment();
    }

    window.addEventListener("popstate", function () { if (ouverte) fermerVraiment(); });

    main.addEventListener("click", function (e) {
      var img = zoomable(e.target);
      if (!img) return;
      e.preventDefault();
      ouvrir(img);
    });

    fermer.addEventListener("click", function (e) { e.stopPropagation(); refermer(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") refermer();
    });

    var pointers = {};
    var count = 0;
    var start = null;

    function pts() {
      var a = [];
      for (var id in pointers) a.push(pointers[id]);
      return a;
    }

    boite.addEventListener("pointerdown", function (e) {
      if (e.target === fermer || fermer.contains(e.target)) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      count++;
      try { boite.setPointerCapture(e.pointerId); } catch (err) {  }
      var p = pts();
      start = {
        s: z.s, x: z.x, y: z.y,
        moved: false, target: e.target,
        px: e.clientX, py: e.clientY,
        dist: p.length === 2 ? Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) : 0,
        mx: p.length === 2 ? (p[0].x + p[1].x) / 2 : e.clientX,
        my: p.length === 2 ? (p[0].y + p[1].y) / 2 : e.clientY
      };
      boite.classList.add("is-dragging");
    });

    boite.addEventListener("pointermove", function (e) {
      if (!pointers[e.pointerId] || !start) return;
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      var p = pts();
      if (p.length >= 2) {
        var d = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
        var mx = (p[0].x + p[1].x) / 2, my = (p[0].y + p[1].y) / 2;
        var s = Math.max(1, Math.min(MAX, start.s * (d / (start.dist || d))));
        var b = boxOf();
        var k = s / start.s;
        z.x = (mx - b.cx) - ((start.mx - b.cx) - start.x) * k;
        z.y = (my - b.cy) - ((start.my - b.cy) - start.y) * k;
        z.s = s;
        start.moved = true;
        apply();
      } else if (z.s > 1) {
        var dx = e.clientX - start.px, dy = e.clientY - start.py;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) start.moved = true;
        z.x = start.x + dx; z.y = start.y + dy;
        apply();
      }
    });

    function up(e) {
      if (!pointers[e.pointerId]) return;
      delete pointers[e.pointerId];
      count--;
      if (count > 0) {
        var p = pts();
        start = { s: z.s, x: z.x, y: z.y, moved: true, target: null, px: p[0].x, py: p[0].y, dist: 0, mx: p[0].x, my: p[0].y };
        return;
      }
      boite.classList.remove("is-dragging");
      var g = start; start = null;
      if (!g || g.moved) { if (z.s === 1) apply(); return; }

      if (g.target === vue && surImage(e.clientX, e.clientY)) {
        if (z.s > 1) zoomAt(1, e.clientX, e.clientY);
        else zoomAt(2.5, e.clientX, e.clientY);
      } else {
        refermer();
      }
    }
    boite.addEventListener("pointerup", up);
    boite.addEventListener("pointercancel", up);

    var wheelTimer = null;
    boite.addEventListener("wheel", function (e) {
      e.preventDefault();
      boite.classList.add("is-dragging");
      zoomAt(z.s * Math.exp(-e.deltaY * 0.0018), e.clientX, e.clientY);
      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function () { if (!start) boite.classList.remove("is-dragging"); }, 150);
    }, { passive: false });
  }

  var ACHIEVEMENTS = [
    { id: "profil", name: "Coucou", hint: "Visiter le profil" },
    { id: "kokoro", name: "L&rsquo;encre du mouvement<br>Ternie les mots effa&ccedil;ables,<br>Illumine l&rsquo;absence.", hint: "Visiter Kokoro Renzu" },
    { id: "abandon", name: "Trust or Shoot&nbsp;?", hint: "Visiter Abandon West" },
    { id: "inmachina", name: "Trust me. Don&rsquo;t trust the smiling one :)", hint: "Visiter In_Machina" },
    { id: "pyramid", name: "Mission accept&eacute;e", hint: "Visiter L&rsquo;Ombre de la Pyramide" },
    { id: "mobile", name: "Skip add in 3&hellip; 2&hellip; 1", hint: "Visiter Pinpin Studio" },
    { id: "trinytia", name: "Gardien, Ombre ou L&eacute;gende&nbsp;?", hint: "Visiter Tri&rsquo;Nytia" },
    { id: "pantheon", name: "World Builder", hint: "Visiter Panth&eacute;on" },
    { id: "all", name: "Un poil compl&eacute;tionniste", hint: "Visiter tous les projets" },
    { id: "doc", name: "Promis, pas de virus", hint: "T&eacute;l&eacute;charger un document" },
    { id: "zoom", name: "On a oubli&eacute; ses lunettes&nbsp;?", hint: "Zoomer sur une image" },
    { id: "lang", name: "Bilingue", hint: "Changer de langue" },
    { id: "charge", name: "D&eacute;charge de puissance", hint: "Maintenir le clic jusqu&rsquo;&agrave; lib&eacute;rer une d&eacute;charge qui pousse les cartes", pc: true },
    { id: "color", name: "Directeur artistique", hint: "Changer la couleur du site" },
    { id: "key", name: "Et maintenant&nbsp;?", hint: "Acheter la cl&eacute;", touch: true },
    { id: "secret", name: "Content que &ccedil;a vous ait plu&nbsp;!", hint: "Trouver le secret", touch: true },
    { id: "lvl10", name: "Noob", hint: "Passer le curseur niveau 10", pc: true },
    { id: "lvl30", name: "&Eacute;lite", hint: "Passer le curseur niveau 30", pc: true },
    { id: "lvl100", name: "Boss", hint: "Passer le curseur niveau 100", pc: true },
    { id: "clicks7", name: "Bient&ocirc;t la crampe&nbsp;?", hint: "Cliquer 7 fois en moins de 2 secondes" },
    { id: "clicks15", name: "Cookie Clicker simulator", hint: "Cliquer 15 fois en moins de 2 secondes" },
    { id: "clicks22", name: "Deux souris&nbsp;? Tricheur&nbsp;!", touchName: "Deux doigts&nbsp;? Tricheur&nbsp;!", hint: "Cliquer 22 fois en moins de 2 secondes" }
  ];

  // Dernier segment de l'adresse (`/work/kokoro-renzu/` → `kokoro-renzu`, `/profil/` → `profil`), avec ou sans `.html` ni barre finale.
  var PAGE_ACHIEVEMENT = {
    "profil": "profil",
    "kokoro-renzu": "kokoro",
    "tri-nytia": "trinytia",
    "in-machina": "inmachina",
    "abandon-west": "abandon",
    "mobile-games": "mobile",
    "pyramid-shadow": "pyramid",
    "pantheon": "pantheon"
  };

  var Level = { render: function () {}, max: function () {} };
  var Achievements = { unlock: function () {}, konami: function () {}, isKonami: function () { return false; }, render: null, hasKey: function () { return false; }, crown: function () {}, addCoin: function () {}, owns: function () { return false; }, ship: function () { return "shipbase"; }, doorOpen: function () { return false; }, openDoor: function () {}, played: function () {}, openScores: function () {}, notices: function () {} };

  var faviconSource = null;

  function tintFavicon(color) {
    var links = document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]');
    if (!links.length) return;
    if (!faviconSource) {
      faviconSource = { url: links[0].getAttribute("href"), img: null };
      links.forEach(function (l) { l.dataset.original = l.getAttribute("href"); });
    }
    if (!color) {
      links.forEach(function (l) { l.setAttribute("href", l.dataset.original); });
      return;
    }
    function paint(img) {
      var c = document.createElement("canvas");
      c.width = img.naturalWidth || 512;
      c.height = img.naturalHeight || 512;
      var ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, c.width, c.height);
      var url = c.toDataURL("image/png");
      links.forEach(function (l) { l.setAttribute("href", url); });
    }
    if (faviconSource.img) { paint(faviconSource.img); return; }
    var img = new Image();
    img.onload = function () { faviconSource.img = img; paint(img); };
    img.src = faviconSource.url;
  }

  var SCORES_API = { url: "https://aryluvedemvtmonqlcxk.supabase.co", key: "sb_publishable_BiNTdYccGldXJ19ZU8Kw0A_x7E5Kn1K" };

  var Scores = {
    list: [],
    pending: null,
    onChange: null,

    load: function () {
      try { Scores.list = JSON.parse(localStorage.getItem("as-scores") || "[]"); } catch (e) { Scores.list = []; }
      try { Scores.pending = JSON.parse(localStorage.getItem("as-pending-score") || "null"); } catch (e) { Scores.pending = null; }
      Scores.sort();
      Scores.fetchRemote();
    },

    sort: function () {
      Scores.list.sort(function (a, b) { return a.time - b.time; });
      Scores.list = Scores.list.slice(0, 20);
    },

    qualifies: function (time) {
      return Scores.list.length < 20 || time < Scores.list[Scores.list.length - 1].time;
    },

    setPending: function (time, konami) {
      if (!Scores.qualifies(time)) return false;
      Scores.pending = { time: time, date: new Date().toISOString().slice(0, 10), konami: !!konami };
      try { localStorage.setItem("as-pending-score", JSON.stringify(Scores.pending)); } catch (e) { return true; }
      return true;
    },

    submit: function (name) {
      if (!Scores.pending) return;
      var entry = { name: (name || "???").slice(0, 16), time: Scores.pending.time, date: Scores.pending.date, konami: !!Scores.pending.konami };
      Scores.pending = null;
      try { localStorage.removeItem("as-pending-score"); localStorage.setItem("as-name", entry.name); } catch (e) {  }
      Scores.list.push(entry);
      Scores.sort();
      Scores.saveLocal();
      Scores.pushRemote(entry);
      if (Scores.onChange) Scores.onChange();
    },

    saveLocal: function () { try { localStorage.setItem("as-scores", JSON.stringify(Scores.list)); } catch (e) { return; } },

    fetchRemote: function () {
      if (!window.fetch) return;
      fetch(SCORES_API.url + "/rest/v1/scores?select=name,time,date,konami&order=time.asc&limit=20", {
        headers: { apikey: SCORES_API.key, Authorization: "Bearer " + SCORES_API.key }
      }).then(function (r) { return r.json(); }).then(function (rows) {
        if (!Array.isArray(rows)) return;
        Scores.list = rows.map(function (r) { return { name: String(r.name || "???").slice(0, 16), time: Number(r.time) || 0, date: String(r.date || ""), konami: !!r.konami }; });
        Scores.sort();
        Scores.saveLocal();
        if (Scores.onChange) Scores.onChange();
      })["catch"](function () { return; });
    },

    pushRemote: function (entry) {
      if (!window.fetch) return;
      fetch(SCORES_API.url + "/rest/v1/scores", {
        method: "POST",
        headers: { apikey: SCORES_API.key, Authorization: "Bearer " + SCORES_API.key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify(entry)
      }).then(function () { Scores.fetchRemote(); })["catch"](function () { return; });
    },

    label: function (sec) {
      var h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
      return (h ? h + "h " : "") + (h || m ? (m < 10 && h ? "0" : "") + m + "min " : "") + (s < 10 && (h || m) ? "0" : "") + s + "s";
    }
  };

  var PRODUCTS = [
    { id: "vanilla", name: "Vanilla", desc: "Couleur du site&nbsp;: Orange", price: 0, kind: "theme" },
    { id: "psy", name: "Type psy", desc: "Couleur du site&nbsp;: Violet", price: 2, kind: "theme" },
    { id: "eco", name: "&Eacute;colo", desc: "Couleur du site&nbsp;: Vert", price: 2, kind: "theme" },
    { id: "diamond", name: "Encadr&eacute;", desc: "Le curseur devient carr&eacute;", price: 0, kind: "cursor", pc: true },
    { id: "tri", name: "Sniper", desc: "Le curseur devient rond", price: 1, kind: "cursor", pc: true },
    { id: "tag", name: "Taggeur", desc: "Vandaliser la photo de profil", price: 0, kind: "tool" },
    { id: "key", name: "Cl&eacute; de cuivre", desc: "Promesse d&rsquo;aventure, symbole de myst&egrave;re, assurance de succ&egrave;s", price: 5, kind: "item", pc: true },
    { id: "shipbase", name: "C&rsquo;est dans les vieux vaisseaux qu&rsquo;on fait les meilleurs runs", desc: "Un vieux vaisseau qui sent aussi fort qu&rsquo;il est fiable", price: 0, kind: "ship", gated: true, pc: true },
    { id: "ship", name: "Pimp my ride", desc: "Un nouveau vaisseau flambant neuf.", price: 1, kind: "ship", gated: true, pc: true },
    { id: "heart", name: "Free hug", desc: "+1 c&oelig;ur", price: 3, kind: "perk", gated: true, pc: true },
    { id: "sweep", name: "Nuke", desc: "Appuyer sur Espace oblit&egrave;re tous les ennemis et leurs attaques. Une fois par partie.", price: 6, kind: "perk", gated: true, pc: true },
    { id: "cannon", name: "Mode combat activ&eacute;", desc: "Double les d&eacute;g&acirc;ts du champ de force (clic) et de la d&eacute;charge (maintien)", price: 9, kind: "perk", gated: true, pc: true }
  ];

  var KEY_NAMES = { vanilla: "Cl&eacute; de cuivre", eco: "Cl&eacute; de jade", psy: "Cl&eacute; de cristal" };

  // Emblème Konami (assets/img/konami.png, couleurs d'origine), affiché dans les scores obtenus avec le code. Le chemin suit celui de la feuille de style, valable depuis la racine comme depuis work/.
  var KONAMI_LOGO = (function () {
    var css = document.querySelector('link[rel="stylesheet"][href*="main.css"]');
    var base = css ? css.getAttribute("href").replace(/css\/main\.css$/, "") : "assets/";
    return '<img class="scores__konami" src="' + base + 'img/konami.png" alt="Code Konami" width="128" height="128">';
  })();

  var COIN = '<i class="coin"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 18 12 6l4.5 12"/><path d="M6.8 12.6h10.4"/><path d="M6 15.6h12"/></svg></i>';

  function initAchievements() {
    var root = document.documentElement;
    var KEY = "as-ach";
    var DEFAULTS = { unlocked: [], visited: [], claimed: [], owned: ["vanilla", "diamond"], theme: "vanilla", cursor: "", ship: "shipbase", shipChosen: false, spent: 0, crown: false, coins: 0, played: false, door: false, shopSeen: false, shopSeenNew: false, noticed: [], tagOn: true, konami: false };
    var state = JSON.parse(JSON.stringify(DEFAULTS));
    function hydrate() {
      var saved = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!saved || !saved.unlocked) return null;
      for (var k in DEFAULTS) if (saved[k] === undefined) saved[k] = JSON.parse(JSON.stringify(DEFAULTS[k]));
      if (saved.owned.indexOf("diamond") < 0) saved.owned.push("diamond");
      if (saved.owned.indexOf("ship") >= 0 && !saved.shipChosen) saved.ship = "ship";
      if (saved.phase1) { saved.played = true; delete saved.phase1; }
      if (saved.played) { if (saved.owned.indexOf("shipbase") < 0) saved.owned.push("shipbase"); }
      else saved.owned = saved.owned.filter(function (id) { return id !== "shipbase"; });
      return saved;
    }
    try { state = hydrate() || state; } catch (e) {  }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { return; } }

    var visible = ACHIEVEMENTS.filter(function (a) { return (!a.pc || Cursor.enabled) && (!a.touch || !coarse); });
    var pcOnly = coarse ? ACHIEVEMENTS.filter(function (a) { return visible.indexOf(a) < 0; }) : [];
    var products = coarse ? PRODUCTS.filter(function (p) { return !p.pc; }).concat(PRODUCTS.filter(function (p) { return p.pc; })) : PRODUCTS.slice();
    var byId = {};
    ACHIEVEMENTS.forEach(function (a) { byId[a.id] = a; });
    // Invitations vers la boutique, passées dans la même file que les succès : quand elle s'ouvre (premier succès)
    // et quand le mini-jeu a révélé le reste des produits. Une seule fois chacune, tant que la boutique n'a pas été vue.
    var NOTICES = [
      { id: "shop", notice: true, shop: true, name: "Boutique d&eacute;bloqu&eacute;e", due: function () { return state.unlocked.length && !state.shopSeen; } },
      { id: "shopnew", notice: true, shop: true, name: "Nouveaut&eacute;s en boutique", due: function () { return state.played && !state.shopSeenNew; } },
      { id: "konami", notice: true, name: "Code Konami&nbsp;: tout est d&eacute;bloqu&eacute;", due: function () { return !!state.konami; } }
    ];
    NOTICES.forEach(function (n) { byId[n.id] = n; });
    // Nom d'un succès : certains ont une variante tactile (`touchName`, clé `ach.name.<id>.touch`).
    function achName(a) { return coarse && a.touchName ? I18N.t("ach.name." + a.id + ".touch", a.touchName) : I18N.t("ach.name." + a.id, a.name); }
    function shopNews() { return NOTICES.some(function (n) { return n.shop && n.due(); }); }
    var productById = {};
    PRODUCTS.forEach(function (p) { productById[p.id] = p; });

    var CHECK = '<path d="m5 12.5 4.5 4.5L19 7.5"/>';

    function has(id) { return state.unlocked.indexOf(id) >= 0; }
    function claimed(id) { return state.claimed.indexOf(id) >= 0; }
    function owned(id) { return state.owned.indexOf(id) >= 0; }
    function coins() { return state.claimed.length + (state.coins || 0) - state.spent; }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ach";
    btn.dataset.cursor = "trophy";
    btn.hidden = !state.unlocked.length;
    btn.innerHTML = '<span class="ach__icon"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.trophy + '</svg></span>' +
      '<span class="ach__toast"></span><span class="ach__badge" hidden></span>';
    root.appendChild(btn);

    var veil = document.createElement("div");
    veil.className = "ach-veil";
    veil.hidden = true;
    root.appendChild(veil);

    var panel = document.createElement("section");
    panel.className = "ach-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("data-lenis-prevent", "");
    panel.hidden = true;
    panel.innerHTML = '<header class="ach-panel__head">' +
      '<nav class="ach-tabs">' +
        '<button type="button" class="is-active" data-tab="ach"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.trophy + '</svg><span data-ach-title></span></button>' +
        '<button type="button" data-tab="shop"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.coins + '</svg><span data-shop-title></span></button>' +
        '<button type="button" data-tab="scores" hidden><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.podium + '</svg><span data-scores-title></span></button>' +
      '</nav>' +
      '<span class="ach-key" hidden><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.key + '</svg></span>' +
      '<span class="ach-coins">' + COIN + '<b data-coins>0</b></span>' +
      '<button type="button" class="ach-panel__close" data-cursor="close"><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.close + '</svg></button>' +
      '</header><ol class="ach-list"></ol><div class="shop" hidden></div><div class="scores" hidden></div>';
    root.appendChild(panel);
    var list = panel.querySelector("ol");
    var shop = panel.querySelector(".shop");
    var scores = panel.querySelector(".scores");
    var scoresTab = panel.querySelector('[data-tab="scores"]');
    var closeBtn = panel.querySelector(".ach-panel__close");
    var coinsEl = panel.querySelector(".ach-coins");
    var keyEl = panel.querySelector(".ach-key");
    var tab = "ach";

    function applyLook() {
      if (state.theme && state.theme !== "vanilla") root.setAttribute("data-theme", state.theme);
      else root.removeAttribute("data-theme");
      if (state.cursor === "tri") root.setAttribute("data-cursor-shape", "round");
      else root.removeAttribute("data-cursor-shape");
      tintFavicon(state.theme && state.theme !== "vanilla" ? getComputedStyle(root).getPropertyValue("--amber").trim() : "");
      root.classList.toggle("has-crown", !!state.crown);
    }

    Achievements.hasKey = function () { return owned("key"); };
    Achievements.crown = function () { state.crown = true; save(); applyLook(); };
    Achievements.owns = function (id) { return owned(id); };
    Achievements.ship = function () { return state.ship || "shipbase"; };
    Achievements.doorOpen = function () { return !!state.door; };
    Achievements.openDoor = function () { state.door = true; save(); };
    Achievements.played = function () { if (state.played) return; state.played = true; if (!owned("shipbase")) state.owned.push("shipbase"); save(); render(); };
    Achievements.addCoin = function () { state.coins = (state.coins || 0) + 1; save(); render(); };
    Achievements.isKonami = function () { return !!state.konami; };
    // Code Konami : tout débloquer d'un coup, sans toucher à ce qui est équipé. Une seule fois.
    Achievements.konami = function () {
      if (state.konami) return;
      state.konami = true;
      ACHIEVEMENTS.forEach(function (a) { if (state.unlocked.indexOf(a.id) < 0) state.unlocked.push(a.id); });
      Object.keys(PAGE_ACHIEVEMENT).forEach(function (k) { var v = PAGE_ACHIEVEMENT[k]; if (v !== "profil" && state.visited.indexOf(v) < 0) state.visited.push(v); });
      // Taggeur s'équipe dès qu'il est possédé (`tagOn`), et Pimp my ride s'équipe seul tant qu'aucun vaisseau n'a été choisi (`shipChosen`, voir `hydrate()`) : on fige les deux avant d'ajouter le catalogue.
      if (!owned("tag")) state.tagOn = false;
      if (!state.shipChosen) { state.ship = state.ship || "shipbase"; state.shipChosen = true; }
      PRODUCTS.forEach(function (p) { if (state.owned.indexOf(p.id) < 0) state.owned.push(p.id); });
      state.coins = (state.coins || 0) + 99;
      state.played = true;
      state.crown = true;
      var wasOpen = !!state.door;
      state.door = true;
      save();
      btn.hidden = false;
      render();
      bump();
      Level.max();
      blink();
      if (!wasOpen && Achievements.onDoor) Achievements.onDoor();
      notices(400);
    };

    // La pastille compte les pièces à réclamer, plus une pour la boutique tant qu'elle a du nouveau à montrer ; visiter l'onglet suffit à l'éteindre.
    function renderBadge() {
      var waiting = visible.filter(function (a) { return has(a.id) && !claimed(a.id); }).length + (shopNews() ? 1 : 0);
      var badge = btn.querySelector(".ach__badge");
      badge.textContent = waiting;
      badge.hidden = !waiting;
      btn.classList.toggle("has-badge", !!waiting);
      btn.classList.toggle("has-news", shopNews());
      panel.querySelector('[data-tab="shop"]').classList.toggle("is-new", shopNews());
    }

    function render() {
      btn.setAttribute("aria-label", I18N.t("ach.title", "Succès"));
      panel.querySelector("[data-ach-title]").textContent = I18N.t("ach.title", "Succès");
      panel.querySelector("[data-shop-title]").textContent = I18N.t("shop.title", "Boutique");
      panel.querySelector("[data-scores-title]").textContent = I18N.t("scores.title", "Scores");
      scoresTab.hidden = !state.played;
      closeBtn.setAttribute("aria-label", I18N.t("ui.close", "Fermer"));
      panel.querySelector("[data-coins]").textContent = coins();
      keyEl.hidden = !owned("key");
      renderBadge();
      var rows = Math.ceil(visible.length / 2);
      list.style.setProperty("--rows", rows);
      list.innerHTML = visible.map(function (a, i) {
        var ok = has(a.id);
        var claim = ok && !claimed(a.id);
        var cls = (ok ? "is-unlocked" : "is-locked") + (claim ? " is-claimable" : "") + (i >= rows ? " is-right" : "") + (i === rows ? " is-top" : "");
        return '<li class="ach-item ' + cls + '" data-id="' + a.id + '"' + (claim ? ' data-cursor="coin" title="' + I18N.t("ach.claim", "Réclamer la pièce") + '"' : "") + '>' +
          '<span class="ach-item__check"><svg viewBox="0 0 24 24" aria-hidden="true">' + CHECK + '</svg></span>' +
          '<span><b>' + (ok ? achName(a) : "???") + '</b><span>' + I18N.t("ach.hint." + a.id, a.hint) + '</span></span>' +
          '<span class="ach-item__coin">' + COIN + '</span></li>';
      }).join("") + (pcOnly.length ? '<li class="ach-list__pc">' + I18N.t("shop.pc", "Déblocable sur la version PC du site") + '</li>' + pcOnly.map(function (a) {
        var ok = has(a.id);
        return '<li class="ach-item is-pc ' + (ok ? "is-unlocked" : "is-locked") + '" data-id="' + a.id + '">' +
          '<span class="ach-item__check"><svg viewBox="0 0 24 24" aria-hidden="true">' + CHECK + '</svg></span>' +
          '<span><b>' + (ok ? achName(a) : "???") + '</b><span>' + I18N.t("ach.hint." + a.id, a.hint) + '</span></span></li>';
      }).join("") : "");
      renderShop();
      renderScores();
      applyLook();
      if (toasts) toasts.forEach(function (r) { r.el.innerHTML = rowHtml(byId[r.id]); });
    }

    function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

    function renderScores() {
      var name = "";
      try { name = localStorage.getItem("as-name") || ""; } catch (e) { name = ""; }
      var html = '<div class="scores__head"><p>' + I18N.t("scores.intro", "Les 20 meilleurs temps pour percer le secret.") + '</p>' +
        '<button type="button" class="scores__reset" data-reset-run data-cursor="view">' + I18N.t("scores.reset", "Tout remettre à zéro et relancer le chrono") + '</button></div>';
      if (Scores.pending) {
        html += '<form class="scores__form" data-score-form><span class="scores__time">' + Scores.label(Scores.pending.time) + '</span>' +
          '<input type="text" maxlength="16" required placeholder="' + I18N.t("scores.name", "Ton nom") + '" value="' + name.replace(/"/g, "") + '" data-cursor="view">' +
          '<button type="submit" data-cursor="view">' + I18N.t("scores.save", "Enregistrer") + '</button></form>';
      }
      html += "<ol>";
      for (var i = 0; i < 20; i++) {
        var e = Scores.list[i];
        html += '<li class="' + (e ? "" : "is-empty") + '"><b>' + (i + 1) + '</b><span>' + (e ? esc(e.name) : "—") + '</span><i>' + (e && e.konami ? KONAMI_LOGO : "") + (e ? Scores.label(e.time) : "") + '</i></li>';
      }
      html += "</ol>";
      scores.innerHTML = html;
    }
    Scores.onChange = renderScores;
    Scores.load();

    function renderShop() {
      var rows = Math.ceil(products.length / 2);
      shop.style.setProperty("--rows", rows);
      var wallet = coins();
      shop.innerHTML = products.map(function (p, i) {
        var gated = !!p.gated && !state.played;
        var theme = KEY_NAMES[state.theme] ? state.theme : "vanilla";
        var name = gated ? "???" : p.id === "key" ? I18N.t("shop.name.key." + theme, KEY_NAMES[theme]) : I18N.t("shop.name." + p.id, p.name);
        var desc = gated ? "???" : I18N.t("shop.desc." + p.id, p.desc);
        // L'icône de clé n'est dans le titre que tant qu'elle n'est pas achetée : à l'achat, c'est elle qui part rejoindre la barre.
        if (p.id === "key" && !gated && !owned("key")) name += ' <svg class="shop-item__key is-bumping" viewBox="0 0 24 24" aria-hidden="true">' + ICONS.key + '</svg>';
        if (coarse && p.pc) {
          var banner = i && products[i - 1].pc ? "" : '<div class="shop__pc">' + I18N.t("shop.pc", "Déblocable sur la version PC du site") + '</div>';
          return banner + '<div class="shop-item is-locked is-pc"><span class="shop-item__text"><b>' + name + '</b><span>' + desc + '</span></span></div>';
        }
        var own = !gated && owned(p.id);
        var equipped = !gated && ((p.kind === "theme" && state.theme === p.id) || (p.kind === "cursor" && (state.cursor || "diamond") === p.id) || (p.kind === "ship" && (state.ship || "shipbase") === p.id) || (p.id === "tag" && own && state.tagOn !== false));
        var can = wallet >= p.price;
        var label, action = "";
        if (gated) { label = I18N.t("shop.gated", "Finir la phase 1 pour débloquer"); }
        else if (!own) { label = I18N.t("shop.buy", "Acheter"); action = can ? "buy" : ""; }
        else if (p.id === "tag") {
          // Taggeur se retire et se remet : le bouton reste actif dans les deux sens.
          label = equipped ? I18N.t("shop.remove", "Retirer") : I18N.t("shop.equip", "Équiper");
          action = "toggle";
        }
        else if (p.kind === "theme" || p.kind === "cursor" || p.kind === "ship") {
          label = equipped ? I18N.t("shop.equipped", "Équipé") : I18N.t("shop.equip", "Équiper");
          action = equipped ? "" : "equip";
        } else { label = I18N.t("shop.owned", "Possédé"); }
        var cls = "shop-item" + (equipped ? " is-equipped" : "") + (!own && (!can || gated) ? " is-locked" : "") + (gated ? " is-gated" : "") + (i >= rows ? " is-right" : "") + (i === rows ? " is-top" : "");
        return '<div class="' + cls + '">' +
          '<span class="shop-item__text"><b>' + name + '</b><span>' + desc + '</span></span>' +
          (own || gated ? "" : '<span class="shop-item__price">' + COIN + '<b>' + p.price + '</b></span>') +
          '<button type="button" class="shop-item__btn" data-action="' + action + '" data-id="' + p.id + '"' + (action ? "" : " disabled") + '>' + label + '</button></div>';
      }).join("");
    }
    Achievements.render = render;
    render();

    function bump() {
      coinsEl.classList.remove("is-bump");
      void coinsEl.offsetWidth;
      coinsEl.classList.add("is-bump");
    }

    // La clé achetée vole de la boutique jusqu'à la barre, à gauche des pièces, puis y rebondit.
    function flyKey(from) {
      if (!from) return;
      var to = keyEl.getBoundingClientRect();
      var fly = document.createElement("span");
      fly.className = "key-fly";
      fly.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.key + '</svg>';
      fly.style.left = (from.left + from.width / 2) + "px";
      fly.style.top = (from.top + from.height / 2) + "px";
      keyEl.style.visibility = "hidden";
      root.appendChild(fly);
      fly.animate([
        { transform: "translate(-50%,-50%) scale(1.3)", opacity: 1 },
        { transform: "translate(calc(-50% + " + (to.left + to.width / 2 - from.left - from.width / 2).toFixed(0) + "px),calc(-50% + " + (to.top + to.height / 2 - from.top - from.height / 2).toFixed(0) + "px)) scale(.9)", opacity: 1 }
      ], { duration: 620, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }).onfinish = function () {
        fly.remove();
        keyEl.style.visibility = "";
        keyEl.classList.remove("is-bump");
        void keyEl.offsetWidth;
        keyEl.classList.add("is-bump");
      };
    }

    function claim(li) {
      var id = li.dataset.id;
      if (!has(id) || claimed(id)) return;
      state.claimed.push(id);
      save();
      var from = li.querySelector(".ach-item__coin").getBoundingClientRect();
      var to = coinsEl.querySelector(".coin").getBoundingClientRect();
      var fly = document.createElement("span");
      fly.className = "coin-fly";
      fly.innerHTML = COIN;
      fly.style.left = (from.left + from.width / 2) + "px";
      fly.style.top = (from.top + from.height / 2) + "px";
      root.appendChild(fly);
      render();
      fly.animate([
        { transform: "translate(-50%,-50%) scale(1.3)", opacity: 1 },
        { transform: "translate(calc(-50% + " + (to.left + to.width / 2 - from.left - from.width / 2).toFixed(0) + "px),calc(-50% + " + (to.top + to.height / 2 - from.top - from.height / 2).toFixed(0) + "px)) scale(.9)", opacity: 1 }
      ], { duration: 620, easing: "cubic-bezier(.3,.7,.2,1)", fill: "forwards" }).onfinish = function () {
        fly.remove();
        bump();
      };
    }

    list.addEventListener("click", function (e) {
      var li = e.target.closest ? e.target.closest(".ach-item.is-claimable") : null;
      if (li) claim(li);
    });

    shop.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".shop-item__btn") : null;
      if (!b || b.disabled) return;
      var p = productById[b.dataset.id];
      var action = b.dataset.action;
      var keyFrom = p && p.id === "key" && action === "buy" ? b.closest(".shop-item").querySelector(".shop-item__key") : null;
      if (keyFrom) keyFrom = keyFrom.getBoundingClientRect();
      if (!p || !action) return;
      if (action === "buy") {
        if (coins() < p.price || owned(p.id)) return;
        state.spent += p.price;
        state.owned.push(p.id);
        if (p.kind === "theme") state.theme = p.id;
        if (p.kind === "cursor") state.cursor = p.id === "diamond" ? "" : p.id;
        if (p.kind === "ship") { state.ship = p.id; state.shipChosen = true; }
        if (p.id === "tag") { state.tagOn = true; applyTag(); }
        save();
        render();
        bump();
        if (p.id === "key") { blink(); flyKey(keyFrom); Achievements.unlock("key"); }
        if (p.kind === "theme" && p.id !== "vanilla") Achievements.unlock("color");
        return;
      }
      if (action === "toggle") {
        state.tagOn = !state.tagOn;
        applyTag();
        save();
        render();
        return;
      }
      if (action === "equip") {
        if (p.kind === "theme") state.theme = p.id;
        if (p.kind === "cursor") state.cursor = p.id === "diamond" ? "" : p.id;
        if (p.kind === "ship") { state.ship = p.id; state.shipChosen = true; }
        save();
        render();
        if (p.kind === "theme" && p.id !== "vanilla") Achievements.unlock("color");
        return;
      }
    });

    coinsEl.addEventListener("click", function () {
      if (tab !== "shop") setTab("shop");
    });

    scores.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = e.target.querySelector("input");
      if (!input || !input.value.trim()) return;
      Scores.submit(input.value.trim());
    });
    scores.addEventListener("click", function (e) {
      if (!e.target.closest || !e.target.closest("[data-reset-run]")) return;
      ActiveTime.wipe();
      try { ["as-ach", "as-level", "as-time", "as-pending-score"].forEach(function (k) { localStorage.removeItem(k); }); } catch (err) {  }
      setTimeout(function () { window.location.reload(); }, 250);
    });
    Achievements.openScores = function () { render(); setTab("scores"); openPanel(); };
    setInterval(function () { if (open && tab === "scores") Scores.fetchRemote(); }, 30000);

    panel.querySelector(".ach-tabs").addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-tab]") : null;
      if (!b) return;
      setTab(b.dataset.tab);
    });

    function setTab(t) {
      if (t === "shop" && shopNews()) {
        state.shopSeen = true;
        if (state.played) state.shopSeenNew = true;
        save();
        renderBadge();
      }
      function swap() {
        tab = t;
        panel.querySelectorAll("[data-tab]").forEach(function (b) { b.classList.toggle("is-active", b.dataset.tab === t); });
        list.hidden = t !== "ach";
        shop.hidden = t !== "shop";
        scores.hidden = t !== "scores";
      }
      if (!open || morphing || tab === t) { swap(); if (open) center(); return; }
      var h0 = panel.offsetHeight;
      panel.classList.add("is-resizing");
      panel.style.transition = "none";
      panel.style.height = h0 + "px";
      swap();
      panel.style.height = "";
      var h1 = panel.offsetHeight;
      panel.style.height = h0 + "px";
      void panel.offsetWidth;
      panel.style.transition = "";
      panel.style.height = h1 + "px";
      panel.style.top = Math.round((window.innerHeight - h1) / 2) + "px";
      setTimeout(function () { if (open) panel.style.height = ""; panel.classList.remove("is-resizing"); }, 400);
    }

    var photo = document.querySelector(".profile__photo img");

    // Photo taguée si Taggeur est possédé et équipé ; l'original sinon. Réversible depuis la boutique.
    function applyTag() {
      if (!photo) return;
      var on = owned("tag") && state.tagOn !== false;
      if (!!photo.dataset.tagged === on) return;
      if (on) {
        photo.dataset.tagged = "1";
        photo.src = photo.src.replace("portrait.jpg", "portrait-tag.jpg");
        if (photo.srcset) photo.srcset = photo.srcset.replace("portrait-sm.jpg", "portrait-tag-sm.jpg").replace("portrait.jpg", "portrait-tag.jpg");
      } else {
        delete photo.dataset.tagged;
        photo.src = photo.src.replace("portrait-tag.jpg", "portrait.jpg");
        if (photo.srcset) photo.srcset = photo.srcset.replace("portrait-tag-sm.jpg", "portrait-sm.jpg").replace("portrait-tag.jpg", "portrait.jpg");
      }
    }

    applyTag();

    var open = false, morphing = false;

    function center() {
      var w = panel.offsetWidth, h = panel.offsetHeight;
      panel.style.left = Math.round((window.innerWidth - w) / 2) + "px";
      panel.style.top = Math.round((window.innerHeight - h) / 2) + "px";
    }

    function fromButton() {
      var R = panel.getBoundingClientRect();
      var B = btn.getBoundingClientRect();
      return "translate(" + (B.left - R.left).toFixed(1) + "px," + (B.top - R.top).toFixed(1) + "px) scale(" + (B.width / R.width).toFixed(4) + "," + (B.height / R.height).toFixed(4) + ")";
    }

    function openPanel() {
      if (open || morphing) return;
      open = true;
      morphing = true;
      veil.hidden = false;
      panel.hidden = false;
      panel.classList.remove("is-open");
      panel.style.height = "";
      panel.style.transition = "none";
      center();
      panel.style.transform = fromButton();
      void panel.offsetWidth;
      btn.classList.add("is-flying");
      panel.style.transition = "";
      panel.style.transform = "";
      veil.classList.add("is-open");
      if (lenis) lenis.stop();
      root.classList.add("lenis-stopped");
      setTimeout(function () {
        morphing = false;
        panel.classList.add("is-open");
        closeBtn.focus({ preventScroll: true });
        panel.scrollLeft = 0;
      }, 360);
    }

    function closePanel() {
      if (!open || morphing) return;
      open = false;
      morphing = true;
      panel.classList.remove("is-open");
      veil.classList.remove("is-open");
      panel.style.transform = fromButton();
      if (lenis) lenis.start();
      root.classList.remove("lenis-stopped");
      setTimeout(function () {
        morphing = false;
        btn.classList.remove("is-flying");
        panel.hidden = true;
        veil.hidden = true;
        panel.style.transform = "";
        flush();
      }, 340);
    }

    window.addEventListener("resize", function () { if (open && !morphing) center(); });

    btn.addEventListener("click", function () {
      clearRows();
      setTab("ach");
      openPanel();
    });

    closeBtn.addEventListener("click", closePanel);
    veil.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });

    var stack = btn.querySelector(".ach__toast");
    var pending = [];
    var toasts = [];

    function rowHtml(a) {
      if (a.notice) return "<small>" + I18N.t("notice.label", "Nouveau") + "</small><b>" + I18N.t("notice." + a.id, a.name) + "</b>";
      return "<small>" + I18N.t("ach.unlocked", "Succès débloqué") + "</small><b>" + achName(a) + "</b>";
    }

    function clearRows() {
      toasts.forEach(function (r) { r.el.remove(); });
      toasts = [];
      btn.classList.remove("is-toast");
      btn.style.width = "";
    }

    function addRow(a, left) {
      var el = document.createElement("span");
      el.className = "ach__row" + (left ? " is-restored" : "");
      el.innerHTML = rowHtml(a);
      stack.appendChild(el);
      btn.classList.add("is-toast");
      toasts.push({ el: el, id: a.id, left: left || 4200, gone: false });
      fitToast();
      if (!left) cheer();
    }

    // La boîte met .55 s à s'élargir ; 0,5 s plus tard, le trophée fait son numéro.
    var icon = btn.querySelector(".ach__icon"), cheerTimer = null;
    function cheer() {
      clearTimeout(cheerTimer);
      cheerTimer = setTimeout(function () {
        icon.classList.remove("is-cheer");
        void icon.offsetWidth;
        icon.classList.add("is-cheer");
      }, 1050);
    }
    icon.addEventListener("animationend", function () { icon.classList.remove("is-cheer"); });

    function fitToast() {
      if (!toasts.length) { btn.style.width = ""; return; }
      var maxW = Math.min(480, window.innerWidth - 32);
      btn.style.width = Math.min(maxW, btn.querySelector(".ach__icon").offsetWidth + stack.scrollWidth + 22) + "px";
    }

    var lastTick = performance.now();
    setInterval(function () {
      var now = performance.now();
      var dt = Math.min(250, now - lastTick);
      lastTick = now;
      if (document.visibilityState !== "visible" || !document.hasFocus()) return;
      toasts.forEach(function (row) {
        if (row.gone) return;
        row.left -= dt;
        if (row.left > 0) return;
        row.gone = true;
        row.el.classList.add("is-gone");
        setTimeout(function () {
          row.el.remove();
          toasts = toasts.filter(function (r) { return r !== row; });
          if (!toasts.length) btn.classList.remove("is-toast");
          fitToast();
        }, 320);
      });
    }, 100);

    var delayed = [];
    window.addEventListener("pagehide", function () {
      var keep = toasts.filter(function (r) { return !r.gone && r.left > 400; }).map(function (r) { return { id: r.id, left: Math.round(r.left) }; });
      delayed.forEach(function (a) { keep.push({ id: a.id, left: 4200 }); });
      try { sessionStorage.setItem("as-toast", JSON.stringify(keep)); } catch (e) { return; }
    });

    function restoreRows() {
      var carried;
      try { carried = JSON.parse(sessionStorage.getItem("as-toast") || "[]"); } catch (e) { carried = []; }
      if (!carried.length) return;
      btn.hidden = false;
      btn.classList.add("is-restored");
      carried.forEach(function (r) {
        if (!byId[r.id]) return;
        if (toasts.some(function (x) { return x.id === r.id; })) return;
        addRow(byId[r.id], r.left);
      });
      setTimeout(function () { btn.classList.remove("is-restored"); }, 60);
    }
    restoreRows();
    window.addEventListener("pageshow", function (e) {
      if (!e.persisted) return;
      try { state = hydrate() || state; } catch (err) {  }
      btn.hidden = !state.unlocked.length;
      render();
      restoreRows();
    });

    // Rien ne bouge tant que la page arrive : les notifications attendent la fin du préchargeur ou de l'entrée de page.
    var readyAt = Date.now() + (document.querySelector("[data-preloader]") ? 2200 : 1100);
    function toast(a) {
      if (open) { pending.push(a); return; }
      if (Date.now() < readyAt) { setTimeout(function () { toast(a); }, readyAt - Date.now()); return; }
      if (btn.hidden) {
        btn.hidden = false;
        btn.classList.add("is-pop");
        delayed.push(a);
        setTimeout(function () { btn.classList.remove("is-pop"); }, 700);
        setTimeout(function () { delayed = delayed.filter(function (x) { return x !== a; }); if (!open) addRow(a); else pending.push(a); }, 650);
        return;
      }
      addRow(a);
    }

    function flush() {
      var queued = pending;
      pending = [];
      queued.forEach(function (a, i) { setTimeout(function () { toast(a); }, 500 + i * 250); });
    }

    Achievements.unlock = function (id) {
      var a = byId[id];
      if (!a || a.notice || has(id) || (a.pc && !Cursor.enabled) || (a.touch && coarse)) return;
      state.unlocked.push(id);
      save();
      render();
      toast(a);
      notices(900);
    };

    // Pousse les invitations dues et pas encore montrées ; `delay` les fait passer après le succès qui vient d'apparaître.
    function notices(delay) {
      NOTICES.forEach(function (n, i) {
        if (!n.due() || state.noticed.indexOf(n.id) >= 0) return;
        state.noticed.push(n.id);
        save();
        setTimeout(function () { toast(n); }, (delay || 0) + i * 250);
      });
    }
    Achievements.notices = function () { notices(0); };
    notices(0);

    var page = (window.location.pathname.replace(/\/(index\.html)?$/, "").split("/").pop() || "index").replace(/\.html$/, "").toLowerCase();
    var pageId = PAGE_ACHIEVEMENT[page];
    if (pageId) {
      if (pageId !== "profil" && state.visited.indexOf(pageId) < 0) { state.visited.push(pageId); save(); }
      Achievements.unlock(pageId);
      var projects = Object.keys(PAGE_ACHIEVEMENT).map(function (k) { return PAGE_ACHIEVEMENT[k]; }).filter(function (v) { return v !== "profil"; });
      if (projects.every(function (v) { return state.visited.indexOf(v) >= 0; })) Achievements.unlock("all");
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a[href]") : null;
      if (a && /\.pdf(\?|#|$)/i.test(a.getAttribute("href"))) Achievements.unlock("doc");
    });
  }

  var ActiveTime = { label: function () { return ""; }, seconds: function () { return 0; }, wipe: function () {} };

  function initActiveTimer() {
    var KEY = "as-time";
    var total = 0;
    try { total = parseInt(localStorage.getItem(KEY), 10) || 0; } catch (e) { total = 0; }
    var outs = document.querySelectorAll("[data-active-timer]");

    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function show() {
      var h = Math.floor(total / 3600), m = Math.floor(total / 60) % 60, s = total % 60;
      outs.forEach(function (el) { el.textContent = pad(h) + ":" + pad(m) + ":" + pad(s); });
    }
    var wiped = false;
    function store() { if (wiped) return; try { localStorage.setItem(KEY, String(total)); } catch (e) { return; } }
    function active() { return document.visibilityState === "visible" && document.hasFocus(); }

    show();
    var last = performance.now(), carry = 0;
    setInterval(function () {
      var now = performance.now(), dt = now - last;
      last = now;
      if (!active()) return;
      carry += dt;
      if (carry < 1000) return;
      var s = Math.floor(carry / 1000);
      carry -= s * 1000;
      total += s;
      show();
      store();
    }, 250);
    window.addEventListener("pagehide", store);

    ActiveTime.seconds = function () { return total; };
    ActiveTime.wipe = function () { wiped = true; total = 0; carry = 0; show(); };
    ActiveTime.label = function () {
      var h = Math.floor(total / 3600), m = Math.floor(total / 60) % 60, s = total % 60;
      return (h ? h + ":" + pad(m) : String(m)) + ":" + pad(s);
    };
  }

  function initGlitch() {
    if (reduced) return;
    var GLYPHS = "\u2593\u2592\u2591\u2588#%&@$*<>/\|=+~^";
    document.querySelectorAll("[data-glitch]").forEach(function (el) {
      function burst() {
        var base = el.dataset.glitchBase || el.textContent;
        var frames = Math.random() < .3 ? 1 + Math.floor(Math.random() * 2) : Math.random() < .8 ? 3 + Math.floor(Math.random() * 5) : 10 + Math.floor(Math.random() * 14);
        var i = 0, written = null;
        var t = setInterval(function () {
          if (written !== null && el.textContent !== written) { clearInterval(t); schedule(); return; }
          if (i++ >= frames) { clearInterval(t); el.textContent = el.dataset.glitchBase || base; schedule(); return; }
          var chars = base.split("");
          var n = 1 + Math.floor(Math.random() * 3);
          for (var k = 0; k < n; k++) {
            var p = Math.floor(Math.random() * chars.length);
            if (chars[p] === " ") continue;
            chars[p] = Math.random() < .5 ? GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length)) : String.fromCharCode(65 + Math.floor(Math.random() * 26));
          }
          written = chars.join("");
          el.textContent = written;
        }, 55);
      }
      function schedule() { setTimeout(burst, Math.random() < .35 ? 120 + Math.random() * 300 : 400 + Math.random() * 1400); }
      schedule();
    });
  }

  var Fight = { shock: function () {} };

  var SHIP_PX = [
    "....X....",
    "....X....",
    "...XXX...",
    "...XXX...",
    "X..XXX..X",
    "X.XXXXX.X",
    "XXXXXXXXX",
    "XX.XXX.XX",
    ".X..X..X."
  ];
  var SHIP2_PX = [
    "....X....",
    "...XXX...",
    "...X.X...",
    "..XX.XX..",
    ".XX.X.XX.",
    "XXXXXXXXX",
    "X.XX.XX.X",
    "..X...X..",
    "...X.X..."
  ];
  var BOSS_PX = [
    "......XXX......",
    "....XXXXXXX....",
    "..XXX.XXX.XXX..",
    ".XXXXXXXXXXXXX.",
    "XXX.XXXXXXX.XXX",
    "XX.XX.XXX.XX.XX",
    "X..XX.....XX..X",
    "....XX...XX....",
    "...XX.....XX..."
  ];
  var DRONE_PX = ["..XX..", ".XXXX.", "XX.XXX", "XXXXXX", ".X..X.", "X....X"];
  var BUG_PX = ["X....X", ".X..X.", "XXXXXX", "X.XX.X", "XXXXXX", ".X..X."];
  var HEART_PX = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];

  // Glitch plein écran : blocs et bandes par-dessus la page, les morceaux de la page tressautent.
  // Utilisé par le combat (impact, défaite) et, en court, sur les portes d'entrée du secret.
  function glitch(ms, then) {
    var root = document.documentElement;
    var gl = document.createElement("div");
    gl.className = "glitch";
    var cols = ["var(--amber)", "var(--cream)", "var(--ink-3)", "#fff"];
    var html = "";
    for (var i = 0; i < 28; i++) {
      var sz = 10 + Math.random() * 130;
      html += '<i class="glitch__block" style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) + '%;width:' + sz.toFixed(0) + 'px;height:' + (sz * (.3 + Math.random() * 1.2)).toFixed(0) + 'px;background:' + cols[i % 4] + ';animation-duration:' + (70 + Math.random() * 110).toFixed(0) + 'ms;animation-delay:-' + (Math.random() * 200).toFixed(0) + 'ms;--gx:' + ((Math.random() - .5) * 90).toFixed(0) + 'px"></i>';
    }
    for (var k = 0; k < 6; k++) {
      html += '<i class="glitch__band" style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + (14 + Math.random() * 110).toFixed(0) + 'px;animation-duration:' + (90 + Math.random() * 140).toFixed(0) + 'ms;--gx:' + ((Math.random() < .5 ? -1 : 1) * (60 + Math.random() * 180)).toFixed(0) + 'px"></i>';
    }
    gl.innerHTML = html;
    root.appendChild(gl);
    document.querySelectorAll("main > *, .site-header, .site-footer, .fight").forEach(function (el, i) {
      el.style.setProperty("--gx", ((i % 2 ? -1 : 1) * (8 + Math.random() * 26)).toFixed(0) + "px");
      el.style.setProperty("--gy", ((i % 3 ? -1 : 1) * (2 + Math.random() * 12)).toFixed(0) + "px");
      el.style.setProperty("--gc", (20 + Math.random() * 60).toFixed(0) + "%");
    });
    root.classList.add("is-glitching");
    setTimeout(function () {
      gl.remove();
      if (!document.querySelector(".glitch")) root.classList.remove("is-glitching");
      if (then) then();
    }, ms);
  }

  // Petit glitch d'un clin d'œil, coupé en mouvement réduit.
  function blink(then) {
    if (reduced) { if (then) then(); return; }
    glitch(180, then);
  }

  function initFight() {
    var door = document.querySelector(".card--locked");
    if (!door) return;
    var root = document.documentElement;

    var panel = document.createElement("section");
    panel.className = "fight";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.hidden = true;
    panel.innerHTML = '<canvas class="fight__canvas"></canvas>';
    root.appendChild(panel);
    var veil = document.createElement("div");
    veil.className = "fight-veil";
    veil.hidden = true;
    root.appendChild(veil);
    var canvas = panel.querySelector("canvas");
    var ctx = canvas.getContext("2d");

    var open = false, morphing = false, raf = null, W = 0, H = 0, dpr = 1;
    var g = null;
    var pointer = { x: 0, y: 0, inside: false };

    function color(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
    function tint(alpha) {
      var h = color("--amber").replace("#", "");
      if (h.length === 3) h = h.charAt(0) + h.charAt(0) + h.charAt(1) + h.charAt(1) + h.charAt(2) + h.charAt(2);
      var n = parseInt(h, 16);
      return "rgba(" + (n >> 16 & 255) + "," + (n >> 8 & 255) + "," + (n & 255) + "," + alpha + ")";
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }

    function size() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = panel.clientWidth;
      H = panel.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function center() {
      panel.style.left = Math.round((window.innerWidth - panel.offsetWidth) / 2) + "px";
      panel.style.top = Math.round((window.innerHeight - panel.offsetHeight) / 2) + "px";
    }

    function fromDoor() {
      var R = panel.getBoundingClientRect(), B = door.getBoundingClientRect();
      return "translate(" + (B.left - R.left).toFixed(1) + "px," + (B.top - R.top).toFixed(1) + "px) scale(" + (B.width / R.width).toFixed(4) + "," + (B.height / R.height).toFixed(4) + ")";
    }

    var BOSS_HP = [100, 125, 150];

    function fresh() {
      var stars = [];
      var konami = Achievements.isKonami(), heart = Achievements.owns("heart");
      for (var i = 0; i < 70; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, z: rnd(.3, 1.2) });
      return {
        phase: 1, t: 0, over: false, intro: 4000, introT: 0, stars: stars, shake: 0, freeze: 0, msg: null, sub: null, fireworks: 0, glitchAt: 0,
        ship: { x: W / 2, y: H - 90, hp: konami ? 5 : heart ? 3 : 2, max: konami ? 5 : heart ? 3 : 2, inv: 0, shield: 0, bullets: konami ? 5 : 1, rate: konami ? 4 : 0, fire: 0, flash: 0, sweep: Achievements.owns("sweep") ? 1 : 0 },
        boss: { x: W / 2, y: 100, hp: BOSS_HP[0], max: BOSS_HP[0], flash: 0, wob: 0, aim: 0, fan: 0, spiral: 0, spiralA: 0, spawn: 0, wave: 0, heavy: 0, shift: 0, seeker: 6000 },
        enemies: [], pbullets: [], ebullets: [], drops: [], sparks: [], rings: [], lastField: 0
      };
    }

    function px(map, x, y, s, fill) {
      ctx.fillStyle = fill;
      for (var r = 0; r < map.length; r++) for (var c = 0; c < map[r].length; c++) {
        if (map[r].charAt(c) === "X") ctx.fillRect(x + c * s, y + r * s, s, s);
      }
    }

    function spark(x, y, n, col, speed) {
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, v = (speed || 120) * (.4 + Math.random());
        g.sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 380 + Math.random() * 300, col: col, s: 2 + Math.random() * 3 });
      }
    }

    var TYPES = {
      drone: { hp: 1, r: 12, score: 1 },
      dasher: { hp: 1, r: 11, score: 1 },
      follower: { hp: 1, r: 11, score: 1 },
      spawner: { hp: 15, r: 32, score: 4 },
      turret: { hp: 5, r: 18, score: 4 },
      seeker: { hp: 10, r: 16, score: 3 }
    };

    function addEnemy(type, x, y, extra) {
      var e = { type: type, x: x, y: y, hp: TYPES[type].hp, r: TYPES[type].r, seed: Math.random() * 6.28, born: g.t, dir: Math.random() < .5 ? -1 : 1, timer: 0 };
      if (extra) for (var k in extra) e[k] = extra[k];
      g.enemies.push(e);
      return e;
    }

    function formation() {
      var n = 7, gap = 46, x0 = W / 2 - (n - 1) * gap / 2;
      for (var row = 0; row < 2; row++) for (var i = 0; i < n; i++) addEnemy("drone", x0 + i * gap, -20 - row * 36 - Math.abs(i - (n - 1) / 2) * 12, { form: true, fx: x0 + i * gap, hp: 1 });
    }

    function shootEnemy(x, y, ang, speed, r) {
      g.ebullets.push({ x: x, y: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, r: r || 5 });
    }

    function aimAt(x, y) { return Math.atan2(g.ship.y - y, g.ship.x - x); }

    function dropBonus(x, y, chance) {
      if (Math.random() > (chance || .14)) return;
      var weights = { bullet: 3, rate: 1, heal: 1, shield: 2, bomb: 2, coin: 3 };
      if (g.ship.bullets >= 5) delete weights.bullet;
      if (g.ship.rate >= 4) delete weights.rate;
      if (g.ship.hp >= g.ship.max) delete weights.heal;
      var total = 0, k;
      for (k in weights) total += weights[k];
      var roll = Math.random() * total, kind = "coin";
      for (k in weights) { roll -= weights[k]; if (roll < 0) { kind = k; break; } }
      g.drops.push({ kind: kind, x: x, y: y, vy: 55, life: 9000 });
    }

    function hurtShip() {
      var s = g.ship;
      if (s.inv > 0 || s.shield > 0 || g.over) return;
      s.hp -= 1;
      s.inv = 1200;
      s.flash = 400;
      s.bullets = Math.max(1, s.bullets - 1);
      s.rate = Math.max(0, s.rate - 1);
      g.shake = 24;
      g.freeze = 120;
      glitch(200);
      spark(s.x, s.y, 26, color("--amber"), 220);
      if (s.hp <= 0) lose();
    }

    function hurtBoss(n, x, y) {
      var b = g.boss;
      if (g.over) return;
      if (b.shift > 0) { spark(x || b.x, y || b.y, 4, color("--muted"), 90); return; }
      b.hp -= n;
      b.flash = 140;
      spark(x || b.x, y || b.y, 4 + n * 2, color("--cream"), 150);
      if (b.hp > 0) return;
      if (g.phase < 3) {
        g.phase += 1;
        b.hp = b.max = BOSS_HP[g.phase - 1];
        b.shift = 2000;
        g.ebullets = [];
        g.msg = { text: "PHASE " + g.phase, life: 1600 };
        spark(b.x, b.y, 50, color("--amber"), 280);
        g.shake = 12;
        return;
      }
      win();
    }

    function killEnemy(e) {
      if (g.enemies.indexOf(e) < 0) return;
      g.enemies = g.enemies.filter(function (x) { return x !== e; });
      spark(e.x, e.y, 8 + TYPES[e.type].score * 3, color("--amber"), 140);
      if (e.type === "seeker") {
        spark(e.x, e.y, 40, color("--cream"), 260);
        g.rings.push({ x: e.x, y: e.y, r: 10, max: 110, life: 320 });
        g.shake = Math.max(g.shake, 6);
        if (Math.hypot(g.ship.x - e.x, g.ship.y - e.y) < 110) hurtShip();
        g.enemies.slice().forEach(function (o) { if (o !== e && Math.hypot(o.x - e.x, o.y - e.y) < 110 + o.r) { spark(o.x, o.y, 6, color("--cream"), 120); killEnemy(o); } });
        dropBonus(e.x, e.y, 1);
        return;
      }
      dropBonus(e.x, e.y, e.type === "dasher" ? .28 : .14);
    }


    Fight.shock = function () {
      if (!open || !g || g.over) return;
      var s = g.ship, R = 300, D = Achievements.owns("cannon") ? 10 : 5;
      g.rings.push({ x: s.x, y: s.y, r: 20, max: R, life: 320 });
      spark(s.x, s.y, 30, color("--cream"), 300);
      g.shake = 10;
      g.enemies.slice().forEach(function (e) {
        if (Math.hypot(e.x - s.x, e.y - s.y) < R + e.r) { spark(e.x, e.y, 6, color("--cream"), 120); killEnemy(e); }
      });
      if (Math.hypot(g.boss.x - s.x, g.boss.y - s.y) < R + 60) hurtBoss(D);
    };

    function bomb() {
      g.shake = 16;
      g.enemies.slice().forEach(function (e) { spark(e.x, e.y, 10, color("--amber"), 160); });
      g.enemies = [];
      g.ebullets = [];
      hurtBoss(10);
    }

    function pickup(d) {
      var s = g.ship;
      if (d.kind === "coin") Achievements.addCoin();
      if (d.kind === "heal") s.hp = Math.min(s.max, s.hp + 1);
      if (d.kind === "shield") s.shield = 3000;
      if (d.kind === "bomb") bomb();
      if (d.kind === "bullet") s.bullets = Math.min(5, s.bullets + 1);
      if (d.kind === "rate") s.rate = Math.min(4, s.rate + 1);
      spark(d.x, d.y, 12, color("--cream"), 120);
    }

    function step(dt) {
      var s = g.ship, b = g.boss;
      g.t += dt;
      g.shake = Math.max(0, g.shake - dt * .03);
      if (g.msg) { g.msg.life -= dt; if (g.msg.life <= 0) g.msg = null; }
      g.stars.forEach(function (st) { st.y += st.z * 40 * dt / 1000; if (st.y > H) { st.y = -2; st.x = Math.random() * W; } });
      stepSparks(dt);
      if (g.over) {
        softGlitch(0);
        if (g.fireworks > 0) {
          g.fireworks -= dt;
          if (Math.random() < dt / 260) spark(rnd(40, W - 40), rnd(40, H * .6), 34, Math.random() < .5 ? color("--amber") : color("--cream"), 230);
        }
        return;
      }

      softGlitch(g.phase >= 2 ? (g.phase === 3 ? .85 : .3) : 0);
      if (g.phase === 3) {
        if (!g.glitchAt) g.glitchAt = g.t + 4000 + Math.random() * 3000;
        if (g.t >= g.glitchAt) { g.glitchAt = g.t + 4000 + Math.random() * 3000; g.shake = Math.max(g.shake, 12); }
      }

      var sp = g.phase === 1 ? 1.5 : 1;
      var tx = pointer.inside ? pointer.x : W / 2, ty = pointer.inside ? pointer.y : H - 90;
      if (g.intro > 0) {
        g.intro -= dt;
        g.introT += dt;
        var k = Math.max(0, Math.min(1, (g.introT - 1000) / 2000));
        var yTop = H * .25, yHome = H - 90;
        if (g.introT < 1000) { s.y = H + 60; s.x = W / 2; s.scale = 1; s.yaw = 0; b.y = -120; b.x = W / 2; return; }
        if (k < .25) {
          var u = k / .25, eu = 1 - Math.pow(1 - u, 3);
          s.y = (H + 40) + (yTop - (H + 40)) * eu;
          s.scale = 1 + 2 * eu;
          s.yaw = Math.PI * eu;
        } else {
          var v = (k - .25) / .75, ev = v < .5 ? 2 * v * v : 1 - Math.pow(-2 * v + 2, 2) / 2;
          s.y = yTop + (yHome - yTop) * ev;
          s.scale = 3 - 2 * ev;
          s.yaw = Math.PI + Math.PI * ev;
        }
        s.x = W / 2;
        b.y = -120 + 220 * Math.max(0, Math.min(1, (g.introT - 3000) / 1000));
        b.x = W / 2;
        if (g.intro <= 0) { s.scale = 1; s.yaw = 0; g.msg = { text: "GO", life: 600 }; }
        return;
      }
      s.x += (tx - s.x) * Math.min(1, dt / 60);
      s.y += (ty - s.y) * Math.min(1, dt / 60);
      s.inv = Math.max(0, s.inv - dt);
      s.shield = Math.max(0, s.shield - dt);
      s.flash = Math.max(0, s.flash - dt);

      var charging = root.classList.contains("is-charging");
      s.fire -= dt;
      if (!charging && s.fire <= 0) {
        s.fire = 1000 / (2.5 + s.rate * .75);  // 5 crans : 2,5 à 5,5 coups/s
        if (Achievements.ship() === "ship") spark(s.x, s.y - 14, 2, color("--amber"), 60);
        var n = s.bullets, spread = 14;
        for (var i = 0; i < n; i++) {
          var off = (i - (n - 1) / 2) * spread;
          g.pbullets.push({ x: s.x + off, y: s.y - 14, vx: off * .6, vy: -520, dmg: 1, r: 3 });
        }
      }

      b.wob += dt;
      b.flash = Math.max(0, b.flash - dt);
      b.osc = (b.osc || 0) + dt / (g.phase === 3 ? 900 : 1400);
      b.x = W / 2 + Math.sin(b.osc) * (W * .28);
      b.y = 100 + Math.sin(b.wob / 2100) * 14;
      if (b.shift > 0) { b.shift -= dt; }
      else {
        b.aim -= dt;
        if (b.aim <= 0) {
          b.aim = g.phase === 1 ? 1400 : g.phase === 2 ? 1100 : 900;
          shootEnemy(b.x, b.y + 30, aimAt(b.x, b.y), 260, 6);
          if (g.phase === 3) { shootEnemy(b.x - 30, b.y + 30, aimAt(b.x - 30, b.y) - .18, 260, 5); shootEnemy(b.x + 30, b.y + 30, aimAt(b.x + 30, b.y) + .18, 260, 5); }
        }
        if (g.phase >= 2) {
          b.fan -= dt;
          if (b.fan <= 0) {
            b.fan = g.phase === 2 ? 2200 : 1700;
            var base = aimAt(b.x, b.y);
            for (var f = -2; f <= 2; f++) shootEnemy(b.x, b.y + 30, base + f * .22, 210, 5);
          }
        }
        if (g.phase === 3) {
          b.spiral -= dt;
          if (b.spiral <= 0) {
            b.spiral = 90;
            b.spiralA += .55;
            shootEnemy(b.x, b.y + 20, b.spiralA, 170, 4);
            shootEnemy(b.x, b.y + 20, b.spiralA + Math.PI, 170, 4);
          }
        }
        b.spawn -= dt;
        if (b.spawn <= 0) {
          b.spawn = g.phase === 1 ? 1000 : g.phase === 2 ? 1200 : 950;
          var roll = Math.random();
          if (g.phase >= 2 && roll < .3) addEnemy("follower", b.x + rnd(-40, 40), b.y + 30);
          else if (roll < .55) addEnemy("dasher", rnd(30, W - 30), -20, { vx: rnd(-160, 160), vy: rnd(300, 420) });
          else addEnemy("drone", b.x + rnd(-60, 60), b.y + 30);
        }
        b.wave -= dt;
        if (b.wave <= 0) { b.wave = g.phase === 1 ? 8000 : 9000; formation(); }
        if (g.phase === 1) {
          b.seeker -= dt;
          if (b.seeker <= 0) { b.seeker = 6700; addEnemy("seeker", rnd(60, W - 60), -30); }
        }
        b.heavy -= dt;
        if (b.heavy <= 0) {
          b.heavy = g.phase === 1 ? 9300 : g.phase === 2 ? 9000 : 7000;
          var hasSpawner = g.enemies.some(function (e) { return e.type === "spawner"; });
          var turrets = g.enemies.filter(function (e) { return e.type === "turret"; }).length;
          if (g.phase >= 2 && turrets < 2) addEnemy("turret", turrets ? W - 60 : 60, -30, { ty: 60 });
          else if (g.phase >= 2 && !hasSpawner) addEnemy("spawner", rnd(80, W - 80), -30, { ty: rnd(150, 210) });
        }
      }

      g.enemies.forEach(function (e) {
        var age = g.t - e.born;
        if (e.type === "drone") {
          if (e.form) { e.y += 34 * sp * dt / 1000; e.x = e.fx + Math.sin(age / 700) * 60; }
          else { e.y += 80 * sp * dt / 1000; if (e.fx0 === undefined) e.fx0 = e.x; e.x = e.fx0 + Math.sin(age / 380 + e.seed) * 90; }
        } else if (e.type === "dasher") { e.x += e.vx * sp * dt / 1000; e.y += e.vy * sp * dt / 1000; }
        else if (e.type === "follower") {
          var a = aimAt(e.x, e.y);
          e.x += Math.cos(a) * 130 * sp * dt / 1000; e.y += Math.sin(a) * 130 * sp * dt / 1000;
        } else if (e.type === "seeker") {
          var sa = aimAt(e.x, e.y);
          e.x += Math.cos(sa) * 90 * dt / 1000; e.y += Math.sin(sa) * 90 * dt / 1000;
        } else if (e.type === "spawner") {
          if (e.y < e.ty) e.y += 90 * dt / 1000;
          e.x += Math.sin(age / 1300) * 40 * dt / 1000;
          if (e.y >= e.ty) {
            if (e.burst) { e.gap -= dt; if (e.gap <= 0) { e.gap = 260; e.burst--; addEnemy("drone", e.x + rnd(-20, 20), e.y + 30); if (!e.burst) e.timer = 3200; } }
            else { e.timer -= dt; if (e.timer <= 0) { e.burst = 3; e.gap = 0; } }
          }
        } else if (e.type === "turret") {
          if (e.y < e.ty) e.y += 60 * dt / 1000;
          e.timer -= dt;
          if (e.y >= e.ty && e.timer <= 0) { e.timer = 1200; shootEnemy(e.x, e.y + 10, aimAt(e.x, e.y), 240, 5); }
        }
      });
      g.enemies = g.enemies.filter(function (e) { return e.y < H + 40 && e.x > -60 && e.x < W + 60; });

      g.pbullets.forEach(function (p) { p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; });
      var kept = g.pbullets.filter(function (p) {
        if (p.y < -20 || p.x < -20 || p.x > W + 20) return false;
        if (Math.abs(p.x - b.x) < 66 && Math.abs(p.y - b.y) < 38) { hurtBoss(p.dmg, p.x, p.y); return false; }
        for (var i = 0; i < g.enemies.length; i++) {
          var e = g.enemies[i];
          var hit = Math.hypot(p.x - e.x, p.y - e.y) < e.r + p.r;
          if (hit) { e.hp -= p.dmg; spark(p.x, p.y, 3, color("--cream"), 90); if (e.hp <= 0) killEnemy(e); return false; }
        }
        return true;
      });
      // Si le coup fatal au boss est tombé pendant ce parcours, win() a déjà vidé les balles : ne pas les remettre.
      if (!g.over) g.pbullets = kept;

      g.ebullets.forEach(function (p) { p.x += p.vx * dt / 1000; p.y += p.vy * dt / 1000; });
      g.ebullets = g.ebullets.filter(function (p) {
        if (p.y > H + 20 || p.y < -40 || p.x < -20 || p.x > W + 20) return false;
        if (Math.hypot(p.x - s.x, p.y - s.y) < p.r + 1) { hurtShip(); return false; }
        return true;
      });

      g.enemies.forEach(function (e) {
        var touch = Math.hypot(e.x - s.x, e.y - s.y) < e.r + 1;
        if (touch) hurtShip();
      });
      if (Math.abs(s.x - b.x) < 61 && Math.abs(s.y - b.y) < 35) hurtShip();

      g.drops.forEach(function (d) { d.y += d.vy * dt / 1000; d.life -= dt; });
      var keptDrops = g.drops.filter(function (d) {
        if (d.life <= 0 || d.y > H + 20) return false;
        if (Math.hypot(d.x - s.x, d.y - s.y) < 26) { pickup(d); return false; }
        return true;
      });
      if (!g.over) g.drops = keptDrops;  // même garde : une bombe ramassée peut finir le boss
    }

    function stepSparks(dt) {
      g.rings.forEach(function (r) { r.life -= dt; r.r += (r.max - r.r) * Math.min(1, dt / 60); });
      g.rings = g.rings.filter(function (r) { return r.life > 0; });
      g.sparks = g.sparks.filter(function (sp) {
        sp.life -= dt;
        sp.x += sp.vx * dt / 1000;
        sp.y += sp.vy * dt / 1000;
        sp.vy += 260 * dt / 1000;
        return sp.life > 0;
      });
    }

    var SKULL_PX = [".XXX.", "XXXXX", "X.X.X", "XXXXX", ".X.X."];

    function drawDrop(d, amber, cream, ink2) {
      var x = d.x, y = d.y;
      if (d.kind === "bullet" || d.kind === "rate") {
        ctx.fillStyle = ink2; ctx.strokeStyle = amber; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(x - 12, y - 12, 24, 24, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = amber; ctx.font = "700 15px " + color("--font-mono"); ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(d.kind === "bullet" ? "↑" : "»", x, y + 1);
        return;
      }
      if (d.kind === "heal") { px(HEART_PX, x - 14, y - 12, 4, amber); return; }
      if (d.kind === "shield") {
        ctx.strokeStyle = amber; ctx.lineWidth = 2; ctx.fillStyle = ink2;
        ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = amber;
        ctx.beginPath(); ctx.moveTo(x - 6, y - 6); ctx.lineTo(x + 6, y - 6); ctx.lineTo(x + 6, y); ctx.quadraticCurveTo(x + 6, y + 6, x, y + 8); ctx.quadraticCurveTo(x - 6, y + 6, x - 6, y); ctx.closePath(); ctx.fill();
        return;
      }
      if (d.kind === "bomb") {
        ctx.fillStyle = amber;
        ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.lineTo(x + 7, y - 6); ctx.lineTo(x + 7, y + 8); ctx.lineTo(x + 12, y + 14); ctx.lineTo(x - 12, y + 14); ctx.lineTo(x - 7, y + 8); ctx.lineTo(x - 7, y - 6); ctx.closePath(); ctx.fill();
        px(SKULL_PX, x - 5, y - 5, 2, ink2);
        return;
      }
      if (d.kind === "coin") {
        var w = Math.cos(g.t / 260);
        ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(.08, Math.abs(w)), 1);
        ctx.strokeStyle = amber; ctx.lineWidth = 2; ctx.fillStyle = tint(.15);
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, 6.28); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-5, 7); ctx.lineTo(0, -7); ctx.lineTo(5, 7); ctx.moveTo(-6.5, .5); ctx.lineTo(6.5, .5); ctx.moveTo(-7.5, 4); ctx.lineTo(7.5, 4); ctx.stroke();
        ctx.restore();
      }
    }

    function draw() {
      var amber = color("--amber"), cream = color("--cream"), muted = color("--muted"), ink2 = color("--ink-2");
      var s = g.ship, b = g.boss;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (g.shake > 0) ctx.translate((Math.random() - .5) * g.shake, (Math.random() - .5) * g.shake);

      g.stars.forEach(function (st) { ctx.globalAlpha = .25 + st.z * .5; ctx.fillStyle = cream; ctx.fillRect(st.x, st.y, st.z > .9 ? 2 : 1, st.z > .9 ? 2 : 1); });
      ctx.globalAlpha = 1;

      var bs = 10, bw = 15 * bs, bh = 9 * bs;
      if (b.flash > 0) { ctx.shadowColor = cream; ctx.shadowBlur = 20; }
      if (!(b.shift > 0 && Math.floor(g.t / 90) % 2 === 0)) px(BOSS_PX, b.x - bw / 2, b.y - bh / 2, bs, b.flash > 0 ? "#fff" : cream);
      ctx.shadowBlur = 0;

      g.enemies.forEach(function (e) {
        if (e.type === "drone") px(e.form ? DRONE_PX : BUG_PX, e.x - 12, e.y - 12, 4, cream);
        else if (e.type === "dasher") { ctx.fillStyle = cream; ctx.beginPath(); ctx.moveTo(e.x, e.y + 14); ctx.lineTo(e.x - 9, e.y - 10); ctx.lineTo(e.x + 9, e.y - 10); ctx.closePath(); ctx.fill(); }
        else if (e.type === "follower") { ctx.fillStyle = cream; ctx.beginPath(); ctx.moveTo(e.x, e.y - 12); ctx.lineTo(e.x + 12, e.y); ctx.lineTo(e.x, e.y + 12); ctx.lineTo(e.x - 12, e.y); ctx.closePath(); ctx.fill(); }
        else if (e.type === "seeker") { ctx.strokeStyle = cream; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x, e.y, 14, 0, 6.28); ctx.stroke(); ctx.fillStyle = cream; ctx.globalAlpha = .5 + Math.sin(g.t / 140) * .4; ctx.beginPath(); ctx.arc(e.x, e.y, 6, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; var sa2 = aimAt(e.x, e.y); ctx.beginPath(); ctx.moveTo(e.x + Math.cos(sa2) * 14, e.y + Math.sin(sa2) * 14); ctx.lineTo(e.x + Math.cos(sa2) * 22, e.y + Math.sin(sa2) * 22); ctx.stroke(); }
        else if (e.type === "spawner") { ctx.strokeStyle = cream; ctx.lineWidth = 3; ctx.beginPath(); for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + g.t / 900; var vx = e.x + Math.cos(a) * 32, vy = e.y + Math.sin(a) * 32; if (k) ctx.lineTo(vx, vy); else ctx.moveTo(vx, vy); } ctx.closePath(); ctx.stroke(); ctx.fillStyle = cream; ctx.fillRect(e.x - 8, e.y - 8, 16, 16); }
        else if (e.type === "turret") { ctx.fillStyle = muted; ctx.fillRect(e.x - 18, e.y - 10, 36, 20); ctx.strokeStyle = cream; ctx.lineWidth = 5; var ta = aimAt(e.x, e.y); ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(ta) * 22, e.y + Math.sin(ta) * 22); ctx.stroke(); }
        if (TYPES[e.type].hp > 1) { ctx.fillStyle = "rgba(167,158,144,.4)"; ctx.fillRect(e.x - 16, e.y - e.r - 8, 32, 3); ctx.fillStyle = cream; ctx.fillRect(e.x - 16, e.y - e.r - 8, 32 * e.hp / TYPES[e.type].hp, 3); }
      });

      var fancyShots = Achievements.ship() === "ship";
      g.pbullets.forEach(function (p) {
        if (fancyShots) { ctx.fillStyle = amber; ctx.globalAlpha = .35; ctx.fillRect(p.x - p.r / 2, p.y, p.r, 26); ctx.globalAlpha = 1; ctx.fillStyle = cream; ctx.fillRect(p.x - p.r / 2, p.y - 8, p.r, 12); ctx.fillStyle = amber; ctx.fillRect(p.x - 1, p.y - 8, 2, 12); }
        else { ctx.fillStyle = cream; ctx.fillRect(p.x - p.r / 2, p.y - 8, p.r, 12); }
      });
      g.ebullets.forEach(function (p) { ctx.fillStyle = amber; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); ctx.fillStyle = cream; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .4, 0, 6.28); ctx.fill(); });

      g.rings.forEach(function (r) { ctx.strokeStyle = cream; ctx.lineWidth = 2; ctx.globalAlpha = Math.max(0, r.life / 220); ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1; });
      g.drops.forEach(function (d) { drawDrop(d, amber, cream, ink2); });

      if (!g.over) {
        var blink = s.inv > 0 && Math.floor(g.t / 80) % 2 === 0;
        if (!blink) {
          if (root.classList.contains("is-charging")) { ctx.shadowColor = amber; ctx.shadowBlur = 24; }
          var fancy = Achievements.ship() === "ship";
          ctx.save();
          if (s.scale && (s.scale !== 1 || s.yaw)) { var yawX = Math.cos(s.yaw || 0); ctx.translate(s.x, s.y); ctx.scale(s.scale * (Math.abs(yawX) < .12 ? (yawX < 0 ? -.12 : .12) : yawX), s.scale); ctx.translate(-s.x, -s.y); }
          if (fancy) { ctx.fillStyle = amber; ctx.globalAlpha = .6 + Math.random() * .4; ctx.fillRect(s.x - 5, s.y + 18, 4, 6 + Math.random() * 10); ctx.fillRect(s.x + 1, s.y + 18, 4, 6 + Math.random() * 10); ctx.globalAlpha = 1; }
          px(fancy ? SHIP2_PX : SHIP_PX, s.x - 18, s.y - 18, 4, s.flash > 0 ? amber : (fancy ? amber : cream));
          if (fancy) px(["...X...", "..X.X..", ".X...X.", "..X.X..", "...X..."], s.x - 14, s.y - 10, 4, cream);
          ctx.restore();
          ctx.shadowBlur = 0;
        }
        if (s.shield > 0) {
          // Bouclier plein tant qu'il reste plus d'une seconde ; ensuite il clignote de plus en plus vite (4 → 20 Hz).
          var shAlpha = .85;
          if (s.shield < 1000) {
            var el = 1000 - s.shield, cycles = 4 * el / 1000 + 8 * el * el / 1e6;
            shAlpha = Math.floor(cycles * 2) % 2 === 0 ? .85 : .15;
          }
          ctx.strokeStyle = amber; ctx.lineWidth = 2; ctx.globalAlpha = shAlpha; ctx.beginPath(); ctx.arc(s.x, s.y, 30, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
        }
      }

      var bx0 = 24, bw0 = W - 48, bh0 = 26, fillW = bw0 * Math.max(0, b.hp / b.max);
      ctx.fillStyle = "rgba(167,158,144,.22)";
      ctx.fillRect(bx0, 20, bw0, bh0);
      ctx.fillStyle = amber;
      ctx.fillRect(bx0, 20, fillW, bh0);
      ctx.font = "700 16px " + color("--font-mono");
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      var hpText = Math.max(0, b.hp) + " / " + b.max;
      ctx.save(); ctx.beginPath(); ctx.rect(bx0, 20, fillW, bh0); ctx.clip(); ctx.fillStyle = "#fff"; ctx.fillText(hpText, W / 2, 33); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(bx0 + fillW, 20, bw0 - fillW, bh0); ctx.clip(); ctx.fillStyle = amber; ctx.fillText(hpText, W / 2, 33); ctx.restore();
      ctx.textBaseline = "top";
      ctx.textAlign = "left";

      // HUD bas gauche, de bas en haut : cœurs, balles (1 à 5), cadence (1 à 5), nuke.
      var dim = "rgba(167,158,144,.25)", hudX = 24, pipX = hudX + 40;
      for (var h = 0; h < s.max; h++) px(HEART_PX, hudX + h * 38, H - 54, 4.5, h < s.hp ? amber : dim);
      drawDrop({ kind: "bullet", x: hudX + 14, y: H - 86 }, amber, cream, ink2);
      for (var pb = 0; pb < 5; pb++) { ctx.fillStyle = pb < s.bullets ? amber : dim; ctx.beginPath(); ctx.roundRect(pipX + pb * 13, H - 95, 7, 18, 3.5); ctx.fill(); }
      drawDrop({ kind: "rate", x: hudX + 14, y: H - 122 }, amber, cream, ink2);
      for (var rb = 0; rb < 5; rb++) { ctx.fillStyle = rb <= s.rate ? amber : dim; ctx.fillRect(pipX + rb * 13, H - 113 - (6 + rb * 3), 7, 6 + rb * 3); }
      // Rappel des commandes, au-dessus des jauges : maintien, clic, puis la nuke tout en haut si le perk est acheté.
      ctx.font = "500 14px " + color("--font-mono"); ctx.textAlign = "left"; ctx.textBaseline = "middle";
      [["fight.hold", "[ MAINTIEN ] :", "fight.hold.what", "décharge", H - 162], ["fight.click", "[ CLIC ] :", "fight.click.what", "champ de force", H - 190]].forEach(function (row) {
        var keyLabel = I18N.t(row[0], row[1]);
        ctx.fillStyle = amber; ctx.fillText(keyLabel, hudX, row[4]);
        ctx.fillStyle = muted; ctx.fillText(I18N.t(row[2], row[3]), hudX + ctx.measureText(keyLabel).width + 10, row[4]);
      });
      if (Achievements.owns("sweep")) {
        ctx.globalAlpha = s.sweep ? 1 : .3;
        ctx.fillStyle = amber;
        var spaceLabel = I18N.t("fight.space", "[ ESPACE ] :");
        ctx.fillText(spaceLabel, hudX, H - 226);
        drawDrop({ kind: "bomb", x: hudX + ctx.measureText(spaceLabel).width + 24, y: H - 226 }, amber, cream, ink2);
        ctx.globalAlpha = 1;
      }
      ctx.textBaseline = "top";
      if (s.shield > 0) { ctx.font = "500 14px " + color("--font-mono"); ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = muted; ctx.fillText("S " + (s.shield / 1000).toFixed(1), hudX + s.max * 38 + 6, H - 40); ctx.textBaseline = "top"; }

      if (s.hp === 1 && !g.over) {
        var pulse = .08 + (Math.sin(g.t / 260) + 1) * .06;
        var depth = 64, edge = tint(pulse.toFixed(3)), clear = tint(0);
        [[0, 0, 0, depth, 0, 0, W, depth], [0, H, 0, H - depth, 0, H - depth, W, depth], [0, 0, depth, 0, 0, 0, depth, H], [W, 0, W - depth, 0, W - depth, 0, depth, H]].forEach(function (e) {
          var lg = ctx.createLinearGradient(e[0], e[1], e[2], e[3]);
          lg.addColorStop(0, edge);
          lg.addColorStop(1, clear);
          ctx.fillStyle = lg;
          ctx.fillRect(e[4], e[5], e[6], e[7]);
        });
      }

      g.sparks.forEach(function (sp) { ctx.globalAlpha = Math.max(0, sp.life / 500); ctx.fillStyle = sp.col; ctx.fillRect(sp.x, sp.y, sp.s, sp.s); });
      ctx.globalAlpha = 1;

      if (g.intro > 0 && g.introT >= 1000) {
        var full = "READY PLAYER 1";
        var typed = Math.min(full.length, Math.floor((g.introT - 1000) / 70));
        var done = typed >= full.length;
        var blinkOn = done ? (Math.floor(g.introT / 380) % 2 === 0) : true;
        var caret = Math.floor(g.introT / 120) % 2 === 0;
        if (blinkOn) {
          ctx.font = "500 " + Math.round(Math.min(W, H) / 16) + "px " + color("--font-mono");
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.globalAlpha = .82 + Math.random() * .18;
          ctx.shadowColor = amber; ctx.shadowBlur = 16;
          ctx.fillStyle = amber;
          ctx.fillText(full.slice(0, typed) + (!done && caret ? "█" : ""), W / 2, H * .42);
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      if (g.msg) {
        ctx.font = "800 " + Math.round(Math.min(W, H) / 8) + "px " + color("--font-display");
        ctx.fillStyle = amber;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = Math.min(1, g.msg.life / 400);
        ctx.fillText(g.msg.text, W / 2, H / 2);
        if (g.sub) {
          ctx.font = "300 " + Math.round(Math.min(W, H) / 26) + "px " + color("--font-body");
          ctx.fillStyle = cream;
          ctx.fillText(g.sub, W / 2, H / 2 + Math.min(W, H) / 9);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }

    var last = 0;
    function loop(now) {
      if (!open) return;
      var dt = Math.min(50, now - (last || now));
      last = now;
      if (g.freeze > 0) g.freeze -= dt;
      else step(dt);
      draw();
      raf = requestAnimationFrame(loop);
    }

    function toCanvas(e) {
      var r = canvas.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    }

    document.addEventListener("pointermove", function (e) {
      if (!open) return;
      var p = toCanvas(e);
      pointer.x = Math.max(12, Math.min(W - 12, p[0]));
      pointer.y = Math.max(40, Math.min(H - 30, p[1]));
      pointer.inside = true;
    }, { passive: true });
    canvas.addEventListener("pointerdown", function (e) {
      if (!open || !g || g.over || e.button !== 0) return;
      var p = toCanvas(e);
      pointer.x = p[0]; pointer.y = p[1]; pointer.inside = true;
      field();
    });

    function field() {
      var s = g.ship;
      if (g.t - g.lastField < 220) return;
      g.lastField = g.t;
      var R = 72, D = Achievements.owns("cannon") ? 4 : 2;
      g.rings.push({ x: s.x, y: s.y, r: 10, max: R, life: 220 });
      spark(s.x, s.y, 10, color("--cream"), 200);
      g.enemies.slice().forEach(function (e) {
        if (Math.hypot(e.x - s.x, e.y - s.y) < R + e.r) { e.hp -= D; spark(e.x, e.y, 3, color("--cream"), 90); if (e.hp <= 0) killEnemy(e); }
      });
      if (Math.abs(g.boss.x - s.x) < R + 66 && Math.abs(g.boss.y - s.y) < R + 38) hurtBoss(D);
    }

    function win() {
      if (g.over) return;
      g.over = true;
      g.msg = { text: I18N.t("fight.win", "VICTOIRE"), life: 6500 };
      g.sub = I18N.t("fight.solved", "Bravo, vous avez résolu le secret en ") + ActiveTime.label();
      g.fireworks = 6000;
      spark(g.boss.x, g.boss.y, 90, color("--amber"), 340);
      spark(g.boss.x, g.boss.y, 40, color("--cream"), 260);
      g.shake = 18;
      g.enemies = [];
      g.ebullets = [];
      g.pbullets = [];
      g.drops = [];
      g.rings = [];
      g.boss.hp = 0;
      g.boss.y = -400;
      Achievements.crown();
      Achievements.unlock("secret");
      var qualified = Scores.setPending(ActiveTime.seconds(), Achievements.isKonami());
      setTimeout(function () { closeFight(); if (qualified) setTimeout(Achievements.openScores, 500); }, 6500);
    }

    var soft = null;
    function softGlitch(level) {
      if (!level) { if (soft) { soft.remove(); soft = null; } return; }
      if (!soft) {
        soft = document.createElement("div");
        soft.className = "glitch-soft";
        var html = "";
        for (var i = 0; i < 3; i++) html += '<i class="glitch-soft__band" style="top:' + (Math.random() * 100).toFixed(1) + '%;animation-duration:' + (2600 + Math.random() * 2600).toFixed(0) + 'ms;animation-delay:-' + (Math.random() * 3000).toFixed(0) + 'ms"></i>';
        for (var k = 0; k < 7; k++) html += '<i class="glitch-soft__block" style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' + (Math.random() * 100).toFixed(1) + '%;width:' + (14 + Math.random() * 60).toFixed(0) + 'px;height:' + (6 + Math.random() * 30).toFixed(0) + 'px;animation-duration:' + (1400 + Math.random() * 2200).toFixed(0) + 'ms;animation-delay:-' + (Math.random() * 2000).toFixed(0) + 'ms"></i>';
        soft.innerHTML = html;
        panel.appendChild(soft);
      }
      soft.style.setProperty("--gi", level.toFixed(2));
    }

    function lose() {
      g.over = true;
      g.msg = { text: I18N.t("fight.lose", "VAISSEAU DÉTRUIT"), life: 1400 };
      g.shake = 30;
      spark(g.ship.x, g.ship.y, 60, color("--amber"), 300);
      setTimeout(function () { glitch(1000, crash); }, 1300);
    }

    function crash() {
      cancelAnimationFrame(raf);
      var c = document.createElement("div");
      c.className = "crash";
      c.innerHTML = '<p class="eyebrow eyebrow--accent">' + I18N.t("crash.eyebrow", "Erreur 404") + '</p><h1>Game<br>Over</h1>' +
        '<div><button type="button" class="btn btn--solid crash__retry"><span>' + I18N.t("crash.retry", "Relancer") + '</span></button></div>';
      root.appendChild(c);
      // Recharge la page sur la carte GALAGAX : la partie repart de zéro, le cadenas reste ouvert.
      c.querySelector(".crash__retry").addEventListener("click", function () {
        window.location.hash = "galagax";
        window.location.reload();
      });
      root.classList.add("is-crashed");
      void c.offsetWidth;
      c.classList.add("is-on");
    }

    function openFight() {
      if (open || morphing) return;
      open = true;
      morphing = true;
      panel.hidden = false;
      veil.hidden = false;
      panel.style.transition = "none";
      center();
      size();
      g = fresh();
      Achievements.played();
      panel.style.transform = fromDoor();
      void panel.offsetWidth;
      panel.style.transition = "";
      panel.style.transform = "";
      veil.classList.add("is-open");
      root.classList.add("is-fighting");
      if (lenis) lenis.stop();
      root.classList.add("lenis-stopped");
      last = 0;
      raf = requestAnimationFrame(loop);
      setTimeout(function () { morphing = false; panel.classList.add("is-open"); }, 360);
    }

    function closeFight() {
      if (!open || morphing) return;
      open = false;
      morphing = true;
      cancelAnimationFrame(raf);
      softGlitch(0);
      panel.classList.remove("is-open");
      veil.classList.remove("is-open");
      root.classList.remove("is-fighting");
      panel.style.transform = fromDoor();
      if (lenis) lenis.start();
      root.classList.remove("lenis-stopped");
      setTimeout(function () { morphing = false; panel.hidden = true; veil.hidden = true; panel.style.transform = ""; g = null; Achievements.notices(); }, 340);
    }

    door.addEventListener("click", function () {
      if (open || morphing) return;
      if (!Achievements.hasKey()) {
        door.classList.remove("is-denied");
        void door.offsetWidth;
        door.classList.add("is-denied");
        blink();
        return;
      }
      if (!Achievements.doorOpen()) {
        blink();
        Achievements.openDoor();
        revealPoster(true);
        return;
      }
      setTimeout(openFight, 200);
    });

    function revealPoster(boom) {
      var lock = door.querySelector(".card__lock");
      var title = door.querySelector("[data-glitch]");
      if (title) { title.dataset.glitchBase = "GALAGAX"; title.textContent = "GALAGAX"; title.removeAttribute("data-i18n"); }
      if (boom && lock) {
        var r = lock.getBoundingClientRect(), media = door.querySelector(".card__media").getBoundingClientRect();
        var cx = r.left - media.left + r.width / 2, cy = r.top - media.top + r.height / 2;
        for (var i = 0; i < 26; i++) {
          var p = document.createElement("i");
          p.className = "card__shard";
          var a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120, s = 3 + Math.random() * 6;
          p.style.left = cx + "px"; p.style.top = cy + "px"; p.style.width = p.style.height = s + "px";
          door.querySelector(".card__media").appendChild(p);
          p.animate([
            { transform: "translate(-50%,-50%) rotate(45deg) scale(1)", opacity: 1 },
            { transform: "translate(calc(-50% + " + (Math.cos(a) * d).toFixed(0) + "px),calc(-50% + " + (Math.sin(a) * d).toFixed(0) + "px)) rotate(" + (Math.random() * 400).toFixed(0) + "deg) scale(.2)", opacity: 0 }
          ], { duration: 600 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)", fill: "forwards" }).onfinish = function () { this.effect.target.remove(); };
        }
      }
      door.classList.add("is-opened");
    }
    if (Achievements.doorOpen()) revealPoster(false);
    Achievements.onDoor = function () { revealPoster(true); };
    document.addEventListener("keydown", function (e) {
      if (open && g && g.over) { if (e.key === "Escape" || e.key === " ") e.preventDefault(); return; }
      if (e.key === "Escape") closeFight();
      if ((e.key === "w" || e.key === "W") && open && g && !g.over && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) win();
      if (e.key === " " && open && g && !g.over && g.intro <= 0 && g.ship.sweep) {
        e.preventDefault();
        g.ship.sweep = 0;
        g.shake = 14;
        g.enemies.slice().forEach(function (en) { spark(en.x, en.y, 10, color("--amber"), 160); });
        g.enemies = [];
        g.ebullets = [];
        g.msg = { text: I18N.t("fight.sweep", "NUKE"), life: 700 };
      }
    });
    window.addEventListener("resize", function () { if (open && !morphing) { center(); size(); } });
  }

  // Haut, Haut, Bas, Bas, Gauche, Droite, Gauche, Droite — n'importe où sur le site, hors champ de saisie.
  // Sur une page projet, le titre entier est cliquable : il suit la flèche de retour qu'il contient.
  function initBackTitle() {
    document.querySelectorAll(".work-hero__title").forEach(function (title) {
      var back = title.querySelector(".work-hero__back");
      if (!back) return;
      title.setAttribute("data-cursor", "home");
      title.addEventListener("click", function (e) { if (e.target.closest("a")) return; back.click(); });
    });
  }

  function initKonami() {
    var SEQ = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight"];
    var at = 0;
    document.addEventListener("keydown", function (e) {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      at = e.key === SEQ[at] ? at + 1 : e.key === SEQ[0] ? 1 : 0;
      if (at < SEQ.length) return;
      at = 0;
      Achievements.konami();
    });
  }

  function initCardLinks() {
    // Logo de boutique posé sur une carte-lien de l'accueil : il ouvre la page du jeu à part, sans suivre la carte.
    document.querySelectorAll("[data-store]").forEach(function (el) {
      function go(e) { e.preventDefault(); e.stopPropagation(); window.open(el.dataset.store, "_blank", "noopener"); }
      el.addEventListener("click", go);
      el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") go(e); });
    });
    if (coarse) return;
    document.querySelectorAll("[data-href]").forEach(function (card) {
      card.addEventListener("click", function (e) {
        if (e.button !== 0 || e.target.closest("a, button")) return;
        window.open(card.dataset.href, "_blank", "noopener");
      });
    });
  }

  var SLIDE = 540;

  function runTransition(href) {
    if (lenis) lenis.stop();

    try { sessionStorage.setItem("as-cursor", Cursor.x + "," + Cursor.y); } catch (e) {  }

    var panel = document.createElement("div");
    panel.className = "page-slide";
    document.documentElement.appendChild(panel);
    void panel.offsetWidth;

    document.body.classList.add("is-leaving");
    panel.classList.add("is-up");

    setTimeout(function () { window.location.href = href; }, SLIDE);
  }

  function initPageTransition() {
    var main = document.querySelector("main");
    if (main && !reduced) {
      main.classList.add("page-in");
      main.addEventListener("animationend", function () { main.classList.remove("page-in"); }, { once: true });
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#") return;
      if (a.target === "_blank" || a.hasAttribute("download")) return;
      if (a.hasAttribute("data-no-transition") || a.closest("[data-no-transition]")) return;
      if (a.host !== window.location.host) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (/\.(pdf|zip|png|jpe?g|gif|webp|avif)$/i.test(href)) return;

      e.preventDefault();
      if (reduced) { window.location.href = a.href; return; }
      if (a.dataset.cursor === "secret") { blink(function () { runTransition(a.href); }); return; }
      runTransition(a.href);
    });

    window.addEventListener("pageshow", function (ev) {
      if (ev.persisted) {
        document.body.classList.remove("is-leaving");
        var stale = document.querySelector(".page-slide");
        if (stale) stale.remove();
        if (lenis) lenis.start();
      }
    });
  }

  var I18N = {
    key: "as-lang",
    current: "fr",

    t: function (key, fr) {
      var dict = window.I18N_EN || {};
      return (I18N.current === "en" && dict[key] !== undefined) ? dict[key] : fr;
    },

    detect: function () {
      var url = new URLSearchParams(window.location.search).get("lang");
      if (url === "en" || url === "fr") return url;
      var saved = null;
      try { saved = localStorage.getItem(I18N.key); } catch (e) {  }
      if (saved === "en" || saved === "fr") return saved;
      return (navigator.language || "fr").toLowerCase().indexOf("fr") === 0 ? "fr" : "en";
    },

    apply: function (lang) {
      var dict = window.I18N_EN || {};
      var toEN = lang === "en";
      I18N.current = lang;
      document.documentElement.lang = toEN ? "en" : "fr";

      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.dataset.i18n;
        if (!el.dataset.fr) el.dataset.fr = el.innerHTML;
        el.innerHTML = (toEN && dict[key] !== undefined) ? dict[key] : el.dataset.fr;
      });

      var body = document.body;
      if (!body.dataset.frTitle) body.dataset.frTitle = document.title;
      document.title = (toEN && body.dataset.enTitle) ? body.dataset.enTitle : body.dataset.frTitle;

      var desc = document.querySelector('meta[name="description"]');
      if (desc) {
        if (!body.dataset.frDesc) body.dataset.frDesc = desc.getAttribute("content") || "";
        desc.setAttribute("content", (toEN && body.dataset.enDesc) ? body.dataset.enDesc : body.dataset.frDesc);
      }

      document.querySelectorAll("[data-lang-label]").forEach(function (el) { el.textContent = lang.toUpperCase(); });

      document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.langBtn === lang);
      });

      try { localStorage.setItem(I18N.key, lang); } catch (e) {  }
      if (Achievements.render) Achievements.render();
      Level.render();
      if (hasGSAP && window.ScrollTrigger) window.ScrollTrigger.refresh();
    },

    init: function () {
      I18N.apply(I18N.detect());
      // Un clic n'importe où sur « FR / EN » bascule vers l'autre langue.
      document.querySelectorAll("[data-lang]").forEach(function (box) {
        box.addEventListener("click", function () {
          I18N.apply(I18N.current === "fr" ? "en" : "fr");
          Achievements.unlock("lang");
        });
      });
    }
  };

  function boot() {
    initPreloader();
    initSmoothScroll();
    initHeader();
    initCursor();
    initAchievements();
    initLevel();
    initTouchFx();
    initFight();
    initBrand();
    initPageTransition();
    I18N.init();
    initActiveTimer();
    initGlitch();
    initCarousels();
    initToTop();
    initLightbox();
    initCardLinks();
    initKonami();
    initBackTitle();
    initVideos();
    initTilt();
    initCopy();
    applyStagger();
    initReveals();
    initParallax();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
