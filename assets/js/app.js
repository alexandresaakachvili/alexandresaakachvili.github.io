(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
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
    window.__lenis = lenis;
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

    items.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        var delay = parseFloat(el.dataset.revealDelayLoad || el.dataset.revealDelay || "0");
        setTimeout(function () { el.classList.add("is-in"); }, delay * 1000);
        return;
      }
      io.observe(el);
    });

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
    external: '<path d="M8 16 16.5 7.5"/><path d="M9.5 7.5h7v7"/>',
    close: '<path d="m6.5 6.5 11 11"/><path d="m17.5 6.5-11 11"/>',
    top: '<path d="M12 20V5.4"/><path d="m6.6 10.8 5.4-5.4 5.4 5.4"/>',
    phone: '<path d="M5.5 3h3.2l1.6 4-2.4 1.6a13 13 0 0 0 6 6L15.5 12l4 1.6v3.2a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3.5 5a2 2 0 0 1 2-2z"/>',
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

  function initLevel() {
    if (!Cursor.enabled) return;
    var root = document.documentElement;
    var MAX = 100;
    var level = 0;
    try { level = Math.min(MAX, parseInt(localStorage.getItem("as-level"), 10) || 0); } catch (e) { level = 0; }

    var fx = document.createElement("div");
    fx.className = "fx";
    root.appendChild(fx);
    var label = document.createElement("span");
    label.className = "cursor-level";
    Cursor.ring.appendChild(label);

    function tierOf(l) { return l >= MAX ? 2 : l >= 30 ? 1 : 0; }

    function render() {
      label.textContent = level >= MAX ? "MAX" : "LV " + level;
      root.classList.toggle("has-level", level > 0);
      for (var t = 1; t <= 2; t++) root.classList.toggle("cursor-tier-" + t, tierOf(level) === t);
    }
    render();

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

    function shockwave(x, y, k) {
      document.querySelectorAll("[data-tilt]").forEach(function (card) {
        var r = card.getBoundingClientRect();
        if (r.bottom < -120 || r.top > window.innerHeight + 120) return;
        var dx = r.left + r.width / 2 - x, dy = r.top + r.height / 2 - y;
        var d = Math.hypot(dx, dy) || 1;
        var force = Math.max(0, 1 - d / (900 + 300 * k));
        if (!force) return;
        var el = card.__tiltInner || card;
        var push = (12 + 34 * force) * k;
        setTimeout(function () {
          el.classList.add("is-shocked");
          el.style.transform = "translate3d(" + (dx / d * push).toFixed(1) + "px," + (dy / d * push).toFixed(1) + "px,0) rotate(" + (dx / d * 5 * force).toFixed(2) + "deg) scale(" + (1 + .05 * force).toFixed(3) + ")";
          setTimeout(function () { el.classList.remove("is-shocked"); el.style.transform = ""; }, 150);
        }, d * .5);
      });
    }

    function gain(n, x, y) {
      var before = level;
      level = Math.min(MAX, level + n);
      try { localStorage.setItem("as-level", String(level)); } catch (e) { level = level; }
      render();
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
      { n: 12, spread: 90, size: 6, waves: [220], shake: 4, push: .4 },
      { n: 20, spread: 140, size: 8, waves: [440], shake: 7, push: .7 },
      { n: 48, spread: 260, size: 11, waves: [420, 900, 1500], shake: 16, push: 1.5 }
    ];

    function release(x, y) {
      var r = RELEASE[tierOf(level)];
      burst(x, y, r.n, r.spread, r.size, 700 + r.n * 4, true);
      r.waves.forEach(function (w, i) { wave(x, y, w, 550 + i * 150, i * 70); });
      shake(r.shake, 380 + r.shake * 8);
      shockwave(x, y, r.push);
      gain(5, x, y);
    }

    var down = null, charge = 0, raf = null, lastSpawn = 0;

    function setCharge(p) {
      charge = p;
      root.style.setProperty("--charge", p.toFixed(3));
      root.classList.toggle("is-charging", p > 0);
      root.classList.toggle("is-charged", p >= 1);
    }

    function tick(now) {
      if (!down) return;
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
      if (e.button !== 0 || e.pointerType === "touch") return;
      down = performance.now();
      lastSpawn = 0;
      raf = requestAnimationFrame(tick);
    });

    document.addEventListener("pointerup", function (e) {
      if (!down || e.button !== 0) return;
      var charged = charge >= 1;
      reset();
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
      var p = spawn(Math.random() < .25 ? "is-cream" : "", dot.left + dot.width / 2, dot.top + dot.height / 2);
      p.style.width = p.style.height = (4 + Math.random() * 4).toFixed(1) + "px";
      p.animate([
        { transform: "translate(-50%,-50%) rotate(45deg) scale(1)", opacity: .9 },
        { transform: "translate(-50%,-50%) rotate(45deg) scale(.1)", opacity: 0 }
      ], { duration: 380, easing: "cubic-bezier(.2,.6,.3,1)", fill: "forwards" }).onfinish = remove;
    }, { passive: true });

    function debugResetLevel(e) {
      if (e.key !== "r" && e.key !== "R") return;
      level = 0;
      try { localStorage.removeItem("as-level"); } catch (err) { level = 0; }
      render();
      burst(Cursor.x, Cursor.y, 10, 70, 5, 450, true);
    }
    document.addEventListener("keydown", debugResetLevel);
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
      frame.title = box.dataset.title || "Vidéo";
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

    var lang = document.querySelector("[data-lang]");
    var current = lang ? lang.querySelector("[data-lang-current]") : null;
    if (!lang || !current) return;
    var open = false;
    function setOpen(state) {
      open = state;
      lang.classList.toggle("is-open", open);
      current.setAttribute("aria-expanded", open ? "true" : "false");
    }
    current.addEventListener("click", function () { setOpen(!open); });
    lang.querySelectorAll("[data-lang-btn]").forEach(function (b) {
      b.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("click", function (e) {
      if (open && !lang.contains(e.target)) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setOpen(false);
    });
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
          b.setAttribute("aria-label", "Visuel " + (s + 1));
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

  function initCardLinks() {
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
      if (hasGSAP && window.ScrollTrigger) window.ScrollTrigger.refresh();
    },

    init: function () {
      I18N.apply(I18N.detect());
      document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
        b.addEventListener("click", function () { I18N.apply(b.dataset.langBtn); });
      });
    }
  };

  function boot() {
    initPreloader();
    initSmoothScroll();
    initHeader();
    initCursor();
    initLevel();
    initBrand();
    initPageTransition();
    I18N.init();
    initCarousels();
    initToTop();
    initLightbox();
    initCardLinks();
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
