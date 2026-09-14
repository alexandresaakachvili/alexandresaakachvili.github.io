/* =========================================================
   Alexandre Saakachvili — Portfolio
   app.js — scroll fluide, curseur, vidéos, transitions, i18n
   ========================================================= */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var lenis = null;

  /* Curseur : état partagé avec la transition de page */
  var Cursor = {
    enabled: false,
    dot: null,
    ring: null,
    svg: null,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    moved: false
  };

  /* Un seul releve de ce qui se trouve sous le pointeur, partage par tous
     les modules qui en dependent. Deux appels independants a
     elementFromPoint par image forcaient deux recalculs de mise en page
     pour la meme information. */
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

  /* ------------------------------------------------------
     1. Preloader
     ------------------------------------------------------ */
  function initPreloader() {
    var el = document.querySelector("[data-preloader]");
    if (!el) return;
    // Deja vu pendant cette visite : on retire simplement le balisage.
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

  /* ------------------------------------------------------
     2. Scroll fluide
     ------------------------------------------------------ */
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

  /* ------------------------------------------------------
     3. Révélations
     ------------------------------------------------------ */
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
      // La marge basse de -10 % sert a declencher un peu avant pendant le
      // defilement, mais elle laisserait invisible une rangee qui affleure
      // deja au chargement. On revele donc d emblee tout ce qui touche le
      // vrai bord de l ecran.
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        // Au chargement, plusieurs lignes peuvent etre visibles : on prend
        // le delai qui les enchaine plutot que celui de la seule colonne.
        var delay = parseFloat(el.dataset.revealDelayLoad || el.dataset.revealDelay || "0");
        setTimeout(function () { el.classList.add("is-in"); }, delay * 1000);
        return;
      }
      io.observe(el);
    });

    // Un element colle au bas du document reste sous la marge negative :
    // il n entre jamais dans la zone observee. Arrive en bas de page, on
    // revele donc ce qui n a pas encore ete vu.
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

  /* ------------------------------------------------------
     3 bis. Cascade de gauche a droite dans les grilles
     ------------------------------------------------------ */
  function applyStagger() {
    document.querySelectorAll("[data-stagger]").forEach(function (group) {
      var step = parseFloat(group.dataset.stagger) || 0.07;

      // Regroupement par ligne : le saut vertical fait foi, la grille
      // pouvant compter 4, 3, 2 ou 1 colonne selon la largeur d ecran.
      var rows = [];
      var rowTop = null;
      Array.prototype.forEach.call(group.children, function (el) {
        var top = el.offsetTop;
        if (rowTop === null || Math.abs(top - rowTop) > 4) { rowTop = top; rows.push([]); }
        rows[rows.length - 1].push(el);
      });

      // Duree d une ligne, plus une respiration avant la suivante.
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

  /* ------------------------------------------------------
     4. Parallaxe
     ------------------------------------------------------ */
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

  /* ------------------------------------------------------
     4 bis. Signature du header : chaque lettre grossit a son tour
     ------------------------------------------------------ */
  function initBrand() {
    if (reduced) return;
    document.querySelectorAll(".brand__name").forEach(function (el) {
      var text = el.textContent;
      if (!text) return;
      el.textContent = "";
      for (var i = 0; i < text.length; i++) {
        var s = document.createElement("span");
        // Espace insecable : un span contenant un espace simple serait
        // reduit a zero par le rendu, et le nom se collerait.
        s.textContent = text.charAt(i) === " " ? "\u00A0" : text.charAt(i);
        s.style.setProperty("--i", i);
        el.appendChild(s);
      }
    });
  }

  /* ------------------------------------------------------
     5. Curseur personnalisé
     ------------------------------------------------------ */
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
    // Rattaches a <html> et non a <body> : body est mis a l echelle pendant
    // la transition, le curseur y deriverait de la souris.
    document.documentElement.appendChild(Cursor.dot);
    document.documentElement.appendChild(Cursor.ring);

    // Position heritee de la page precedente : le curseur apparait
    // directement sous la souris au lieu de surgir du coin de l ecran.
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
    } catch (e) { /* noop */ }

    var rx = Cursor.x, ry = Cursor.y;
    placeDot(Cursor.x, Cursor.y);
    Cursor.ring.style.transform =
      "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";

    // Le curseur reste invisible tant que sa position n est pas certaine :
    // la souris a pu bouger pendant le chargement, et on ne veut pas la
    // voir rattraper sa vraie position a l ecran.
    var shown = false;
    Cursor.dot.style.opacity = "0";
    Cursor.ring.style.opacity = "0";
    function revealCursor() {
      if (shown) return;
      shown = true;
      Cursor.dot.style.opacity = "";
      Cursor.ring.style.opacity = "";
    }
    // Sans mouvement, on finit par l afficher a la position heritee.
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

    // Les elements du curseur sont en pointer-events:none : ils ne
    // faussent pas le releve.
    Hover.on(function (el) {
      setHover(el && el.closest ? el.closest(targets) : null);
    });

    var firstMove = true;
    window.addEventListener("mousemove", function (e) {
      Cursor.x = e.clientX; Cursor.y = e.clientY;
      Cursor.moved = true;

      if (firstMove) {
        firstMove = false;
        // On se cale d un coup, sans transition ni interpolation : sinon le
        // curseur traverserait l ecran depuis la position heritee.
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

    // Releve au tout dernier instant : la souris bouge encore pendant la
    // transition et le chargement de la page suivante.
    window.addEventListener("pagehide", function () {
      try { sessionStorage.setItem("as-cursor", Cursor.x + "," + Cursor.y); } catch (e) { /* noop */ }
    });


    (function loop() {
      rx += (Cursor.x - rx) * 0.18;
      ry += (Cursor.y - ry) * 0.18;
      Cursor.ring.style.transform =
        "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();

  }

  /* ------------------------------------------------------
     6. Vidéos — démarrent seules, tournent en boucle, ne
        s'arrêtent plus une fois lancées. Le cadre ne prend jamais le
        pointeur ; le clic mene a la vidéo sur YouTube.
     ------------------------------------------------------ */
  function initVideos() {
    var boxes = document.querySelectorAll("[data-video]");
    if (!boxes.length) return;

    function mount(box) {
      if (box.querySelector("iframe")) return;
      var id = box.dataset.video;
      if (!id) return;
      var q = encodeURIComponent(id);
      var frame = document.createElement("iframe");
      // mute=1 : aucun navigateur n'autorise la lecture automatique avec son.
      // loop=1 exige playlist=<id> pour boucler, et repart alors du debut
      // du segment demande — d ou le depart facultatif ci-dessous.
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

    // Le cadre reste inerte (pointer-events:none cote CSS) : un iframe est
    // un document a part, ni la molette ni les mouvements de souris qui le
    // survolent ne reviennent a la page. Le laisser prendre le pointeur
    // bloquait le defilement et figeait le curseur dessine. Le clic est
    // donc traite ici, et mene a la vidéo sur YouTube.
    // En mouvement reduit rien ne demarre seul : le clic sert alors a
    // monter le lecteur, et non a partir sur YouTube.
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

    // Une fois montée, la vidéo reste en place : elle continue de tourner
    // même quand on remonte plus haut dans la page.
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        mount(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: "200px 0px 200px 0px", threshold: 0 });

    boxes.forEach(function (box) { io.observe(box); });
  }

  /* ------------------------------------------------------
     7. Cartes qui suivent le curseur
     ------------------------------------------------------ */
  function initTilt() {
    if (coarse || reduced) return;
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var inner = card.querySelector(".fav__inner, .card__inner, .spec__inner");
      // Sans conteneur interne (les tuiles de contact), on incline la carte
      // elle-meme. perspective() ecrit DANS la transform donne a chaque
      // element son propre point de fuite, centre sur lui : c'est ce qui
      // evite que les cartes des bords penchent toutes vers l'exterieur.
      var selfTilt = !inner;
      if (selfTilt) inner = card;
      var prefix = selfTilt ? "perspective(900px) " : "";

      // data-tilt="soft" : version attenuee pour les elements bas et larges
      // (les boutons), ou les angles d une carte donneraient une bascule
      // disproportionnee.
      var soft = card.dataset.tilt === "soft";
      var rot = soft ? 6.5 : 13;
      var slide = soft ? 6 : 14;
      var lift = soft ? 14 : 30;
      var grow = soft ? 1.035 : 1.06;

      var raf = null, tx = 0, ty = 0;

      // Sortie en fonction nommée : la synchronisation doit pouvoir
      // l'appeler sans qu'un évènement de souris soit parti.
      card.__tiltApply = function (clientX, clientY) {
        var r = card.getBoundingClientRect();
        // Coordonnées rapportées à LA CARTE, pas à la page : sans cela les
        // cartes des bords penchaient toutes vers l'extérieur.
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

      card.addEventListener("mousemove", function (e) {
        card.__tiltApply(e.clientX, e.clientY);
      });

      // Expose la remise a plat : la synchronisation ci-dessous doit
      // pouvoir l appeler sans passer par un evenement de souris.
      card.__tiltReset = function () {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        inner.style.transform = ""; // retour élastique géré par --ease-snap
      };

      card.addEventListener("mouseleave", card.__tiltReset);
    });

    /* ----------------------------------------------------
       Le defilement ne declenche aucun evenement de souris : ni mouseleave,
       ni reevaluation de :hover par le navigateur. On determine donc
       nous-memes ce qui se trouve sous le pointeur, et on pose la classe
       que le CSS double a :hover.
       ---------------------------------------------------- */
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
        // Une carte arrivant sous le pointeur par défilement doit prendre
        // son inclinaison immédiatement, sans attendre un mouvement.
        if (card.__tiltApply) card.__tiltApply(Cursor.x, Cursor.y);
      }
    });
  }

  /* ------------------------------------------------------
     8. Copie dans le presse-papiers
     ------------------------------------------------------ */
  function initCopy() {
    document.querySelectorAll("[data-copy]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var text = btn.dataset.copy;

        // Repli pour les navigateurs sans presse-papiers asynchrone, et
        // pour les pages ouvertes hors HTTPS ou l API est refusee.
        function repli() {
          var ta = document.createElement("textarea");
          ta.value = text;
          ta.setAttribute("readonly", "");
          ta.style.position = "fixed";
          ta.style.top = "-1000px";
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand("copy"); } catch (e) { /* rien */ }
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

  /* ------------------------------------------------------
     9. Header + menu mobile
     ------------------------------------------------------ */
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

    var toggle = document.querySelector("[data-menu-toggle]");
    var overlay = document.querySelector("[data-menu]");
    if (!toggle || !overlay) return;
    var open = false;
    function setMenu(state) {
      open = state;
      overlay.classList.toggle("is-open", open);
      toggle.textContent = open ? (toggle.dataset.close || "Fermer") : (toggle.dataset.open || "Menu");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (lenis) { if (open) { lenis.stop(); } else { lenis.start(); } }
      document.documentElement.classList.toggle("lenis-stopped", open);
    }
    toggle.addEventListener("click", function () { setMenu(!open); });
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) setMenu(false);
    });
  }

  /* ------------------------------------------------------
     10. Carrousels — plusieurs visuels dans un meme cadre.
        Ils avancent seuls toutes les 3 s, et s arretent tant que le
        pointeur reste dessus.
     ------------------------------------------------------ */
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
      // Toute intervention remet le compte a zero : la vue choisie a droit
      // aux memes 3 s que les autres.
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

      // Le defilement ne declenche aucun evenement de souris : mouseleave
      // ne partirait pas si le carrousel quittait l ecran sous un pointeur
      // immobile, et il resterait en pause. On relit donc ce qui se trouve
      // sous le pointeur, comme pour les cartes.
      Hover.on(function (el) {
        var dessus = el && el.closest ? el.closest("[data-carousel]") === box : false;
        if (dessus) pause(); else play();
      });
      // Un onglet en arriere-plan n a pas a defiler dans le vide.
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) pause(); else play();
      });

      go(0);
      play();
    });
  }

  /* ------------------------------------------------------
     11. Retour en haut de page
     ------------------------------------------------------ */
  function initToTop() {
    document.querySelectorAll("[data-to-top]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (lenis) lenis.scrollTo(0, { duration: 1.1 });
        else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
      });
    });
  }

  /* ------------------------------------------------------
     12. Agrandissement des images
     ------------------------------------------------------ */
  function initLightbox() {
    var main = document.querySelector("main");
    if (!main) return;

    // Ce qui s agrandit : les visuels de contenu. On ecarte les vignettes
    // de vidéo, le badge de la fiche technique et tout ce qui est deja un
    // lien — cliquer dessus doit continuer de mener ailleurs.
    function zoomable(img) {
      if (!img || img.tagName !== "IMG") return null;
      if (img.closest("a")) return null;
      if (img.classList.contains("video__poster")) return null;
      if (img.closest(".spec")) return null;
      return img.closest(".figure, .carousel__slide") ? img : null;
    }

    // Le pointeur annonce ce que le clic fera.
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

    // Pose sur documentElement, comme le panneau de transition : le body
    // est mis a l echelle pendant les changements de page.
    document.documentElement.appendChild(boite);

    var ouverte = false;

    function ouvrir(img) {
      // currentSrc : le fichier que le navigateur a reellement choisi dans
      // le <picture>, donc deja en cache. Rien de plus a telecharger.
      vue.src = img.currentSrc || img.src;
      vue.alt = img.alt || "";
      fermer.setAttribute("aria-label", I18N.t("ui.close", "Fermer"));
      boite.hidden = false;
      void boite.offsetWidth;          // force le point de depart de la transition
      boite.classList.add("is-open");
      ouverte = true;
      if (lenis) lenis.stop();
      document.documentElement.classList.add("lenis-stopped");
      fermer.focus();
    }

    function refermer() {
      if (!ouverte) return;
      ouverte = false;
      boite.classList.remove("is-open");
      if (lenis) lenis.start();
      document.documentElement.classList.remove("lenis-stopped");
      // On attend la fin du fondu pour retirer l image de l affichage.
      setTimeout(function () { if (!ouverte) { boite.hidden = true; vue.src = ""; } }, 400);
    }

    main.addEventListener("click", function (e) {
      var img = zoomable(e.target);
      if (!img) return;
      e.preventDefault();
      ouvrir(img);
    });

    boite.addEventListener("click", refermer);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") refermer();
    });
  }

  /* ------------------------------------------------------
     13. Transition de page
     Le contenu tombe ; le curseur grandit jusqu'à un cercle d'un quart
     de la largeur de l'écran ; le point longe ce cercle sur un tour
     complet ; le curseur revient sous la souris ; la page charge.
     Durée totale : ~0,95 s.
     ------------------------------------------------------ */
  var SLIDE = 540;

  function runTransition(href) {
    if (lenis) lenis.stop();

    // La page suivante reprendra le curseur ou il se trouve.
    try { sessionStorage.setItem("as-cursor", Cursor.x + "," + Cursor.y); } catch (e) { /* noop */ }

    // Le panneau est accroche a <html> et non a <body> : body est mis a
    // l'echelle pendant la transition, un enfant serait reduit avec lui et
    // ne couvrirait plus l'ecran.
    var panel = document.createElement("div");
    panel.className = "page-slide";
    document.documentElement.appendChild(panel);
    void panel.offsetWidth; // force le calcul avant d'animer

    document.body.classList.add("is-leaving");
    panel.classList.add("is-up");

    setTimeout(function () { window.location.href = href; }, SLIDE);
  }

  function initPageTransition() {
    var main = document.querySelector("main");
    if (main && !reduced) main.classList.add("page-in");

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

  /* ------------------------------------------------------
     14. Bilingue FR / EN
     ------------------------------------------------------ */
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
      try { saved = localStorage.getItem(I18N.key); } catch (e) { /* noop */ }
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

      var mt = document.querySelector("[data-menu-toggle]");
      if (mt) {
        if (!mt.dataset.frOpen) {
          mt.dataset.frOpen = mt.dataset.open;
          mt.dataset.frClose = mt.dataset.close;
        }
        mt.dataset.open = (toEN && dict["menu.open"]) ? dict["menu.open"] : mt.dataset.frOpen;
        mt.dataset.close = (toEN && dict["menu.close"]) ? dict["menu.close"] : mt.dataset.frClose;
        if (mt.getAttribute("aria-expanded") !== "true") mt.textContent = mt.dataset.open;
      }

      document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.langBtn === lang);
      });

      try { localStorage.setItem(I18N.key, lang); } catch (e) { /* noop */ }
      if (hasGSAP && window.ScrollTrigger) window.ScrollTrigger.refresh();
    },

    init: function () {
      I18N.apply(I18N.detect());
      document.querySelectorAll("[data-lang-btn]").forEach(function (b) {
        b.addEventListener("click", function () { I18N.apply(b.dataset.langBtn); });
      });
    }
  };

  /* ------------------------------------------------------
     Boot
     ------------------------------------------------------ */
  function boot() {
    initPreloader();
    initSmoothScroll();
    initHeader();
    initCursor();
    initBrand();
    initPageTransition();
    I18N.init();
    initCarousels();
    initToTop();
    initLightbox();
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
