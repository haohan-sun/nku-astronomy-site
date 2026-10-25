/* ==========================================================================
   NKAA · 交互脚本
   1. 星空 2. 导航 3. 内容渲染（画廊/足迹） 4. 滚动揭示 5. 灯箱 6. 本月星空
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------------- 1. 星空 */
  function initSky() {
    var canvas = $("#sky");
    var hero = $(".hero");
    if (!canvas || !hero || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var stars = [];
    var shooting = null;
    var nextShoot = 2200 + Math.random() * 4000;
    var t = 0;
    var raf = null;
    var mouseX = 0, mouseY = 0, px = 0, py = 0;
    var visible = true;

    function resize() {
      var r = hero.getBoundingClientRect();
      w = Math.max(320, Math.round(r.width));
      h = Math.max(420, Math.round(r.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduceMotion) draw(0);
    }

    function build() {
      var n = Math.round((w * h) / 2200);
      n = Math.max(390, Math.min(n, 1170));
      stars = [];
      for (var i = 0; i < n; i++) {
        var depth = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: depth > 0.94 ? 1.1 + Math.random() * 1.1 : 0.3 + Math.random() * 0.8,
          a: 0.25 + Math.random() * 0.6,
          depth: depth,
          phase: Math.random() * Math.PI * 2,
          spd: 0.4 + Math.random() * 1.4,
          warm: Math.random() > 0.86
        });
      }
    }

    function draw(time) {
      t = time;
      ctx.clearRect(0, 0, w, h);

      var scrollShift = window.scrollY * 0.12;
      px += (mouseX - px) * 0.045;
      py += (mouseY - py) * 0.045;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var tw = 0.62 + 0.38 * Math.sin(t * 0.0009 * s.spd + s.phase);
        var alpha = s.a * tw;
        var sx = s.x + px * s.depth * 18;
        var sy = s.y - scrollShift * s.depth + py * s.depth * 14;
        if (sy < -10 || sy > h + 10) continue;

        if (s.r > 1.1) {
          var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5);
          g.addColorStop(0, s.warm ? "rgba(232,200,255," + alpha * 0.45 + ")" : "rgba(238,230,255," + alpha * 0.45 + ")");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, s.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = s.warm
          ? "rgba(230,198,242," + alpha + ")"
          : "rgba(240,236,255," + alpha + ")";
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduceMotion) {
        if (!shooting && time > nextShoot) {
          shooting = {
            x: w * (0.15 + Math.random() * 0.7),
            y: h * (0.05 + Math.random() * 0.35),
            vx: -(2.2 + Math.random() * 2.4),
            vy: 1.1 + Math.random() * 1.2,
            life: 0,
            max: 60 + Math.random() * 30
          };
        }
        if (shooting) {
          shooting.life++;
          shooting.x += shooting.vx;
          shooting.y += shooting.vy;
          var k = 1 - shooting.life / shooting.max;
          if (k <= 0) {
            shooting = null;
            nextShoot = time + 5000 + Math.random() * 9000;
          } else {
            var tailX = shooting.x - shooting.vx * 9;
            var tailY = shooting.y - shooting.vy * 9;
            var lg = ctx.createLinearGradient(shooting.x, shooting.y, tailX, tailY);
            lg.addColorStop(0, "rgba(244,232,255," + (0.85 * k) + ")");
            lg.addColorStop(1, "rgba(244,232,255,0)");
            ctx.strokeStyle = lg;
            ctx.lineWidth = 1.3;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(shooting.x, shooting.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
          }
        }
      }
    }

    function loop(time) {
      if (visible && !document.hidden) draw(time);
      raf = requestAnimationFrame(loop);
    }

    resize();
    if (reduceMotion) {
      draw(0);
      return;
    }
    raf = requestAnimationFrame(loop);

    var rTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(rTimer);
      rTimer = setTimeout(resize, 180);
    });

    window.addEventListener("pointermove", function (e) {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) nextShoot = performance.now() + 1500;
    });
  }

  /* -------------------------------------------------------------- 2. 导航 */
  function initNav() {
    var nav = $("#nav");
    var burger = $("#burger");
    var links = $("#navLinks");
    var bar = $("#progressBar");

    function onScroll() {
      var y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle("is-stuck", y > 40);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(y / max, 1) : 0;
        bar.style.width = (p * 100).toFixed(2) + "%";
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && links) {
      burger.addEventListener("click", function () {
        var open = links.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
      });
      $$("a", links).forEach(function (a) {
        a.addEventListener("click", function () {
          links.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          links.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
    }

    var navLinks = $$('#navLinks a[href^="#"]');
    var railLinks = $$('.rail a[href^="#"]');
    var all = navLinks.concat(railLinks);
    var sections = [];
    all.forEach(function (a) {
      var el = document.getElementById(a.getAttribute("href").slice(1));
      if (el && sections.indexOf(el) < 0) sections.push(el);
    });

    if ("IntersectionObserver" in window && sections.length) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          all.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      }, { rootMargin: "-42% 0px -52% 0px", threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
    }
  }

  /* ---------------------------------------------------------- 3. 内容渲染 */
  function renderGallery() {
    var astroBox = $("#galleryAstro");
    var eventBox = $("#galleryEvent");
    var data = window.NKAA && window.NKAA.gallery;
    if (!data || (!astroBox && !eventBox)) return;

    var astro = "", event = "";
    data.forEach(function (item, i) {
      var cap = item.date ? "<span>" + item.date + "</span>" : "";
      var html = '<figure class="shot reveal" tabindex="0" role="button" data-index="' + i + '">' +
        '<img src="' + item.src + '" alt="' + (item.title || "") + '" loading="lazy"' +
        ' width="' + (item.w || 1600) + '" height="' + (item.h || 1067) + '">' +
        "<figcaption><b>" + (item.title || "") + "</b>" + cap + "</figcaption>" +
        "</figure>";
      if (item.kind === "event") event += html;
      else astro += html;
    });

    if (astroBox) astroBox.innerHTML = astro;
    if (eventBox) eventBox.innerHTML = event;
  }

  function renderJourney() {
    var box = $("#journeyList");
    var data = window.NKAA && window.NKAA.journey;
    if (!box || !data) return;

    var html = "";
    data.forEach(function (item) {
      html += '<li class="reveal"><time>' + item.time + "</time><b>" + item.title + "</b>" +
        (item.note ? "<span>" + item.note + "</span>" : "") + "</li>";
    });
    box.innerHTML = html;
  }

  /* ------------------------------------------------------ 3b. 近期活动手风琴 */
  function renderUpcoming() {
    var box = $("#upcomingList");
    var data = window.NKAA && window.NKAA.upcoming;
    if (!box || !data) return;

    var sky = (window.NKAA.skyNotes || {})[new Date().getMonth() + 1];

    box.innerHTML = data.map(function (item, i) {
      var isSky = !!item.sky;
      var title = isSky ? (sky ? sky[0] : "本月星空") : item.title;
      var detail = isSky ? (sky ? sky[1] : "") : item.detail;
      var tag = isSky ? "天象" : item.tag;
      var meta = isSky ? [] : (item.meta || []);

      var metaHtml = meta.map(function (m) {
        return "<div><dt>" + m[0] + "</dt><dd>" + m[1] + "</dd></div>";
      }).join("");

      return '<li class="up">' +
        '<button class="up__head" type="button" aria-expanded="false" aria-controls="upBody' + i + '">' +
          '<span class="up__date">' + item.date + "</span>" +
          '<span class="up__title">' + title + "</span>" +
          (tag ? '<span class="up__tag">' + tag + "</span>" : "") +
          '<span class="up__plus" aria-hidden="true"></span>' +
        "</button>" +
        '<div class="up__body" id="upBody' + i + '" hidden>' +
          "<p>" + detail + "</p>" +
          (metaHtml ? "<dl>" + metaHtml + "</dl>" : "") +
        "</div>" +
        "</li>";
    }).join("");

    $$(".up__head", box).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var li = btn.parentNode;
        var body = $(".up__body", li);
        var open = li.classList.toggle("is-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (body) body.hidden = !open;
      });
    });
  }

  /* ---------------------------------------------------------- 4. 滚动揭示 */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------------------- 5. 灯箱 */
  function initLightbox() {
    var box = $("#lightbox");
    var img = $("#lbImg");
    var title = $("#lbTitle");
    var meta = $("#lbMeta");
    var count = $("#lbCount");
    var closeBtn = $("#lbClose");
    var shots = $$(".shot");
    if (!box || !img || !shots.length) return;

    var index = 0;
    var lastFocus = null;

    function fill(fig) {
      var item = (window.NKAA.gallery || [])[Number(fig.getAttribute("data-index"))] || {};
      var source = $("img", fig);

      img.src = source.getAttribute("src");
      img.alt = source.getAttribute("alt") || "";
      if (title) title.textContent = item.title || "";

      if (meta) {
        var rows = [
          ["时间", item.date],
          ["地点", item.place],
          ["活动", item.event],
          ["拍摄人", item.author]
        ];
        var html = "";
        rows.forEach(function (r) {
          if (r[1]) html += "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>";
        });
        if (!html) html = "<div><dt>说明</dt><dd>这张照片的信息还没补上</dd></div>";
        meta.innerHTML = html;
      }
      if (count) count.textContent = (index + 1) + " / " + shots.length;
    }

    function show(i) {
      index = (i + shots.length) % shots.length;
      fill(shots[index]);
      box.hidden = false;
      requestAnimationFrame(function () { box.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
    }

    function close() {
      box.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(function () { box.hidden = true; }, 320);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function bind() {
      shots.length = 0;
      $$(".shot").forEach(function (fig, i) {
        shots.push(fig);
        fig.addEventListener("click", function () { open(i); });
        fig.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open(i);
          }
        });
      });
    }
    bind();

    if (closeBtn) closeBtn.addEventListener("click", close);
    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(index + 1);
      if (e.key === "ArrowLeft") show(index - 1);
    });
  }

  /* ------------------------------------------------------ 5b. 全站星场 */
  function initSkyField() {
    var canvas = $("#skyField");
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, stars = [], dust = [], band = [], micro = [], deco = [], crosses = [], meteors = [], nextMeteor = 0;
    var trails = [], echoes = [], nebulas = [], constellations = [];
    var sats = [], comets = [], nextSat = 0, nextComet = 0;
    var fireballs = [], glows = [];
    var shower = [], nextShower = 0, showerState = null;
    var hole = null;
    var raf = null, last = 0;

    /* 真实星座：每颗星是 [赤经(小时), 赤纬(度), 星等]，
       画之前按各自中心做一次投影，形状和天上的比例一致。
       八组按季节轮换，当季的才出现 */
    var ALL_SHAPES = [
      {
        fx: 0.10, fy: 0.06, size: 0.30, d: 0.5, v: 0.05, ra0: 12.6, dec0: 56,
        stars: [
          [11.0621, 61.7509, 1.79], // 天枢 Dubhe
          [11.0307, 56.3824, 2.37], // 天璇 Merak
          [11.8972, 53.6948, 2.44], // 天玑 Phecda
          [12.2571, 57.0326, 3.31], // 天权 Megrez
          [12.9005, 55.9598, 1.77], // 玉衡 Alioth
          [13.3988, 54.9254, 2.23], // 开阳 Mizar
          [13.7923, 49.3133, 1.86]  // 摇光 Alkaid
        ],
        edges: [[0,1],[1,2],[2,3],[3,0],[3,4],[4,5],[5,6]]
      },
      {
        fx: 0.72, fy: 0.06, size: 0.26, d: 0.62, v: 0.04, ra0: 5.6, dec0: 0,
        stars: [
          [5.9195, 7.4071, 0.50],  // 参宿四 Betelgeuse
          [5.4189, 6.3497, 1.64],  // 参宿五 Bellatrix
          [5.6793, -1.9426, 1.77], // 参宿一 Alnitak
          [5.6036, -1.2020, 1.69], // 参宿二 Alnilam
          [5.5334, -0.2991, 2.25], // 参宿三 Mintaka
          [5.7959, -9.6696, 2.06], // 参宿七? 实为 Saiph 参宿六
          [5.2423, -8.2016, 0.13]  // 参宿七 Rigel
        ],
        edges: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[0,1]]
      },
      {
        fx: 0.46, fy: 0.60, size: 0.24, d: 0.4, v: 0.06, ra0: 20.3, dec0: 38,
        stars: [
          [20.6905, 45.2803, 1.25], // 天津四 Deneb
          [20.3705, 40.2567, 2.23], // 天津一 Sadr
          [19.5120, 27.9597, 3.05], // 辇道增七 Albireo
          [19.7496, 45.1308, 2.86], // 天津二
          [20.7702, 33.9703, 2.48]  // 天津九
        ],
        edges: [[0,1],[1,2],[1,3],[1,4]]
      },
      {
        fx: 0.80, fy: 0.62, size: 0.20, d: 0.55, v: 0.045, ra0: 1.0, dec0: 58,
        stars: [
          [0.6751, 56.5373, 2.24],  // 王良四 Schedar
          [0.1529, 59.1498, 2.28],  // 王良一 Caph
          [0.9451, 60.7167, 2.47],  // 策 Gamma
          [1.4303, 60.2353, 2.68],  // 阁道三 Ruchbah
          [1.9066, 63.6701, 3.38]   // 阁道二 Segin
        ],
        edges: [[1,0],[0,2],[2,3],[3,4]]
      },
      { /* 狮子座 Leo */
        fx: 0.50, fy: 0.14, size: 0.22, d: 0.45, v: 0.05, ra0: 11.0, dec0: 17,
        stars: [
          [10.1395, 11.9672, 1.36], // 轩辕十四 Regulus
          [10.3328, 19.8415, 2.08], // 轩辕十二 Algieba
          [10.2781, 23.4173, 3.44], // 轩辕十一 Adhafera
          [9.7644, 23.7743, 2.98],  // 轩辕九 Epsilon
          [11.2351, 20.5237, 2.56], // 太微右垣五 Zosma
          [11.2373, 15.4298, 3.33], // 西上相 Chort
          [11.8177, 14.5721, 2.14]  // 五帝座一 Denebola
        ],
        edges: [[0,1],[1,2],[2,3],[1,4],[4,6],[0,5],[5,6]]
      },
      { /* 天蝎座 Scorpius */
        fx: 0.15, fy: 0.56, size: 0.26, d: 0.5, v: 0.05, ra0: 16.8, dec0: -28,
        stars: [
          [16.4901, -26.4320, 0.96], // 心宿二 Antares
          [16.0056, -22.6217, 2.29], // 房宿三 Dschubba
          [16.0906, -19.8055, 2.62], // 房宿四 Graffias
          [15.9834, -26.1140, 2.89], // 房宿二 Pi
          [17.6219, -42.9978, 1.86], // 尾宿五 Sargas
          [17.5601, -37.1038, 1.62], // 尾宿八 Shaula
          [17.5127, -37.2958, 2.69]  // 尾宿九 Lesath
        ],
        edges: [[2,1],[1,0],[0,3],[0,5],[5,4],[5,6]]
      },
      { /* 飞马座 Pegasus */
        fx: 0.30, fy: 0.30, size: 0.22, d: 0.45, v: 0.05, ra0: 0.0, dec0: 22,
        stars: [
          [23.0794, 15.2053, 2.48], // 室宿一 Markab
          [23.0629, 28.0828, 2.42], // 室宿二 Scheat
          [0.1398, 29.0904, 2.06],  // 壁宿二 Alpheratz
          [0.2206, 15.1836, 2.83],  // 壁宿一 Algenib
          [21.7364, 9.8750, 2.39]   // 危宿三 Enif
        ],
        edges: [[0,1],[1,2],[2,3],[3,0],[0,4]]
      },
      { /* 天琴座 Lyra */
        fx: 0.86, fy: 0.12, size: 0.18, d: 0.6, v: 0.04, ra0: 18.8, dec0: 36,
        stars: [
          [18.6156, 38.7837, 0.03], // 织女一 Vega
          [18.7461, 37.6051, 4.36], // 织女二 Zeta
          [18.9083, 36.8986, 4.30], // 渐台二 Delta
          [18.9824, 32.6896, 3.25], // 渐台三 Sulafat
          [18.8346, 33.3627, 3.52]  // 渐台一 Sheliak
        ],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,1]]
      }
    ];

    /* 按月挑当季星座：冬猎户北斗、春狮子、夏天蝎天鹅天琴、秋飞马仙后 */
    var MONTH = new Date().getMonth();
    var seasonKey = (MONTH === 11 || MONTH <= 1) ? "winter"
      : MONTH <= 4 ? "spring"
      : MONTH <= 7 ? "summer" : "autumn";
    var SEASON = {
      winter: [2, 0, 7],
      spring: [0, 1, 2],
      summer: [3, 4, 5],
      autumn: [6, 7, 4]
    };
    var shapes = (SEASON[seasonKey] || SEASON.winter).map(function (i) { return ALL_SHAPES[i]; });

    (function projectAll() {
      var rad = Math.PI / 180;
      shapes.forEach(function (sh) {
        var pts = sh.stars.map(function (s) {
          var dRA = s[0] - sh.ra0;
          if (dRA > 12) dRA -= 24;
          if (dRA < -12) dRA += 24;
          return [
            -dRA * Math.cos(sh.dec0 * rad) * 15,
            -(s[1] - sh.dec0)
          ];
        });
        var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
        pts.forEach(function (p) {
          if (p[0] < minx) minx = p[0];
          if (p[0] > maxx) maxx = p[0];
          if (p[1] < miny) miny = p[1];
          if (p[1] > maxy) maxy = p[1];
        });
        var w = maxx - minx || 1, h = maxy - miny || 1;
        var scale = 1 / Math.max(w, h);
        var cx = (minx + maxx) / 2, cy = (miny + maxy) / 2;
        sh.pts = pts.map(function (p) {
          return [(p[0] - cx) * scale + 0.5, (p[1] - cy) * scale + 0.5];
        });
        sh.mags = sh.stars.map(function (s) { return s[2]; });
      });
    })();

    var drift = 0;

    function build() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      meteors = [];
      trails = [];
      echoes = [];
      nebulas = [];
      constellations = [];
      sats = [];
      comets = [];
      fireballs = [];
      glows = [];
      shower = [];
      showerState = null;
      nextShower = 0;
      nextMeteor = 0;
      nextSat = 0;
      nextComet = 0;
      hole = null;
      regen = null;
      regenBank = null;
      document.body.classList.remove("is-sucked");
      document.body.classList.remove("is-collapsing");
      lastSuck = -1;

      dust = [];
      for (var q = 0; q < 18; q++) {
        dust.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 16 + Math.random() * 48,
          a: 0.025 + Math.random() * 0.045,
          v: 0.05 + Math.random() * 0.16,
          d: 0.2 + Math.random() * 0.5
        });
      }

      var n = Math.max(420, Math.min(1500, Math.round((w * h) / 1533)));
      stars = [];
      for (var i = 0; i < n; i++) {
        var mag = Math.random();
        var bright = mag > 0.94;
        // 三层景深：远层慢而小，近层快而亮
        var roll = Math.random();
        var depth = roll < 0.5 ? 0.14 + Math.random() * 0.12
          : roll < 0.86 ? 0.42 + Math.random() * 0.18
          : 0.82 + Math.random() * 0.4;
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: (bright ? 1.1 + Math.random() * 1.05 : 0.22 + mag * 0.95) * (0.75 + depth * 0.45),
          a: (bright ? 0.55 + Math.random() * 0.4 : 0.14 + Math.random() * 0.52) * (0.7 + depth * 0.45),
          d: depth,
          v: (0.12 + Math.random() * 0.5) * depth,
          warm: Math.random() > 0.86,
          glow: mag > 0.975
        });
      }

      /* 十字光芒星：原来在 CSS 里，现在放进画布，才能跟着星空一起动 */
      crosses = [];
      var crossN = window.innerWidth < 760 ? 7 : 12;
      for (var cx2 = 0; cx2 < crossN; cx2++) {
        crosses.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 7 + Math.pow(Math.random(), 1.5) * 13,
          a: 0.45 + Math.random() * 0.5,
          d: 0.35 + Math.random() * 0.5,
          v: 0.05 + Math.random() * 0.12,
          ph: Math.random() * Math.PI * 2,
          tw: 0.0005 + Math.random() * 0.0011,
          warm: Math.random() < 0.35
        });
      }

      /* 底层暗星：铺满整块屏幕，只作纹理，不参与点击 */
      deco = [];
      var decoN = Math.round(n * (window.innerWidth < 760 ? 1.6 : 3.1));
      for (var dj = 0; dj < decoN; dj++) {
        deco.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.5 + Math.random() * 0.8,
          a: 0.05 + Math.random() * 0.13,
          d: 0.08 + Math.random() * 0.3,
          v: 0.04 + Math.random() * 0.16,
          warm: Math.random() > 0.88
        });
      }

      /* 微星：比主星场更小更暗的一层，只为把背景垫出细颗粒 */
      micro = [];
      var microN = Math.round(n * 0.55);
      for (var mi2 = 0; mi2 < microN; mi2++) {
        micro.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.14 + Math.random() * 0.32,
          a: 0.06 + Math.random() * 0.20,
          d: 0.1 + Math.random() * 0.35,
          v: 0.05 + Math.random() * 0.2,
          warm: Math.random() > 0.9
        });
      }

      /* 银河带：沿一条斜线密集铺一层极小的星，越靠中心越亮 */
      band = [];
      var bandCount = Math.round(n * 1.9);
      var x0 = -0.06 * w, y0 = -0.12 * h, x1 = 1.06 * w, y1 = 1.12 * h;
      var dx = x1 - x0, dy = y1 - y0;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / len, ny = dx / len;
      var halfW = Math.min(w, h) * 0.30;
      for (var b = 0; b < bandCount; b++) {
        var bt = Math.random();
        var spread = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
        var off = spread * halfW;
        var edge = 1 - Math.min(1, Math.abs(spread));
        band.push({
          x: x0 + dx * bt + nx * off,
          y: y0 + dy * bt + ny * off,
          r: 0.4 + Math.random() * 0.9,
          a: (0.10 + Math.random() * 0.42) * (0.30 + edge * 1.0),
          warm: Math.random() > 0.8
        });
      }
    }

    /* 爆炸那一刻把整片星空收走，之后靠这份备份慢慢铺回来 */
    var regen = null;
    var regenBank = null;
    var shapeAlpha = 1;

    function clearSky() {
      regenBank = { stars: stars.slice(), band: band.slice(), micro: micro.slice(), deco: deco.slice(), crosses: crosses.slice() };
      stars = [];
      band = [];
      micro = [];
      deco = [];
      crosses = [];
      meteors.length = 0;
      sats.length = 0;
      comets.length = 0;
      trails.length = 0;
      echoes.length = 0;
      nebulas.length = 0;
      constellations.length = 0;
      fireballs.length = 0;
      glows.length = 0;
      shower.length = 0;
      showerState = null;
      shapeAlpha = 0;
    }

    function startRegen(time) {
      var bk = regenBank || { stars: [], band: [], micro: [], deco: [], crosses: [] };
      regenBank = null;
      regen = {
        at: time + 1000,
        started: false,
        t0: 0,
        dur: 5200,
        totalS: bk.stars.length,
        totalB: bk.band.length,
        totalM: (bk.micro || []).length,
        totalD: (bk.deco || []).length,
        totalX: (bk.crosses || []).length,
        stars: bk.stars,
        band: bk.band,
        micro: bk.micro || [],
        deco: bk.deco || [],
        crosses: bk.crosses || []
      };
      shapeAlpha = 0;
      nextMeteor = time + 9000 + Math.random() * 5000;
      nextSat = time + 20000;
      nextComet = time + 28000;
    }

    /* 黑洞本体：吸积盘 + 光子环 + 绝对黑的核心 */
    function drawHoleFx(time) {
      var el = Math.max(0, time - hole.t0) - hole.fade;
      var hx = hole.x, hy = hole.sy;
      if (el < 0) return;
      if (el < hole.pull) {
        var p = el / hole.pull;
        var r = 9 + p * p * 58;
        var halo = ctx.createRadialGradient(hx, hy, r * 0.6, hx, hy, r * 4);
        halo.addColorStop(0, "rgba(168,110,236," + (0.55 * p) + ")");
        halo.addColorStop(0.42, "rgba(96,44,170," + (0.26 * p) + ")");
        halo.addColorStop(1, "rgba(40,10,70,0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(hx, hy, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // 大范围的紫色环境光：让“被吸走”的过程看起来是发光而不是变黑
        var ambient = ctx.createRadialGradient(hx, hy, r * 1.2, hx, hy, r * 13);
        ambient.addColorStop(0, "rgba(150,96,226," + (0.30 * p) + ")");
        ambient.addColorStop(0.45, "rgba(96,52,160," + (0.13 * p) + ")");
        ambient.addColorStop(1, "rgba(60,24,110,0)");
        ctx.fillStyle = ambient;
        ctx.beginPath();
        ctx.arc(hx, hy, r * 13, 0, Math.PI * 2);
        ctx.fill();

        // 光子环：光线绕着黑洞转一圈才出来，看起来就是一圈亮环
        var photon = ctx.createRadialGradient(hx, hy, r * 0.94, hx, hy, r * 1.85);
        photon.addColorStop(0, "rgba(255,255,255,0)");
        photon.addColorStop(0.16, "rgba(255,252,255," + (0.98 * p) + ")");
        photon.addColorStop(0.34, "rgba(226,180,255," + (0.72 * p) + ")");
        photon.addColorStop(0.66, "rgba(158,102,230," + (0.26 * p) + ")");
        photon.addColorStop(1, "rgba(120,70,200,0)");
        ctx.fillStyle = photon;
        ctx.beginPath();
        ctx.arc(hx, hy, r * 1.85, 0, Math.PI * 2);
        ctx.fill();

        // 绝对黑的核心
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(hx, hy, r, 0, Math.PI * 2);
        ctx.fill();

        // 贴着视界的一圈细光
        ctx.strokeStyle = "rgba(246,232,255," + (0.9 * p) + ")";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.arc(hx, hy, r + 1, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el < hole.pull + hole.hawk) {
        /* 霍金辐射：黑洞一边缩小，一边向外吐出射线 */
        var hp = Math.max(0, Math.min(1, (el - hole.pull) / hole.hawk));
        var shrink = 1 - hp;
        var cr = 8 + 58 * Math.pow(shrink, 1.6);
        var heat = 0.3 + hp * 0.7;

        // 白热的外发光
        var hgl = ctx.createRadialGradient(hx, hy, cr * 0.75, hx, hy, cr * 5.5);
        hgl.addColorStop(0, "rgba(255,253,250," + (0.42 * heat) + ")");
        hgl.addColorStop(0.4, "rgba(208,228,255," + (0.18 * heat) + ")");
        hgl.addColorStop(1, "rgba(150,186,255,0)");
        ctx.fillStyle = hgl;
        ctx.beginPath();
        ctx.arc(hx, hy, cr * 5.5, 0, Math.PI * 2);
        ctx.fill();

        // 向外的射线
        var rr2 = hole.rays || [];
        for (var ri2 = 0; ri2 < rr2.length; ri2++) {
          var ry = rr2[ri2];
          var prog = ((time * 0.00050 + ry.ph) % 1);
          var d0 = cr * (0.8 + prog * 5.2);
          var d1 = d0 + 10 + prog * 44;
          var ra = Math.sin(prog * Math.PI) * 0.62 * heat * ry.a;
          if (ra <= 0.01) continue;
          var rc = Math.cos(ry.ang), rs = Math.sin(ry.ang);
          var x0 = hx + rc * d0, y0 = hy + rs * d0;
          var x1 = hx + rc * d1, y1 = hy + rs * d1;
          var rl = ctx.createLinearGradient(x0, y0, x1, y1);
          rl.addColorStop(0, "rgba(176,206,255,0)");
          rl.addColorStop(0.55, "rgba(214,232,255," + (ra * 0.45) + ")");
          rl.addColorStop(1, "rgba(255,255,255," + ra + ")");
          ctx.strokeStyle = rl;
          ctx.lineWidth = ry.w;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }

        // 缩小的黑洞本体
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(hx, hy, cr, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(250,252,255," + (0.55 + heat * 0.45) + ")";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(hx, hy, cr + 1, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        var q = Math.min(1, Math.max(0, (el - hole.pull - hole.hawk) / hole.boom));
        var flash = Math.min(1, Math.pow(1 - q, 1.45) * 1.2);
        if (flash > 0.002) {
          ctx.fillStyle = "rgba(255,252,248," + flash + ")";
          ctx.fillRect(0, 0, w, h);
        }
        // 爆发最初的一瞬再压一层纯白
        if (q < 0.16) {
          ctx.fillStyle = "rgba(255,255,255," + ((1 - q / 0.16) * 0.75) + ")";
          ctx.fillRect(0, 0, w, h);
        }
        var rr = 24 + q * Math.max(w, h) * 0.85;
        ctx.strokeStyle = "rgba(255,246,255," + (0.85 * (1 - q)) + ")";
        ctx.lineWidth = 2 + (1 - q) * 5;
        ctx.beginPath();
        ctx.arc(hx, hy, rr, 0, Math.PI * 2);
        ctx.stroke();

        var rr2 = rr * 0.62;
        ctx.strokeStyle = "rgba(206,160,255," + (0.35 * (1 - q)) + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(hx, hy, rr2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    /* 让整页 DOM（文字、卡片、图片）一起被吸进去，再缓慢浮回 */
    var lastSuck = -1;
    function applySuck(p) {
      var root = document.documentElement;
      // 先判断“结束”，否则小于阈值的最后一次不会被清理，页面就再也滚不动了
      if (p <= 0.002) {
        if (lastSuck !== 0) {
          lastSuck = 0;
          root.style.removeProperty("--suck-o");
          document.body.classList.remove("is-collapsing");
        }
        return;
      }
      if (Math.abs(p - lastSuck) < 0.006) return;
      lastSuck = p;
      document.body.classList.add("is-collapsing");
      root.style.setProperty("--suck-o", Math.max(0, 1 - p).toFixed(3));
    }

    /* 点出来的星座：从落点长出一小簇星，连线、呼吸、再慢慢散开。
       坐标存成「天空坐标」，滚动时和星场一起走 */
    var CONST_MAX = 5;
    var AMBIENT_MAX = 2;          /* 背景里自己长出来的，比手点的少、也慢 */
    var ambientNext = 0;
    function spawnConstellation(vx, vy, ambient) {
      if (reduceMotion) return;
      var count = ambient ? 4 + Math.floor(Math.random() * 4) : 5 + Math.floor(Math.random() * 5);
      var pts = [], edges = [], i, k;
      var ang = Math.random() * Math.PI * 2;
      var spread = ambient ? 34 + Math.random() * 40 : 30 + Math.random() * 52;
      for (i = 0; i < count; i++) {
        ang += 0.55 + Math.random() * 1.15;
        var rr = spread * (0.4 + Math.random() * 0.8);
        pts.push({
          x: Math.cos(ang) * rr,
          y: Math.sin(ang) * rr * 0.84,
          r: 0.62 + Math.random() * 0.92,
          at: i * (ambient ? 150 : 95) + Math.random() * 130,
          warm: Math.random() > 0.88
        });
      }
      for (k = 1; k < count; k++) edges.push([k - 1, k]);
      if (Math.random() > 0.35) edges.push([0, Math.min(2, count - 1)]);
      if (count > 5 && Math.random() > 0.5) edges.push([1, Math.min(4, count - 1)]);
      constellations.push({
        x: vx,
        y: vy + (window.scrollY || 0) * 0.12,
        pts: pts,
        edges: edges,
        t0: performance.now(),
        grow: (ambient ? 1100 : 820) + count * 70,
        hold: ambient ? 4200 + Math.random() * 2600 : 2400 + Math.random() * 1500,
        fade: ambient ? 1700 : 1500,
        gold: Math.random() < (ambient ? 0.34 : 0.4),
        ambient: !!ambient
      });
      if (constellations.length > CONST_MAX + AMBIENT_MAX) constellations.shift();
    }

    function drawConstellations(time, scroll, warp, shapeA) {
      if (!constellations.length) return;
      for (var c = constellations.length - 1; c >= 0; c--) {
        var co = constellations[c];
        var age = time - co.t0;
        var total = co.grow + co.hold + co.fade;
        if (age > total) { constellations.splice(c, 1); continue; }
        var fadeK = age > co.grow + co.hold
          ? 1 - (age - co.grow - co.hold) / co.fade
          : 1;
        fadeK = Math.max(0, Math.min(1, fadeK)) * shapeA * (co.ambient ? 0.78 : 1);
        if (fadeK <= 0.01) continue;

        var oy = co.y - scroll * 0.12;
        var ox = co.x;
        var col = co.gold ? "232,200,138" : "214,168,244";
        var col2 = co.gold ? "247,230,189" : "236,220,250";
        var pos = [], i;

        for (i = 0; i < co.pts.length; i++) {
          var pt = co.pts[i];
          var px = ox + pt.x + Math.sin(time * 0.0007 + i) * 0.9;
          var py = oy + pt.y + Math.cos(time * 0.0006 + i) * 0.9;
          var wp = warp(px, py);
          if (wp) { px = wp[0]; py = wp[1]; }
          pos.push([px, py]);
        }

        for (i = 0; i < co.edges.length; i++) {
          var a = co.edges[i][0], b = co.edges[i][1];
          var pa = Math.max(0, Math.min(1, (age - co.pts[a].at) / 280));
          var pb = Math.max(0, Math.min(1, (age - co.pts[b].at) / 280));
          var ea = Math.min(pa, pb) * fadeK * 0.42;
          if (ea <= 0.008) continue;
          ctx.strokeStyle = "rgba(" + col + "," + ea.toFixed(3) + ")";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(pos[a][0], pos[a][1]);
          ctx.lineTo(pos[b][0], pos[b][1]);
          ctx.stroke();
        }

        for (i = 0; i < co.pts.length; i++) {
          var gp = Math.max(0, Math.min(1, (age - co.pts[i].at) / 300));
          if (gp <= 0) continue;
          var na = gp * fadeK;
          var nx = pos[i][0], ny = pos[i][1];
          var glowR = co.pts[i].r * 7;
          var ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, glowR);
          ng.addColorStop(0, "rgba(" + (co.pts[i].warm ? col2 : col) + "," + (na * 0.22).toFixed(3) + ")");
          ng.addColorStop(1, "rgba(" + col + ",0)");
          ctx.fillStyle = ng;
          ctx.beginPath();
          ctx.arc(nx, ny, glowR, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = co.pts[i].warm
            ? "rgba(247,230,189," + (na * 0.95).toFixed(3) + ")"
            : "rgba(" + col2 + "," + (na * 0.92).toFixed(3) + ")";
          ctx.arc(nx, ny, co.pts[i].r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    function draw(time) {
      var dt = last ? Math.min(64, time - last) : 16;
      last = time;
      ctx.clearRect(0, 0, w, h);
      var scroll = window.scrollY || 0;

      if (!reduceMotion) drift += dt * 0.0009;

      /* 爆炸后的空白期，逐帧把星星补回来 */
      if (regen) {
        if (!regen.started && time > regen.at) {
          regen.started = true;
          document.body.classList.remove("is-sucked");
        }
        if (regen.started) {
          if (!regen.t0) regen.t0 = time;
          var rp = Math.min(1, (time - regen.t0) / regen.dur);
          var wantS = Math.round(regen.totalS * rp);
          var wantB = Math.round(regen.totalB * rp);
          var wantM = Math.round(regen.totalM * rp);
          var wantD = Math.round((regen.totalD || 0) * rp);
          while (stars.length < wantS && regen.stars.length) stars.push(regen.stars.pop());
          while (band.length < wantB && regen.band.length) band.push(regen.band.pop());
          while (micro.length < wantM && regen.micro.length) micro.push(regen.micro.pop());
          while (deco.length < wantD && regen.deco && regen.deco.length) deco.push(regen.deco.pop());
          var wantX = Math.round((regen.totalX || 0) * rp);
          while (crosses.length < wantX && regen.crosses && regen.crosses.length) crosses.push(regen.crosses.pop());
          if (!regen.stars.length && !regen.band.length && !regen.micro.length &&
              (!regen.deco || !regen.deco.length) && (!regen.crosses || !regen.crosses.length)) regen = null;
        }
      }
      if (regen && regen.started && regen.t0) {
        shapeAlpha = Math.min(1, (time - regen.t0) / 5200);
      } else if (!regen && !hole && shapeAlpha < 1) {
        shapeAlpha = Math.min(1, shapeAlpha + dt / 3000);
      }

      /* 黑洞：每颗星各自被拉成螺旋，越靠近越扭曲（时空弯曲） */
      var holeX = 0, holeY = 0, holeAmp = 0, holeLive = false, holeCap = 0.86, holeBoost = 1;
      if (hole) {
        hole.sy = hole.y - scroll * 0.12;
        holeX = hole.x;
        holeY = hole.sy;
        var hEl = Math.max(0, time - hole.t0) - hole.fade;
        if (hEl < 0) {
          // 先让文字慢慢隐去，星空还不动
          holeAmp = 0;
          holeLive = false;
        } else if (hEl < hole.pull) {
          var pullP = Math.min(1, hEl / hole.pull);
          holeAmp = Math.pow(pullP, 1.7);
          // 收口随进度收紧：一开始还能看见旋臂，最后全部落进视界
          holeCap = 0.55 + 0.44 * pullP * pullP;
          // 越到后面整体吸力越强，远处的星也会被拽进来
          holeBoost = 1 + pullP * pullP * 3.2;
          holeLive = true;
        } else if (hEl < hole.pull + hole.hawk) {
          // 霍金辐射：星星已经全部被吞掉，只剩黑洞在蒸发
          if (!hole.dumped) {
            hole.dumped = true;
            clearSky();
          }
          holeAmp = 0;
          holeLive = false;
        } else if (hEl < hole.pull + hole.hawk + hole.boom) {
          holeAmp = 0;
          holeLive = false;
        } else {
          hole = null;
          startRegen(time);
        }
      }
      function warpPoint(px, py) {
        if (!holeLive) return null;
        var dx = px - holeX, dy = py - holeY;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var near = 1 / (1 + d / 110);
        var f = holeAmp * (0.45 + near * 1.75) * holeBoost;
        if (f > holeCap) f = holeCap;
        if (f < -1.1) f = -1.1;
        if (f < 0.0006 && f > -0.0006) return null;
        var ang = f * 2.6;
        var ca = Math.cos(ang), sa = Math.sin(ang);
        return [holeX + (dx * ca - dy * sa) * (1 - f), holeY + (dx * sa + dy * ca) * (1 - f), f];
      }
      var suckP = 0;
      if (hole) {
        var hE = Math.max(0, time - hole.t0);
        // 前 1.5 秒只把文字隐去，之后保持隐藏
        suckP = Math.min(1, hE / hole.fade);
      } else if (regen) {
        // 空白期继续隐藏，等星空开始回填再一起淡入
        if (!regen.started || !regen.t0) {
          suckP = 1;
        } else {
          suckP = Math.max(0, 1 - (time - regen.t0) / regen.dur);
        }
      }
      applySuck(suckP);

      ctx.save();

      /* 缓慢上浮的星尘，给整片背景加一点雾感 */
      for (var q2 = 0; q2 < dust.length; q2++) {
        var du = dust[q2];
        if (!reduceMotion) {
          du.y -= du.v * dt * 0.02;
          if (du.y < -du.r * 2) { du.y = h + du.r; du.x = Math.random() * w; }
        }
        var dy = du.y - scroll * 0.05 * du.d;
        if (dy < -du.r * 2 || dy > h + du.r * 2) continue;
        var dux = du.x, duy = dy;
        var wdu = warpPoint(dux, duy);
        if (wdu) { dux = wdu[0]; duy = wdu[1]; }
        var dg = ctx.createRadialGradient(dux, duy, 0, dux, duy, du.r);
        dg.addColorStop(0, "rgba(208,164,242," + du.a + ")");
        dg.addColorStop(1, "rgba(208,164,242,0)");
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(dux, duy, du.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 底层暗星 */
      for (var dc = 0; dc < deco.length; dc++) {
        var dk = deco[dc];
        if (!reduceMotion) {
          dk.y += dk.v * dt * 0.016 * dk.d;
          if (dk.y > h + 4) { dk.y = -4; dk.x = Math.random() * w; }
        }
        var dky = dk.y - scroll * 0.16 * dk.d;
        dky = ((dky % (h + 8)) + h + 8) % (h + 8);
        var wdk = warpPoint(dk.x, dky);
        var dkFade = 1;
        var dkx = dk.x;
        if (wdk) { dkx = wdk[0]; dky = wdk[1]; dkFade = Math.max(0, 1 - wdk[2] * 1.35); }
        if (dkFade <= 0.01) continue;
        ctx.fillStyle = dk.warm
          ? "rgba(226,200,246," + (dk.a * dkFade) + ")"
          : "rgba(236,232,255," + (dk.a * dkFade) + ")";
        ctx.fillRect(dkx, dky, dk.r, dk.r);
      }

      /* 微星层 */
      for (var mg2 = 0; mg2 < micro.length; mg2++) {
        var mu = micro[mg2];
        if (!reduceMotion) {
          mu.y += mu.v * dt * 0.016 * mu.d;
          if (mu.y > h + 4) { mu.y = -4; mu.x = Math.random() * w; }
        }
        var muy = mu.y - scroll * 0.16 * mu.d;
        muy = ((muy % (h + 8)) + h + 8) % (h + 8);
        var mux = mu.x;
        var wmu = warpPoint(mux, muy);
        var muFade = 1;
        if (wmu) { mux = wmu[0]; muy = wmu[1]; muFade = Math.max(0, 1 - wmu[2] * 1.35); }
        if (muFade <= 0.01) continue;
        ctx.fillStyle = mu.warm
          ? "rgba(226,200,246," + (mu.a * muFade) + ")"
          : "rgba(240,236,255," + (mu.a * muFade) + ")";
        ctx.fillRect(mux, muy, mu.r, mu.r);
      }

      /* 银河带：一层很淡的细密星粒 */
      for (var g0 = 0; g0 < band.length; g0++) {
        var bd = band[g0];
        var by = bd.y - scroll * 0.035;
        by = ((by % (h + 40)) + h + 40) % (h + 40) - 20;
        if (by < -10 || by > h + 10) continue;
        var bx = bd.x;
        var wpb = warpPoint(bx, by);
        var bFade = 1;
        if (wpb) { bx = wpb[0]; by = wpb[1]; bFade = Math.max(0, 1 - wpb[2] * 1.35); }
        if (bFade <= 0.01) continue;
        ctx.fillStyle = bd.warm
          ? "rgba(226,200,246," + (bd.a * bFade) + ")"
          : "rgba(236,230,255," + (bd.a * bFade) + ")";
        ctx.fillRect(bx, by, bd.r, bd.r);
      }

      /* 星座：线条 + 节点，跟着星点一起飘（爆炸后慢慢浮回来） */
      if (shapeAlpha > 0.015) {
      for (var c = 0; c < shapes.length; c++) {
        var sh = shapes[c];
        var sc = Math.min(w, h) * sh.size;
        var ox = w * sh.fx;
        var oyBase = h * sh.fy + drift * sh.v * 100 - scroll * 0.09 * sh.d;
        var oy = ((oyBase % (h + sc)) + h + sc) % (h + sc) - sc * 0.3;

        ctx.strokeStyle = "rgba(200,130,225," + (0.24 * shapeAlpha).toFixed(3) + ")";
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        for (var e = 0; e < sh.edges.length; e++) {
          var a = sh.pts[sh.edges[e][0]], b = sh.pts[sh.edges[e][1]];
          var axw = ox + a[0] * sc, ayw = oy + a[1] * sc;
          var bxw = ox + b[0] * sc, byw = oy + b[1] * sc;
          var wa = warpPoint(axw, ayw), wb = warpPoint(bxw, byw);
          if (wa) { axw = wa[0]; ayw = wa[1]; }
          if (wb) { bxw = wb[0]; byw = wb[1]; }
          ctx.moveTo(axw, ayw);
          ctx.lineTo(bxw, byw);
        }
        ctx.stroke();

        for (var p = 0; p < sh.pts.length; p++) {
          var pt = sh.pts[p];
          var px2 = ox + pt[0] * sc, py2 = oy + pt[1] * sc;
          var wpt = warpPoint(px2, py2);
          if (wpt) { px2 = wpt[0]; py2 = wpt[1]; }
          if (py2 < -20 || py2 > h + 20) continue;
          var mag = sh.mags ? sh.mags[p] : 2;
          var rr = Math.max(0.9, 2.4 - mag * 0.46);
          ctx.beginPath();
          ctx.fillStyle = "rgba(196,115,214," + (0.14 * shapeAlpha).toFixed(3) + ")";
          ctx.arc(px2, py2, rr * 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = "rgba(236,220,250," + (0.9 * shapeAlpha).toFixed(3) + ")";
          ctx.arc(px2, py2, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      }

      /* 流星雨：从某个辐射点（可能在屏幕外）涌出一大批 */
      if (!reduceMotion) {
        if (!nextShower) nextShower = time + 26000 + Math.random() * 26000;
        if (!hole && !regen && !showerState && time > nextShower) {
          nextShower = time + 50000 + Math.random() * 45000;
          // 辐射点一律放在屏幕外，避免画面上出现一个"喷发点"
          var sideR = Math.floor(Math.random() * 3);
          var rx, ry;
          if (sideR === 0) {
            rx = -w * (0.9 + Math.random() * 0.5);
            ry = h * (0.05 + Math.random() * 0.9);
          } else if (sideR === 1) {
            rx = w * (1.9 + Math.random() * 0.5);
            ry = h * (0.05 + Math.random() * 0.9);
          } else {
            rx = w * (0.05 + Math.random() * 0.9);
            ry = -h * (0.9 + Math.random() * 0.5);
          }
          showerState = {
            x: rx, y: ry,
            dir: Math.atan2(h * 0.5 - ry, w * 0.5 - rx),
            t0: time,
            dur: 3600 + Math.random() * 2200,
            total: 36 + Math.floor(Math.random() * 24),
            count: 0,
            acc: 0
          };
        }

        if (showerState) {
          var sEl = time - showerState.t0;
          if (sEl > showerState.dur || showerState.count >= showerState.total) {
            showerState = null;
          } else {
            showerState.acc += dt;
            var gap = showerState.dur / showerState.total;
            while (showerState.acc > gap && showerState.count < showerState.total) {
              showerState.acc -= gap;
              showerState.count++;
              // 朝屏幕内均匀随机一个落点，方向自然铺开
              var tgtX = w * (0.03 + Math.random() * 0.94);
              var tgtY = h * (0.03 + Math.random() * 0.94);
              var vdx = tgtX - showerState.x;
              var vdy = tgtY - showerState.y;
              var vlen = Math.sqrt(vdx * vdx + vdy * vdy) || 1;
              var jitS = (Math.random() - 0.5) * 0.16;
              var csS = Math.cos(jitS), snS = Math.sin(jitS);
              var uxS = (vdx / vlen) * csS - (vdy / vlen) * snS;
              var uyS = (vdx / vlen) * snS + (vdy / vlen) * csS;
              // 在"辐射点→落点"这一段上取位置：离源头够远，又不会跑到画面外太远
              var kpos = 0.32 + Math.random() * 0.5;
              var spdS = 0.55 + Math.random() * 0.9;
              var brightS = Math.random();
              var nm = {
                x: showerState.x + vdx * kpos,
                y: showerState.y + vdy * kpos,
                vx: uxS * spdS,
                vy: uyS * spdS,
                life: 420 + Math.random() * 900,
                maxLife: 0,
                a: 0.22 + Math.pow(brightS, 1.8) * 0.75,
                w: 0.9 + Math.pow(brightS, 2) * 1.8,
                gold: Math.random() < 0.1
              };
              shower.push(nm);
              shower[shower.length - 1].maxLife = shower[shower.length - 1].life;
            }
          }
        }
      }

      /* 偶尔划过一颗流星 */
      if (!reduceMotion) {
        if (!nextMeteor) nextMeteor = time + 2500 + Math.random() * 5000;
        if (!hole && !regen && time > nextMeteor) {
          nextMeteor = time + 3200 + Math.random() * 5200;
          var leftward = Math.random() > 0.5;
          var ang = 0.55 + Math.random() * 0.5;

          if (Math.random() < 0.07) {
            /* 火流星：慢、亮、照亮一大片天，落下去以后还留很久 */
            var fsp = 0.85 + Math.random() * 0.45;
            fireballs.push({
              x: w * (0.18 + Math.random() * 0.64),
              y: -60,
              vx: (leftward ? -1 : 1) * Math.cos(ang) * fsp,
              vy: Math.sin(ang) * fsp,
              life: 2600 + Math.random() * 1000,
              maxLife: 0
            });
            fireballs[fireballs.length - 1].maxLife = fireballs[fireballs.length - 1].life;
          } else {
            var gold = Math.random() < 0.14;
            var sp = (gold ? 0.62 : 0.80) + Math.random() * (gold ? 0.45 : 0.55);
            meteors.push({
              x: w * (0.15 + Math.random() * 0.7),
              y: -30,
              vx: (leftward ? -1 : 1) * Math.cos(ang) * sp,
              vy: Math.sin(ang) * sp,
              life: (gold ? 900 : 620) + Math.random() * (gold ? 520 : 420),
              gold: gold,
              maxLife: 0
            });
            meteors[meteors.length - 1].maxLife = meteors[meteors.length - 1].life;
          }
        }

        for (var mi = meteors.length - 1; mi >= 0; mi--) {
          var mt = meteors[mi];
          mt.x += mt.vx * dt;
          mt.y += mt.vy * dt;
          mt.life -= dt;
          if (mt.life <= 0 || mt.y > h + 80 || mt.x < -80 || mt.x > w + 80) {
            // 约四成的流星会留下一道慢慢淡去的余晖
            if (Math.random() < 0.42 && mt.life <= 0) {
              var tl = mt.gold ? 520 : 330;
              trails.push({
                x: mt.x, y: mt.y,
                tx: mt.x - mt.vx * tl, ty: mt.y - mt.vy * tl,
                life: 1500 + Math.random() * 700, maxLife: 2200,
                gold: mt.gold
              });
            }
            meteors.splice(mi, 1);
            continue;
          }

          var op = mt.life / mt.maxLife;
          op = Math.sin(op * Math.PI) * 0.95;
          var tail = mt.gold ? 520 : 330;
          var tx = mt.x - mt.vx * tail;
          var ty = mt.y - mt.vy * tail;

          var mg = ctx.createLinearGradient(mt.x, mt.y, tx, ty);
          if (mt.gold) {
            mg.addColorStop(0, "rgba(255,251,242," + (op * 0.95) + ")");
            mg.addColorStop(0.16, "rgba(246,232,208," + (op * 0.7) + ")");
            mg.addColorStop(0.52, "rgba(220,190,150," + (op * 0.26) + ")");
            mg.addColorStop(1, "rgba(190,155,110,0)");
          } else {
            mg.addColorStop(0, "rgba(255,255,255," + op + ")");
            mg.addColorStop(0.18, "rgba(240,222,255," + (op * 0.75) + ")");
            mg.addColorStop(0.55, "rgba(214,164,244," + (op * 0.28) + ")");
            mg.addColorStop(1, "rgba(196,115,214,0)");
          }
          ctx.strokeStyle = mg;
          ctx.lineWidth = mt.gold ? 2.4 : 1.9;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(mt.x, mt.y);
          ctx.lineTo(tx, ty);
          ctx.stroke();

          var headR = mt.gold ? 20 : 13;
          var mh = ctx.createRadialGradient(mt.x, mt.y, 0, mt.x, mt.y, headR);
          if (mt.gold) {
            mh.addColorStop(0, "rgba(255,252,246," + op + ")");
            mh.addColorStop(0.35, "rgba(244,226,196," + (op * 0.6) + ")");
            mh.addColorStop(1, "rgba(210,175,130,0)");
          } else {
            mh.addColorStop(0, "rgba(255,255,255," + op + ")");
            mh.addColorStop(0.4, "rgba(226,196,250," + (op * 0.5) + ")");
            mh.addColorStop(1, "rgba(196,115,214,0)");
          }
          ctx.fillStyle = mh;
          ctx.beginPath();
          ctx.arc(mt.x, mt.y, headR, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* 人造卫星：匀速划过的小亮点，偶尔翻个身闪一下 */
      if (!reduceMotion) {
        if (!nextSat) nextSat = time + 7000 + Math.random() * 9000;
        if (!hole && !regen && time > nextSat) {
          nextSat = time + 15000 + Math.random() * 16000;
          var fromLeftS = Math.random() > 0.5;
          var spS = 0.075 + Math.random() * 0.075;
          var angS = Math.random() * 0.5 - 0.25;
          sats.push({
            x: fromLeftS ? -40 : w + 40,
            y: h * (0.06 + Math.random() * 0.62),
            vx: (fromLeftS ? 1 : -1) * Math.cos(angS) * spS,
            vy: Math.sin(angS) * spS,
            flash: 0,
            nextFlash: 1000 + Math.random() * 2600
          });
        }
        for (var si = sats.length - 1; si >= 0; si--) {
          var st = sats[si];
          st.x += st.vx * dt;
          st.y += st.vy * dt;
          st.nextFlash -= dt;
          if (st.nextFlash <= 0) { st.flash = 280; st.nextFlash = 1800 + Math.random() * 3400; }
          if (st.flash > 0) st.flash -= dt;
          if (st.x < -90 || st.x > w + 90 || st.y < -90 || st.y > h + 90) { sats.splice(si, 1); continue; }

          var flare = st.flash > 0 ? 1 + Math.sin((1 - st.flash / 280) * Math.PI) * 1.5 : 1;
          var satEdge = Math.min(1, Math.min(st.x, w - st.x) / 90, Math.min(st.y, h - st.y) / 90);
          satEdge = Math.max(0, satEdge);
          var sa = Math.min(1, 0.62 * flare) * satEdge;
          var sr = 6.5 * flare;
          var rg = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, sr);
          rg.addColorStop(0, "rgba(255,253,246," + sa + ")");
          rg.addColorStop(0.38, "rgba(218,230,255," + (sa * 0.38) + ")");
          rg.addColorStop(1, "rgba(160,190,255,0)");
          ctx.fillStyle = rg;
          ctx.beginPath();
          ctx.arc(st.x, st.y, sr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* 彗星：走得慢，一团模糊的彗头拖一条长尾巴 */
      if (!reduceMotion) {
        if (!nextComet) nextComet = time + 22000 + Math.random() * 26000;
        if (!hole && !regen && time > nextComet) {
          nextComet = time + 48000 + Math.random() * 42000;
          var fromLeftC = Math.random() > 0.5;
          var spC = 0.028 + Math.random() * 0.034;
          var angC = Math.random() * 0.6 - 0.3;
          comets.push({
            x: fromLeftC ? -70 : w + 70,
            y: h * (0.05 + Math.random() * 0.55),
            vx: (fromLeftC ? 1 : -1) * Math.cos(angC) * spC,
            vy: Math.sin(angC) * spC,
            tail: 240 + Math.random() * 180,
            alpha: 0.52 + Math.random() * 0.22,
            style: Math.random() < 0.46 ? 0 : (Math.random() < 0.55 ? 1 : 2),
            bend: (Math.random() < 0.5 ? -1 : 1) * (0.10 + Math.random() * 0.16)
          });
        }
        for (var ci = comets.length - 1; ci >= 0; ci--) {
          var cm = comets[ci];
          cm.x += cm.vx * dt;
          cm.y += cm.vy * dt;
          if (cm.x < -140 || cm.x > w + 140 || cm.y < -140 || cm.y > h + 140) { comets.splice(ci, 1); continue; }

          // 跟着星空一起滚动（视差），离屏就丢掉
          var chx = cm.x;
          var chy = cm.y - scroll * 0.10;
          if (chy < -200 || chy > h + 200) continue;

          var fadeC = Math.min(1, Math.min(chx, w - chx) / 150, Math.min(chy, h - chy) / 150);
          fadeC = Math.max(0, fadeC);
          var ca = cm.alpha * fadeC;
          if (ca <= 0.01) continue;

          var csp = Math.sqrt(cm.vx * cm.vx + cm.vy * cm.vy) || 1;
          var cdx = cm.vx / csp, cdy = cm.vy / csp;
          var cpx = -cdy, cpy = cdx;

          // 一条尾巴：len 像素，bend 让尾巴弯一点
          function cometTail(len, bend, baseW, tint, alphaMul) {
            for (var cl = 0; cl < 3; cl++) {
              var bd = bend * (1 + cl * 0.45);
              var ex2 = chx - cdx * len, ey2 = chy - cdy * len;
              var mx3 = (chx + ex2) / 2 + cpx * bd * len;
              var my3 = (chy + ey2) / 2 + cpy * bd * len;
              var cg = ctx.createLinearGradient(chx, chy, ex2, ey2);
              cg.addColorStop(0, "rgba(" + tint + "," + (ca * alphaMul * (0.34 - cl * 0.09)) + ")");
              cg.addColorStop(0.5, "rgba(" + tint + "," + (ca * alphaMul * (0.15 - cl * 0.04)) + ")");
              cg.addColorStop(1, "rgba(" + tint + ",0)");
              ctx.strokeStyle = cg;
              ctx.lineWidth = baseW - cl * (baseW * 0.28);
              ctx.lineCap = "round";
              ctx.beginPath();
              ctx.moveTo(chx, chy);
              ctx.quadraticCurveTo(mx3, my3, ex2, ey2);
              ctx.stroke();
            }
          }

          if (cm.style === 2) {
            // 双尾：一条笔直的离子尾 + 一条弯的尘埃尾
            cometTail(cm.tail * 1.25, cm.bend * 0.12, 9, "168,200,252", 0.9);
            cometTail(cm.tail * 0.82, cm.bend * 1.5, 11, "226,232,246", 0.75);
          } else {
            cometTail(cm.tail, cm.bend, 12, "214,238,255", 1);
          }

          var chg = ctx.createRadialGradient(chx, chy, 0, chx, chy, 18);
          chg.addColorStop(0, "rgba(255,255,255," + (ca * 0.95) + ")");
          chg.addColorStop(0.28, "rgba(220,238,255," + (ca * 0.45) + ")");
          chg.addColorStop(0.62, "rgba(170,200,255," + (ca * 0.12) + ")");
          chg.addColorStop(1, "rgba(150,180,255,0)");
          ctx.fillStyle = chg;
          ctx.beginPath();
          ctx.arc(chx, chy, 18, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      /* 流星雨：大量细小流星同时划出 */
      for (var sh = shower.length - 1; sh >= 0; sh--) {
        var mt2 = shower[sh];
        if (!reduceMotion) {
          mt2.x += mt2.vx * dt;
          mt2.y += mt2.vy * dt;
          mt2.life -= dt;
        }
        if (mt2.life <= 0 || mt2.x < -1400 || mt2.x > w + 1400 || mt2.y < -1400 || mt2.y > h + 1400) {
          shower.splice(sh, 1);
          continue;
        }
        var opS = Math.sin((mt2.life / mt2.maxLife) * Math.PI) * mt2.a;
        if (opS <= 0.01) continue;
        var tSx = mt2.x - mt2.vx * 300;
        var tSy = mt2.y - mt2.vy * 300;
        var gS = ctx.createLinearGradient(mt2.x, mt2.y, tSx, tSy);
        if (mt2.gold) {
          gS.addColorStop(0, "rgba(255,250,236," + opS + ")");
          gS.addColorStop(0.4, "rgba(246,226,190," + (opS * 0.4) + ")");
          gS.addColorStop(1, "rgba(220,180,130,0)");
        } else {
          gS.addColorStop(0, "rgba(255,255,255," + opS + ")");
          gS.addColorStop(0.4, "rgba(226,210,255," + (opS * 0.4) + ")");
          gS.addColorStop(1, "rgba(196,150,240,0)");
        }
        ctx.strokeStyle = gS;
        ctx.lineWidth = mt2.w;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(mt2.x, mt2.y);
        ctx.lineTo(tSx, tSy);
        ctx.stroke();

        ctx.fillStyle = "rgba(255,253,250," + opS + ")";
        ctx.beginPath();
        ctx.arc(mt2.x, mt2.y, mt2.w * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 火流星：照亮整片天，落下去后还有长时间余辉 */
      for (var fi = fireballs.length - 1; fi >= 0; fi--) {
        var fb = fireballs[fi];
        if (!reduceMotion) {
          fb.x += fb.vx * dt;
          fb.y += fb.vy * dt;
          fb.life -= dt;
        }
        if (fb.life <= 0 || fb.y > h + 120 || fb.x < -120 || fb.x > w + 120) {
          glows.push({
            x: Math.max(60, Math.min(w - 60, fb.x)),
            y: Math.max(60, Math.min(h - 60, fb.y)),
            life: 4200, maxLife: 4200
          });
          fireballs.splice(fi, 1);
          continue;
        }

        var fk = Math.sin((fb.life / fb.maxLife) * Math.PI);
        var fo = Math.pow(fk, 0.7);
        var ftx = fb.x - fb.vx * 900;
        var fty = fb.y - fb.vy * 900;

        // 大片照明
        var lg = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, Math.max(w, h) * 0.62);
        lg.addColorStop(0, "rgba(255,244,224," + (fo * 0.20) + ")");
        lg.addColorStop(0.35, "rgba(255,214,170," + (fo * 0.08) + ")");
        lg.addColorStop(1, "rgba(255,190,140,0)");
        ctx.fillStyle = lg;
        ctx.fillRect(0, 0, w, h);

        // 粗尾巴
        // 尾巴：细，但很亮
        for (var fl = 0; fl < 3; fl++) {
          var fg = ctx.createLinearGradient(fb.x, fb.y, ftx, fty);
          fg.addColorStop(0, "rgba(255,255,250," + (fo * (0.95 - fl * 0.25)) + ")");
          fg.addColorStop(0.3, "rgba(255,236,200," + (fo * (0.55 - fl * 0.15)) + ")");
          fg.addColorStop(1, "rgba(255,196,140,0)");
          ctx.strokeStyle = fg;
          ctx.lineWidth = 5.5 - fl * 1.6;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(fb.x, fb.y);
          ctx.lineTo(ftx, fty);
          ctx.stroke();
        }

        // 头：小而极亮，外面一圈很淡的光晕
        var fbloom = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, 56);
        fbloom.addColorStop(0, "rgba(255,248,236," + (fo * 0.42) + ")");
        fbloom.addColorStop(0.45, "rgba(255,224,186," + (fo * 0.12) + ")");
        fbloom.addColorStop(1, "rgba(255,196,150,0)");
        ctx.fillStyle = fbloom;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, 56, 0, Math.PI * 2);
        ctx.fill();

        var fhg = ctx.createRadialGradient(fb.x, fb.y, 0, fb.x, fb.y, 16);
        fhg.addColorStop(0, "rgba(255,255,255," + fo + ")");
        fhg.addColorStop(0.3, "rgba(255,250,240," + (fo * 0.9) + ")");
        fhg.addColorStop(0.7, "rgba(255,226,190," + (fo * 0.35) + ")");
        fhg.addColorStop(1, "rgba(255,200,150,0)");
        ctx.fillStyle = fhg;
        ctx.beginPath();
        ctx.arc(fb.x, fb.y, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 火流星落下后的余辉 */
      for (var gi = glows.length - 1; gi >= 0; gi--) {
        var gw = glows[gi];
        gw.life -= dt;
        if (gw.life <= 0) { glows.splice(gi, 1); continue; }
        var gk = gw.life / gw.maxLife;
        var ga = Math.pow(gk, 1.6);
        var rg2 = Math.max(w, h) * (0.32 + (1 - gk) * 0.3);
        var gg = ctx.createRadialGradient(gw.x, gw.y, 0, gw.x, gw.y, rg2);
        gg.addColorStop(0, "rgba(255,238,214," + (ga * 0.20) + ")");
        gg.addColorStop(0.4, "rgba(255,206,164," + (ga * 0.08) + ")");
        gg.addColorStop(1, "rgba(240,170,120,0)");
        ctx.fillStyle = gg;
        ctx.fillRect(0, 0, w, h);
      }

      /* 流星余晖：划过之后留在天上的淡痕 */
      for (var ti = trails.length - 1; ti >= 0; ti--) {
        var tr = trails[ti];
        tr.life -= dt;
        if (tr.life <= 0) { trails.splice(ti, 1); continue; }
        var tk = tr.life / tr.maxLife;
        var tg = ctx.createLinearGradient(tr.x, tr.y, tr.tx, tr.ty);
        if (tr.gold) {
          tg.addColorStop(0, "rgba(250,238,214," + (tk * 0.34) + ")");
          tg.addColorStop(1, "rgba(210,175,130,0)");
        } else {
          tg.addColorStop(0, "rgba(232,214,255," + (tk * 0.32) + ")");
          tg.addColorStop(1, "rgba(196,115,214,0)");
        }
        ctx.strokeStyle = tg;
        ctx.lineWidth = 1.1;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tr.x, tr.y);
        ctx.lineTo(tr.tx, tr.ty);
        ctx.stroke();
      }

      /* 点星的回响：一圈慢慢散开的光 */
      for (var ei = echoes.length - 1; ei >= 0; ei--) {
        var ec = echoes[ei];
        ec.life -= dt;
        if (ec.life <= 0) { echoes.splice(ei, 1); continue; }
        var ek = 1 - ec.life / ec.maxLife;
        var er = 4 + ek * 74;
        ctx.strokeStyle = "rgba(226,186,252," + ((1 - ek) * (1 - ek) * 0.7) + ")";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ec.x, ec.y, er, 0, Math.PI * 2);
        ctx.stroke();
        var fg = ctx.createRadialGradient(ec.x, ec.y, 0, ec.x, ec.y, 22);
        fg.addColorStop(0, "rgba(255,250,255," + ((1 - ek) * 0.9) + ")");
        fg.addColorStop(1, "rgba(200,150,240,0)");
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.arc(ec.x, ec.y, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 有小概率炸成一团星云，再慢慢散掉 */
      for (var ni = nebulas.length - 1; ni >= 0; ni--) {
        var nb = nebulas[ni];
        nb.life -= dt;
        if (nb.life <= 0) { nebulas.splice(ni, 1); continue; }
        var prog = 1 - nb.life / nb.maxLife;
        var nby = nb.y - scroll * 0.12;
        var nr = 26 + prog * 168;
        var na = Math.sin(Math.min(1, prog * 1.15) * Math.PI) * 0.55;
        var c1 = nb.hue === "teal" ? "96,206,226" : "200,124,252";
        var c2 = nb.hue === "teal" ? "110,86,214" : "146,78,228";
        var ng = ctx.createRadialGradient(nb.x, nby, 0, nb.x, nby, nr);
        ng.addColorStop(0, "rgba(" + c1 + "," + (na * 0.5) + ")");
        ng.addColorStop(0.45, "rgba(" + c2 + "," + (na * 0.26) + ")");
        ng.addColorStop(1, "rgba(" + c2 + ",0)");
        ctx.fillStyle = ng;
        ctx.beginPath();
        ctx.arc(nb.x, nby, nr, 0, Math.PI * 2);
        ctx.fill();
        for (var kk = 0; kk < 5; kk++) {
          var a2 = nb.seed + kk * 1.27;
          var r2 = nr * (0.32 + (kk % 3) * 0.18);
          ctx.fillStyle = "rgba(242,232,255," + (na * 0.9) + ")";
          ctx.fillRect(nb.x + Math.cos(a2) * r2, nby + Math.sin(a2) * r2, 1.5, 1.5);
        }
      }

      /* 背景自己长的星座：隔一会儿在空处冒一小簇，长满、停一会儿、再散掉。
         数量压得很低（最多两簇），比手点的慢，不抢戏。 */
      if (!reduceMotion) {
        if (!ambientNext) {
          ambientNext = time + 5200;
        } else if (time > ambientNext) {
          var ambientNow = 0;
          for (var ai = 0; ai < constellations.length; ai++) if (constellations[ai].ambient) ambientNow++;
          if (ambientNow < AMBIENT_MAX) {
            var ax = 0, ay = 0;
            for (var tries = 0; tries < 4; tries++) {
              ax = w * (0.06 + Math.random() * 0.88);
              ay = h * (0.1 + Math.random() * 0.76);
              /* 首屏别长在大标题上，绕着文字走 */
              if (window.scrollY > 720) break;
              if (!(ax > w * 0.07 && ax < w * 0.46 && ay < h * 0.56)) break;
            }
            spawnConstellation(ax, ay, true);
          }
          ambientNext = time + (9000 + Math.random() * 9000);
        }
      }

      /* 点出来的星座，长在背景星后面，像从星场里连出来的 */
      drawConstellations(time, scroll, warpPoint, shapeAlpha);

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduceMotion) {
          s.y += s.v * dt * 0.016 * s.d;
          if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
        }
        var y = s.y - scroll * 0.16 * s.d;
        y = ((y % (h + 8)) + h + 8) % (h + 8);
        var tw = 0.75 + 0.25 * Math.sin(time * 0.0006 + s.x);
        var sxw = s.x, syw = y, sFade = 1;
        var wp = warpPoint(sxw, syw);
        if (wp) {
          sxw = wp[0]; syw = wp[1];
          sFade = Math.max(0, 1 - wp[2] * 1.35);
          if (sFade <= 0.01) continue;
        }
        if (s.glow) {
          var sg = ctx.createRadialGradient(sxw, syw, 0, sxw, syw, s.r * 6);
          sg.addColorStop(0, "rgba(238,228,255," + (s.a * tw * 0.20 * sFade) + ")");
          sg.addColorStop(1, "rgba(200,150,240,0)");
          ctx.fillStyle = sg;
          ctx.beginPath();
          ctx.arc(sxw, syw, s.r * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = s.warm
          ? "rgba(230,198,242," + (s.a * tw * sFade) + ")"
          : "rgba(244,238,255," + (s.a * tw * sFade) + ")";
        ctx.arc(sxw, syw, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* 十字光芒星 */
      for (var xc = 0; xc < crosses.length; xc++) {
        var cr2 = crosses[xc];
        if (!reduceMotion) {
          cr2.y += cr2.v * dt * 0.016 * cr2.d;
          if (cr2.y > h + 10) { cr2.y = -10; cr2.x = Math.random() * w; }
        }
        var cwy = cr2.y - scroll * 0.16 * cr2.d;
        cwy = ((cwy % (h + 20)) + h + 20) % (h + 20) - 10;
        var cwx = cr2.x;
        var wcr = warpPoint(cwx, cwy);
        var crFade = 1;
        if (wcr) {
          cwx = wcr[0]; cwy = wcr[1];
          crFade = Math.max(0, 1 - wcr[2] * 1.35);
        }
        if (crFade <= 0.01) continue;

        var ctw = 0.45 + 0.55 * Math.sin(time * cr2.tw + cr2.ph);
        var ca2 = cr2.a * ctw * crFade;
        var col = cr2.warm ? "246,232,196" : "236,222,255";

        var armLen = cr2.r * (1.05 + 0.3 * ctw);

        // 由外到内三层光：很淡的大晕 → 紧一点的亮晕 → 光针
        var h1 = ctx.createRadialGradient(cwx, cwy, 0, cwx, cwy, cr2.r * 3.4);
        h1.addColorStop(0, "rgba(" + col + "," + (ca2 * 0.22) + ")");
        h1.addColorStop(0.32, "rgba(" + col + "," + (ca2 * 0.09) + ")");
        h1.addColorStop(1, "rgba(" + col + ",0)");
        ctx.fillStyle = h1;
        ctx.beginPath();
        ctx.arc(cwx, cwy, cr2.r * 3.4, 0, Math.PI * 2);
        ctx.fill();

        var h2 = ctx.createRadialGradient(cwx, cwy, 0, cwx, cwy, cr2.r * 1.15);
        h2.addColorStop(0, "rgba(255,253,250," + (ca2 * 0.5) + ")");
        h2.addColorStop(0.5, "rgba(" + col + "," + (ca2 * 0.16) + ")");
        h2.addColorStop(1, "rgba(" + col + ",0)");
        ctx.fillStyle = h2;
        ctx.beginPath();
        ctx.arc(cwx, cwy, cr2.r * 1.15, 0, Math.PI * 2);
        ctx.fill();

        // 主光芒：一条逐渐变细的针
        function spike(ax, ay, len, wid, alp) {
          var g = ctx.createLinearGradient(cwx - ax * len, cwy - ay * len, cwx + ax * len, cwy + ay * len);
          g.addColorStop(0, "rgba(" + col + ",0)");
          g.addColorStop(0.20, "rgba(" + col + "," + (alp * 0.26) + ")");
          g.addColorStop(0.36, "rgba(255,255,255," + (alp * 0.62) + ")");
          g.addColorStop(0.5, "rgba(255,255,255," + alp + ")");
          g.addColorStop(0.64, "rgba(255,255,255," + (alp * 0.62) + ")");
          g.addColorStop(0.80, "rgba(" + col + "," + (alp * 0.26) + ")");
          g.addColorStop(1, "rgba(" + col + ",0)");
          ctx.strokeStyle = g;
          ctx.lineWidth = wid;
          ctx.beginPath();
          ctx.moveTo(cwx - ax * len, cwy - ay * len);
          ctx.lineTo(cwx + ax * len, cwy + ay * len);
          ctx.stroke();
        }

        // 主轴（竖向/横向）粗一点短一点，斜向细一点长一点
        ctx.lineCap = "round";
        spike(0, 1, armLen * 0.95, Math.max(1.2, cr2.r * 0.13), ca2);
        spike(1, 0, armLen, Math.max(1.2, cr2.r * 0.13), ca2);
        spike(0.707, 0.707, armLen * 1.15, Math.max(0.7, cr2.r * 0.07), ca2 * 0.42);
        spike(0.707, -0.707, armLen * 1.15, Math.max(0.7, cr2.r * 0.07), ca2 * 0.42);

        // 核心：紧凑亮晕 + 实心白点
        var coreR = Math.max(1.15, cr2.r * 0.105);
        var coreG = ctx.createRadialGradient(cwx, cwy, 0, cwx, cwy, coreR * 3);
        coreG.addColorStop(0, "rgba(255,255,255," + Math.min(1, ca2 * 1.2) + ")");
        coreG.addColorStop(0.25, "rgba(255,252,246," + (ca2 * 0.75) + ")");
        coreG.addColorStop(1, "rgba(" + col + ",0)");
        ctx.fillStyle = coreG;
        ctx.beginPath();
        ctx.arc(cwx, cwy, coreR * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(255,255,255," + Math.min(1, ca2 * 1.25) + ")";
        ctx.beginPath();
        ctx.arc(cwx, cwy, coreR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      if (hole) drawHoleFx(time);
    }

    function loop(time) {
      if (!document.hidden) draw(time);
      raf = requestAnimationFrame(loop);
    }

    build();
    if (reduceMotion) { draw(0); return; }
    raf = requestAnimationFrame(loop);

    var t = null;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(build, 200);
    });

    /* 点一下天空：贴着最近的亮星长一簇星座；偶尔星云，极小概率黑洞 */
    function skyTap(mx, my) {
      var scroll = window.scrollY || 0;
      // 只有稍亮的这层（stars）可以被点，背景暗星只当纹理
      var best = null, bestD = 64 * 64, bestIdx = -1;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var sy = s.y - scroll * 0.16 * s.d;
        sy = ((sy % (h + 8)) + h + 8) % (h + 8);
        var dx = s.x - mx, dy = sy - my;
        var dd = dx * dx + dy * dy;
        if (dd < bestD) { bestD = dd; best = { x: s.x, y: sy }; bestIdx = i; }
      }

      // 点中近处的亮星就贴着它长，点到空处也无所谓，从指尖长
      var ax = best ? best.x : mx;
      var ay = best ? best.y : my;

      // 记录成「天空坐标」：绘制时再减掉滚动量，位置才对得上
      var skyY = ay + scroll * 0.12;

      // 极小概率：这一点把整片星空吸成黑洞，再炸开（只认星星）
      if (!hole && best && Math.random() < 0.015) {
        var rays = [];
        for (var rq = 0; rq < 30; rq++) {
          rays.push({
            ang: (rq / 30) * Math.PI * 2 + Math.random() * 0.2,
            ph: Math.random(),
            a: 0.45 + Math.random() * 0.55,
            w: 0.7 + Math.random() * 1.5
          });
        }
        hole = {
          x: ax, y: skyY, t0: performance.now(),
          fade: 1500, pull: 4200, hawk: 2300, boom: 2100,
          sy: ay, rays: rays
        };
        document.body.classList.add("is-sucked");
        document.documentElement.style.setProperty("--suck-x", ax + "px");
        document.documentElement.style.setProperty("--suck-y", (window.scrollY + ay) + "px");
        meteors.length = 0;
        sats.length = 0;
        comets.length = 0;
        trails.length = 0;
        echoes.length = 0;
        nebulas.length = 0;
        constellations.length = 0;
        fireballs.length = 0;
        glows.length = 0;
        shower.length = 0;
        showerState = null;
        if (bestIdx >= 0) stars.splice(bestIdx, 1);
        return;
      }

      echoes.push({ x: ax, y: ay, life: 1300, maxLife: 1300 });
      if (best && Math.random() < 0.24) {
        nebulas.push({
          x: ax, y: skyY,
          life: 4600 + Math.random() * 1800,
          maxLife: 6400,
          hue: Math.random() < 0.5 ? "teal" : "purple",
          seed: Math.random() * Math.PI * 2
        });
        // 这颗星化作星云，就从星场里拿掉
        if (bestIdx >= 0) stars.splice(bestIdx, 1);
      } else {
        // 其余时候，落点会长出一小簇星座，几秒后再散掉
        spawnConstellation(ax, ay);
      }
    }

    /* 鼠标：按下即生效；触摸：抬手且几乎没移动才算「点」，不然滚屏会一直长星座 */
    var touchStart = null;
    document.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      var target = e.target;
      if (target && target.closest && target.closest("a,button,input,textarea,label,select,#suyi-canvas,.shot,.card,.up,.tabs,.lightbox,.drawer,.skip,.burger,.anka")) return;
      if (e.pointerType === "touch" || e.pointerType === "pen") {
        touchStart = { x: e.clientX, y: e.clientY, t: performance.now() };
        return;
      }
      skyTap(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener("pointerup", function (e) {
      if (!touchStart) return;
      var st = touchStart;
      touchStart = null;
      if (Math.abs(e.clientX - st.x) + Math.abs(e.clientY - st.y) > 14) return;
      if (performance.now() - st.t > 900) return;
      skyTap(st.x, st.y);
    }, { passive: true });
    document.addEventListener("pointercancel", function () { touchStart = null; }, { passive: true });

    /* 首屏那个按钮：挑一片没压着字的夜空，长一个星座出来 */
    function pickSkySpot() {
      var pad = 92;
      var blocks = [];
      var text = document.querySelector(".hero__text");
      if (text) {
        var kids = text.querySelectorAll(".kicker,.hero__title,.hero__slogan,.hero__actions,.hero__make");
        for (var k = 0; k < kids.length; k++) {
          var r = kids[k].getBoundingClientRect();
          if (r.width && r.height) blocks.push({ l: r.left - pad, r: r.right + pad, t: r.top - pad, b: r.bottom + pad });
        }
      }
      function clear(x, y) {
        for (var i = 0; i < blocks.length; i++) {
          var q = blocks[i];
          if (x > q.l && x < q.r && y > q.t && y < q.b) return false;
        }
        return true;
      }
      var cands = [[0.84, 0.2], [0.87, 0.56], [0.76, 0.86], [0.4, 0.9], [0.55, 0.1], [0.18, 0.88], [0.92, 0.76], [0.66, 0.72]];
      var order = cands.slice(), best = null;
      for (var n = order.length - 1; n > 0; n--) {
        var j = Math.floor(Math.random() * (n + 1)), tmp = order[n];
        order[n] = order[j]; order[j] = tmp;
      }
      for (var c = 0; c < order.length; c++) {
        var px = w * order[c][0], py = h * order[c][1];
        if (px < 60 || px > w - 60 || py < 96 || py > h - 56) continue;
        if (clear(px, py)) { best = [px, py]; break; }
      }
      if (!best) best = [w * (0.3 + Math.random() * 0.5), h * (0.82 + Math.random() * 0.1)];
      return best;
    }
    var makeBtn = $("#makeConstellation");
    if (makeBtn) {
      makeBtn.addEventListener("click", function () {
        var spot = pickSkySpot();
        echoes.push({ x: spot[0], y: spot[1], life: 1300, maxLife: 1300 });
        spawnConstellation(spot[0], spot[1]);
      });
    }
  }

  /* ------------------------------------------------------ 5c. 标题周围的光点 */
  function initHeroDust() {
    var canvas = $("#heroDust");
    var host = $(".hero__grid");
    var text = $(".hero__title");
    if (!canvas || !host || !text || !canvas.getContext || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, cx = 0, cy = 0;
    var lastBox = null;
    var parts = [];
    var raf = null, last = 0;

    /* 预先做一张光点贴图，比每帧建渐变省得多 */
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = 48;
    (function () {
      var c = sprite.getContext("2d");
      var g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, "rgba(255,252,255,1)");
      g.addColorStop(0.22, "rgba(236,214,255,0.75)");
      g.addColorStop(0.55, "rgba(186,132,240,0.22)");
      g.addColorStop(1, "rgba(150,100,220,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 48, 48);
    })();

    function measure() {
      var r = host.getBoundingClientRect();
      var box = canvas.parentNode.getBoundingClientRect();
      // canvas 自身尺寸按 CSS 算，这里只记录像素尺寸
      var cw = canvas.getBoundingClientRect();
      w = Math.max(120, Math.round(cw.width));
      h = Math.max(120, Math.round(cw.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // h1 里的每行是 block，宽度撑满整列；只量「文字节点」的矩形，才能拿到字形的真实范围
      var L = Infinity, R = -Infinity, T = Infinity, B = -Infinity;
      var lines = text.querySelectorAll(".hero__line");
      for (var li = 0; li < lines.length; li++) {
        var tn = lines[li].firstChild;
        if (!tn || tn.nodeType !== 3) continue;
        var rng = document.createRange();
        rng.selectNodeContents(tn);
        var rects = rng.getClientRects();
        for (var ri = 0; ri < rects.length; ri++) {
          var b = rects[ri];
          if (b.width < 1 || b.height < 1) continue;
          if (b.left < L) L = b.left;
          if (b.right > R) R = b.right;
          if (b.top < T) T = b.top;
          if (b.bottom > B) B = b.bottom;
        }
      }
      if (isFinite(L) && R > L) {
        cx = (L + R) / 2 - cw.left;
        cy = (T + B) / 2 - cw.top;
      } else {
        var fb = text.getBoundingClientRect();
        cx = fb.left - cw.left + fb.width * 0.5;
        cy = fb.top - cw.top + fb.height * 0.5;
      }
    }

    function spawn() {
      parts = [];
      var n = 3;
      for (var i = 0; i < n; i++) {
        var base = 80 + Math.pow(Math.random(), 0.75) * 250;
        var dir = Math.random() < 0.5 ? 1 : -1;
        // 越近转得越快：一圈 2.2—4.2 秒
        var period = 2200 + base * 4.2 + Math.random() * 800;
        var spd = (Math.PI * 2) / period;
        parts.push({
          a: Math.random() * Math.PI * 2,
          v: spd * dir * (0.9 + Math.random() * 0.25),
          rx: base * (0.8 + Math.random() * 0.45),
          ry: base * (0.52 + Math.random() * 0.55),
          tilt: (Math.random() - 0.5) * 1.0,
          size: 0.7 + Math.random() * 1.8,
          bright: 0.30 + Math.random() * 0.55,
          ph: Math.random() * Math.PI * 2,
          wob: 0.03 + Math.random() * 0.07,
          tw: 0.0007 + Math.random() * 0.0012
        });
      }
    }

    function draw(time) {
      var dt = last ? Math.min(64, time - last) : 16;
      last = time;
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.a += p.v * dt;
        var tw = 0.55 + 0.45 * Math.sin(time * p.tw + p.ph);
        var a = p.bright * tw;

        function at(ang) {
          var breathe = 1 + Math.sin(time * 0.00065 + p.ph) * p.wob;
          var ex = Math.cos(ang) * p.rx * breathe;
          var ey = Math.sin(ang) * p.ry * breathe;
          var ca = Math.cos(p.tilt), sa = Math.sin(p.tilt);
          return [cx + ex * ca - ey * sa, cy + ex * sa + ey * ca];
        }

        var head = at(p.a);
        if (head[0] < -40 || head[0] > w + 40 || head[1] < -40 || head[1] > h + 40) continue;

        // 拖尾：沿"来路"取样（注意方向，尾巴永远在身后）
        var span = Math.abs(p.v) * 340;
        var sgn = p.v < 0 ? 1 : -1;
        var tail = at(p.a + sgn * span);
        ctx.beginPath();
        ctx.moveTo(tail[0], tail[1]);
        for (var k = 1; k <= 6; k++) {
          var q = at(p.a + sgn * span * (1 - k / 6));
          ctx.lineTo(q[0], q[1]);
        }
        var grd = ctx.createLinearGradient(tail[0], tail[1], head[0], head[1]);
        grd.addColorStop(0, "rgba(186,132,240,0)");
        grd.addColorStop(0.55, "rgba(212,168,250," + (a * 0.32) + ")");
        grd.addColorStop(1, "rgba(250,242,255," + (a * 0.85) + ")");
        ctx.strokeStyle = grd;
        ctx.lineWidth = Math.max(0.7, p.size * 0.85);
        ctx.lineCap = "round";
        ctx.stroke();

        var s = p.size * (6 + tw * 3);
        ctx.globalAlpha = Math.max(0, Math.min(1, a));
        ctx.drawImage(sprite, head[0] - s / 2, head[1] - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    }

    function loop(time) {
      if (!document.hidden) draw(time);
      raf = requestAnimationFrame(loop);
    }

    measure();
    spawn();
    raf = requestAnimationFrame(loop);

    setTimeout(measure, 900);
    setTimeout(measure, 1800);
    text.addEventListener("transitionend", measure);

    var rt = null;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { measure(); spawn(); }, 200);
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          if (!raf) raf = requestAnimationFrame(loop);
        } else if (raf) {
          cancelAnimationFrame(raf);
          raf = null;
        }
      }, { threshold: 0 }).observe(host);
    }
  }

  /* ------------------------------------------------------ 5c. 首屏视差 */
  function initHeroParallax() {
    var hero = $(".hero");
    var grid = $(".hero__grid");
    var foot = $(".hero__foot");
    if (!hero || !grid || reduceMotion) return;

    var ticking = false;
    function update() {
      var hh = hero.offsetHeight || window.innerHeight;
      var y = Math.min(window.scrollY || 0, hh);
      var p = y / hh;
      grid.style.transform = "translate3d(0," + (y * 0.16).toFixed(1) + "px,0)";
      grid.style.opacity = Math.max(0, 1 - p * 1.3).toFixed(3);
      if (foot) foot.style.opacity = Math.max(0, 1 - p * 2).toFixed(3);
    }
    update();
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
  }

  /* ------------------------------------------------------ 5d. 数字滚动 */
  function initCounters() {
    var items = $$(".stats b");
    if (!items.length) return;

    function run(el) {
      var node = el.firstChild;
      if (!node || node.nodeType !== 3) return;
      var target = parseInt(el.textContent, 10);
      if (!target || target > 1900 || reduceMotion) return;

      var start = null;
      var dur = 1100;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        node.nodeValue = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(step);
        else node.nodeValue = String(target);
      }
      node.nodeValue = "0";
      requestAnimationFrame(step);
    }

    if (!("IntersectionObserver" in window)) { items.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------ 5e. 活动详情抽屉 */
  function initActivities() {
    var drawer = $("#drawer");
    var panel = $("#drawerPanel");
    var closeBtn = $("#drawerClose");
    var elWhen = $("#drawerWhen");
    var elTitle = $("#drawerTitle");
    var elText = $("#drawerText");
    var elMore = $("#drawerMore");
    var elPhotos = $("#drawerPhotos");
    var cards = $$(".cards .card");
    if (!drawer || !cards.length) return;

    var keys = ["festival", "sidewalk", "meteor", "xinglong", "talks", "outreach"];
    var details = (window.NKAA && window.NKAA.details) || {};
    var lastCard = null;

    function open(card, key) {
      var d = details[key];
      if (!d) return;
      lastCard = card;

      var title = $("h3", card);
      var tag = $(".card__tag", card);
      elTitle.textContent = title ? title.textContent : "";
      elWhen.textContent = tag ? tag.textContent : "";
      elText.textContent = d.detail || "";
      elMore.textContent = d.more || "";

      elPhotos.innerHTML = (d.photos || []).map(function (src) {
        return '<img src="' + src + '" alt="" loading="lazy">';
      }).join("");

      drawer.hidden = false;
      requestAnimationFrame(function () { drawer.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      drawer.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () { drawer.hidden = true; }, 380);
      if (lastCard && lastCard.focus) lastCard.focus();
    }

    cards.forEach(function (card, i) {
      var key = keys[i];
      card.setAttribute("data-act", key);
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("aria-haspopup", "dialog");
      card.addEventListener("click", function () { open(card, key); });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(card, key); }
      });
    });

    if (closeBtn) closeBtn.addEventListener("click", close);
    var cta = $(".drawer__cta", drawer);
    if (cta) cta.addEventListener("click", close);
    drawer.addEventListener("click", function (e) {
      if (panel && !panel.contains(e.target)) close();
    });
    document.addEventListener("keydown", function (e) {
      if (!drawer.hidden && e.key === "Escape") close();
    });
  }

  /* ------------------------------------------------------ 5f. 点击涟漪 */
  function initRipple() {
    if (reduceMotion) return;

    document.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      var el = document.createElement("span");
      el.className = "ripple";
      el.style.left = e.clientX + "px";
      el.style.top = e.clientY + "px";
      document.body.appendChild(el);
      window.setTimeout(function () {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 700);
    }, { passive: true });
  }

  /* ----------------------------------------------------- 6a. 鼠标小光圈 */
  function initCursorRing() {
    var el = $("#cursorRing");
    if (!el || reduceMotion) return;
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, on = false, raf = null;

    function frame() {
      cx += (tx - cx) * 0.24;
      cy += (ty - cy) * 0.24;
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!on) {
        on = true;
        cx = tx; cy = ty;
        el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        el.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(frame);
      }
      var t = e.target;
      var hot = !!(t && t.closest && t.closest("a,button,[role=button],.card,.shot,.chips__chip,.tabs__tab,.tabs__tab,input,textarea,select,.up,.nav-mod,.navs a"));
      el.classList.toggle("is-hot", hot);
    }, { passive: true });

    function hide() {
      on = false;
      el.classList.remove("is-on");
      el.classList.remove("is-hot");
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    document.addEventListener("pointerleave", hide);
    document.addEventListener("mouseleave", hide);
  }

  /* -------------------------------------------------------- 6. 鼠标光晕 */
  function initGlow() {
    var el = $("#cursorGlow");
    if (!el || reduceMotion) return;
    if (window.matchMedia && window.matchMedia("(hover: none)").matches) return;

    var tx = window.innerWidth / 2, ty = window.innerHeight / 3;
    var cx = tx, cy = ty;
    var raf = null;

    function frame() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      el.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
      raf = requestAnimationFrame(frame);
    }

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!el.classList.contains("is-on")) {
        cx = tx;
        cy = ty;
        el.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
        el.classList.add("is-on");
        if (!raf) raf = requestAnimationFrame(frame);
      }
    }, { passive: true });

    function hide() {
      el.classList.remove("is-on");
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
    document.addEventListener("pointerleave", hide);
    document.addEventListener("mouseleave", hide);
  }

  /* ------------------------------------------------------ 6b. 导航标签页 */
  function initNavTabs() {
    var root = $("#navTabs");
    if (!root) return;

    var tabs = $$(".tabs__tab", root);
    var panels = $$(".tabs__panel", root);
    if (!tabs.length || tabs.length !== panels.length) return;

    function select(index, focus) {
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.classList.toggle("is-active", on);
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
        panels[i].classList.toggle("is-active", on);
      });
      if (focus && tabs[index]) tabs[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (ev) {
        var k = ev.key;
        if (k !== "ArrowRight" && k !== "ArrowLeft" && k !== "Home" && k !== "End") return;
        ev.preventDefault();
        var next = k === "ArrowRight" ? (i + 1) % tabs.length
          : k === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length
          : k === "Home" ? 0 : tabs.length - 1;
        select(next, true);
      });
    });

    select(0);
  }

  /* ---------------------------------------------------------- 7. 本月星空 */
  function initSkyNote() {
    var card = $("#skyNote");
    var data = window.NKAA && window.NKAA.skyNotes;
    if (!card || !data) return;

    var month = new Date().getMonth() + 1;
    var note = data[month];
    if (!note) return;

    var title = $("h4", card);
    var text = $("p", card);
    var when = $(".side__when", card);
    if (title) title.textContent = note[0];
    if (text) text.textContent = note[1];
    if (when) when.textContent = month + " 月";
  }

  /* -------------------------------------------------------------- 启动 */
  function boot() {
    var y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
    // 把系统的「减少动效」偏好交给样式层和轨道模拟器
    if (reduceMotion) document.body.classList.add("no-motion");

    renderGallery();
    renderJourney();
    renderUpcoming();

    initNav();
    initReveal();
    initGlow();
    initCursorRing();
    initSkyNote();
    initNavTabs();
    initLightbox();
    initSky();
    initSkyField();
    initHeroParallax();
    initHeroDust();
    initCounters();
    initActivities();
    initRipple();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
